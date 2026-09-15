#!/usr/bin/env python3
"""
SIGO HIBA - Generador de Copia de Seguridad Diaria Automática (15:00 ART)
Retención estricta de 30 días móviles
"""

import os
import json
import re
from datetime import datetime, timezone, timedelta

# Rutas principales
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
BACKUPS_DIR = os.path.join(ROOT_DIR, "backups")

os.makedirs(BACKUPS_DIR, exist_ok=True)

# 1. Cargar datos canónicos desde js/initial-data.js
initial_data_path = os.path.join(ROOT_DIR, "js", "initial-data.js")
if not os.path.exists(initial_data_path):
    print(f"❌ Error: Archivo {initial_data_path} no encontrado")
    exit(1)

with open(initial_data_path, "r", encoding="utf-8") as f:
    content = f.read()

prefix = "window.INITIAL_DATA = "
start_idx = content.find(prefix)
if start_idx == -1:
    print("❌ Error: 'window.INITIAL_DATA = ' no encontrado en js/initial-data.js")
    exit(1)

start_idx += len(prefix)
end_idx = content.rfind(";")
if end_idx == -1:
    end_idx = len(content)

json_str = content[start_idx:end_idx].strip()
initial_data = json.loads(json_str)

obras = initial_data.get("obras", [])
infra = initial_data.get("infraestructura", [])
all_items = obras + infra

# 2. Cargar usuarios por defecto desde js/data-store.js
data_store_path = os.path.join(ROOT_DIR, "js", "data-store.js")
users = []
if os.path.exists(data_store_path):
    with open(data_store_path, "r", encoding="utf-8") as f:
        ds_content = f.read()
    u_match = re.search(r"const DEFAULT_USERS\s*=\s*(\[[\s\S]*?\]);", ds_content)
    if u_match:
        try:
            users = json.loads(u_match.group(1))
        except Exception:
            pass

# 3. Calcular métricas y KPIs
activas = [o for o in all_items if o.get("estado") in ["Proyecto", "En licitación", "Obras en Curso"]]
sum_civil = sum(float(it.get("monto_obra_usd", 0) or 0) for it in activas if it.get("tipo") == "Obra Civil")
sum_equip = sum(float(it.get("monto_equipamiento_usd", 0) or 0) for it in activas)
sum_infra = sum(float(it.get("monto_obra_usd", 0) or 0) for it in activas if it.get("tipo") == "Infraestructura")
total_usd = sum_civil + sum_equip + sum_infra

# 4. Huso Horario de Argentina (ART = UTC-3)
utc_now = datetime.now(timezone.utc)
art_tz = timezone(timedelta(hours=-3))
art_now = utc_now.astimezone(art_tz)
art_date_str = art_now.strftime("%Y-%m-%d")

backup_file_name = f"backup_{art_date_str}_1500.json"
backup_file_path = os.path.join(BACKUPS_DIR, backup_file_name)

payload = {
    "version": "v3.0_canonical_backup",
    "backup_date_art": art_date_str,
    "created_at_utc": utc_now.isoformat(),
    "institution": "Hospital Italiano de Buenos Aires (HIBA)",
    "system": "SIGO HIBA - Sistema de Gestión de Obras",
    "retention_policy": "30_days_rolling",
    "metadata": {
        "total_catalog_items": len(all_items),
        "cartera_activa_count": len(activas),
        "total_cartera_usd": round(total_usd, 2),
        "sum_civil_usd": round(sum_civil, 2),
        "sum_equip_usd": round(sum_equip, 2),
        "sum_infra_usd": round(sum_infra, 2),
        "factibilidad_count": len([o for o in all_items if o.get("estado") in ["Estudio de Factibilidad", "Ante Proyecto"]]),
        "finalizadas_count": len([o for o in all_items if o.get("estado") == "Obras Finalizadas"]),
        "suspendidas_count": len([o for o in all_items if o.get("estado") == "Suspendida"]),
        "users_count": len(users)
    },
    "items": all_items,
    "users": users
}

with open(backup_file_path, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Backup generado exitosamente: {backup_file_name}")
print(f"📊 Obras respaldadas: {len(all_items)} ({len(activas)} activas por USD {total_usd:,.2f})")

# 5. Política de retención: Purgar copias de seguridad de más de 30 días
RETENTION_DAYS = 30
purged_count = 0
retained_count = 0

for fname in os.listdir(BACKUPS_DIR):
    if fname.startswith("backup_") and fname.endswith(".json"):
        match = re.match(r"^backup_(\d{4}-\d{2}-\d{2})_", fname)
        if match:
            fdate_str = match.group(1)
            try:
                fdate = datetime.strptime(fdate_str, "%Y-%m-%d").date()
                diff_days = (art_now.date() - fdate).days
                if diff_days > RETENTION_DAYS:
                    os.remove(os.path.join(BACKUPS_DIR, fname))
                    print(f"🗑️ Backup purgado (>30 días): {fname} ({diff_days} días de antigüedad)")
                    purged_count += 1
                else:
                    retained_count += 1
            except Exception as e:
                pass

print(f"📁 Total backups retenidos en historial: {retained_count} (Purgados: {purged_count})")
