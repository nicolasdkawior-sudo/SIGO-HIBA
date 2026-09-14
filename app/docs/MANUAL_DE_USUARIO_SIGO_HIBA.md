# MANUAL DE USUARIO OFICIAL DEL SISTEMA
## SIGO HIBA | Sistema Integral de Gestión de Obras e Inversiones
### Hospital Italiano de Buenos Aires
**Versión de la Plataforma:** 2.2 USD  
**Edición:** Manual Operativo Integral para Usuarios y Administradores  

---

## ÍNDICE DE CONTENIDOS

1. [Introducción y Acceso al Sistema](#1-introducción-y-acceso-al-sistema)
2. [Estructura de la Interfaz y Controles de Navegación](#2-estructura-de-la-interfaz-y-controles-de-navegación)
3. [Guía de Vistas y Módulos](#3-guía-de-vistas-y-módulos)
   - 3.1. Dashboard Ejecutivo
   - 3.2. Tablero Kanban de Etapas
   - 3.3. Listado ERP Integral
   - 3.4. Cronograma Gantt de Plazos
   - 3.5. Cashflow y Planificación Anual
4. [Guía Operativa Paso a Paso por Rol](#4-guía-operativa-paso-a-paso-por-rol)
   - 4.1. Operatoria de Dirección General y Administración
   - 4.2. Operatoria de Dirección Médica (Priorización y Partidas)
   - 4.3. Operatoria de Project Managers (PMs de Proyectos e Infraestructura)
   - 4.4. Operatoria Especial del Equipo Unificado de San Justo
   - 4.5. Operatoria de Compras & Licitaciones
   - 4.6. Operatoria de Auditoría y Control (Solo Lectura)
5. [Gestión Presupuestaria y Cifras en Dólares (USD)](#5-gestión-presupuestaria-y-cifras-en-dólares-usd)
6. [Centro Ágil de Asignación y Reasignación de Obras](#6-centro-ágil-de-asignación-y-reasignación-de-obras)
7. [Generación de Informes Ejecutivos One-Pager (XLS y PDF)](#7-generación-de-informes-ejecutivos-one-pager-xls-y-pdf)
8. [Seguridad, Contraseñas y Bloqueos de Acceso](#8-seguridad-contraseñas-y-bloqueos-de-acceso)

---

## 1. INTRODUCCIÓN Y ACCESO AL SISTEMA

### 1.1. Acceso a la Plataforma
Para ingresar a SIGO HIBA, abra su navegador web (Google Chrome, Microsoft Edge, Safari o Mozilla Firefox) e ingrese a la dirección:
👉 **[https://www.sigohiba.com](https://www.sigohiba.com)** (o `sigohiba.com`).

### 1.2. Inicio de Sesión
1. En la pantalla corporativa de acceso con el logo del **Hospital Italiano de Buenos Aires**, ingrese:
   - **Usuario o Correo Institucional:** Ingrese su identificador de usuario (ej: `admin`, `nicolas`, `palmioli`, `kawior`, `direccion.medica`) o su casilla de correo institucional.
   - **Contraseña:** Ingrese su contraseña autorizada (clave inicial estándar: `Admin2025!`).
2. Puede hacer clic en el ícono del **ojo** para visualizar u ocultar la clave tipeada.
3. Presione la tecla **Enter** o haga clic en **"Ingresar al Sistema"**.
4. El sistema verificará sus credenciales de forma cifrada y accederá inmediatamente al entorno configurado según su departamento y rol.

---

## 2. ESTRUCTURA DE LA INTERFAZ Y CONTROLES DE NAVEGACIÓN

Una vez autenticado, la pantalla se compone de tres zonas principales:

### 2.1. Barra Superior Institucional (Topbar)
- **Identidad HIBA:** Isotipo oficial y versión activa del sistema en dólares (`v2.1 USD`).
- **Estado de Conexión:** Indica si el sistema opera conectado a la nube (`Supabase Cloud` en verde) o en almacenamiento local seguro (`Modo Local` en amarillo).
- **Insignia de Sede:** Informa su sede de operaciones (`Central`, `San Justo`, `Periféricos` o `Todas`).
- **Insignia de Usuario:** Muestra su nombre completo, rol operativo y correo.
- **Botones de Control Superior:**
  - `Salir`: Cierra la sesión activa de forma segura.
  - `Usuarios` *(Solo Admin)*: Panel para dar de alta usuarios, gestionar permisos y restablecer contraseñas.
  - `Asignar Obras` *(Solo Admin)*: Abre el Centro Ágil de Asignación y Reasignación interactivo.
  - `Informe Ejecutivo` *(Solo Admin y Dirección)*: Despliega el resumen One-Pager de control presupuestario y desvíos.
  - `Nueva Obra`: Formulario para registrar una nueva solicitud de obra o estudio de factibilidad.

### 2.2. Barra Superior de Filtros Rápidos
Permite acotar los proyectos visualizados en cualquiera de las pantallas:
- **Dependencia:** Filtra por departamento (para usuarios operativos se fija automáticamente a su departamento asignado).
- **Sede:** `Todas las Sedes`, `Central`, `San Justo`, `Periféricos`.
- **Módulo:** `Todos`, `Obra Civil`, `Infraestructura`.
- **Asignación:** `Todas`, `Mis Obras Asignadas`, `Solo Sin Asignar`.
- **Botón Conmutador de Estado:** Alterna entre ver `Obras Activas`, `Obras Finalizadas` o `Todas`.
- **Buscador Universal:** Búsqueda en tiempo real por código de obra, nombre del proyecto, PM responsable o número de partida presupuestaria.
- **Botón Restablecer:** Limpia todos los filtros y retorna a la vista por defecto de su perfil.

### 2.3. Panel de Tarjetas Resumen (KPIs y Semáforos 100% Automáticos)
- **Cartera Activa USD:** Suma financiera real de todas las obras en `Proyecto`, `En licitación` y `Obras en Curso`. *(Excluye automáticamente Factibilidades y Suspendidas)*.
- **Cálculo Automático de Semáforo (15% antes del plazo final):** En ningún caso se solicita fecha manual de semáforo. El sistema calcula dinámicamente la duración total de la etapa fijada por el responsable y activa la alerta automáticamente:
  - **En Plazo (Verde):** Restan más del 15% de los días totales de la etapa.
  - **Por Vencer (Amarillo):** La obra ingresó en el 15% final del plazo fijado para la etapa (alerta preventiva automática).
  - **Vencida (Rojo):** La fecha límite fue superada sin que se haya certificado el avance.
- **Finalizadas y Suspendidas:** Contadores y montos históricos.
*Nota de usabilidad: Al hacer clic sobre cualquier tarjeta de semáforo o estado, el listado se filtra automáticamente para mostrar solo esas obras.*

---

## 3. GUÍA DE VISTAS Y MÓDULOS

### 3.1. Dashboard Ejecutivo
Ofrece una visión macro del estado de las inversiones:
- Gráficos interactivos de distribución de cartera por etapa (haga clic en una barra del gráfico de etapas para aislar las obras de esa fase).
- Gráficos comparativos de inversión por sede y por tipo de obra.
- Alertas dinámicas de factibilidades pendientes de priorización médica.

### 3.2. Tablero Kanban de Etapas
Distribución visual en columnas por estado de avance:
1. `Estudio de Factibilidad`
2. `Proyecto`
3. `En licitación`
4. `Obras en Curso`
5. `Obras Finalizadas`
6. `Suspendida`

Cada tarjeta presenta el código de obra, nombre, semáforo de plazo, número de partida presupuestaria, monto en USD y PM a cargo. Dispone de botones rápidos para ver detalle, definir plazo o certificar el avance de etapa.

### 3.3. Listado ERP Integral
Tabla de control matricial con columnas detalladas:
- Código y Nombre de la Obra.
- Sede y Departamento Canónico.
- Responsable asignado.
- Etapa actual y Semáforo.
- Monto Obra USD, Monto Equipamiento USD y Monto Total USD.
- Superficie en m2 y Costo Unitario (USD/m2 calculado automáticamente).
- Partida Presupuestaria y Monto Asignado.
- Botones de acción rápida: Editar, Ver Detalle, Asignar y Avanzar.

### 3.4. Cronograma Gantt de Plazos
Visualización cronológica mensual (Enero a Diciembre):
- Permite observar la superposición de proyectos y la duración estimada de cada fase.
- Barra de progreso porcentual visible en cada línea de proyecto.

### 3.5. Cashflow y Planificación Anual
Grilla mensual de flujo de fondos proyectado en USD:
- Desglose mes a mes de los desembolsos previstos.
- Totales consolidados por tipo de inversión (Obra Civil vs Infraestructura).
- Control de desvíos entre presupuesto asignado y ejecución proyectada.

---

## 4. GUÍA OPERATIVA PASO A PASO POR ROL

### 4.1. Operatoria de Dirección General y Administración (`admin`, `nicolas`)
Los administradores cuentan con control absoluto sobre la plataforma:
1. **Creación de Usuarios:** Haga clic en `Usuarios` en el topbar. Complete nombre, usuario, correo, sede, departamento y permisos individuales. El sistema genera una clave provisoria que el nuevo usuario podrá cambiar.
2. **Asignación Rápida:** Utilice el botón `Asignar Obras` para distribuir obras sin asignar entre el equipo técnico en segundos (ver sección 6).
3. **Control Ejecutivo:** Utilice el botón `Informe Ejecutivo` para supervisar desvíos y descargar el informe One-Pager (ver sección 7).

### 4.2. Operatoria de Dirección Médica (`direccion.medica`)
La Dirección Médica interviene en la etapa inicial de viabilidad:
1. **Obras en Factibilidad (Sin Plazos):** Dado que las obras en Estudio de Factibilidad están en análisis técnico preliminar y aún no disponen de partida ni proyecto aprobado, **no computan plazos de entrega ni semáforos de vencimiento**, visualizándose con un badge neutro `"En Análisis"`.
2. En el Dashboard superior se mostrará una barra de alerta destacada si existen obras en factibilidad pendientes de evaluación: *"Atención Dirección Médica: X obras requieren tu evaluación"*.
3. Al pulsar **"Asignar Partida Presupuestaria"**:
   - Deberá ingresar el **Número de Partida Presupuestaria** y el **Monto Oficial en USD**.
   - Se solicitará la **Prioridad / Criticidad Médica** (1★ a 5★).
   - **Regla Canónica de Fallback por Defecto:** Si Dirección Médica no define una criticidad específica en ese momento, el sistema adoptará automáticamente la criticidad técnica previamente cargada por el solicitante, dejando constancia formal y visible en todo el sistema con la leyenda: *"Ponderada por default por no contar con criticidad de Dirección"*.
   - **Semáforo sin ingreso manual:** Al momento de guardar la partida y monto, el sistema **no solicita fecha de semáforo**, ya que el semáforo se calcula de forma 100% automática al 15% del plazo de la etapa.
   - **Salida Automática del Listado de Pendientes:** Una vez asignada la partida y monto (o al avanzar a Proyecto), la obra **desaparece automáticamente de forma inmediata del listado y modal de pendientes de Dirección Médica**.
4. Una vez asignada la partida y monto, la obra queda formalmente habilitada para que el equipo técnico pueda iniciar el desarrollo del `Proyecto`.

### 4.3. Operatoria de Project Managers (`palmioli`, `gallardo`, `kawior`, etc.)
1. **Recepción de Obra y Plazo Obligatorio:**
   - Apenas se le asigna una obra en etapa `Proyecto` u `Obras en Curso`, al hacer clic sobre ella el sistema le exigirá definir la **Fecha Estimada de Fin de Etapa**.
   - El sistema no permitirá certificar avances mientras el plazo de la etapa actual no haya sido declarado.
2. **Avance y Certificación de Etapa:**
   - Cuando el proyecto o la obra concluya, haga clic en el botón **"Avanzar Etapa"**.
   - En la ventana modal de certificación, el sistema le solicitará únicamente registrar la **Fecha Real de Finalización de la Etapa Actual** (limitada a hoy y hasta 7 días hacia atrás).
   - Ingrese las notas u observaciones técnicas de entrega.
   - *Importante:* Usted **no puede** ni debe definir la fecha de la etapa siguiente; dicha fecha la establecerá el nuevo responsable (el Comprador en licitaciones o el PM de obra en ejecución) cuando tome posesión de la misma.

### 4.4. Operatoria Especial del Equipo Unificado de San Justo (`waldemar`, `lopez`)
- **Consulta Integral:** Los usuarios asignados a la sede San Justo pueden visualizar la totalidad de las obras radicadas en San Justo (tanto las correspondientes a obras civiles de arquitectura como las de infraestructura y mantenimiento), facilitando la coordinación interdisciplinaria in situ.
- **Seguridad Operativa:** Aunque pueden ver todas las obras de la sede, **únicamente pueden editar datos y certificar avances de aquellas obras en las que figuren como responsable asignado**. Si intentan avanzar una obra a cargo de otro colega, el sistema denegará la acción informando quién es el titular a cargo.

### 4.5. Operatoria de Compras & Licitaciones (`licitaciones`)
1. Al recibir una obra en etapa `En licitación`, el comprador debe registrar la **Fecha Estimada de Apertura de Sobres / Adjudicación**.
2. Una vez completado el proceso licitatorio, el comprador hace clic en **"Avanzar Etapa"**:
   - Ingresa la fecha de cierre de la licitación.
   - Ingresa el **Nombre / Razón Social del Proveedor Adjudicado**.
   - Ingresa el **Monto Adjudicado en USD** (permite cualquier cifra con centavos).
3. Al confirmar, la obra pasa a `Obras en Curso` y retorna al control del PM de Obra para su inicio físico en el hospital.

### 4.6. Operatoria de Auditoría y Control (`auditor`)
- Perfil configurado en `solo_lectura: true`.
- Permite auditar dashboards, montos comprometidos, desvíos presupuestarios, semáforos y cronogramas sin riesgo de modificaciones accidentales.

---

## 5. GESTIÓN PRESUPUESTARIA Y CIFRAS EN DÓLARES (USD)

### 5.1. Reglas de Entrada Numérica
- Todos los campos monetarios (`Monto Obra USD`, `Monto Equipamiento USD`, `Monto Partida USD`, `Monto Adjudicado USD`) admiten cualquier número real.
- Puede escribir importes con punto o coma decimal (ej: `5684.30` o `5684,30`).
- El sistema formatea automáticamente las cifras al formato contable estándar internacional: `$ 5.684,30 USD`.

### 5.2. Fórmulas de Cálculo Automático
- **Monto Total USD:** `Monto Obra USD + Monto Equipamiento USD`.
- **Costo por Superficie:** `Monto Total USD / Metros Cuadrados (m2)`. *(Si no se ingresan m2 o la obra es de infraestructura pura, el ratio se mantiene en cero sin generar errores).*
- **Desvío Presupuestario:** `Monto Adjudicado / Ejecutado - Monto de Partida Comprometido`.

---

## 6. CENTRO ÁGIL DE ASIGNACIÓN Y REASIGNACIÓN DE OBRAS

Diseñado para que la Dirección pueda delegar decenas de obras rápidamente sin perderse:
1. Haga clic en el botón anaranjado **"Asignar Obras"** en la barra superior.
2. Seleccione en el filtro superior la opción **"Solo Sin Asignar"**.
3. Verá únicamente el listado de proyectos pendientes de responsable.
4. Elija en el selector de cada tarjeta al PM deseado (ej: `Arq. Palmioli`).
5. **Comportamiento dinámico:** Tan pronto asigna la obra, esta **desaparece instantáneamente del listado**, reduciendo el contador de pendientes y permitiéndole avanzar a las siguientes sin confusiones.
6. Si desea reasignar una obra ya comprometida, cambie el filtro a **"Solo Asignadas"** o filtre por el nombre de la persona actual, seleccione el nuevo profesional y confirme la reasignación.

---

## 7. GENERACIÓN DE INFORMES EJECUTIVOS DE DIRECCIÓN (3 PÁGINAS A4 - XLS Y PDF)

1. En la barra superior, haga clic en **"Informe Ejecutivo"** (exclusivo para perfil Administrador y Dirección).
2. Se desplegará el panel oficial estandarizado en **3 Páginas A4 horizontales**:
   - **Página 1 (Resumen General):** KPIs consolidados de cartera, cuadrante de obras en ejecución activa, cartera en estudio de factibilidad (94 obras por USD 20,151,232, desglosadas en 91 sin partida y 3 con partida asignada con prioridad técnica y médica), y auditoría de desvíos en partidas presupuestarias.
   - **Página 2 (Cash Flow Oficial 01/04 - 31/03):** 4 KPIs financieros de desembolso, curva gráfica mensual de 12 barras (Abril a Marzo) distinguiendo en color azul lo ya pagado y en verde azulado lo proyectado a pagar, y tabla analítica por obra con porcentaje de anticipo, saldo y cuota mensual.
   - **Página 3 (Planificación Plurianual y Auditoría):** Desglose territorial por sede (Central, San Justo, Periféricos), por especialidad (Civil vs Infraestructura), auditoría de semáforos de plazo (alertas del 15% final), dictamen oficial de certificación institucional y casilleros para firmas de control.
3. **Opciones de Descarga:**
   - **Exportar XLS (Excel):** Descarga inmediata de un archivo `.xlsx` multi-hoja con desglose pormenorizado de todas las carteras y flujos.
   - **Exportar PDF Oficial:** Compila automáticamente el documento PDF oficial de **3 páginas A4 apaisadas** respetando saltos de página e imagotipos del Hospital Italiano de Buenos Aires.
   - **Imprimir:** Abre el diálogo de impresión del navegador aplicando la hoja de estilos de alta fidelidad.

---

## 8. MATRIZ INTERACTIVA DE CASH FLOW DE OBRAS EN CURSO

1. En el menú de navegación principal, acceda a la pestaña **"Cashflow"**.
2. **Exclusividad Operativa:** La matriz procesa y visualiza **únicamente obras activas en curso**. Las obras en factibilidad o suspendidas no figuran en esta pantalla para reflejar compromisos reales de tesorería.
3. **Pautas de Contratación y Anticipo OC:**
   - Al adjudicar una obra en la etapa licitatoria, el comprador registra el Proveedor, Monto Adjudicado, **Porcentaje de Anticipo (%)** y **Plazo en Meses ($N$)**.
   - **Mes 1:** Recibe el desembolso total del anticipo pactado.
   - **Meses Restantes ($N - 1$):** El saldo restante se prorratea en cuotas mensuales idénticas.
4. **Período Contable Hospitalario (01/04 al 31/03):**
   - El gráfico interactivo de 12 meses visualiza la caída del gasto desde Abril hasta Marzo del ejercicio contable.
   - Los desembolsos anteriores al 01/04 no se incluyen en el flujo del ejercicio actual.
   - Los pagos posteriores al 31/03 se totalizan en la columna **"Ej. Siguientes"** como arrastre plurianual.
5. **Segmentación y Búsqueda:** Utilice los botones superiores para filtrar por *Obra Civil*, *Infraestructura*, estado de partida (*Con Partida* o *Pendiente*), o buscar por código o nombre de contratista.

---

## 9. SEGURIDAD, CONTRASEÑAS Y BLOQUEOS DE ACCESO

- **Política Anti-Fuerza Bruta:** Si se ingresa una contraseña errónea 5 veces consecutivas, el sistema activará un bloqueo de seguridad por **5 minutos**. Aparecerá un temporizador en pantalla indicando el tiempo restante (`05:00`). Durante este lapso, el botón de ingreso quedará deshabilitado.
- **Cierre de Sesión por Inactividad:** Tras 30 minutos sin movimiento del mouse o teclado, la plataforma cerrará la sesión de forma preventiva alertando al usuario y protegiendo datos médicos y presupuestarios sensibles.
- **Cambio de Contraseña:** Si su usuario tiene configurada la directiva de actualización obligatoria, al iniciar sesión se desplegará el modal para establecer su contraseña personal definitiva (mínimo 6 caracteres).

---

## 10. GUÍA OPERATIVA PARA EL PERFIL COMPRADOR (COMPRAS & LICITACIONES)

### 10.1. Visualización Anticipada de la Etapa "Proyecto" (Solo Lectura)
1. Al iniciar sesión con el usuario de Compras (`usr-licitaciones`):
   - En el **Tablero Kanban**, ahora observará la columna **"Proyecto"** encabezada con el distintivo **"👁️ Próximas (Solo Lectura)"**.
   - En el **Embudo del Dashboard**, observará la barra azul correspondiente a los proyectos técnicos en desarrollo.
2. **Propósito Operativo:** Conocer con anticipación las obras que los proyectistas están terminando de diseñar, permitiendo a Compras prever pliegos, contactos con contratistas y armado de compulsa.
3. **Restricción de Seguridad:** En las obras de la columna Proyecto, el comprador **no puede editar datos ni avanzar etapas** (los botones de acción se ocultan y muestran la insignia `👁️ Solo Consulta`). Si abre el modal de detalle, todos los campos permanecerán bloqueados con el banner explicativo: *"Vista Preliminar para Compras (Solo Consulta)"*.

### 10.2. Certificación de Adjudicación con Orden de Compra (OC) y Anticipo Obligatorio
Cuando una obra se encuentra en la etapa **"En licitación"**, el Comprador es el único operador autorizado para certificar su compulsa:
1. Haga clic en el botón azul **"Avanzar"** de la tarjeta o fila de la obra licitada.
2. Se desplegará el panel de **"Adjudicación de la Compulsa"**, donde el sistema le exigirá **obligatoriamente**:
   - **Proveedor Adjudicado (\*):** Razón social formal de la constructora o contratista adjudicado.
   - **Número de Orden de Compra (OC) (\*):** Código o número de la orden de compra emitida (ej: `OC-2026-0892` o `4500012345`).
   - **Monto Total Adjudicado (USD) (\*):** Importe final adjudicado (debe ser mayor a USD 0).
   - **Porcentaje de Anticipo en Orden de Compra (%) (\*):** Ingrese el porcentaje pactado de anticipo contractual (entre 0 y 100%). Si la obra no contempla anticipo financiero, debe cargar obligatoriamente `0`.
   - **Plazo de Ejecución (Meses):** Duración estimada de la obra en meses.
3. **Cuadro Dinámico de Flujo:** A medida que ingresa los valores, el sistema calcula y exhibe en tiempo real:
   - **Anticipo Inicial (Mes 1):** Monto exacto en USD que absorberá la tesorería en el primer mes de obra.
   - **Saldo a Distribuir:** Monto restante y desglose de las cuotas mensuales idénticas para los meses 2 en adelante.
4. Haga clic en **"Confirmar y Avanzar Etapa"**. Si omitió el N° de Orden de Compra o el porcentaje de anticipo, el sistema impedirá el avance y le solicitará completar el dato obligatorio.
5. Al confirmarse, la obra pasa a **"Obras en Curso"**, se registra el N° de OC y condiciones de anticipo en el historial inmutable de auditoría y la obra retorna automáticamente al proyectista técnico para su supervisión en obra.
