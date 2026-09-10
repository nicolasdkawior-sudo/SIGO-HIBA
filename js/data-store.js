// Gestor de Datos y Estado Global - SIGO HIBA
const DataStore = {
  items: [],
  currentRole: 'admin', // admin, pm_obra, direccion_medica, licitaciones, auditor
  currentUser: { nombre: 'Dirección General', email: 'direccion@hiba.org.ar', rol: 'admin' },

  init() {
    // 1. Cargar de LocalStorage si existe
    const local = localStorage.getItem('sigo_obras_data');
    if (local) {
      try {
        this.items = JSON.parse(local);
      } catch (e) {
        console.error("Error al leer local data:", e);
      }
    }

    // 2. Si no hay datos locales, cargar los iniciales extraídos del Excel
    if (!this.items || this.items.length === 0) {
      if (window.INITIAL_DATA) {
        const rawObras = window.INITIAL_DATA.obras || [];
        const rawInfra = window.INITIAL_DATA.infraestructura || [];
        this.items = [...rawObras, ...rawInfra];
        this.persist();
      }
    }

    // 3. Normalizar propiedades
    this.items.forEach(item => {
      if (!item.historial) {
        item.historial = [{
          fecha: new Date().toISOString().split('T')[0],
          usuario: item.responsable || 'Sistema HIBA',
          estado_anterior: null,
          estado_nuevo: item.estado,
          observaciones: 'Carga inicial desde planilla histórica 2025'
        }];
      }
    });

    console.log(`DataStore inicializado con ${this.items.length} obras/proyectos.`);
  },

  persist() {
    localStorage.setItem('sigo_obras_data', JSON.stringify(this.items));
  },

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
    // Normalizar a medianoche para cálculo justo
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

  getFilteredItems(filters = {}) {
    return this.items.filter(item => {
      // Filtro Sede
      if (filters.sede && filters.sede !== 'TODAS') {
        if ((item.sede || '').toLowerCase() !== filters.sede.toLowerCase()) return false;
      }
      // Filtro Tipo (Obra Civil vs Infraestructura)
      if (filters.tipo && filters.tipo !== 'TODOS') {
        if (item.tipo !== filters.tipo) return false;
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
      // Búsqueda por texto libre
      if (filters.search && filters.search.trim() !== '') {
        const q = filters.search.toLowerCase();
        const match = 
          (item.id || '').toLowerCase().includes(q) ||
          (item.nombre || '').toLowerCase().includes(q) ||
          (item.partida || '').toLowerCase().includes(q) ||
          (item.proveedor || '').toLowerCase().includes(q) ||
          (item.responsable || '').toLowerCase().includes(q) ||
          (item.clasificacion || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  getKPIs(filters = {}) {
    const list = this.getFilteredItems(filters);
    let totalUsd = 0;
    let vencidos = 0;
    let porVencer = 0;
    let enPlazo = 0;
    let finalizadas = 0;
    let suspendidas = 0;

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

    const sedesCount = {};
    const categoriasCount = {};

    list.forEach(item => {
      const monto = (item.monto_total_usd || item.monto_obra_usd || 0);
      totalUsd += monto;

      const sem = this.calculateSemaforo(item);
      if (sem.status === 'vencido') vencidos++;
      else if (sem.status === 'por_vencer') porVencer++;
      else if (sem.status === 'en_plazo') enPlazo++;
      else if (sem.status === 'finalizado') finalizadas++;
      else if (sem.status === 'suspendido') suspendidas++;

      // Estado count
      if (estadosCount.hasOwnProperty(item.estado)) {
        estadosCount[item.estado]++;
      } else {
        estadosCount[item.estado] = 1;
      }

      // Sede count & USD
      const s = item.sede || 'Sin Sede';
      if (!sedesCount[s]) sedesCount[s] = { count: 0, usd: 0 };
      sedesCount[s].count++;
      sedesCount[s].usd += monto;

      // Categoria count
      const c = item.categoria || 'Otras';
      if (!categoriasCount[c]) categoriasCount[c] = { count: 0, usd: 0 };
      categoriasCount[c].count++;
      categoriasCount[c].usd += monto;
    });

    const activeTotal = vencidos + porVencer + enPlazo;
    const porcentajeEnPlazo = activeTotal > 0 ? Math.round((enPlazo / activeTotal) * 100) : 100;

    return {
      totalItems: list.length,
      totalUsd,
      vencidos,
      porVencer,
      enPlazo,
      finalizadas,
      suspendidas,
      porcentajeEnPlazo,
      estadosCount,
      sedesCount,
      categoriasCount
    };
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

    // Sincronizar en nube si está conectado
    if (SupabaseManager.isConfigured) {
      SupabaseManager.upsertObraInCloud(item);
    }
    return true;
  },

  transitionStage(itemId, newStage, newDeadline, notes) {
    const item = this.getItemById(itemId);
    if (!item) return false;

    const oldStage = item.estado;
    item.estado = newStage;
    if (newDeadline) {
      item.fecha_fin_etapa = newDeadline;
    }
    item.fecha_inicio_etapa = new Date().toISOString().split('T')[0];

    if (!item.historial) item.historial = [];
    item.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      usuario: this.currentUser.nombre || 'Usuario HIBA',
      estado_anterior: oldStage,
      estado_nuevo: newStage,
      fecha_limite: newDeadline || item.fecha_fin_etapa,
      observaciones: notes || `Pase de estado registrado por ${this.currentUser.nombre}`
    });

    this.saveItem(item);
    return true;
  },

  exportToExcel(filters = {}) {
    const data = this.getFilteredItems(filters).map(item => {
      const sem = this.calculateSemaforo(item);
      return {
        'Código': item.id,
        'Tipo': item.tipo,
        'Sede': item.sede,
        'Inversión / Nombre': item.nombre,
        'Partida': item.partida || '',
        'Estado': item.estado,
        'Semáforo': sem.status.toUpperCase(),
        'Días Restantes': sem.days !== null ? sem.days : '',
        'Monto Obra USD': item.monto_obra_usd || 0,
        'Monto Equipamiento USD': item.monto_equipamiento_usd || 0,
        'Total USD': item.monto_total_usd || (item.monto_obra_usd + item.monto_equipamiento_usd) || 0,
        'Prioridad Técnica': item.prioridad_tecnica || '',
        'Prioridad Médica': item.prioridad_medica || '',
        'Prioridad Final': item.prioridad_final || '',
        'Responsable': item.responsable || '',
        'Proveedor': item.proveedor || '',
        'Categoría': item.categoria || '',
        'Clasificación': item.clasificacion || '',
        'Fecha Inicio Etapa': item.fecha_inicio_etapa || '',
        'Fecha Límite Etapa': item.fecha_fin_etapa || '',
        'Fecha Fin Obra': item.fecha_fin_obra || '',
        'Observaciones': item.observaciones || ''
      };
    });

    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Seguimiento_Obras_HIBA");
      XLSX.writeFile(wb, `Reporte_Obras_HIBA_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      alert("Librería XLSX no cargada. No se pudo generar el archivo.");
    }
  }
};

window.DataStore = DataStore;
