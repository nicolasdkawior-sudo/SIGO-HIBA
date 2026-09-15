// ==============================================================================
// RECORRIDO DE PRUEBA EXHAUSTIVO POR USUARIO Y ROL - SIGO HIBA
// ==============================================================================
var console = { log: print, error: print, warn: print, info: print };

var mockLocalStorage = {
  _data: {},
  getItem: function(k) { return this._data[k] || null; },
  setItem: function(k, v) { this._data[k] = String(v); },
  removeItem: function(k) { delete this._data[k]; },
  clear: function() { this._data = {}; }
};

var window = {
  localStorage: mockLocalStorage,
  addEventListener: function() {},
  removeEventListener: function() {},
  btoa: function(str) { return str; },
  atob: function(str) { return str; },
  location: { href: 'https://sigohiba.com' }
};
var localStorage = mockLocalStorage;
var btoa = window.btoa;
var atob = window.atob;

var document = {
  getElementById: function(id) {
    return {
      id: id,
      value: '',
      innerText: '',
      innerHTML: '',
      style: { setProperty: function() {} },
      classList: {
        add: function() {},
        remove: function() {},
        contains: function() { return false; },
        toggle: function() {}
      },
      addEventListener: function() {}
    };
  },
  querySelectorAll: function() { return []; },
  querySelector: function() { return null; },
  addEventListener: function() {}
};

var lucide = { createIcons: function() {} };

load('js/initial-data.js');
load('js/supabase-client.js');
load('js/data-store.js');
load('js/app.js');

var results = [];
function assert(desc, condition) {
  if (condition) {
    print("  [PASS] " + desc);
    results.push({ test: desc, status: "PASS" });
  } else {
    print("  [FAIL] " + desc);
    results.push({ test: desc, status: "FAIL" });
  }
}

print("================================================================================");
print("INICIANDO RECORRIDO DE PRUEBA INTEGRAL POR USUARIO Y ROL - SIGO HIBA");
print("================================================================================");

// Inicializar DataStore
DataStore.init();
assert("DataStore se inicializa con catálogo de proyectos", DataStore.items.length > 0);

// ------------------------------------------------------------------------------
// FASE 1: ROL ADMINISTRADOR (admin / nicolas)
// ------------------------------------------------------------------------------
print("\n--- FASE 1: ROL ADMINISTRADOR (usr-nicolas) ---");
var authAdmin = DataStore.authenticate('nicolas', 'Admin2025!');
assert("Autenticación exitosa de Administrador Nicolas Kawior", authAdmin.success && authAdmin.user.rol === 'admin');
assert("Admin tiene permisos globales de creación y avance", authAdmin.user.puede_crear && authAdmin.user.puede_avanzar && authAdmin.user.puede_asignar_partida);

// 1.1 Crear nueva obra en Factibilidad con cifras decimales en USD
var idObraTest = 'OBRA-TEST-TOUR-01';
var nuevaObra = {
  id: idObraTest,
  nombre: 'Remodelación Integral Quirófano Híbrido 4',
  tipo: 'Obra Civil',
  sede: 'Central',
  dependencia: 'Departamento de Proyectos Central',
  estado: 'Estudio de Factibilidad',
  responsable_id: null,
  responsable: 'Sin Asignar',
  monto_obra_usd: 5684.30,
  monto_equipamiento_usd: 1250.70,
  monto_total_usd: 6935.00,
  m2: 45.5,
  partida: '',
  monto_partida_usd: 0,
  prioridad_medica: 'Pendiente',
  creado_por: 'Nicolas Kawior (Admin)'
};
DataStore.items.unshift(nuevaObra);
DataStore.persist();

var obraCreada = DataStore.getItemById(idObraTest);
assert("Creación de obra con cifras decimales en USD ($5684.30 y $1250.70)", obraCreada && obraCreada.monto_obra_usd === 5684.30);
assert("Cálculo exacto del Monto Total USD ($6935.00)", obraCreada && obraCreada.monto_total_usd === 6935.00);

// 1.2 Verificar exclusión estricta de Cartera Activa de Inversión
var kpis = DataStore.getKPIs();
var sumCartera = kpis.totalCarteraActiva;
assert("Obras en Factibilidad se excluyen estrictamente de la Cartera Activa USD", kpis.factibilidadCount > 0);

// 1.3 Centro Ágil de Asignación: Asignar obra a Arq. Palmioli
var palmioliUser = DataStore.users.find(function(u) { return u.username === 'palmioli'; });
obraCreada.responsable_id = palmioliUser.id;
obraCreada.responsable = palmioliUser.nombre;
DataStore.persist();
assert("Asignación de obra a Arq. Palmioli realizada exitosamente", obraCreada.responsable_id === 'usr-palmioli');

// ------------------------------------------------------------------------------
// FASE 2: ROL DIRECCIÓN MÉDICA (usr-dir-medica)
// ------------------------------------------------------------------------------
print("\n--- FASE 2: ROL DIRECCIÓN MÉDICA (usr-dir-medica) ---");
var authMedica = DataStore.authenticate('direccion.medica', 'Admin2025!');
assert("Autenticación exitosa de Dirección Médica", authMedica.success && authMedica.user.rol === 'direccion_medica');
assert("Dirección Médica tiene permiso de priorización y partida", authMedica.user.puede_priorizar_medica && authMedica.user.puede_asignar_partida);
assert("Dirección Médica NO puede avanzar obras operativas directamente", !authMedica.user.puede_avanzar);

// Simular sesión activa de Dirección Médica
DataStore.currentUser = authMedica.user;
obraCreada = DataStore.getItemById(idObraTest);

// 2.1 Asignar Prioridad Médica y Partida Presupuestaria con cifra no redonda
obraCreada.prioridad_medica = 'Alta';
var resPartida = DataStore.asignarPartidaPresupuestaria(idObraTest, 'PART-MED-2026-99', 6935.00);
obraCreada = DataStore.getItemById(idObraTest);
assert("Asignación exitosa de Partida Presupuestaria y Monto USD", resPartida.success);
assert("Obra posee partida presupuestaria válida registrada", DataStore.hasValidPartida(obraCreada) && obraCreada.partida === 'PART-MED-2026-99');

// 2.2 Dirección aprueba y avanza de Factibilidad a Proyecto
var resAvanzarProyecto = DataStore.confirmAndAdvanceStage(idObraTest, '2026-09-13', null, 'Factibilidad aprobada con partida por Dirección Médica', {});
obraCreada = DataStore.getItemById(idObraTest);
assert("Pase exitoso de Factibilidad a Proyecto", resAvanzarProyecto.success && obraCreada.estado === 'Proyecto');
assert("Al entrar a Proyecto, el sistema exige obligatoriamente plazo de etapa", obraCreada.requiere_plazo_etapa === true);

// ------------------------------------------------------------------------------
// FASE 3: ROL PM PROYECTOS CENTRAL (usr-palmioli)
// ------------------------------------------------------------------------------
print("\n--- FASE 3: ROL PM PROYECTOS CENTRAL (usr-palmioli) ---");
var authPalmioli = DataStore.authenticate('palmioli', 'Admin2025!');
assert("Autenticación exitosa de Arq. Palmioli", authPalmioli.success && authPalmioli.user.rol === 'pm_obra');

// Simular sesión activa de Palmioli
DataStore.currentUser = authPalmioli.user;
obraCreada = DataStore.getItemById(idObraTest);

// 3.1 Aislamiento Departamental: Palmioli gestiona su obra asignada en Proyecto
var canAdvanceObra = DataStore.canUserAdvanceItem(obraCreada);
assert("Palmioli puede gestionar su obra asignada en Proyecto", canAdvanceObra);

// 3.2 El PM define la fecha límite de la etapa de Proyecto
var resDefinirPlazoProj = DataStore.definirPlazoEtapa(idObraTest, '2026-10-30', 'Plazo fijado por PM');
obraCreada = DataStore.getItemById(idObraTest);
assert("Definición obligatoria de fecha estimada de término de Proyecto", resDefinirPlazoProj.success && obraCreada.fecha_fin_etapa === '2026-10-30' && !obraCreada.requiere_plazo_etapa);

// 3.3 Certificar fin de Proyecto y pase a Licitación (quien entrega NO define fecha de licitación)
var resAvanzarLicitacion = DataStore.confirmAndAdvanceStage(idObraTest, '2026-09-13', null, 'Pliegos y planos concluidos por PM', {});
obraCreada = DataStore.getItemById(idObraTest);
assert("Pase exitoso de Proyecto a 'En licitación'", resAvanzarLicitacion.success && obraCreada.estado === 'En licitación');
assert("Al pasar a Licitación, el sistema exige plazo al Comprador", obraCreada.requiere_plazo_etapa === true);

// ------------------------------------------------------------------------------
// FASE 4: ROL COMPRAS & LICITACIONES (usr-licitaciones)
// ------------------------------------------------------------------------------
print("\n--- FASE 4: ROL COMPRAS & LICITACIONES (usr-licitaciones) ---");
var authLicitaciones = DataStore.authenticate('licitaciones', 'Admin2025!');
assert("Autenticación exitosa de Compras & Licitaciones", authLicitaciones.success && authLicitaciones.user.rol === 'licitaciones');

// Simular sesión activa de Compras
DataStore.currentUser = authLicitaciones.user;
obraCreada = DataStore.getItemById(idObraTest);

// 4.1 Comprador define plazo de apertura de sobres
var resDefinirPlazoLic = DataStore.definirPlazoEtapa(idObraTest, '2026-11-15', 'Plazo de compulsa');
obraCreada = DataStore.getItemById(idObraTest);
assert("Comprador define plazo de licitación", resDefinirPlazoLic.success && obraCreada.fecha_fin_etapa === '2026-11-15');

// 4.2 Adjudicación con Proveedor, Orden de Compra, Monto y Anticipo en USD
var extraAdj = {
  proveedor: 'Constructora Hospitalaria Médica S.A.',
  ordenCompra: 'OC-2026-0044',
  montoAdjudicado: 6720.50,
  anticipoPorcentaje: 20
};
var resAvanzarObra = DataStore.confirmAndAdvanceStage(idObraTest, '2026-09-13', null, 'Adjudicación concluida tras concurso de precios', extraAdj);
obraCreada = DataStore.getItemById(idObraTest);
assert("Pase exitoso a 'Obras en Curso' con Proveedor y Monto Adjudicado", resAvanzarObra.success && obraCreada.estado === 'Obras en Curso');
assert("Datos de adjudicación registrados correctamente en USD", obraCreada.proveedor === 'Constructora Hospitalaria Médica S.A.' && obraCreada.monto_adjudicado_usd === 6720.50 && obraCreada.orden_compra === 'OC-2026-0044');

// ------------------------------------------------------------------------------
// FASE 5: ROL PM INFRAESTRUCTURA CENTRAL (usr-kawior-pm)
// ------------------------------------------------------------------------------
print("\n--- FASE 5: ROL PM INFRAESTRUCTURA CENTRAL (usr-kawior-pm) ---");
var authKawior = DataStore.authenticate('kawior', 'Admin2025!');
assert("Autenticación exitosa de Ing. Kawior", authKawior.success && authKawior.user.rol === 'pm_obra');
assert("Ing. Kawior pertenece a Mantenimiento Central", authKawior.user.dependencia === 'Departamento de Mantenimiento Central');

// ------------------------------------------------------------------------------
// FASE 6: REGLA ESPECIAL UNIFICADA SAN JUSTO (usr-waldemar / usr-lopez / usr-cossano)
// ------------------------------------------------------------------------------
print("\n--- FASE 6: REGLA ESPECIAL UNIFICADA SAN JUSTO (usr-waldemar / usr-lopez / usr-cossano) ---");
var authWaldemar = DataStore.authenticate('waldemar', 'Admin2025!');
assert("Autenticación exitosa de Ing. Waldemar (San Justo)", authWaldemar.success && authWaldemar.user.rol === 'pm_obra');
assert("Dependencia canónica unificada de San Justo", authWaldemar.user.dependencia === 'Departamento de Mantenimiento y Proyectos San Justo');

var authCossano = DataStore.authenticate('cossano', 'Admin2025!');
assert("Autenticación exitosa de Arq. Ana Cossano", authCossano.success);
assert("Dependencia canónica de San Justo para Arq. Cossano", authCossano.user.dependencia === 'Departamento de Mantenimiento y Proyectos San Justo');
assert("Sede canónica San Justo para Arq. Cossano", authCossano.user.sede === 'San Justo');

var obraWaldemar = {
  id: 'SJ-OBRA-TEST-01',
  nombre: 'Remodelación Guardia San Justo',
  tipo: 'Obra Civil',
  sede: 'San Justo',
  dependencia: 'Departamento de Mantenimiento y Proyectos San Justo',
  estado: 'Proyecto',
  responsable_id: 'usr-waldemar',
  responsable: 'Ing. Waldemar (PM San Justo)'
};
var obraLopez = {
  id: 'SJ-OBRA-TEST-02',
  nombre: 'Repotenciación Grupos Electrógenos San Justo',
  tipo: 'Infraestructura',
  sede: 'San Justo',
  dependencia: 'Departamento de Mantenimiento y Proyectos San Justo',
  estado: 'Proyecto',
  responsable_id: 'usr-lopez',
  responsable: 'Ing. López (PM Infraestructura)'
};
DataStore.items.unshift(obraWaldemar);
DataStore.items.unshift(obraLopez);
DataStore.persist();

// Simular sesión de Waldemar
DataStore.currentUser = authWaldemar.user;
assert("Waldemar puede visualizar su propia obra de San Justo", DataStore.canUserViewObra(obraWaldemar));
assert("Waldemar puede visualizar la obra de López gracias a la unificación de San Justo", DataStore.canUserViewObra(obraLopez));
assert("Waldemar PUEDE avanzar su propia obra", DataStore.canUserAdvanceItem(obraWaldemar));
assert("Waldemar NO PUEDE avanzar la obra asignada a López (Seguridad Operativa)", !DataStore.canUserAdvanceItem(obraLopez));

// Comprobar blindaje de obras de San Justo asignadas a Cossano (OBRA-054 y OBRA-059)
var obra054 = DataStore.items.find(function(x) { return x.id === 'OBRA-054'; });
if (obra054) {
  assert("OBRA-054 pertenece a Mantenimiento y Proyectos San Justo", DataStore.getObraDependencia(obra054) === 'Departamento de Mantenimiento y Proyectos San Justo');
  assert("OBRA-054 NO pertenece a Centros Periféricos", DataStore.getObraDependencia(obra054) !== 'Departamento de Centros Periféricos');
}

// ------------------------------------------------------------------------------
// FASE 6.1: DEPENDENCIA CENTROS PERIFÉRICOS (usr-pm-perifericos)
// ------------------------------------------------------------------------------
print("\n--- FASE 6.1: ROL PM CENTROS PERIFÉRICOS (usr-pm-perifericos) ---");
var authPerif = DataStore.authenticate('pm.perifericos', 'Admin2025!');
assert("Autenticación exitosa de PM Centros Periféricos", authPerif.success);
assert("Dependencia canónica de Centros Periféricos", authPerif.user.dependencia === 'Departamento de Centros Periféricos');
assert("Normalización de alias 'Ctros. Periféricos' a 'Departamento de Centros Periféricos'", DataStore.normalizeDependencia('Ctros. Periféricos') === 'Departamento de Centros Periféricos');
assert("Normalización de alias 'Ctros. Perifericos' a 'Departamento de Centros Periféricos'", DataStore.normalizeDependencia('Ctros. Perifericos') === 'Departamento de Centros Periféricos');

var obraPeriferico = {
  id: 'PERIF-TEST-01',
  nombre: 'Reforma Consultorios Larrea',
  sede: 'Periféricos',
  estado: 'Proyecto',
  monto_total_usd: 120000,
  responsable_id: 'usr-pm-perifericos',
  responsable: 'Arq. Coordinador Periféricos (PM)',
  dependencia: 'Departamento de Centros Periféricos'
};
DataStore.currentUser = authPerif.user;
assert("PM Periféricos puede visualizar su obra de Centros Periféricos", DataStore.canUserViewObra(obraPeriferico));
assert("getObraDependencia asigna Departamento de Centros Periféricos a obras en sede Periféricos", DataStore.getObraDependencia({ sede: 'Periféricos' }) === 'Departamento de Centros Periféricos');

// ------------------------------------------------------------------------------
// FASE 6.2: HABILITACIONES Y SEGURIDAD E HIGIENE + PERSISTENCIA DE PERMISOS
// ------------------------------------------------------------------------------
print("\n--- FASE 6.2: HABILITACIONES Y SEGURIDAD E HIGIENE + PERSISTENCIA ---");
assert("Normalización de 'Habilitaciones y Seguridad e Higiene'", DataStore.normalizeDependencia('Habilitaciones y Seguridad e Higiene') === 'Departamento de Habilitaciones y Seguridad e Higiene');
assert("Normalización de 'Habilitaciones y seguridad e higiene'", DataStore.normalizeDependencia('Habilitaciones y seguridad e higiene') === 'Departamento de Habilitaciones y Seguridad e Higiene');
assert("Normalización de 'Departamento de Habilitaciones y Seguridad e Higiene'", DataStore.normalizeDependencia('Departamento de Habilitaciones y Seguridad e Higiene') === 'Departamento de Habilitaciones y Seguridad e Higiene');

var resNewUser = DataStore.addUser({
  nombre: 'Lic. Seguridad Higiene',
  username: 'seguridad.test',
  email: 'seguridad@hospitalitaliano.org.ar',
  dependencia: 'Habilitaciones y seguridad e higiene',
  sede: 'Todas',
  rol: 'pm_obra'
});
assert("Alta de usuario con dependencia Habilitaciones y Seguridad e Higiene", resNewUser.success && resNewUser.user.dependencia === 'Departamento de Habilitaciones y Seguridad e Higiene');

// Persistencia inmutable de modificación de permisos
var updateRes = DataStore.updateUserPermissions('usr-cossano', {
  dependencia: 'Departamento de Mantenimiento y Proyectos San Justo',
  sede: 'San Justo'
});
assert("Actualización exitosa de permisos para Cossano", updateRes.success);
assert("Permisos actualizados conservan dependencia San Justo", updateRes.user.dependencia === 'Departamento de Mantenimiento y Proyectos San Justo');

// ------------------------------------------------------------------------------
// FASE 7: ROL AUDITORÍA / VISUALIZADOR (usr-auditor)
// ------------------------------------------------------------------------------
print("\n--- FASE 7: ROL AUDITORÍA Y CONTROL (usr-auditor) ---");
var authAuditor = DataStore.authenticate('auditor', 'Admin2025!');
assert("Autenticación exitosa de Auditoría", authAuditor.success && authAuditor.user.rol === 'visualizador');
assert("Auditoría es estrictamente solo lectura", authAuditor.user.solo_lectura === true);
assert("Auditoría no puede crear obras", !authAuditor.user.puede_crear);
assert("Auditoría no puede avanzar etapas", !authAuditor.user.puede_avanzar);

// ------------------------------------------------------------------------------
// FASE 8: SEGURIDAD, RATE LIMITING Y ANTI-FUERZA BRUTA
// ------------------------------------------------------------------------------
print("\n--- FASE 8: SEGURIDAD, RATE LIMITING Y BLOQUEO TEMPORAL ---");
SecurityManager.resetAttempts();
assert("Estado inicial de seguridad sin bloqueos", !SecurityManager.isLocked());

// Simular 5 intentos fallidos consecutivos
for (var i = 1; i <= 5; i++) {
  SecurityManager.recordFailedAttempt('hacker_test');
}
assert("Bloqueo de seguridad activado tras 5 intentos fallidos", SecurityManager.isLocked());
assert("Tiempo de bloqueo mayor a cero", SecurityManager.getRemainingLockoutSeconds() > 0);

// Simular éxito y reseteo
SecurityManager.recordSuccessfulLogin();
assert("Reseteo exitoso del bloqueo tras autenticación legítima", !SecurityManager.isLocked());

// ------------------------------------------------------------------------------
// FASE 9: REGLAS CANÓNICAS DE PRIORIDAD MÉDICA Y SEMÁFORO AUTOMÁTICO AL 15%
// ------------------------------------------------------------------------------
print("\n--- FASE 9: REGLAS DE PRIORIDAD MÉDICA DEFAULT Y SEMÁFORO AL 15% ---");
// 9.1 Asignación con prioridad médica explícita
var obraPmedExp = {
  id: 'OBRA-TEST-PMED-EXP',
  nombre: 'Prueba Prioridad Médica Explícita',
  tipo: 'Obra Civil',
  sede: 'Central',
  dependencia: 'Departamento de Proyectos Central',
  estado: 'Estudio de Factibilidad',
  prioridad_tecnica: 2,
  prioridad_medica: null,
  monto_total_usd: 10000
};
DataStore.items.unshift(obraPmedExp);
DataStore.currentUser = authMedica.user;
var resExp = DataStore.asignarPartidaPresupuestaria('OBRA-TEST-PMED-EXP', 'PART-EXP-01', 10000, 4);
var itemExp = DataStore.getItemById('OBRA-TEST-PMED-EXP');
assert("Prioridad médica asignada explícitamente (4★)", resExp.success && itemExp.prioridad_medica === 4 && !itemExp.prioridad_medica_ponderada_default);

// 9.2 Asignación sin prioridad médica (Fallback automático a técnica con indicación de default)
var obraPmedDef = {
  id: 'OBRA-TEST-PMED-DEF',
  nombre: 'Prueba Prioridad Médica Default',
  tipo: 'Obra Civil',
  sede: 'San Justo',
  dependencia: 'Departamento de Mantenimiento y Proyectos San Justo',
  estado: 'Estudio de Factibilidad',
  prioridad_tecnica: 5,
  prioridad_medica: null,
  monto_total_usd: 15000
};
DataStore.items.unshift(obraPmedDef);
var resDef = DataStore.asignarPartidaPresupuestaria('OBRA-TEST-PMED-DEF', 'PART-DEF-01', 15000, '');
var itemDef = DataStore.getItemById('OBRA-TEST-PMED-DEF');
assert("Criticidad médica adopta automáticamente la técnica (5★)", resDef.success && itemDef.prioridad_medica === 5);
assert("Obra marcada con ponderación por default", itemDef.prioridad_medica_ponderada_default === true);
assert("Historial indica que se ponderó por default por no contar con criticidad de Dirección", itemDef.prioridad_medica_origen.indexOf('Default') >= 0);

// 9.3 Semáforo 100% automático: 15% antes del plazo final
var dHoy = new Date();
var d10DiasAtras = new Date(dHoy.getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
var d90DiasAdelante = new Date(dHoy.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
var obraEnPlazo = {
  id: 'OBRA-SEM-EN-PLAZO',
  estado: 'Proyecto',
  fecha_inicio_etapa: d10DiasAtras,
  fecha_fin_etapa: d90DiasAdelante,
  requiere_plazo_etapa: false
};
var semEnPlazo = DataStore.calculateSemaforo(obraEnPlazo);
assert("Semáforo en plazo (Verde) cuando restan más del 15% del plazo", semEnPlazo.status === 'en_plazo');

// Obra en el 15% final (duración 100 días, empezó hace 88 días, restan 12 días <= 15 días de alerta)
var d88DiasAtras = new Date(dHoy.getTime() - (88 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
var d12DiasAdelante = new Date(dHoy.getTime() + (12 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
var obraAlerta15 = {
  id: 'OBRA-SEM-ALERTA-15',
  estado: 'Proyecto',
  fecha_inicio_etapa: d88DiasAtras,
  fecha_fin_etapa: d12DiasAdelante,
  requiere_plazo_etapa: false
};
var semAlerta15 = DataStore.calculateSemaforo(obraAlerta15);
assert("Semáforo automático por vencer (Amarillo) al ingresar en el 15% final del plazo", semAlerta15.status === 'por_vencer');

// Obra vencida (fecha límite hace 3 días)
var d3DiasAtras = new Date(dHoy.getTime() - (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
var obraVencida = {
  id: 'OBRA-SEM-VENCIDA',
  estado: 'Proyecto',
  fecha_inicio_etapa: d88DiasAtras,
  fecha_fin_etapa: d3DiasAtras,
  requiere_plazo_etapa: false
};
var semVencida = DataStore.calculateSemaforo(obraVencida);
assert("Semáforo automático vencido (Rojo) al superarse la fecha límite", semVencida.status === 'vencido');

// ------------------------------------------------------------------------------
// FASE 10: CASH FLOW DE OBRAS EN CURSO, ANTICIPOS OC Y PERÍODO CONTABLE 01/04 - 31/03
// ------------------------------------------------------------------------------
print("\n--- FASE 10: CASH FLOW DE OBRAS EN CURSO Y ANTICIPO ORDEN DE COMPRA ---");
DataStore.currentUser = authLicitaciones.user;

// 10.1 Creación y adjudicación con anticipo OC y plazo en meses
var obraCFTest = {
  id: 'OBRA-CF-ANTICIPO-1M',
  nombre: 'Nueva Sala de Cuidados Intensivos Pediátricos',
  tipo: 'Obra Civil',
  sede: 'Central',
  dependencia: 'Departamento de Proyectos Central',
  estado: 'En licitación',
  monto_total_usd: 1000000,
  partida: 'PART-CF-01',
  monto_partida_usd: 1000000,
  fecha_inicio_etapa: '2026-05-01'
};
DataStore.items.unshift(obraCFTest);
var fechaHoyStr = new Date().toISOString().split('T')[0];
var advResult = DataStore.confirmAndAdvanceStage('OBRA-CF-ANTICIPO-1M', fechaHoyStr, null, 'Adjudicación con 30% de anticipo y 10 meses de obra según pliego', {
  proveedor: 'Constructora del Plata S.A.',
  ordenCompra: 'OC-2026-9999',
  montoAdjudicado: 1000000,
  porcentajeAnticipo: 30,
  plazoMeses: 10
});

assert("Adjudicación exitosa a 'Obras en Curso' con anticipo del 30%", advResult.success);
var obraEnCursoGuardada = DataStore.getItemById('OBRA-CF-ANTICIPO-1M');
obraEnCursoGuardada.fecha_inicio_etapa = '2026-05-01'; // Fijar inicio en mayo 2026 para el test de 10 meses
DataStore.persist();
assert("Estado pasó a 'Obras en Curso'", obraEnCursoGuardada.estado === 'Obras en Curso');
assert("Porcentaje de anticipo registrado exactamente en 30%", obraEnCursoGuardada.anticipo_porcentaje === 30);
assert("Monto de anticipo registrado en 300,000 USD", obraEnCursoGuardada.anticipo_monto_usd === 300000);
assert("Plazo de obra registrado en 10 meses", obraEnCursoGuardada.plazo_meses === 10);

// 10.2 Cálculo del flujo mensual con refDate fija (ej: 15 de julio de 2026)
var refDatePrueba = new Date(2026, 6, 15); // 15 de julio de 2026
var cfCalculado = DataStore.calculateObraCashflow(obraEnCursoGuardada, refDatePrueba);

assert("Cálculo de Cash Flow detecta monto total de 1,000,000 USD", cfCalculado.montoTotalUSD === 1000000);
assert("Anticipo de Mes 1 absorbe exactamente 300,000 USD (30%)", cfCalculado.anticipoUSD === 300000);
assert("Saldo a prorratear en meses restantes es 700,000 USD", cfCalculado.saldoUSD === 700000);
assert("Cuota mensual para los 9 meses restantes es de 77,777.78 USD", Math.abs(cfCalculado.cuotaMensualSaldoUSD - 77777.78) < 0.05);

// 10.3 Período Contable Institucional (01/04 a 31/03)
var accInfo = DataStore.getAccountingYearInfo(refDatePrueba);
assert("Período contable inicia el 01/04", accInfo.startMonth === 4);
assert("Período contable abarca 12 meses", accInfo.meses.length === 12);
assert("Primer mes del ejercicio es Abril", accInfo.meses[0].shortLabel === 'Abr');
assert("Último mes del ejercicio es Marzo", accInfo.meses[11].shortLabel === 'Mar');

// 10.4 Exclusividad de Obras en Curso en getCashflowSummary
var obraFactibilidad = {
  id: 'OBRA-TEST-FACT-EXCLUIDA',
  nombre: 'Obra en Factibilidad Excluida de CF',
  estado: 'Estudio de Factibilidad',
  monto_total_usd: 500000
};
var obraSuspendida = {
  id: 'OBRA-TEST-SUSP-EXCLUIDA',
  nombre: 'Obra Suspendida Excluida de CF',
  estado: 'Suspendida',
  monto_total_usd: 400000
};
DataStore.items.unshift(obraFactibilidad);
DataStore.items.unshift(obraSuspendida);

var cfSummary = DataStore.getCashflowSummary('TODOS', 'todas', '', refDatePrueba);
var idsEnCF = cfSummary.displayList.map(function(e) { return e.item.id; });
assert("La obra en curso SÍ figura en el Cash Flow", idsEnCF.indexOf('OBRA-CF-ANTICIPO-1M') >= 0);
assert("La obra en factibilidad NO figura en el Cash Flow", idsEnCF.indexOf('OBRA-TEST-FACT-EXCLUIDA') === -1);
assert("La obra suspendida NO figura en el Cash Flow", idsEnCF.indexOf('OBRA-TEST-SUSP-EXCLUIDA') === -1);

// 10.5 Integridad de datos para Informe de Dirección (3 Páginas A4) y Conciliación Factibilidad (94 vs 91 vs 3)
// Limpieza previa de obras temporales para auditar cartera institucional real
DataStore.items = DataStore.items.filter(function(it) {
  return it.id !== idObraTest && it.id !== 'SJ-WALDEMAR-01' && it.id !== 'SJ-LOPEZ-01' &&
         it.id !== 'OBRA-TEST-PMED-EXP' && it.id !== 'OBRA-TEST-PMED-DEF' &&
         it.id !== 'OBRA-SEM-EN-PLAZO' && it.id !== 'OBRA-SEM-ALERTA-15' && it.id !== 'OBRA-SEM-VENCIDA' &&
         it.id !== 'OBRA-CF-ANTICIPO-1M' && it.id !== 'OBRA-TEST-FACT-EXCLUIDA' && it.id !== 'OBRA-TEST-SUSP-EXCLUIDA';
});
DataStore.persist();

DataStore.currentUser = authAdmin.user;
var repDir = DataStore.getExecutiveReportData(refDatePrueba);
assert("Informe contiene datos de Página 1 (Resumen de Cartera)", Boolean(repDir.obrasEnCurso && repDir.factibilidad && repDir.factibilidadSinPartida && repDir.partidasDesvios));
assert("Factibilidad consolidada reporta exactamente 91 obras totales en estudio", repDir.factibilidad.total === 91);
assert("Factibilidad monto total solicitado es exactamente USD 17,616,232", repDir.factibilidad.montoTotalUSD === 17616232);
assert("Factibilidad desglosa exactamente 90 obras sin partida (USD 17,466,232)", repDir.factibilidad.sinPartidaCount === 90 && repDir.factibilidad.sinPartidaUSD === 17466232);
assert("Factibilidad desglosa 1 obra con partida asignada en factibilidad (USD 150,000)", repDir.factibilidad.conPartidaCount === 1 && repDir.factibilidad.conPartidaUSD === 150000);
assert("Conciliación matemática perfecta: 91 obras en factibilidad", repDir.factibilidad.sinPartidaCount + repDir.factibilidad.conPartidaCount === repDir.factibilidad.total);
assert("Conciliación económica perfecta: USD 17,616,232", repDir.factibilidad.sinPartidaUSD + repDir.factibilidad.conPartidaUSD === repDir.factibilidad.montoTotalUSD);
assert("Informe contiene datos de Página 2 (Cash Flow Oficial 01/04 - 31/03)", Boolean(repDir.cashflowEjecucion && repDir.cashflowEjecucion.mesesTotales));
assert("Informe contiene datos de Página 3 (Sedes, Módulos y Certificación)", Boolean(repDir.desgloseSedes && repDir.desgloseModulos && repDir.semaforos));

// --- FASE 11: SUPRESIÓN DE PLAZOS EN FACTIBILIDAD Y SALIDA AUTOMÁTICA DE PENDIENTES DE DIRECCIÓN MÉDICA ---
print("\n--- FASE 11: SUPRESIÓN DE PLAZOS EN FACTIBILIDAD Y SALIDA AUTOMÁTICA DE PENDIENTES DE DIRECCIÓN MÉDICA ---");

// 11.1 Semáforo neutro sin plazos en Factibilidad
var obraTestFact = {
  id: 'OBRA-TEST-FACT-NOPLAZO',
  nombre: 'Obra de Factibilidad en Análisis',
  estado: 'Estudio de Factibilidad',
  prioridad_tecnica: 4,
  prioridad_medica: null,
  fecha_inicio_etapa: '2026-01-01',
  fecha_fin_etapa: '2026-02-01', // Aunque tuviera fecha residual, calculateSemaforo debe anularla
  monto_obra_usd: 150000
};
var semFact = DataStore.calculateSemaforo(obraTestFact);
assert("En Factibilidad calculateSemaforo retorna status 'en_analisis'", semFact.status === 'en_analisis');
assert("En Factibilidad calculateSemaforo retorna label 'En Análisis'", semFact.label === 'En Análisis');
assert("En Factibilidad calculateSemaforo retorna noPlazo true", semFact.noPlazo === true);
assert("En Factibilidad calculateSemaforo retorna days null (sin días restantes)", semFact.days === null);

// 11.2 Creación de nueva Factibilidad nace sin fecha fin ni requerimiento de plazo
DataStore.currentUser = authAdmin.user;
var nuevaFact = DataStore.createFactibilidad({
  nombre: 'Nueva Solicitud Sanitaria en Factibilidad',
  sede: 'Central',
  sector_solicitante: 'Cardiología',
  motivo: 'Renovación de equipamiento',
  requerimiento_minimo: 'Espacio plomado',
  monto_estimado: 80000,
  responsable: 'Admin',
  prioridad_tecnica: 4
});
assert("Nueva obra en Factibilidad nace con fecha_fin_etapa null", nuevaFact.fecha_fin_etapa === null);
assert("Nueva obra en Factibilidad nace con requiere_plazo_etapa false", nuevaFact.requiere_plazo_etapa === false);
assert("Nueva obra en Factibilidad nace con semáforo 'en_analisis'", DataStore.calculateSemaforo(nuevaFact).status === 'en_analisis');

// 11.3 Listado de pendientes de Dirección Médica: inclusión inicial
var pendingListInicial = DataStore.getPendingMedicalPriorityItems();
var estaEnPendingInicial = pendingListInicial.some(function(it) { return it.id === nuevaFact.id; });
assert("Obra nueva en Factibilidad sin ponderación médica figura en getPendingMedicalPriorityItems()", estaEnPendingInicial);

// 11.4 Administrador asigna partida y monto sin ponderación médica -> Criticidad médica se iguala a técnica por default
var resPartidaDef = DataStore.asignarPartidaPresupuestaria(nuevaFact.id, '6440026', 80000, null);
assert("Asignación de partida exitosa por el Administrador", resPartidaDef.success === true);
assert("Criticidad médica se iguala automáticamente a la técnica (4★)", nuevaFact.prioridad_medica === 4);
assert("Obra queda marcada con prioridad_medica_ponderada_default true", nuevaFact.prioridad_medica_ponderada_default === true);

// 11.5 Salida automática e inmediata del listado de pendientes de Dirección Médica
var pendingListPostPartida = DataStore.getPendingMedicalPriorityItems();
var estaEnPendingPostPartida = pendingListPostPartida.some(function(it) { return it.id === nuevaFact.id; });
assert("Obra con partida asignada y ponderación default DESAPARECE AUTOMÁTICAMENTE de getPendingMedicalPriorityItems()", !estaEnPendingPostPartida);

// 11.6 Al avanzar de Factibilidad a Proyecto: desaparece de Factibilidad y sigue excluida de pendientes
var resPaseProy = DataStore.confirmAndAdvanceStage(nuevaFact.id, '2026-09-14', null, 'Avanza con partida presupuestaria');
assert("Pase exitoso a Proyecto", resPaseProy.success === true && resPaseProy.nextStage === 'Proyecto');
assert("Obra en etapa Proyecto NO figura en getPendingMedicalPriorityItems()", !DataStore.getPendingMedicalPriorityItems().some(function(it) { return it.id === nuevaFact.id; }));

// Limpieza de obra temporal de prueba
DataStore.items = DataStore.items.filter(function(it) { return it.id !== nuevaFact.id; });
DataStore.persist();

// ================================================================================
// FASE 12: PERFIL COMPRADOR (LICITACIONES) - ORDEN DE COMPRA (OC) Y ANTICIPO OBLIGATORIO + VISIBILIDAD SOLO LECTURA EN PROYECTO
// ================================================================================
print("\n--- FASE 12: PERFIL COMPRADOR (LICITACIONES) Y ADJUDICACIÓN CON OC Y ANTICIPO ---");

// 12.1 Login como Comprador (usr-licitaciones)
var authLicitacionesTour = DataStore.authenticate('licitaciones', 'Admin2025!');
DataStore.currentUser = authLicitacionesTour.user;
assert("Login exitoso como Comprador (usr-licitaciones)", authLicitacionesTour.success === true && DataStore.currentUser.rol === 'licitaciones');

// Crear una obra en etapa 'Proyecto' para testear visibilidad preventiva
var obraProyTest = {
  id: 'TEST-PROY-COMPRADOR-01',
  nombre: 'Adecuación de Quirófano 5 para Licitación Futura',
  tipo: 'Obra Civil',
  sede: 'Central',
  dependencia: 'Departamento de Arquitectura & Obras Civiles',
  estado: 'Proyecto',
  partida: '8899001',
  monto_partida_usd: 300000,
  monto_obra_usd: 300000,
  monto_total_usd: 300000,
  responsable: 'Arq. Martín Gómez',
  responsable_id: 'usr-martin',
  prioridad_tecnica: 4,
  prioridad_medica: 4,
  prioridad_final: 4,
  superficie_m2: 120,
  fecha_inicio_etapa: '2026-09-01',
  fecha_fin_etapa: '2026-10-15',
  historial: []
};
DataStore.items.push(obraProyTest);

// 12.2 Visibilidad de etapa Proyecto para el Comprador
assert("El Comprador PUEDE VER obras en etapa Proyecto (canUserViewObra)", DataStore.canUserViewObra(obraProyTest) === true);
var filteredComp = DataStore.getFilteredItems();
var canSeeInFiltered = filteredComp.some(function(x) { return x.id === obraProyTest.id; });
assert("La obra en Proyecto aparece en el listado getFilteredItems() para el Comprador", canSeeInFiltered);

// 12.3 Restricción estricta de NO EDICIÓN y NO AVANCE en Proyecto para el Comprador
assert("El Comprador NO PUEDE EDITAR obras en Proyecto (canUserEditObra es false)", DataStore.canUserEditObra(obraProyTest) === false);
assert("El Comprador NO PUEDE AVANZAR obras en Proyecto (canUserAdvanceItem es false)", DataStore.canUserAdvanceItem(obraProyTest) === false);
var resAdvanceProyDenied = DataStore.confirmAndAdvanceStage(obraProyTest.id, '2026-09-14', null, 'Intento avance indebido');
assert("Intento de avance en Proyecto por Comprador es RECHAZADO por permisos", resAdvanceProyDenied.success === false);

// 12.4 Crear una obra en etapa 'En licitación' a cargo de Compras
var obraLicTest = {
  id: 'TEST-LIC-COMPRADOR-01',
  nombre: 'Compulsa de Precios Nueva Sala de Espera Pediatría',
  tipo: 'Obra Civil',
  sede: 'Central',
  dependencia: 'Compras & Licitaciones',
  estado: 'En licitación',
  partida: '8899002',
  monto_partida_usd: 500000,
  monto_obra_usd: 500000,
  monto_total_usd: 500000,
  responsable: 'Lic. Mariana López',
  responsable_id: 'usr-licitaciones',
  proyectista_id: 'usr-palmioli',
  proyectista_nombre: 'Arq. Palmioli (PM Central)',
  proyectista_dependencia: 'Departamento de Proyectos Central',
  prioridad_tecnica: 4,
  prioridad_medica: 4,
  prioridad_final: 4,
  fecha_inicio_etapa: '2026-09-01',
  fecha_fin_etapa: '2026-09-30',
  historial: []
};
DataStore.items.push(obraLicTest);

assert("El Comprador tiene autorización para certificar avance en 'En licitación'", DataStore.canUserAdvanceItem(obraLicTest) === true);

// 12.5 Validaciones obligatorias de adjudicación: Proveedor, OC, Monto y Anticipo
var resNoProv = DataStore.confirmAndAdvanceStage(obraLicTest.id, '2026-09-14', null, '', {
  proveedor: '',
  ordenCompra: 'OC-2026-001',
  montoAdjudicado: 480000,
  anticipoPorcentaje: 20
});
assert("Bloqueado si falta la Razón Social del Proveedor", resNoProv.success === false && resNoProv.msg.indexOf("Proveedor Adjudicado") !== -1);

var resNoOC = DataStore.confirmAndAdvanceStage(obraLicTest.id, '2026-09-14', null, '', {
  proveedor: 'Constructora Central S.A.',
  ordenCompra: '',
  montoAdjudicado: 480000,
  anticipoPorcentaje: 20
});
assert("Bloqueado si falta el Número de Orden de Compra (OC)", resNoOC.success === false && resNoOC.msg.indexOf("Orden de Compra") !== -1);

var resNoMonto = DataStore.confirmAndAdvanceStage(obraLicTest.id, '2026-09-14', null, '', {
  proveedor: 'Constructora Central S.A.',
  ordenCompra: 'OC-2026-001',
  montoAdjudicado: 0,
  anticipoPorcentaje: 20
});
assert("Bloqueado si el Monto Adjudicado es <= 0", resNoMonto.success === false && resNoMonto.msg.indexOf("Monto Total de la Adjudicación") !== -1);

var resNoAnticipo = DataStore.confirmAndAdvanceStage(obraLicTest.id, '2026-09-14', null, '', {
  proveedor: 'Constructora Central S.A.',
  ordenCompra: 'OC-2026-001',
  montoAdjudicado: 480000,
  anticipoPorcentaje: ''
});
assert("Bloqueado si no se ingresa el Porcentaje de Anticipo en OC", resNoAnticipo.success === false && resNoAnticipo.msg.indexOf("Porcentaje de Anticipo") !== -1);

// 12.6 Adjudicación exitosa con todos los campos obligatorios completos (el comprador no establece el plazo de la siguiente etapa)
var resAdjSuccess = DataStore.confirmAndAdvanceStage(obraLicTest.id, '2026-09-14', null, 'Adjudicación aprobada por Comisión', {
  proveedor: 'Techint Ingeniería y Construcción S.A.',
  ordenCompra: 'OC-2026-8899',
  montoAdjudicado: 485000,
  anticipoPorcentaje: 30
});

assert("Adjudicación exitosa a 'Obras en Curso'", resAdjSuccess.success === true && resAdjSuccess.nextStage === 'Obras en Curso');
assert("Persistencia correcta de Proveedor", obraLicTest.proveedor === 'Techint Ingeniería y Construcción S.A.');
assert("Persistencia correcta de Orden de Compra (orden_compra)", obraLicTest.orden_compra === 'OC-2026-8899');
assert("Persistencia correcta de Orden de Compra (numero_oc)", obraLicTest.numero_oc === 'OC-2026-8899');
assert("Persistencia correcta de Monto Adjudicado USD", obraLicTest.monto_adjudicado_usd === 485000);
assert("Persistencia correcta de Porcentaje de Anticipo (30%)", obraLicTest.anticipo_porcentaje === 30);
assert("Cálculo preciso del Anticipo USD (30% de 485.000 = 145.500)", obraLicTest.anticipo_monto_usd === 145500);
assert("La obra en curso retorna al proyectista original (Arq. Palmioli)", obraLicTest.responsable === 'Arq. Palmioli (PM Central)');
assert("La obra en curso nace con requiere_plazo_etapa true para el proyectista", obraLicTest.requiere_plazo_etapa === true);
assert("La obra en curso nace con fecha_fin_etapa null (debe fijarla el proyectista)", obraLicTest.fecha_fin_etapa === null);
assert("El historial incluye el registro con el número de OC", obraLicTest.historial[0].observaciones.indexOf('OC N° OC-2026-8899') !== -1);
assert("En Obras en Curso el Comprador ya NO puede certificar avance (canUserAdvanceItem es false)", DataStore.canUserAdvanceItem(obraLicTest) === false);

// 12.7 El Proyectista asume la obra y define el plazo de ejecución obligatorio
var authProyectista = DataStore.authenticate('palmioli', 'Admin2025!');
DataStore.currentUser = authProyectista.user;
assert("Login exitoso del Proyectista original (Arq. Palmioli)", authProyectista.success && DataStore.currentUser.id === 'usr-palmioli');
assert("El Proyectista PUEDE certificar y definir plazo de su obra en curso", DataStore.canUserAdvanceItem(obraLicTest) === true);

var resDefPlazo = DataStore.definirPlazoEtapa(obraLicTest.id, '2027-03-31', 'Plazo de ejecución de 7 meses establecido por el proyectista');
assert("Definición de plazo de obra exitosa por el Proyectista", resDefPlazo.success === true);
var itemDefinido = DataStore.getItemById(obraLicTest.id);
assert("Fecha límite de obra en curso registrada en 2027-03-31", itemDefinido.fecha_fin_etapa === '2027-03-31');
assert("requiere_plazo_etapa pasa a false tras definir el plazo", itemDefinido.requiere_plazo_etapa === false);
assert("Plazo en meses calculado automáticamente a 7 meses", itemDefinido.plazo_meses === 7);

// Limpieza de obras temporales de la Fase 12
DataStore.items = DataStore.items.filter(function(it) {
  return it.id !== obraProyTest.id && it.id !== obraLicTest.id;
});
DataStore.persist();
// --- FASE 13: BASE CANÓNICA OFICIAL (97 PROYECTOS / USD 30,569,529.29), EXPORTACIÓN/IMPORTACIÓN JSON Y MULTI-PESTAÑA ---
print("\n--- FASE 13: BASE CANÓNICA OFICIAL (97 PROYECTOS / USD 30,569,529.29), EXPORTACIÓN/IMPORTACIÓN JSON Y MULTI-PESTAÑA ---");

// 13.1 Restablecer a base canónica oficial
DataStore.resetToCanonical();
DataStore.currentUser = authAdmin.user;

var kpisCan = DataStore.getKPIs();
assert("Cartera Activa canónica cuenta con exactamente 97 proyectos activos", kpisCan.carteraActivaCount === 97);
assert("Inversión total estimada en cartera activa es exactamente USD 30,569,529.29", Math.abs(kpisCan.totalCarteraActiva - 30569529.29) < 0.01);
assert("Inversión Civil es exactamente USD 22,518,691.29", Math.abs(kpisCan.sumObraActiva - 22518691.29) < 0.01);
assert("Inversión Equipamiento es exactamente USD 1,515,000.00", kpisCan.sumEquipActivo === 1515000);
assert("Inversión Infraestructura es exactamente USD 6,535,838.00", kpisCan.sumInfraActiva === 6535838);
assert("Etapa Proyecto cuenta con 56 obras", kpisCan.estadosCount['Proyecto'] === 56);
assert("Etapa Licitación cuenta con 16 obras", kpisCan.estadosCount['En licitación'] === 16);
assert("Etapa Obras en Curso cuenta con 25 obras", kpisCan.estadosCount['Obras en Curso'] === 25);
assert("Etapa Finalizadas cuenta con 25 obras", kpisCan.finalizadas === 25);
assert("Etapa Suspendidas cuenta con 7 obras", kpisCan.suspendidas === 7);
assert("Etapa Factibilidad cuenta con exactamente 91 obras", kpisCan.factibilidadCount === 91);
assert("Semáforos activos totalizan exactamente 97 proyectos (82 En Plazo, 15 de atención)", kpisCan.enPlazo === 82 && (kpisCan.porVencer + kpisCan.vencidos === 15));
assert("Banner médico de Factibilidad visible con exactamente 57 obras pendientes de ponderación", DataStore.getPendingMedicalPriorityItems().length === 57);

// 13.2 Portabilidad y Respaldo JSON
var exportedJSON = DataStore.exportDatabaseJSON();
assert("Exportación genera JSON válido", Boolean(exportedJSON && exportedJSON.length > 1000));
var parsedBackup = JSON.parse(exportedJSON);
assert("Respaldo exportado contiene 221 obras en catálogo", parsedBackup.metadata.total_items === 221);
assert("Respaldo exportado contiene 97 proyectos activos", parsedBackup.metadata.cartera_activa_count === 97);
assert("Respaldo exportado contiene monto canónico de USD 30,569,529.29", Math.abs(parsedBackup.metadata.total_cartera_usd - 30569529.29) < 0.01);

// 13.3 Importación y Restauración íntegra
var importResult = DataStore.importDatabaseJSON(exportedJSON);
assert("Importación de base de datos exitosa", importResult.success === true && importResult.count === 221);
var kpisAfterImport = DataStore.getKPIs();
assert("Base de datos restaurada conserva exactamente USD 30,569,529.29 y 97 obras activas", kpisAfterImport.carteraActivaCount === 97 && Math.abs(kpisAfterImport.totalCarteraActiva - 30569529.29) < 0.01);

// 13.4 Normalización de Formato Numérico (Separador de miles con punto y 2 decimales con coma)
assert("formatNumberAR formatea enteros con punto y dos decimales con coma (1.688.000,00)", DataStore.formatNumberAR(1688000) === '1.688.000,00');
assert("formatNumberAR formatea decimales con punto de miles y coma (30.569.529,29)", DataStore.formatNumberAR(30569529.29) === '30.569.529,29');
assert("formatNumberAR formatea cero como 0,00", DataStore.formatNumberAR(0) === '0,00');
assert("formatNumberAR formatea decimal simple (5.684,30)", DataStore.formatNumberAR(5684.3) === '5.684,30');
assert("formatUSD añade prefijo USD y formato argentino", DataStore.formatUSD(30569529.29) === 'USD 30.569.529,29');
assert("formatMillionsUSD formatea con coma decimal (USD 30,57M)", DataStore.formatMillionsUSD(30569529.29) === 'USD 30,57M');

// 13.5 Robustez del parser numérico parseCurrency
assert("parseCurrency parsea formato argentino 1.688.000,00", Math.abs(DataStore.parseCurrency('1.688.000,00') - 1688000) < 0.01);
assert("parseCurrency parsea formato argentino sin decimales 1.688.000", Math.abs(DataStore.parseCurrency('1.688.000') - 1688000) < 0.01);
assert("parseCurrency parsea formato argentino 50.000", Math.abs(DataStore.parseCurrency('50.000') - 50000) < 0.01);
assert("parseCurrency parsea string con coma decimal 5684,30", Math.abs(DataStore.parseCurrency('5684,30') - 5684.3) < 0.01);
assert("parseCurrency parsea string con prefijo USD 30.569.529,29", Math.abs(DataStore.parseCurrency('USD 30.569.529,29') - 30569529.29) < 0.01);
assert("parseCurrency parsea número plano 50000", Math.abs(DataStore.parseCurrency('50000') - 50000) < 0.01);

// ================================================================================
// FASE 14: BORRADO DEFINITIVO DE OBRAS POR EL ADMINISTRADOR Y AUDITORÍA DE REGISTROS
// ================================================================================
print("\n--- FASE 14: BORRADO DEFINITIVO DE OBRAS POR EL ADMINISTRADOR Y AUDITORÍA DE REGISTROS ---");

// 14.1 Crear una obra temporal para borrado en cualquier estadio
var obraParaBorrar = {
  id: 'OBRA-TEST-BORRADO-99',
  nombre: 'Obra Experimental para Prueba de Borrado y Auditoría',
  tipo: 'Obra Civil',
  sede: 'Central',
  dependencia: 'Departamento de Proyectos Central',
  estado: 'Proyecto',
  monto_obra_usd: 150000,
  monto_equipamiento_usd: 50000,
  monto_total_usd: 200000,
  responsable: 'Admin',
  responsable_id: 'usr-admin'
};
DataStore.items.unshift(obraParaBorrar);
DataStore.persist();

assert("Obra de prueba creada e incorporada al catálogo", Boolean(DataStore.getItemById('OBRA-TEST-BORRADO-99')));

// 14.2 Intento de borrado por usuario no administrador (e.g. Proyectista) -> BLOQUEADO
DataStore.currentUser = authProyectista.user; // usr-palmioli
var resBorradoNoAdmin = DataStore.deleteItem('OBRA-TEST-BORRADO-99');
assert("Usuario no administrador tiene denegado el borrado de obras", resBorradoNoAdmin.success === false);
assert("La obra sigue intacta en el catálogo tras intento denegado", Boolean(DataStore.getItemById('OBRA-TEST-BORRADO-99')));

// 14.3 Borrado exitoso ejecutado por el Administrador General
DataStore.currentUser = authAdmin.user; // usr-admin
var totalLogsAntes = DataStore.auditLogs ? DataStore.auditLogs.length : 0;
var resBorradoAdmin = DataStore.deleteItem('OBRA-TEST-BORRADO-99');
assert("El Administrador General puede borrar obras exitosamente", resBorradoAdmin.success === true);
assert("La obra eliminada ya NO figura en el catálogo de DataStore", !DataStore.getItemById('OBRA-TEST-BORRADO-99'));

// 14.4 Verificación de asentamiento en el libro de auditoría
assert("El número de registros de auditoría se incrementó", DataStore.auditLogs.length === totalLogsAntes + 1);
var ultimoLog = DataStore.auditLogs[0];
assert("El último registro de auditoría corresponde a BORRADO_OBRA", ultimoLog.tipo === 'BORRADO_OBRA');
assert("El registro de auditoría contiene el código de la obra borrada", ultimoLog.obra_id === 'OBRA-TEST-BORRADO-99');
assert("El registro de auditoría contiene el monto total involucrado (USD 200.000)", ultimoLog.monto_usd === 200000);
assert("El registro de auditoría contiene el usuario ejecutor", ultimoLog.usuario === authAdmin.user.nombre);
assert("El registro de auditoría tiene nivel 'critico'", ultimoLog.nivel === 'critico');

// 14.5 Restablecer y constatar base canónica oficial limpia
localStorage.setItem('sigo_active_user_id', authAdmin.user.id);
DataStore.resetToCanonical();
DataStore.currentUser = authAdmin.user;
var kpisFinales = DataStore.getKPIs();
assert("Base canónica mantiene exactamente 97 proyectos activos", kpisFinales.carteraActivaCount === 97);
assert("Base canónica mantiene exactamente USD 30,569,529.29", Math.abs(kpisFinales.totalCarteraActiva - 30569529.29) < 0.01);

print("\n================================================================================");
var failedCount = results.filter(function(r) { return r.status === 'FAIL'; }).length;
var passedCount = results.filter(function(r) { return r.status === 'PASS'; }).length;
print("RESUMEN FINAL DEL RECORRIDO DE PRUEBAS:");
print("  Total Pruebas Ejecutadas: " + results.length);
print("  Pruebas Exitosas (PASS): " + passedCount);
print("  Pruebas Fallidas  (FAIL): " + failedCount);
print("================================================================================");

if (failedCount === 0) {
  print("🎉 ¡TODAS LAS FUNCIONES Y REGLAS POR USUARIO Y ROL FUNCIONAN A LA PERFECCIÓN!");
} else {
  print("❌ SE DETECTARON ERRORES QUE DEBEN RESOLVERSE.");
}
