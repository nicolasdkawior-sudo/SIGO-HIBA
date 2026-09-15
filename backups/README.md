# 🗄️ Repositorio de Respaldos Históricos de SIGO HIBA

Este directorio almacena las copias de seguridad automáticas de la base de datos canónica del **Sistema Integral de Gestión de Obras e Inversiones (SIGO HIBA)** del **Hospital Italiano de Buenos Aires**.

---

## ⏰ Política de Respaldo y Retención
1. **Ejecución Automática Diaria:** Todos los días a las **15:00 hs (ART / UTC-3)** mediante GitHub Actions.
2. **Retención Histórica:** **30 días móviles**. Las copias con más de 30 días de antigüedad se purgan automáticamente de manera diaria para mantener un historial ordenado y liviano.
3. **Formato:** Archivos JSON estructurados con nomenclatura `backup_AAAA-MM-DD_1500.json`.
4. **Independencia:** Los respaldos se gestionan íntegramente fuera de la aplicación web para máxima seguridad e inviolabilidad.

---

## 🚀 ¿Cómo Restaurar un Respaldo en Caso de Error? (Rollback en 1 Clic)

No necesitas usar comandos ni modificar código. La restauración es 100% visual y automatizada:

1. Ingresa a la pestaña **Actions** en este repositorio de GitHub:  
   `https://github.com/nicolasdkawior-sudo/SIGO-HIBA/actions`
2. En la lista izquierda, haz clic en **`Restaurar Base de Datos (Rollback)`**.
3. Haz clic en el botón **Run workflow** (a la derecha).
4. En el campo que aparece, ingresa el nombre del archivo de respaldo que deseas recuperar (ejemplo: `backup_2026-09-14_1500.json`).
5. Presiona el botón verde **Run workflow**.

### ¿Qué hace el sistema automáticamente?
* GitHub Actions carga el archivo seleccionado y actualiza la base canónica oficial.
* Genera un commit automático con la restauración.
* **Vercel detecta el cambio de inmediato y en aproximadamente 45 segundos el sitio en producción (`https://www.sigohiba.com`) queda 100% restaurado.**

---

## 📥 Descarga Manual de un Respaldo
Si solo deseas consultar o auditar los datos de una fecha en particular:
1. Haz clic sobre cualquiera de los archivos `backup_AAAA-MM-DD_1500.json` de esta carpeta.
2. Haz clic en el botón **Download raw file** (o el icono de descarga en la esquina superior derecha del archivo).
3. Obtendrás el archivo JSON completo con todas las obras, estados, plazos, adjudicaciones, montos y usuarios.
