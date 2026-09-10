// ==============================================================================
// GESTOR DE DATOS, ESTADOS, USUARIOS Y WORKFLOW SECUENCIAL - SIGO HIBA v2.1
// Autenticación Segura con SHA-256 + Salt, Claves Temporales y Eliminación de Usuarios
// ==============================================================================

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
  let hash = sha256.h = sha256.h || [];
  const k = sha256.k = sha256.k || [];
  let primeCounter = k[lengthProperty];

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

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
  'Proyecto para licitar',
  'En licitación',
  'Obras en Curso',
  'Obras Finalizadas'
];

const DEFAULT_STAGE_DAYS = {
  'Estudio de Factibilidad': 45,
  'Proyecto': 60,
  'Proyecto para licitar': 30,
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
    nombre: 'Arq. Cossano (PM Periféricos)',
    email: 'cossano.perifericos@hospitalitaliano.org.ar',
    salt: DEFAULT_SALT,
    password_hash: DEFAULT_ADMIN_HASH,
    debe_cambiar_clave: false,
    sede: 'Periféricos',
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
  items: [],
  users: [],
  currentUser: null,

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
            (u.username && u.username.toLowerCase() === defU.username.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === defU.email.toLowerCase())
          );
          if (!existing) {
            this.users.push({ ...defU });
          } else {
            // Actualizar campos de autenticación si faltaban
            if (!existing.username) existing.username = defU.username;
            if (!existing.salt) existing.salt = defU.salt;
            if (!existing.password_hash) existing.password_hash = defU.password_hash;
            if (existing.debe_cambiar_clave === undefined) existing.debe_cambiar_clave = defU.debe_cambiar_clave;
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
      if (!u.salt) u.salt = generateSalt();
      if (!u.password_hash) u.password_hash = hashPassword('Admin2025!', u.salt);
      if (u.debe_cambiar_clave === undefined) u.debe_cambiar_clave = false;
      if (u.activo === undefined) u.activo = true;
    });
    this.persistUsers();

    const activeUsrId = localStorage.getItem('sigo_active_user_id');
    this.currentUser = activeUsrId ? (this.users.find(u => u.id === activeUsrId && u.activo) || null) : null;
    if (activeUsrId && !this.currentUser) {
      localStorage.removeItem('sigo_active_user_id');
    }

    // 2. Cargar Obras
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
          
          if (!item.fecha_fin_etapa) {
            const days = DEFAULT_STAGE_DAYS[item.estado] || 45;
            const d = new Date();
            d.setDate(d.getDate() + days);
            item.fecha_fin_etapa = d.toISOString().split('T')[0];
          }
        });

        this.persist();
      }
    }

    // Normalizar datos (unificación de Anteproyecto en Estudio de Factibilidad)
    this.items.forEach(item => {
      if (item.sede === 'Almagro') item.sede = 'Central';
      if (item.sede === 'Periférico') item.sede = 'Periféricos';
      if (item.estado === 'Ante Proyecto') item.estado = 'Estudio de Factibilidad';

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
        this.persist();
      }
    }

    console.log(`DataStore v2.2 inicializado: ${this.items.length} proyectos. Usuario activo: ${this.currentUser ? this.currentUser.nombre : 'Ninguno (Requiere Login)'}`);
  },

  persist() {
    localStorage.setItem('sigo_obras_data', JSON.stringify(this.items));
  },

  persistUsers() {
    localStorage.setItem('sigo_users_list', JSON.stringify(this.users));
  },

  // ================= FORMATO DE MONEDA EN USD =================
  formatUSD(amount) {
    const n = parseFloat(amount) || 0;
    return `USD ${Math.round(n).toLocaleString('en-US')}`;
  },

  // ================= CARGA DE FACTIBILIDAD =================
  createFactibilidad(data) {
    if (!this.currentUser) throw new Error('No hay sesión iniciada');
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador' || !this.currentUser.puede_crear) {
      throw new Error('⛔ Acceso Denegado: Tu perfil no tiene autorización para crear obras ni solicitudes de factibilidad.');
    }
    const userSede = this.currentUser.sede !== 'Todas' ? this.currentUser.sede : (data.sede || 'Central');
    const newId = `OBRA-${(this.items.length + 1).toString().padStart(3, '0')}`;
    const pTec = parseFloat(data.prioridad_tecnica) || 3;
    const monto = parseFloat(data.monto_estimado) || 0;

    const newItem = {
      id: newId,
      tipo: data.tipo || 'Obra Civil',
      partida: '', // Pendiente de asignación formal
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
      responsable: data.responsable || this.currentUser.nombre || 'Sin Asignar',
      categoria: data.categoria || 'Obra Civil',
      clasificacion: 'Nueva Solicitud',
      observaciones: `Sector: ${data.sector_solicitante || 'S/D'} | Motivo: ${data.motivo || 'S/D'}`,
      fecha_inicio_etapa: new Date().toISOString().split('T')[0],
      fecha_fin_etapa: this.getDefaultDeadlineForStage('Estudio de Factibilidad'),
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
    this.persist();

    if (SupabaseManager.isConfigured) {
      SupabaseManager.upsertObraInCloud(newItem);
    }

    return newItem;
  },

  // ================= ASIGNACIÓN DE PARTIDA PRESUPUESTARIA =================
  asignarPartidaPresupuestaria(itemId, partidaNum, montoPartida) {
    const item = this.getItemById(itemId);
    if (!item) return { success: false, msg: 'Obra no encontrada' };

    if (!this.currentUser) return { success: false, msg: 'No hay usuario autenticado' };
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador' || !this.currentUser.puede_asignar_partida) {
      return { 
        success: false, 
        msg: '⛔ Acceso Denegado: No tienes el permiso específico requerido para asignar partida presupuestaria.' 
      };
    }

    if (!partidaNum || partidaNum.trim() === '') {
      return { success: false, msg: 'Debes ingresar un número de partida válido' };
    }

    const montoVal = parseFloat(montoPartida);
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
      observaciones: `Partida presupuestaria N° ${item.partida} asignada por ${this.formatUSD(montoVal)} por ${this.currentUser.nombre}. Habilita avance a etapa de Proyecto.`
    });

    this.saveItem(item);
    return { success: true, partida: item.partida, monto_partida_usd: item.monto_partida_usd };
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
      ponderacion = pTec;
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
      faltaMedica: (pMed === 0 || item.prioridad_medica === null)
    };
  },

  // ================= WORKFLOW SECUENCIAL =================
  getNextStage(currentStage) {
    if (currentStage === 'Ante Proyecto') return 'Proyecto';
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

  confirmAndAdvanceStage(itemId, completionDate, nextDeadline, notes) {
    const item = this.getItemById(itemId);
    if (!item) return { success: false, msg: 'Obra no encontrada' };

    if (!this.canUserEditObra(item)) {
      return { success: false, msg: `No tienes permisos para modificar obras de la sede ${item.sede}` };
    }
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador' || !this.currentUser.puede_avanzar) {
      return { success: false, msg: '⛔ Acceso Denegado: Tu rol no tiene permiso para certificar ni avanzar etapas' };
    }

    const currentStage = item.estado;
    const nextStage = this.getNextStage(currentStage);
    if (!nextStage) {
      return { success: false, msg: 'Esta obra ya se encuentra en su etapa final' };
    }

    // VALIDACIÓN CRÍTICA: De Factibilidad a Proyecto se REQUIERE OBLIGATORIAMENTE permiso específico puede_asignar_partida y número de partida presupuestaria
    if (currentStage === 'Estudio de Factibilidad' && nextStage === 'Proyecto') {
      if (!this.currentUser.puede_asignar_partida) {
        return { 
          success: false, 
          msg: '⛔ Acceso Denegado: No tienes el permiso específico requerido para asignar partida presupuestaria ni autorizar la salida de Factibilidad hacia Proyecto.',
          requierePartida: false 
        };
      }
      if (!item.partida || item.partida.trim() === '' || item.partida === 'S/D' || item.partida.toUpperCase() === 'PENDIENTE') {
        return { 
          success: false, 
          msg: '⛔ Bloqueado: Para avanzar a la etapa de "Proyecto" es OBLIGATORIO contar con un Número de Partida Presupuestaria asignado. Si no existe número de partida, el sistema no permite avanzar.',
          requierePartida: true 
        };
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

    const today = new Date().toISOString().split('T')[0];
    const compDate = completionDate || today;

    item.historial.unshift({
      fecha: compDate,
      usuario: this.currentUser.nombre,
      estado_anterior: currentStage,
      estado_nuevo: nextStage,
      fecha_limite: nextDeadline,
      observaciones: notes || `Etapa '${currentStage}' completada y confirmada. Avanza a '${nextStage}'.`
    });

    item.estado = nextStage;
    item.fecha_inicio_etapa = compDate;
    item.fecha_fin_etapa = nextDeadline || this.getDefaultDeadlineForStage(nextStage);

    if (nextStage === 'Obras Finalizadas') {
      item.fecha_real_finalizada = compDate;
    }

    this.saveItem(item);
    return { success: true, nextStage: nextStage };
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
    } else if (diffDays <= 30) {
      return { 
        status: 'por_vencer', 
        label: `Por vencer (${diffDays}d)`, 
        class: 'badge-semaforo-por-vencer', 
        days: diffDays 
      };
    } else {
      return { 
        status: 'en_plazo', 
        label: `En plazo (${diffDays}d)`, 
        class: 'badge-semaforo-en-plazo', 
        days: diffDays 
      };
    }
  },

  isAdmin() {
    return Boolean(this.currentUser && this.currentUser.rol === 'admin');
  },

  canEditObraMasterData() {
    return this.isAdmin();
  },

  canUserEditObra(item) {
    if (!this.currentUser) return false;
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador') return false;
    if (this.currentUser.rol === 'admin') return true;
    if (this.currentUser.sede === 'Todas') return true;
    return (item.sede || '').toLowerCase() === (this.currentUser.sede || '').toLowerCase();
  },

  canUserCreateInSede(sede) {
    if (!this.currentUser) return false;
    if (this.currentUser.solo_lectura || this.currentUser.rol === 'visualizador' || !this.currentUser.puede_crear) return false;
    if (this.currentUser.rol === 'admin' || this.currentUser.sede === 'Todas') return true;
    return (this.currentUser.sede || '').toLowerCase() === (sede || '').toLowerCase();
  },

  // ================= FILTROS Y KPIS DESGLOSADOS =================
  getFilteredItems(filters = {}) {
    return this.items.filter(item => {
      // Restricción de Sede por usuario
      if (this.currentUser && this.currentUser.sede !== 'Todas') {
        if ((item.sede || '').toLowerCase() !== this.currentUser.sede.toLowerCase()) return false;
      }
      // Filtro Sede explícito
      if (filters.sede && filters.sede !== 'TODAS') {
        if ((item.sede || '').toLowerCase() !== filters.sede.toLowerCase()) return false;
      }
      // Filtro Tipo
      if (filters.tipo && filters.tipo !== 'TODOS') {
        if (item.tipo !== filters.tipo) return false;
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

    let vencidos = 0;
    let porVencer = 0;
    let enPlazo = 0;
    let finalizadasCount = 0;
    let suspendidasCount = 0;

    const estadosCount = {
      'Estudio de Factibilidad': 0,
      'Proyecto': 0,
      'Proyecto para licitar': 0,
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
      const mTotal = mObra + mEquip;

      const isFinalizada = item.estado === 'Obras Finalizadas';
      const isSuspendida = item.estado === 'Suspendida';

      if (isFinalizada) {
        sumFinalizadas += mTotal;
        finalizadasCount++;
      } else if (isSuspendida) {
        sumSuspendidas += mTotal;
        suspendidasCount++;
      } else {
        // Obra activa
        if (item.tipo === 'Infraestructura') {
          sumInfraActiva += mObra;
        } else {
          sumObraActiva += mObra;
          sumEquipActivo += mEquip;
        }
      }

      const sem = this.calculateSemaforo(item);
      if (sem.status === 'vencido') vencidos++;
      else if (sem.status === 'por_vencer') porVencer++;
      else if (sem.status === 'en_plazo') enPlazo++;

      const est = (item.estado === 'Ante Proyecto') ? 'Estudio de Factibilidad' : item.estado;
      if (estadosCount.hasOwnProperty(est)) {
        estadosCount[est]++;
      } else {
        estadosCount[est] = 1;
      }

      const s = item.sede || 'Central';
      if (!sedesCount[s]) sedesCount[s] = { count: 0, usd: 0 };
      sedesCount[s].count++;
      sedesCount[s].usd += mTotal;
    });

    const activeTotal = vencidos + porVencer + enPlazo;
    const porcentajeEnPlazo = activeTotal > 0 ? Math.round((enPlazo / activeTotal) * 100) : 100;

    // Total en cartera activa (lo que realmente está en juego sin duplicar)
    const totalCarteraActiva = sumObraActiva + sumEquipActivo + sumInfraActiva;

    return {
      totalItems: list.length,
      totalCarteraActiva,
      sumObraActiva,
      sumEquipActivo,
      sumInfraActiva,
      sumSuspendidas,
      sumFinalizadas,
      vencidos,
      porVencer,
      enPlazo,
      finalizadas: finalizadasCount,
      suspendidas: suspendidasCount,
      porcentajeEnPlazo,
      estadosCount,
      sedesCount
    };
  },

  // ================= CASHFLOW MULTIANUAL & PARTIDAS PRESUPUESTARIAS =================
  hasValidPartida(item) {
    if (!item || !item.partida) return false;
    const p = String(item.partida).trim();
    return p !== '' && p !== 'S/D' && p.toUpperCase() !== 'PENDIENTE' && p.toUpperCase() !== 'NONE';
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

  getCashflowSummary(tipoFilter = 'TODOS', partidaFilter = 'todas', searchQuery = '') {
    // 1. Filtrar lista base según usuario y tipo
    let list = this.getFilteredItems({ tipo: tipoFilter });

    // 2. Filtrar proyectos relevantes para el Cashflow (con cashflow o con partida/monto)
    let cfList = list.filter(x => {
      const hasCF = x.cashflow && (x.cashflow.monto_total > 0 || x.cashflow.cashflow_2026 > 0 || x.cashflow.cashflow_2027 > 0 || x.cashflow.cashflow_2028 > 0 || x.cashflow.cashflow_2029 > 0);
      const hasPartida = this.hasValidPartida(x);
      const hasMonto = (x.monto_total_usd > 0 || x.monto_obra_usd > 0);
      return hasCF || hasPartida || hasMonto;
    });

    // 3. Totales globales de la cartera seleccionada (independiente del filtro secundario de partida)
    let totalCarteraUSD = 0;
    let totalAsignadoPartidasUSD = 0;
    let countConPartida = 0;
    let countSinPartida = 0;
    let totalSinPartidaUSD = 0;
    let tot2026Global = 0, tot2027Global = 0, tot2028Global = 0, tot2029Global = 0;

    cfList.forEach(x => {
      const mTotal = (x.cashflow && x.cashflow.monto_total > 0) 
        ? x.cashflow.monto_total 
        : (x.monto_total_usd || x.monto_obra_usd || 0);

      totalCarteraUSD += mTotal;

      if (x.cashflow) {
        tot2026Global += x.cashflow.cashflow_2026 || 0;
        tot2027Global += x.cashflow.cashflow_2027 || 0;
        tot2028Global += x.cashflow.cashflow_2028 || 0;
        tot2029Global += x.cashflow.cashflow_2029 || 0;
      } else {
        tot2026Global += mTotal;
      }

      if (this.hasValidPartida(x)) {
        countConPartida++;
        const mPart = this.getItemMontoPartida(x);
        totalAsignadoPartidasUSD += mPart;
      } else {
        countSinPartida++;
        totalSinPartidaUSD += mTotal;
      }
    });

    // 4. Aplicar filtro secundario de partida (todas, con_partida, sin_partida)
    let displayList = cfList;
    if (partidaFilter === 'con_partida') {
      displayList = cfList.filter(x => this.hasValidPartida(x));
    } else if (partidaFilter === 'sin_partida') {
      displayList = cfList.filter(x => !this.hasValidPartida(x));
    }

    // 5. Aplicar búsqueda de texto si se proporcionó
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      displayList = displayList.filter(x => 
        (x.id || '').toLowerCase().includes(q) ||
        (x.nombre || '').toLowerCase().includes(q) ||
        (x.partida || '').toLowerCase().includes(q) ||
        (x.sede || '').toLowerCase().includes(q) ||
        (x.tipo || '').toLowerCase().includes(q)
      );
    }

    // 6. Subtotales específicos de los elementos mostrados en pantalla
    let displayTotGral = 0;
    let displayTot2026 = 0, displayTot2027 = 0, displayTot2028 = 0, displayTot2029 = 0;
    let displayTotPartidas = 0;

    displayList.forEach(x => {
      const mTotal = (x.cashflow && x.cashflow.monto_total > 0) 
        ? x.cashflow.monto_total 
        : (x.monto_total_usd || x.monto_obra_usd || 0);
      displayTotGral += mTotal;

      if (x.cashflow) {
        displayTot2026 += x.cashflow.cashflow_2026 || 0;
        displayTot2027 += x.cashflow.cashflow_2027 || 0;
        displayTot2028 += x.cashflow.cashflow_2028 || 0;
        displayTot2029 += x.cashflow.cashflow_2029 || 0;
      } else {
        displayTot2026 += mTotal;
      }

      if (this.hasValidPartida(x)) {
        displayTotPartidas += this.getItemMontoPartida(x);
      }
    });

    return {
      displayList,
      totalCarteraUSD,
      totalAsignadoPartidasUSD,
      countConPartida,
      countSinPartida,
      totalSinPartidaUSD,
      tot2026Global,
      tot2027Global,
      tot2028Global,
      tot2029Global,
      totalObras: cfList.length,
      displayTotGral,
      displayTot2026,
      displayTot2027,
      displayTot2028,
      displayTot2029,
      displayTotPartidas,
      tipoFilter,
      partidaFilter
    };
  },

  // ================= DIRECCIÓN MÉDICA =================
  getPendingMedicalPriorityItems() {
    return this.items.filter(item => {
      if (item.estado === 'Obras Finalizadas' || item.estado === 'Suspendida') return false;
      return (!item.prioridad_medica || item.prioridad_medica === 0 || item.prioridad_medica === null);
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

    this.saveItem(item);
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

    const newUser = {
      id: `usr-${Date.now()}`,
      username: username,
      nombre: userData.nombre.trim(),
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
      solo_lectura: userData.solo_lectura ?? false
    };

    this.users.push(newUser);
    this.persistUsers();
    return { user: newUser, tempPassword: tempPassword };
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
    if (data.email) user.email = data.email.trim().toLowerCase();
    if (data.sede) user.sede = data.sede;
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
    if (!usernameOrEmail || !usernameOrEmail.trim()) {
      return { success: false, msg: 'Por favor ingresa tu usuario o correo electrónico.' };
    }
    if (!password || !password.trim()) {
      return { success: false, msg: 'Por favor ingresa tu contraseña.' };
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const user = this.users.find(u => 
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (u.email && u.email.toLowerCase() === cleanInput)
    );

    if (!user) {
      return { success: false, msg: '⛔ Usuario o contraseña incorrectos. Verifica tus datos de ingreso.' };
    }

    if (!user.activo) {
      return { 
        success: false, 
        msg: `⛔ Acceso Denegado: El acceso para "${user.nombre}" ha sido revocado. Contacta al Administrador para su habilitación.` 
      };
    }

    const salt = user.salt || DEFAULT_SALT;
    const computedHash = hashPassword(password, salt);

    // Comparar hash criptográfico
    if (computedHash !== user.password_hash) {
      return { success: false, msg: '⛔ Usuario o contraseña incorrectos. Verifica tus datos de ingreso.' };
    }

    // Autenticación correcta
    this.currentUser = user;
    localStorage.setItem('sigo_active_user_id', user.id);

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

  saveItem(item) {
    if (this.currentUser && !this.canUserEditObra(item)) {
      (console.warn || console.log)('⛔ Bloqueado: Usuario sin permisos de edición para la obra', item.id);
      return false;
    }
    const idx = this.items.findIndex(x => x.id === item.id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], ...item };
    } else {
      this.items.unshift(item);
    }
    this.persist();

    if (SupabaseManager.isConfigured) {
      SupabaseManager.upsertObraInCloud(item);
    }
    return true;
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
        'Semáforo': sem.status.toUpperCase(),
        'Días Restantes': sem.days !== null ? sem.days : '',
        'Monto Obra USD': item.monto_obra_usd || 0,
        'Monto Equipamiento USD': item.monto_equipamiento_usd || 0,
        'Total USD': (item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0),
        'Prioridad Técnica (Solicitante)': item.prioridad_tecnica || '',
        'Prioridad Médica (Dirección)': item.prioridad_medica || 'Pendiente',
        'Ponderación Global': pond.valor,
        'Nivel Ponderación': pond.nivelLabel,
        'Responsable': item.responsable || '',
        'Proveedor': item.proveedor || '',
        'Categoría': item.categoria || '',
        'Fecha Inicio Etapa': item.fecha_inicio_etapa || '',
        'Fecha Límite Etapa': item.fecha_fin_etapa || '',
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
  }
};

window.DataStore = DataStore;
