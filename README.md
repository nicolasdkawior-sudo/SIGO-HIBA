# SIGO - HIBA | Sistema Integral de Gestión de Obras e Inversiones

Plataforma ERP y Dashboard ejecutivo para el seguimiento, control de plazos y gestión financiera de obras civiles, infraestructura y tecnología médica del **Hospital Italiano de Buenos Aires (HIBA)**.

Reemplaza la tradicional planilla Excel multi-solapa por una aplicación web centralizada, colaborativa y con base de datos en la nube en **Supabase**, soporte en **GitHub** y despliegue web accesible desde cualquier dispositivo.

---

## 🌟 Características Principales

1. **Dashboard Ejecutivo en Tiempo Real**:
   - **Semáforo de Plazos Automatizado**: Detección inmediata de tareas **Vencidas** (🔴), **Próximas a Vencer** en 30 días (🟡) y **En Plazo** (🟢).
   - **KPIs Financieros**: Inversión total en USD, porcentaje de obras en cronograma, conteo de obras activas, finalizadas y pausadas.
   - **Embudo de Pipeline**: Gráfico de avance por cada etapa del ciclo de vida (Factibilidad, Anteproyecto, Proyecto, Licitación, En Curso, Finalizada, Suspendida).
   - **Distribución de Fondos por Sede**: Desglose financiero entre Almagro, San Justo y Periféricos.
   - **Alertas Críticas**: Ranking dinámico de obras con mayor desvío temporal ordenadas por monto de inversión.

2. **Múltiples Vistas de Gestión**:
   - **Tablero Kanban**: Flujo visual de tarjetas por estado con botón de avance rápido de etapa.
   - **Listado ERP (Data Grid)**: Tabla avanzada con filtros multifactor (Sede, Tipo, Estado, Semáforo, Responsable), buscador por texto y exportación a Excel (`.xlsx`).
   - **Cronograma Gantt**: Visualización temporal mes a mes (2026 - 2027) con código de color por estado de salud.
   - **Matriz de Cashflow**: Proyección presupuestaria multianual (2026, 2027, 2028, 2029) con totales consolidados.

3. **Trazabilidad y Perfiles de Usuario (RBAC)**:
   - Simulación y conexión con **Supabase Auth** para perfiles:
     - **Dirección General (Admin)**: Visión global, aprobación y priorización.
     - **Jefe de Obra / PM**: Carga de avance de tareas, fechas y pase de fases.
     - **Dirección Médica**: Ponderación de Prioridad Médica y necesidades sanitarias.
     - **Compras y Licitaciones**: Gestión de proveedores y fechas de adjudicación.
   - **Bitácora de Auditoría**: Registro cronológico de cada transición de estado, usuario responsable, fechas pactadas y observaciones.

4. **Modo Dual (Demo Inmediata + Nube en Vivo)**:
   - **Modo Local / Demo**: Incluye precargadas las **87 obras civiles** y **134 intervenciones de infraestructura** del archivo original `Seguimiento_Obras_HIBA_2025.xlsx`. Funciona inmediatamente sin configurar nada.
   - **Modo Supabase en Vivo**: Conexión nativa con PostgreSQL en la nube ingresando tus credenciales en el botón `⚙️ Configurar Supabase`.

---

## 🚀 Puesta en Marcha Local

La aplicación no requiere instalación de dependencias pesadas:

```bash
# 1. En la carpeta del proyecto, iniciar un servidor estático con Python:
python3 -m http.server 3000

# 2. Abrir en tu navegador:
http://localhost:3000
```

También puedes abrir directamente el archivo `index.html` en Chrome, Safari o Edge.

---

## 🗄️ Configuración de la Base de Datos en Supabase

Para conectar tu propia base de datos PostgreSQL en la nube:

1. Ingresa a [supabase.com](https://supabase.com) y crea un proyecto gratuito.
2. En el panel lateral de Supabase, ve a **SQL Editor**.
3. Abre el archivo `supabase/schema.sql` de este repositorio, copia su contenido y presiona **Run**. Esto creará:
   - Tablas maestras (`sedes`, `proyectos_obras`, `criterios_tecnicos`, `obra_cashflow`, `obra_historial_estados`).
   - Vista dinámica `vw_obras_dashboard` con cálculo de semáforo.
   - Triggers automáticos para auditoría de transiciones y actualización de fechas.
   - Políticas de seguridad por filas (RLS).
4. En el mismo **SQL Editor**, copia y ejecuta `supabase/seed.sql`. Esto importará automáticamente las 221 obras e infraestructura históricas.
5. Ve a **Project Settings ➡️ API** y copia:
   - **Project URL**
   - **anon public key**
6. En la aplicación web, haz clic en el botón superior `⚙️` y pega las claves. ¡Listo! Tu ERP estará sincronizado en la nube.

---

## 🌐 Publicación en GitHub y Despliegue Web

### 1. Subir a GitHub
```bash
git add .
git commit -m "feat: Sistema ERP Seguimiento Obras HIBA v1.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### 2. Desplegar en Vercel / Netlify / GitHub Pages
- **Vercel** (Recomendado):
  1. Conecta tu cuenta de GitHub en [vercel.com](https://vercel.com).
  2. Haz clic en **Add New ➡️ Project** y selecciona tu repositorio.
  3. Despliega con un solo clic. Tendrás una URL segura `https://tu-proyecto.vercel.app` accesible desde cualquier celular, tablet o PC.
- **GitHub Pages**:
  1. En tu repositorio en GitHub, ve a **Settings ➡️ Pages**.
  2. En *Source*, selecciona la rama `main` y la carpeta `/ (root)`.
  3. Haz clic en **Save**. En 1 minuto tendrás tu web online.

---

## 📁 Estructura del Proyecto

```text
├── index.html                  # Aplicación Web ERP principal
├── css/
│   └── style.css               # Estilos, semáforos, Kanban y animaciones
├── js/
│   ├── app.js                  # Lógica de interfaz, vistas y controladores
│   ├── data-store.js           # Gestión del estado, semáforos y exportación
│   ├── initial-data.js         # Datos precargados del Excel (87 obras + 134 infra)
│   └── supabase-client.js      # Conector cliente con Supabase Auth y Database
├── supabase/
│   ├── schema.sql              # DDL PostgreSQL: tablas, enums, triggers, RLS
│   └── seed.sql                # Inserción inicial de datos procesados
├── scripts/
│   ├── parse_excel.py          # Extractor de Excel a JSON estructurado
│   ├── generate_seed_sql.py    # Generador de SQL a partir de JSON
│   └── data_exported.json      # Dataset normalizado
├── Seguimiento_Obras_HIBA_2025.xlsx # Planilla original de referencia
└── README.md                   # Documentación técnica y funcional
```

---

## 👥 Soporte y Mantenimiento
Desarrollado para el seguimiento de infraestructura y equipamiento médico. Para consultas técnicas o adaptación de nuevas métricas, consultar con el equipo de desarrollo.
