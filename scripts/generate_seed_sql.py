import json

with open('scripts/data_exported.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sql_lines = []
sql_lines.append("-- ==========================================================")
sql_lines.append("-- SEED DATA: Obras e Inversiones HIBA (Central, San Justo, Periféricos)")
sql_lines.append("-- ==========================================================\n")

# Sedes
sql_lines.append("-- 1. SEDES")
sql_lines.append("""
INSERT INTO sedes (nombre, codigo) VALUES 
('Central', 'CEN'),
('San Justo', 'SJU'),
('Periféricos', 'PER')
ON CONFLICT (nombre) DO NOTHING;
""")

def map_estado(e_name):
    if not e_name:
        return 'factibilidad'
    e = e_name.lower().strip()
    if 'factibilidad' in e:
        return 'factibilidad'
    if 'ante' in e:
        return 'anteproyecto'
    if 'para licitar' in e:
        return 'proyecto_licitar'
    if 'licitaci' in e:
        return 'licitacion'
    if 'proyecto' in e:
        return 'proyecto'
    if 'curso' in e or 'ejecuci' in e:
        return 'en_curso'
    if 'finalizad' in e:
        return 'finalizada'
    if 'suspendid' in e:
        return 'suspendida'
    if 'asig' in e:
        return 'asignacion_partida'
    return 'factibilidad'

def sql_str(val):
    if val is None or val == "":
        return "NULL"
    clean = str(val).replace("'", "''").strip()
    return f"'{clean}'"

def sql_date(val):
    if not val:
        return "NULL"
    return f"'{val}'"

sql_lines.append("\n-- 2. PROYECTOS Y OBRAS")

all_items = data['obras'] + data['infraestructura']

for item in all_items:
    c_id = sql_str(item['id'])
    tipo = "'obra_civil'" if item['tipo'] == 'Obra Civil' else "'infraestructura'"
    partida = sql_str(item.get('partida'))
    nombre = sql_str(item.get('nombre'))
    sede_val = item.get('sede', 'Central')
    if sede_val == 'Almagro':
        sede_val = 'Central'
    elif sede_val == 'Periférico':
        sede_val = 'Periféricos'
    sede = sql_str(sede_val)
    estado = f"'{map_estado(item.get('estado'))}'"
    m_obra = item.get('monto_obra_usd', 0) or 0
    m_equip = item.get('monto_equipamiento_usd', 0) or 0
    m2 = item.get('superficie_m2', 0) or 0
    usd_m2 = item.get('costo_usd_m2', 0) or 0
    p_tec = item.get('prioridad_tecnica', 1) or 1
    p_med = item.get('prioridad_medica', 1) or 1
    p_fin = item.get('prioridad_final', 1) or 1
    prov = sql_str(item.get('proveedor'))
    resp = sql_str(item.get('responsable'))
    clasif = sql_str(item.get('clasificacion'))
    cat = sql_str(item.get('categoria'))
    mot = sql_str(item.get('motivo'))
    obs = sql_str(item.get('observaciones'))
    d_ini = sql_date(item.get('fecha_inicio_etapa'))
    d_fin = sql_date(item.get('fecha_fin_etapa'))
    d_fin_obra = sql_date(item.get('fecha_fin_obra'))

    stmt = f"""INSERT INTO proyectos_obras (
    codigo_interno, tipo, partida, nombre, sede_id, sede_nombre, estado,
    monto_obra_usd, monto_equipamiento_usd, superficie_m2, costo_usd_m2,
    prioridad_tecnica, prioridad_medica, prioridad_final,
    proveedor, responsable, clasificacion, categoria, motivo, observaciones,
    fecha_inicio_etapa, fecha_fin_etapa, fecha_fin_obra
) VALUES (
    {c_id}, {tipo}, {partida}, {nombre}, (SELECT id FROM sedes WHERE nombre = {sede} LIMIT 1), {sede}, {estado},
    {m_obra}, {m_equip}, {m2}, {usd_m2},
    {p_tec}, {p_med}, {p_fin},
    {prov}, {resp}, {clasif}, {cat}, {mot}, {obs},
    {d_ini}, {d_fin}, {d_fin_obra}
) ON CONFLICT (codigo_interno) DO UPDATE SET
    monto_obra_usd = EXCLUDED.monto_obra_usd,
    monto_equipamiento_usd = EXCLUDED.monto_equipamiento_usd,
    estado = EXCLUDED.estado,
    sede_nombre = EXCLUDED.sede_nombre,
    fecha_fin_etapa = EXCLUDED.fecha_fin_etapa;"""
    sql_lines.append(stmt)

with open('supabase/seed.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated supabase/seed.sql with {len(all_items)} records!")
