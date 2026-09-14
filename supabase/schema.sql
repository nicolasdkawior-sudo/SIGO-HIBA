-- ==============================================================================
-- SISTEMA INTEGRAL DE GESTIÓN DE OBRAS E INVERSIONES (SIGO - HIBA)
-- Esquema Supabase PostgreSQL con Control de Vencimientos, Roles y Trazabilidad
-- Sedes: Central, San Justo, Periféricos | Autenticación Google OAuth (Gmail)
-- ==============================================================================

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
        'visualizador'
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

-- 2. TABLA: SEDES (Central, San Justo, Periféricos)
CREATE TABLE IF NOT EXISTS sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    codigo TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: PERFILES DE USUARIOS (Vinculado a auth.users de Supabase / Google OAuth)
CREATE TABLE IF NOT EXISTS perfiles_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    rol rol_usuario_enum DEFAULT 'pm_obra',
    sede_asignada TEXT NOT NULL DEFAULT 'Todas', -- 'Central', 'San Justo', 'Periféricos', 'Todas'
    sede_id UUID REFERENCES sedes(id),
    
    -- Permisos granulares
    puede_crear_obras BOOLEAN DEFAULT true,
    puede_avanzar_etapas BOOLEAN DEFAULT true,
    puede_priorizar_medica BOOLEAN DEFAULT false,
    solo_lectura BOOLEAN DEFAULT false,
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
    sede_nombre TEXT NOT NULL DEFAULT 'Central', -- 'Central', 'San Justo', 'Periféricos'
    estado estado_obra_enum NOT NULL DEFAULT 'factibilidad',
    
    -- Aspectos económicos
    monto_obra_usd NUMERIC(15,2) DEFAULT 0.00,
    monto_equipamiento_usd NUMERIC(15,2) DEFAULT 0.00,
    monto_total_usd NUMERIC(15,2) GENERATED ALWAYS AS (COALESCE(monto_obra_usd, 0) + COALESCE(monto_equipamiento_usd, 0)) STORED,
    superficie_m2 NUMERIC(10,2) DEFAULT 0.00,
    costo_usd_m2 NUMERIC(10,2) DEFAULT 0.00,
    
    -- Priorización (1.0 a 5.0)
    prioridad_tecnica NUMERIC(3,1) DEFAULT 1.0,
    prioridad_medica NUMERIC(3,1) DEFAULT NULL, -- NULL indica pendiente de revisión médica
    prioridad_final NUMERIC(3,1) DEFAULT 1.0,
    prioridad_medica_asignada_por UUID REFERENCES perfiles_usuarios(id),
    prioridad_medica_fecha TIMESTAMPTZ,
    
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
    fecha_inicio_etapa DATE DEFAULT CURRENT_DATE,
    fecha_fin_etapa DATE,       -- Límite estimado para completar la etapa actual
    fecha_fin_obra DATE,         -- Límite estimado para finalización total
    fecha_real_finalizada DATE,
    
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
    END AS dias_restantes,
    CASE 
        WHEN p.prioridad_medica IS NULL OR p.prioridad_medica = 0 THEN true 
        ELSE false 
    END AS pendiente_prioridad_medica
FROM proyectos_obras p;

-- ==============================================================================
-- TRIGGERS PARA AUDITORÍA Y AUTOMATIZACIÓN
-- ==============================================================================
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
-- Blindaje estricto: Acceso anónimo denegado, aislamiento departamental y auditoría
-- ==============================================================================

-- 1. Habilitación forzada de RLS en todas las tablas
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_historial_estados ENABLE ROW LEVEL SECURITY;

-- 2. Revocar privilegios públicos por defecto al rol anónimo (Anti-Data Leaks)
REVOKE ALL ON perfiles_usuarios FROM anon;
REVOKE ALL ON proyectos_obras FROM anon;
REVOKE ALL ON criterios_tecnicos FROM anon;
REVOKE ALL ON obra_cashflow FROM anon;
REVOKE ALL ON obra_historial_estados FROM anon;

-- Otorgar privilegios operativos exclusivamente al rol autenticado
GRANT SELECT ON sedes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON perfiles_usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proyectos_obras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON criterios_tecnicos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON obra_cashflow TO authenticated;
GRANT SELECT, INSERT ON obra_historial_estados TO authenticated;

-- 3. Funciones auxiliares de seguridad (SECURITY DEFINER para prevenir recursión)
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT rol::TEXT FROM perfiles_usuarios WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_direccion()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((SELECT rol IN ('admin', 'direccion_medica') FROM perfiles_usuarios WHERE id = auth.uid() LIMIT 1), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_sede()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE((SELECT sede_asignada FROM perfiles_usuarios WHERE id = auth.uid() LIMIT 1), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Políticas para SEDES
DROP POLICY IF EXISTS "Lectura sedes pública y autenticada" ON sedes;
CREATE POLICY "Lectura sedes para todos" 
    ON sedes FOR SELECT USING (true);

CREATE POLICY "Modificación sedes solo admin" 
    ON sedes FOR ALL 
    USING (auth.role() = 'authenticated' AND is_admin_or_direccion());

-- 5. Políticas para PERFILES_USUARIOS (Proteger emails y datos personales)
DROP POLICY IF EXISTS "Lectura perfil propio o admin" ON perfiles_usuarios;
CREATE POLICY "Lectura perfil propio o admin" 
    ON perfiles_usuarios FOR SELECT 
    USING (
        auth.role() = 'authenticated' AND (
            id = auth.uid() OR is_admin_or_direccion()
        )
    );

DROP POLICY IF EXISTS "Actualizacion perfil propio o admin" ON perfiles_usuarios;
CREATE POLICY "Actualizacion perfil propio o admin" 
    ON perfiles_usuarios FOR UPDATE 
    USING (
        auth.role() = 'authenticated' AND (
            id = auth.uid() OR is_admin_or_direccion()
        )
    );

DROP POLICY IF EXISTS "Creacion y eliminacion usuarios solo admin" ON perfiles_usuarios;
CREATE POLICY "Creacion y eliminacion usuarios solo admin" 
    ON perfiles_usuarios FOR ALL 
    USING (auth.role() = 'authenticated' AND is_admin_or_direccion());

-- Vista de directorio seguro para listar responsables sin exponer correos ni metadatos privados
CREATE OR REPLACE VIEW vw_directorio_profesionales AS
SELECT id, nombre, email, rol, sede_asignada, activo
FROM perfiles_usuarios
WHERE activo = true;

GRANT SELECT ON vw_directorio_profesionales TO authenticated;

-- 6. Políticas para PROYECTOS_OBRAS (Aislamiento por Sede y Responsable)
DROP POLICY IF EXISTS "Lectura obras a usuarios autenticados y anónimos" ON proyectos_obras;
DROP POLICY IF EXISTS "Lectura obras autenticadas con aislamiento" ON proyectos_obras;
CREATE POLICY "Lectura obras autenticadas con aislamiento" 
    ON proyectos_obras FOR SELECT 
    USING (
        auth.role() = 'authenticated' AND (
            is_admin_or_direccion() 
            OR auth_user_sede() = 'Todas' 
            OR auth_user_sede() = proyectos_obras.sede_nombre
            OR proyectos_obras.responsable_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Insercion obras segun permisos y sede" ON proyectos_obras;
CREATE POLICY "Insercion obras segun permisos y sede" 
    ON proyectos_obras FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            is_admin_or_direccion() 
            OR (
                (auth_user_sede() = 'Todas' OR auth_user_sede() = proyectos_obras.sede_nombre)
                AND (SELECT puede_crear_obras FROM perfiles_usuarios WHERE id = auth.uid()) = true
            )
        )
    );

DROP POLICY IF EXISTS "Edicion obras segun responsabilidad y etapa" ON proyectos_obras;
CREATE POLICY "Edicion obras segun responsabilidad y etapa" 
    ON proyectos_obras FOR UPDATE 
    USING (
        auth.role() = 'authenticated' AND (
            is_admin_or_direccion()
            OR (
                proyectos_obras.responsable_id = auth.uid()
                AND (SELECT puede_avanzar_etapas FROM perfiles_usuarios WHERE id = auth.uid()) = true
            )
        )
    );

DROP POLICY IF EXISTS "Eliminacion obras solo admin" ON proyectos_obras;
CREATE POLICY "Eliminacion obras solo admin" 
    ON proyectos_obras FOR DELETE 
    USING (auth.role() = 'authenticated' AND is_admin_or_direccion());

-- 7. Políticas para CRITERIOS_TÉCNICOS, CASHFLOW E HISTORIAL (Heredan de la Obra)
CREATE POLICY "Lectura criterios vinculados a obras visibles" 
    ON criterios_tecnicos FOR SELECT 
    USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM proyectos_obras p WHERE p.id = criterios_tecnicos.obra_id));

CREATE POLICY "Modificacion criterios solo responsable o admin" 
    ON criterios_tecnicos FOR ALL 
    USING (auth.role() = 'authenticated' AND (is_admin_or_direccion() OR EXISTS (SELECT 1 FROM proyectos_obras p WHERE p.id = criterios_tecnicos.obra_id AND p.responsable_id = auth.uid())));

CREATE POLICY "Lectura cashflow vinculada a obras visibles" 
    ON obra_cashflow FOR SELECT 
    USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM proyectos_obras p WHERE p.id = obra_cashflow.obra_id));

CREATE POLICY "Modificacion cashflow solo admin" 
    ON obra_cashflow FOR ALL 
    USING (auth.role() = 'authenticated' AND is_admin_or_direccion());

CREATE POLICY "Lectura historial de estados vinculada a obras visibles" 
    ON obra_historial_estados FOR SELECT 
    USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM proyectos_obras p WHERE p.id = obra_historial_estados.obra_id));

CREATE POLICY "Insercion de historial de estados para usuarios autenticados" 
    ON obra_historial_estados FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
-- Fin de políticas RLS de seguridad robusta
