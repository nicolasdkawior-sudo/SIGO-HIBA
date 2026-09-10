-- ==========================================================
-- SEED DATA: Obras e Inversiones HIBA
-- ==========================================================

-- 1. SEDES

INSERT INTO sedes (nombre, codigo) VALUES 
('Almagro', 'ALM'),
('San Justo', 'SJU'),
('Periférico', 'PER')
ON CONFLICT (nombre) DO NOTHING;


-- 2. PROYECTOS Y OBRAS
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-001', 'obra_civil', '6060826', 'Burbuja Agua Raggio (Legionella)', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto_licitar',
    800000.0, 0, 500.0, 1600.0,
    4.0, 5.0, 5.0,
    'Rovagnatti/otros', 'Cossano', 'Mejora general', 'Instalaciones', 'SEGURIDAD INSTAL', 'Formulario a la firma',
    '2026-08-01', '2027-01-01', '2027-01-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-002', 'obra_civil', NULL, 'Sector 27 Maternidad', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'suspendida',
    1207000.0, 0, 485.0, 2500.0,
    1.0, 1.0, 1.0,
    NULL, 'Oshiro', 'Mejora general', 'Obra Civil', 'PLAN MAESTRO', 'a espera del master plan',
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-003', 'obra_civil', '6180126', 'Salón de Consejo (sala de presidencia???)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    150000.0, 0, 50.0, 3000.0,
    1.0, 1.0, 1.0,
    NULL, 'Pannito', 'Administrativo', 'Obra Civil', 'RESTILING', 'OT 666556',
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-004', 'obra_civil', NULL, 'Sector 120 1er piso TESTA', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    2250000.0, 0, 750.0, 3000.0,
    4.0, 5.0, 5.0,
    NULL, 'Sulpis', 'Mejora general', 'Obra Civil', 'PLAN MAESTRO', 'SIN PARTIDA',
    '2028-06-01', '2027-02-28', '2027-02-28'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-005', 'obra_civil', NULL, 'UCIC PB + tercer sala de Hemodinamia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto',
    6942000.0, 2000000.0, 1560.0, 4450.0,
    5.0, 5.0, 5.0,
    '1', 'Sulpis', 'Mejora general', 'Obra Civil', 'PLAN MAESTRO', 'SIN PARTIDA',
    '2026-09-01', '2028-01-01', '2028-01-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-006', 'obra_civil', NULL, 'Anexo Perón 4253 (Plan de Salud)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    1495476.0, 0, 600.0, 2500.0,
    1.0, 2.0, 2.0,
    NULL, 'Palmioli', 'Mejora general', 'Obra Civil', 'RESTILING', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-007', 'obra_civil', NULL, 'Sector 20 Ortopedia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'suspendida',
    1625000.0, 0, 650.0, 2500.0,
    3.0, 4.0, 4.0,
    NULL, 'Palmioli', 'Mejora general', 'Obra Civil', 'PLAN MAESTRO', NULL,
    '2029-03-01', '2029-10-31', '2029-10-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-008', 'obra_civil', NULL, 'Ampliación sector 19 sobre azotea 20', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    2150000.0, 0, 500.0, 4300.0,
    4.0, 5.0, 5.0,
    '1', 'Palmioli', 'Ampliación', 'Obra Civil', 'AUMENTO PRODUCC', NULL,
    '2027-07-01', '2028-04-30', '2028-04-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-009', 'obra_civil', NULL, 'Acceso Resonancia / Playa estacionamiento', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    386400.0, 0, 300.0, 1288.0,
    2.0, 3.0, 3.0,
    NULL, 'Palmioli', 'Mejora general', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-010', 'obra_civil', NULL, 'Angiografía (Cambio Angiógrafo)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    330000.0, 900000.0, 100.0, 3300.0,
    4.0, 4.0, 4.0,
    NULL, 'Sulpis', 'Instalacion de equipo', 'Equipos c/obra', 'INSTALAC EQUIPO', NULL,
    '2026-05-01', '2026-08-01', '2026-08-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-011', 'obra_civil', NULL, 'Equipo de Rx y Eco Palpa', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    165000.0, 0, 50.0, 3300.0,
    2.0, 2.0, 2.0,
    NULL, 'Sulpis', 'Instalacion de equipo', 'Equipos c/obra', 'INSTALAC EQUIPO', 'Falta definición de Equipo para avanzar con documentación',
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-012', 'obra_civil', '6120726', 'Equipo de TC -2 Intervencionismo', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'licitacion',
    266000.0, 15000.0, 70.0, 3800.0,
    3.0, 4.0, 4.0,
    NULL, 'Sulpis', 'Instalacion de equipo', 'Equipos c/obra', 'INSTALAC EQUIPO', 'Falta definición de Equipo para avanzar con documentación',
    '2026-08-01', '2026-12-18', '2026-12-18'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-013', 'obra_civil', '6022026', 'Nvo Resonador de Rodilla en Ortopedia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    175000.0, 0, 50.0, 3500.0,
    3.0, 4.0, 4.0,
    NULL, 'Sulpis', 'Instalacion de equipo', 'Equipos c/obra', NULL, 'OT 675570',
    '2026-07-30', '2026-09-30', '2026-09-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-014', 'obra_civil', NULL, 'Reforma Admisión de pacientes', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'suspendida',
    400000.0, 0, 200.0, 2000.0,
    2.0, 4.0, 3.0,
    NULL, 'Oshiro', 'Mejora general', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-015', 'obra_civil', NULL, 'Farmacia Ambulatoria/ PB Cambio de Lay Out', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    100000.0, 0, 50.0, 2000.0,
    2.0, 3.0, 3.0,
    NULL, 'Acerbi', 'Nuevo Layout', 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-016', 'obra_civil', NULL, 'Farmacia Internación / Ampliación Ensayos Clínicos', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    490000.0, 0, 140.0, 3500.0,
    2.0, 4.0, 3.0,
    NULL, 'Palmioli', 'Nuevo Layout', 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-017', 'obra_civil', NULL, 'Farmacia Internación / Cambio de pisos', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    69300.0, 0, 330.0, 210.0,
    1.0, 1.0, 1.0,
    NULL, 'Palmioli', 'Mejora general', 'Terminaciones', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-018', 'obra_civil', NULL, 'Sector 75 Inrtermedia  / Cambio de pisos', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto',
    42000.0, 0, 200.0, 210.0,
    4.0, 4.0, 4.0,
    NULL, 'Palmioli', 'Mejora general', 'Terminaciones', NULL, 'Dependemos de la liberación de Habitaciones',
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-019', 'obra_civil', NULL, 'UTIA Intensiva  / Cambio de pisos', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'suspendida',
    142800.0, 0, 680.0, 210.0,
    5.0, 4.0, 5.0,
    NULL, 'Palmioli', 'Mejora general', 'Terminaciones', NULL, 'Dependemos de la liberación de Habitaciones',
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-020', 'obra_civil', NULL, 'Partos / Dilatantes/ Cambio de Lay Out', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    840000.0, 0, 240.0, 3500.0,
    2.0, 4.0, 3.0,
    NULL, 'Cotos/ Palmioli', 'Nuevo Layout', 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-021', 'obra_civil', '6199826', 'Potosí Amper/ Adecuación Medios de Escape', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto_licitar',
    336000.0, 0, 120.0, 2800.0,
    5.0, 5.0, 5.0,
    '1', 'Acerbi/ Zabala', 'Nuevo Layout', 'Obra Civil', NULL, NULL,
    '2026-08-01', '2027-02-28', '2027-02-28'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-022', 'obra_civil', '6134426', 'Habitacion Sector 35 - Ex Odontología', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'licitacion',
    42000.0, 0, 15.0, 2800.0,
    4.0, 4.0, 4.0,
    NULL, 'Palmioli', 'Nuevo Layout', 'Obra Civil', NULL, NULL,
    '2026-08-01', '2026-09-30', '2026-09-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-023', 'obra_civil', '6128026', 'Med Transfusional =Laboratorio de Terapia Celular', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto',
    700000.0, 0, 50.0, 7000.0,
    5.0, 5.0, 5.0,
    '1', 'Palmioli', 'Nuevo Layout', 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-024', 'obra_civil', '6128026', 'Med Transfusional =Adecuación Ministerio Salud', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto_licitar',
    35714.29, 0, 25.0, 1500.0,
    5.0, 5.0, 5.0,
    '1', 'Acerbi', 'Nuevo Layout', 'Obra Civil', NULL, NULL,
    '2026-06-01', '2026-09-30', '2026-09-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-025', 'obra_civil', '6126826', 'CCV Pediatrico en Ex Cuidados Paliativos', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'licitacion',
    56000.0, 0, 35.0, 2500.0,
    2.0, 2.0, 2.0,
    NULL, 'Pannitto', 'Nuevas oficinas', 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-026', 'obra_civil', NULL, 'Gcia Financiera a Cobranzas', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    400000.0, 0, 200.0, 2000.0,
    2.0, 4.0, 3.0,
    NULL, 'Oshiro', 'Nuevas oficinas', 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-027', 'obra_civil', NULL, 'Adecuación Presidencia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    450000.0, 0, 150.0, 3000.0,
    2.0, 2.0, 2.0,
    NULL, 'Palmioli', 'Nuevas oficinas', 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-028', 'obra_civil', NULL, 'Carro Senda en pisos', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 200.0, 210.0,
    3.0, 3.0, 3.0,
    NULL, 'Palmioli', 'Mejora general', 'Terminaciones', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-029', 'obra_civil', '6164526', 'Nvo Esterilizador a Vapor y Nva Lavadora + Obra', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    210000.0, 0, 70.0, 3000.0,
    4.0, 5.0, 5.0,
    NULL, 'Sulpis', 'Instalacion de equipo', 'Equipos c/obra', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-030', 'obra_civil', NULL, 'Obra y Ascensor Sector 27 Maternidad', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'licitacion',
    250000.0, 0, 100.0, 2500.0,
    4.0, 3.0, 4.0,
    NULL, 'Oshiro', 'Mejora general', 'Instalaciones', 'MEJORA FUNCIONAL', 'Part 6138425',
    '2026-05-04', '2026-11-03', '2026-11-03'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-031', 'obra_civil', NULL, 'Universidad- Nvas Aulas Pringles', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    57000.0, 0, 0, 0,
    1, 1, 1,
    'AVSA Arquitectura', NULL, NULL, NULL, NULL, 'Se entrego dominio para que tramiten permiso de obra.',
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-032', 'obra_civil', '6125126', 'Laboratorio Ctral-  Obra equipos Roche', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    100000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'Gandulfo', 'Kawior', 'Arreglo de Sala', 'Obra Civil', 'MEJORA INSTALAC', '95% de avance.',
    '2026-06-18', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-033', 'obra_civil', NULL, 'Stand UHIBA', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Oshiro', 'Mejora general', 'Terminaciones', 'MEJORA FUNCIONAL', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-034', 'obra_civil', NULL, 'Reforma Estudio de Grabación', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    8100.0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, 'Nuevo Layout', NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-035', 'obra_civil', NULL, 'Nuevo Pabellón Kinesiología', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'licitacion',
    1847000.0, 0, 470.0, 3929.79,
    4.0, 4.0, 4.0,
    NULL, 'Gallardo', 'Ampliación', 'Obra Civil', 'PLAN MAESTRO', 'Partida 6102026 OT 668855',
    '2026-08-26', '2027-08-27', '2027-08-27'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-036', 'obra_civil', NULL, 'Universidad - Laboratorio Cadáver/Simulación', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'suspendida',
    2000000.0, 0, 640.0, 3125.0,
    3.0, 4.0, 4.0,
    NULL, 'Waldemar', 'Ampliación', 'Obra Civil', 'PLAN MAESTRO', 'SIN PARTIDA',
    '2027-01-01', '2027-12-31', '2027-12-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-037', 'obra_civil', NULL, 'Registro Civil', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'suspendida',
    200000.0, 0, 80.0, 2500.0,
    3.0, 3.0, 3.0,
    NULL, 'Gallardo', 'Mejora general/Ampliacion', 'Obra Civil', 'PUESTA EN VALOR', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-038', 'obra_civil', '6102826', 'Economato  Nave 5/7', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto_licitar',
    820000.0, 0, 340.0, 2411.76,
    3.0, 4.0, 4.0,
    'Renke-Calle', 'Waldemar', 'Mejora general/Ampliacion', 'Obra Civil', 'PLAN MAESTRO', 'Se adjudico la calle -Pendiente licitación de Obra N 5-7',
    '2026-08-26', '2027-02-28', '2027-02-28'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-039', 'obra_civil', '6104026', 'Quirófano N°4 mas puesta en valor QX Central', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto_licitar',
    2400000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Waldemar', 'Producción', 'Obra Civil', 'AUMENTO PRODUCC', 'Falta pliego de Obra Civil (dibujante sin OC)',
    '2026-10-20', '2028-02-10', '2028-02-10'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-040', 'obra_civil', NULL, 'Remodelación sala de conferencias  (Fortín)', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    280000.0, 0, 103.0, 2718.45,
    2.0, 2.0, 2.0,
    NULL, 'Waldemar', 'Mejora general/Ampliacion', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-041', 'obra_civil', NULL, 'Adecuación Cocina', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'anteproyecto',
    1680000.0, 0, 600.0, 2800.0,
    4.0, 4.0, 4.0,
    NULL, 'Cossano', 'Nuevo Layout', 'Obra Civil', 'PLAN MAESTRO', NULL,
    '2026-10-20', '2027-08-31', '2027-08-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-042', 'obra_civil', NULL, 'Farmacia Interna - Mudanza', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    870000.0, 0, 300.0, 2900.0,
    5.0, 5.0, 5.0,
    NULL, 'Waldemar', 'Nueva Ubicación', 'Obra Civil', 'PLAN MAESTRO', NULL,
    '2026-09-10', '2027-05-31', '2027-05-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-043', 'obra_civil', NULL, 'Pequeña Obra - Adecuación lactario NEO', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    42638.0, 0, 40.0, 1065.95,
    3.0, 3.0, 3.0,
    NULL, 'Waldemar', 'Mejora general', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    '2026-09-30', '2026-12-29', '2026-12-29'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-044', 'obra_civil', NULL, 'Pequeña Obra - Vestuario Personal', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'anteproyecto',
    37600.0, 0, 47.0, 800.0,
    4.0, 4.0, 4.0,
    NULL, 'Waldemar', 'Mejora general', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    '2026-07-01', '2026-08-31', '2026-08-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-045', 'obra_civil', NULL, 'Pequeña Obra - CEA adecuación oficinas/Depósito', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    30000.0, 0, 63.0, 600.0,
    4.0, 3.0, 4.0,
    NULL, 'Waldemar', 'Mejora general', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    '2026-08-03', '2026-10-20', '2026-10-20'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-046', 'obra_civil', NULL, 'Pequeña Obra - Oficinas de Atencion DXI 1er piso (sala de espera)', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    43600.0, 0, 52.0, 838.46,
    3.0, 4.0, 4.0,
    NULL, 'Waldemar', 'Nuevas oficinas', 'Obra Civil', 'CAMBIO LAY OUT', NULL,
    '2026-08-03', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-047', 'obra_civil', NULL, 'Pequeña Obra - Consultorios  de Enfermería SM', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'suspendida',
    13500.0, 0, 15.0, 900.0,
    3.0, 3.0, 3.0,
    NULL, 'Waldemar', 'Producción', 'Obra Civil', 'AUMENTO PRODUCC', NULL,
    '2026-08-03', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-048', 'obra_civil', NULL, 'Pequeña Obra - Adecuación de Medicina Laboral', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'anteproyecto',
    47300.0, 0, 43.0, 1100.0,
    3.0, 3.0, 3.0,
    NULL, 'Waldemar', 'Mejora general/Ampliacion', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-049', 'obra_civil', NULL, 'Pequeña Obra - Ampliacion Office UCO', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'anteproyecto',
    0, 0, 0, 1100.0,
    3.0, 3.0, 3.0,
    NULL, 'Waldemar', 'Mejora general/Ampliacion', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-050', 'obra_civil', NULL, 'Pequeña Obra - Contenedores oficinas', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'anteproyecto',
    70200.0, 0, 54.0, 1300.0,
    3.0, 3.0, 3.0,
    NULL, 'Waldemar', 'Nuevas oficinas', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-051', 'obra_civil', '6060826', 'PET EQUIPO', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 1500000.0, 0, 0,
    3.0, 1, 3.0,
    NULL, 'Waldemar', 'Instalacion de equipo', 'Equipos c/obra', 'RESTYLING', 'Instalación de equipo en',
    '2026-08-03', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-052', 'obra_civil', NULL, 'PET Etapa N°1 Ecografia reubicación', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'en_curso',
    119000.0, 0, 85.0, 1400.0,
    4.0, 1, 4.0,
    NULL, 'Waldemar', 'Nuevo Layout', 'Obra Civil', 'CAMBIO LAY OUT', NULL,
    '2026-08-26', '2026-10-21', '2026-10-21'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-053', 'obra_civil', NULL, 'Sector de Gastro DXI 2do piso', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Waldemar', 'Producción', 'Obra Civil', 'RESTYLING', NULL,
    '2026-08-28', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-054', 'obra_civil', '6303126', 'Nuevo Horno Rational + Obra', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'en_curso',
    62394.0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Cossano', 'Instalacion de equipo', 'Equipos c/obra', 'INSTALAC EQUIPO', 'Se entrego el Horno y La obra en licitación',
    '2026-08-26', '2026-08-01', '2026-08-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-055', 'obra_civil', NULL, 'Sector 124 Ex Comedor', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 403000.0, 0, 0,
    1, 1, 1,
    'Enobra', 'Sulpis', 'Ampliación', 'Obra Civil', 'AUMENTO PRODUCC', NULL,
    '2026-05-01', '2026-05-26', '2026-05-26'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-056', 'obra_civil', '6021826', 'Nvo TC Nivel -2 + Obra', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    130000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'Conyserv', 'Sulpis', 'Instalacion de equipo', 'Equipos c/obra', 'INSTALAC EQUIPO', NULL,
    '2026-07-01', '2026-10-26', '2026-10-26'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-057', 'obra_civil', NULL, 'Raggio B Internación + hospital de dia Cardoiologico', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    1122000.0, 0, 510.0, 2200.0,
    4.0, 5.0, 5.0,
    NULL, 'Gallardo', 'Mejora y ampliación de camas', 'Obra Civil', 'PUESTA EN VALOR', NULL,
    '2026-09-01', '2027-10-31', '2027-10-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-058', 'obra_civil', NULL, 'Nave 6 (Centro de Distribución)', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'finalizada',
    0, 690566.0, 0, 0,
    1, 1, 1,
    'Ocre Construcciones', 'Waldemar', 'Ampliación', 'Obra Civil', 'PLAN MAESTRO', 'Con demora',
    '2026-06-16', '2026-06-03', '2026-06-03'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-059', 'obra_civil', NULL, 'Farmacia - Óptica - Recuperación', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'en_curso',
    0, 754250.0, 0, 0,
    1, 1, 1,
    'Ocre Construcciones', 'Cossano', 'Ampliación', 'Obra Civil', 'PLAN MAESTRO', 'Posible demora',
    '2026-10-01', '2026-08-01', '2026-08-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-060', 'obra_civil', NULL, 'Pabellón Devoto A', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'en_curso',
    0, 743245.0, 0, 0,
    1, 1, 1,
    'Warlet', 'Gallardo', 'Mejora general', 'Obra Civil', 'PUESTA EN VALOR', 'Con extención de plazo por ampliación de alcance',
    '2026-09-30', '2026-09-15', '2026-09-15'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-061', 'obra_civil', NULL, 'Nueva Dirección Ex HSBC', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    0, 700000.0, 0, 0,
    1, 1, 1,
    'Enobra', 'Pannito', 'Administrativo', 'Obra Civil', 'RESTYLING', NULL,
    '2026-08-26', '2026-10-31', '2026-10-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-062', 'obra_civil', NULL, 'Solado Pasillo SS ingreso a Guardia Ped', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 100000.0, 0, 0,
    1, 1, 1,
    'Gandulfo', 'Palmioli', 'Mejora general', 'Terminaciones', 'RESTYLING', NULL,
    '2026-05-01', '2026-06-30', '2026-06-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-063', 'obra_civil', NULL, 'Obra Ampliación Sala UPS Data Center', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    0, 586850.0, 0, 0,
    1, 1, 1,
    'Mops - schneider', 'Boselli', 'Mejora general/Ampliacion', 'Instalaciones', 'SEGURIDAD INSTAL', NULL,
    '2026-07-01', '2026-07-01', '2026-07-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-064', 'obra_civil', NULL, 'Intercambiador de Placas', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 29000.0, 0, 0,
    1, 1, 1,
    'SA Tecno Practica', 'Vasquez', 'Mejora general', 'Instalaciones', 'SEGURIDAD INSTAL', NULL,
    '2026-05-01', '2026-05-01', '2026-05-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-065', 'obra_civil', NULL, 'Medicina del Trabajo – Cambio de AA', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 62121.94, 0, 0,
    1, 1, 1,
    'LD Ingeniería', 'Sandoval', 'Mejora general', 'Instalaciones', 'SEGURIDAD INSTAL', NULL,
    '2025-12-08', '2026-07-31', '2026-07-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-066', 'obra_civil', NULL, 'Cámara Gamma (Cambio Spect-TC)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 396000.0, 120.0, 3300.0,
    4.0, 4.0, 4.0,
    'Conyserv', 'Sulpis', 'Instalacion de equipo', 'Equipos c/obra', 'INSTALAC EQUIPO', NULL,
    '2026-01-01', '2026-07-16', '2026-07-16'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-067', 'obra_civil', NULL, 'Auditorio Traumatología', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 0, 161350.0, 0,
    1, 1, 1,
    'varios', 'Palmioli', 'Mejora general', 'Obra Civil', 'RESTILING', NULL,
    '2025-11-01', '2025-11-01', '2025-11-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-068', 'obra_civil', NULL, 'Solados hasta pasillo Gascón', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 0, 62650.0, 0,
    1, 1, 1,
    'Gandulfo', 'Palmioli', 'Mejora general', 'Terminaciones', 'RESTILING', NULL,
    '2025-12-01', '2025-12-01', '2025-12-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-069', 'obra_civil', NULL, 'Hemodinamia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 0, 151799.88, 750000.0,
    1, 1, 1,
    'Coniserv', 'Sulpis', 'Instalacion de equipo', 'Obra Civil', 'INSTALAC EQUIPO', NULL,
    '2026-01-01', '2026-01-01', '2026-01-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-070', 'obra_civil', NULL, 'Mejora Pluvial patio sector 124', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 0, 123682.52, 0,
    1, 1, 1,
    'Gandulfo', 'Kawior', 'Ampliación', 'Obra Civil', 'MEJORA INSTALAC', NULL,
    '2026-01-01', '2026-03-01', '2026-03-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-071', 'obra_civil', NULL, 'Cambio de Piso Resonador Siemens 1,5 t', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'finalizada',
    0, 0, 5350.0, 0,
    4.0, 3.0, 4.0,
    'Dalde', 'Waldemar', 'Arreglo de Sala', 'Terminaciones', 'MEJORA FUNCIONAL', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-072', 'obra_civil', NULL, 'Cambio de Mamografo Siemens', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'finalizada',
    0, 0, 1785.71, 0,
    3.0, 5.0, 4.0,
    'Fazzito Alejandro', 'Boselli/Waldemar', 'Instalacion de equipo', 'Equipos c/obra', 'INSTALAC EQUIPO', NULL,
    '2026-03-01', '2026-03-30', '2026-03-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-073', 'obra_civil', NULL, 'Guardia Pediátrica', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 0, 201000.0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Pannitto', 'Mejora general', 'Obra Civil', 'MEJORA FUNCIONAL', NULL,
    '2026-04-01', '2026-04-01', '2026-04-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-074', 'obra_civil', NULL, 'Farmacia Ambulatoria/ Instalación de robot Rowa', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    1, 1, 5.0,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-075', 'obra_civil', NULL, 'TESTA nivel  - Solados', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    1, 1, 1,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-076', 'obra_civil', NULL, 'Hematologia- Mejoras en Sala de espera', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    1, 1, 3.0,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-077', 'obra_civil', NULL, 'Dermatologia- IEP Mejora en los locales', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 2356.0, 0, 0,
    1, 1, 4.0,
    NULL, 'Corbalán', 'Administrativo', 'Terminaciones', 'MEJORA FUNCIONAL', 'Mobiliario',
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-078', 'obra_civil', NULL, 'UTIA Sala de Espera', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    2.0, 1, 4.0,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-079', 'obra_civil', NULL, 'Sector 75- Sala de Espera 4to y 5to piso', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    2.0, 1, 4.0,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-080', 'obra_civil', NULL, 'UTIA - Poliductos exterior Biofilia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    2.0, 1, 2.0,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-081', 'obra_civil', NULL, 'Farmacia Ambulatoria- Robot Rowa', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 4.0, 5.0,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-082', 'obra_civil', NULL, 'Psiquiatria - Solados y pintura', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, 'Mejora general', 'Obra Civil', 'SEGURIDAD INSTAL', 'Actualmente Revestimiento vinilico muy deteriorado. Requiere alta coordinación',
    '2026-06-18', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-083', 'obra_civil', NULL, 'Sector 26- Mejora Estetica', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 4.0, 4.0,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-084', 'obra_civil', NULL, 'TESTA nivel 4 - Solados 22 Baños', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    2.0, 1, 3.0,
    NULL, NULL, 'Mejora general', 'Obra Civil', 'SEGURIDAD INSTAL', 'Revestimiento rugoso, no permite limpieza.',
    '2026-06-18', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-085', 'obra_civil', NULL, 'Pequeña Obra - prequirurgico -consultorios nuevos+ Traslado de oficina de Mantenimiento', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    106000.0, 0, 53.0, 2000.0,
    3.0, 5.0, 4.0,
    NULL, 'Waldemar', 'Producción', 'Obra Civil', 'AUMENTO PRODUCC', NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-086', 'obra_civil', NULL, 'Sector 75 - Sala de Espera', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    1, 1, 1,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'OBRA-087', 'obra_civil', NULL, 'Aggiornamento S26 o S27 - 1 Nivel Completo', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    523000.0, 0, 0, 0,
    2.0, 1, 2.0,
    NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-001', 'infraestructura', '6300926', 'AA Reemplazar equipo de aire acondicionado que atiende los pasillos y áreas auxiliares del Quirófano de Ortopedia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto',
    65000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Kawior', 'N/A', 'Aire acondicionado', 'N/A', NULL,
    '2026-06-22', '2027-03-31', '2027-03-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-002', 'infraestructura', '6300926', 'AA UCA ( Edificio IEP ) nivel 0', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto',
    200000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Kawior', 'N/A', 'Aire acondicionado', 'N/A', NULL,
    '2026-06-22', '2027-03-31', '2027-03-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-003', 'infraestructura', '6300226', 'AA Mejorar la ventilación de la Cámara de Media Tensión ubicada en el edificio Facultad', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    15000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'HEFESTO', 'Kawior', 'N/A', 'Aire acondicionado', 'N/A', NULL,
    '2026-07-08', '2026-08-31', '2026-08-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-004', 'infraestructura', '6300226', 'AA Provisión e Instalación de AA Split OC abierta para contigencias', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'licitacion',
    150000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'López', NULL, 'Aire acondicionado', NULL, NULL,
    '2006-05-13', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-005', 'infraestructura', '6300326', 'ELEC Reemplazo de monitores de aislamiento (Quirófanos,Diag x Imag, terapias) 35 unidades', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    175000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'SOCELEC', 'Kawior', 'N/A', 'Energia Electrica', 'N/A', 'Avance 60%',
    '2026-06-01', '2026-10-23', '2026-10-23'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-006', 'infraestructura', '6300326', 'ELEC Reemplazo de conmutadora GE ONAN', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    40000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'MOPS', 'Boselli', NULL, 'Energia Electrica', NULL, NULL,
    '2026-06-17', '2026-10-15', '2026-10-15'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-007', 'infraestructura', '6300326', 'ELEC Reemplazo del Tablero Principal de Resonancia Magnética', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'anteproyecto',
    150000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Boselli', NULL, 'Energia Electrica', NULL, NULL,
    '2026-08-28', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-008', 'infraestructura', '6300426', 'SANIT Nuevo punto de alimentación planta de tratamiento de agua esterilización', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'licitacion',
    50000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Kawior', 'N/A', 'Inst Sanit', 'N/A', 'En concurso',
    '2026-09-30', '2026-09-30', '2026-09-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-009', 'infraestructura', '6300526', 'GASES Nuevo compresor Tornillo KAESER En Edificio Ortopedia 25 HP', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    40000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'SOCELEC', 'Kawior', 'N/A', 'Gases Clínicos', 'N/A', 'Avance 90%',
    '2026-07-15', '2026-09-25', '2026-09-25'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-010', 'infraestructura', '6300626', 'ASC Reemplazo del Ascensor ubicado en los Consultorios Externos de Pediatría.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto',
    150000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Vasquez', NULL, 'Ascensores', NULL, NULL,
    '2026-11-15', '2027-03-15', '2027-03-15'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-011', 'infraestructura', '6300626', 'ASC Revamping Batería ascensores edificio TESTA 1er etapa 1 ascensor', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto',
    265000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Vasquez', NULL, 'Ascensores', NULL, NULL,
    '2026-09-30', '2027-06-30', '2027-06-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-012', 'infraestructura', '6300926', 'AA Termomecanica colectores de agua  independientes en edifcio de guardia y diagnostico por imagenes', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'licitacion',
    165000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Gimenez', NULL, 'Aire acondicionado', NULL, NULL,
    '2026-09-30', '2026-12-01', '2026-12-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-013', 'infraestructura', '6300926', 'AA edificio  guardia reemplazo de cañerias  principales de hierro por thermofusion  y cuadros de fan coils', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'en_curso',
    110000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'SAENEAS', 'Gimenez', NULL, 'Aire acondicionado', NULL, NULL,
    '2027-01-01', '2027-01-01', '2027-01-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-014', 'infraestructura', '6301026', 'ELEC Adecuación de tableros (GE Cetec ) /UPS ,UTIS', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'licitacion',
    200000.0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Boselli', NULL, 'Energia Electrica', NULL, NULL,
    '2026-09-30', '2027-02-01', '2027-02-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-015', 'infraestructura', '6301026', 'ELEC BATERIAS ups tomografia  /tableros IT DXI ups laboratorio /ups equipo rx', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'licitacion',
    96000.0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Gimenez', NULL, 'Energia Electrica', NULL, NULL,
    '2026-09-30', '2027-11-01', '2027-11-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-016', 'infraestructura', '6301126', 'SANT ampliacion y nuevo ingreso de agua', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'en_curso',
    266200.0, 0, 0, 0,
    5.0, 1, 5.0,
    'EZCA', 'Gimenez', NULL, 'Inst Sanit', NULL, NULL,
    '2027-02-01', '2027-02-01', '2027-02-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-017', 'infraestructura', '6301126', 'INC Tanques dedicados de incendio.', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'en_curso',
    130000.0, 0, 0, 0,
    5.0, 1, 5.0,
    'IPCI', 'Rovenzano', NULL, 'Inst Sanit', NULL, 'OC 436138 del 23/07/2026. comienzo de obra 14/08/2026',
    '2026-08-01', '2026-10-31', '2026-10-31'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-018', 'infraestructura', '6301126', 'SANT red de gas natural  adecuacion de instalacion a normativa vigente', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'licitacion',
    115000.0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Gimenez', NULL, 'Inst Sanit', NULL, NULL,
    '2026-09-30', '2027-03-01', '2027-03-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-019', 'infraestructura', '6301226', 'GASES oxigeno central tk criogenico', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    60000.0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Gimenez / Lopez', NULL, 'Gases Clínicos', NULL, NULL,
    '2026-09-01', '2027-01-01', '2027-01-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-020', 'infraestructura', '6301326', 'CIVIL Mantenimiento de frentes y fachadas , pintura y reparaciones en altura', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'licitacion',
    200000.0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Gimenez', NULL, 'Obra Civil', NULL, NULL,
    '2026-09-30', '2027-04-01', '2027-04-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-021', 'infraestructura', '6301326', 'CIVIL Impermeabilizacion de techos planos  4,000m2', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'en_curso',
    80000.0, 0, 0, 0,
    4.0, 1, 4.0,
    'EZCA', 'Gimenez', NULL, 'Obra Civil', NULL, NULL,
    '2027-02-01', '2027-02-01', '2027-02-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-022', 'infraestructura', '6301326', 'CIVIL Recambio de techos de teja  (300m2) ala de un pabellón', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'licitacion',
    129000.0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, 'Gimenez', NULL, 'Obra Civil', NULL, NULL,
    '2026-09-30', '2027-03-01', '2027-03-01'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-023', 'infraestructura', '6300125', 'AA Cambio aire acondicionado NEA nivel -2 ( Diagnostico por Imagenes )', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    300000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'CENTRO AIRE', 'Vasquez', NULL, 'Aire acondicionado', NULL, 'Fecha de entrega según orden de compra',
    NULL, '2026-12-30', '2026-12-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-024', 'infraestructura', '6135126', 'AA Cambio aire acondicionado NEA nivel 4 ( Terapia intensiva )', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'proyecto',
    400000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, 'Ladaga', NULL, 'Aire acondicionado', NULL, NULL,
    '2026-09-15', '2027-09-05', '2027-09-05'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-025', 'infraestructura', NULL, 'AA Medicina Transfusional ( Edificio IEP ) nivel 3', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-026', 'infraestructura', '6198726', 'AA Reemplazo de canerias y valvulas de 3 vias en agua enfriada Edificio NEAD', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    450000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'SANEAS', 'Kawior', 'N/A', 'Aire acondicionado', 'N/A', '12/07 se entrega el primer nivel',
    '2026-07-03', '2027-06-29', '2027-06-29'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-027', 'infraestructura', NULL, 'AA Reemplazo de canerias de agua enfriada Sector 7', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-028', 'infraestructura', NULL, 'AA Instalar UTA en Neonatología', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-029', 'infraestructura', NULL, 'AA Con Ozono para Habitaciones de Autologos', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    'ECOVIOX', 'Kawior', 'N/A', 'Aire acondicionado', NULL, NULL,
    '2026-07-13', '2026-07-13', '2026-07-13'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-030', 'infraestructura', NULL, 'ELEC Movimientos de grupos electrógenos y redistribución de redes de energía de emergencia.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-031', 'infraestructura', NULL, 'ELEC Reemplazo del Tablero Principal B (cuadrante Gascón/Potosí)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-032', 'infraestructura', NULL, 'ELEC Nuevo tablero edificio Testa, pleno técnico 1', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    5.0, 5.0, 5.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-033', 'infraestructura', '6300126', 'GAS NATURAL ANEXO POTOSÍ', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'licitacion',
    48000.0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Vasquez', NULL, 'Inst Sanit', NULL, NULL,
    '2026-09-30', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-034', 'infraestructura', '6300726', 'CIVIL Mantenimiento de frentes y fachadas , pintura y reparaciones en altura 6000 Mts/2', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    400000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'Mas metros cuadrados', 'Kawior', 'N/A', 'Obra Civil', 'N/A', NULL,
    '2026-05-29', '2027-06-30', '2027-06-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-035', 'infraestructura', '6300125', 'CIVIL Reemplazo de pass through en farmacia Oncologica', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    45000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'CUBEN S A', 'Kawior', 'N/A', 'Obra Civil', 'N/A', 'Nueva fecha de entrega',
    '2026-06-16', '2026-11-30', '2026-11-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-036', 'infraestructura', '6134326', 'CIVIL Reemplazo de Puertas y la ejecución de mejoras edilicias en el Sector 18.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    32000.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'GANDULFO', 'Kawior', 'N/A', 'Obra Civil', 'N/A', NULL,
    '2026-06-01', '2026-08-15', '2026-08-15'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-037', 'infraestructura', '6300826', 'INC QX Ortopedia - Sistema de detección de Incendio', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    16927.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'GB control', 'Zabala', NULL, 'Detección Incendio', NULL, NULL,
    '2026-05-28', '2026-11-30', '2026-11-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-038', 'infraestructura', '6300826', 'INC Laboratorio Central - Sistema de detección de Incendio', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    29137.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'GB control', 'Zabala', NULL, 'Detección Incendio', NULL, NULL,
    '2026-05-28', '2026-11-30', '2026-11-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-039', 'infraestructura', '6362026', 'Alimentación- Nvos Tren de lavado- Comedor', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'en_curso',
    242574.0, 0, 0, 0,
    5.0, 5.0, 5.0,
    'MESA1', 'Kawior', 'N/A', 'Inst Sanit', NULL, 'Ya han pasado detalle , se inicia concurso de obra.',
    '2026-07-13', '2026-11-30', '2026-11-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-040', 'infraestructura', NULL, 'AA edificio imagenes reemplazo de cañerias  principales de hierro por thermofusion  y cuadros de fan coils', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    '2026-07-01', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-041', 'infraestructura', NULL, 'ELEC sistema de extraccion en salas de transformacion', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'asignacion_partida',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    '2026-07-20', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-042', 'infraestructura', NULL, 'ELEC reparacion y repotenciacion de tablero de factor de potencia en diagnostico por imagenes', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-043', 'infraestructura', NULL, 'ELEC mejora en las descargas atmosferica uca  terapias guardia', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-044', 'infraestructura', NULL, 'ELEC Tableros de ultra aislción  UTIS ( Neo-UTIA-UCO -Qx Maternidad- UCA', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-045', 'infraestructura', NULL, 'SANT instalacion de bombas de perforacion de napa para la extraccion de agua para riego', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-046', 'infraestructura', NULL, 'GASES sala de generacion Aire comprimido  vacio', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-047', 'infraestructura', NULL, 'GASES cuadros de regulacion y llaves de corte', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-048', 'infraestructura', NULL, 'GASES Ramales principales de distribución oxigeno central', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-049', 'infraestructura', NULL, 'AA Cambio aire acondicionado NEA nivel -1 ( Guardia Central )', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 4.0, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-050', 'infraestructura', NULL, 'AA Cambio aire acondicionado NEA nivel -0 (Consultorios Cardiología )', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 4.0, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-051', 'infraestructura', NULL, 'AA Cambio aire acondicionado NEA nivel 1 ( Consultorios externos)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 4.0, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-052', 'infraestructura', NULL, 'AA Cambio aire acondicionado NEA nivel 2 ( Neumonología y nutrición )', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 3.0, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-053', 'infraestructura', NULL, 'AA Cambio aire acondicionado NEA nivel 3  ( Urología y Traumatología )', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 3.0, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-054', 'infraestructura', NULL, 'AA Cambio equipos aire acondicionado Perón 4253 (3)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-055', 'infraestructura', NULL, 'AA Reemplazo de cañerías de dos circuitos de agua caliente de calefacción en túnel que van desde la Central Térmica hasta el Edificio Testa y a Terapia Intensiva de Pediatría.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 4.0, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-056', 'infraestructura', NULL, 'AA Incorporar chiller 120/150 TR al anillo de agua enfriada.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-057', 'infraestructura', NULL, 'AA Reemplazo de chiller TRANE 240 TR.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-058', 'infraestructura', NULL, 'AA Readecuación del sistema de generación de agua enfriada para el Sector Resonancia Magnética', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-059', 'infraestructura', NULL, 'AA Cambio equipos aire acondicionado Rooftop quimica en Laboratorio central', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-060', 'infraestructura', NULL, 'AA Instalación termomecánica sector 8.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 4.0, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-061', 'infraestructura', NULL, 'AA Instalación termomecánica sector 9.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 4.0, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-062', 'infraestructura', NULL, 'ELEC Medicion energia /// Reducción Costos EDIFICIO NEQ //AHORRO ENERGÍA', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-063', 'infraestructura', NULL, 'ELEC Telemetría TKs Agua potable edificio ESTERILIZACIÓN,COMEDOR Y NEAD', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-064', 'infraestructura', NULL, 'ELEC Repotenciación eléctrica de energía normal y de GE en el cuadrante Gascón/Potosí', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-065', 'infraestructura', '6300125', 'SANIT Nueva alimentación de agua edificio Pringles 431', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'finalizada',
    50000.0, 0, 0, 0,
    4.0, 1, 4.0,
    'SOCELEC', 'Kawior', 'N/A', 'Inst Sanit', NULL, NULL,
    '2026-07-03', '2026-12-30', '2026-12-30'
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-066', 'infraestructura', '6300526', 'GASES Nuevo colector de distribución de oxígeno en el área de los tanques principales.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'licitacion',
    20000.0, 0, 0, 0,
    5.0, 1, 5.0,
    NULL, 'Vasquez', NULL, 'Gases Clínicos', NULL, NULL,
    '2026-09-23', NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-067', 'infraestructura', NULL, 'GASES Agiornar rampa de tubos de oxígeno de Rehabilitación Potosí', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-068', 'infraestructura', NULL, 'GASES Nuevo compresor Tornillo KAESER En Edificio TESTA 25 HP', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-069', 'infraestructura', NULL, 'GASES Nuevo compresor Tornillo KAESER En Edificio NEA 10 HP', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-070', 'infraestructura', NULL, 'GASES Nuevo compresor Tornillo KAESER En Edificio Maternidad 25 HP', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-071', 'infraestructura', NULL, 'GASES Nueva bomba de vacío DOSIVAC en sala de maquinas Ortopedia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-072', 'infraestructura', NULL, 'GASES Nueva bomba de vacío DOSIVAC en sala de maquinas Maternidad', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-073', 'infraestructura', NULL, 'CIVIL Reparación y pintura interior a demanda 15000 Mts/2', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-074', 'infraestructura', NULL, 'CIVIL Cambio 12 puertas quirófano Central Acero inox. (Presíon Positiva)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-075', 'infraestructura', NULL, 'CIVIL Caminos y sendas de circulación mixta (tecnica/ peatonal)', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-076', 'infraestructura', NULL, 'CIVIL Solados en Pasillos de circulación en sectores de internación ( Diagnostico x Imagenes, Terapia intensiva , Sector 75 )', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-077', 'infraestructura', NULL, 'ASC Reemplazo del Ascensor N° 22', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Ascensores', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-078', 'infraestructura', NULL, 'AA quirofano maternidad  unidad coronaria  poseen un mismo equipo con diferentes necesidades', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-079', 'infraestructura', NULL, 'AA terapia intensiva adultos  recambio de equipo roof top 15tr', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-080', 'infraestructura', NULL, 'ELEC Resonadores instalacion de BMS termomecanico', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'licitacion',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-081', 'infraestructura', NULL, 'ELEC alimentacion Malabia repotenciacion en ingreso a TPBT', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-082', 'infraestructura', NULL, 'ELEC Hemodinamia, adecuación de instalaciones', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-083', 'infraestructura', NULL, 'ELEC archivos generales nueva instalacion', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-084', 'infraestructura', NULL, 'ELEC grupo Electrogeno Back up', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-085', 'infraestructura', NULL, 'ELEC Instalación de monitoreo via BMS / actualizacion de licencias', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-086', 'infraestructura', NULL, 'SANIT impermeabilizacion de tk principal y recambio de montantes', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-087', 'infraestructura', NULL, 'SANIT nuevo tanque cisterna para abastecer laboratorio cerini hemoterapia', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-088', 'infraestructura', NULL, 'SANIT recambio de calderas de internacion devoto  DXI repotenciacion', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-089', 'infraestructura', NULL, 'SANIT red dialisis Devoto 6 camas internacion', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-090', 'infraestructura', NULL, 'SANIT desague pluvial edificios', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-091', 'infraestructura', NULL, 'SANIT Cambio de ramales principales de cañeria', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-092', 'infraestructura', NULL, 'GASES practicas 2 piso edificio de diagnostico', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-093', 'infraestructura', NULL, 'GASES nueva sala de nitrogeno liquido', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-094', 'infraestructura', NULL, 'GASES ampliacion de bms gases', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-095', 'infraestructura', NULL, 'GASES Ampiación de rampa de tubos', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    4.0, 1, 4.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-096', 'infraestructura', NULL, 'AA Cambio aire acondicionado  Tecnología', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-097', 'infraestructura', NULL, 'AA Proveer de aire acondicionado a Economato', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-098', 'infraestructura', NULL, 'AA Finalizar la instalación de aire acondicionado en el Depósito de Farmacia.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-099', 'infraestructura', NULL, 'AA Rehacer la instalación de aire acondicionado del sector jefatura y administración de Oncología', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-100', 'infraestructura', NULL, 'AA RESONANCIA MAGNETICA', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-101', 'infraestructura', NULL, 'ELEC BMS//Aire Comprimido // Ahorro de energía', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-102', 'infraestructura', NULL, 'ELEC BMS // Telemetría UPS// Gestión', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-103', 'infraestructura', NULL, 'ELEC Reemplazo UPS 2x80 TESTA = NUEVA 100 KVA + Banco de baterías', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-104', 'infraestructura', NULL, 'ELEC Reemplazo PLC y magelis transferencia TTA Potosí para integración BMS', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-105', 'infraestructura', NULL, 'ELEC Adecuación sistemas de carga de combustibles de los GE.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-106', 'infraestructura', NULL, 'ELEC Eliminar transformador 3x380/220 V.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Energia Electrica', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-107', 'infraestructura', NULL, 'SANIT Cambio planta prezurizadora Potable  Sector 35-36-37-Resonancia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-108', 'infraestructura', NULL, 'GASES Implementar medición del consumo de oxígeno.', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Gases Clínicos', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-109', 'infraestructura', NULL, 'CIVIL Obra Civil Pintura distribucion cañerias -IRAM', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-110', 'infraestructura', NULL, 'CIVIL Pasarelas de circulación en azotea de Resonancia', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-111', 'infraestructura', NULL, 'ASC Revamping Batería ascensores Historico 19-21', (SELECT id FROM sedes WHERE nombre = 'Almagro' LIMIT 1), 'Almagro', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Ascensores', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-112', 'infraestructura', NULL, 'AA Reemplazo de los sistemas de aire acondicionado (VRV) en el Centro Periférico de calle Larrea.', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'finalizada',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-113', 'infraestructura', NULL, 'AA Reemplazo de un equipo de aire acondicionado (roof top) en el Periférico de calle Triunvirato.', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-114', 'infraestructura', NULL, 'AA CP Lomas de Zamora- Cambio de equipo AA Central', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-115', 'infraestructura', NULL, 'AA CP Palpa - Cambio de Dos (2) Calefactores Central', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-116', 'infraestructura', NULL, 'AA edificio de diagnostico 2piso areas de practicas esta area se ha complejizado teniendo  mayores y mas complejas intervencions', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-117', 'infraestructura', NULL, 'AA recambio de aires acondicionado en internacion sala racks y sala de espera', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-118', 'infraestructura', NULL, 'SANIT Incorporacion de riego en los jardines', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-119', 'infraestructura', NULL, 'SANIT cocina central internacion', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-120', 'infraestructura', NULL, 'SANIT Monitoreo de remoto de consumo', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'asignacion_partida',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Inst Sanit', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-121', 'infraestructura', NULL, 'CIVIL sala de tubos medicinales', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-122', 'infraestructura', NULL, 'CIVIL ejecucion de pasarelas de acceso a galerias terrazas ejecucion de lineas de vida', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-123', 'infraestructura', NULL, 'CIVIL circuitos de residuos estaciones de acopio intermedias', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-124', 'infraestructura', NULL, 'CIVIL ejecucion de sala de rack cerini  cocina/ central', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-125', 'infraestructura', NULL, 'CIVIL Calle de proveedores', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-126', 'infraestructura', NULL, 'CIVIL Veredas externas', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'factibilidad',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-127', 'infraestructura', NULL, 'CIVIL cerco perimetral frente del hospital', (SELECT id FROM sedes WHERE nombre = 'San Justo' LIMIT 1), 'San Justo', 'proyecto',
    0, 0, 0, 0,
    3.0, 1, 3.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-128', 'infraestructura', NULL, 'AA Instalación sistema multi split Virrey del Pino 1ero y 2do Piso', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'proyecto',
    0, 0, 0, 0,
    2.0, 1, 2.0,
    NULL, NULL, NULL, 'Aire acondicionado', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-129', 'infraestructura', NULL, 'CIVIL Pintura CP Barrio Norte', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'finalizada',
    0, 0, 0, 0,
    1, 1, 1.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-130', 'infraestructura', NULL, 'CIVIL Cambio piso y protecciones escalera + otros CP Barrio Norte', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'finalizada',
    0, 0, 0, 0,
    1, 1, 1.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-131', 'infraestructura', NULL, 'CIVIL Cambio piso 1P CP Avellaneda', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'finalizada',
    0, 0, 0, 0,
    1, 1, 1.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-132', 'infraestructura', NULL, 'CIVIL Pintura CP San Isidro', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'finalizada',
    0, 0, 0, 0,
    1, 1, 1.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-133', 'infraestructura', NULL, 'CIVIL Pintura Centro Ituzaingo', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'finalizada',
    0, 0, 0, 0,
    1, 1, 1.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;
INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    'INFRA-134', 'infraestructura', NULL, 'CIVIL Pintura medianera CP Caseros', (SELECT id FROM sedes WHERE nombre = 'Ctros Medicos' LIMIT 1), 'Ctros Medicos', 'finalizada',
    0, 0, 0, 0,
    1, 1, 1.0,
    NULL, NULL, NULL, 'Obra Civil', NULL, NULL,
    NULL, NULL, NULL
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;