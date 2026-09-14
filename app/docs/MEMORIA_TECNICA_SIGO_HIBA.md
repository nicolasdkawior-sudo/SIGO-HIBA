# MEMORIA TÉCNICA Y DE COMPORTAMIENTO DEL SISTEMA
## SIGO HIBA | Sistema Integral de Gestión de Obras e Inversiones
### Hospital Italiano de Buenos Aires
**Versión de Referencia:** 2.2 USD  
**Estado:** Canónico / Base Inmutable de Comportamiento  
**Última Actualización:** Septiembre 2026  

---

## 1. OBJETIVO Y PRINCIPIOS DE DISEÑO

La presente Memoria Técnica constituye la **fuente canónica e inmutable de verdad** respecto a la arquitectura, reglas de negocio, modelo financiero, catálogo de usuarios, permisos por rol y ciclo de vida de los proyectos en el sistema **SIGO HIBA**.

Cualquier evolución, refactorización o cambio de código en la plataforma **debe respetar estrictamente las especificaciones de este documento**, garantizando la eliminación de regresiones o retrocesos funcionales.

### Principios Fundamentales:
1. **Dolarización Total y Flexibilidad Numérica:** Todos los importes se manejan en dólares estadounidenses (USD). El sistema admite números enteros y decimales con coma o punto (ej: `5684,30` o `5684.30`).
2. **Definición de Cartera Activa:** La Cartera Activa de Inversión representa exclusivamente obras en desarrollo con compromiso formal de ejecución: `Proyecto`, `En licitación` y `Obras en Curso`. Quedan **estrictamente excluidas** de este cálculo las obras en `Estudio de Factibilidad` (no aprobadas) y las obras `Suspendidas`.
3. **Gobierno de Plazos y Fechas:** Al cerrar o certificar una etapa, el operador que entrega solo puede registrar la **fecha de fin de la etapa actual** (hoy o hasta 7 días hacia atrás). La fecha de término de la etapa siguiente no puede ser fijada por quien entrega; la **debe definir y comprometer obligatoriamente el nuevo responsable (PM o Comprador)** al recibir la asignación.
4. **Aislamiento Departamental y Excepción San Justo:** Cada departamento técnico solo gestiona sus obras. Como regla especial unificada, los usuarios de la sede San Justo (`Departamento de Mantenimiento y Proyectos San Justo`) pueden visualizar la totalidad de obras de su sede para consulta y coordinación, pero **únicamente pueden editar y certificar el avance de aquellas obras en las que figuren como responsable asignado**.
5. **Seguridad y Trazabilidad:** Almacenamiento seguro de credenciales con hashing SHA-256 + salt, protección anti-fuerza bruta mediante rate limiting, aislamiento de datos con Row Level Security (RLS) en Supabase Cloud y rechazo preventivo de claves secretas (`service_role`) en el frontend.

---

## 2. ARQUITECTURA TÉCNICA Y PILA DE SOFTWARE

- **Frontend Core:** Vanilla JavaScript modular (ES6+), HTML5 Semántico, CSS3 personalizado.
- **Framework de Estilos:** Tailwind CSS (versión compilada/CDN con respaldo de estilos nativos en CSS inline).
- **Librería de Iconografía:** Lucide Icons.
- **Gráficos e Indicadores:** Chart.js para visualización de avance, pipeline y balance de inversión.
- **Exportación de Datos:** 
  - SheetJS (XLSX) para planillas de cálculo detalladas y tablas de datos tabulares.
  - html2pdf.js + Motor de Impresión CSS nativo (`@media print`) para generación de Informes One-Pager Ejecutivos en PDF.
- **Persistencia Híbrida:**
  - `DataStore` en `localStorage` con soporte reactivo multi-pestaña (`window.addEventListener('storage')`).
  - Motor de sincronización en la nube mediante `SupabaseManager` conectado a PostgreSQL en Supabase Cloud.
- **Estructura de Despliegue:**
  - Paridad obligatoria al 100% entre la raíz del repositorio y el subdirectorio `/app`.
  - Configuración de cabeceras de servidor en `vercel.json` (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 3. CICLO DE VIDA DE UNA OBRA (MÁQUINA DE ESTADOS)

El flujo de avance de cada obra se rige por la siguiente secuencia canónica:

```
[1. Estudio de Factibilidad] 
         │ (Requiere Partida Presupuestaria y Monto USD)
         ▼
    [2. Proyecto] 
         │ (PM define plazo al recibir; finaliza y pasa a Compras)
         ▼
  [3. En licitación] 
         │ (Comprador define plazo de pliegos; adjudica con Proveedor y Monto)
         ▼
  [4. Obras en Curso] 
         │ (PM define plazo de obra; inspecciona avance físico)
         ▼
[5. Obras Finalizadas] (Cierre definitivo de inversión)
```

*Estado especial transversal:* `Suspendida` (obra pausada temporal o definitivamente por Dirección).

### 3.1. Detalle por Etapa

#### Etapa 1: Estudio de Factibilidad (Anteproyecto)
- **Propósito:** Análisis de viabilidad técnica, operativa y médica de la solicitud.
- **Condición Presupuestaria:** No cuenta con partida aprobada (figura `S/D` o `Pendiente`).
- **Impacto Financiero:** No computa dentro de la "Cartera Activa USD" de inversión.
- **Priorización Médica:** La Dirección Médica califica la urgencia clínica (`Alta`, `Media`, `Baja`).
- **Requisito para Avanzar a Proyecto:** Es mandatorio que Dirección Médica o Administración asigne formalmente:
  1. Número de Partida Presupuestaria (ej: `P-2026-4412`).
  2. Monto Oficial Asignado en Dólares USD (ej: `5684.30` o cifras mayores).
  *Sin estos dos datos, el sistema bloquea irreversiblemente el pase a Proyecto.*

#### Etapa 2: Proyecto (Desarrollo Técnico Ejecutivo)
- **Ingreso a la Etapa:** Apenas la obra es asignada a un Project Manager (PM), al hacer clic sobre la obra se le exige obligatoriamente definir la **Fecha Estimada de Fin de Proyecto**. La obra permanece marcada como `requiere_plazo_etapa: true` hasta que se establezca esta fecha.
- **Desarrollo:** El PM elabora planos, cómputos y pliegos de especificaciones técnicas.
- **Cierre de Etapa:** Al pulsar "Certificar y Avanzar Etapa":
  - El PM solo puede ingresar la **Fecha de Término de la etapa de Proyecto** (restringida a hoy y hasta 7 días hacia atrás).
  - El PM **no puede definir la fecha de la licitación**.
  - Al confirmar, la obra pasa a `En licitación` y se notifica el traspaso a Compras.

#### Etapa 3: En licitación (Gestión de Compras y Pliegos)
- **Ingreso a la Etapa:** La obra pasa a la bandeja del usuario de Compras & Licitaciones (`licitaciones`).
- **Fijación de Plazo:** El comprador asignado debe ingresar obligatoriamente la **Fecha Estimada de Apertura de Licitación / Adjudicación**.
- **Cierre y Adjudicación:** Para certificar el avance hacia `Obras en Curso`, el sistema exige:
  1. Fecha real de finalización de la licitación.
  2. Razón Social o Nombre del **Proveedor Adjudicado**.
  3. **Monto Total Adjudicado en USD** (permite decimales).
  *El sistema calcula automáticamente si hubo ahorro o sobrecosto respecto a la partida inicial.*

#### Etapa 4: Obras en Curso (Ejecución Física)
- **Ingreso a la Etapa:** La obra retorna al control del PM de Obra o Infraestructura en terreno.
- **Fijación de Plazo:** El PM debe definir la **Fecha Estimada de Entrega / Fin de Obra**.
- **Seguimiento:** Registro de porcentaje de avance físico (0% a 100%), certificación de hitos y control de semáforo de plazos.
- **Cierre:** Al alcanzar el 100%, el PM certifica la fecha de fin de obra y traslada el proyecto a `Obras Finalizadas`.

#### Etapa 5: Obras Finalizadas
- Representa la culminación operativa y recepción definitiva. Las obras finalizadas no cuentan dentro de la cartera viva en curso, pero se conservan en el histórico y en los reportes de inversiones ejecutadas.

---

## 4. MODELO DE USUARIOS, DEPENDENCIAS Y ROLES

### 4.1. Catálogo Oficial de Dependencias Canónicas
1. `Dirección General / Administración`
2. `Departamento de Proyectos Central`
3. `Departamento de Mantenimiento Central`
4. `Departamento de Mantenimiento y Proyectos San Justo` *(Unificación canónica de Proyectos y Mantenimiento San Justo)*
5. `Departamento de Instalaciones`

---

### 4.2. Matriz de Usuarios y Credenciales de Referencia

| ID | Nombre Completo | Usuario | Correo Institucional | Dependencia | Sede | Rol | Permisos Específicos |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `usr-admin` | Dirección General (Admin) | `admin` | `admin.obras@hospitalitaliano.org.ar` | Dirección General / Administración | Todas | `admin` | Control total, asignación de partida, creación y avance |
| `usr-nicolas` | Nicolas Kawior (Admin) | `nicolas` | `nicolasdkawior@gmail.com` | Dirección General / Administración | Todas | `admin` | Control total, gestión de usuarios, reasignación ágil |
| `usr-dir-medica` | Dirección Médica HIBA | `direccion.medica` | `direccion.medica@hospitalitaliano.org.ar` | Dirección General / Administración | Todas | `direccion_medica` | `puede_priorizar_medica: true`, `puede_asignar_partida: true`, `puede_crear: false`, `puede_avanzar: false` |
| `usr-palmioli` | Arq. Palmioli (PM Central) | `palmioli` | `palmioli.central@hospitalitaliano.org.ar` | Departamento de Proyectos Central | Central | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
| `usr-gallardo` | Arq. Gallardo (PM Obras) | `gallardo` | `gallardo.obras@hospitalitaliano.org.ar` | Departamento de Proyectos Central | Central | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
| `usr-sulpis` | Arq. Sulpis (PM Obras) | `sulpis` | `sulpis.obras@hospitalitaliano.org.ar` | Departamento de Proyectos Central | Central | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
| `usr-kawior-pm` | Ing. Kawior (PM Infraestructura) | `kawior` | `kawior.infra@hospitalitaliano.org.ar` | Departamento de Mantenimiento Central | Central | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
| `usr-boselli` | Ing. Boselli (PM Infraestructura) | `boselli` | `boselli.infra@hospitalitaliano.org.ar` | Departamento de Mantenimiento Central | Central | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
| `usr-vasquez` | Ing. Vasquez (PM Infraestructura) | `vasquez` | `vasquez.infra@hospitalitaliano.org.ar` | Departamento de Mantenimiento Central | Central | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
| `usr-gimenez` | Ing. Giménez (PM Infraestructura) | `gimenez` | `gimenez.infra@hospitalitaliano.org.ar` | Departamento de Mantenimiento Central | Central | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
| `usr-waldemar` | Ing. Waldemar (PM San Justo) | `waldemar` | `waldemar.sanjusto@hospitalitaliano.org.ar` | Departamento de Mantenimiento y Proyectos San Justo | San Justo | `pm_obra` | Visibilidad de toda la sede; avance exclusivo de sus obras asignadas |
| `usr-lopez` | Ing. López (PM Infraestructura) | `lopez` | `lopez.infra@hospitalitaliano.org.ar` | Departamento de Mantenimiento y Proyectos San Justo | San Justo | `pm_obra` | Visibilidad de toda la sede; avance exclusivo de sus obras asignadas |
| `usr-cossano` | Arq. Cossano (PM Periféricos) | `cossano` | `cossano.perifericos@hospitalitaliano.org.ar` | Departamento de Instalaciones | Periféricos | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
| `usr-licitaciones` | Compras & Licitaciones | `licitaciones` | `licitaciones@hospitalitaliano.org.ar` | Dirección General / Administración | Todas | `licitaciones` | Gestión exclusiva de etapa En Licitación y adjudicación |
| `usr-auditor` | Auditoría y Control | `auditor` | `auditor@hospitalitaliano.org.ar` | Dirección General / Administración | Todas | `visualizador` | `solo_lectura: true`, visualización y descarga de informes sin edición |

*Contraseña Maestra por Defecto:* `Admin2025!` (con obligación de cambio individual si se activa la bandera `debe_cambiar_clave`).

---

## 5. MÓDULOS ESPECIALIZADOS Y REGLAS DE NEGOCIO

### 5.1. Centro de Asignación y Reasignación Ágil de Obras (Modal Interactivo)
- Accesible exclusivamente por usuarios con rol `admin` (`btnAsignarObrasTop`).
- Dispone de tres filtros en tiempo real:
  1. **Filtro de Asignación:** `Solo Sin Asignar`, `Solo Asignadas`, `Todas`.
  2. **Filtro de Departamento:** Central, San Justo, Periféricos, etc.
  3. **Filtro de Responsable:** Listado individual de PMs.
- **Comportamiento Dinámico:**
  - Cuando se visualiza el filtro "Solo Sin Asignar" y el administrador asigna una obra a un PM, la tarjeta **desaparece de inmediato** de la vista, permitiendo asignar en ráfaga el resto de las obras sin perder el foco ni confundirse por volumen.
  - Para reasignar una obra ya comprometida, el administrador selecciona el responsable actual y traslada la obra a otro profesional en un solo clic.

### 5.2. Informe Ejecutivo One-Pager (Solo Dirección y Administración)
- Accesible mediante el botón `Informe Ejecutivo` en la barra superior (`btnExecutiveReportTop`).
- **Diseño Ultra Concentrado:** Formateado específicamente para no superar **una sola pantalla** en monitor y **una sola hoja A4 apaisada** al imprimir o exportar a PDF.
- **Contenido Consolidado:**
  - Cartera Activa de Inversión (Proyecto, Licitación, En Curso).
  - Obras en Factibilidad sin partida aprobada y obras Suspendidas (en sección de alerta separada).
  - Estado de Semáforos de Plazo (En Plazo, Por Vencer, Vencidas).
  - Desglose de Cashflow proyectado y ejecutado.
  - Balances de Partidas Presupuestarias Sobreejecutadas y Sub-ejecutadas.
- **Exportaciones Integradas:**
  - `Exportar XLS (Excel)`: Genera un archivo `.xlsx` estructurado en pestañas tabulares con el detalle financiero.
  - `Exportar PDF Oficial`: Compila el One-Pager a documento PDF vectorial mediante `html2pdf.js`, incluyendo el imagotipo oficial del Hospital Italiano de Buenos Aires.
  - `Imprimir`: Invoca la hoja de estilos optimizada `@media print`.

### 5.3. Sistema de Semáforos y Alertas Temporales
- **En Plazo (Verde):** La fecha estimada de fin de etapa es superior a 15 días respecto a la fecha actual.
- **Por Vencer (Amarillo):** La fecha estimada de término vence en los próximos 15 días.
- **Vencido (Rojo):** La fecha estimada de término es anterior a la fecha actual y la etapa no ha sido completada.
- **Regla de Cálculo:** El semáforo evalúa la fecha de la etapa actual en curso (`fecha_fin_etapa` o `fecha_fin_estimada`).

---

## 6. SEGURIDAD Y BLINDAJE INSTITUCIONAL

1. **Anti-Fuerza Bruta (Rate Limiting):**
   - Máximo de 5 intentos fallidos consecutivos por navegador/IP.
   - Bloqueo temporal automático por 5 minutos (`SecurityManager.LOCKOUT_DURATION_MS = 300000`).
   - Retardo progresivo anti-timing entre intentos fallidos para mitigar ataques automatizados de diccionario.
2. **Protección de Datos y Crawlers:**
   - Archivo `robots.txt` que bloquea la indexación de motores de búsqueda (`User-agent: * Disallow: /`).
   - Meta etiquetas `robots` y `googlebot` con directivas `noindex, nofollow, noarchive, nosnippet`.
3. **Manejo Seguro y Desacople de Base de Datos (Configuración Exclusiva en Backend):**
   - La configuración de conexión a Supabase Cloud (URL y API Key) está **estrictamente desacoplada de la interfaz de usuario visual**. Se eliminó cualquier botón de engranaje o modal de configuración en el frontend para impedir que cualquier usuario o atacante acceda, altere o visualice la configuración de la base de datos.
   - Las conexiones se gestionan e inyectan exclusivamente a nivel de backend, servidor o variables de entorno del despliegue (`window.__SUPABASE_CONFIG__` o entorno servidor).
   - Validación preventiva en cliente: rechazo automático e inmediato de claves secretas `service_role`.
   - Políticas RLS (Row Level Security) estrictas en PostgreSQL.
4. **Cierre de Sesión por Inactividad:**
   - Temporizador de 30 minutos de inactividad que cierra la sesión activa automáticamente y devuelve al usuario a la pantalla de acceso institucional.
