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
- **Propósito:** Análisis de viabilidad técnica, operativa y médica de la solicitud preliminar.
- **Condición Presupuestaria:** No cuenta con partida aprobada (figura `S/D` o `Pendiente`) ni fondos asignados.
- **Impacto Financiero:** No computa dentro de la "Cartera Activa USD" de inversión ni en el Cash Flow.
- **Supresión Absoluta de Plazos y Fechas Límite:**
  - Dado que la obra está aún en análisis preliminar y no tiene dinero asignado ni proyecto, **en Factibilidad NO se indican ni computan plazos**.
  - `calculateSemaforo` retorna un estado neutro `'en_analisis'` (badge gris *"En Análisis"*, `noPlazo: true`, `days: null`), suprimiendo contadores de días, alertas de atraso y fechas límite en todas las vistas (Lista, Tabla, Kanban, Gantt y Modal).
- **Solicitud Obligatoria de Prioridad Médica, Fallback Default y Salida de Pendientes:**
  - Al cargar la partida presupuestaria y su monto en USD, es **indispensable solicitar la Prioridad / Criticidad Médica** a ser definida por la Dirección Médica.
  - **Regla Canónica de Fallback por Defecto:** En caso de que la prioridad médica no esté cargada o se deje sin especificar, la criticidad médica será **idéntica a la técnica previamente cargada**, y quedará formal y visiblemente indicada en todo el sistema con la leyenda *"Ponderada por default por no contar con criticidad de Dirección"*.
  - **Salida Automática de Pendientes de Dirección Médica:** Al momento de asignarse la partida y su monto (con criticidad médica igualada a la técnica) y avanzar a la etapa de Proyecto, la obra **desaparece automáticamente de forma inmediata del listado y modal de pendientes de Dirección Médica**.
- **Semáforo 100% Automático (Sin Solicitud Manual):** En las etapas con plazo contractual (`Proyecto`, `En licitación`, `Obras en Curso`), el semáforo es 100% automático: calcula la duración total definida por el autorizado y activa la alerta amarilla (*Por vencer*) automáticamente **15% antes del plazo final**, sin solicitar fechas de semáforo manuales.
- **Requisito para Avanzar a Proyecto:** Es mandatorio que Dirección Médica o Administración asigne formalmente:
  1. Número de Partida Presupuestaria (ej: `P-2026-4412`).
  2. Monto Oficial Asignado en Dólares USD (ej: `5684.30` o cifras mayores).
  3. Registro de Prioridad Médica (específica o ponderada por default).
  *Sin estos datos, el sistema bloquea irreversiblemente el pase a Proyecto.*

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
6. `Departamento de Centros Periféricos` *(Ctros. Periféricos)*
7. `Departamento de Habilitaciones y Seguridad e Higiene`

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
| `usr-cossano` | Arq. Ana Cossano (PM San Justo) | `cossano` | `ana.cossano@hospitalitaliano.org.ar` | Departamento de Mantenimiento y Proyectos San Justo | San Justo | `pm_obra` | Visibilidad de toda la sede; avance exclusivo de sus obras asignadas |
| `usr-pm-perifericos` | Arq. Coordinador Periféricos (PM) | `pm.perifericos` | `perifericos.obras@hospitalitaliano.org.ar` | Departamento de Centros Periféricos | Periféricos | `pm_obra` | `puede_crear: true`, `puede_avanzar: true` |
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

---

## 7. REGLA CANÓNICA DE CASH FLOW DE OBRAS EN CURSO Y PERÍODO CONTABLE (01/04 - 31/03)

### 7.1. Exclusividad Estricta de Obras Activas en Curso
- **Alcance del Cash Flow:** El flujo financiero institucional computa **única y exclusivamente** las obras activas en ejecución (`estado === 'Obras en Curso'`).
- **Exclusión Absoluta:** Las obras en *Estudio de Factibilidad*, *Ante Proyecto*, *Proyecto*, *En licitación* o *Suspendidas* **NO aparecen ni computan en el Cash Flow**, evitando distorsiones financieras causadas por iniciativas no adjudicadas o capital inmovilizado.

### 7.2. Anticipo de Orden de Compra (%) y Distribución del Saldo
- **Captura en Adjudicación:** Al adjudicar la compulsa, el Comprador registra:
  - Proveedor adjudicatario.
  - Monto adjudicado total en USD.
  - **Porcentaje de Anticipo (%)** pactado contractualmente en la Orden de Compra (OC).
  - **Plazo de Ejecución en Meses ($N$).**
- **Algoritmo de Caída del Flujo:**
  - **Mes 1 (Desembolso Inicial):** Absorbe íntegramente el anticipo pactado:
    $$\text{Anticipo USD} = \text{Monto Total} \times \frac{\text{Porcentaje Anticipo}}{100}$$
  - **Meses 2 a $N$ ($N - 1$ meses restantes):** El saldo remanente se distribuye de manera estrictamente uniforme:
    $$\text{Saldo USD} = \text{Monto Total} - \text{Anticipo USD}$$
    $$\text{Cuota Mensual} = \frac{\text{Saldo USD}}{N - 1}$$
  - **Caso Testigo:** Para una obra de USD 1.000.000 a 10 meses con 30% de anticipo: Mes 1 = USD 300.000; Meses 2 a 10 = USD 77.777,78 cada mes.

### 7.3. Período Contable Oficial del HIBA (01/04 al 31/03)
- **Ciclo Fiscal Institucional:** El ejercicio económico hospitalario inicia el 1° de Abril y finaliza el 31 de Marzo del año siguiente (12 meses: Abr, May, Jun, Jul, Ago, Sep, Oct, Nov, Dic, Ene, Feb, Mar).
- **Tratamiento de Ejercicios:**
  - **Ejercicios Anteriores ($< \text{01/04}$):** Se **excluyen formalmente** de la curva de cash flow del ejercicio actual para no arrastrar gastos devengados en períodos cerrados.
  - **Ejercicio en Curso:** Se computa mes a mes diferenciando lo **Ya Pagado** (meses transcurridos) de lo **Proyectado a Pagar** (mes en curso y meses subsiguientes).
  - **Ejercicios Siguientes ($> \text{31/03}$):** Se totalizan como **Arrastre Plurianual Futuro**, exponiendo con claridad el impacto presupuestario que trasciende al ejercicio vigente.

---

## 8. INFORME OFICIAL A LA DIRECCIÓN GENERAL (3 PÁGINAS A4 LANDSCAPE)

El reporte ejecutivo para comités de Dirección, Finanzas y Auditoría fue rediseñado y estandarizado en un formato de **3 Páginas A4 horizontales**, optimizado para visualización web interactiva, impresión física y exportación a PDF:

1. **Página 1 — Resumen Ejecutivo & Estado General de Cartera:**
   - Membrete oficial del Hospital Italiano de Buenos Aires con sello institucional de auditoría.
   - 4 KPIs C-Level: Obras en Ejecución, Estudios de Factibilidad en Cartera (**94 obras consolidadas por USD 20,151,232**, con desglose transparente y fidedigno de 91 obras sin partida por USD 19,616,232 y 3 obras con partida asignada por USD 535,000), Desvíos Presupuestarios en Partidas y Obras Suspendidas.
   - Cuadrante de Obras en Curso con montos y avance físico ponderado.
   - Cuadrante de Cartera en Factibilidad identificando estado de partida ("Sin Partida" vs "Part. N° X") y criticidades técnicas y médicas.
   - Auditoría de Partidas Presupuestarias con desglose de sobre-ejecutadas (déficit) y sub-ejecutadas (remanente liberable).
2. **Página 2 — Cash Flow Oficial de Obras en Curso (01/04 a 31/03):**
   - 4 KPIs Financieros: Cartera en Curso, Presupuesto Ejercicio (Pagado vs Proyectado), Total Anticipos OC (Mes 1) y Arrastre Ejercicios Futuros.
   - Gráfico de barras de 12 meses (Abril a Marzo) con la curva mensual de caída del gasto de inversiones, coloreando en azul sólido lo pagado y en verde azulado lo proyectado.
   - Tabla detallada por obra en ejecución con anticipo OC (Mes 1), plazo, saldo mensual y afectación al ejercicio.
3. **Página 3 — Planificación Plurianual, Análisis Territorial y Certificación:**
   - Análisis Territorial por Sede: Central, San Justo y Centros Periféricos.
   - Distribución por Especialidad / Módulo: Obra Civil vs Infraestructura Hospitalaria.
   - Control de Semáforos Contractuales y alertas del 15% final del plazo.
   - Dictamen Institucional de Auditoría y Certificación de Inversiones con validez ejecutiva.
   - Casilleros formales para 3 firmas: Responsable de Partidas, Director de Compras/Contrataciones y Dirección General / Consejo Directivo.

---

## 9. PERFIL COMPRADOR (LICITACIONES): ADJUDICACIÓN CON ORDEN DE COMPRA (OC) Y ANTICIPO OBLIGATORIO + VISIBILIDAD PREVENTIVA DE PROYECTOS

### 9.1. Adjudicación Obligatoria de Licitaciones
- **Campos Estrictamente Obligatorios al Certificar Avance a "Obras en Curso":**
  1. **Razón Social del Proveedor Adjudicado** (`proveedor`): Bloquea el pase si está vacío.
  2. **Número de Orden de Compra (OC)** (`orden_compra` / `numero_oc`): Identificador contractual formal de compra hospitalaria (ej: `OC-2026-0892` o `4500012345`). Bloquea si está vacío.
  3. **Monto Total Adjudicado en USD** (`monto_adjudicado_usd`): Monto formal resultante de la compulsa de precios. Bloquea si es $\le 0$.
  4. **Porcentaje de Anticipo en Orden de Compra (%)** (`anticipo_porcentaje`): Obligatorio registrar un valor numérico entre 0% y 100% (cargar 0 si contractualmente no lleva anticipo). Bloquea si se deja vacío o no es un número válido.
  5. **Plazo de Ejecución en Meses** (`plazo_meses`): Duración estimada para el prorrateo de saldo en el Cash Flow.
- **Trazabilidad e Historial Contractual:**
  - El sistema genera una traza inmutable en el historial que incluye el número de OC, el monto adjudicado y las condiciones de anticipo:  
    `Compulsa finalizada y adjudicada a '[Proveedor]' por USD [Monto] [OC N° [OC]] (Anticipo OC: X% - USD Y) [Plazo: Z meses]. Retorna al proyectista [Responsable] en Obras en Curso.`
  - Al adjudicarse, la obra retorna automáticamente a la responsabilidad operativa del Proyectista técnico original.

### 9.2. Visibilidad Preventiva de Proyectos para el Comprador (Solo Lectura Estricta)
- **Objetivo Operativo:** El departamento de Compras & Licitaciones debe conocer con antelación el pipeline de obras técnicas en elaboración para planificar compulsa de precios, armado preliminar de pliegos y precalificación de contratistas.
- **Acceso en Tableros y Listados:**
  - En el Tablero Kanban y Listados, el Comprador visualiza la columna **"Proyecto"** con distintivo visual `👁️ Próximas (Solo Lectura)`.
  - En el Embudo del Dashboard, se incluye la barra de etapa **"Proyecto"** destacada en azul para previsión presupuestaria.
- **Aislamiento y Bloqueo de Acciones:**
  - El Comprador **no puede editar, modificar datos maestros ni avanzar obras en etapa Proyecto** (`canUserEditObra(item) === false` y `canUserAdvanceItem(item) === false`).
  - En las tarjetas y filas de tabla, se ocultan los botones de "Editar" y "Avanzar", mostrándose la insignia `👁️ Solo Consulta`.
  - Si el Comprador abre el modal de una obra en Proyecto, el sistema se bloquea en modo solo lectura con banner explicativo: *"Vista Preliminar para Compras (Solo Consulta): Esta obra se encuentra en etapa de Proyecto técnico. El Comprador puede visualizar su alcance para previsión de adquisiciones y pliegos, pero no puede editarla ni avanzarla hasta que pase a licitación"*.

---

## 10. DIRECTIVA PERMANENTE DE MANTENIMIENTO DE MEMORIA TÉCNICA, BLINDAJE DE CONFIGURACIONES Y NO REGRESIÓN

### 10.1. Obligatoriedad de Actualización de Memoria en Cada Modificación
- **Regla de Oro de Desarrollo:** A partir de esta versión, **toda modificación funcional, estética, estructural o de datos que se introduzca en la plataforma SIGO-HIBA debe ir acompañada obligatoriamente de la actualización inmediata de la Memoria Técnica (`docs/MEMORIA_TECNICA_SIGO_HIBA.md`) y del Manual de Usuario (`docs/MANUAL_DE_USUARIO_SIGO_HIBA.md`)**, tanto en la raíz como en la carpeta canónica de distribución `app/docs/`.
- **Prohibición Estricta de Regresiones:** Queda formalmente prohibido revertir el sistema a opciones o diseños pasados que ya fueron revisados, superados o descartados por la administración institucional. El código base debe respetar invariablemente los consensos alcanzados.

### 10.2. Blindaje de Configuraciones y Parámetros Operativos
- **Inmutabilidad de Parámetros No Autorizados:** Todas las configuraciones operativas del sistema (catálogo de cuentas de usuario, roles, dependencias hospitalarias, asignaciones de carteras, sedes, partidas presupuestarias, montos, fechas contables, reglas de factibilidad sin plazos y distribución de cash flow con anticipo OC) forman parte de la memoria técnica canónica.
- **Prevención de Cambios Arbitrarios:** Ninguna actualización o despliegue futuro podrá alterar, resetear o modificar estas configuraciones sin una solicitud explícita, documentada y autorizada por la Administración de Obras e Infraestructura del HIBA.

---

## 11. LÍNEA DE BASE DE CONFIGURACIÓN Y DATOS MAESTROS DEL SISTEMA (ESTADO VIGENTE AUDITADO)

La siguiente línea de base documenta el estado maestro y canónico de la plataforma SIGO-HIBA para garantizar su preservación integral:

### 11.1. Cartera Global de Obras (221 Obras Auditadas)
- **Volumen Total:** 221 registros de obras e infraestructura en base de datos.
- **Estudio de Factibilidad (94 Obras - USD 20,151,232):**
  - **91 Obras Sin Partida Asignada:** Monto estimado total de **USD 19,616,232**. Permanecen en análisis de viabilidad técnica y médica. No poseen plazos de ejecución definidos ni cronogramas comprometidos.
  - **3 Obras Con Partida Asignada:** Monto total de **USD 535,000**. Cuentan con partida presupuestaria asignada por la administración y avanzan a anteproyecto/proyecto según prioridad.
  - **Regla de Asignación Administrativa Directa:** Si el Administrador asigna partida presupuestaria y monto a una obra en Factibilidad que aún no contaba con ponderación de la Dirección Médica, el sistema iguala automáticamente la criticidad médica a la técnica y avanza la obra a etapa de Proyecto, removiéndola de inmediato del listado de obras pendientes de ponderación de la Dirección Médica.
- **Obras en Curso (Ejecución Activa):** Cartera con contratistas adjudicados, número de Orden de Compra (OC), porcentaje de anticipo contractual (Mes 1) y plazo de ejecución en meses.
- **Etapas Intermedias:** Ante Proyecto, Proyecto y En Licitación.

### 11.2. Catálogo Maestro de Usuarios, Roles y Dependencias
El sistema cuenta con un catálogo estructurado de usuarios auditados con permisos granulares por perfil:
1. **Administrador (`admin`):**
   - Nombre: *Superintendencia de Obras e Infraestructura*
   - Rol: `admin` | Sede: `Todas las Sedes` | Dependencia: `Infraestructura & Mantenimiento`
   - Permisos: Control total, asignación de carteras, creación/edición/eliminación de usuarios, forzado de claves, configuración de partidas y cambio manual de etapas.
2. **Proyectistas Técnicos:**
   - `usr-proyectista-1` (*Arq. Mariana Bianchi* - Sede Central - Obra Civil)
   - `usr-proyectista-2` (*Ing. Alejandro Gómez* - Sede San Justo - Infraestructura Hospitalaria)
   - `usr-proyectista-3` (*Arq. Valeria Rossi* - Sede Central - Obra Civil)
   - `usr-proyectista-4` (*Arq. Roberto Castro* - Centros Periféricos - Obra Civil / Refacciones)
   - Rol: `proyectista` | Permisos: Gestión técnica, avance en Factibilidad, Anteproyecto, Proyecto y Obras en Curso de sus obras asignadas.
3. **Comprador / Licitaciones:**
   - `usr-licitaciones` (*Lic. Martín Soria*)
   - Rol: `comprador` | Sede: `Todas las Sedes` | Dependencia: `Compras & Contrataciones`
   - Permisos: Gestión exclusiva de la etapa "En licitación", adjudicación vinculante con carga obligatoria de Proveedor, N° de Orden de Compra (OC), Monto Adjudicado USD y Porcentaje de Anticipo OC (%). Visualización preventiva en modo Solo Lectura de la etapa "Proyecto" sin permisos de edición ni avance.
4. **Dirección Médica & Asistencial:**
   - `usr-dir-central` (*Dr. Marcelo Fernández* - Dirección Médica Sede Central)
   - `usr-dir-sanjusto` (*Dra. Claudia Morales* - Dirección Médica Sede San Justo)
   - `usr-dir-perifericos` (*Dr. Gabriel Pérez* - Dirección Médica Centros Periféricos)
   - Rol: `direccion_medica` | Permisos: Ponderación de criticidad médica (Alta/Media/Baja), justificación clínica y aprobación de viabilidad médica en obras de Factibilidad de su jurisdicción.
5. **Jefatura de Obras & Mantenimiento:**
   - `usr-mant-central` (*Ing. Walter Rossi* - Sede Central)
   - `usr-mant-sanjusto` (*Arq. Fernando Delgado* - Sede San Justo)
   - Rol: `jefe_mantenimiento` | Dependencia: `Infraestructura & Mantenimiento`
6. **Auditoría & Presupuesto:**
   - `usr-auditoria` (*Contadora Sofía Benítez*)
   - Rol: `auditor` | Sede: `Todas las Sedes` | Dependencia: `Administración & Finanzas`

### 11.3. Catálogo Oficial de Dependencias Hospitalarias
- **Dirección Médica Central**
- **Dirección Médica San Justo**
- **Centros Periféricos** (Incorporada formalmente para unificar la supervisión de la red de consultorios y centros ambulatorios externos del hospital)
- **Departamento de Habilitaciones y Seguridad e Higiene** (Incorporada formalmente para la gestión integral de normativas y seguridad laboral)
- **Infraestructura & Mantenimiento**
- **Compras & Contrataciones**
- **Administración & Finanzas**

### 11.4. Sedes Hospitalarias Oficiales
- **Central** (Sede Almagro / Potosí)
- **San Justo** (Campus Universitario & Hospitalario San Justo)
- **Centros Periféricos** (Red de Centros Médicos Ambulatorios)
- **Todas las Sedes** (Jurisdicción global institucional)

### 11.5. Reglas Financieras y Período Contable Canónico
- **Período Contable Oficial:** Del 01 de Abril al 31 de Marzo del año siguiente (12 meses).
- **Tratamiento de Ejercicios:** Desembolsos $< \text{01/04}$ no computan en el ejercicio vigente; desembolsos $> \text{31/03}$ se computan como arrastre a ejercicios futuros.
- **Distribución de Anticipo OC y Saldo:** Mes 1 = Anticipo pactado (%); Meses 2 a N = Saldo distribuido en partes iguales.
- **Semáforo de Plazos:** Alerta temprana preventiva en el último 15% del plazo contractual restante.

---

## 12. ESTÁNDARES UI/UX: TABLAS ANCHAS, SCROLLBARS VISIBLES Y COLUMNAS DE ACCIÓN ANCLADAS (STICKY)

Para garantizar una experiencia visual óptima y continua en toda la organización hospitalaria, especialmente en computadoras de menor resolución (laptops estándar 1366x768, pantallas con escalado de Windows a 125%/150% o ventanas no maximizadas):

### 12.1. Problema Abordado
En pantallas estrechas, tablas de gestión complejas con múltiples columnas de datos y botones de control (como la tabla de *Administración de Usuarios y Permisos*) sufrían desbordamientos donde los botones de la derecha quedaban ocultos fuera de la vista y la barra de desplazamiento horizontal nativa era invisible o inaccesible.

### 12.2. Solución de Ingeniería Implementada
1. **Contenedor con Scrollbar Visible y Estilizado (`custom-scrollbar`):**
   - Se implementó en `css/style.css` una barra de desplazamiento horizontal continua con track gris claro visible (`#e2e8f0`), thumb deslizante gris azulado (`#94a3b8`) con efecto hover oscurecido (`#64748b`), altura cómoda de 10px y soporte cruzado para navegadores Chromium, Safari y Firefox (`scrollbar-width: thin; scrollbar-color: #94a3b8 #e2e8f0;`).
2. **Ancho Mínimo de Tabla Garantizado (`min-w-[1050px]`):**
   - La tabla de usuarios posee un ancho mínimo forzado que evita el aplastamiento de nombres, correos, insignias de rol, dependencias y contadores de obras a cargo.
3. **Columna de Acciones Anclada y Fija a la Derecha (`sticky-action-col`):**
   - La columna cabecera y celdas de **Acciones de Control** cuentan con clase `.sticky-action-col` (`position: sticky; right: 0; z-index: 10`).
   - Posee un ancho mínimo holgado (`min-w-[340px]`), fondo sólido (`bg-white`) con respuesta cromática al pasar el cursor (`group-hover:bg-slate-50`), borde divisor izquierdo y una sombra lateral suave (`box-shadow: -6px 0 10px -4px rgba(0, 0, 0, 0.08)`).
   - Todos los botones de acción (`Asignar`, `Permisos`, `Quitar/Habilitar Acceso`, `Forzar Clave`, `Eliminar`, `Simular`) cuentan con propiedad `shrink-0`, impidiendo cualquier deformación o salto de línea.
4. **Resultado Operativo:**
   - El Administrador puede navegar y scrollear horizontalmente para inspeccionar cualquier columna de la tabla mientras **la botonera de control permanece permanentemente fija, visible y accesible en el extremo derecho de la pantalla**, garantizando control total en cualquier computadora de la institución.

---

## 13. GESTIÓN DE IDENTIDAD OPERATIVA, BLINDAJE DE SAN JUSTO Y DEPARTAMENTO DE HABILITACIONES Y SEGURIDAD E HIGIENE

### 13.1. Corrección Canónica de Arq. Ana Cossano y Blindaje de Obras de San Justo
- **Adscripción Operativa de la Arq. Cossano:** La Arq. Ana Cossano (`usr-cossano`) forma parte canónica del **Departamento de Mantenimiento y Proyectos San Justo** con sede asignada en `San Justo`.
- **Persistencia Inmutable en Modificación de Usuarios:** Se eliminó cualquier mecanismo de sobreescritura automática que restableciera la dependencia de usuarios existentes a valores por defecto en el arranque. Toda modificación realizada por el Administrador en la gestión de permisos se preserva de manera definitiva e inmutable en el almacenamiento del sistema.
- **Blindaje de Cartera de San Justo:** Las obras radicadas en la sede San Justo (incluyendo `OBRA-054` "Nuevo Horno Rational + Obra" y `OBRA-059` "Farmacia - Óptica - Recuperación") pertenecen exclusivamente al departamento unificado de San Justo y no pueden derivar a Centros Periféricos, corrigiendo cualquier discrepancia visual en las insignias de las obras.
- **PM Dedicado para Centros Periféricos:** Se estableció una cuenta dedicada (`usr-pm-perifericos` - Arq. Coordinador Periféricos) para la gestión técnica independiente de la red de centros médicos externos.

### 13.2. Incorporación de la Dependencia Oficial "Habilitaciones y Seguridad e Higiene"
- **Nueva Dependencia Institucional:** Se incorporó formalmente el **Departamento de Habilitaciones y Seguridad e Higiene** a la matriz canónica del hospital.
- **Disponibilidad Transversal en la Plataforma:** Se encuentra habilitada de forma transversal en:
  1. Formulario de Alta de Nuevos Usuarios (`#newUserDependencia`).
  2. Modal de Edición de Permisos de Usuarios (`#editUserDependencia`).
  3. Selector de Dependencia en la Ficha de Obra (`#modalObraDependenciaSelect`).
  4. Filtros de visualización por dependencia en el Tablero Principal y en la Asignación de Obras.


