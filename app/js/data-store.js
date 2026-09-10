// ==============================================================================
// GESTOR DE DATOS, ESTADOS, USUARIOS Y WORKFLOW SECUENCIAL - SIGO HIBA v2.1
// Formato USD estricto, Carga de Factibilidad, Asignación de Partida y Ponderación
// ==============================================================================

const STAGES_SEQUENCE = [
  'Estudio de Factibilidad',
  'Ante Proyecto',
  'Proyecto',
  'Proyecto para licitar',
  'En licitación',
  'Obras en Curso',
  'Obras Finalizadas'
];

const DEFAULT_STAGE_DAYS = {
  'Estudio de Factibilidad': 30,
  'Ante Proyecto': 45,
  'Proyecto': 60,
  'Proyecto para licitar': 30,
  'En licitación': 45,
  'Obras en Curso': 120
};

const DEFAULT_USERS = [
  {
    id: 'usr-1',
    nombre: 'Dirección General (Admin)',
    email: 'admin.obras@gmail.com',
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
    id: 'usr-2',
    nombre: 'Dirección Médica HIBA',
    email: 'direccion.medica@gmail.com',
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
    id: 'usr-3',
    nombre: 'Arq. Palmioli (PM Central)',
    email: 'palmioli.central@gmail.com',
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
    id: 'usr-4',
    nombre: 'Ing. Waldemar (PM San Justo)',
    email: 'waldemar.sanjusto@gmail.com',
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
    id: 'usr-5',
    nombre: 'Arq. Cossano (PM Periféricos)',
    email: 'cossano.perifericos@gmail.com',
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
    id: 'usr-6',
    nombre: 'Compras & Licitaciones',
    email: 'licitaciones.hiba@gmail.com',
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
    id: 'usr-7',
    nombre: 'Auditoría y Control',
    email: 'auditor.externo@gmail.com',
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
    const localUsers = localStorage.getItem('sigo_users_list');
    if (localUsers) {
      try {
        this.users = JSON.parse(localUsers);
      } catch (e) {
        this.users = [...DEFAULT_USERS];
      }
    } else {
      this.users = [...DEFAULT_USERS];
      this.persistUsers();
    }

    const activeUsrId = localStorage.getItem('sigo_active_user_id');
    this.currentUser = this.users.find(u => u.id === activeUsrId) || this.users[0];

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
          
          if (!item.fecha_fin_etapa) {
            const days = DEFAULT_STAGE_DAYS[item.estado] || 30;
            const d = new Date();
            d.setDate(d.getDate() + days);
            item.fecha_fin_etapa = d.toISOString().split('T')[0];
          }
        });

        this.persist();
      }
    }

    // Normalizar datos
    this.items.forEach(item => {
      if (item.sede === 'Almagro') item.sede = 'Central';
      if (item.sede === 'Periférico') item.sede = 'Periféricos';

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

    console.log(`DataStore v2.1 inicializado: ${this.items.length} proyectos. Usuario activo: ${this.currentUser.nombre}`);
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
  asignarPartidaPresupuestaria(itemId, partidaNum) {
    const item = this.getItemById(itemId);
    if (!item) return { success: false, msg: 'Obra no encontrada' };

    if (!partidaNum || partidaNum.trim() === '') {
      return { success: false, msg: 'Debes ingresar un número de partida válido' };
    }

    item.partida = partidaNum.trim();
    item.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      usuario: this.currentUser.nombre,
      estado_anterior: item.estado,
      estado_nuevo: item.estado,
      observaciones: `Partida presupuestaria N° ${item.partida} asignada por ${this.currentUser.nombre}. Habilita inicio de Anteproyecto.`
    });

    this.saveItem(item);
    return { success: true, partida: item.partida };
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
    } else if (pMed > 0) {
      ponderacion = pMed;
    } else if (pTec > 0) {
      ponderacion = pTec;
    }

    let colorClass = 'bg-blue-100 text-blue-800 border-blue-300';
    let nivelLabel = 'Mínima / Nivel 1';
    let esCritico = false;

    if (ponderacion >= 4.8) {
      colorClass = 'bg-red-600 text-white border-red-700 font-black animate-pulse';
      nivelLabel = 'CRÍTICA / NIVEL 5';
      esCritico = true;
    } else if (ponderacion >= 3.8) {
      colorClass = 'bg-orange-500 text-white border-orange-600 font-extrabold';
      nivelLabel = 'ALTA / NIVEL 4';
    } else if (ponderacion >= 2.8) {
      colorClass = 'bg-amber-400 text-slate-900 border-amber-500 font-bold';
      nivelLabel = 'MEDIA / NIVEL 3';
    } else if (ponderacion >= 1.8) {
      colorClass = 'bg-emerald-500 text-white border-emerald-600 font-semibold';
      nivelLabel = 'BAJA / NIVEL 2';
    }

    return {
      valor: ponderacion,
      nivelLabel,
      colorClass,
      esCritico,
      pTec,
      pMed,
      faltaMedica: (pMed === 0 || item.prioridad_medica === null)
    };
  },

  // ================= WORKFLOW SECUENCIAL =================
  getNextStage(currentStage) {
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
    if (this.currentUser.solo_lectura || !this.currentUser.puede_avanzar) {
      return { success: false, msg: 'Tu rol no tiene permiso para avanzar etapas' };
    }

    const currentStage = item.estado;
    const nextStage = this.getNextStage(currentStage);
    if (!nextStage) {
      return { success: false, msg: 'Esta obra ya se encuentra en su etapa final' };
    }

    // VALIDACIÓN CRÍTICA: De Factibilidad a Anteproyecto se REQUIERE número de partida presupuestaria
    if (currentStage === 'Estudio de Factibilidad' && nextStage === 'Ante Proyecto') {
      if (!item.partida || item.partida.trim() === '' || item.partida === 'S/D') {
        return { 
          success: false, 
          msg: 'Para iniciar el Anteproyecto se requiere tener asignado un Número de Partida Presupuestaria por la Dirección o Administrador.',
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

  canUserEditObra(item) {
    if (!this.currentUser) return false;
    if (this.currentUser.rol === 'admin') return true;
    if (this.currentUser.sede === 'Todas') return true;
    return (item.sede || '').toLowerCase() === (this.currentUser.sede || '').toLowerCase();
  },

  canUserCreateInSede(sede) {
    if (!this.currentUser) return false;
    if (this.currentUser.solo_lectura || !this.currentUser.puede_crear) return false;
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
      'Ante Proyecto': 0,
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

      if (estadosCount.hasOwnProperty(item.estado)) {
        estadosCount[item.estado]++;
      } else {
        estadosCount[item.estado] = 1;
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

  // ================= USUARIOS =================
  addUser(userData) {
    const newUser = {
      id: `usr-${Date.now()}`,
      nombre: userData.nombre,
      email: userData.email,
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
    return newUser;
  },

  toggleUserStatus(userId) {
    const u = this.users.find(x => x.id === userId);
    if (u) {
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

  loginWithGoogle(email) {
    const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (!existing.activo) return { success: false, msg: 'Usuario inactivo.' };
      this.currentUser = existing;
      localStorage.setItem('sigo_active_user_id', existing.id);
      return { success: true, user: existing };
    }
    const newUser = this.addUser({
      nombre: email.split('@')[0],
      email: email,
      sede: 'Todas',
      rol: 'visualizador',
      solo_lectura: true,
      puede_crear: false,
      puede_avanzar: false,
      puede_priorizar_medica: false
    });
    this.currentUser = newUser;
    localStorage.setItem('sigo_active_user_id', newUser.id);
    return { success: true, user: newUser, msg: 'Usuario registrado con acceso de lectura.' };
  },

  getItemById(id) {
    return this.items.find(x => x.id === id);
  },

  saveItem(item) {
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
