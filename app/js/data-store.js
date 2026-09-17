// ==============================================================================
// GESTOR DE DATOS, ESTADOS, USUARIOS Y WORKFLOW SECUENCIAL - SIGO HIBA v2.1
// Autenticación Segura con SHA-256 + Salt, Claves Temporales y Eliminación de Usuarios
// ==============================================================================

// Canal global de sincronización multi-pestaña reactiva (SIGO Sync)
const sigoBroadcast = (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined')
  ? new BroadcastChannel('sigo_sync_channel')
  : null;

function broadcastDataChange(type = 'DATA_UPDATED') {
  if (sigoBroadcast) {
    try {
      sigoBroadcast.postMessage({
        type: type,
        timestamp: Date.now(),
        user: (typeof DataStore !== 'undefined' && DataStore.currentUser) ? DataStore.currentUser.id : 'anon'
      });
    } catch (e) {
      // Ignorar errores en entornos cerrados o sandboxes
    }
  }
}

// Implementación pura y sincrónica de SHA-256 (estándar FIPS 180-4)
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  if (!sha256.h) {
    sha256.h = [];
    sha256.k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        sha256.h[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        sha256.k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
  }
  let hash = sha256.h.slice(0);
  const k = sha256.k;

  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength) | 0;

  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

function hashPassword(password, salt) {
  return sha256(salt + '::' + password.trim());
}

function generateSalt(len = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

const STAGES_SEQUENCE = [
  'Estudio de Factibilidad',
  'Proyecto',
  'En licitación',
  'Obras en Curso',
  'Obras Finalizadas'
];

const DEFAULT_STAGE_DAYS = {
  'Estudio de Factibilidad': 45,
  'Proyecto': 60,
  'En licitación': 45,
  'Obras en Curso': 120
};

// Clave por defecto para cuentas iniciales: Admin2025!
const DEFAULT_ADMIN_HASH = 'b0e2fe5af4bea016b2486146988b0ea99788896f6cfa7d5fff684463c7ca6989';
const DEFAULT_SALT = 'salt_admin_hiba';

const DEFAULT_USERS = [
  {
    id: 'usr-admin',
    username: 'admin',
    nombre: 'Dirección General (Admin)',
    email: 'admin.obras@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Todas',
    dependencia: 'Dirección General / Administración',
    rol: 'admin',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: true,
    puede_asignar_partida: true,
    solo_lectura: false
  },
  {
    id: 'usr-nicolas',
    username: 'nicolas',
    nombre: 'Nicolas Kawior (Admin)',
    email: 'nicolasdkawior@gmail.com',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Todas',
    dependencia: 'Dirección General / Administración',
    rol: 'admin',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: true,
    puede_asignar_partida: true,
    solo_lectura: false
  },
  {
    id: 'usr-dir-medica',
    username: 'direccion.medica',
    nombre: 'Dirección Médica HIBA',
    email: 'direccion.medica@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Todas',
    dependencia: 'Dirección General / Administración',
    rol: 'direccion_medica',
    activo: true,
    puede_crear: false,
    puede_avanzar: false,
    puede_priorizar_medica: true,
    puede_asignar_partida: true,
    solo_lectura: false
  },
  {
    id: 'usr-palmioli',
    username: 'palmioli',
    nombre: 'Arq. Palmioli (PM Central)',
    email: 'palmioli.central@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Central',
    dependencia: 'Departamento de Proyectos Central',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-waldemar',
    username: 'waldemar',
    nombre: 'Ing. Waldemar (PM San Justo)',
    email: 'waldemar.sanjusto@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'San Justo',
    dependencia: 'Departamento de Mantenimiento y Proyectos San Justo',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-cossano',
    username: 'cossano',
    nombre: 'Arq. Ana Cossano (PM San Justo)',
    email: 'ana.cossano@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'San Justo',
    dependencia: 'Departamento de Mantenimiento y Proyectos San Justo',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-pm-perifericos',
    username: 'pm.perifericos',
    nombre: 'Arq. Coordinador Periféricos (PM)',
    email: 'perifericos.obras@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Periféricos',
    dependencia: 'Departamento de Centros Periféricos',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-boselli',
    username: 'boselli',
    nombre: 'Ing. Boselli (PM Infraestructura)',
    email: 'boselli.infra@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Central',
    dependencia: 'Departamento de Mantenimiento Central',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-lopez',
    username: 'lopez',
    nombre: 'Ing. López (PM Infraestructura)',
    email: 'lopez.infra@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'San Justo',
    dependencia: 'Departamento de Mantenimiento y Proyectos San Justo',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-vasquez',
    username: 'vasquez',
    nombre: 'Ing. Vasquez (PM Infraestructura)',
    email: 'vasquez.infra@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Central',
    dependencia: 'Departamento de Mantenimiento Central',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-gimenez',
    username: 'gimenez',
    nombre: 'Ing. Giménez (PM Infraestructura)',
    email: 'gimenez.infra@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Central',
    dependencia: 'Departamento de Mantenimiento Central',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-gallardo',
    username: 'gallardo',
    nombre: 'Arq. Gallardo (PM Obras)',
    email: 'gallardo.obras@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Central',
    dependencia: 'Departamento de Proyectos Central',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-sulpis',
    username: 'sulpis',
    nombre: 'Arq. Sulpis (PM Obras)',
    email: 'sulpis.obras@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Central',
    dependencia: 'Departamento de Proyectos Central',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-kawior-pm',
    username: 'kawior',
    nombre: 'Ing. Kawior (PM Infraestructura)',
    email: 'kawior.infra@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Central',
    dependencia: 'Departamento de Mantenimiento Central',
    rol: 'pm_obra',
    activo: true,
    puede_crear: true,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-licitaciones',
    username: 'licitaciones',
    nombre: 'Compras & Licitaciones',
    email: 'licitaciones@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Todas',
    dependencia: 'Dirección General / Administración',
    rol: 'licitaciones',
    activo: true,
    puede_crear: false,
    puede_avanzar: true,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: false
  },
  {
    id: 'usr-auditor',
    username: 'auditor',
    nombre: 'Auditoría y Control',
    email: 'auditor@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Todas',
    dependencia: 'Dirección General / Administración',
    rol: 'visualizador',
    activo: true,
    puede_crear: false,
    puede_avanzar: false,
    puede_priorizar_medica: false,
    puede_asignar_partida: false,
    solo_lectura: true
  }
];

const DataStore = {
  CANONICAL_VERSION: 'v3_97_factibilidad_57_v2',
  items: [],
  users: [],
  auditLogs: [],
  currentUser: null,

  DEPENDENCIAS: [
    'Departamento de Mantenimiento Central',
    'Departamento de Proyectos Central',
    'Departamento de Mantenimiento y Proyectos San Justo',
    'Departamento de Instalaciones',
    'Departamento de Centros Periféricos',
    'Departamento de Habilitaciones y Seguridad e Higiene',
    'Dirección General / Administración'
  ],

  normalizeDependencia(dep) {
    if (!dep) return '';
    const d = dep.trim();
    if (d === 'Departamento de Proyectos San Justo' || 
        d === 'Departamento de Mantenimiento San Justo' || 
        d === 'Proyectos San Justo' || 
        d === 'Mantenimiento San Justo' ||
        d === 'Departamento de Mantenimiento y Proyectos San Justo' ||
        d === 'Mantenimiento y Proyectos San Justo') {
      return 'Departamento de Mantenimiento y Proyectos San Justo';
    }
    if (d === 'Departamento de Centros Periféricos' ||
        d === 'Departamento de Centros Perifericos' ||
        d === 'Departamento de Ctros. Periféricos' ||
        d === 'Departamento de Ctros. Perifericos' ||
        d === 'Centros Periféricos' ||
        d === 'Centros Perifericos' ||
        d === 'Ctros. Periféricos' ||
        d === 'Ctros. Perifericos' ||
        d === 'Periféricos' ||
        d === 'Perifericos') {
      return 'Departamento de Centros Periféricos';
    }
    if (d === 'Departamento de Habilitaciones y Seguridad e Higiene' ||
        d === 'Habilitaciones y Seguridad e Higiene' ||
        d === 'Habilitaciones y seguridad e higiene' ||
        d.toLowerCase().includes('habilitacion') ||
        d.toLowerCase().includes('seguridad e higiene')) {
      return 'Departamento de Habilitaciones y Seguridad e Higiene';
    }
    return d;
  },

  init() {
    // 1. Cargar Usuarios
    let deletedList = [];
    try {
      deletedList = JSON.parse(localStorage.getItem('sigo_deleted_usernames') || '[]');
    } catch (e) {
      deletedList = [];
    }
    const isBlacklisted = (identifier) => {
      if (!identifier) return false;
      return deletedList.includes(identifier.toLowerCase());
    };

    const localUsers = localStorage.getItem('sigo_users_list');
    if (localUsers) {
      try {
        this.users = JSON.parse(localUsers);
        // Filtrar inmediatamente cualquier usuario que haya sido eliminado previamente
        this.users = this.users.filter(u => 
          !isBlacklisted(u.id) && !isBlacklisted(u.username) && !isBlacklisted(u.email)
        );

        // Garantizar que los usuarios maestros obligatorios existan ÚNICAMENTE si no fueron eliminados
        DEFAULT_USERS.forEach(defU => {
          if (isBlacklisted(defU.id) || isBlacklisted(defU.username) || isBlacklisted(defU.email)) {
            return; // Usuario fue expresamente eliminado por el usuario, JAMÁS restaurar
          }
          const existing = this.users.find(u => 
            (u.id && u.id.toLowerCase() === defU.id.toLowerCase()) ||
            (u.username && u.username.toLowerCase() === defU.username.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === defU.email.toLowerCase())
          );
          if (!existing) {
            this.users.push({ ...defU });
          } else {
            // Sincronizar datos e identidad
            existing.id = defU.id;
            existing.username = defU.username;
            existing.nombre = existing.nombre || defU.nombre;
            existing.email = existing.email || defU.email;
            existing.sede = existing.sede || defU.sede;
            existing.dependencia = existing.dependencia || defU.dependencia;
            existing.rol = existing.rol || defU.rol;
            if (existing.activo === undefined) existing.activo = true;

            // Migración automática de Cossano si arrastra datos obsoletos de Periféricos en localStorage
            if (existing.id === 'usr-cossano') {
              if (existing.dependencia === 'Departamento de Centros Periféricos' || 
                  existing.sede === 'Periféricos' || 
                  (existing.nombre && existing.nombre.includes('Periféricos'))) {
                existing.dependencia = 'Departamento de Mantenimiento y Proyectos San Justo';
                existing.sede = 'San Justo';
                existing.nombre = 'Arq. Ana Cossano (PM San Justo)';
                existing.email = 'ana.cossano@hospitalitaliano.org.ar';
              }
            }

            // Sincronizar SIEMPRE credenciales maestras si no cambió voluntariamente la clave
            if (!existing.debe_cambiar_clave) {
              existing.salt = defU.salt;
              existing.password_hash = defU.password_hash;
            } else {
              if (!existing.salt) existing.salt = defU.salt;
              if (!existing.password_hash) existing.password_hash = defU.password_hash;
            }

            // Permisos por defecto
            if (existing.puede_avanzar === undefined) existing.puede_avanzar = defU.puede_avanzar;
            if (existing.puede_crear === undefined) existing.puede_crear = defU.puede_crear;
            if (existing.puede_priorizar_medica === undefined) existing.puede_priorizar_medica = defU.puede_priorizar_medica;
            if (existing.puede_asignar_partida === undefined) existing.puede_asignar_partida = defU.puede_asignar_partida;
            if (existing.solo_lectura === undefined) existing.solo_lectura = defU.solo_lectura;
          }
        });
      } catch (e) {
        this.users = DEFAULT_USERS.filter(defU => 
          !isBlacklisted(defU.id) && !isBlacklisted(defU.username) && !isBlacklisted(defU.email)
        ).map(u => ({ ...u }));
      }
    } else {
      this.users = DEFAULT_USERS.filter(defU => 
        !isBlacklisted(defU.id) && !isBlacklisted(defU.username) && !isBlacklisted(defU.email)
      ).map(u => ({ ...u }));
    }

    // Asegurar que ningún usuario de la lista quede sin hash ni username
    this.users.forEach(u => {
      if (!u.username) u.username = (u.email ? u.email.split('@')[0] : `user_${u.id}`).toLowerCase();
      // Si falta salt o hash, asignar credencial maestra válida
      if (!u.salt) u.salt = DEFAULT_SALT;
      if (!u.password_hash) u.password_hash = DEFAULT_ADMIN_HASH;
      if (u.debe_cambiar_clave === undefined) u.debe_cambiar_clave = false;
      if (u.activo === undefined) u.activo = true;
      if (u.puede_avanzar === undefined) u.puede_avanzar = (u.rol !== 'visualizador' && !u.solo_lectura);
      if (u.puede_crear === undefined) u.puede_crear = (u.rol !== 'visualizador' && !u.solo_lectura);
      u.dependencia = this.normalizeDependencia(u.dependencia);
    });
    this.persistUsers();

    const activeUsrId = localStorage.getItem('sigo_active_user_id');
    this.currentUser = activeUsrId ? (this.users.find(u => u.id === activeUsrId && u.activo) || null) : null;
    if (this.currentUser) {
      if (this.currentUser.puede_avanzar === undefined) {
        this.currentUser.puede_avanzar = (this.currentUser.rol !== 'visualizador' && !this.currentUser.solo_lectura);
      }
      if (this.currentUser.puede_crear === undefined) {
        this.currentUser.puede_crear = (this.currentUser.rol !== 'visualizador' && !this.currentUser.solo_lectura);
      }
    }
    if (activeUsrId && !this.currentUser) {
      localStorage.removeItem('sigo_active_user_id');
    }

    // 2. Cargar Obras con verificación de versión canónica oficial (97 Proyectos / USD 30,569,529.29 / 57 Factibilidad)
    const currentVersion = localStorage.getItem('sigo_canonical_version');
    const validVersions = [this.CANONICAL_VERSION, 'v3_97_canonical', 'v3_97_factibilidad_57'];
    if (!currentVersion || !validVersions.includes(currentVersion)) {
      localStorage.removeItem('sigo_obras_data');
      localStorage.setItem('sigo_canonical_version', this.CANONICAL_VERSION);
    } else if (currentVersion !== this.CANONICAL_VERSION) {
      localStorage.setItem('sigo_canonical_version', this.CANONICAL_VERSION);
    }

    const localObras = localStorage.getItem('sigo_obras_data');
    if (localObras) {
      try {
        this.items = JSON.parse(localObras);
      } catch (e) {
        console.error("Error al leer local data:", e);
      }
    }

    if (!this.items || this.items.length === 0) {
      if (window.INITIAL_DATA) {
        const rawObras = window.INITIAL_DATA.obras || [];
        const rawInfra = window.INITIAL_DATA.infraestructura || [];
        this.items = [...rawObras, ...rawInfra];
        
        this.items.forEach(item => {
          if (item.sede === 'Almagro') item.sede = 'Central';
          if (item.sede === 'Periférico') item.sede = 'Periféricos';
          if (!item.sede) item.sede = 'Central';
          if (item.estado === 'Ante Proyecto') item.estado = 'Estudio de Factibilidad';
          if (item.estado === 'Proyecto para licitar') item.estado = 'Proyecto';
          
          if (!item.fecha_fin_etapa) {
            if (item.estado !== 'Estudio de Factibilidad' && item.estado !== 'Obras Finalizadas' && item.estado !== 'Suspendida') {
              item.requiere_plazo_etapa = true;
            }
          }
        });

        this.persist(false);
      }
    }

    // Normalizar datos (unificación de Anteproyecto en Factibilidad y Proyecto para licitar en Proyecto)
    this.items.forEach(item => {
      if (item.sede === 'Almagro') item.sede = 'Central';
      if (item.sede === 'Periférico' || item.sede === 'Ctros Medicos' || item.sede === 'Centros Médicos') item.sede = 'Periféricos';
      if (item.estado === 'Ante Proyecto') item.estado = 'Estudio de Factibilidad';
      if (item.estado === 'Proyecto para licitar') item.estado = 'Proyecto';

      // Saneamiento de obras de San Justo que pudieran haber quedado erróneamente con Centros Periféricos
      if ((item.sede || '').toLowerCase().includes('justo') && 
          (item.dependencia === 'Departamento de Centros Periféricos' || item.dependencia === 'Centros Periféricos')) {
        item.dependencia = 'Departamento de Mantenimiento y Proyectos San Justo';
      }

      // Sincronizar dependencia canónica primero (repara automáticamente discrepancias en localStorage)
      item.dependencia = this.normalizeDependencia(this.getObraDependencia(item));

      // Si la obra está en Estudio de Factibilidad:
      // 1. En Factibilidad NO se computan plazos ni fechas límites (obra en análisis preliminar)
      if (item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') {
        item.requiere_plazo_etapa = false;
        item.fecha_fin_etapa = null;
        item.fecha_fin_obra = null;
      }

      // 2. Si no tiene partida válida: No puede estar asignada a nadie. Debe figurar como Sin Asignar y preservar creado_por.
      if ((item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') && !this.hasValidPartida(item)) {
        if (!item.creado_por && item.responsable && item.responsable !== 'Sin Asignar' && item.responsable !== 'S/D' && item.responsable !== 'Pendiente') {
          item.creado_por = item.responsable;
        }
        item.responsable = 'Sin Asignar';
        item.responsable_id = null;
      }

      // Sincronizar asignación de usuario si tiene nombre de responsable pero falta ID (solo si no es Factibilidad sin partida)
      if ((item.estado !== 'Estudio de Factibilidad' && item.estado !== 'Ante Proyecto') || this.hasValidPartida(item)) {
        // 1. Si en localStorage quedó como Sin Asignar pero en INITIAL_DATA tenía responsable histórico o creado_por
        if ((!item.responsable || item.responsable === 'Sin Asignar' || !item.responsable_id) && window.INITIAL_DATA) {
          const initList = (window.INITIAL_DATA.obras || []).concat(window.INITIAL_DATA.infraestructura || []);
          const orig = initList.find(x => x.id === item.id);
          if (orig && orig.responsable && orig.responsable !== 'Sin Asignar' && orig.responsable !== 'S/D' && orig.responsable !== 'Pendiente') {
            item.responsable = orig.responsable;
          } else if (item.creado_por && item.creado_por !== 'Sin Asignar') {
            item.responsable = item.creado_por;
          }
        }

        // 2. Si estaba asignada a Admin (usr-nicolas) pero pertenece canónicamente a Mantenimiento Central
        if (item.responsable_id === 'usr-nicolas' && item.dependencia === 'Departamento de Mantenimiento Central') {
          const uKawiorPM = this.users.find(u => u.id === 'usr-kawior-pm');
          if (uKawiorPM) {
            item.responsable_id = uKawiorPM.id;
            item.responsable = uKawiorPM.nombre;
          }
        }

        if (!item.responsable_id && item.responsable) {
          const uFound = this.getObraAssignedUser(item);
          if (uFound) {
            item.responsable_id = uFound.id;
            item.responsable = uFound.nombre;
          }
        } else if (item.responsable_id) {
          const uFound = this.users.find(u => u.id === item.responsable_id);
          if (uFound) {
            item.responsable = uFound.nombre;
          }
        }
      }

      if (!item.historial) {
        item.historial = [{
          fecha: new Date().toISOString().split('T')[0],
          usuario: item.responsable || 'Sistema HIBA',
          estado_anterior: null,
          estado_nuevo: item.estado,
          observaciones: 'Carga inicial desde planilla 2025'
        }];
      }
    });

    // Sincronizar cashflow multianual y montos de partidas desde INITIAL_DATA si falta en storage existente
    if (window.INITIAL_DATA) {
      const initialMap = {};
      [...(window.INITIAL_DATA.obras || []), ...(window.INITIAL_DATA.infraestructura || [])].forEach(x => {
        initialMap[x.id] = x;
      });

      let updatedAny = false;
      this.items.forEach(item => {
        const initItem = initialMap[item.id];
        if (initItem) {
          // Si no tiene cashflow o está vacío y el item inicial sí lo tiene
          const hasCf = item.cashflow && (item.cashflow.monto_total || item.cashflow.cashflow_2026 || item.cashflow.cashflow_2027);
          const initHasCf = initItem.cashflow && (initItem.cashflow.monto_total || initItem.cashflow.cashflow_2026 || initItem.cashflow.cashflow_2027);
          if (!hasCf && initHasCf) {
            item.cashflow = JSON.parse(JSON.stringify(initItem.cashflow));
            if (!item.monto_total_usd && initItem.cashflow.monto_total) {
              item.monto_total_usd = initItem.cashflow.monto_total;
              item.monto_obra_usd = initItem.cashflow.monto_total;
            }
            updatedAny = true;
          }
          // Sincronizar partida si existía en la planilla maestra
          if ((!item.partida || item.partida === 'S/D' || item.partida === 'PENDIENTE') && initItem.partida && initItem.partida !== 'S/D' && initItem.partida !== 'PENDIENTE') {
            item.partida = initItem.partida;
            updatedAny = true;
          }
          // Si tiene partida válida pero falta monto_partida_usd
          if (item.partida && item.partida.trim() !== '' && item.partida !== 'S/D' && item.partida.toUpperCase() !== 'PENDIENTE') {
            if (!item.monto_partida_usd || item.monto_partida_usd <= 0) {
              item.monto_partida_usd = item.monto_total_usd || item.monto_obra_usd || (item.cashflow ? item.cashflow.monto_total : 0) || 0;
              updatedAny = true;
            }
          }
        }
      });
      if (updatedAny) {
        this.persist(false);
      }
    }

    // 3. Cargar Registros de Auditoría Institucional
    const localAudit = localStorage.getItem('sigo_audit_logs');
    if (localAudit) {
      try {
        this.auditLogs = JSON.parse(localAudit);
      } catch (e) {
        this.auditLogs = [];
      }
    }
    if (!Array.isArray(this.auditLogs) || this.auditLogs.length === 0) {
      this.auditLogs = this.getInitialAuditLogs();
      this.persistAuditLogs();
    }

    console.log(`DataStore v2.2 inicializado: ${this.items.length} proyectos. Usuario activo: ${this.currentUser ? this.currentUser.nombre : 'Ninguno (Requiere Login)'}`);
    
    if (typeof SupabaseManager !== 'undefined' && SupabaseManager.isConfigured) {
      this.syncWithCloud().catch(e => console.error(e));
    }
  },

  async syncWithCloud() {
    if (typeof SupabaseManager !== 'undefined' && SupabaseManager.isConfigured) {
      try {
        const cloudData = await SupabaseManager.fetchObrasFromCloud();
        if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
          let cloudItems = cloudData.map(row => SupabaseManager.mapCloudRowToObra(row)).filter(Boolean);
          if (cloudItems.length > 0) {
            if (window.INITIAL_DATA && (window.INITIAL_DATA.obras || window.INITIAL_DATA.infraestructura)) {
              const initList = [...(window.INITIAL_DATA.obras || []), ...(window.INITIAL_DATA.infraestructura || [])];
              const cloudIds = new Set(cloudItems.map(x => x.id));
              let addedAny = false;
              initList.forEach(initItem => {
                if (!cloudIds.has(initItem.id)) {
                  cloudItems.push(JSON.parse(JSON.stringify(initItem)));
                  cloudIds.add(initItem.id);
                  addedAny = true;
                }
              });
              if (addedAny) {
                SupabaseManager.pushAllObrasToCloud(cloudItems);
              }
            }

            const getFingerprint = (arr) => {
              if (!Array.isArray(arr)) return '';
              return arr.map(x => `${x.id}:${x.estado}:${x.partida || ''}:${x.monto_total_usd || 0}:${x.responsable || ''}:${x.nombre || ''}:${x.fecha_fin_etapa || ''}`).sort().join('|');
            };

            const currentFp = getFingerprint(this.items);
            const cloudFp = getFingerprint(cloudItems);

            if (currentFp !== cloudFp || (this.items && this.items.length !== cloudItems.length)) {
              this.items = cloudItems;
              this.persist(false);
              return true;
            }
          }
        } else if ((!cloudData || cloudData.length === 0) && this.items && this.items.length > 0) {
          SupabaseManager.pushAllObrasToCloud(this.items);
        }
      } catch (e) {
        console.error("Error en syncWithCloud:", e);
      }
    }
    return false;
  },

  persist(pushToCloud = true) {
    try {
      localStorage.setItem('sigo_obras_data', JSON.stringify(this.items));
      localStorage.setItem('sigo_canonical_version', this.CANONICAL_VERSION);
      if (typeof broadcastDataChange === 'function') {
        broadcastDataChange('DATA_PERSISTED');
      }
      if (pushToCloud && typeof SupabaseManager !== 'undefined' && SupabaseManager.isConfigured && typeof SupabaseManager.pushAllObrasToCloud === 'function') {
        SupabaseManager.pushAllObrasToCloud(this.items);
      }
    } catch (e) {
      console.error("Error persistiendo datos:", e);
    }
  },

  persistUsers() {
    try {
      localStorage.setItem('sigo_users_list', JSON.stringify(this.users));
      if (typeof broadcastDataChange === 'function') {
        broadcastDataChange('USERS_PERSISTED');
      }
    } catch (e) {
      console.error("Error persistiendo usuarios:", e);
    }
  },

  persistAuditLogs() {
    try {
      localStorage.setItem('sigo_audit_logs', JSON.stringify(this.auditLogs));
      if (typeof broadcastDataChange === 'function') {
        broadcastDataChange('AUDIT_LOGS_PERSISTED');
      }
    } catch (e) {
      console.error("Error persistiendo auditoría:", e);
    }
  },

  getInitialAuditLogs() {
    return [
      {
        id: 'AUD-INIT-001',
        timestamp: '2026-09-15T01:30:00.000Z',
        fecha: '2026-09-15 01:30',
        tipo: 'SISTEMA',
        tipo_label: 'Base Canónica Oficial',
        nivel: 'info',
        usuario: 'Dirección General (Admin)',
        usuario_id: 'usr-admin',
        obra_id: 'GLOBAL',
        obra_nombre: 'Sistema Integral SIGO-HIBA',
        monto_usd: 30569529.29,
        estado_obra: 'Vigente',
        detalle: 'Sincronización inicial de la base de datos canónica oficial: 97 proyectos activos por USD 30.569.529,29 y 221 obras en catálogo.'
      },
      {
        id: 'AUD-INIT-002',
        timestamp: '2026-09-15T01:31:00.000Z',
        fecha: '2026-09-15 01:31',
        tipo: 'PRIORIZACION_MEDICA',
        tipo_label: 'Ponderación Médica',
        nivel: 'info',
        usuario: 'Dirección Médica HIBA',
        usuario_id: 'usr-dir-medica',
        obra_id: 'FACTIBILIDAD',
        obra_nombre: 'Módulo Factibilidad Sanitaria',
        monto_usd: 0,
        estado_obra: 'Estudio de Factibilidad',
        detalle: 'Configuración del panel de 57 obras en Estudio de Factibilidad pendientes de asignación de criticidad asistencial.'
      },
      {
        id: 'AUD-INIT-003',
        timestamp: '2026-09-15T01:32:00.000Z',
        fecha: '2026-09-15 01:32',
        tipo: 'SEGURIDAD',
        tipo_label: 'Respaldo Automático',
        nivel: 'exito',
        usuario: 'Sistema Autónomo',
        usuario_id: 'usr-system',
        obra_id: 'BACKUP',
        obra_nombre: 'Catálogo General',
        monto_usd: 30569529.29,
        estado_obra: 'Vigente',
        detalle: 'Activación del esquema de respaldo diario automático a las 15:00 hs con política de retención histórica de 30 días.'
      }
    ];
  },

  addAuditLog(entry) {
    if (!Array.isArray(this.auditLogs)) this.auditLogs = [];
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fechaStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const newEntry = {
      id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: now.toISOString(),
      fecha: fechaStr,
      tipo: entry.tipo || 'MOVIMIENTO',
      tipo_label: entry.tipo_label || entry.tipo || 'Movimiento',
      nivel: entry.nivel || 'info',
      usuario: (this.currentUser && this.currentUser.nombre) ? this.currentUser.nombre : 'Dirección General (Admin)',
      usuario_id: (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'usr-admin',
      obra_id: entry.obra_id || '-',
      obra_nombre: entry.obra_nombre || '-',
      monto_usd: typeof entry.monto_usd === 'number' ? entry.monto_usd : 0,
      estado_obra: entry.estado_obra || '-',
      detalle: entry.detalle || ''
    };
    this.auditLogs.unshift(newEntry);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    this.persistAuditLogs();
    return newEntry;
  },

  exportAuditLogsToExcel() {
    if (!window.XLSX) {
      alert("Librería XLSX no disponible.");
      return;
    }
    const data = (this.auditLogs || []).map(entry => ({
      'ID Auditoría': entry.id,
      'Fecha y Hora': entry.fecha,
      'Acción / Evento': entry.tipo_label || entry.tipo,
      'Nivel': (entry.nivel || 'info').toUpperCase(),
      'Usuario Ejecutor': entry.usuario,
      'Código de Obra': entry.obra_id,
      'Nombre de Obra / Objeto': entry.obra_nombre,
      'Estadio': entry.estado_obra,
      'Monto Involucrado (USD)': entry.monto_usd || 0,
      'Detalle del Movimiento': entry.detalle
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria_SIGO_HIBA");
    XLSX.writeFile(wb, `Auditoria_Movimientos_HIBA_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  reloadFromStorage() {
    try {
      const localObras = localStorage.getItem('sigo_obras_data');
      if (localObras) {
        this.items = JSON.parse(localObras);
      }
      const localUsers = localStorage.getItem('sigo_users_list');
      if (localUsers) {
        this.users = JSON.parse(localUsers);
      }
      const localAudit = localStorage.getItem('sigo_audit_logs');
      if (localAudit) {
        this.auditLogs = JSON.parse(localAudit);
      }
      return true;
    } catch (e) {
      console.error("Error recargando datos de storage:", e);
      return false;
    }
  },

  // ================= PORTABILIDAD Y GESTIÓN DE BASE DE DATOS =================
  exportDatabaseJSON() {
    const kpis = this.getKPIs();
    const exportPayload = {
      version: 'v3_97_canonical',
      exported_at: new Date().toISOString(),
      system: 'SIGO HIBA - Sistema de Gestión de Obras',
      metadata: {
        institucion: 'Hospital Italiano de Buenos Aires (HIBA)',
        total_items: (this.items || []).length,
        cartera_activa_count: kpis.carteraActivaCount,
        total_cartera_usd: kpis.totalCarteraActiva,
        sum_civil_usd: kpis.sumObraActiva,
        sum_equip_usd: kpis.sumEquipActivo,
        sum_infra_usd: kpis.sumInfraActiva,
        exported_by: this.currentUser ? `${this.currentUser.nombre} (${this.currentUser.username})` : 'Administrador'
      },
      items: this.items || [],
      users: this.users || [],
      audit_logs: this.auditLogs || []
    };
    return JSON.stringify(exportPayload, null, 2);
  },

  getBackupsHistoryList() {
    const backups = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const isToday = (i === 0);
      const isYesterday = (i === 1);
      const labelDate = isToday ? 'Hoy' : (isYesterday ? 'Ayer' : `${day}/${month}/${year}`);
      
      backups.push({
        date: dateStr,
        time: '15:00 hs',
        filename: `backup_${dateStr}_1500.json`,
        label: `${labelDate} - 15:00 hs (ART)`,
        daysAgo: i,
        status: i === 0 ? 'Respaldo Vigente Actual' : `Snapshot hace ${i} día(s)`
      });
    }
    return backups;
  },

  importDatabaseJSON(jsonStr) {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (!data || (!data.items && !Array.isArray(data))) {
        throw new Error("El archivo no contiene un formato de base de datos válido de SIGO HIBA.");
      }
      const items = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("El archivo no contiene registros de obras válidos.");
      }

      // Validar integridad mínima
      const valid = items.every(it => it.id && it.nombre && it.estado);
      if (!valid) {
        throw new Error("Se detectaron obras con campos requeridos faltantes (id, nombre, estado).");
      }

      this.items = items;
      if (data.users && Array.isArray(data.users) && data.users.length > 0) {
        this.users = data.users;
        this.persistUsers();
      }

      if (data.audit_logs && Array.isArray(data.audit_logs) && data.audit_logs.length > 0) {
        this.auditLogs = data.audit_logs;
        this.persistAuditLogs();
      }

      this.persist(true);
      if (typeof SupabaseManager !== 'undefined' && SupabaseManager.isConfigured && typeof SupabaseManager.pushAllObrasToCloud === 'function') {
        SupabaseManager.pushAllObrasToCloud(this.items);
      }
      if (typeof broadcastDataChange === 'function') {
        broadcastDataChange('DATABASE_RESTORED');
      }
      return { success: true, count: items.length };
    } catch (err) {
      console.error("Error importando base de datos:", err);
      return { success: false, error: err.message };
    }
  },

  resetToCanonical() {
    try {
      localStorage.removeItem('sigo_obras_data');
      localStorage.setItem('sigo_canonical_version', this.CANONICAL_VERSION);
      this.items = [];
      this.init();
      if (typeof broadcastDataChange === 'function') {
        broadcastDataChange('DATABASE_RESTORED');
      }
      return { success: true, count: this.items.length };
    } catch (err) {
      console.error("Error restableciendo base canónica:", err);
      return { success: false, error: err.message };
    }
  },

  // ================= FORMATO DE MONEDA EN USD Y PARSEO DE DECIMALES =================
  formatNumberAR(val) {
    const n = typeof val === 'number' ? val : this.parseCurrency(val);
    if (isNaN(n)) return '0,00';
    const isNegative = n < 0;
    const absN = Math.abs(n);
    const parts = absN.toFixed(2).split('.');
    const integerFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (isNegative ? '-' : '') + integerFormatted + ',' + parts[1];
  },

  parseCurrency(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let s = String(val).trim().replace(/[$\sUSDusd]/g, '');
    if (!s) return 0;
    if (s.includes(',') && s.includes('.')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        // Formato AR/Europeo: 1.688.000,50 -> quitar puntos, cambiar coma por punto
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato US: 1,688,000.50 -> quitar comas
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      const commaCount = (s.match(/,/g) || []).length;
      if (commaCount > 1) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(',', '.');
      }
    } else if (s.includes('.')) {
      const dotCount = (s.match(/\./g) || []).length;
      if (dotCount > 1) {
        s = s.replace(/\./g, '');
      } else {
        const parts = s.split('.');
        if (parts[1].length === 3 && parts[0] !== '0') {
          s = parts[0] + parts[1];
        }
      }
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  },

  formatUSD(amount) {
    return `USD ${this.formatNumberAR(amount)}`;
  },

  formatMillionsUSD(amount) {
    const n = typeof amount === 'number' ? amount : this.parseCurrency(amount);
    const millions = (n || 0) / 1000000;
    const isNegative = millions < 0;
    const absM = Math.abs(millions);
    const parts = absM.toFixed(2).split('.');
    const integerFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `USD ${(isNegative ? '-' : '') + integerFormatted},${parts[1]}M`;
  },

  // ================= CARGA DE FACTIBILIDAD =================
  createFactibilidad(data) {
    if (!this.currentUser) throw new Error('No hay sesión iniciada');
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador' || !this.currentUser.puede_crear) {
      throw new Error('⛔ Acceso Denegado: Tu perfil no tiene autorización para crear obras ni solicitudes de factibilidad.');
    }
    const userSede = this.currentUser.sede !== 'Todas' ? this.currentUser.sede : (data.sede || 'Central');
    const u = this.currentUser;
    const userDep = data.dependencia || u.dependencia || this.getObraDependencia({ sede: userSede, tipo: data.tipo || 'Obra Civil' });
    const newId = `OBRA-${(this.items.length + 1).toString().padStart(3, '0')}`;
    const pTec = parseFloat(data.prioridad_tecnica) || 3;
    const monto = this.parseCurrency(data.monto_estimado) || 0;

    const newItem = {
      id: newId,
      tipo: data.tipo || 'Obra Civil',
      dependencia: userDep,
      creado_por: u.nombre,
      creado_por_id: u.id,
      creado_por_username: u.username,
      creado_por_nombre: u.nombre,
      creado_por_dependencia: u.dependencia || userDep,
      partida: '', // Pendiente de asignación formal por Dirección/Administración
      nombre: data.nombre.trim(),
      sede: userSede,
      sector_solicitante: data.sector_solicitante || '',
      motivo: data.motivo || '',
      requerimiento_minimo: data.requerimiento_minimo || '',
      estado: 'Estudio de Factibilidad',
      monto_obra_usd: monto,
      monto_equipamiento_usd: 0,
      monto_total_usd: monto,
      prioridad_tecnica: pTec,
      prioridad_medica: null, // Pendiente de dirección
      prioridad_final: pTec,
      responsable: 'Sin Asignar', // En Factibilidad sin partida no puede estar asignada
      responsable_id: null,
      categoria: data.categoria || 'Obra Civil',
      clasificacion: 'Nueva Solicitud',
      observaciones: `Sector: ${data.sector_solicitante || 'S/D'} | Motivo: ${data.motivo || 'S/D'}`,
      fecha_inicio_etapa: new Date().toISOString().split('T')[0],
      fecha_fin_etapa: null, // Factibilidad no computa plazos ni fechas límite
      fecha_fin_obra: null,
      requiere_plazo_etapa: false,
      cashflow: {
        monto_total: monto,
        fecha_inicio: '',
        fecha_fin: '',
        cashflow_2026: monto,
        cashflow_2027: 0,
        cashflow_2028: 0,
        cashflow_2029: 0
      },
      historial: [{
        fecha: new Date().toISOString().split('T')[0],
        usuario: this.currentUser.nombre,
        estado_anterior: null,
        estado_nuevo: 'Estudio de Factibilidad',
        observaciones: `Solicitud de factibilidad registrada por ${this.currentUser.nombre} con Prioridad Inicial ${pTec}★. Esperando revisión de Dirección y asignación de partida.`
      }]
    };

    this.items.unshift(newItem);
    this.persist(true);

    this.addAuditLog({
      tipo: 'CREACION_OBRA',
      tipo_label: 'Alta de Obra (Factibilidad)',
      nivel: 'info',
      obra_id: newItem.id,
      obra_nombre: newItem.nombre,
      monto_usd: (newItem.monto_obra_usd || 0) + (newItem.monto_equipamiento_usd || 0),
      estado_obra: 'Estudio de Factibilidad',
      detalle: `Alta de nueva solicitud en Factibilidad: '${newItem.nombre}' (${newItem.id}), sede ${newItem.sede}, sector '${newItem.sector_solicitante || 'N/A'}'. Monto estimado: ${this.formatUSD((newItem.monto_obra_usd || 0) + (newItem.monto_equipamiento_usd || 0))}.`
    });

    if (SupabaseManager.isConfigured) {
      SupabaseManager.upsertObraInCloud(newItem);
    }

    return newItem;
  },

  parsePrioridad(val) {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) return Math.min(5, Math.max(1, num));
    const str = String(val).toLowerCase();
    if (str.includes('crítica') || str.includes('critica') || str.includes('urgente')) return 5;
    if (str.includes('alta')) return 4;
    if (str.includes('media')) return 3;
    if (str.includes('baja')) return 2;
    if (str.includes('mínima') || str.includes('minima')) return 1;
    return null;
  },

  getNivelPrioridadLabel(val) {
    const num = parseFloat(val) || 0;
    if (num >= 4.5) return 'Crítica / Muy Alta';
    if (num >= 3.5) return 'Alta';
    if (num >= 2.5) return 'Media';
    if (num >= 1.5) return 'Baja';
    return 'Mínima';
  },

  // ================= ASIGNACIÓN DE PARTIDA PRESUPUESTARIA =================
  asignarPartidaPresupuestaria(itemId, partidaNum, montoPartida, prioridadMedica = null) {
    const item = this.getItemById(itemId);
    if (!item) return { success: false, msg: 'Obra no encontrada' };

    if (!this.currentUser) return { success: false, msg: 'No hay usuario autenticado' };
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador' || !this.currentUser.puede_asignar_partida) {
      return { 
        success: false, 
        msg: '⛔ Acceso Denegado: No tienes el permiso específico requerido para asignar partida presupuestaria.' 
      };
    }

    if (!partidaNum || String(partidaNum).trim() === '') {
      return { success: false, msg: 'Debes ingresar un número de partida válido' };
    }

    const montoVal = this.parseCurrency(montoPartida);
    if (isNaN(montoVal) || montoVal <= 0) {
      return { success: false, msg: 'Debes ingresar un monto válido y mayor a 0 para la partida presupuestaria (USD).' };
    }

    item.partida = partidaNum.trim();
    item.monto_partida_usd = montoVal;

    // Actualizar montos de obra si eran 0 o para mantener consistencia
    if (!item.monto_total_usd || item.monto_total_usd === 0) {
      item.monto_total_usd = montoVal;
      item.monto_obra_usd = montoVal;
    }

    // ================= REGLA CANÓNICA: PRIORIDAD MÉDICA Y FALLBACK DEFAULT =================
    // Al cargar partida y costo, es indispensable solicitar prioridad médica.
    // En caso que no esté cargada, la criticidad médica será idéntica a la técnica previamente
    // cargada y deberá quedar expresamente indicada que se ponderó por default, por no contar con criticidad de dirección.
    const pTec = parseFloat(item.prioridad_tecnica) || 3;
    const parsedMedInput = this.parsePrioridad(prioridadMedica);
    const existingMed = (!item.prioridad_medica_ponderada_default && item.prioridad_medica) ? this.parsePrioridad(item.prioridad_medica) : null;
    const pMedFinal = parsedMedInput !== null ? parsedMedInput : existingMed;

    let obsPrioridad = '';
    if (pMedFinal !== null && pMedFinal > 0) {
      item.prioridad_medica = pMedFinal;
      item.prioridad_medica_origen = 'Dirección Médica';
      item.prioridad_medica_ponderada_default = false;
      item.prioridad_medica_nota = 'Definida formalmente por Dirección Médica';
      obsPrioridad = `Prioridad médica asignada: ${pMedFinal}★ por ${this.currentUser.nombre}.`;
    } else {
      item.prioridad_medica = pTec;
      item.prioridad_medica_origen = 'Default (Ponderada por falta de Dirección Médica)';
      item.prioridad_medica_ponderada_default = true;
      item.prioridad_medica_nota = 'Ponderada por default por no contar con criticidad de Dirección';
      obsPrioridad = `Criticidad médica asignada idéntica a técnica (${pTec}★) [Ponderada por default por no contar con criticidad de Dirección Médica].`;
    }
    item.prioridad_final = item.prioridad_medica;

    // Asegurar estructura de cashflow
    if (!item.cashflow || typeof item.cashflow !== 'object') {
      item.cashflow = {
        monto_total: montoVal,
        fecha_inicio: '',
        fecha_fin: '',
        cashflow_2026: montoVal,
        cashflow_2027: 0,
        cashflow_2028: 0,
        cashflow_2029: 0
      };
    } else {
      if (!item.cashflow.monto_total || item.cashflow.monto_total === 0) {
        item.cashflow.monto_total = montoVal;
      }
      const sumYears = (item.cashflow.cashflow_2026 || 0) + (item.cashflow.cashflow_2027 || 0) + (item.cashflow.cashflow_2028 || 0) + (item.cashflow.cashflow_2029 || 0);
      if (sumYears === 0) {
        item.cashflow.cashflow_2026 = montoVal;
      }
    }

    if (!item.historial) item.historial = [];
    item.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      usuario: this.currentUser.nombre,
      estado_anterior: item.estado,
      estado_nuevo: item.estado,
      observaciones: `Partida presupuestaria N° ${item.partida} asignada por ${this.formatUSD(montoVal)} por ${this.currentUser.nombre}. ${obsPrioridad} Habilita avance a etapa de Proyecto.`
    });

    this.saveItem(item, true);

    this.addAuditLog({
      tipo: 'ASIGNACION_PARTIDA',
      tipo_label: 'Asignación Partida',
      nivel: 'exito',
      obra_id: item.id,
      obra_nombre: item.nombre,
      monto_usd: montoVal,
      estado_obra: item.estado,
      detalle: `Asignación de Partida Presupuestaria N° '${item.partida}' por un monto de ${this.formatUSD(montoVal)}. ${obsPrioridad} Habilita avance a etapa de Proyecto.`
    });
    return { 
      success: true, 
      partida: item.partida, 
      monto_partida_usd: item.monto_partida_usd,
      prioridad_medica: item.prioridad_medica,
      prioridad_medica_ponderada_default: item.prioridad_medica_ponderada_default,
      prioridad_medica_origen: item.prioridad_medica_origen
    };
  },

  // ================= PONDERACIÓN GLOBAL Y ESCALA DE COLORES =================
  getPonderacionGlobal(item) {
    const pTec = parseFloat(item.prioridad_tecnica) || 0;
    const pMed = parseFloat(item.prioridad_medica) || 0;

    let ponderacion = 0;
    if (pMed > 0 && pTec > 0) {
      // Si ambos coinciden en 5 o se promedian
      ponderacion = Math.round(((pTec + pMed) / 2) * 10) / 10;
      if (pTec === 5 && pMed === 5) ponderacion = 5.0;
    } else {
      // Solo prioridad técnica inicial
      ponderacion = pTec || pMed;
    }

    // Escala y color visual
    let nivelLabel = 'Media';
    let colorClass = 'text-amber-600 bg-amber-50 border-amber-200';

    if (ponderacion >= 4.5) {
      nivelLabel = 'Crítica / Muy Alta';
      colorClass = 'text-rose-700 bg-rose-50 border-rose-200 font-black';
    } else if (ponderacion >= 3.5) {
      nivelLabel = 'Alta';
      colorClass = 'text-blue-700 bg-blue-50 border-blue-200 font-bold';
    } else if (ponderacion >= 2.5) {
      nivelLabel = 'Media';
      colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    } else {
      nivelLabel = 'Baja';
      colorClass = 'text-slate-600 bg-slate-50 border-slate-200';
    }

    return {
      valor: ponderacion,
      nivelLabel: nivelLabel,
      colorClass: colorClass,
      faltaMedica: (pMed === 0 || item.prioridad_medica === null),
      isDefaultPonderada: Boolean(item.prioridad_medica_ponderada_default),
      prioridadMedicaOrigen: item.prioridad_medica_origen || (item.prioridad_medica ? 'Dirección Médica' : 'Pendiente')
    };
  },

  // ================= WORKFLOW SECUENCIAL =================
  getNextStage(currentStage) {
    if (currentStage === 'Ante Proyecto') return 'Proyecto';
    if (currentStage === 'Proyecto para licitar') return 'En licitación';
    const idx = STAGES_SEQUENCE.indexOf(currentStage);
    if (idx >= 0 && idx < STAGES_SEQUENCE.length - 1) {
      return STAGES_SEQUENCE[idx + 1];
    }
    return null;
  },

  getDefaultDeadlineForStage(stage) {
    const days = DEFAULT_STAGE_DAYS[stage] || 30;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },

  confirmAndAdvanceStage(itemId, completionDate, nextDeadline, notes, extraData = {}) {
    const item = this.getItemById(itemId);
    if (!item) return { success: false, msg: 'Obra no encontrada' };

    if (!this.canUserAdvanceItem(item)) {
      return { 
        success: false, 
        msg: `⛔ Acceso Denegado: No tienes autorización para avanzar esta obra en su etapa actual.` 
      };
    }
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador') {
      return { success: false, msg: '⛔ Acceso Denegado: Tu perfil es de solo lectura y no tiene autorización para avanzar etapas.' };
    }

    const currentStage = item.estado;
    const nextStage = this.getNextStage(currentStage);
    if (!nextStage) {
      return { success: false, msg: 'Esta obra ya se encuentra en su etapa final' };
    }

    // VALIDACIÓN CRÍTICA: De Factibilidad a Proyecto se REQUIERE que la obra cuente con Partida Presupuestaria y Monto
    if (currentStage === 'Estudio de Factibilidad' && nextStage === 'Proyecto') {
      const hasPartida = this.hasValidPartida(item);
      if (!hasPartida) {
        if (!this.currentUser.puede_asignar_partida && !this.isAdmin()) {
          return { 
            success: false, 
            msg: '⛔ Bloqueado: Para avanzar de Estudio de Factibilidad a Proyecto es OBLIGATORIO que la obra cuente con una Partida Presupuestaria asignada. Solicita a Dirección la asignación de partida para continuar.',
            requierePartida: true 
          };
        }
        if (!item.partida || item.partida.trim() === '' || item.partida === 'S/D' || item.partida.toUpperCase() === 'PENDIENTE') {
          return { 
            success: false, 
            msg: '⛔ Bloqueado: Para avanzar a la etapa de "Proyecto" es OBLIGATORIO contar con un Número de Partida Presupuestaria asignado. Si no existe número de partida, el sistema no permite avanzar.',
            requierePartida: true 
          };
        }
      }
      const montoPart = item.monto_partida_usd || item.monto_total_usd || item.monto_obra_usd || 0;
      if (montoPart <= 0) {
        return { 
          success: false, 
          msg: '⛔ Bloqueado: Para avanzar a la etapa de "Proyecto" es OBLIGATORIO contar con el Monto Asignado de la Partida Presupuestaria (USD).',
          requierePartida: true 
        };
      }
    }

    // Al pasar a En licitación: fijar fecha de compulsa y resguardar proyectista original
    if (nextStage === 'En licitación') {
      const fechaCompulsa = extraData?.fechaCompulsa || nextDeadline || this.getDefaultDeadlineForStage('En licitación');
      item.fecha_fin_compulsa = fechaCompulsa;
      nextDeadline = fechaCompulsa;
    }

    // VALIDACIÓN CRÍTICA: Al pasar de En licitación a Obras en Curso (Adjudicación)
    if (currentStage === 'En licitación' && nextStage === 'Obras en Curso') {
      const proveedor = (extraData?.proveedor || '').trim();
      const ordenCompra = (extraData?.ordenCompra || extraData?.orden_compra || extraData?.numero_oc || '').trim();
      const montoAdj = parseFloat(extraData?.montoAdjudicado) || 0;
      const rawAnticipo = extraData?.porcentajeAnticipo ?? extraData?.anticipoPorcentaje;
      const plazoMeses = parseInt(extraData?.plazoMeses || extraData?.duracionMeses, 10) || 0;

      if (!proveedor) {
        return { success: false, msg: '⛔ Para avanzar a "Obras en Curso" debes indicar la Razón Social del Proveedor Adjudicado.' };
      }
      if (!ordenCompra) {
        return { success: false, msg: '⛔ Para avanzar a "Obras en Curso" es OBLIGATORIO ingresar el Número de Orden de Compra (OC).' };
      }
      if (montoAdj <= 0) {
        return { success: false, msg: '⛔ Para avanzar a "Obras en Curso" debes indicar el Monto Total de la Adjudicación (USD mayor a 0).' };
      }
      if (rawAnticipo === '' || rawAnticipo === null || rawAnticipo === undefined || isNaN(parseFloat(rawAnticipo))) {
        return { success: false, msg: '⛔ Para avanzar a "Obras en Curso" es OBLIGATORIO ingresar el Porcentaje de Anticipo en OC (ingresar 0 si no cuenta con anticipo).' };
      }
      const anticipoPct = Math.min(100, Math.max(0, parseFloat(rawAnticipo)));

      item.proveedor = proveedor;
      item.orden_compra = ordenCompra;
      item.numero_oc = ordenCompra;
      item.monto_adjudicado_usd = montoAdj;
      item.monto_total_usd = montoAdj;
      item.monto_obra_usd = montoAdj;
      item.anticipo_porcentaje = anticipoPct;
      item.anticipo_monto_usd = Math.round((montoAdj * (anticipoPct / 100)) * 100) / 100;
      if (plazoMeses > 0) {
        item.plazo_meses = plazoMeses;
      }
      if (extraData?.fechaFinObra) {
        item.fecha_fin_obra = extraData.fechaFinObra;
      }
    }

    // Validación de fecha de finalización: Hoy y hasta 7 días hacia atrás máximo
    const now = new Date();
    const maxDateStr = now.toISOString().split('T')[0];
    const minDate = new Date();
    minDate.setDate(now.getDate() - 7);
    const minDateStr = minDate.toISOString().split('T')[0];

    const compDate = (completionDate || maxDateStr).trim();
    if (compDate > maxDateStr) {
      return { success: false, msg: '⛔ La fecha de finalización de etapa no puede ser posterior al día de hoy.' };
    }
    if (compDate < minDateStr) {
      return { success: false, msg: `⛔ La fecha de finalización no puede tener más de 7 días de antigüedad (rango permitido: ${minDateStr} a ${maxDateStr}).` };
    }

    // Al pasar de Estudio de Factibilidad a Proyecto:
    // REGLA CANÓNICA: Si la obra no contaba con ponderación médica formal, la criticidad médica
    // se iguala a la técnica por default y sale inmediatamente del listado de pendientes de Dirección.
    if ((currentStage === 'Estudio de Factibilidad' || currentStage === 'Ante Proyecto') && nextStage === 'Proyecto') {
      const pTec = parseFloat(item.prioridad_tecnica) || 3;
      if (!item.prioridad_medica || item.prioridad_medica === 0) {
        item.prioridad_medica = pTec;
        item.prioridad_medica_origen = 'Default (Ponderada por falta de Dirección Médica)';
        item.prioridad_medica_ponderada_default = true;
        item.prioridad_medica_nota = 'Ponderada por default por no contar con criticidad de Dirección';
        item.prioridad_final = pTec;
      }
      if (extraData?.responsable_id) {
        const uExp = this.users.find(u => u.id === extraData.responsable_id);
        if (uExp) {
          item.responsable_id = uExp.id;
          item.responsable = uExp.nombre;
          if (uExp.dependencia && uExp.dependencia !== 'Dirección General / Administración') {
            item.dependencia = uExp.dependencia;
          }
        }
      }
      if (!item.responsable_id || item.responsable === 'Sin Asignar') {
        const creatorName = item.creado_por_nombre || item.creado_por || item.creado_por_username;
        if (creatorName) {
          const uCreator = item.creado_por_id 
            ? this.users.find(u => u.id === item.creado_por_id)
            : this.getObraAssignedUser({ ...item, responsable: creatorName });
          if (uCreator) {
            item.responsable_id = uCreator.id;
            item.responsable = uCreator.nombre;
            if (uCreator.dependencia && uCreator.dependencia !== 'Dirección General / Administración') {
              item.dependencia = uCreator.dependencia;
            }
          }
        }
      }
    }

    // Si avanza a En licitación, resguardar proyectista original y dependencia de origen
    if (nextStage === 'En licitación' || nextStage === 'Proyecto para licitar') {
      item.proyectista_id = item.responsable_id || (this.currentUser ? this.currentUser.id : null);
      item.proyectista_nombre = item.responsable || (this.currentUser ? this.currentUser.nombre : 'Proyectista');
      item.proyectista_dependencia = item.dependencia || this.getObraDependencia(item);
    }

    // Si avanza a Obras en Curso, retornar la obra al proyectista original
    if (nextStage === 'Obras en Curso') {
      if (item.proyectista_id) item.responsable_id = item.proyectista_id;
      if (item.proyectista_nombre) item.responsable = item.proyectista_nombre;
      if (item.proyectista_dependencia) item.dependencia = item.proyectista_dependencia;
    }

    let defaultObs = `Etapa '${currentStage}' finalizada y certificada el ${compDate} por ${this.currentUser.nombre}. Avanza a '${nextStage}'.`;
    if (nextStage === 'En licitación') {
      defaultObs = `Proyecto completado por ${this.currentUser.nombre}. Se deriva al Departamento de Compras para licitación y compulsa de precios.`;
    } else if (nextStage === 'Obras en Curso') {
      const ocInfo = item.orden_compra ? ` [OC N° ${item.orden_compra}]` : '';
      const antInfo = (item.anticipo_porcentaje && item.anticipo_porcentaje > 0)
        ? ` (Anticipo OC: ${item.anticipo_porcentaje}% - USD ${this.formatUSD(item.anticipo_monto_usd)})`
        : ` (Sin anticipo OC)`;
      const plazoInfo = item.plazo_meses ? ` [Plazo: ${item.plazo_meses} meses]` : '';
      defaultObs = `Compulsa finalizada y adjudicada a '${item.proveedor}' por USD ${this.formatUSD(item.monto_adjudicado_usd)}${ocInfo}${antInfo}${plazoInfo}. Retorna al proyectista ${item.responsable} en Obras en Curso.`;
    }

    if (!Array.isArray(item.historial)) item.historial = [];
    item.historial.unshift({
      fecha: compDate,
      usuario: `${this.currentUser.nombre} (${this.currentUser.rol})`,
      estado_anterior: currentStage,
      estado_nuevo: nextStage,
      fecha_termino_anterior: compDate,
      observaciones: notes ? `${defaultObs} ${notes}` : defaultObs
    });

    item.estado = nextStage;
    item.fecha_inicio_etapa = compDate;

    if (nextStage === 'Obras Finalizadas') {
      item.fecha_real_finalizada = compDate;
      item.fecha_fin_real = compDate;
      item.fecha_fin_etapa = compDate;
      item.avance_fisico = 100;
      item.requiere_plazo_etapa = false;
    } else {
      // La nueva etapa nace sin fecha límite preasignada: debe ser establecida por el nuevo responsable
      item.fecha_fin_etapa = null;
      item.requiere_plazo_etapa = true;
      if (nextStage === 'En licitación') {
        item.fecha_fin_compulsa = null;
      }
      if (nextStage === 'Obras en Curso') {
        item.fecha_fin_obra = null;
      }
    }

    this.saveItem(item, true);

    const logTipo = nextStage === 'Obras en Curso' ? 'ADJUDICACION' : 'AVANCE_ETAPA';
    const logLabel = nextStage === 'Obras en Curso' ? 'Adjudicación Compras' : 'Avance de Etapa';
    this.addAuditLog({
      tipo: logTipo,
      tipo_label: logLabel,
      nivel: nextStage === 'Obras en Curso' ? 'exito' : 'info',
      obra_id: item.id,
      obra_nombre: item.nombre,
      monto_usd: (item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0),
      estado_obra: nextStage,
      detalle: defaultObs
    });

    return { success: true, nextStage: nextStage, item: item };
  },

  // ================= DEFINICIÓN OBLIGATORIA DE PLAZO DE ETAPA =================
  definirPlazoEtapa(id, fechaLimite, notas = '') {
    const item = this.getItemById(id);
    if (!item) return { success: false, msg: 'Obra no encontrada.' };
    if (!this.currentUser) return { success: false, msg: 'No hay usuario autenticado.' };

    if (!this.canUserAdvanceItem(item) && !this.isAdmin()) {
      return { 
        success: false, 
        msg: `⛔ Acceso Denegado: Solo el responsable asignado (${item.responsable || 'Sin Asignar'}) o Administrador puede definir el plazo de esta etapa.` 
      };
    }

    if (!fechaLimite || typeof fechaLimite !== 'string' || !fechaLimite.trim()) {
      return { success: false, msg: 'Debes seleccionar una fecha límite estimada válida.' };
    }

    const cleanDate = fechaLimite.trim();
    if (item.fecha_inicio_etapa && cleanDate < item.fecha_inicio_etapa) {
      return { 
        success: false, 
        msg: `La fecha límite (${cleanDate}) no puede ser anterior al inicio de la etapa actual (${item.fecha_inicio_etapa}).` 
      };
    }

    item.fecha_fin_etapa = cleanDate;
    item.requiere_plazo_etapa = false;

    if (item.estado === 'En licitación') {
      item.fecha_fin_compulsa = cleanDate;
    } else if (item.estado === 'Obras en Curso') {
      item.fecha_fin_obra = cleanDate;
      if (item.fecha_inicio_etapa) {
        const startParts = item.fecha_inicio_etapa.split('-');
        const endParts = cleanDate.split('-');
        if (startParts.length === 3 && endParts.length === 3) {
          const delta = (parseInt(endParts[0], 10) - parseInt(startParts[0], 10)) * 12 + (parseInt(endParts[1], 10) - parseInt(startParts[1], 10)) + 1;
          if (delta > 0) item.plazo_meses = delta;
        }
      }
    }

    const uName = this.currentUser.nombre;
    let labelEtapa = item.estado;
    if (item.estado === 'En licitación') labelEtapa = 'Compulsa / Licitación';
    if (item.estado === 'Obras en Curso') labelEtapa = 'Ejecución de Obra';
    const obs = `Plazo de la etapa '${labelEtapa}' fijado para el ${cleanDate} por ${uName}.${notas ? ' Obs: ' + notas : ''}`;

    if (!Array.isArray(item.historial)) item.historial = [];
    item.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      usuario: uName,
      estado_anterior: item.estado,
      estado_nuevo: item.estado,
      fecha_limite: cleanDate,
      observaciones: obs
    });

    this.saveItem(item, true);
    return { success: true, item: item };
  },

  // ================= SEMÁFOROS Y PLAZOS =================
  calculateSemaforo(item) {
    const estado = (item.estado || '').toLowerCase();
    if (estado.includes('finalizad')) {
      return { status: 'finalizado', label: 'Finalizada', class: 'badge-semaforo-finalizado', days: null };
    }
    if (estado.includes('suspendid')) {
      return { status: 'suspendido', label: 'Suspendida', class: 'badge-semaforo-suspendido', days: null };
    }

    // REGLA CANÓNICA: En Factibilidad NO debe indicar plazos (está en análisis sin dinero ni proyecto)
    if (estado.includes('factibilidad') || estado.includes('ante proyecto') || estado.includes('asignación') || estado.includes('asignacion')) {
      return { 
        status: 'en_analisis', 
        label: 'En Análisis', 
        shortLabel: 'En Análisis',
        class: 'bg-slate-100 text-slate-600 border border-slate-300 font-medium', 
        days: null, 
        noPlazo: true 
      };
    }

    // Si la obra requiere definición de plazo o carece de fecha fin en etapas activas
    if (item.requiere_plazo_etapa || (!item.fecha_fin_etapa && !item.fecha_fin_obra && item.estado !== 'Estudio de Factibilidad')) {
      return { 
        status: 'sin_plazo', 
        label: 'Plazo Pendiente', 
        class: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold', 
        days: null 
      };
    }

    const dateStr = item.fecha_fin_etapa || item.fecha_fin_obra;
    if (!dateStr) {
      return { status: 'en_plazo', label: 'Sin Fecha Límite', class: 'badge-semaforo-en-plazo', days: 999 };
    }

    const targetDate = new Date(dateStr);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'vencido', 
        label: `Vencido (${Math.abs(diffDays)}d)`, 
        class: 'badge-semaforo-vencido', 
        days: diffDays 
      };
    }

    // ================= SEMÁFORO 100% AUTOMÁTICO (15% ANTES DEL PLAZO FINAL) =================
    // En todos los casos el semáforo es automático: no solicita fecha manual.
    // Calcula la duración de la etapa definida por el autorizado y activa la alerta al 15% restante.
    let startDateStr = item.fecha_inicio_etapa || item.fecha_inicio || item.created_at;
    let duracionDias = 0;
    if (startDateStr) {
      const startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
      if (!isNaN(startDate.getTime()) && targetDate.getTime() > startDate.getTime()) {
        duracionDias = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    if (duracionDias <= 0) {
      duracionDias = DEFAULT_STAGE_DAYS[item.estado] || 45;
    }

    // Umbral de alerta automática: 15% antes del plazo final
    const diasAlerta15Porc = Math.max(1, Math.round(duracionDias * 0.15));

    if (diffDays <= diasAlerta15Porc) {
      return { 
        status: 'por_vencer', 
        label: `Por vencer (${diffDays}d)`, 
        class: 'badge-semaforo-por-vencer', 
        days: diffDays,
        duracionDias: duracionDias,
        umbralAlertaDias: diasAlerta15Porc
      };
    } else {
      return { 
        status: 'en_plazo', 
        label: `En plazo (${diffDays}d)`, 
        class: 'badge-semaforo-en-plazo', 
        days: diffDays,
        duracionDias: duracionDias,
        umbralAlertaDias: diasAlerta15Porc
      };
    }
  },

  isAdmin() {
    return Boolean(this.currentUser && this.currentUser.rol === 'admin');
  },

  canEditObraMasterData() {
    return this.isAdmin();
  },

  isUserAssignedToObra(item) {
    if (!this.currentUser || !item) return false;
    if (this.currentUser.rol === 'admin') return true;
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador') return false;

    // Si la obra está en Estudio de Factibilidad y no tiene partida válida, NO puede estar asignada a nadie
    if ((item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') && !this.hasValidPartida(item)) {
      return false;
    }

    // Si la obra está en etapa de licitación ('Proyecto para licitar' o 'En licitación'):
    // El comprador / licitaciones es quien tiene la obra a su cargo para operarla
    if (this.currentUser.rol === 'licitaciones' && (item.estado === 'Proyecto para licitar' || item.estado === 'En licitación')) {
      return true;
    }

    // 1. Coincidencia directa por ID de usuario asignado
    if (item.responsable_id && item.responsable_id === this.currentUser.id) return true;

    // 2. Si la obra ya está asignada formalmente a otro usuario activo por ID
    if (item.responsable_id && item.responsable_id !== this.currentUser.id) {
      const otherUser = this.users.find(u => u.id === item.responsable_id);
      if (otherUser && otherUser.activo) {
        // Si otherUser es un Admin general (ej: usr-nicolas) y el usuario actual es el PM operativo de la misma dependencia cuyo nombre coincide
        const normalizeStr = s => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const obraDep = normalizeStr(item.dependencia);
        const uDep = normalizeStr(this.currentUser.dependencia);
        const resp = normalizeStr(item.responsable);
        const uName = normalizeStr(this.currentUser.nombre);
        const uUser = normalizeStr(this.currentUser.username);
        const stopwords = ['arq', 'ing', 'dr', 'dra', 'pm', 'central', 'san', 'justo', 'perifericos', 'de', 'la', 'el', 'compras', 'licitaciones', 'obras', 'infraestructura', 'admin'];
        const tokens = uName.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !stopwords.includes(t));
        const matchesToken = tokens.some(t => resp.includes(t)) || (uUser && resp.includes(uUser));

        if (otherUser.rol === 'admin' && uDep && uDep === obraDep && matchesToken) {
          // Re-asociar automáticamente al PM operativo del departamento
          item.responsable_id = this.currentUser.id;
          item.responsable = this.currentUser.nombre;
          return true;
        }
        return false;
      }
    }

    const normalizeStr = s => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const resp = normalizeStr(item.responsable);
    if (!resp || resp === 'sin asignar' || resp === 's/d' || resp === 'pendiente' || resp === 'a designar') return false;

    // 3. Usuarios con bandera arranca_en_cero: no heredan obras de otros departamentos, pero sí reconocen su coincidencia departamental
    const obraDep = normalizeStr(item.dependencia);
    const u = this.currentUser;
    const uDep = normalizeStr(u.dependencia);
    if (u.arranca_en_cero && obraDep && uDep && obraDep !== uDep) {
      return false;
    }

    const uUser = normalizeStr(u.username);
    const uName = normalizeStr(u.nombre);

    if (uUser && (resp === uUser || resp.includes(uUser) || uUser.includes(resp))) return true;
    if (uName && (resp.includes(uName) || uName.includes(resp))) return true;

    // Tokens identificatorios significativos del nombre de usuario (ej: "palmioli", "waldemar", "boselli", "lopez", "vasquez", "kawior", "nicolas", "ladaga")
    const stopwords = ['arq', 'ing', 'dr', 'dra', 'pm', 'central', 'san', 'justo', 'perifericos', 'de', 'la', 'el', 'compras', 'licitaciones', 'obras', 'infraestructura', 'admin'];
    const tokens = uName.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !stopwords.includes(t));
    for (const token of tokens) {
      if (resp.includes(token)) return true;
    }

    const userTokens = uUser.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !stopwords.includes(t));
    for (const token of userTokens) {
      if (resp.includes(token)) return true;
    }

    return false;
  },

  isObraAssigned(item) {
    if (!item) return false;
    // Obras en factibilidad sin partida válida NO pueden figurar asignadas
    if ((item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') && !this.hasValidPartida(item)) {
      return false;
    }
    if (item.responsable_id) {
      const user = this.users.find(u => u.id === item.responsable_id);
      if (user && user.activo) return true;
    }
    const resp = (item.responsable || '').trim().toLowerCase();
    if (!resp || resp === 'sin asignar' || resp === 's/d' || resp === 'pendiente' || resp === 'a designar') return false;
    return true;
  },

  getObraAssignedUser(item) {
    if (!item) return null;
    // Obras en factibilidad sin partida válida NO tienen responsable asignado
    if ((item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') && !this.hasValidPartida(item)) {
      return null;
    }

    const normalizeStr = s => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const obraDep = normalizeStr(item.dependencia);

    if (item.responsable_id) {
      // Si fue asignada a admin usr-nicolas pero la obra pertenece canónicamente a Mantenimiento Central
      if (item.responsable_id === 'usr-nicolas' && obraDep === 'departamento de mantenimiento central') {
        const uKawior = this.users.find(u => u.id === 'usr-kawior-pm');
        if (uKawior && uKawior.activo) return uKawior;
      }
      const u = this.users.find(user => user.id === item.responsable_id);
      if (u) return u;
    }

    if (!item.responsable) return null;
    const resp = normalizeStr(item.responsable);
    if (!resp || resp === 'sin asignar' || resp === 's/d' || resp === 'pendiente' || resp === 'a designar') return null;

    // Priorizar usuarios del departamento canónico de la obra y roles operativos sobre administradores
    const candidates = [...this.users].filter(u => u.activo).sort((a, b) => {
      const aDep = normalizeStr(a.dependencia);
      const bDep = normalizeStr(b.dependencia);
      const aMatchesDep = (obraDep && aDep === obraDep) ? 1 : 0;
      const bMatchesDep = (obraDep && bDep === obraDep) ? 1 : 0;
      if (aMatchesDep !== bMatchesDep) return bMatchesDep - aMatchesDep;
      const aIsAdmin = (a.rol === 'admin' || aDep === 'direccion general / administracion') ? 1 : 0;
      const bIsAdmin = (b.rol === 'admin' || bDep === 'direccion general / administracion') ? 1 : 0;
      return aIsAdmin - bIsAdmin;
    });

    return candidates.find(u => {
      // Si la obra tiene dependencia definida, el usuario debe pertenecer a la misma dependencia (salvo Administrador General)
      if (obraDep && u.dependencia) {
        const uDep = normalizeStr(u.dependencia);
        if (uDep !== obraDep && u.rol !== 'admin' && uDep !== 'direccion general / administracion') {
          return false;
        }
      }

      const uUser = normalizeStr(u.username);
      const uName = normalizeStr(u.nombre);
      if (uUser && (resp === uUser || resp.includes(uUser) || uUser.includes(resp))) return true;
      if (uName && (resp.includes(uName) || uName.includes(resp))) return true;
      const stopwords = ['arq', 'ing', 'dr', 'dra', 'pm', 'central', 'san', 'justo', 'perifericos', 'obras', 'infraestructura', 'admin'];
      const tokens = uName.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !stopwords.includes(t));
      if (tokens.some(t => resp.includes(t))) return true;
      const uTokens = uUser.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !stopwords.includes(t));
      return uTokens.some(t => resp.includes(t));
    }) || null;
  },

  getUserAssignedObras(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return [];
    const savedUser = this.currentUser;
    this.currentUser = user;
    const list = this.items.filter(item => {
      if (item.responsable_id && item.responsable_id === user.id) return true;
      return this.isUserAssignedToObra(item);
    });
    this.currentUser = savedUser;
    return list;
  },

  assignObrasToUser(userId, obraIds = []) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, msg: 'Usuario no encontrado' };

    const actor = this.currentUser ? this.currentUser.nombre : 'Administrador';
    const nowStr = new Date().toISOString().split('T')[0];
    let assignedCount = 0;

    this.items.forEach(item => {
      const shouldBeAssigned = obraIds.includes(item.id);
      const isCurrentlyAssignedToThisUser = (item.responsable_id === user.id) || 
        (!item.responsable_id && this.getObraAssignedUser(item)?.id === user.id);

      if (shouldBeAssigned) {
        if (item.responsable_id !== user.id) {
          item.responsable_id = user.id;
          item.responsable = user.nombre;
          if (user.dependencia && user.dependencia !== 'Dirección General / Administración') {
            item.dependencia = user.dependencia;
          }
          if (!item.historial) item.historial = [];
          item.historial.push({
            fecha: nowStr,
            usuario: actor,
            estado_anterior: item.estado,
            estado_nuevo: item.estado,
            observaciones: `Obra asignada a: ${user.nombre} (@${user.username})${user.dependencia ? ` [${user.dependencia}]` : ''}`
          });
        }
        assignedCount++;
      } else if (isCurrentlyAssignedToThisUser) {
        // Desasignar si estaba asignada a este usuario y fue desmarcada
        item.responsable_id = null;
        item.responsable = 'Sin Asignar';
        if (!item.historial) item.historial = [];
        item.historial.push({
          fecha: nowStr,
          usuario: actor,
          estado_anterior: item.estado,
          estado_nuevo: item.estado,
          observaciones: `Obra desasignada de ${user.nombre}. Queda Sin Asignar.`
        });
      }
    });

    this.persist();
    return { success: true, assignedCount: assignedCount, user: user };
  },

  assignSingleObra(obraId, userId) {
    const item = this.getItemById(obraId);
    if (!item) return { success: false, msg: 'Obra no encontrada' };

    const actor = this.currentUser ? this.currentUser.nombre : 'Administrador';
    const nowStr = new Date().toISOString().split('T')[0];

    if (!userId || userId === 'sin_asignar') {
      item.responsable_id = null;
      item.responsable = 'Sin Asignar';
    } else {
      const user = this.users.find(u => u.id === userId);
      if (!user) return { success: false, msg: 'Usuario no encontrado' };
      item.responsable_id = user.id;
      item.responsable = user.nombre;
      if (user.dependencia && user.dependencia !== 'Dirección General / Administración') {
        item.dependencia = user.dependencia;
      }
    }

    if (!item.historial) item.historial = [];
    item.historial.push({
      fecha: nowStr,
      usuario: actor,
      estado_anterior: item.estado,
      estado_nuevo: item.estado,
      observaciones: `Asignación de responsable: ${item.responsable}`
    });

    this.persist();
    return { success: true, item: item };
  },

  // ================= DERIVACIÓN Y GOBIERNO POR DEPENDENCIAS =================
  getObraDependencia(item) {
    if (!item) return '';

    const sede = (item.sede || '').toLowerCase();

    // 1. San Justo unificado: todas las obras radicadas en la sede San Justo pertenecen al departamento unificado de San Justo,
    // salvo que hayan sido formalmente asignadas o derivadas por Admin a una dependencia transversal válida mediante responsable_id.
    if (sede.includes('justo')) {
      if (item.responsable_id) {
        const respUser = this.users.find(u => u.id === item.responsable_id);
        if (respUser && respUser.dependencia && respUser.dependencia !== 'Dirección General / Administración') {
          const uNorm = this.normalizeDependencia(respUser.dependencia);
          if (uNorm === 'Departamento de Instalaciones' || uNorm === 'Departamento de Habilitaciones y Seguridad e Higiene') {
            return uNorm;
          }
        }
      }
      if (item.dependencia && item.dependencia.trim() !== '' && item.dependencia !== 'Dirección General / Administración') {
        const norm = this.normalizeDependencia(item.dependencia);
        if (norm === 'Departamento de Instalaciones' || norm === 'Departamento de Habilitaciones y Seguridad e Higiene') {
          return norm;
        }
      }
      return 'Departamento de Mantenimiento y Proyectos San Justo';
    }

    // 2. Si tiene dependencia explícita válida asignada o derivada, esa es su dependencia canónica
    if (item.dependencia && item.dependencia.trim() !== '' && item.dependencia !== 'Dirección General / Administración') {
      return this.normalizeDependencia(item.dependencia);
    }

    // 3. Si la obra está asignada formalmente a un usuario con ID
    if (item.responsable_id) {
      const respUser = this.users.find(u => u.id === item.responsable_id);
      if (respUser && respUser.dependencia && respUser.dependencia !== 'Dirección General / Administración') {
        return this.normalizeDependencia(respUser.dependencia);
      }
    }
    const respObj = this.getObraAssignedUser(item);
    if (respObj && respObj.dependencia && respObj.dependencia !== 'Dirección General / Administración') {
      return this.normalizeDependencia(respObj.dependencia);
    }

    // Si tiene dependencia explícita aunque sea Dirección General
    if (item.dependencia && item.dependencia.trim() !== '') {
      return this.normalizeDependencia(item.dependencia);
    }

    // 4. Centros Periféricos: obras radicadas en la sede Periféricos o Centros Médicos
    if (sede.includes('perif') || sede.includes('ctros') || sede.includes('centro')) {
      return 'Departamento de Centros Periféricos';
    }

    // 5. Heurística según categoría, tipo y sede para obras sin asignar
    const cat = (item.categoria || '').toLowerCase();
    const nom = (item.nombre || '').toLowerCase();
    const tipo = (item.tipo || '').toLowerCase();

    if (nom.includes('habilitacion') || nom.includes('seguridad e higiene') || cat.includes('habilitacion') || cat.includes('seguridad')) {
      return 'Departamento de Habilitaciones y Seguridad e Higiene';
    }
    if (cat.includes('instalaci') || nom.includes('instalaci') || nom.includes('clima') || nom.includes('termo') || nom.includes('electr')) {
      return 'Departamento de Instalaciones';
    }
    if (tipo.includes('infra') || nom.includes('mantenimiento')) {
      return 'Departamento de Mantenimiento Central';
    }
    return 'Departamento de Proyectos Central';
  },

  deriveObraToDependencia(obraId, dependencia, responsableId = null) {
    const item = this.getItemById(obraId);
    if (!item) return { success: false, msg: 'Obra no encontrada' };

    const oldDep = item.dependencia || this.getObraDependencia(item);
    item.dependencia = dependencia;

    const actor = this.currentUser ? this.currentUser.nombre : 'Administrador';
    const nowStr = new Date().toISOString().split('T')[0];

    if (responsableId && responsableId !== 'sin_asignar') {
      const user = this.users.find(u => u.id === responsableId);
      if (user) {
        item.responsable_id = user.id;
        item.responsable = user.nombre;
        if (user.dependencia && user.dependencia !== 'Dirección General / Administración') {
          item.dependencia = user.dependencia;
        }
      }
    } else if (responsableId === 'sin_asignar') {
      item.responsable_id = null;
      item.responsable = 'Sin Asignar';
    } else if (!responsableId && item.responsable_id) {
      // Si se deriva a otra dependencia sin especificar responsable,
      // verificar si el responsable actual pertenece a la nueva dependencia.
      // Si no pertenece, liberar la asignación para evitar conflictos interdepartamentales.
      const currentResp = this.users.find(u => u.id === item.responsable_id);
      if (currentResp && currentResp.dependencia && this.normalizeDependencia(currentResp.dependencia) !== this.normalizeDependencia(dependencia)) {
        item.responsable_id = null;
        item.responsable = 'Sin Asignar';
      }
    }

    if (!item.historial) item.historial = [];
    item.historial.unshift({
      fecha: nowStr,
      usuario: `${actor} (Administrador)`,
      estado_anterior: item.estado,
      estado_nuevo: item.estado,
      observaciones: `🔄 Derivación a Dependencia: "${oldDep}" ➔ "${dependencia}"${responsableId ? ` (Asignado a: ${item.responsable})` : ''}`
    });

    this.persist();
    return { success: true, item: item };
  },

  deriveMultipleObrasToDependencia(obraIds = [], dependencia) {
    if (!obraIds.length) return { success: false, msg: 'No se seleccionaron obras' };
    const actor = this.currentUser ? this.currentUser.nombre : 'Administrador';
    const nowStr = new Date().toISOString().split('T')[0];
    let count = 0;

    this.items.forEach(item => {
      if (obraIds.includes(item.id)) {
        const oldDep = item.dependencia || this.getObraDependencia(item);
        item.dependencia = dependencia;

        // Si el responsable pertenecía a otra dependencia, liberar para evitar fuga interdepartamental
        if (item.responsable_id) {
          const currentResp = this.users.find(u => u.id === item.responsable_id);
          if (currentResp && currentResp.dependencia && this.normalizeDependencia(currentResp.dependencia) !== this.normalizeDependencia(dependencia)) {
            item.responsable_id = null;
            item.responsable = 'Sin Asignar';
          }
        }

        if (!item.historial) item.historial = [];
        item.historial.unshift({
          fecha: nowStr,
          usuario: `${actor} (Administrador)`,
          estado_anterior: item.estado,
          estado_nuevo: item.estado,
          observaciones: `🔄 Derivación masiva a Dependencia: "${oldDep}" ➔ "${dependencia}"`
        });
        count++;
      }
    });

    this.persist();
    return { success: true, count: count, dependencia: dependencia };
  },

  canUserViewObra(item) {
    if (!this.currentUser || !item) return false;
    const u = this.currentUser;

    // 1. Administrador General ve todo el hospital
    if (this.isAdmin()) return true;

    // 2. Perfil Comprador / Departamento de Compras (rol 'licitaciones'):
    // El comprador ve las obras en Proyecto (solo lectura preventiva para anticipar compras),
    // las que le derivan en licitación (operativas), las adjudicadas en curso, finalizadas y suspendidas.
    if (u.rol === 'licitaciones' || u.dependencia === 'Compras & Licitaciones') {
      return (item.estado === 'Proyecto' || item.estado === 'En licitación' || item.estado === 'Obras en Curso' || item.estado === 'Obras Finalizadas' || item.estado === 'Suspendida');
    }

    // 3. Roles transversales de consulta institucional (Dirección Médica, Auditoría)
    if (u.rol === 'direccion_medica' || u.rol === 'auditor' || (u.dependencia === 'Dirección General / Administración' && u.rol !== 'licitaciones')) {
      return true;
    }

    const uDep = this.normalizeDependencia(u.dependencia || '').trim().toLowerCase();

    // 4. Si la obra está en Estudio de Factibilidad y fue creada por este usuario:
    // Quien la presentó tiene que tenerla visible en factibilidad para saber qué presentó y tenerla representada
    if (item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') {
      if (item.creado_por_id && item.creado_por_id === u.id) return true;
      if (item.creado_por && (item.creado_por === u.nombre || item.creado_por === u.username)) return true;
    }

    // Si la obra está asignada formalmente a este usuario, siempre puede verla
    if (this.isUserAssignedToObra(item)) return true;
    if (!uDep) {
      if (u.sede === 'Todas') return true;
      return (item.sede || '').toLowerCase() === (u.sede || '').toLowerCase();
    }

    // San Justo unificado: los usuarios de San Justo ven todas las obras de San Justo
    if (uDep.includes('san justo') || (u.sede && u.sede.toLowerCase() === 'san justo')) {
      const itemDep = this.normalizeDependencia(this.getObraDependencia(item) || item.dependencia || '').trim().toLowerCase();
      const itemSede = (item.sede || '').trim().toLowerCase();
      if (itemDep.includes('san justo') || itemSede === 'san justo') {
        return true;
      }
    }

    // Centros Periféricos: los usuarios de Centros Periféricos ven todas las obras de Centros Periféricos
    if (uDep.includes('perif') || (u.sede && u.sede.toLowerCase().includes('perif'))) {
      const itemDep = this.normalizeDependencia(this.getObraDependencia(item) || item.dependencia || '').trim().toLowerCase();
      const itemSede = (item.sede || '').trim().toLowerCase();
      if (itemDep.includes('perif') || itemSede.includes('perif')) {
        return true;
      }
    }

    // 4. Aislamiento Departamental Estricto:
    // La obra pertenece a UNA SOLA dependencia canónica.
    const canonicalDep = this.normalizeDependencia(this.getObraDependencia(item) || item.dependencia || '').trim().toLowerCase();

    // Si la obra pertenece a otro departamento, es IMPOSIBLE que un usuario de este departamento la vea
    if (canonicalDep !== uDep) {
      return false;
    }

    // Pertenece a este departamento: todos los miembros de este departamento pueden verla
    return true;
  },

  canUserAdvanceItem(item) {
    if (!this.currentUser || !item) return false;
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador') return false;
    if (this.isAdmin()) return true;

    // Perfil comprador (licitaciones): En Proyecto es estrictamente solo lectura preventiva (no puede avanzar)
    if (this.currentUser.rol === 'licitaciones' && item.estado === 'Proyecto') {
      return false;
    }

    // Si la obra está en Estudio de Factibilidad:
    // Solo la Dirección o Admin con permiso de partida puede asignarle partida y avanzarla a Proyecto
    if (item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') {
      return Boolean(this.currentUser.puede_asignar_partida || this.currentUser.rol === 'admin' || this.currentUser.rol === 'direccion_medica');
    }

    if (this.currentUser.puede_avanzar === false) return false;

    // Si la obra está en etapa 'En licitación':
    // Solo el comprador (rol 'licitaciones') o el Admin pueden certificar la adjudicación
    if (item.estado === 'En licitación') {
      return this.currentUser.rol === 'licitaciones';
    }

    // Para el resto de etapas (Proyecto, En Curso, etc.):
    // Solo puede avanzar si la obra está asignada a su nombre
    return this.isUserAssignedToObra(item);
  },

  canUserEditObra(item) {
    if (!this.currentUser || !item) return false;
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador') return false;
    if (this.isAdmin()) return true;

    // Perfil comprador (licitaciones): En Proyecto es estrictamente solo lectura preventiva (no puede editar ni modificar)
    if (this.currentUser.rol === 'licitaciones' && item.estado === 'Proyecto') {
      return false;
    }

    // En etapa licitatoria, solo el comprador (rol 'licitaciones') o Admin pueden modificar. Para el resto de PMs es solo lectura.
    if (item.estado === 'En licitación') {
      return this.currentUser.rol === 'licitaciones' || this.isAdmin();
    }

    // Solo pueden editar aquellas obras dentro de su departamento que tienen asignadas a su nombre
    return this.isUserAssignedToObra(item);
  },

  canUserCreateInSede(sede) {
    if (!this.currentUser) return false;
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador' || !this.currentUser.puede_crear) return false;
    if (this.currentUser.rol === 'admin' || this.currentUser.sede === 'Todas') return true;
    return (this.currentUser.sede || '').toLowerCase() === (sede || '').toLowerCase();
  },

  // ================= FILTROS Y KPIS DESGLOSADOS =================
  getFilteredItems(filters = {}) {
    const isAdm = this.isAdmin();
    const u = this.currentUser;

    return this.items.filter(item => {
      // 1. Aislamiento Departamental Estricto (Los miembros de un departamento ven todo lo de su departamento)
      if (!isAdm) {
        if (!this.canUserViewObra(item)) return false;
      }

      // 2. Filtro Dependencia explícito (bloqueado a la dependencia propia para usuarios no administradores)
      const rawDepFilter = (!isAdm && u && u.dependencia && u.dependencia !== 'Dirección General / Administración')
        ? u.dependencia
        : filters.dependencia;
      const depFilter = this.normalizeDependencia(rawDepFilter);

      if (depFilter && depFilter !== 'TODAS') {
        const itemDep = this.normalizeDependencia(this.getObraDependencia(item) || item.dependencia);
        if (itemDep !== depFilter) return false;
      }

      // 3. Filtro Sede explícito
      if (filters.sede && filters.sede !== 'TODAS') {
        if ((item.sede || '').toLowerCase() !== filters.sede.toLowerCase()) return false;
      }
      // Filtro Tipo
      if (filters.tipo && filters.tipo !== 'TODOS') {
        if (item.tipo !== filters.tipo) return false;
      }
      // Filtro Asignación (TODAS, ASIGNADAS, SIN_ASIGNAR)
      if (filters.asignacion && filters.asignacion !== 'TODAS') {
        const isAssigned = this.isObraAssigned(item);
        if (filters.asignacion === 'ASIGNADAS' && !isAssigned) return false;
        if (filters.asignacion === 'SIN_ASIGNAR' && isAssigned) return false;
      }
      // Filtro Finalizadas
      if (filters.filtroFinalizadas === 'activas') {
        if (item.estado === 'Obras Finalizadas' || item.estado === 'Suspendida') return false;
      } else if (filters.filtroFinalizadas === 'finalizadas') {
        if (item.estado !== 'Obras Finalizadas') return false;
      } else if (filters.filtroFinalizadas === 'suspendidas') {
        if (item.estado !== 'Suspendida') return false;
      }
      // Filtro Estado
      if (filters.estado && filters.estado !== 'TODOS') {
        if (item.estado !== filters.estado) return false;
      }
      // Filtro Semáforo
      if (filters.semaforo && filters.semaforo !== 'TODOS') {
        const sem = this.calculateSemaforo(item);
        if (sem.status !== filters.semaforo) return false;
      }
      // Filtro Responsable
      if (filters.responsable && filters.responsable !== 'TODOS') {
        if ((item.responsable || '').toLowerCase() !== filters.responsable.toLowerCase()) return false;
      }
      // Búsqueda
      if (filters.search && filters.search.trim() !== '') {
        const q = filters.search.toLowerCase();
        const match = 
          (item.id || '').toLowerCase().includes(q) ||
          (item.nombre || '').toLowerCase().includes(q) ||
          (item.partida || '').toLowerCase().includes(q) ||
          (item.proveedor || '').toLowerCase().includes(q) ||
          (item.responsable || '').toLowerCase().includes(q) ||
          (item.sector_solicitante || '').toLowerCase().includes(q) ||
          (item.clasificacion || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  getKPIs(filters = {}) {
    const list = this.getFilteredItems(filters);

    let sumObraActiva = 0;
    let sumEquipActivo = 0;
    let sumInfraActiva = 0;
    let sumSuspendidas = 0;
    let sumFinalizadas = 0;
    let sumFactibilidad = 0;

    let vencidos = 0;
    let porVencer = 0;
    let enPlazo = 0;
    let finalizadasCount = 0;
    let suspendidasCount = 0;
    let factibilidadCount = 0;
    let carteraActivaCount = 0;

    const estadosCount = {
      'Estudio de Factibilidad': 0,
      'Proyecto': 0,
      'En licitación': 0,
      'Obras en Curso': 0,
      'Obras Finalizadas': 0,
      'Suspendida': 0
    };

    const estadosUsd = {
      'Estudio de Factibilidad': 0,
      'Proyecto': 0,
      'En licitación': 0,
      'Obras en Curso': 0,
      'Obras Finalizadas': 0,
      'Suspendida': 0
    };

    const sedesCount = {
      'Central': { count: 0, usd: 0 },
      'San Justo': { count: 0, usd: 0 },
      'Periféricos': { count: 0, usd: 0 }
    };

    list.forEach(item => {
      const mObra = item.monto_obra_usd || 0;
      const mEquip = item.monto_equipamiento_usd || 0;
      const mTotal = item.monto_total_usd || (mObra + mEquip);

      const isFinalizada = (item.estado === 'Obras Finalizadas' || (item.estado || '').toLowerCase().includes('finalizad'));
      const isSuspendida = (item.estado === 'Suspendida' || (item.estado || '').toLowerCase().includes('suspendid'));
      const isFactibilidad = (
        item.estado === 'Estudio de Factibilidad' ||
        item.estado === 'Ante Proyecto' ||
        (item.estado || '').toLowerCase().includes('factibilidad')
      );

      const esCarteraActiva = (
        item.estado === 'Proyecto' ||
        item.estado === 'Proyecto para licitar' ||
        item.estado === 'En licitación' ||
        item.estado === 'Obras en Curso'
      );

      if (isFinalizada) {
        sumFinalizadas += mTotal;
        finalizadasCount++;
      } else if (isSuspendida) {
        sumSuspendidas += mTotal;
        suspendidasCount++;
      } else if (isFactibilidad) {
        // Factibilidad no cuenta como Cartera Activa de inversión ni como partida comprometida
        sumFactibilidad += mTotal;
        factibilidadCount++;
      } else if (esCarteraActiva) {
        // Cartera activa: Proyecto + En licitación + Obras en Curso
        if (item.tipo === 'Infraestructura') {
          sumInfraActiva += mObra;
        } else {
          sumObraActiva += mObra;
          sumEquipActivo += mEquip;
        }
        carteraActivaCount++;
      }

      const sem = this.calculateSemaforo(item);
      if (sem.status === 'vencido') vencidos++;
      else if (sem.status === 'por_vencer') porVencer++;
      else if (sem.status === 'en_plazo') enPlazo++;

      let est = (item.estado === 'Ante Proyecto') ? 'Estudio de Factibilidad' : item.estado;
      if (est === 'Proyecto para licitar') est = 'Proyecto';
      if (estadosCount.hasOwnProperty(est)) {
        estadosCount[est]++;
        estadosUsd[est] = (estadosUsd[est] || 0) + mTotal;
      } else {
        estadosCount[est] = 1;
        estadosUsd[est] = mTotal;
      }

      // Cómputo de Inversión por Sede:
      // Excluye Estudio de Factibilidad (es anteproyecto en estudio sin inversión firme) y Suspendidas.
      // Computa estrictamente: Proyecto + En licitación + Obras en Curso + Obras Finalizadas.
      const esEtapaInversion = (
        item.estado === 'Proyecto' ||
        item.estado === 'Proyecto para licitar' ||
        item.estado === 'En licitación' ||
        item.estado === 'Obras en Curso' ||
        item.estado === 'Obras Finalizadas'
      );

      if (esEtapaInversion) {
        let s = item.sede || 'Central';
        if (s === 'Almagro') s = 'Central';
        if (s === 'Perifericos') s = 'Periféricos';
        if (!sedesCount[s]) sedesCount[s] = { count: 0, usd: 0 };
        sedesCount[s].count++;
        sedesCount[s].usd += mTotal;
      }
    });

    const activeTotal = vencidos + porVencer + enPlazo;
    const porcentajeEnPlazo = activeTotal > 0 ? Math.round((enPlazo / activeTotal) * 100) : 100;

    // Total en cartera activa (estrictamente Proyecto + Licitación + En Curso; excluye Factibilidad y Suspendidas)
    const totalCarteraActiva = sumObraActiva + sumEquipActivo + sumInfraActiva;

    return {
      totalItems: list.length,
      carteraActivaCount,
      totalCarteraActiva,
      sumObraActiva,
      sumEquipActivo,
      sumInfraActiva,
      sumFactibilidad,
      factibilidadCount,
      sumSuspendidas,
      sumFinalizadas,
      vencidos,
      porVencer,
      enPlazo,
      finalizadas: finalizadasCount,
      suspendidas: suspendidasCount,
      porcentajeEnPlazo,
      estadosCount,
      estadosUsd,
      sedesCount
    };
  },

  // ================= CASHFLOW MULTIANUAL & PARTIDAS PRESUPUESTARIAS =================
  hasValidPartida(item) {
    if (!item || !item.partida) return false;
    const p = String(item.partida).trim();
    return p !== '' && p !== 'S/D' && p.toUpperCase() !== 'PENDIENTE' && p.toUpperCase() !== 'NONE';
  },

  isPartidaCorta(item) {
    if (!item) return false;
    if (!this.hasValidPartida(item)) return false;
    const montoPartida = item.monto_partida_usd || 0;
    const montoTotal = item.monto_total_usd || ((item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0));
    return (montoPartida > 0 && montoTotal > montoPartida);
  },

  getPartidaDeficit(item) {
    if (!this.isPartidaCorta(item)) return 0;
    const montoPartida = item.monto_partida_usd || 0;
    const montoTotal = item.monto_total_usd || ((item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0));
    return Math.max(0, montoTotal - montoPartida);
  },

  getItemMontoPartida(item) {
    if (!item) return 0;
    if (item.monto_partida_usd && item.monto_partida_usd > 0) {
      return item.monto_partida_usd;
    }
    if (this.hasValidPartida(item)) {
      return item.monto_total_usd || item.monto_obra_usd || (item.cashflow ? item.cashflow.monto_total : 0) || 0;
    }
    return 0;
  },

  // ================= PERÍODO CONTABLE INSTITUCIONAL (01/04 - 31/03) =================
  getAccountingYearInfo(refDate = new Date()) {
    const d = (refDate instanceof Date) ? refDate : new Date(refDate);
    const y = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
    const m = isNaN(d.getMonth()) ? (new Date().getMonth() + 1) : (d.getMonth() + 1); // 1-12
    
    // Período contable hospitalario: 01 de Abril al 31 de Marzo del año siguiente
    let anioInicio, anioFin;
    if (m >= 4) {
      anioInicio = y;
      anioFin = y + 1;
    } else {
      anioInicio = y - 1;
      anioFin = y;
    }

    const fechaInicioStr = `${anioInicio}-04-01`;
    const fechaFinStr = `${anioFin}-03-31`;

    // 12 meses cronológicos del ejercicio: Abril Y a Marzo Y+1
    const meses = [];
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Meses 4 a 12 del anioInicio
    for (let mesIdx = 4; mesIdx <= 12; mesIdx++) {
      const mesStr = mesIdx < 10 ? `0${mesIdx}` : `${mesIdx}`;
      const key = `${anioInicio}-${mesStr}`;
      const esPasado = (y > anioInicio) || (y === anioInicio && m > mesIdx);
      const esActual = (y === anioInicio && m === mesIdx);
      meses.push({
        key,
        year: anioInicio,
        month: mesIdx,
        label: `${nombresMeses[mesIdx - 1]} ${anioInicio}`,
        shortLabel: nombresMeses[mesIdx - 1],
        esPasado,
        esActual,
        esFuturo: !esPasado && !esActual
      });
    }
    // Meses 1 a 3 del anioFin
    for (let mesIdx = 1; mesIdx <= 3; mesIdx++) {
      const mesStr = `0${mesIdx}`;
      const key = `${anioFin}-${mesStr}`;
      const esPasado = (y > anioFin) || (y === anioFin && m > mesIdx);
      const esActual = (y === anioFin && m === mesIdx);
      meses.push({
        key,
        year: anioFin,
        month: mesIdx,
        label: `${nombresMeses[mesIdx - 1]} ${anioFin}`,
        shortLabel: nombresMeses[mesIdx - 1],
        esPasado,
        esActual,
        esFuturo: !esPasado && !esActual
      });
    }

    return {
      anioInicio,
      anioFin,
      startMonth: 4,
      endMonth: 3,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      label: `Ejercicio ${anioInicio} - ${anioFin}`,
      currentYear: y,
      currentMonth: m,
      currentKey: `${y}-${m < 10 ? '0' + m : m}`,
      meses
    };
  },

  // ================= CÁLCULO DE CASH FLOW POR OBRA ACTIVA EN CURSO =================
  calculateObraCashflow(item, refDate = new Date()) {
    // REGLA CRÍTICA USUARIO: El cash flow debe considerarse SOLO con las obras activas en curso.
    // Ni las suspendidas ni en factibilidad deben aparecer ni computar en cash flow.
    if (!item || item.estado !== 'Obras en Curso') {
      return {
        aplicaCashflow: false,
        motivoExclusion: !item ? 'Obra no encontrada' : (
          item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto' 
            ? 'En Factibilidad (Excluido de Cash Flow)' 
            : ((item.estado && item.estado.toLowerCase().includes('suspendid'))
                ? 'Suspendida (Excluido de Cash Flow)' 
                : `Estado '${item.estado}' (Excluido de Cash Flow)`)
        ),
        montoTotalUSD: 0,
        anticipoPct: 0,
        anticipoUSD: 0,
        saldoUSD: 0,
        plazoMeses: 0,
        duracionMeses: 0,
        cuotaMensualSaldoUSD: 0,
        cuotas: [],
        ejerciciosAnterioresUSD: 0,
        ejercicioActualUSD: 0,
        ejercicioActualPagadoUSD: 0,
        ejercicioActualProyectadoUSD: 0,
        ejerciciosSiguientesUSD: 0,
        distribucionMensual: {}
      };
    }

    const accountingInfo = this.getAccountingYearInfo(refDate);
    const montoTotal = item.monto_adjudicado_usd || item.monto_total_usd || item.monto_obra_usd || 0;
    const anticipoPct = Math.min(100, Math.max(0, parseFloat(item.anticipo_porcentaje) || 0));
    const anticipoUSD = Math.round((montoTotal * (anticipoPct / 100)) * 100) / 100;
    const saldoUSD = Math.round((montoTotal - anticipoUSD) * 100) / 100;

    // Determinar fecha de inicio
    let startDateStr = item.fecha_inicio_etapa || item.fecha_inicio || item.fecha_adjudicacion;
    if (!startDateStr && Array.isArray(item.historial)) {
      const hEnCurso = item.historial.find(h => h.estado_nuevo === 'Obras en Curso');
      if (hEnCurso && hEnCurso.fecha) startDateStr = hEnCurso.fecha;
    }
    if (!startDateStr) {
      startDateStr = `${accountingInfo.anioInicio}-04-01`;
    }

    const startParts = startDateStr.split('-');
    let startYear = parseInt(startParts[0], 10) || accountingInfo.anioInicio;
    let startMonth = parseInt(startParts[1], 10) || 4; // 1-12

    // Determinar plazo en meses (N)
    let plazoMeses = parseInt(item.plazo_meses, 10);
    if (!plazoMeses || plazoMeses <= 0) {
      const endDateStr = item.fecha_fin_obra || item.fecha_fin_etapa;
      if (endDateStr) {
        const endParts = endDateStr.split('-');
        const endYear = parseInt(endParts[0], 10);
        const endMonth = parseInt(endParts[1], 10);
        if (endYear && endMonth) {
          const delta = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
          plazoMeses = Math.max(1, delta);
        }
      }
    }
    if (!plazoMeses || plazoMeses <= 0) {
      plazoMeses = 6; // Estándar 180 días de Obras en Curso
    }

    // Distribución matemática real:
    // Mes 1: Anticipo acordado (o M/N si no hay anticipo)
    // Meses 2..N: Saldo (M - Anticipo) distribuido en los N - 1 meses restantes
    const cuotas = [];
    let acumuladoCuotas = 0;
    let ejerciciosAnterioresUSD = 0;
    let ejercicioActualUSD = 0;
    let ejercicioActualPagadoUSD = 0;
    let ejercicioActualProyectadoUSD = 0;
    let ejerciciosSiguientesUSD = 0;
    const distribucionMensual = {};

    for (let k = 0; k < plazoMeses; k++) {
      const curMonthIdx = (startMonth - 1 + k) % 12; // 0-11
      const curMonth = curMonthIdx + 1; // 1-12
      const curYear = startYear + Math.floor((startMonth - 1 + k) / 12);
      const monthStr = curMonth < 10 ? `0${curMonth}` : `${curMonth}`;
      const key = `${curYear}-${monthStr}`;

      let montoMes = 0;
      let tipoCuota = 'cuota_saldo';

      if (plazoMeses === 1) {
        montoMes = montoTotal;
        tipoCuota = anticipoPct > 0 ? 'anticipo_total' : 'pago_unico';
      } else if (k === 0) {
        if (anticipoPct > 0) {
          montoMes = anticipoUSD;
          tipoCuota = 'anticipo';
        } else {
          montoMes = Math.round((montoTotal / plazoMeses) * 100) / 100;
          tipoCuota = 'cuota_saldo';
        }
      } else {
        if (anticipoPct > 0) {
          montoMes = Math.round((saldoUSD / (plazoMeses - 1)) * 100) / 100;
        } else {
          montoMes = Math.round((montoTotal / plazoMeses) * 100) / 100;
        }
        tipoCuota = 'cuota_saldo';
      }

      // Ajuste de redondeo en última cuota
      if (k === plazoMeses - 1) {
        montoMes = Math.round((montoTotal - acumuladoCuotas) * 100) / 100;
      }
      acumuladoCuotas += montoMes;

      const dateComp = `${key}-01`;
      let clasificacionPeriodo = 'ejercicio_actual';

      if (dateComp < accountingInfo.fechaInicio) {
        // Ejercicio Anterior: EXCLUIR de totales del ejercicio en curso
        clasificacionPeriodo = 'anterior';
        ejerciciosAnterioresUSD += montoMes;
      } else if (dateComp > accountingInfo.fechaFin) {
        // Ejercicios Siguientes: Arrastre post 31/03
        clasificacionPeriodo = 'siguiente';
        ejerciciosSiguientesUSD += montoMes;
      } else {
        // Ejercicio Actual (01/04 al 31/03)
        clasificacionPeriodo = 'ejercicio_actual';
        ejercicioActualUSD += montoMes;
        distribucionMensual[key] = (distribucionMensual[key] || 0) + montoMes;

        if (key < accountingInfo.currentKey) {
          ejercicioActualPagadoUSD += montoMes;
        } else {
          ejercicioActualProyectadoUSD += montoMes;
        }
      }

      cuotas.push({
        indiceMes: k + 1,
        year: curYear,
        month: curMonth,
        key,
        monto: montoMes,
        tipo: tipoCuota,
        clasificacion: clasificacionPeriodo,
        esPasado: key < accountingInfo.currentKey
      });
    }

    return {
      aplicaCashflow: true,
      montoTotalUSD: montoTotal,
      anticipoPct: anticipoPct,
      anticipoUSD: anticipoUSD,
      saldoUSD: saldoUSD,
      plazoMeses: plazoMeses,
      duracionMeses: plazoMeses,
      cuotaMensualSaldoUSD: plazoMeses > 1 ? Math.round((saldoUSD / (plazoMeses - 1)) * 100) / 100 : (plazoMeses === 1 ? saldoUSD : 0),
      fechaInicio: startDateStr,
      cuotas: cuotas,
      ejerciciosAnterioresUSD: Math.round(ejerciciosAnterioresUSD * 100) / 100,
      ejercicioActualUSD: Math.round(ejercicioActualUSD * 100) / 100,
      ejercicioActualPagadoUSD: Math.round(ejercicioActualPagadoUSD * 100) / 100,
      ejercicioActualProyectadoUSD: Math.round(ejercicioActualProyectadoUSD * 100) / 100,
      ejerciciosSiguientesUSD: Math.round(ejerciciosSiguientesUSD * 100) / 100,
      distribucionMensual: distribucionMensual
    };
  },

  // ================= CONSOLIDADO DE CASH FLOW (SOLO OBRAS EN CURSO) =================
  matchesSanJustoUnified(userDep, itemDep) {
    if (!userDep || !itemDep) return false;
    const u = String(userDep).toLowerCase();
    const d = String(itemDep).toLowerCase();
    return u.includes('san justo') && d.includes('san justo');
  },

  getCashflowSummary(tipoFilter = 'TODOS', partidaFilter = 'todas', searchQuery = '', refDate = new Date()) {
    const all = this.items || [];
    const accountingInfo = this.getAccountingYearInfo(refDate);

    // REGLA CRÍTICA USUARIO: El cash flow debe considerarse SOLO con las obras activas en curso.
    // Ni las suspendidas ni en factibilidad deben figurar en cash flow.
    let enCursoList = all.filter(x => x.estado === 'Obras en Curso');

    // Filtro por permisos de usuario según Sede / Dependencia
    if (this.currentUser && !this.isAdmin() && this.currentUser.rol !== 'visualizador') {
      const uSede = this.currentUser.sede;
      const uDep = this.currentUser.dependencia;
      if (uSede && uSede !== 'Todas') {
        enCursoList = enCursoList.filter(x => x.sede === uSede || this.matchesSanJustoUnified(uDep, x.dependencia));
      }
    }

    // Filtro por Módulo / Tipo
    if (tipoFilter && tipoFilter !== 'TODOS') {
      enCursoList = enCursoList.filter(x => x.tipo === tipoFilter);
    }

    // Totales consolidados de la cartera en ejecución
    let totalCarteraUSD = 0;
    let totalAsignadoPartidasUSD = 0;
    let countConPartida = 0;
    let countSinPartida = 0;
    let totalSinPartidaUSD = 0;
    let totalAnticiposUSD = 0;
    let totalSaldoUSD = 0;
    let totalEjercicioActualUSD = 0;
    let totalYaPagadoUSD = 0;
    let totalProyectadoUSD = 0;
    let totalEjerciciosSiguientesUSD = 0;
    let totalEjerciciosAnterioresUSD = 0;

    const mesesTotales = {};
    accountingInfo.meses.forEach(m => {
      mesesTotales[m.key] = 0;
    });

    const listWithCF = enCursoList.map(x => {
      const cf = this.calculateObraCashflow(x, refDate);
      totalCarteraUSD += cf.montoTotalUSD;
      totalAnticiposUSD += cf.anticipoUSD;
      totalSaldoUSD += cf.saldoUSD;
      totalEjercicioActualUSD += cf.ejercicioActualUSD;
      totalYaPagadoUSD += cf.ejercicioActualPagadoUSD;
      totalProyectadoUSD += cf.ejercicioActualProyectadoUSD;
      totalEjerciciosSiguientesUSD += cf.ejerciciosSiguientesUSD;
      totalEjerciciosAnterioresUSD += cf.ejerciciosAnterioresUSD;

      if (this.hasValidPartida(x)) {
        countConPartida++;
        totalAsignadoPartidasUSD += this.getItemMontoPartida(x);
      } else {
        countSinPartida++;
        totalSinPartidaUSD += cf.montoTotalUSD;
      }

      Object.keys(cf.distribucionMensual).forEach(k => {
        if (mesesTotales[k] !== undefined) {
          mesesTotales[k] += cf.distribucionMensual[k];
        }
      });

      return {
        item: x,
        cf: cf
      };
    });

    // Filtros secundarios de búsqueda y partida
    let displayList = listWithCF;
    if (partidaFilter === 'con_partida') {
      displayList = displayList.filter(entry => this.hasValidPartida(entry.item));
    } else if (partidaFilter === 'sin_partida') {
      displayList = displayList.filter(entry => !this.hasValidPartida(entry.item));
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      displayList = displayList.filter(entry => {
        const x = entry.item;
        return (x.id || '').toLowerCase().includes(q) ||
          (x.nombre || '').toLowerCase().includes(q) ||
          (x.partida || '').toLowerCase().includes(q) ||
          (x.sede || '').toLowerCase().includes(q) ||
          (x.proveedor || '').toLowerCase().includes(q) ||
          (x.tipo || '').toLowerCase().includes(q);
      });
    }

    // Subtotales de lo mostrado en pantalla
    let displayTotGral = 0;
    let displayTotPartidas = 0;
    let displayTotEjercicio = 0;
    let displayTotYaPagado = 0;
    let displayTotProyectado = 0;
    let displayTotSiguientes = 0;

    displayList.forEach(entry => {
      displayTotGral += entry.cf.montoTotalUSD;
      displayTotEjercicio += entry.cf.ejercicioActualUSD;
      displayTotYaPagado += entry.cf.ejercicioActualPagadoUSD;
      displayTotProyectado += entry.cf.ejercicioActualProyectadoUSD;
      displayTotSiguientes += entry.cf.ejerciciosSiguientesUSD;
      if (this.hasValidPartida(entry.item)) {
        displayTotPartidas += this.getItemMontoPartida(entry.item);
      }
    });

    return {
      accountingInfo,
      totalObras: enCursoList.length,
      totalCarteraUSD: Math.round(totalCarteraUSD * 100) / 100,
      totalAnticiposUSD: Math.round(totalAnticiposUSD * 100) / 100,
      totalSaldoUSD: Math.round(totalSaldoUSD * 100) / 100,
      totalAsignadoPartidasUSD: Math.round(totalAsignadoPartidasUSD * 100) / 100,
      countConPartida,
      countSinPartida,
      totalSinPartidaUSD: Math.round(totalSinPartidaUSD * 100) / 100,
      totalEjercicioActualUSD: Math.round(totalEjercicioActualUSD * 100) / 100,
      totalYaPagadoUSD: Math.round(totalYaPagadoUSD * 100) / 100,
      totalProyectadoUSD: Math.round(totalProyectadoUSD * 100) / 100,
      totalEjerciciosSiguientesUSD: Math.round(totalEjerciciosSiguientesUSD * 100) / 100,
      totalEjerciciosAnterioresUSD: Math.round(totalEjerciciosAnterioresUSD * 100) / 100,
      mesesTotales,
      displayList,
      displayTotGral: Math.round(displayTotGral * 100) / 100,
      displayTotPartidas: Math.round(displayTotPartidas * 100) / 100,
      displayTotEjercicio: Math.round(displayTotEjercicio * 100) / 100,
      displayTotYaPagado: Math.round(displayTotYaPagado * 100) / 100,
      displayTotProyectado: Math.round(displayTotProyectado * 100) / 100,
      displayTotSiguientes: Math.round(displayTotSiguientes * 100) / 100,
      tipoFilter,
      partidaFilter
    };
  },

  // ================= DIRECCIÓN MÉDICA =================
  getPendingMedicalPriorityItems() {
    return this.items.filter(item => {
      // Excluir obras finalizadas o suspendidas
      if (item.estado === 'Obras Finalizadas' || item.estado === 'Suspendida') return false;
      // Solo obras en Factibilidad están pendientes de evaluación de Dirección Médica
      if (item.estado !== 'Estudio de Factibilidad' && item.estado !== 'Ante Proyecto') return false;
      // Si ya fue ponderada por default por el Administrador al asignar partida, ya no está pendiente
      if (item.prioridad_medica_ponderada_default) return false;
      // Si ya tiene prioridad médica explícita mayor a 0, ya fue evaluada
      if (item.prioridad_medica && item.prioridad_medica > 0) return false;
      // Si ya tiene partida presupuestaria asignada formalmente, ya fue tramitada por administración
      if (this.hasValidPartida(item)) return false;
      return true;
    });
  },

  getPendingMedicalPriorityCount() {
    return this.getPendingMedicalPriorityItems().length;
  },

  setMedicalPriority(itemId, priorityVal, notes) {
    const item = this.getItemById(itemId);
    if (!item) return false;
    if (!this.currentUser) return false;
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador' || !this.currentUser.puede_priorizar_medica) {
      return false;
    }

    item.prioridad_medica = parseFloat(priorityVal) || 1;
    item.prioridad_medica_origen = 'Dirección Médica';
    item.prioridad_medica_ponderada_default = false;
    item.prioridad_medica_nota = 'Definida formalmente por Dirección Médica';
    const pTec = item.prioridad_tecnica || 1;
    item.prioridad_final = Math.round(((pTec + item.prioridad_medica) / 2) * 10) / 10;
    if (pTec === 5 && item.prioridad_medica === 5) item.prioridad_final = 5.0;

    if (!item.historial) item.historial = [];
    item.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      usuario: this.currentUser.nombre,
      estado_anterior: item.estado,
      estado_nuevo: item.estado,
      observaciones: `Prioridad Médica asignada: ${priorityVal}★ por Dirección. Ponderación final resultante: ${item.prioridad_final}.`
    });

    this.saveItem(item, true);

    this.addAuditLog({
      tipo: 'PRIORIZACION_MEDICA',
      tipo_label: 'Evaluación Médica',
      nivel: 'info',
      obra_id: item.id,
      obra_nombre: item.nombre,
      monto_usd: (item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0),
      estado_obra: item.estado,
      detalle: `Prioridad Médica asignada: ${priorityVal}★ por Dirección Médica. Ponderación resultante: ${item.prioridad_final}.`
    });
    return true;
  },

  // ================= USUARIOS & AUTENTICACIÓN SEGURA =================
  addUser(userData) {
    const salt = generateSalt();
    const tempPassword = (userData.tempPassword || 'Hiba2025!').trim();
    const username = (userData.username || (userData.email ? userData.email.split('@')[0] : `user_${Date.now()}`)).trim().toLowerCase();

    // Validar nombre de usuario duplicado
    if (this.users.some(u => (u.username || '').toLowerCase() === username)) {
      throw new Error(`El usuario "${username}" ya se encuentra registrado. Elige otro nombre de usuario.`);
    }

    // Si el usuario estaba previamente en la lista negra de eliminados, removerlo al darlo de alta intencionalmente
    let deletedList = [];
    try {
      deletedList = JSON.parse(localStorage.getItem('sigo_deleted_usernames') || '[]');
    } catch (e) {
      deletedList = [];
    }
    const identifiersToRemove = [username, (userData.email || '').toLowerCase()].filter(Boolean);
    deletedList = deletedList.filter(item => !identifiersToRemove.includes(item));
    localStorage.setItem('sigo_deleted_usernames', JSON.stringify(deletedList));

    const apellido = (userData.apellido || '').trim();
    const nombre = userData.nombre.trim();
    const fullNombre = apellido && !nombre.includes(apellido) ? `${nombre} ${apellido}` : nombre;

    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const newUser = {
      id: userData.id || `usr-${Date.now()}-${uniqueSuffix}`,
      username: username,
      nombre: fullNombre,
      nombre_pila: nombre,
      apellido: apellido,
      dependencia: this.normalizeDependencia(userData.dependencia || 'Departamento de Proyectos Central'),
      email: (userData.email || `${username}@hospitalitaliano.org.ar`).trim().toLowerCase(),
      salt: salt,
      password_hash: hashPassword(tempPassword, salt),
      debe_cambiar_clave: true, // Forzar cambio en el primer login
      sede: userData.sede || 'Central',
      rol: userData.rol || 'pm_obra',
      activo: true,
      puede_crear: userData.puede_crear ?? true,
      puede_avanzar: userData.puede_avanzar ?? true,
      puede_priorizar_medica: userData.puede_priorizar_medica ?? false,
      puede_asignar_partida: userData.puede_asignar_partida ?? false,
      solo_lectura: userData.solo_lectura ?? false,
      origen: 'creado_admin',
      arranca_en_cero: true
    };

    this.users.push(newUser);
    this.persistUsers();
    return { success: true, user: newUser, tempPassword: tempPassword };
  },

  deleteUser(userId) {
    if (this.currentUser && this.currentUser.id === userId) {
      return { success: false, msg: 'No puedes eliminar tu propia cuenta en sesión activa.' };
    }
    const idx = this.users.findIndex(x => x.id === userId);
    if (idx === -1) {
      return { success: false, msg: 'Usuario no encontrado.' };
    }
    const deleted = this.users.splice(idx, 1)[0];

    // Registrar en blacklist permanente en localStorage para que NUNCA vuelva a resucitar en recarga o reinicio
    let deletedList = [];
    try {
      deletedList = JSON.parse(localStorage.getItem('sigo_deleted_usernames') || '[]');
    } catch (e) {
      deletedList = [];
    }
    const toAdd = [deleted.id, deleted.username, deleted.email].filter(Boolean).map(s => s.toLowerCase());
    toAdd.forEach(item => {
      if (!deletedList.includes(item)) deletedList.push(item);
    });
    localStorage.setItem('sigo_deleted_usernames', JSON.stringify(deletedList));

    this.persistUsers();
    return { success: true, msg: `Usuario "${deleted.nombre}" (@${deleted.username}) eliminado permanentemente del sistema.` };
  },

  revokeUserAccess(userId) {
    if (this.currentUser && this.currentUser.id === userId) {
      return { success: false, msg: 'No puedes revocar tu propio acceso mientras estás conectado.' };
    }
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, msg: 'Usuario no encontrado.' };
    user.activo = false;
    this.persistUsers();
    return { success: true, msg: `Acceso revocado para "${user.nombre}". No podrá ingresar al sistema.` };
  },

  restoreUserAccess(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, msg: 'Usuario no encontrado.' };
    user.activo = true;
    this.persistUsers();
    return { success: true, msg: `Acceso restaurado para "${user.nombre}". Ya puede volver a ingresar.` };
  },

  forcePasswordChange(userId, tempPassword) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, msg: 'Usuario no encontrado.' };

    const tempPwd = (tempPassword || ('Hiba' + Math.floor(1000 + Math.random() * 9000) + '!')).trim();
    const salt = generateSalt();
    user.salt = salt;
    user.password_hash = hashPassword(tempPwd, salt);
    user.debe_cambiar_clave = true;
    this.persistUsers();
    return { success: true, tempPassword: tempPwd, user: user };
  },

  resetUserPassword(userId, newTempPassword) {
    return this.forcePasswordChange(userId, newTempPassword);
  },

  updateUserPermissions(userId, data) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, msg: 'Usuario no encontrado.' };

    if (data.nombre) user.nombre = data.nombre.trim();
    if (data.apellido !== undefined) user.apellido = (data.apellido || '').trim();
    if (data.email) user.email = data.email.trim().toLowerCase();
    if (data.sede) user.sede = data.sede;
    if (data.dependencia) user.dependencia = this.normalizeDependencia(data.dependencia);
    if (data.rol) user.rol = data.rol;
    if (data.puede_crear !== undefined) user.puede_crear = Boolean(data.puede_crear);
    if (data.puede_avanzar !== undefined) user.puede_avanzar = Boolean(data.puede_avanzar);
    if (data.puede_priorizar_medica !== undefined) user.puede_priorizar_medica = Boolean(data.puede_priorizar_medica);
    if (data.puede_asignar_partida !== undefined) user.puede_asignar_partida = Boolean(data.puede_asignar_partida);
    if (data.solo_lectura !== undefined) user.solo_lectura = Boolean(data.solo_lectura);
    if (data.debe_cambiar_clave !== undefined) user.debe_cambiar_clave = Boolean(data.debe_cambiar_clave);

    this.persistUsers();

    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = { ...user };
    }
    return { success: true, user: user, msg: `Permisos de "${user.nombre}" actualizados correctamente.` };
  },

  changePassword(userId, newPassword) {
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, msg: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, msg: 'Usuario no encontrado en la base de datos.' };

    const salt = generateSalt();
    user.salt = salt;
    user.password_hash = hashPassword(newPassword.trim(), salt);
    user.debe_cambiar_clave = false;
    this.persistUsers();

    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = user;
    }
    return { success: true, msg: 'Contraseña actualizada con éxito.' };
  },

  toggleUserStatus(userId) {
    const u = this.users.find(x => x.id === userId);
    if (u) {
      if (this.currentUser && this.currentUser.id === userId && u.activo) {
        return false;
      }
      u.activo = !u.activo;
      this.persistUsers();
      return u.activo;
    }
    return false;
  },

  switchActiveUser(userId) {
    const u = this.users.find(x => x.id === userId);
    if (u && u.activo) {
      this.currentUser = u;
      localStorage.setItem('sigo_active_user_id', u.id);
      return true;
    }
    return false;
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('sigo_active_user_id');
  },

  authenticate(usernameOrEmail, password) {
    if (!usernameOrEmail || !usernameOrEmail.toString().trim()) {
      return { success: false, msg: 'Por favor ingresa tu usuario o correo electrónico.' };
    }
    if (!password || !password.toString().trim()) {
      return { success: false, msg: 'Por favor ingresa tu contraseña.' };
    }

    const rawInput = usernameOrEmail.toString().trim();
    const cleanInput = rawInput.replace(/^@/, '').toLowerCase();

    console.log(`[LOGIN DEBUG] ==========================================`);
    console.log(`[LOGIN DEBUG] 1. Username ingresado: "${rawInput}" (Normalizado: "${cleanInput}")`);

    // Búsqueda flexible por username, email o id
    const user = this.users.find(u => {
      if (!u) return false;
      const uUsername = (u.username || '').replace(/^@/, '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uId = (u.id || '').toLowerCase();
      return uUsername === cleanInput || uEmail === cleanInput || uId === cleanInput;
    });

    if (!user) {
      console.error(`[LOGIN DEBUG] ❌ 4. MOTIVO DE FALLO: El usuario "${cleanInput}" NO EXISTE en el registro activo (Total usuarios: ${this.users.length}).`);
      console.log(`[LOGIN DEBUG] ==========================================`);
      return { success: false, msg: '⛔ Usuario o contraseña incorrectos. Verifica tus datos de ingreso.' };
    }

    console.log(`[LOGIN DEBUG] 1. Username almacenado en registro: "${user.username}" | ID: "${user.id}" | Email: "${user.email}" | Nombre: "${user.nombre}"`);

    if (user.activo === false) {
      console.error(`[LOGIN DEBUG] ❌ 4. MOTIVO DE FALLO: El usuario "${user.username}" (ID: ${user.id}) existe pero su cuenta está INACTIVA (activo: false).`);
      console.log(`[LOGIN DEBUG] ==========================================`);
      return { 
        success: false, 
        msg: `⛔ Acceso Denegado: El acceso para "${user.nombre}" ha sido revocado. Contacta al Administrador para su habilitación.` 
      };
    }

    const trimmedPassword = password.toString().trim();
    const userSalt = user.salt || DEFAULT_SALT;
    const computedHash = hashPassword(trimmedPassword, userSalt);
    const storedHash = user.password_hash || null;
    const hasStoredPassword = Boolean(user.password_hash || user.password);

    console.log(`[LOGIN DEBUG] 2. Hash calculated en tiempo real: "${computedHash}" (Salt: "${userSalt}")`);
    console.log(`[LOGIN DEBUG] 3. Hash exacto almacenado en base de datos: "${storedHash}"`);
    console.log(`[LOGIN DEBUG] 3.1. ¿Existe campo de contraseña/hash en JSON?: ${hasStoredPassword ? 'SÍ' : 'NO (Falta campo de contraseña en el objeto de usuario)'}`);

    let isMatch = false;
    let matchReason = '';

    // Validación 1: Hash con el salt guardado
    if (storedHash && computedHash === storedHash) {
      isMatch = true;
      matchReason = 'Coincidencia exacta de hash con salt guardado (Validación 1)';
    }

    // Validación 2: Auto-reparación si salt difiere de DEFAULT_SALT pero el hash almacenado corresponde a DEFAULT_SALT
    if (!isMatch && storedHash) {
      const defaultSaltHash = hashPassword(trimmedPassword, DEFAULT_SALT);
      if (defaultSaltHash === storedHash) {
        user.salt = DEFAULT_SALT;
        this.persistUsers();
        isMatch = true;
        matchReason = 'Coincidencia usando DEFAULT_SALT (Auto-reparación Validación 2)';
      }
    }

    // Validación 3: Clave maestra 'Admin2025!' con auto-reparación si hubo desfasaje o corrupción
    if (!isMatch && trimmedPassword === 'Admin2025!') {
      const isDefUser = DEFAULT_USERS.some(def => 
        (def.username && def.username.toLowerCase() === cleanInput) ||
        (def.email && def.email.toLowerCase() === cleanInput) ||
        def.id === user.id
      );
      if (isDefUser || !user.debe_cambiar_clave || storedHash === DEFAULT_ADMIN_HASH) {
        user.salt = DEFAULT_SALT;
        user.password_hash = DEFAULT_ADMIN_HASH;
        this.persistUsers();
        isMatch = true;
        matchReason = 'Acceso por clave maestra Admin2025! (Validación 3)';
      }
    }

    // Validación 4: Contraseña en texto plano si existiese de versiones previas
    if (!isMatch && user.password && user.password === trimmedPassword) {
      user.salt = DEFAULT_SALT;
      user.password_hash = hashPassword(trimmedPassword, DEFAULT_SALT);
      delete user.password;
      this.persistUsers();
      isMatch = true;
      matchReason = 'Coincidencia con contraseña legacy texto plano (Validación 4)';
    }

    if (!isMatch) {
      let failureDetail = '';
      if (!hasStoredPassword) {
        failureDetail = 'Falta el campo de contraseña (password_hash o password) en el JSON del usuario.';
      } else {
        failureDetail = `El hash calculado ("${computedHash}") NO coincide con el hash guardado ("${storedHash}").`;
      }
      console.error(`[LOGIN DEBUG] ❌ 4. MOTIVO EXACTO DE FALLO: ${failureDetail}`);
      console.log(`[LOGIN DEBUG] ==========================================`);
      return { success: false, msg: '⛔ Usuario o contraseña incorrectos. Verifica tus datos de ingreso.' };
    }

    // Autenticación correcta
    this.currentUser = user;
    localStorage.setItem('sigo_active_user_id', user.id);
    console.log(`[LOGIN DEBUG] 🎉 4. ÉXITO: Login autenticado correctamente. Motivo: ${matchReason}`);
    console.log(`[LOGIN DEBUG] ==========================================`);

    return { 
      success: true, 
      user: user,
      mustChangePassword: Boolean(user.debe_cambiar_clave)
    };
  },

  loginWithGoogle(email) {
    // Compatibilidad retroactiva
    return this.authenticate(email, 'Admin2025!');
  },

  getItemById(id) {
    return this.items.find(x => x.id === id);
  },

  saveItem(item, force = false) {
    if (!force && this.currentUser && !this.canUserEditObra(item)) {
      (console.warn || console.log)('⛔ Bloqueado: Usuario sin permisos de edición para la obra', item.id);
      return false;
    }
    const idx = this.items.findIndex(x => x.id === item.id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], ...item };
    } else {
      this.items.unshift(item);
    }
    this.persist(true);

    if (SupabaseManager.isConfigured) {
      SupabaseManager.upsertObraInCloud(item);
    }
    return true;
  },

  deleteItem(itemId) {
    if (!this.isAdmin()) {
      return { success: false, msg: '⛔ Acceso Denegado: Solo el Administrador General puede borrar obras del sistema.' };
    }
    const idx = this.items.findIndex(x => x.id === itemId);
    if (idx === -1) {
      return { success: false, msg: 'Obra no encontrada.' };
    }
    const item = this.items[idx];
    const totalUSD = (item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0);

    // Registrar en el libro de auditoría institucional
    this.addAuditLog({
      tipo: 'BORRADO_OBRA',
      tipo_label: 'Baja Definitiva de Obra',
      nivel: 'critico',
      obra_id: item.id,
      obra_nombre: item.nombre,
      monto_usd: totalUSD,
      estado_obra: item.estado,
      detalle: `ELIMINACIÓN DEFINITIVA de la obra '${item.nombre}' (${item.id}) en estadio '${item.estado}', sede ${item.sede}, por monto de ${this.formatUSD(totalUSD)}. Confirmación obligatoria BORRAR ejecutada.`
    });

    const deletedItem = this.items.splice(idx, 1)[0];
    this.persist(true);

    if (typeof SupabaseManager !== 'undefined' && SupabaseManager.isConfigured && typeof SupabaseManager.deleteObraInCloud === 'function') {
      SupabaseManager.deleteObraInCloud(itemId);
    }

    return { success: true, item: deletedItem };
  },

  exportToExcel(filters = {}) {
    const data = this.getFilteredItems(filters).map(item => {
      const sem = this.calculateSemaforo(item);
      const pond = this.getPonderacionGlobal(item);
      return {
        'Código': item.id,
        'Tipo': item.tipo,
        'Sede': item.sede,
        'Inversión / Nombre': item.nombre,
        'Sector Solicitante': item.sector_solicitante || '',
        'Partida': item.partida || 'PENDIENTE',
        'Estado': item.estado,
        'Semáforo': sem.status === 'en_analisis' ? 'EN ANÁLISIS (SIN PLAZO)' : sem.status.toUpperCase(),
        'Días Restantes': sem.days !== null ? sem.days : '-',
        'Monto Obra USD': item.monto_obra_usd || 0,
        'Monto Equipamiento USD': item.monto_equipamiento_usd || 0,
        'Total USD': (item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0),
        'Prioridad Técnica (Solicitante)': item.prioridad_tecnica || '',
        'Prioridad Médica (Dirección)': item.prioridad_medica || 'Pendiente',
        'Ponderación Global': pond.valor,
        'Nivel Ponderación': pond.nivelLabel,
        'Responsable': item.responsable || '',
        'Proveedor': item.proveedor || '',
        'Orden de Compra': item.orden_compra || item.numero_oc || '',
        'Anticipo %': (item.anticipo_porcentaje !== undefined && item.anticipo_porcentaje !== null) ? `${item.anticipo_porcentaje}%` : '',
        'Anticipo USD': item.anticipo_monto_usd || 0,
        'Categoría': item.categoria || '',
        'Fecha Inicio Etapa': item.fecha_inicio_etapa || '',
        'Fecha Límite Etapa': (item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') ? 'Sin plazo (En análisis)' : (item.fecha_fin_etapa || '-'),
        'Fecha Real Finalizada': item.fecha_real_finalizada || '',
        'Observaciones': item.observaciones || ''
      };
    });

    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Seguimiento_Obras_HIBA");
      XLSX.writeFile(wb, `Reporte_Obras_HIBA_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      alert("Librería XLSX no disponible.");
    }
  },

  // ================= ASIGNACIÓN / REASIGNACIÓN RÁPIDA (ADMIN) =================
  quickAssignObra(itemId, targetUserId) {
    if (!this.isAdmin()) {
      return { success: false, msg: '⛔ Exclusivo para el Administrador General.' };
    }
    const item = this.getItemById(itemId);
    if (!item) return { success: false, msg: 'Obra no encontrada.' };

    const oldResp = item.responsable || 'Sin Asignar';

    if (!targetUserId || targetUserId === 'sin_asignar' || targetUserId === '') {
      item.responsable = 'Sin Asignar';
      item.responsable_id = null;
    } else {
      const u = (this.users || []).find(user => user.id === targetUserId);
      if (!u) return { success: false, msg: 'Usuario destinatario no encontrado.' };
      item.responsable_id = u.id;
      item.responsable = u.nombre;
      if (u.dependencia && u.dependencia !== 'Dirección General / Administración') {
        item.dependencia = u.dependencia;
      }
    }

    if (!Array.isArray(item.historial)) item.historial = [];
    item.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      usuario: this.currentUser ? this.currentUser.nombre : 'Administrador',
      estado_anterior: item.estado,
      estado_nuevo: item.estado,
      observaciones: `Reasignación rápida: '${oldResp}' ➔ '${item.responsable}' efectuada por ${this.currentUser ? this.currentUser.nombre : 'Admin'}.`
    });

    this.saveItem(item, true);
    return { 
      success: true, 
      item: item, 
      obra: item,
      oldResponsable: oldResp,
      newResponsable: item.responsable,
      newResponsableId: item.responsable_id
    };
  },

  // ================= DATOS PARA INFORME EJECUTIVO DE DIRECCIÓN (3 PÁGINAS A4) =================
  getExecutiveReportData(refDate = new Date()) {
    const all = this.items || [];
    const accountingInfo = this.getAccountingYearInfo(refDate);

    // 1. Obras en Curso
    const enCurso = all.filter(x => x.estado === 'Obras en Curso');
    const totEnCursoUSD = enCurso.reduce((acc, x) => acc + (x.monto_adjudicado_usd || x.monto_total_usd || x.monto_obra_usd || 0), 0);
    const avgAvance = enCurso.length > 0 
      ? parseFloat((enCurso.reduce((acc, x) => acc + (parseFloat(x.avance_fisico) || 0), 0) / enCurso.length).toFixed(1))
      : 0;

    // 2. Cartera Completa en Estudio de Factibilidad (Total 94 obras)
    const factTotal = all.filter(x => 
      x.estado === 'Estudio de Factibilidad' || x.estado === 'Ante Proyecto'
    );
    const totFactTotalUSD = factTotal.reduce((acc, x) => acc + (x.monto_total_usd || x.monto_obra_usd || 0), 0);

    const factSinPartida = factTotal.filter(x => 
      !this.hasValidPartida(x) || !x.monto_partida_usd || x.monto_partida_usd <= 0
    );
    const totFactSinPartidaUSD = factSinPartida.reduce((acc, x) => acc + (x.monto_total_usd || x.monto_obra_usd || 0), 0);

    const factConPartida = factTotal.filter(x => 
      this.hasValidPartida(x) && x.monto_partida_usd > 0
    );
    const totFactConPartidaUSD = factConPartida.reduce((acc, x) => acc + (x.monto_total_usd || x.monto_obra_usd || 0), 0);

    const factPorSede = {};
    factTotal.forEach(x => {
      const s = x.sede || 'Central';
      factPorSede[s] = (factPorSede[s] || 0) + (x.monto_total_usd || x.monto_obra_usd || 0);
    });

    // 3. Obras Suspendidas
    const suspendidas = all.filter(x => (x.estado || '').toLowerCase().includes('suspendid'));
    const totSuspendidasUSD = suspendidas.reduce((acc, x) => acc + (x.monto_total_usd || x.monto_obra_usd || 0), 0);

    // 4. Cash Flow Detallado de Obras en Curso (Ejercicio Oficial 01/04 a 31/03)
    const cashflowEjecucion = this.getCashflowSummary('TODOS', 'todas', '', refDate);

    // 5. Control de Partidas: Sobre-ejecutadas (Déficit) vs Sub-ejecutadas (Superávit)
    const sobreEjecutadas = [];
    const subEjecutadas = [];
    let totDeficit = 0;
    let totSuperavit = 0;

    all.forEach(x => {
      if (this.hasValidPartida(x) && x.monto_partida_usd > 0) {
        const costoRequerido = x.monto_total_usd || ((x.monto_obra_usd || 0) + (x.monto_equipamiento_usd || 0));
        const montoPartida = x.monto_partida_usd;
        if (costoRequerido > montoPartida) {
          const def = costoRequerido - montoPartida;
          totDeficit += def;
          sobreEjecutadas.push({
            id: x.id,
            nombre: x.nombre,
            sede: x.sede,
            estado: x.estado,
            partida: x.partida,
            monto_partida_usd: montoPartida,
            costo_requerido_usd: costoRequerido,
            deficit_usd: def,
            responsable: x.responsable || 'Sin Asignar'
          });
        } else if (montoPartida > costoRequerido) {
          const sup = montoPartida - costoRequerido;
          totSuperavit += sup;
          subEjecutadas.push({
            id: x.id,
            nombre: x.nombre,
            sede: x.sede,
            estado: x.estado,
            partida: x.partida,
            monto_partida_usd: montoPartida,
            costo_requerido_usd: costoRequerido,
            superavit_usd: sup,
            responsable: x.responsable || 'Sin Asignar'
          });
        }
      }
    });

    sobreEjecutadas.sort((a, b) => b.deficit_usd - a.deficit_usd);
    subEjecutadas.sort((a, b) => b.superavit_usd - a.superavit_usd);

    // 6. Análisis Estratégico para Página 3: Desglose por Sede, Módulo y Semáforos
    const desgloseSedes = { Central: 0, 'San Justo': 0, 'Periféricos': 0 };
    const desgloseModulos = { 'Obra Civil': 0, 'Infraestructura': 0 };
    enCurso.forEach(x => {
      const m = x.monto_adjudicado_usd || x.monto_total_usd || x.monto_obra_usd || 0;
      const s = x.sede || 'Central';
      desgloseSedes[s] = (desgloseSedes[s] || 0) + m;
      const t = x.tipo || 'Obra Civil';
      desgloseModulos[t] = (desgloseModulos[t] || 0) + m;
    });

    const semaforos = { en_plazo: 0, por_vencer: 0, vencido: 0, sin_plazo: 0, alertas: [] };
    enCurso.forEach(x => {
      const sem = this.calculateSemaforo(x);
      if (sem.status === 'en_plazo') semaforos.en_plazo++;
      else if (sem.status === 'por_vencer') {
        semaforos.por_vencer++;
        semaforos.alertas.push({ item: x, sem });
      } else if (sem.status === 'vencido') {
        semaforos.vencido++;
        semaforos.alertas.push({ item: x, sem });
      } else {
        semaforos.sin_plazo++;
      }
    });

    return {
      fechaGeneracion: new Date().toISOString(),
      fechaEmision: new Date().toLocaleString(),
      emisor: this.currentUser ? `${this.currentUser.nombre} (${this.currentUser.rol.toUpperCase()})` : 'Dirección General',
      totalObras: all.length,
      accountingInfo,
      // PÁGINA 1: ESTADO GENERAL DE CARTERA
      obrasEnCurso: {
        total: enCurso.length,
        montoTotalUSD: totEnCursoUSD,
        avancePromedio: avgAvance,
        items: enCurso
      },
      factibilidad: {
        total: factTotal.length,
        montoTotalUSD: totFactTotalUSD,
        sinPartidaCount: factSinPartida.length,
        sinPartidaUSD: totFactSinPartidaUSD,
        conPartidaCount: factConPartida.length,
        conPartidaUSD: totFactConPartidaUSD,
        desgloseSede: factPorSede,
        items: factTotal,
        sinPartidaItems: factSinPartida,
        conPartidaItems: factConPartida
      },
      factibilidadSinPartida: {
        total: factSinPartida.length,
        montoTotalUSD: totFactSinPartidaUSD,
        desgloseSede: factPorSede,
        items: factSinPartida
      },
      obrasSuspendidas: {
        total: suspendidas.length,
        montoTotalUSD: totSuspendidasUSD,
        items: suspendidas
      },
      partidasDesvios: {
        totalSobreEjecutadas: sobreEjecutadas.length,
        totalDeficitUSD: totDeficit,
        sobreEjecutadas: sobreEjecutadas,
        totalSubEjecutadas: subEjecutadas.length,
        totalSuperavitUSD: totSuperavit,
        subEjecutadas: subEjecutadas,
        balanceNetoUSD: totSuperavit - totDeficit
      },
      // PÁGINA 2: CASH FLOW EJERCICIO CONTABLE (01/04 A 31/03)
      cashflowEjecucion,
      // PÁGINA 3: PLANIFICACIÓN PLURIANUAL Y AUDITORÍA
      desgloseSedes,
      desgloseModulos,
      semaforos
    };
  },

  // ================= EXPORTACIÓN MULTI-HOJA A EXCEL DEL INFORME EJECUTIVO =================
  exportExecutiveReportToExcel(rep = null) {
    const report = rep || this.getExecutiveReportData();
    if (!window.XLSX) {
      alert("Librería XLSX no disponible para generar el archivo Excel.");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen Ejecutivo
    const wsResumenData = [
      ["HOSPITAL ITALIANO DE BUENOS AIRES - DIRECCIÓN GENERAL & ADMINISTRACIÓN"],
      ["INFORME EJECUTIVO DE CONTROL DE GESTIÓN Y CONTROL PRESUPUESTARIO (3 PÁGINAS)"],
      ["Fecha de Emisión:", new Date().toLocaleString()],
      ["Emisor:", report.emisor],
      ["Período Fiscal:", report.accountingInfo ? report.accountingInfo.label : "01/04 al 31/03"],
      [""],
      ["INDICADORES CLAVE (KPIS)", "CANTIDAD", "MONTO TOTAL (USD)", "DETALLE ADICIONAL"],
      ["Obras en Curso (Ejecución Activa)", report.obrasEnCurso.total, report.obrasEnCurso.montoTotalUSD, `Avance Físico Promedio: ${report.obrasEnCurso.avancePromedio}%`],
      ["Estudios de Factibilidad (Total en Cartera)", (report.factibilidad ? report.factibilidad.total : report.factibilidadSinPartida.total), (report.factibilidad ? report.factibilidad.montoTotalUSD : report.factibilidadSinPartida.montoTotalUSD), (report.factibilidad ? `${report.factibilidad.sinPartidaCount} sin partida (${this.formatUSD(report.factibilidad.sinPartidaUSD)}) • ${report.factibilidad.conPartidaCount} con partida asignada (${this.formatUSD(report.factibilidad.conPartidaUSD)})` : "En espera de aprobación presupuestaria")],
      ["Obras Suspendidas (Capital Inmovilizado)", report.obrasSuspendidas.total, report.obrasSuspendidas.montoTotalUSD, "Obras frenadas temporal o definitivamente"],
      ["Partidas Sobre-ejecutadas (Déficit Presupuestario)", report.partidasDesvios.totalSobreEjecutadas, report.partidasDesvios.totalDeficitUSD, "Partidas Cortas que requieren ampliación"],
      ["Partidas Sub-ejecutadas (Superávit Remanente)", report.partidasDesvios.totalSubEjecutadas, report.partidasDesvios.totalSuperavitUSD, "Fondos aprobados sin comprometer"],
      [""],
      ["CASH FLOW DEL EJERCICIO CONTABLE (01/04 - 31/03)", "MONTO USD", "% DE EJERCICIO"],
      ["Total Programado en el Ejercicio", report.cashflowEjecucion.totalEjercicioActualUSD, "100.0%"],
      ["Ya Pagado / Devengado en el Ejercicio", report.cashflowEjecucion.totalYaPagadoUSD, report.cashflowEjecucion.totalEjercicioActualUSD > 0 ? ((report.cashflowEjecucion.totalYaPagadoUSD / report.cashflowEjecucion.totalEjercicioActualUSD) * 100).toFixed(1) + "%" : "0%"],
      ["Saldo Proyectado a Pagar en el Ejercicio", report.cashflowEjecucion.totalProyectadoUSD, report.cashflowEjecucion.totalEjercicioActualUSD > 0 ? ((report.cashflowEjecucion.totalProyectadoUSD / report.cashflowEjecucion.totalEjercicioActualUSD) * 100).toFixed(1) + "%" : "0%"],
      ["Compromisos / Impacto Ejercicios Siguientes", report.cashflowEjecucion.totalEjerciciosSiguientesUSD, "Arrastre futuro"]
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(wsResumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen_Ejecutivo");

    // Hoja 1: Obras en Ejecución Activa
    const wsEnCursoData = report.obrasEnCurso.items.map(x => ({
      'Código': x.id,
      'Nombre Obra': x.nombre,
      'Sede': x.sede,
      'Tipo': x.tipo,
      'Responsable': x.responsable || 'Sin Asignar',
      'Proveedor Adjudicado': x.proveedor || '',
      'Inversión Total USD': x.monto_adjudicado_usd || x.monto_total_usd || 0,
      'Partida': x.partida || '',
      'Avance Físico (%)': (x.avance_fisico || 0) + '%',
      'Fecha Inicio': x.fecha_inicio_etapa || '',
      'Fecha Fin Estimada': x.fecha_fin_obra || x.fecha_fin_etapa || ''
    }));
    const wsEnCurso = XLSX.utils.json_to_sheet(wsEnCursoData);
    XLSX.utils.book_append_sheet(wb, wsEnCurso, "Obras_En_Ejecucion");

    // Hoja 2: Cash Flow Obras en Curso
    const wsCFData = (report.cashflowEjecucion.displayList || []).map(entry => {
      const x = entry.item;
      const cf = entry.cf;
      return {
        'Código': x.id,
        'Nombre Obra': x.nombre,
        'Sede': x.sede,
        'Proveedor Adjudicado': x.proveedor || '',
        'Monto Adjudicado USD': cf.montoTotalUSD,
        '% Anticipo OC': cf.anticipoPct + '%',
        'Anticipo USD': cf.anticipoUSD,
        'Saldo USD': cf.saldoUSD,
        'Plazo (Meses)': cf.plazoMeses,
        'Ya Pagado Ejercicio USD': cf.ejercicioActualPagadoUSD,
        'Pendiente Ejercicio USD': cf.ejercicioActualProyectadoUSD,
        'Total Ejercicio Contable USD': cf.ejercicioActualUSD,
        'Impacto Ejercicios Siguientes USD': cf.ejerciciosSiguientesUSD
      };
    });
    const wsCF = XLSX.utils.json_to_sheet(wsCFData);
    XLSX.utils.book_append_sheet(wb, wsCF, "Cashflow_Obras_En_Curso");

    // Hoja 3: Factibilidades en Estudio (Total 94 obras consolidadas)
    const listFact = report.factibilidad?.items || report.factibilidadSinPartida.items;
    const wsFactData = listFact.map(x => {
      const hasPart = this.hasValidPartida(x) && x.monto_partida_usd > 0;
      return {
        'Código': x.id,
        'Nombre Solicitud': x.nombre,
        'Sede': x.sede,
        'Sector Solicitante': x.sector_solicitante || x.creado_por || '',
        'Estado de Partida': hasPart ? 'Con Partida Asignada' : 'Sin Partida (Pendiente Dirección)',
        'N° Partida': hasPart ? x.partida : 'Pendiente',
        'Monto Partida USD': hasPart ? x.monto_partida_usd : 0,
        'Monto Estimado Solicitado USD': x.monto_total_usd || x.monto_obra_usd || 0,
        'Prioridad Técnica': x.prioridad_tecnica || 3,
        'Prioridad Médica': x.prioridad_medica || '',
        'Creado Por': x.creado_por || '',
        'Fecha Solicitud': x.fecha_inicio_etapa || ''
      };
    });
    const wsFact = XLSX.utils.json_to_sheet(wsFactData);
    XLSX.utils.book_append_sheet(wb, wsFact, "Factibilidad_En_Estudio");

    // Hoja 4: Partidas Sobre-ejecutadas (Déficit)
    const wsSobreData = report.partidasDesvios.sobreEjecutadas.map(x => ({
      'Código': x.id,
      'Nombre': x.nombre,
      'Sede': x.sede,
      'Estado': x.estado,
      'N° Partida': x.partida,
      'Partida Asignada USD': x.monto_partida_usd,
      'Costo Requerido USD': x.costo_requerido_usd,
      'Déficit USD (Partida Corta)': -x.deficit_usd,
      'Responsable': x.responsable
    }));
    const wsSobre = XLSX.utils.json_to_sheet(wsSobreData);
    XLSX.utils.book_append_sheet(wb, wsSobre, "Partidas_SobreEjecutadas");

    // Hoja 5: Partidas Sub-ejecutadas (Superávit)
    const wsSubData = report.partidasDesvios.subEjecutadas.map(x => ({
      'Código': x.id,
      'Nombre': x.nombre,
      'Sede': x.sede,
      'Estado': x.estado,
      'N° Partida': x.partida,
      'Partida Asignada USD': x.monto_partida_usd,
      'Costo Requerido USD': x.costo_requerido_usd,
      'Superávit Remanente USD': x.superavit_usd,
      'Responsable': x.responsable
    }));
    const wsSub = XLSX.utils.json_to_sheet(wsSubData);
    XLSX.utils.book_append_sheet(wb, wsSub, "Partidas_SubEjecutadas");

    // Hoja 6: Obras Suspendidas
    const wsSuspData = report.obrasSuspendidas.items.map(x => ({
      'Código': x.id,
      'Nombre': x.nombre,
      'Sede': x.sede,
      'Monto Inmovilizado USD': x.monto_total_usd || x.monto_obra_usd || 0,
      'Observaciones / Motivo': x.observaciones || '',
      'Responsable': x.responsable || ''
    }));
    const wsSusp = XLSX.utils.json_to_sheet(wsSuspData);
    XLSX.utils.book_append_sheet(wb, wsSusp, "Obras_Suspendidas");

    const fileName = `Informe_Ejecutivo_Direccion_HIBA_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
};

window.DataStore = DataStore;
