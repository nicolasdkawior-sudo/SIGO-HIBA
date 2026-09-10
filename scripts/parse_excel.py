import zipfile
import xml.etree.ElementTree as ET
import json
import os
import re
from datetime import datetime, timedelta

def excel_date_to_iso(val):
    if not val or val == 'NA' or val == 'N/A':
        return None
    val_str = str(val).strip()
    # Try direct parsing if it has slash or dash
    if '/' in val_str:
        parts = val_str.split('/')
        if len(parts) == 2: # e.g. 05/26 (MM/YY)
            try:
                m = int(parts[0])
                y = 2000 + int(parts[1]) if len(parts[1]) == 2 else int(parts[1])
                return f"{y:04d}-{m:02d}-01"
            except:
                pass
        elif len(parts) == 3: # DD/MM/YYYY or MM/DD/YYYY
            try:
                p1, p2, p3 = int(parts[0]), int(parts[1]), int(parts[2])
                y = p3 if p3 > 100 else 2000 + p3
                return f"{y:04d}-{p2:02d}-{p1:02d}"
            except:
                pass
    try:
        n = float(val_str)
        if n > 1000: # Excel serial date
            d = datetime(1899, 12, 30) + timedelta(days=n)
            return d.strftime('%Y-%m-%d')
    except:
        pass
    return None

def clean_float(val):
    if not val:
        return 0.0
    val_str = str(val).strip().replace('$', '').replace(',', '').replace(' ', '')
    try:
        return round(float(val_str), 2)
    except:
        return 0.0

def clean_str(val):
    if val is None:
        return ""
    s = str(val).strip()
    if s.endswith('.0') and s[:-2].isdigit():
        return s[:-2]
    return s

def clean_estado(estado_raw):
    if not estado_raw:
        return "Estudio de Factibilidad"
    e = estado_raw.strip().lower()
    if "factibilidad" in e:
        return "Estudio de Factibilidad"
    if "ante" in e or "anteproyecto" in e:
        return "Ante Proyecto"
    if "para licitar" in e:
        return "Proyecto para licitar"
    if "licitaci" in e or "licitación" in e or "en licitacion" in e:
        return "En licitación"
    if "proyecto" in e:
        return "Proyecto"
    if "curso" in e or "ejecuci" in e or "en curso" in e:
        return "Obras en Curso"
    if "finalizad" in e or "terminada" in e:
        return "Obras Finalizadas"
    if "suspendid" in e or "pausada" in e:
        return "Suspendida"
    if "asignaci" in e or "asig" in e:
        return "En Asignación de Partida"
    return estado_raw.strip()

excel_path = "Seguimiento_Obras_HIBA_2025.xlsx"

with zipfile.ZipFile(excel_path, 'r') as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        sst_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in sst_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
            if t is not None and t.text:
                shared_strings.append(t.text)
            else:
                texts = [elem.text for elem in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if elem.text]
                shared_strings.append(''.join(texts))

    wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
    rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    rel_map = {r.attrib['Id']: r.attrib['Target'] for r in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')}

    def get_sheet_data(sheet_name):
        for s in wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            if s.attrib['name'] == sheet_name:
                target = rel_map[s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
                path = 'xl/' + target if not target.startswith('xl/') else target
                tree = ET.fromstring(z.read(path))
                rows = tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
                parsed_rows = []
                for r in rows:
                    row_dict = {}
                    for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                        ref = c.attrib.get('r', '')
                        col = ''.join([ch for ch in ref if ch.isalpha()])
                        v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                        val = ''
                        if v is not None and v.text:
                            val = shared_strings[int(v.text)] if c.attrib.get('t') == 's' else v.text
                        row_dict[col] = val.strip()
                    parsed_rows.append(row_dict)
                return parsed_rows
        return []

    # 1. Criterios Técnicos map by (sede, nombre)
    criterios_raw = get_sheet_data('Criterios Tecnicos')
    criterios_map = {}
    for r in criterios_raw[1:]:
        sede = clean_str(r.get('A', ''))
        nombre = clean_str(r.get('B', ''))
        if nombre:
            key = f"{sede}::{nombre.lower()}"
            criterios_map[key] = {
                "cumplimiento_normativo": clean_float(r.get('C', 0)),
                "seguridad_estructural": clean_float(r.get('D', 0)),
                "funcionalidad_flujos": clean_float(r.get('E', 0)),
                "infraestructura_obsoleta": clean_float(r.get('F', 0)),
                "impacto_produccion": clean_float(r.get('G', 0)),
                "criterio_tec_final": clean_float(r.get('H', 0))
            }

    # 2. Cashflow map by (sede, nombre)
    cashflow_raw = get_sheet_data('cashflow de obras')
    cashflow_map = {}
    for r in cashflow_raw[4:]: # Starts at row 5
        sede = clean_str(r.get('A', ''))
        nombre = clean_str(r.get('B', ''))
        if nombre:
            key = f"{sede}::{nombre.lower()}"
            cashflow_map[key] = {
                "monto_total": clean_float(r.get('D', 0)),
                "fecha_inicio": excel_date_to_iso(r.get('E', '')),
                "fecha_fin": excel_date_to_iso(r.get('F', '')),
                "cashflow_2026": clean_float(r.get('G', 0)),
                "cashflow_2027": clean_float(r.get('H', 0)),
                "cashflow_2028": clean_float(r.get('I', 0)),
                "cashflow_2029": clean_float(r.get('J', 0))
            }

    # 3. Listado General Obras
    obras_raw = get_sheet_data('Listado Gral Obras')
    obras_list = []
    item_id = 1

    for r in obras_raw[1:]:
        nombre = clean_str(r.get('D', ''))
        if not nombre or nombre.startswith('CANT PROYECTOS') or nombre.isdigit():
            continue
        sede = clean_str(r.get('C', 'Almagro')) or 'Almagro'
        partida = clean_str(r.get('A', ''))
        monto_obra = clean_float(r.get('B', 0))
        monto_equip = clean_float(r.get('S', 0))
        monto_total = monto_obra + monto_equip
        prioridad_tec = clean_float(r.get('E', 0))
        prioridad_med = clean_float(r.get('F', 0))
        prioridad_fin = clean_float(r.get('G', 0)) or prioridad_tec or prioridad_med
        proveedor = clean_str(r.get('H', ''))
        estado = clean_estado(r.get('I', ''))
        fecha_tarea = excel_date_to_iso(r.get('J', ''))
        clasificacion = clean_str(r.get('K', ''))
        categoria = clean_str(r.get('L', 'Obra Civil'))
        fecha_fin = excel_date_to_iso(r.get('M', ''))
        motivo = clean_str(r.get('N', ''))
        responsable = clean_str(r.get('O', 'Sin Asignar'))
        obs = clean_str(r.get('P', ''))
        m2 = clean_float(r.get('Q', 0))
        usd_m2 = clean_float(r.get('R', 0))

        key = f"{sede}::{nombre.lower()}"
        crit = criterios_map.get(key, {})
        cf = cashflow_map.get(key, {})

        if cf and not fecha_fin and cf.get('fecha_fin'):
            fecha_fin = cf['fecha_fin']
        if cf and not fecha_tarea and cf.get('fecha_inicio'):
            fecha_tarea = cf['fecha_inicio']

        obras_list.append({
            "id": f"OBRA-{item_id:03d}",
            "tipo": "Obra Civil",
            "partida": partida,
            "nombre": nombre,
            "sede": sede,
            "monto_obra_usd": monto_obra,
            "monto_equipamiento_usd": monto_equip,
            "monto_total_usd": monto_total,
            "prioridad_tecnica": prioridad_tec,
            "prioridad_medica": prioridad_med,
            "prioridad_final": prioridad_fin,
            "proveedor": proveedor,
            "estado": estado,
            "fecha_inicio_etapa": fecha_tarea,
            "fecha_fin_etapa": fecha_fin, # estimada de la etapa u obra
            "fecha_fin_obra": fecha_fin,
            "clasificacion": clasificacion,
            "categoria": categoria,
            "motivo": motivo,
            "responsable": responsable,
            "observaciones": obs,
            "superficie_m2": m2,
            "costo_usd_m2": usd_m2,
            "criterios_tecnicos": crit,
            "cashflow": cf
        })
        item_id += 1

    # 4. Listado General Infraestructura
    infra_raw = get_sheet_data('Listado Gral Infraestructura')
    infra_list = []
    infra_id = 1
    for r in infra_raw[1:]:
        nombre = clean_str(r.get('D', ''))
        if not nombre:
            continue
        sede = clean_str(r.get('C', 'Almagro')) or 'Almagro'
        partida = clean_str(r.get('A', ''))
        monto_obra = clean_float(r.get('B', 0))
        prioridad_tec = clean_float(r.get('E', 0))
        prioridad_est = clean_float(r.get('F', 0))
        prioridad_fin = clean_float(r.get('G', 0)) or prioridad_tec
        proveedor = clean_str(r.get('H', ''))
        estado = clean_estado(r.get('I', 'Proyecto'))
        fecha_tarea = excel_date_to_iso(r.get('J', ''))
        clasificacion = clean_str(r.get('K', ''))
        categoria = clean_str(r.get('L', 'Instalaciones'))
        fecha_fin = excel_date_to_iso(r.get('M', ''))
        motivo = clean_str(r.get('N', ''))
        responsable = clean_str(r.get('O', 'Infraestructura'))
        obs = clean_str(r.get('P', ''))

        infra_list.append({
            "id": f"INFRA-{infra_id:03d}",
            "tipo": "Infraestructura",
            "partida": partida,
            "nombre": nombre,
            "sede": sede,
            "monto_obra_usd": monto_obra,
            "monto_equipamiento_usd": 0.0,
            "monto_total_usd": monto_obra,
            "prioridad_tecnica": prioridad_tec,
            "prioridad_medica": prioridad_est,
            "prioridad_final": prioridad_fin,
            "proveedor": proveedor,
            "estado": estado,
            "fecha_inicio_etapa": fecha_tarea,
            "fecha_fin_etapa": fecha_fin,
            "fecha_fin_obra": fecha_fin,
            "clasificacion": clasificacion,
            "categoria": categoria,
            "motivo": motivo,
            "responsable": responsable,
            "observaciones": obs,
            "superficie_m2": 0.0,
            "costo_usd_m2": 0.0,
            "criterios_tecnicos": {},
            "cashflow": {}
        })
        infra_id += 1

    all_data = {
        "metadata": {
            "institucion": "Hospital Italiano de Buenos Aires (HIBA)",
            "generado_el": datetime.now().isoformat(),
            "total_obras": len(obras_list),
            "total_infraestructura": len(infra_list)
        },
        "obras": obras_list,
        "infraestructura": infra_list
    }

    with open('scripts/data_exported.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"Export successful!")
    print(f"Obras procesadas: {len(obras_list)}")
    print(f"Infraestructura procesada: {len(infra_list)}")
    print(f"Archivo guardado en scripts/data_exported.json")
