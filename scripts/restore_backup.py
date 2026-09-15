#!/usr/bin/env python3
"""
SIGO HIBA - Restaurador Rápido de Base de Datos Canónica desde Respaldo JSON
Uso: python3 scripts/restore_backup.py <nombre_archivo_backup>
Ejemplo: python3 scripts/restore_backup.py backup_2026-09-14_1500.json
"""

import sys
import os
import json
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
BACKUPS_DIR = os.path.join(ROOT_DIR, "backups")

if len(sys.argv) < 2:
    print("❌ Error: Debes especificar el nombre o ruta del backup a restaurar.")
    print("Ejemplo: python3 scripts/restore_backup.py backup_2026-09-14_1500.json")
    sys.exit(1)

backup_target = sys.argv[1].strip()
if not os.path.isabs(backup_target):
    # Si no es ruta absoluta, buscar en backups/ o ruta relativa
    candidate = os.path.join(BACKUPS_DIR, backup_target)
    if os.path.exists(candidate):
        backup_path = candidate
    else:
        backup_path = os.path.abspath(backup_target)
else:
    backup_path = backup_target

if not os.path.exists(backup_path):
    print(f"❌ Error: El archivo de respaldo no existe: {backup_path}")
    sys.exit(1)

try:
    with open(backup_path, "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception as e:
    print(f"❌ Error leyendo JSON del backup: {e}")
    sys.exit(1)

# Validar formato
items = data.get("items")
if not items and "obras" in data:
    items = data["obras"] + data.get("infraestructura", [])

if not items or not isinstance(items, list):
    print("❌ Error: El archivo no contiene una lista válida de 'items' u 'obras'.")
    sys.exit(1)

# Separar obras civiles/equipamiento de infraestructura
obras = [it for it in items if it.get("tipo") != "Infraestructura"]
infra = [it for it in items if it.get("tipo") == "Infraestructura"]

now_iso = datetime.now(timezone.utc).isoformat()
file_basename = os.path.basename(backup_path)

output_data = {
    "metadata": {
        "institucion": "Hospital Italiano de Buenos Aires (HIBA)",
        "generado_el": now_iso,
        "restaurado_desde": file_basename,
        "total_obras": len(obras),
        "total_infraestructura": len(infra),
        "version": f"v3_canonical_restored_{int(datetime.now().timestamp())}"
    },
    "obras": obras,
    "infraestructura": infra
}

js_content = "window.INITIAL_DATA = " + json.dumps(output_data, ensure_ascii=False, indent=2) + ";\n"

# Escribir en raíz: js/initial-data.js
path_root = os.path.join(ROOT_DIR, "js", "initial-data.js")
with open(path_root, "w", encoding="utf-8") as f:
    f.write(js_content)

# Escribir en app: app/js/initial-data.js (paridad 100% estricta)
path_app = os.path.join(ROOT_DIR, "app", "js", "initial-data.js")
with open(path_app, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"🎉 ¡Base de datos restaurada con éxito desde {file_basename}!")
print(f"📊 Registros restaurados: {len(obras)} obras civiles/equipamiento y {len(infra)} infraestructura (Total: {len(items)}).")
print(f"✅ Sincronización idéntica aplicada en:")
print(f"   - {path_root}")
print(f"   - {path_app}")
