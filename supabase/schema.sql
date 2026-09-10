-- ==============================================================================
-- SISTEMA INTEGRAL DE GESTIÓN DE OBRAS E INVERSIONES (SIGO - HIBA)
-- Esquema Supabase PostgreSQL con Control de Vencimientos, Roles y Trazabilidad
-- ==============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMERACIONES
DO $$ BEGIN
    CREATE TYPE tipo_proyecto_enum AS ENUM ('obra_civil', 'infraestructura', 'tecnologia_medica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_obra_enum AS ENUM (
        'factibilidad', 
        'anteproyecto', 
        'proyecto', 
        'proyecto_licitar', 
        'licitacion', 
        'en_curso', 
        'finalizada', 
        'suspendida',
        'asignacion_partida'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rol_usuario_enum AS ENUM (
        'admin', 
        'pm_obra', 
        'direccion_medica', 
        'licitaciones', 
        'control_gestion', 
        'auditor'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE semaforo_alerta_enum AS ENUM (
        'en_plazo', 
        'por_vencer', 
        'vencido', 
        'finalizado', 
        'suspendido'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLA: SEDES
CREATE TABLE IF NOT EXISTS sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    codigo TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: PERFILES DE USUARIOS (Vinculado a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS perfiles_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    rol rol_usuario_enum DEFAULT 'pm_obra',
    sede_id UUID REFERENCES sedes(id),
    telefono TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA MAESTRA: PROYECTOS_OBRAS
CREATE TABLE IF NOT EXISTS proyectos_obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_interno TEXT UNIQUE NOT NULL,
    tipo tipo_proyecto_enum NOT NULL DEFAULT 'obra_civil',
    partida TEXT,
    nombre TEXT NOT NULL,
    sede_id UUID REFERENCES sedes(id),
    sede_nombre TEXT NOT NULL DEFAULT 'Almagro',
    estado estado_obra_enum NOT NULL DEFAULT 'factibilidad',
    
    -- Aspectos económicos
    monto_obra_usd NUMERIC(15,2) DEFAULT 0.00,
    monto_equipamiento_usd NUMERIC(15,2) DEFAULT 0.00,
    monto_total_usd NUMERIC(15,2) GENERATED ALWAYS AS (COALESCE(monto_obra_usd, 0) + COALESCE(monto_equipamiento_usd, 0)) STORED,
    superficie_m2 NUMERIC(10,2) DEFAULT 0.00,
    costo_usd_m2 NUMERIC(10,2) DEFAULT 0.00,
    
    -- Priorización (1.0 a 5.0)
    prioridad_tecnica NUMERIC(3,1) DEFAULT 1.0,
    prioridad_medica NUMERIC(3,1) DEFAULT 1.0,
    prioridad_final NUMERIC(3,1) DEFAULT 1.0,
    
    -- Actores y asignación
    proveedor TEXT,
    responsable TEXT DEFAULT 'Sin Asignar',
    responsable_id UUID REFERENCES perfiles_usuarios(id),
    
    -- Clasificación
    clasificacion TEXT,
    categoria TEXT DEFAULT 'Obra Civil',
    motivo TEXT,
    observaciones TEXT,
    
    -- Cronograma y Semáforo de Vencimiento
    fecha_inicio_etapa DATE,
    fecha_fin_etapa DATE,       -- Límite estimado para completar la etapa actual
    fecha_inicio_obra DATE,
    fecha_fin_obra DATE,         -- Límite estimado para finalización total
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 5. TABLA: CRITERIOS TÉCNICOS (Evaluación ponderada)
CREATE TABLE IF NOT EXISTS criterios_tecnicos (
    obra_id UUID PRIMARY KEY REFERENCES proyectos_obras(id) ON DELETE CASCADE,
    cumplimiento_normativo NUMERIC(3,1) DEFAULT 0,
    seguridad_estructural NUMERIC(3,1) DEFAULT 0,
    funcionalidad_flujos NUMERIC(3,1) DEFAULT 0,
    infraestructura_obsoleta NUMERIC(3,1) DEFAULT 0,
    impacto_produccion NUMERIC(3,1) DEFAULT 0,
    criterio_tec_final NUMERIC(3,1) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: CASHFLOW ANUAL
CREATE TABLE IF NOT EXISTS obra_cashflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES proyectos_obras(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL,
    monto_proyectado_usd NUMERIC(15,2) DEFAULT 0.00,
    monto_ejecutado_usd NUMERIC(15,2) DEFAULT 0.00,
    UNIQUE(obra_id, anio)
);

-- 7. TABLA DE TRAZABILIDAD Y AUDITORÍA: HISTORIAL DE CAMBIOS DE ESTADO
CREATE TABLE IF NOT EXISTS obra_historial_estados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES proyectos_obras(id) ON DELETE CASCADE,
    estado_anterior estado_obra_enum,
    estado_nuevo estado_obra_enum NOT NULL,
    usuario_id UUID REFERENCES auth.users(id),
    usuario_nombre TEXT,
    fecha_cambio TIMESTAMPTZ DEFAULT NOW(),
    fecha_inicio_etapa DATE,
    fecha_fin_etapa DATE,
    motivo TEXT,
    observaciones TEXT
);

-- ==============================================================================
-- VISTA DINÁMICA CON CÁLCULO DE SEMÁFORO DE VENCIMIENTOS
-- ==============================================================================
CREATE OR REPLACE VIEW vw_obras_dashboard AS
SELECT 
    p.*,
    CASE 
        WHEN p.estado = 'finalizada' THEN 'finalizado'::semaforo_alerta_enum
        WHEN p.estado = 'suspendida' THEN 'suspendido'::semaforo_alerta_enum
        WHEN p.fecha_fin_etapa IS NOT NULL AND p.fecha_fin_etapa < CURRENT_DATE THEN 'vencido'::semaforo_alerta_enum
        WHEN p.fecha_fin_etapa IS NOT NULL AND p.fecha_fin_etapa <= (CURRENT_DATE + INTERVAL '30 days') THEN 'por_vencer'::semaforo_alerta_enum
        ELSE 'en_plazo'::semaforo_alerta_enum
    END AS semaforo_alerta,
    CASE 
        WHEN p.fecha_fin_etapa IS NOT NULL THEN (p.fecha_fin_etapa - CURRENT_DATE)
        ELSE NULL 
    END AS dias_restantes
FROM proyectos_obras p;

-- ==============================================================================
-- TRIGGERS PARA AUDITORÍA Y AUTOMATIZACIÓN
-- ==============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proyectos_obras_updated_at ON proyectos_obras;
CREATE TRIGGER trg_proyectos_obras_updated_at
    BEFORE UPDATE ON proyectos_obras
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- Función para registrar historial de cambio de estado
CREATE OR REPLACE FUNCTION fn_audit_estado_obra()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.estado IS DISTINCT FROM NEW.estado) THEN
        INSERT INTO obra_historial_estados (
            obra_id,
            estado_anterior,
            estado_nuevo,
            usuario_id,
            usuario_nombre,
            fecha_inicio_etapa,
            fecha_fin_etapa,
            observaciones
        ) VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.estado END,
            NEW.estado,
            NEW.created_by,
            COALESCE(NEW.responsable, 'Sistema'),
            NEW.fecha_inicio_etapa,
            NEW.fecha_fin_etapa,
            NEW.observaciones
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_estado_obra ON proyectos_obras;
CREATE TRIGGER trg_audit_estado_obra
    AFTER INSERT OR UPDATE ON proyectos_obras
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_estado_obra();

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD POR FILAS (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_historial_estados ENABLE ROW LEVEL SECURITY;

-- Lectura pública o autenticada para sedes
CREATE POLICY "Permitir lectura de sedes a usuarios autenticados y anon" 
    ON sedes FOR SELECT USING (true);

-- Proyectos Obras: Lectura para usuarios autenticados y anónimos (o según rol)
CREATE POLICY "Lectura de obras a todos los usuarios autenticados" 
    ON proyectos_obras FOR SELECT USING (true);

CREATE POLICY "Inserción de obras a usuarios autenticados" 
    ON proyectos_obras FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Actualización de obras a usuarios autenticados" 
    ON proyectos_obras FOR UPDATE USING (auth.role() = 'authenticated');

-- Historial: Lectura para todos, inserción controlada
CREATE POLICY "Lectura historial a usuarios autenticados" 
    ON obra_historial_estados FOR SELECT USING (true);

CREATE POLICY "Insercion historial a usuarios autenticados" 
    ON obra_historial_estados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
