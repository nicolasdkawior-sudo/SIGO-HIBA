-- ==============================================================================
-- SIGO HIBA - SCRIPT DE FORTALECIMIENTO DE SEGURIDAD (SECURITY HARDENING RLS)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Objetivo: Cerrar acceso anónimo, blindar tablas con RLS y evitar fugas de datos
-- ==============================================================================

-- 1. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS) OBLIGATORIO
ALTER TABLE IF EXISTS sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proyectos_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS criterios_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS obra_cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS obra_historial_estados ENABLE ROW LEVEL SECURITY;

-- 2. REVOCAR PERMISOS AL ROL ANÓNIMO (ANTI-HACKS / ANTI-LEAKS)
-- Previene que cualquier persona con la anon-key extraída del frontend consulte datos sin autenticarse
REVOKE ALL ON perfiles_usuarios FROM anon;
REVOKE ALL ON proyectos_obras FROM anon;
REVOKE ALL ON criterios_tecnicos FROM anon;
REVOKE ALL ON obra_cashflow FROM anon;
REVOKE ALL ON obra_historial_estados FROM anon;

-- Solo lectura pública de sedes para renderizar selectores
GRANT SELECT ON sedes TO anon, authenticated;

-- Permisos operativos limitados para usuarios que hayan iniciado sesión vía Supabase Auth
GRANT SELECT, INSERT, UPDATE, DELETE ON perfiles_usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proyectos_obras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON criterios_tecnicos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON obra_cashflow TO authenticated;
GRANT SELECT, INSERT ON obra_historial_estados TO authenticated;

-- 3. FUNCIONES DE VALIDACIÓN DE ROL Y SEDE (SECURITY DEFINER)
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

-- 4. ELIMINACIÓN DE POLÍTICAS PREVIAS INSEGURAS
DROP POLICY IF EXISTS "Lectura sedes pública y autenticada" ON sedes;
DROP POLICY IF EXISTS "Lectura sedes para todos" ON sedes;
DROP POLICY IF EXISTS "Modificación sedes solo admin" ON sedes;

DROP POLICY IF EXISTS "Lectura perfil propio o admin" ON perfiles_usuarios;
DROP POLICY IF EXISTS "Actualizacion perfil propio o admin" ON perfiles_usuarios;
DROP POLICY IF EXISTS "Creacion y eliminacion usuarios solo admin" ON perfiles_usuarios;

DROP POLICY IF EXISTS "Lectura obras a usuarios autenticados y anónimos" ON proyectos_obras;
DROP POLICY IF EXISTS "Lectura obras autenticadas con aislamiento" ON proyectos_obras;
DROP POLICY IF EXISTS "Insercion obras segun permisos y sede" ON proyectos_obras;
DROP POLICY IF EXISTS "Inserción y edición según sede de usuario" ON proyectos_obras;
DROP POLICY IF EXISTS "Edicion obras segun responsabilidad y etapa" ON proyectos_obras;
DROP POLICY IF EXISTS "Eliminacion obras solo admin" ON proyectos_obras;

DROP POLICY IF EXISTS "Lectura criterios vinculados a obras visibles" ON criterios_tecnicos;
DROP POLICY IF EXISTS "Modificacion criterios solo responsable o admin" ON criterios_tecnicos;
DROP POLICY IF EXISTS "Lectura cashflow vinculada a obras visibles" ON obra_cashflow;
DROP POLICY IF EXISTS "Modificacion cashflow solo admin" ON obra_cashflow;
DROP POLICY IF EXISTS "Lectura historial de estados vinculada a obras visibles" ON obra_historial_estados;
DROP POLICY IF EXISTS "Insercion de historial de estados para usuarios autenticados" ON obra_historial_estados;

-- 5. APLICACIÓN DE NUEVAS POLÍTICAS BLINDADAS

-- TABLA: SEDES
CREATE POLICY "Lectura sedes para todos" 
    ON sedes FOR SELECT USING (true);

CREATE POLICY "Modificación sedes solo admin" 
    ON sedes FOR ALL 
    USING (auth.role() = 'authenticated' AND is_admin_or_direccion());

-- TABLA: PERFILES_USUARIOS (Cada usuario solo lee y actualiza su propio perfil; admin gestiona todos)
CREATE POLICY "Lectura perfil propio o admin" 
    ON perfiles_usuarios FOR SELECT 
    USING (
        auth.role() = 'authenticated' AND (
            id = auth.uid() OR is_admin_or_direccion()
        )
    );

CREATE POLICY "Actualizacion perfil propio o admin" 
    ON perfiles_usuarios FOR UPDATE 
    USING (
        auth.role() = 'authenticated' AND (
            id = auth.uid() OR is_admin_or_direccion()
        )
    );

CREATE POLICY "Creacion y eliminacion usuarios solo admin" 
    ON perfiles_usuarios FOR ALL 
    USING (auth.role() = 'authenticated' AND is_admin_or_direccion());

-- Vista para poblar selectores de responsables de forma segura sin exponer hashes ni datos privados
CREATE OR REPLACE VIEW vw_directorio_profesionales AS
SELECT id, nombre, email, rol, sede_asignada, activo
FROM perfiles_usuarios
WHERE activo = true;

GRANT SELECT ON vw_directorio_profesionales TO authenticated;

-- TABLA: PROYECTOS_OBRAS (Aislamiento departamental estricto y por sede)
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

CREATE POLICY "Eliminacion obras solo admin" 
    ON proyectos_obras FOR DELETE 
    USING (auth.role() = 'authenticated' AND is_admin_or_direccion());

-- TABLAS HIJAS: CRITERIOS_TECNICOS, CASHFLOW E HISTORIAL (Heredan de proyectos_obras)
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

-- Fin del script de hardening de seguridad RLS
