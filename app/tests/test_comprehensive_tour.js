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

// 4.2 Adjudicación con Proveedor y Monto Adjudicado USD
var extraAdj = {
  proveedor: 'Constructora Hospitalaria Médica S.A.',
  montoAdjudicado: 6720.50
};
var resAvanzarObra = DataStore.confirmAndAdvanceStage(idObraTest, '2026-09-13', null, 'Adjudicación concluida tras concurso de precios', extraAdj);
obraCreada = DataStore.getItemById(idObraTest);
assert("Pase exitoso a 'Obras en Curso' con Proveedor y Monto Adjudicado", resAvanzarObra.success && obraCreada.estado === 'Obras en Curso');
assert("Datos de adjudicación registrados correctamente en USD", obraCreada.proveedor === 'Constructora Hospitalaria Médica S.A.' && obraCreada.monto_adjudicado_usd === 6720.50);

// ------------------------------------------------------------------------------
// FASE 5: ROL PM INFRAESTRUCTURA CENTRAL (usr-kawior-pm)
// ------------------------------------------------------------------------------
print("\n--- FASE 5: ROL PM INFRAESTRUCTURA CENTRAL (usr-kawior-pm) ---");
var authKawior = DataStore.authenticate('kawior', 'Admin2025!');
assert("Autenticación exitosa de Ing. Kawior", authKawior.success && authKawior.user.rol === 'pm_obra');
assert("Ing. Kawior pertenece a Mantenimiento Central", authKawior.user.dependencia === 'Departamento de Mantenimiento Central');

// ------------------------------------------------------------------------------
// FASE 6: ROL EQUIPO UNIFICADO SAN JUSTO (usr-waldemar y usr-lopez)
// ------------------------------------------------------------------------------
print("\n--- FASE 6: REGLA ESPECIAL UNIFICADA SAN JUSTO (usr-waldemar / usr-lopez) ---");
var authWaldemar = DataStore.authenticate('waldemar', 'Admin2025!');
assert("Autenticación exitosa de Ing. Waldemar (San Justo)", authWaldemar.success);
assert("Dependencia canónica unificada de San Justo", authWaldemar.user.dependencia === 'Departamento de Mantenimiento y Proyectos San Justo');

// Crear dos obras de San Justo: una para Waldemar y otra para López
var obraWaldemar = {
  id: 'SJ-WALDEMAR-01',
  nombre: 'Ampliación Shockroom San Justo',
  tipo: 'Obra Civil',
  sede: 'San Justo',
  dependencia: 'Departamento de Mantenimiento y Proyectos San Justo',
  estado: 'Proyecto',
  responsable_id: 'usr-waldemar',
  responsable: 'Ing. Waldemar (PM San Justo)'
};
var obraLopez = {
  id: 'SJ-LOPEZ-01',
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

// Limpieza de obra de prueba
DataStore.items = DataStore.items.filter(function(it) {
  return it.id !== idObraTest && it.id !== 'SJ-WALDEMAR-01' && it.id !== 'SJ-LOPEZ-01' &&
         it.id !== 'OBRA-TEST-PMED-EXP' && it.id !== 'OBRA-TEST-PMED-DEF' &&
         it.id !== 'OBRA-SEM-EN-PLAZO' && it.id !== 'OBRA-SEM-ALERTA-15' && it.id !== 'OBRA-SEM-VENCIDA';
});
DataStore.persist();

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
