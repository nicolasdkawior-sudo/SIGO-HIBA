// ==============================================================================
// GESTOR DE SEGURIDAD INSTITUCIONAL, RATE LIMITING Y ANTI-FUERZA BRUTA
// ==============================================================================
const SecurityManager = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 5 * 60 * 1000, // 5 minutos de bloqueo temporal
  STORAGE_KEY: 'sigo_security_lockout',
  timerInterval: null,

  getLockoutState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return { attempts: 0, lockedUntil: 0 };
      const state = JSON.parse(raw);
      if (state.lockedUntil && Date.now() > state.lockedUntil) {
        this.resetAttempts();
        return { attempts: 0, lockedUntil: 0 };
      }
      return state;
    } catch (e) {
      return { attempts: 0, lockedUntil: 0 };
    }
  },

  isLocked() {
    const state = this.getLockoutState();
    return Boolean(state.lockedUntil && Date.now() < state.lockedUntil);
  },

  getRemainingLockoutSeconds() {
    const state = this.getLockoutState();
    if (!state.lockedUntil) return 0;
    return Math.max(0, Math.ceil((state.lockedUntil - Date.now()) / 1000));
  },

  recordFailedAttempt(username = '') {
    const state = this.getLockoutState();
    state.attempts = (state.attempts || 0) + 1;
    state.lastAttempt = Date.now();
    state.lastUsername = username;

    if (state.attempts >= this.MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + this.LOCKOUT_DURATION_MS;
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    return state;
  },

  recordSuccessfulLogin() {
    this.resetAttempts();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  resetAttempts() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  startLockoutCountdown(onTick, onExpired) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const update = () => {
      const remaining = this.getRemainingLockoutSeconds();
      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.resetAttempts();
        if (onExpired) onExpired();
      } else {
        if (onTick) onTick(this.formatTime(remaining), remaining);
      }
    };
    update();
    this.timerInterval = setInterval(update, 1000);
  }
};

window.SecurityManager = SecurityManager;

const App = {
  currentView: 'dashboard',
  filters: {
    dependencia: 'TODAS',
    sede: 'TODAS',
    tipo: 'TODOS',
    estado: 'TODOS',
    semaforo: 'TODOS',
    responsable: 'TODOS',
    asignacion: 'TODAS', // 'TODAS', 'ASIGNADAS', 'SIN_ASIGNAR'
    filtroFinalizadas: 'todas', // 'todas', 'activas', 'finalizadas', 'suspendidas'
    search: ''
  },
  adminEditModeActive: false,
  cashflowFilterTipo: 'TODOS', // 'TODOS', 'Obra Civil', 'Infraestructura'
  cashflowFilterPartida: 'todas', // 'todas', 'con_partida', 'sin_partida'
  cashflowSearch: '',
  pipelineSelectedStage: null, // Etapa seleccionada al hacer clic en el gráfico
  charts: {},
  chartsNeedRefresh: false,

  init() {
    this.pipelineSelectedStage = null;
    DataStore.init();
    SupabaseManager.init();

    this.checkLockoutState();
    this.initInactivityWatcher();

    this.setupEventListeners();
    this.updateCloudStatusUI();
    this.initMultiTabSync();

    if (!this.checkAuth()) {
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (DataStore.currentUser && DataStore.currentUser.dependencia && DataStore.currentUser.dependencia !== 'Dirección General / Administración' && !DataStore.isAdmin()) {
      this.filters.dependencia = DataStore.currentUser.dependencia;
    }

    if (DataStore.currentUser && DataStore.currentUser.sede !== 'Todas') {
      this.filters.sede = DataStore.currentUser.sede;
    }

    this.updateUserUI();
    this.render();

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  setupEventListeners() {
    // Navegación por pestañas
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-view-target');
        this.switchView(target);
      });
    });

    // Filtros superiores
    document.getElementById('filterDependencia')?.addEventListener('change', (e) => {
      this.filters.dependencia = e.target.value;
      this.render();
    });

    document.getElementById('filterSede')?.addEventListener('change', (e) => {
      this.filters.sede = e.target.value;
      this.render();
    });

    document.getElementById('filterTipo')?.addEventListener('change', (e) => {
      this.filters.tipo = e.target.value;
      this.render();
    });

    document.getElementById('filterAsignacion')?.addEventListener('change', (e) => {
      this.filters.asignacion = e.target.value;
      this.render();
    });

    document.getElementById('inputSearch')?.addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.render();
    });

    // Botón Conmutador de Finalizadas
    document.getElementById('btnToggleFinalizadas')?.addEventListener('click', () => {
      if (this.filters.filtroFinalizadas === 'activas') {
        this.setFiltroFinalizadas('finalizadas');
      } else if (this.filters.filtroFinalizadas === 'finalizadas') {
        this.setFiltroFinalizadas('todas');
      } else {
        this.setFiltroFinalizadas('activas');
      }
    });

    // Clic en KPI Cards
    document.getElementById('cardKpiVencidos')?.addEventListener('click', () => {
      this.setSemaforoFilter('vencido');
    });
    document.getElementById('cardKpiPorVencer')?.addEventListener('click', () => {
      this.setSemaforoFilter('por_vencer');
    });
    document.getElementById('cardKpiEnPlazo')?.addEventListener('click', () => {
      this.setSemaforoFilter('en_plazo');
    });
    document.getElementById('cardKpiFinalizadas')?.addEventListener('click', () => {
      this.setFiltroFinalizadas('finalizadas');
    });
    document.getElementById('cardKpiSuspendidas')?.addEventListener('click', () => {
      this.setFiltroFinalizadas('suspendidas');
    });

    // Detección en tiempo real de partida compartida en modal
    document.getElementById('modalObraPartida')?.addEventListener('input', (e) => {
      this.checkSharedPartidaNotice(e.target.value);
    });

    // Sincronización instantánea entre múltiples pestañas / ventanas del navegador
    window.addEventListener('storage', (e) => {
      if (e.key === 'sigo_obras_data' || e.key === 'sigo_users_list') {
        DataStore.init();
        this.render();
      }
    });
  },

  // ================= RESTABLECER / LIMPIAR TODOS LOS FILTROS =================
  resetAllFilters() {
    const userSede = DataStore.currentUser && DataStore.currentUser.sede !== 'Todas' ? DataStore.currentUser.sede : 'TODAS';
    const userDep = (!DataStore.isAdmin() && DataStore.currentUser && DataStore.currentUser.dependencia && DataStore.currentUser.dependencia !== 'Dirección General / Administración')
      ? DataStore.currentUser.dependencia
      : 'TODAS';
    
    this.filters = {
      dependencia: userDep,
      sede: userSede,
      tipo: 'TODOS',
      estado: 'TODOS',
      semaforo: 'TODOS',
      responsable: 'TODOS',
      asignacion: 'TODAS',
      filtroFinalizadas: 'todas',
      search: ''
    };
    this.pipelineSelectedStage = null;

    // Sincronizar inputs del DOM
    const selDep = document.getElementById('filterDependencia');
    if (selDep) selDep.value = userDep;
    const selSede = document.getElementById('filterSede');
    if (selSede) selSede.value = userSede;
    const selTipo = document.getElementById('filterTipo');
    if (selTipo) selTipo.value = 'TODOS';
    const selAsign = document.getElementById('filterAsignacion');
    if (selAsign) selAsign.value = 'TODAS';
    const inSearch = document.getElementById('inputSearch');
    if (inSearch) inSearch.value = '';

    this.setFiltroFinalizadas('todas');
    this.render();
    this.showToast('Todos los filtros han sido restablecidos. Viendo cartera completa.');
  },

  setFiltroFinalizadas(modo) {
    this.filters.filtroFinalizadas = modo;
    const btn = document.getElementById('btnToggleFinalizadas');
    if (btn) {
      if (modo === 'finalizadas') {
        btn.className = 'bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md font-bold flex items-center space-x-1.5 shadow-xs';
        btn.innerHTML = `<i data-lucide="check-check" class="w-3.5 h-3.5"></i><span>Viendo: Finalizadas</span>`;
      } else if (modo === 'suspendidas') {
        btn.className = 'bg-slate-700 text-white text-xs px-3 py-1.5 rounded-md font-bold flex items-center space-x-1.5 shadow-xs';
        btn.innerHTML = `<i data-lucide="pause-circle" class="w-3.5 h-3.5"></i><span>Viendo: Suspendidas</span>`;
      } else if (modo === 'todas') {
        btn.className = 'bg-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-md font-bold flex items-center space-x-1.5 shadow-xs';
        btn.innerHTML = `<i data-lucide="layers" class="w-3.5 h-3.5"></i><span>Viendo: Todas</span>`;
      } else {
        btn.className = 'bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 border border-slate-300 transition';
        btn.innerHTML = `<i data-lucide="play-circle" class="w-3.5 h-3.5 text-emerald-600"></i><span>Viendo: Activas</span>`;
      }
    }
    this.render();
    if (window.lucide) lucide.createIcons();
  },

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      const isTarget = btn.getAttribute('data-view-target') === viewName;
      if (isTarget) {
        btn.classList.add('nav-tab-active', 'text-blue-600');
        btn.classList.remove('text-slate-500', 'border-transparent');
      } else {
        btn.classList.remove('nav-tab-active', 'text-blue-600');
        btn.classList.add('text-slate-500', 'border-transparent');
      }
    });

    const views = ['dashboard', 'kanban', 'table', 'gantt', 'cashflow'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.toggle('hidden', v !== viewName);
    });

    if (viewName === 'dashboard' && this.chartsNeedRefresh) {
      const kpis = DataStore.getKPIs(this.filters);
      this.renderCharts(kpis);
      this.chartsNeedRefresh = false;
    }

    this.render();
  },

  setSemaforoFilter(status) {
    this.filters.semaforo = this.filters.semaforo === status ? 'TODOS' : status;
    this.switchView('table');
  },

  // ================= FILTRADO POR CLIC EN BARRA DEL PIPELINE =================
  filterByPipelineStage(stageName) {
    if (this.pipelineSelectedStage === stageName) {
      this.pipelineSelectedStage = null; // Deseleccionar al hacer clic de nuevo
      this.showToast(`Deseleccionado. Mostrando obras prioritarias.`);
    } else {
      this.pipelineSelectedStage = stageName;
      this.showToast(`Filtrando obras en etapa: ${stageName}`);
    }
    this.renderDashboardStageList();
    this.renderCharts(DataStore.getKPIs(this.filters));
    
    // Scroll suave hacia la lista de obras
    document.getElementById('dashboardStageListSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  render() {
    const kpis = DataStore.getKPIs(this.filters);
    this.renderKPIs(kpis);
    this.renderMedicalAlert();

    // Sincronizar y renderizar TODOS los tableros y registros para garantizar consistencia total
    this.renderDashboardStageList();
    this.renderKanban();
    this.renderTable();
    this.renderCashflow();
    this.renderGantt();

    if (this.currentView === 'dashboard') {
      this.renderCharts(kpis);
      this.chartsNeedRefresh = false;
    } else {
      this.chartsNeedRefresh = true;
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderKPIs(kpis) {
    document.getElementById('kpiTotalUsd').innerText = DataStore.formatUSD(kpis.totalCarteraActiva);
    document.getElementById('kpiTotalProyectos').innerText = `${kpis.carteraActivaCount || 0} proyectos activos`;

    const pillCivil = document.getElementById('kpiPillCivil');
    const pillEquip = document.getElementById('kpiPillEquip');
    const pillInfra = document.getElementById('kpiPillInfra');
    if (pillCivil) pillCivil.innerText = `Civil: ${DataStore.formatUSD(kpis.sumObraActiva)}`;
    if (pillEquip) pillEquip.innerText = `Equip: ${DataStore.formatUSD(kpis.sumEquipActivo)}`;
    if (pillInfra) pillInfra.innerText = `Infra: ${DataStore.formatUSD(kpis.sumInfraActiva)}`;

    document.getElementById('kpiEnPlazoCount').innerText = `${kpis.enPlazo}`;
    document.getElementById('kpiEnPlazoPct').innerText = `${kpis.porcentajeEnPlazo}%`;

    document.getElementById('kpiPorVencerCount').innerText = `${kpis.porVencer}`;
    document.getElementById('kpiVencidosCount').innerText = `${kpis.vencidos}`;

    document.getElementById('kpiFinalizadasCount').innerText = `${kpis.finalizadas}`;
    document.getElementById('kpiSuspendidasCount').innerText = `${kpis.suspendidas}`;

    // Badges en tabla
    const badgeContainer = document.getElementById('tableActiveBadges');
    if (badgeContainer) {
      let badgesHtml = '';
      if (this.filters.filtroFinalizadas === 'finalizadas') {
        badgesHtml += `<span class="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded font-bold">Mostrando Solo Finalizadas</span>`;
      } else if (this.filters.filtroFinalizadas === 'suspendidas') {
        badgesHtml += `<span class="bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded font-bold">Mostrando Solo Suspendidas</span>`;
      } else if (this.filters.filtroFinalizadas === 'todas') {
        badgesHtml += `<span class="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded font-bold">Mostrando Todas</span>`;
      }
      if (this.filters.semaforo !== 'TODOS') {
        badgesHtml += `<span class="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded font-bold">Semáforo: ${this.filters.semaforo.toUpperCase()}</span>`;
      }
      badgeContainer.innerHTML = badgesHtml;
    }
  },

  renderMedicalAlert() {
    const banner = document.getElementById('medicalPriorityBanner');
    const badge = document.getElementById('medicalPendingCount');
    const badgeText = document.getElementById('medicalPendingCountText');
    if (!banner) return;

    const count = DataStore.getPendingMedicalPriorityCount();
    const u = DataStore.currentUser;
    if (count > 0 && u && !u.solo_lectura && u.rol !== 'visualizador' && (u.rol === 'direccion_medica' || u.rol === 'admin' || u.puede_priorizar_medica)) {
      banner.classList.remove('hidden');
      if (badge) badge.innerText = count;
      if (badgeText) badgeText.innerText = `${count} obras`;
    } else {
      banner.classList.add('hidden');
    }
  },

  renderCharts(kpis) {
    const ctxPipeline = document.getElementById('chartPipeline')?.getContext('2d');
    if (ctxPipeline) {
      if (this.charts.pipeline) this.charts.pipeline.destroy();
      
      const u = DataStore.currentUser;
      const isComprador = Boolean(u && (u.rol === 'licitaciones' || u.dependencia === 'Compras & Licitaciones'));

      // Personalización de encabezado según perfil
      const titleEl = document.getElementById('pipelineChartTitle');
      const subEl = document.getElementById('pipelineChartSubtitle');
      const badgeEl = document.getElementById('pipelineChartBadge');
      if (isComprador) {
        if (titleEl) titleEl.innerText = 'Tablero de Compras y Licitaciones';
        if (subEl) subEl.innerText = 'Obras en proyecto (previsión), para licitar, adjudicadas en curso y finalizadas';
        if (badgeEl) {
          badgeEl.innerText = 'Gestión Compras';
          badgeEl.className = 'text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md';
        }
      } else {
        if (titleEl) titleEl.innerText = 'Embudo de Avance de Obras';
        if (subEl) subEl.innerText = 'Distribución y valorización por etapa';
        if (badgeEl) {
          badgeEl.innerText = 'Total Etapas';
          badgeEl.className = 'text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md';
        }
      }

      let labels;
      let baseColors;

      if (isComprador) {
        labels = ['Proyecto', 'En licitación', 'Obras en Curso', 'Obras Finalizadas'];
        if (kpis.estadosCount && kpis.estadosCount['Suspendida'] > 0) {
          labels.push('Suspendida');
        }
        baseColors = labels.map(lbl => {
          if (lbl === 'Proyecto') return '#3b82f6'; // Azul proyecto (previsión de compras)
          if (lbl === 'En licitación') return '#f59e0b'; // Ámbar compulsa
          if (lbl === 'Obras en Curso') return '#2563eb'; // Azul ejecución
          if (lbl === 'Obras Finalizadas') return '#10b981'; // Verde finalizadas
          return '#f43f5e'; // Suspendida
        });
      } else {
        labels = [
          'Estudio de Factibilidad', 
          'Proyecto', 
          'En licitación', 
          'Obras en Curso', 
          'Obras Finalizadas', 
          'Suspendida'
        ];
        baseColors = [
          '#94a3b8', '#3b82f6', '#f59e0b', 
          '#2563eb', '#10b981', '#f43f5e'
        ];
      }

      const dataValues = labels.map(lbl => kpis.estadosCount[lbl] || 0);
      const dataUsd = labels.map(lbl => (kpis.estadosUsd && kpis.estadosUsd[lbl]) ? kpis.estadosUsd[lbl] : 0);

      // Colores de las barras con borde destacado si una barra está seleccionada
      const bgColors = labels.map((lbl, idx) => {
        if (!this.pipelineSelectedStage) return baseColors[idx];
        return lbl === this.pipelineSelectedStage ? baseColors[idx] : baseColors[idx] + '44';
      });

      const borderColors = labels.map((lbl) => {
        return lbl === this.pipelineSelectedStage ? '#0f172a' : 'transparent';
      });

      const borderWidths = labels.map((lbl) => {
        return lbl === this.pipelineSelectedStage ? 3 : 0;
      });

      this.charts.pipeline = new Chart(ctxPipeline, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Cantidad de Obras',
            data: dataValues,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: borderWidths,
            borderRadius: 6
          }]
        },
        plugins: [{
          id: 'topBarLabels',
          afterDatasetsDraw(chart) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data) return;
            meta.data.forEach((bar, index) => {
              const val = dataUsd[index] || 0;
              const text = DataStore.formatMillionsUSD(val);
              ctx.save();
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.font = 'bold 10px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillStyle = '#0f172a';
              ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
              ctx.shadowBlur = 3;
              ctx.fillText(text, bar.x, bar.y - 4);
              ctx.restore();
            });
          }
        }],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 22
            }
          },
          plugins: { 
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(ctx) {
                  const idx = ctx.dataIndex;
                  const count = ctx.raw || 0;
                  const usdVal = dataUsd[idx] || 0;
                  return [
                    ` Cantidad: ${count} obra(s)`,
                    ` Inversión: ${DataStore.formatMillionsUSD(usdVal)} (${DataStore.formatUSD(usdVal)})`
                  ];
                },
                footer: function() {
                  return '👉 Haz clic para ver las obras de esta etapa abajo';
                }
              }
            }
          },
          scales: {
            y: { 
              beginAtZero: true, 
              grace: '25%',
              grid: { color: '#f1f5f9' },
              ticks: { precision: 0 }
            },
            x: { 
              grid: { display: false }, 
              ticks: { 
                font: { size: 10, weight: 'bold' },
                callback: function(val, idx) {
                  const label = labels[idx];
                  if (label === 'Estudio de Factibilidad') return 'Factibilidad';
                  if (label === 'En licitación') return 'En Licitación';
                  if (label === 'Obras en Curso') return 'En Curso';
                  if (label === 'Obras Finalizadas') return 'Finalizadas';
                  return label;
                }
              } 
            }
          },
          // INTERACCIÓN: CLIC EN LA BARRA PARA FILTRAR
          onClick: (evt, elements) => {
            if (elements && elements.length > 0) {
              const elementIndex = elements[0].index;
              const selectedStage = labels[elementIndex];
              App.filterByPipelineStage(selectedStage);
            }
          },
          onHover: (event, chartElement) => {
            if (event.native && event.native.target) {
              event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            }
          }
        }
      });
    }

    // Chart Sedes
    const ctxSedes = document.getElementById('chartSedes')?.getContext('2d');
    if (ctxSedes) {
      if (this.charts.sedes) this.charts.sedes.destroy();
      const labels = ['Central', 'San Justo', 'Periféricos'];
      const dataUsd = labels.map(s => kpis.sedesCount[s]?.usd || 0);
      const totalSedesUsd = dataUsd.reduce((a, b) => a + b, 0);

      this.charts.sedes = new Chart(ctxSedes, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: dataUsd,
            backgroundColor: ['#2563eb', '#10b981', '#f59e0b'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        plugins: [
          {
            id: 'doughnutSliceLabels',
            afterDatasetsDraw(chart) {
              const { ctx } = chart;
              const meta = chart.getDatasetMeta(0);
              if (!meta || !meta.data) return;
              meta.data.forEach((arc, index) => {
                const val = dataUsd[index] || 0;
                if (val <= 0) return;
                const center = (typeof arc.getCenterPoint === 'function') ? arc.getCenterPoint() : null;
                if (!center) return;
                const text = DataStore.formatMillionsUSD(val);
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                ctx.shadowBlur = 3;
                ctx.fillText(text, center.x, center.y);
                ctx.restore();
              });
            }
          },
          {
            id: 'centerTextDoughnut',
            beforeDraw(chart) {
              const { ctx, width, height } = chart;
              const meta = chart.getDatasetMeta(0);
              const centerX = (meta && meta.data && meta.data[0]) ? meta.data[0].x : width / 2;
              const centerY = (meta && meta.data && meta.data[0]) ? meta.data[0].y : height / 2;
              
              ctx.save();
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              ctx.font = 'bold 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillStyle = '#0f172a';
              ctx.fillText(DataStore.formatMillionsUSD(totalSedesUsd), centerX, centerY - 7);
              
              ctx.font = 'bold 9px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillStyle = '#64748b';
              ctx.fillText('TOTAL INVERSIÓN', centerX, centerY + 10);
              ctx.restore();
            }
          }
        ],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 11, weight: 'bold' },
                generateLabels: function(chart) {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const val = data.datasets[0].data[i] || 0;
                      const fill = data.datasets[0].backgroundColor[i];
                      return {
                        text: `${label}: ${DataStore.formatMillionsUSD(val)}`,
                        fillStyle: fill,
                        strokeStyle: fill,
                        lineWidth: 1,
                        hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i]?.hidden,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(ctx) {
                  const val = ctx.raw || 0;
                  const sName = labels[ctx.dataIndex];
                  const c = kpis.sedesCount[sName]?.count || 0;
                  return [
                    ` ${sName}: ${DataStore.formatMillionsUSD(val)} (${DataStore.formatUSD(val)})`,
                    ` Obras asignadas: ${c}`
                  ];
                }
              }
            }
          }
        }
      });
    }
  },

  // ================= LISTA DINÁMICA DE OBRAS EN EL DASHBOARD =================
  renderDashboardStageList() {
    const listContainer = document.getElementById('criticalListContainer');
    const titleContainer = document.getElementById('dashboardStageListTitle');
    const subtitleContainer = document.getElementById('dashboardStageListSubtitle');
    const btnClearStage = document.getElementById('btnDeselectPipelineStage');
    if (!listContainer) return;

    let itemsToDisplay = [];
    let isFilteredByStage = !!this.pipelineSelectedStage;

    if (isFilteredByStage) {
      // Filtrar todas las obras de la etapa seleccionada respetando estrictamente el aislamiento departamental y los filtros activos
      itemsToDisplay = DataStore.getFilteredItems(this.filters).filter(item => item.estado === this.pipelineSelectedStage);

      const totalStageUsd = itemsToDisplay.reduce((acc, x) => acc + (x.monto_total_usd || x.monto_obra_usd || 0), 0);

      if (titleContainer) {
        titleContainer.innerHTML = `
          <div class="flex items-center space-x-2">
            <span class="bg-blue-600 text-white p-1 rounded"><i data-lucide="filter" class="w-3.5 h-3.5"></i></span>
            <span>Obras en Etapa: <span class="text-blue-700 underline">${this.pipelineSelectedStage}</span></span>
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">${itemsToDisplay.length} obras</span>
          </div>
        `;
      }
      if (subtitleContainer) {
        if (this.pipelineSelectedStage === 'Estudio de Factibilidad') {
          const sinPartida = itemsToDisplay.filter(x => !DataStore.hasValidPartida(x) || !parseFloat(x.monto_partida_usd));
          const conPartida = itemsToDisplay.filter(x => DataStore.hasValidPartida(x) && parseFloat(x.monto_partida_usd) > 0);
          const sinPartidaUsd = sinPartida.reduce((acc, x) => acc + (parseFloat(x.monto_total_usd) || parseFloat(x.monto_obra_usd) || 0), 0);
          const conPartidaUsd = conPartida.reduce((acc, x) => acc + (parseFloat(x.monto_total_usd) || parseFloat(x.monto_obra_usd) || 0), 0);
          subtitleContainer.innerHTML = `<span>Total estimado en estudio: <strong>${DataStore.formatUSD(totalStageUsd)}</strong></span> <span class="mx-1.5 text-slate-300">•</span> <span class="text-amber-700 font-semibold">${sinPartida.length} sin partida asignada (${DataStore.formatUSD(sinPartidaUsd)})</span> <span class="mx-1.5 text-slate-300">•</span> <span class="text-emerald-700 font-semibold">${conPartida.length} con partida asignada (${DataStore.formatUSD(conPartidaUsd)})</span>`;
        } else {
          subtitleContainer.innerText = `Total comprometido en esta etapa: ${DataStore.formatUSD(totalStageUsd)}`;
        }
      }
      if (btnClearStage) btnClearStage.classList.remove('hidden');

    } else {
      // Vista predeterminada: Obras críticas (vencidas o por vencer de mayor monto)
      itemsToDisplay = DataStore.getFilteredItems(this.filters)
        .filter(x => x.estado !== 'Obras Finalizadas' && x.estado !== 'Suspendida')
        .sort((a, b) => (b.monto_total_usd || b.monto_obra_usd || 0) - (a.item?.monto_total_usd || a.monto_obra_usd || 0))
        .slice(0, 8);

      if (titleContainer) {
        titleContainer.innerHTML = `
          <div class="flex items-center space-x-2">
            <i data-lucide="alert-circle" class="w-4 h-4 text-red-500"></i>
            <span>Obras con Desvío de Plazo o Atención Prioritaria</span>
          </div>
        `;
      }
      if (subtitleContainer) {
        subtitleContainer.innerHTML = `💡 <em>Haz clic en cualquier barra del embudo superior para explorar las obras de esa fase específica</em>`;
      }
      if (btnClearStage) btnClearStage.classList.add('hidden');
    }

    if (itemsToDisplay.length === 0) {
      listContainer.innerHTML = `<div class="text-center py-8 text-slate-400 text-sm">No hay proyectos para mostrar en esta etapa con los filtros actuales.</div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '<div class="space-y-3 mt-2.5">';
    itemsToDisplay.forEach(item => {
      const sem = DataStore.calculateSemaforo(item);
      const pond = DataStore.getPonderacionGlobal(item);
      const monto = DataStore.formatUSD(item.monto_total_usd || item.monto_obra_usd || 0);
      const nextStage = DataStore.getNextStage(item.estado);
      const u = DataStore.currentUser;
      const isAdmin = DataStore.isAdmin();
      const isComprador = Boolean(u && (u.rol === 'licitaciones' || u.dependencia === 'Compras & Licitaciones'));
      const canAdvanceThis = DataStore.canUserAdvanceItem(item);
      const canAvanzar = canAdvanceThis && u && !u.solo_lectura && u.rol !== 'visualizador';
      const isCorta = DataStore.isPartidaCorta(item);
      const deficit = isCorta ? DataStore.getPartidaDeficit(item) : 0;
      const isAssigned = DataStore.isObraAssigned(item);

      // Determinar clase de tarjeta para recuadro grueso bien diferenciado
      let cardStateClass = '';
      if (isCorta) {
        cardStateClass = 'card-partida-corta';
      } else if (!isAssigned && isAdmin) {
        cardStateClass = 'card-sin-asignar';
      } else if (sem.status === 'vencido') {
        cardStateClass = 'card-vencida';
      } else if (sem.status === 'por_vencer') {
        cardStateClass = 'card-por-vencer';
      }

      html += `
        <div class="card-obra-prioritaria ${cardStateClass} flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer" 
             onclick="App.openObraModal('${item.id}')">
          <div class="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1">
            <span class="px-2.5 py-1 text-xs font-semibold rounded-md shrink-0 ${sem.class}">
              ${sem.label}
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center flex-wrap gap-1.5">
                <span class="font-bold text-slate-900 text-sm hover:text-blue-600 transition">${item.nombre}</span>
                <span class="text-xs text-slate-400 font-mono">(${item.id})</span>
                <span class="px-1.5 py-0.2 text-[10px] rounded border ${pond.colorClass}">
                  ${pond.nivelLabel} (${pond.valor}★)
                </span>
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">${(item.dependencia || DataStore.getObraDependencia(item)).replace('Departamento de ', '')}</span>
                ${!item.partida || item.partida === 'S/D' ? `<span class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">Sin Partida</span>` : ''}
                ${isCorta ? `<span class="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded font-bold border border-rose-300 inline-flex items-center space-x-1" title="Partida menor al costo requerido (-USD ${DataStore.formatUSD(deficit)})"><i data-lucide="alert-triangle" class="w-2.5 h-2.5 text-rose-600"></i><span>Partida Corta</span></span>` : ''}
              </div>
              <div class="text-xs text-slate-500 flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                <span>Sede: <strong>${item.sede}</strong></span>
                <span>• Fase: <strong class="text-slate-700">${item.estado}</strong></span>
                <span>• Responsable: </span>
                ${isAssigned ? `
                  <span class="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                    <i data-lucide="user-check" class="w-3 h-3 text-emerald-600"></i>
                    <span>${item.responsable}</span>
                  </span>
                ` : `
                  <span class="text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                    <i data-lucide="alert-circle" class="w-3 h-3 text-amber-600"></i>
                    <span>Sin Asignar</span>
                  </span>
                  ${item.creado_por ? `
                    <span class="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center space-x-1" title="Presentada por ${item.creado_por}">
                      <i data-lucide="user" class="w-3 h-3 text-slate-500"></i>
                      <span>Creada por: <strong>${item.creado_por}</strong></span>
                    </span>
                  ` : ''}
                `}
                ${(!isAdmin && !canAdvanceThis) ? `
                  <span class="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1" title="Solo lectura departamental"><i data-lucide="eye" class="w-2.5 h-2.5 text-slate-400"></i><span>Consulta</span></span>
                ` : ''}
                ${item.sector_solicitante ? `<span>• Sector: <strong>${item.sector_solicitante}</strong></span>` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between md:justify-end space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div class="text-left md:text-right mr-1">
              <div class="text-sm font-extrabold text-slate-900 font-mono">${monto}</div>
              <div class="text-xs text-slate-400">${(item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') ? '<span class="text-slate-400 italic">Sin plazo (En análisis)</span>' : (item.fecha_fin_etapa ? 'Límite: ' + item.fecha_fin_etapa : (sem.status === 'sin_plazo' ? '<span class="text-amber-700 font-bold">⚠️ Plazo pendiente</span>' : 'Sin fecha'))}</div>
            </div>
            <div class="flex items-center space-x-2">
              ${(isAdmin || canAdvanceThis) ? `
                <button onclick="event.stopPropagation(); App.openObraModal('${item.id}', true)" 
                        class="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-2xs" 
                        title="${isAdmin ? 'Editar Proyecto (Solo Administrador)' : 'Editar Fechas y Observaciones'}">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  <span>Editar</span>
                </button>
              ` : ''}
              ${nextStage && canAvanzar ? `
                <button onclick="event.stopPropagation(); App.openTransitionModal('${item.id}')" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs" 
                        title="Finalizar esta etapa y certificar avance a ${nextStage}">
                  <span>Avanzar</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
              ` : (nextStage && !isAdmin ? (isComprador && item.estado === 'Proyecto' ? `<span class="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-bold" title="Vista preliminar de compras - Solo lectura">👁️ Solo Consulta</span>` : `<span class="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]" title="Solo el responsable asignado puede certificar esta obra">🔒 ${item.responsable || 'Sin Asignar'}</span>`) : '')}
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    listContainer.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  renderKanban() {
    const kanbanContainer = document.getElementById('kanbanContainer');
    if (!kanbanContainer) return;

    const u = DataStore.currentUser;
    const isComprador = Boolean(u && (u.rol === 'licitaciones' || u.dependencia === 'Compras & Licitaciones'));

    let stages = isComprador
      ? ['Proyecto', 'En licitación', 'Obras en Curso', 'Obras Finalizadas', 'Suspendida']
      : [
          'Estudio de Factibilidad',
          'Proyecto',
          'En licitación',
          'Obras en Curso',
          'Obras Finalizadas',
          'Suspendida'
        ];

    if (this.filters.filtroFinalizadas === 'activas') {
      stages = stages.filter(s => s !== 'Obras Finalizadas');
    } else if (this.filters.filtroFinalizadas === 'finalizadas') {
      stages = ['Obras Finalizadas'];
    } else if (this.filters.filtroFinalizadas === 'suspendidas') {
      stages = ['Suspendida'];
    }

    const items = DataStore.getFilteredItems(this.filters);

    let html = '<div class="flex space-x-4 overflow-x-auto pb-4 items-start">';
    stages.forEach(stage => {
      const stageItems = items.filter(x => x.estado === stage);
      const stageUsd = stageItems.reduce((acc, x) => acc + (x.monto_total_usd || x.monto_obra_usd || 0), 0);
      const nextStage = DataStore.getNextStage(stage);
      const isProyectoComprador = isComprador && stage === 'Proyecto';

      html += `
        <div class="kanban-column flex flex-col p-3 shadow-xs border ${isProyectoComprador ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200'}">
          <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
            <div class="flex items-center space-x-2 flex-wrap gap-1">
              <span class="font-bold text-xs text-slate-800 uppercase tracking-wide">${stage}</span>
              ${isProyectoComprador ? '<span class="text-[10px] text-indigo-700 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded font-bold" title="Obras técnicas próximas a licitar (Modo Solo Lectura)">👁️ Próximas (Solo Lectura)</span>' : ''}
              <span class="bg-white text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold border border-slate-200">${stageItems.length}</span>
            </div>
            <span class="text-xs text-slate-500 font-bold">${DataStore.formatUSD(stageUsd)}</span>
          </div>

          <div class="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
      `;

      if (stageItems.length === 0) {
        html += `<div class="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">Sin proyectos</div>`;
      } else {
        stageItems.forEach(item => {
          const sem = DataStore.calculateSemaforo(item);
          const pond = DataStore.getPonderacionGlobal(item);
          const monto = DataStore.formatUSD(item.monto_total_usd || item.monto_obra_usd || 0);
          const u = DataStore.currentUser;
          const isAdmin = DataStore.isAdmin();
          const canAdvanceThis = DataStore.canUserAdvanceItem(item);
          const canAvanzar = canAdvanceThis && u && !u.solo_lectura && u.rol !== 'visualizador';
          const isCorta = DataStore.isPartidaCorta(item);
          const deficit = isCorta ? DataStore.getPartidaDeficit(item) : 0;
          const isAssigned = DataStore.isObraAssigned(item);

          html += `
            <div class="kanban-card bg-white p-3.5 rounded-xl border ${
              isCorta ? 'border-rose-400 border-l-4 bg-rose-50/20' : 
              (!isAssigned && isAdmin ? 'border-amber-300 border-l-4 bg-amber-50/30' : 'border-slate-200')
            } shadow-2xs cursor-pointer" onclick="App.openObraModal('${item.id}')">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-mono font-bold text-slate-400">${item.id}</span>
                <span class="px-2 py-0.5 text-[11px] font-semibold rounded ${sem.class}">${sem.label}</span>
              </div>

              <div class="mb-2 flex items-center space-x-1.5 flex-wrap gap-1">
                <span class="px-1.5 py-0.2 text-[10px] rounded border ${pond.colorClass}">
                  ${pond.nivelLabel} (${pond.valor}★)
                </span>
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">${(item.dependencia || DataStore.getObraDependencia(item)).replace('Departamento de ', '')}</span>
                ${!item.partida || item.partida === 'S/D' ? `<span class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">Sin Partida</span>` : ''}
                ${isCorta ? `<span class="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded font-bold border border-rose-300 inline-flex items-center space-x-1" title="Partida asignada menor al costo requerido (-USD ${DataStore.formatUSD(deficit)})"><i data-lucide="alert-triangle" class="w-2.5 h-2.5 text-rose-600"></i><span>Partida Corta</span></span>` : ''}
              </div>

              <h4 class="font-bold text-slate-800 text-sm leading-tight mb-2">${item.nombre}</h4>
              
              <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">📍 ${item.sede}</span>
                <span class="font-bold text-slate-800">${monto}</span>
              </div>

              ${(item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') ? `
                <div class="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-500 mb-2.5 flex items-center justify-between">
                  <span>Plazo:</span>
                  <span class="text-slate-500 font-medium italic">Sin plazo (En análisis)</span>
                </div>
              ` : `
                <div class="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-500 mb-2.5 flex items-center justify-between">
                  <span>Límite etapa:</span>
                  <span class="font-semibold ${sem.status === 'vencido' ? 'text-red-600 font-bold' : (sem.status === 'sin_plazo' ? 'text-amber-700 font-bold' : 'text-slate-700')}">
                    ${item.fecha_fin_etapa || (sem.status === 'sin_plazo' ? '⚠️ Por definir' : 'Sin fecha')}
                  </span>
                </div>
              `}

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div class="truncate max-w-[130px]">
                  ${isAssigned ? `
                    <span class="text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold truncate inline-flex items-center space-x-1" title="Asignada a: ${item.responsable}">
                      <i data-lucide="user-check" class="w-2.5 h-2.5 text-emerald-600 shrink-0"></i>
                      <span class="truncate">${item.responsable}</span>
                    </span>
                  ` : `
                    <span class="text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center space-x-1" title="Pendiente de asignación${item.creado_por ? ' (Creada por: ' + item.creado_por + ')' : ''}">
                      <i data-lucide="alert-circle" class="w-2.5 h-2.5 text-amber-600 shrink-0"></i>
                      <span>Sin Asignar</span>
                    </span>
                    ${item.creado_por ? `
                      <span class="text-slate-600 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-[9px] font-medium inline-flex items-center space-x-1 truncate max-w-[110px] ml-1" title="Creada por: ${item.creado_por}">
                        <i data-lucide="user" class="w-2 h-2 text-slate-400 shrink-0"></i>
                        <span class="truncate">${item.creado_por}</span>
                      </span>
                    ` : ''}
                  `}
                  ${(!isAdmin && !canAdvanceThis) ? `
                    <span class="text-slate-400 text-[10px] ml-1 font-medium" title="Consulta departamental">👁️</span>
                  ` : ''}
                </div>
                
                <div class="flex items-center space-x-1.5">
                  ${(isAdmin || canAdvanceThis) ? `
                    <button onclick="event.stopPropagation(); App.openObraModal('${item.id}', true)" 
                            class="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 px-2 py-1 rounded-md font-bold text-[11px] inline-flex items-center space-x-1 transition shadow-2xs cursor-pointer" 
                            title="${isAdmin ? 'Editar Proyecto (Solo Administrador)' : 'Editar Fechas y Observaciones'}">
                      <i data-lucide="edit-3" class="w-3 h-3"></i>
                      <span>Editar</span>
                    </button>
                  ` : ''}
                  ${nextStage && canAvanzar ? `
                    <button onclick="event.stopPropagation(); App.openTransitionModal('${item.id}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md font-bold text-xs flex items-center space-x-1 transition shadow-xs cursor-pointer"
                            title="Finalizar esta etapa y certificar avance a ${nextStage}">
                      <span>Avanzar</span>
                      <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : (nextStage && !isAdmin ? (isComprador && item.estado === 'Proyecto' ? `<span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold" title="Vista preliminar de compras - Solo lectura">👁️ Solo Consulta</span>` : `<span class="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]" title="Solo el responsable asignado puede certificar esta obra">🔒</span>`) : '')}
                </div>
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });
    html += '</div>';

    kanbanContainer.innerHTML = html;
  },

  renderTable() {
    const tableBody = document.getElementById('tableObrasBody');
    const tableCount = document.getElementById('tableFilteredCount');
    if (!tableBody) return;

    const items = DataStore.getFilteredItems(this.filters);
    if (tableCount) tableCount.innerText = `${items.length} proyectos encontrados`;

    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-10 text-slate-400 text-sm">No se encontraron obras con los filtros aplicados.</td></tr>`;
      return;
    }

    let html = '';
    items.forEach(item => {
      const sem = DataStore.calculateSemaforo(item);
      const pond = DataStore.getPonderacionGlobal(item);
      const monto = DataStore.formatUSD(item.monto_total_usd || item.monto_obra_usd || 0);
      const nextStage = DataStore.getNextStage(item.estado);
      const u = DataStore.currentUser;
      const isAdmin = DataStore.isAdmin();
      const isComprador = Boolean(u && (u.rol === 'licitaciones' || u.dependencia === 'Compras & Licitaciones'));
      const canAdvanceThis = DataStore.canUserAdvanceItem(item);
      const canAvanzar = canAdvanceThis && u && !u.solo_lectura && u.rol !== 'visualizador';
      const isCorta = DataStore.isPartidaCorta(item);
      const deficit = isCorta ? DataStore.getPartidaDeficit(item) : 0;
      const isAssigned = DataStore.isObraAssigned(item);

      html += `
        <tr class="hover:bg-slate-50/80 transition cursor-pointer border-b ${
          isCorta ? 'border-rose-300 bg-rose-50/60 text-rose-950 font-medium' :
          (!isAssigned && isAdmin ? 'border-amber-300 bg-amber-50/30' : 'border-slate-100')
        }" onclick="App.openObraModal('${item.id}')">
          <td class="py-3 px-4 text-xs font-mono font-bold text-slate-500">${item.id}</td>
          <td class="py-3 px-4 text-xs font-semibold">
            <span class="px-2 py-0.5 rounded ${
              item.sede === 'Central' ? 'bg-blue-50 text-blue-700' :
              item.sede === 'San Justo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }">${item.sede}</span>
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-slate-900 text-sm flex items-center space-x-1.5 flex-wrap">
              <span>${item.nombre}</span>
              <span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">${item.dependencia || DataStore.getObraDependencia(item)}</span>
              ${isCorta ? `<span class="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-black border border-rose-300 inline-flex items-center space-x-1" title="Partida asignada (USD ${DataStore.formatUSD(item.monto_partida_usd)}) menor al costo requerido (USD ${DataStore.formatUSD(item.monto_total_usd)}). Déficit: -USD ${DataStore.formatUSD(deficit)}"><i data-lucide="alert-triangle" class="w-2.5 h-2.5 text-rose-600"></i><span>Partida Corta (-USD ${DataStore.formatUSD(deficit)})</span></span>` : ''}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">${item.categoria || 'Obra'} • Partida: <span class="font-mono font-bold ${isCorta ? 'text-rose-700 font-black' : 'text-slate-600'}">${item.partida || 'PENDIENTE'}</span> ${item.monto_partida_usd ? `(Asig: USD ${DataStore.formatUSD(item.monto_partida_usd)})` : ''}</div>
          </td>
          <td class="py-3 px-4 text-xs">
            <span class="font-semibold text-slate-700">${item.estado}</span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 text-[11px] rounded border ${pond.colorClass} block text-center font-bold">
              ${pond.valor}★ ${pond.esCritico ? 'CRÍTICO' : ''}
            </span>
            ${item.prioridad_medica_ponderada_default ? `
              <span class="text-[9px] text-amber-800 bg-amber-50 border border-amber-300 px-1 py-0.2 rounded font-bold block text-center mt-1" title="Criticidad médica ponderada por default por no contar con criticidad de Dirección">
                Default (Médica = Técnica)
              </span>
            ` : ''}
          </td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 text-xs font-semibold rounded-md ${sem.class}">${sem.label}</span>
          </td>
          <td class="py-3 px-4 text-sm font-black text-slate-900 text-right">${monto}</td>
          <td class="py-3 px-4 text-xs">
            ${isAssigned ? `
              <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold" title="Asignada a ${item.responsable}">
                <i data-lucide="user-check" class="w-3 h-3 text-emerald-600"></i>
                <span class="truncate max-w-[120px]">${item.responsable}</span>
              </span>
            ` : `
              <div>
                <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold" title="Obra sin responsable asignado">
                  <i data-lucide="alert-circle" class="w-3 h-3 text-amber-600"></i>
                  <span>Sin Asignar</span>
                </span>
                ${item.creado_por ? `
                  <div class="text-[10px] text-slate-500 font-medium mt-1 flex items-center space-x-1" title="Presentada por ${item.creado_por}">
                    <i data-lucide="user" class="w-2.5 h-2.5 text-slate-400 shrink-0"></i>
                    <span class="truncate max-w-[120px]">Por: <strong>${item.creado_por}</strong></span>
                  </div>
                ` : ''}
              </div>
            `}
            ${(!isAdmin && !canAdvanceThis) ? `
              <span class="text-slate-400 text-[10px] ml-1 font-medium" title="Consulta departamental">👁️</span>
            ` : ''}
          </td>
          <td class="py-3 px-4 text-xs ${(item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') ? 'text-slate-400 italic' : (sem.status === 'sin_plazo' ? 'text-amber-700 font-bold' : 'text-slate-500')}">${(item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto') ? 'Sin plazo (En análisis)' : (item.fecha_fin_etapa || (sem.status === 'sin_plazo' ? '⚠️ Por definir' : '-'))}</td>
          <td class="py-3 px-4 text-center" onclick="event.stopPropagation()">
            <div class="flex items-center justify-center space-x-1.5">
              ${(isAdmin || canAdvanceThis) ? `
                <button onclick="event.stopPropagation(); App.openObraModal('${item.id}', true)" 
                        class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-bold inline-flex items-center space-x-1 transition shadow-2xs cursor-pointer" 
                        title="${isAdmin ? 'Editar Proyecto (Solo Administrador)' : 'Editar Fechas y Observaciones'}">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  <span>Editar</span>
                </button>
              ` : ''}
              ${nextStage && canAvanzar ? `
                <button onclick="event.stopPropagation(); App.openTransitionModal('${item.id}')" 
                        class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center space-x-1 transition shadow-xs cursor-pointer" 
                        title="Finalizar etapa y certificar avance a ${nextStage}">
                  <span>Avanzar</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              ` : (nextStage && !isAdmin ? (isComprador && item.estado === 'Proyecto' ? `<span class="text-indigo-700 bg-indigo-50 border border-indigo-200 text-[10px] font-bold px-1.5 py-0.5 rounded" title="Vista preliminar de compras - Solo lectura">👁️ Solo Consulta</span>` : `<span class="text-slate-400 text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 rounded" title="Solo puede avanzar el responsable asignado: ${item.responsable || 'Sin Asignar'}">🔒 ${item.responsable || 'Sin Asignar'}</span>`) : (!isAdmin ? `<span class="text-slate-300 text-xs font-mono">-</span>` : ''))}
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  },

  renderGantt() {
    const ganttContainer = document.getElementById('ganttContainer');
    if (!ganttContainer) return;

    const items = DataStore.getFilteredItems(this.filters)
      .filter(x => (x.fecha_inicio_etapa || x.fecha_fin_etapa || x.fecha_fin_obra) && x.estado !== 'Estudio de Factibilidad' && x.estado !== 'Ante Proyecto')
      .slice(0, 40);

    const months = [
      'Ene 26', 'Feb 26', 'Mar 26', 'Abr 26', 'May 26', 'Jun 26',
      'Jul 26', 'Ago 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dic 26',
      'Ene 27', 'Feb 27', 'Mar 27', 'Abr 27', 'May 27', 'Jun 27'
    ];

    let html = `
      <div class="overflow-x-auto">
        <div class="min-w-[1200px]">
          <div class="flex border-b border-slate-200 bg-slate-100 font-semibold text-xs text-slate-600 py-2">
            <div class="w-[320px] px-4">Proyecto / Obra</div>
            <div class="w-[120px] px-2 text-center">Fase Actual</div>
            <div class="flex-1 flex">
              ${months.map(m => `<div class="gantt-month-cell text-center py-1">${m}</div>`).join('')}
            </div>
          </div>
          <div class="divide-y divide-slate-100 bg-white">
    `;

    items.forEach((item, idx) => {
      const sem = DataStore.calculateSemaforo(item);
      const startMonth = idx % 8;
      const duration = Math.max(2, (idx * 3) % 9);

      let barColor = 'bg-blue-500';
      if (sem.status === 'vencido') barColor = 'bg-red-500';
      else if (sem.status === 'por_vencer') barColor = 'bg-amber-500';
      else if (sem.status === 'finalizado') barColor = 'bg-emerald-500';

      html += `
        <div class="flex items-center py-2.5 hover:bg-slate-50 cursor-pointer" onclick="App.openObraModal('${item.id}')">
          <div class="w-[320px] px-4">
            <div class="font-bold text-slate-800 text-xs truncate" title="${item.nombre}">${item.nombre}</div>
            <div class="text-[11px] text-slate-400 font-mono">${item.id} • ${item.sede} • ${DataStore.formatUSD(item.monto_obra_usd || 0)}</div>
          </div>
          <div class="w-[120px] px-2 text-center">
            <span class="px-2 py-0.5 text-[10px] font-semibold rounded ${sem.class}">${sem.label}</span>
          </div>
          <div class="flex-1 flex items-center relative h-6">
            <div class="absolute h-4 rounded ${barColor} opacity-90 shadow-2xs text-[10px] text-white flex items-center px-2 truncate"
                 style="left: ${startMonth * 55 + 5}px; width: ${duration * 55 - 10}px;">
              ${item.estado}
            </div>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    ganttContainer.innerHTML = html;
  },

  setCashflowTipo(tipo) {
    this.cashflowFilterTipo = tipo;
    this.renderCashflow();
  },

  setCashflowPartidaFilter(filtro) {
    this.cashflowFilterPartida = filtro;
    this.renderCashflow();
  },

  handleCashflowSearch(query) {
    this.cashflowSearch = query;
    this.renderCashflow();
  },

  renderCashflow() {
    const cashflowContainer = document.getElementById('cashflowContainer');
    if (!cashflowContainer) return;

    // 1. Actualizar estilos activos de los botones de Segmentación de Tipo
    const btnTodo = document.getElementById('btnCfTipoTodo');
    const btnObras = document.getElementById('btnCfTipoObras');
    const btnInfra = document.getElementById('btnCfTipoInfra');

    if (btnTodo && btnObras && btnInfra) {
      const activeClass = 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold';
      const inactiveClass = 'text-slate-600 hover:text-blue-700 font-semibold';
      
      btnTodo.className = `px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${this.cashflowFilterTipo === 'TODOS' ? activeClass : inactiveClass}`;
      btnObras.className = `px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${this.cashflowFilterTipo === 'Obra Civil' ? activeClass : inactiveClass}`;
      btnInfra.className = `px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${this.cashflowFilterTipo === 'Infraestructura' ? activeClass : inactiveClass}`;
    }

    // 2. Actualizar estilos activos de los botones de Partida
    const btnPartTodas = document.getElementById('btnCfPartidaTodas');
    const btnPartCon = document.getElementById('btnCfPartidaCon');
    const btnPartSin = document.getElementById('btnCfPartidaSin');

    if (btnPartTodas && btnPartCon && btnPartSin) {
      const partActiveClass = 'bg-white shadow-xs font-bold text-slate-900 border border-slate-200';
      const partInactiveClass = 'text-slate-600 hover:text-slate-900 font-semibold';

      btnPartTodas.className = `px-2.5 py-1.5 rounded-lg transition cursor-pointer ${this.cashflowFilterPartida === 'todas' ? partActiveClass : partInactiveClass}`;
      btnPartCon.className = `px-2.5 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer ${this.cashflowFilterPartida === 'con_partida' ? 'bg-white shadow-xs font-bold text-emerald-700 border border-slate-200' : 'text-emerald-700 hover:text-emerald-900 font-semibold'}`;
      btnPartSin.className = `px-2.5 py-1.5 rounded-lg transition cursor-pointer ${this.cashflowFilterPartida === 'sin_partida' ? 'bg-white shadow-xs font-bold text-amber-800 border border-slate-200' : 'text-amber-700 hover:text-amber-900 font-semibold'}`;
    }

    // 3. Obtener métricas y datos calculados desde DataStore (SOLO Obras en Curso, Período 01/04 - 31/03)
    const summary = DataStore.getCashflowSummary(this.cashflowFilterTipo, this.cashflowFilterPartida, this.cashflowSearch);

    // 4. Renderizar Tarjetas de Resumen KPI
    const kpiContainer = document.getElementById('cashflowKpiCards');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <!-- KPI 1: TOTAL CARTERA EN CURSO -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50/70 p-4 rounded-xl border border-blue-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center space-x-1">
              <i data-lucide="activity" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Cartera Activa en Ejecución</span>
            </span>
            <span class="text-[10px] font-black bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
              ${summary.totalObras} obras en curso
            </span>
          </div>
          <div class="text-xl sm:text-2xl font-black text-blue-950 mt-1.5">
            ${DataStore.formatUSD(summary.totalCarteraUSD)}
          </div>
          <div class="text-[11px] text-blue-700 font-medium mt-1 flex items-center space-x-1">
            <i data-lucide="shield-check" class="w-3 h-3 text-blue-600"></i>
            <span>Exclusivo obras en curso (excluye factibilidad y suspendidas)</span>
          </div>
        </div>

        <!-- KPI 2: EJERCICIO CONTABLE ACTUAL (01/04 - 31/03) -->
        <div class="bg-gradient-to-br from-emerald-50 to-teal-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Ejercicio ${summary.accountingInfo.label} (01/04 - 31/03)</span>
            </span>
            <span class="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              Oficial HIBA
            </span>
          </div>
          <div class="text-xl sm:text-2xl font-black text-emerald-950 mt-1.5">
            ${DataStore.formatUSD(summary.totalEjercicioActualUSD)}
          </div>
          <div class="text-[10px] text-emerald-800 font-semibold mt-1 flex items-center justify-between pt-0.5 border-t border-emerald-200/60">
            <span>Pagado: <strong class="text-blue-800">${DataStore.formatUSD(summary.totalYaPagadoUSD)}</strong></span>
            <span>Proyectado: <strong class="text-teal-800">${DataStore.formatUSD(summary.totalProyectadoUSD)}</strong></span>
          </div>
        </div>

        <!-- KPI 3: ANTICIPOS DE ORDEN DE COMPRA (MES 1) -->
        <div class="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
              <i data-lucide="badge-percent" class="w-3.5 h-3.5 text-amber-600"></i>
              <span>Anticipos Órdenes de Compra</span>
            </span>
            <span class="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              Mes 1 Adjudicado
            </span>
          </div>
          <div class="text-xl sm:text-2xl font-black text-amber-950 mt-1.5">
            ${DataStore.formatUSD(summary.totalAnticiposUSD)}
          </div>
          <div class="text-[11px] text-amber-700 font-medium mt-1">
            Saldo de ${DataStore.formatUSD(summary.totalSaldoUSD)} prorrateado en cuotas mensuales
          </div>
        </div>

        <!-- KPI 4: COMPROMISOS PLURIANUALES (POST 31/03) -->
        <div class="bg-purple-50/60 p-4 rounded-xl border border-purple-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center space-x-1">
              <i data-lucide="fast-forward" class="w-3.5 h-3.5 text-purple-600"></i>
              <span>Arrastre Ejercicios Siguientes</span>
            </span>
            <span class="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full">
              Post 31/03
            </span>
          </div>
          <div class="text-xl sm:text-2xl font-black text-purple-950 mt-1.5">
            ${DataStore.formatUSD(summary.totalEjerciciosSiguientesUSD)}
          </div>
          <div class="text-[11px] text-purple-700 font-medium mt-1">
            Compromisos contractuales que superan el ejercicio fiscal
          </div>
        </div>
      `;
    }

    // 5. Renderizar Tabla de Cashflow
    if (summary.displayList.length === 0) {
      cashflowContainer.innerHTML = `
        <div class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <i data-lucide="folder-search" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
          <p class="text-sm font-bold text-slate-600">No se encontraron obras activas en curso para los filtros seleccionados</p>
          <p class="text-xs text-slate-400 mt-1">Recordatorio: El Cash Flow incluye exclusivamente obras en estado 'Obras en Curso'.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    // 5.1 Gráfico Mensual de Barras (12 Meses: Abr a Mar)
    const maxMesVal = Math.max(...Object.values(summary.mesesTotales), 1);
    let barGraphHtml = `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200">
          <div class="flex items-center space-x-2">
            <i data-lucide="bar-chart-3" class="w-4 h-4 text-blue-600"></i>
            <span class="text-xs font-bold text-slate-800">Distribución Mensual del Gasto • Ejercicio Contable ${summary.accountingInfo.label} (01/04 al 31/03)</span>
          </div>
          <div class="flex items-center space-x-3 text-[11px]">
            <span class="inline-flex items-center space-x-1 text-blue-800 font-semibold">
              <span class="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span>
              <span>Ya Pagado: <strong>${DataStore.formatUSD(summary.totalYaPagadoUSD)}</strong></span>
            </span>
            <span class="inline-flex items-center space-x-1 text-teal-800 font-semibold">
              <span class="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block"></span>
              <span>Proyectado: <strong>${DataStore.formatUSD(summary.totalProyectadoUSD)}</strong></span>
            </span>
          </div>
        </div>

        <div class="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2">
          ${summary.accountingInfo.meses.map(m => {
            const val = summary.mesesTotales[m.key] || 0;
            const pct = Math.min(100, Math.max(8, Math.round((val / maxMesVal) * 100)));
            const barBg = m.isPast ? 'bg-blue-600' : 'bg-teal-500';
            const badgeBg = m.isPast ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800';
            const statusLabel = m.isPast ? 'Pagado' : 'Proy.';

            return `
              <div class="flex flex-col items-center bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                <span class="text-[10px] font-bold text-slate-700 uppercase">${m.label}</span>
                <span class="text-[8px] font-mono text-slate-400">${m.year}</span>
                
                <div class="w-full bg-slate-100 rounded-sm h-14 flex items-end my-1 p-0.5">
                  <div class="w-full ${barBg} rounded-xs transition-all duration-300" style="height: ${pct}%" title="${m.label} ${m.year}: ${DataStore.formatUSD(val)}"></div>
                </div>

                <span class="text-[9px] font-bold font-mono text-slate-900 leading-none">${DataStore.formatUSD(val)}</span>
                <span class="text-[8px] font-semibold px-1 rounded mt-1 ${badgeBg}">${statusLabel}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    let html = barGraphHtml + `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th class="py-3 px-3">Sede</th>
              <th class="py-3 px-3">Módulo</th>
              <th class="py-3 px-3">Proyecto & Adjudicatario</th>
              <th class="py-3 px-3">Partida Presupuestaria</th>
              <th class="py-3 px-3 text-right">Monto Total USD</th>
              <th class="py-3 px-3 text-center">Anticipo OC</th>
              <th class="py-3 px-3 text-center">Plazo & Saldo</th>
              <th class="py-3 px-3 text-right">Ejercicio ${summary.accountingInfo.label}</th>
              <th class="py-3 px-3 text-right">Ej. Siguientes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
    `;

    summary.displayList.forEach(entry => {
      const x = entry.item;
      const cf = entry.cf;

      const isInfra = (x.tipo === 'Infraestructura');
      const tipoBadge = isInfra 
        ? `<span class="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-bold text-[10px]">⚡ Infraestructura</span>`
        : `<span class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[10px]">🏗️ Obra Civil</span>`;

      const hasPart = DataStore.hasValidPartida(x);
      const montoPartida = DataStore.getItemMontoPartida(x);

      const partidaBadge = hasPart
        ? `<div class="flex flex-col">
             <span class="inline-flex items-center space-x-1 font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] w-fit">
               <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
               <span>N° ${x.partida}</span>
             </span>
             <span class="text-[10px] text-emerald-700 font-bold mt-0.5">${DataStore.formatUSD(montoPartida)}</span>
           </div>`
        : `<span class="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium text-[10px]">
             Sin Partida
           </span>`;

      html += `
        <tr class="hover:bg-slate-50 cursor-pointer transition" onclick="App.openObraModal('${x.id}')">
          <td class="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">${x.sede}</td>
          <td class="py-2.5 px-3 whitespace-nowrap">${tipoBadge}</td>
          <td class="py-2.5 px-3">
            <div class="font-bold text-slate-800 text-xs">${x.nombre}</div>
            <div class="text-[10px] text-slate-500 font-mono">
              <span class="font-bold text-blue-700">${x.id}</span> • Proveedor: <strong class="text-slate-700">${x.proveedor || 'Sin adjudicar'}</strong>
            </div>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">${partidaBadge}</td>
          <td class="py-2.5 px-3 text-right font-black text-slate-900">${DataStore.formatUSD(cf.montoTotalUSD)}</td>
          <td class="py-2.5 px-3 text-center whitespace-nowrap">
            <span class="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px] block">
              ${cf.anticipoPct}% (${DataStore.formatUSD(cf.anticipoUSD)})
            </span>
            <span class="text-[9px] text-slate-400 mt-0.5 block">Mes 1</span>
          </td>
          <td class="py-2.5 px-3 text-center whitespace-nowrap">
            <span class="font-bold text-slate-700 text-[11px]">${cf.duracionMeses} meses</span>
            <span class="text-[10px] text-slate-500 block font-mono">${DataStore.formatUSD(cf.cuotaMensualSaldoUSD)}/mes</span>
          </td>
          <td class="py-2.5 px-3 text-right whitespace-nowrap">
            <div class="font-black text-slate-900 text-xs">${DataStore.formatUSD(cf.ejercicioActualUSD)}</div>
            <div class="text-[10px] space-x-1 mt-0.5">
              <span class="text-blue-700 font-semibold">Pag: ${DataStore.formatUSD(cf.ejercicioActualPagadoUSD)}</span>
              <span class="text-slate-300">|</span>
              <span class="text-teal-700 font-semibold">Proy: ${DataStore.formatUSD(cf.ejercicioActualProyectadoUSD)}</span>
            </div>
          </td>
          <td class="py-2.5 px-3 text-right font-bold text-purple-700 whitespace-nowrap">
            ${cf.ejerciciosSiguientesUSD > 0 ? DataStore.formatUSD(cf.ejerciciosSiguientesUSD) : '<span class="text-slate-300 font-normal">-</span>'}
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
          <tfoot>
            <tr class="bg-slate-200/90 font-bold text-slate-900 border-t-2 border-slate-300">
              <td colspan="3" class="py-3 px-3 text-xs uppercase tracking-wider font-extrabold">
                TOTALES MOSTRADOS (${summary.displayList.length} obras en curso)
              </td>
              <td class="py-3 px-3 text-xs font-black text-emerald-800">
                <span class="text-[10px] text-emerald-700 block font-normal uppercase">Asignado Partidas:</span>
                ${DataStore.formatUSD(summary.displayTotPartidas)}
              </td>
              <td class="py-3 px-3 text-right text-sm font-black text-slate-900">${DataStore.formatUSD(summary.displayTotGral)}</td>
              <td class="py-3 px-3 text-center font-bold text-amber-900 text-xs">
                ${DataStore.formatUSD(summary.totalAnticiposUSD)}
              </td>
              <td class="py-3 px-3 text-center font-bold text-slate-700 text-xs">
                Saldo: ${DataStore.formatUSD(summary.totalSaldoUSD)}
              </td>
              <td class="py-3 px-3 text-right font-black text-slate-900 text-xs">
                <div>${DataStore.formatUSD(summary.displayTotEjercicio)}</div>
                <div class="text-[9px] font-normal text-slate-600">Pag: ${DataStore.formatUSD(summary.displayTotYaPagado)} | Proy: ${DataStore.formatUSD(summary.displayTotProyectado)}</div>
              </td>
              <td class="py-3 px-3 text-right font-black text-purple-900 text-xs">${DataStore.formatUSD(summary.displayTotSiguientes)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    cashflowContainer.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  // ================= MODAL: NUEVA OBRA / ESTUDIO DE FACTIBILIDAD =================
  openNewObraModal() {
    const u = DataStore.currentUser;
    if (!u || u.solo_lectura || u.rol === 'visualizador' || !u.puede_crear) {
      alert("⛔ Acceso Denegado: Tu perfil es de solo lectura y no tiene autorización para registrar nuevas obras.");
      return;
    }

    const userSede = u.sede !== 'Todas' ? u.sede : 'Central';

    const form = document.getElementById('formNuevaFactibilidad');
    if (form) form.reset();

    const sedeSelect = document.getElementById('factSede');
    if (sedeSelect) {
      sedeSelect.value = userSede;
      sedeSelect.disabled = (u.sede !== 'Todas');
    }

    const respInput = document.getElementById('factResponsable');
    if (respInput) respInput.value = u.nombre;

    document.getElementById('modalNuevaFactibilidad').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  closeNewObraModal() {
    document.getElementById('modalNuevaFactibilidad').classList.add('hidden');
  },

  handleCreateFactibilidadSubmit(e) {
    e.preventDefault();

    const u = DataStore.currentUser;
    if (!u || u.solo_lectura || u.rol === 'visualizador' || !u.puede_crear) {
      alert("⛔ Acceso Denegado: Tu perfil es de solo lectura y no tiene autorización para registrar nuevas obras.");
      return;
    }

    const nombre = document.getElementById('factNombre').value.trim();
    const sede = document.getElementById('factSede').value;
    const sector = document.getElementById('factSector').value.trim();
    const motivo = document.getElementById('factMotivo').value.trim();
    const req = document.getElementById('factRequerimiento').value.trim();
    const monto = parseFloat(document.getElementById('factMonto').value) || 0;
    const responsable = document.getElementById('factResponsable').value.trim();
    const prioridad = document.getElementById('factPrioridad').value;

    if (!nombre) {
      alert("Por favor ingresa el título o nombre de la obra");
      return;
    }

    try {
      const newObra = DataStore.createFactibilidad({
        nombre,
        sede,
        sector_solicitante: sector,
        motivo,
        requerimiento_minimo: req,
        monto_estimado: monto,
        responsable,
        prioridad_tecnica: prioridad
      });

      this.closeNewObraModal();
      this.render();
      this.showToast(`¡Estudio de Factibilidad ${newObra.id} registrado con éxito! Enviado a Dirección.`);
    } catch (err) {
      alert(err.message);
    }
  },

  // ================= MODAL ASIGNAR PARTIDA =================
  openAsignarPartidaModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    const u = DataStore.currentUser;
    if (!u || u.solo_lectura || u.rol === 'visualizador' || !u.puede_asignar_partida) {
      alert("⛔ Acceso Denegado: Tu perfil no cuenta con el permiso específico para asignar Partidas Presupuestarias.");
      return;
    }

    document.getElementById('partidaItemId').value = item.id;
    document.getElementById('partidaItemName').innerText = `${item.id}: ${item.nombre}`;
    const partidaSedeEl = document.getElementById('partidaItemSede');
    if (partidaSedeEl) partidaSedeEl.innerText = `Sede: ${item.sede} • Módulo: ${item.tipo}`;
    
    document.getElementById('inputNumeroPartida').value = item.partida || '';
    const defMonto = item.monto_partida_usd || item.monto_total_usd || item.monto_obra_usd || (item.cashflow ? item.cashflow.monto_total : '') || '';
    document.getElementById('inputMontoPartida').value = (defMonto > 0) ? defMonto : '';

    // Mostrar prioridad técnica de referencia y pre-cargar prioridad médica
    const spanTec = document.getElementById('spanPrioridadTecnicaVal');
    const pTec = item.prioridad_tecnica || 3;
    if (spanTec) spanTec.innerText = `${pTec}★ (${DataStore.getNivelPrioridadLabel(pTec)})`;

    const selMed = document.getElementById('inputPrioridadMedicaPartida');
    if (selMed) {
      selMed.value = (!item.prioridad_medica_ponderada_default && item.prioridad_medica) ? String(item.prioridad_medica) : '';
    }

    document.getElementById('modalAsignarPartida').classList.remove('hidden');
    this.checkPartidaCortaModalAsignar();
    if (window.lucide) lucide.createIcons();
  },

  checkPartidaCortaModalAsignar() {
    const id = document.getElementById('partidaItemId')?.value;
    const item = DataStore.getItemById(id);
    const inputMonto = document.getElementById('inputMontoPartida');
    const warnBox = document.getElementById('partidaCortaWarningContainer');
    const warnTxt = document.getElementById('partidaCortaWarningText');
    if (!item || !inputMonto || !warnBox) return;

    const montoVal = DataStore.parseCurrency(inputMonto.value) || 0;
    const costoRequerido = item.monto_total_usd || ((item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0));

    if (montoVal > 0 && costoRequerido > montoVal) {
      const deficit = costoRequerido - montoVal;
      warnBox.classList.remove('hidden');
      if (warnTxt) {
        warnTxt.innerText = `El monto de la partida asignada (USD ${DataStore.formatUSD(montoVal)}) es menor al costo requerido de la obra (USD ${DataStore.formatUSD(costoRequerido)}). Déficit presupuestario: -USD ${DataStore.formatUSD(deficit)}. La obra quedará marcada con "Partida Corta".`;
      }
    } else {
      warnBox.classList.add('hidden');
    }
  },

  closeAsignarPartidaModal() {
    document.getElementById('modalAsignarPartida').classList.add('hidden');
  },

  handleGuardarPartidaSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('partidaItemId').value;
    const num = document.getElementById('inputNumeroPartida').value.trim();
    const monto = document.getElementById('inputMontoPartida').value.trim();
    const pMed = document.getElementById('inputPrioridadMedicaPartida')?.value || null;

    const montoVal = DataStore.parseCurrency(monto);
    if (!monto || montoVal <= 0) {
      alert("Debes indicar un monto válido mayor a 0 para la partida presupuestaria (USD).");
      return;
    }

    const res = DataStore.asignarPartidaPresupuestaria(id, num, monto, pMed);
    if (res.success) {
      this.closeAsignarPartidaModal();
      this.render();
      const defaultNote = res.prioridad_medica_ponderada_default
        ? ' [Criticidad médica ponderada por default igual a técnica por no contar con criticidad de Dirección]'
        : '';
      this.showToast(`Partida N° ${res.partida} asignada por ${DataStore.formatUSD(res.monto_partida_usd)}${defaultNote}. Habilitada para Proyecto.`);
    } else {
      alert(res.msg);
    }
  },

  // ================= MODAL AVANCE SECUENCIAL =================
  openTransitionModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    const u = DataStore.currentUser;
    const isAdmin = DataStore.isAdmin();

    if (!u || u.solo_lectura || u.rol === 'visualizador' || !u.puede_avanzar) {
      alert("⛔ Acceso Denegado: Tu perfil es de solo lectura y no tiene autorización para avanzar etapas.");
      return;
    }

    if (!DataStore.canUserAdvanceItem(item)) {
      alert(`⛔ Acceso Denegado: Solo puedes avanzar etapas de las obras asignadas a tu usuario. Esta obra está a cargo de: ${item.responsable || 'Sin Asignar'}.`);
      return;
    }

    const currentStage = item.estado;
    const nextStage = DataStore.getNextStage(currentStage);
    if (!nextStage) {
      this.showToast('Esta obra ya se encuentra en su etapa final');
      return;
    }

    // Si la obra no tiene definido el plazo de su etapa actual, obligar a fijarlo antes de avanzar
    if (currentStage !== 'Estudio de Factibilidad' && currentStage !== 'Obras Finalizadas' && currentStage !== 'Suspendida') {
      if (item.requiere_plazo_etapa || !item.fecha_fin_etapa) {
        alert("⚠️ Antes de certificar y avanzar la obra, debes haber establecido el plazo estimado de la etapa actual.");
        this.openDefinirPlazoModal(item.id);
        return;
      }
    }

    const hasPartida = DataStore.hasValidPartida(item);
    if (currentStage === 'Estudio de Factibilidad' && nextStage === 'Proyecto') {
      if (!hasPartida && !u.puede_asignar_partida && !isAdmin) {
        alert(`⛔ Para avanzar de Estudio de Factibilidad a Proyecto es necesario que la obra cuente con una Partida Presupuestaria asignada.\n\nSolicita a Dirección Médica o Administración la asignación del número y monto de partida para "${item.nombre}".`);
        return;
      }
    }

    document.getElementById('transItemId').value = item.id;
    document.getElementById('transItemName').innerText = `${item.id}: ${item.nombre}`;
    document.getElementById('transCurrentStage').innerText = currentStage;
    document.getElementById('transNextStageAuto').innerText = nextStage;

    // Nombre de quien finaliza: Automático según la sesión del usuario logueado
    const certUserEl = document.getElementById('transLoggedUserName');
    if (certUserEl) {
      certUserEl.innerText = `${u.nombre} (${u.rol.toUpperCase()})`;
    }

    // Restricción estricta de fecha: Hoy y hasta 7 días hacia atrás máximo
    const now = new Date();
    const maxDateStr = now.toISOString().split('T')[0];
    const minDate = new Date();
    minDate.setDate(now.getDate() - 7);
    const minDateStr = minDate.toISOString().split('T')[0];

    const inputCompDate = document.getElementById('transCompletionDate');
    if (inputCompDate) {
      inputCompDate.max = maxDateStr;
      inputCompDate.min = minDateStr;
      inputCompDate.value = maxDateStr;
    }
    document.getElementById('transNotes').value = '';

    const warnSinPartida = document.getElementById('transSinPartidaNotice');
    const inputQuickPartida = document.getElementById('transQuickPartidaContainer');
    const quickPartidaInput = document.getElementById('transQuickPartidaInput');
    const quickMontoInput = document.getElementById('transQuickMontoPartidaInput');

    const requierePartida = (currentStage === 'Estudio de Factibilidad' && nextStage === 'Proyecto');
    const tienePartida = DataStore.hasValidPartida(item) && (item.monto_partida_usd > 0 || item.monto_total_usd > 0);

    if (requierePartida && !tienePartida) {
      if (quickPartidaInput) quickPartidaInput.value = item.partida || '';
      const defMonto = item.monto_partida_usd || item.monto_total_usd || item.monto_obra_usd || (item.cashflow ? item.cashflow.monto_total : '') || '';
      if (quickMontoInput) quickMontoInput.value = (defMonto > 0) ? defMonto : '';
      const quickPmedInput = document.getElementById('transQuickPrioridadMedicaInput');
      if (quickPmedInput) {
        quickPmedInput.value = (!item.prioridad_medica_ponderada_default && item.prioridad_medica) ? String(item.prioridad_medica) : '';
      }
      if (warnSinPartida) warnSinPartida.classList.remove('hidden');
      if (inputQuickPartida) {
        if (u.puede_asignar_partida || isAdmin) {
          inputQuickPartida.classList.remove('hidden');
        } else {
          inputQuickPartida.classList.add('hidden');
        }
      }
    } else {
      if (warnSinPartida) warnSinPartida.classList.add('hidden');
      if (inputQuickPartida) inputQuickPartida.classList.add('hidden');
      if (quickPartidaInput) quickPartidaInput.value = '';
      if (quickMontoInput) quickMontoInput.value = '';
      const quickPmedInput = document.getElementById('transQuickPrioridadMedicaInput');
      if (quickPmedInput) quickPmedInput.value = '';
    }

    const alertFinal = document.getElementById('transFinalNotice');
    if (alertFinal) {
      alertFinal.classList.toggle('hidden', nextStage !== 'Obras Finalizadas');
    }

    // Aviso dinámico si avanza a En licitación (Pase a Compras)
    const warnPaseLicitaciones = document.getElementById('transLicitacionesPaseNotice');
    if (warnPaseLicitaciones) {
      warnPaseLicitaciones.classList.toggle('hidden', !(nextStage === 'En licitación' && currentStage === 'Proyecto'));
    }

    // Contenedor Adjudicación (cuando avanza de En licitación a Obras en Curso)
    const containerAdjudicacion = document.getElementById('transAdjudicacionContainer');
    const inputProveedor = document.getElementById('transProveedorAdjudicadoInput');
    const inputOrdenCompra = document.getElementById('transOrdenCompraInput');
    const inputMontoAdj = document.getElementById('transMontoAdjudicadoInput');
    const inputAnticipo = document.getElementById('transAnticipoPorcentajeInput');

    if (containerAdjudicacion) {
      if (currentStage === 'En licitación' && nextStage === 'Obras en Curso') {
        containerAdjudicacion.classList.remove('hidden');
        if (inputProveedor) inputProveedor.value = item.proveedor || '';
        if (inputOrdenCompra) inputOrdenCompra.value = item.orden_compra || item.numero_oc || '';
        const defMontoAdj = item.monto_adjudicado_usd || item.monto_total_usd || item.monto_obra_usd || '';
        if (inputMontoAdj) inputMontoAdj.value = defMontoAdj > 0 ? defMontoAdj : '';
        if (inputAnticipo) inputAnticipo.value = (item.anticipo_porcentaje !== undefined && item.anticipo_porcentaje !== null) ? item.anticipo_porcentaje : '';
        this.handleAdjudicacionInputChange();
      } else {
        containerAdjudicacion.classList.add('hidden');
      }
    }

    document.getElementById('modalTransition').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  handleAdjudicacionInputChange() {
    const inputMonto = document.getElementById('transMontoAdjudicadoInput');
    const inputAnticipo = document.getElementById('transAnticipoPorcentajeInput');
    const badge = document.getElementById('transAnticipoCalculadoBadge');

    const monto = DataStore.parseCurrency(inputMonto ? inputMonto.value : 0) || 0;
    const rawVal = inputAnticipo ? inputAnticipo.value : '';
    const pct = (rawVal === '' || isNaN(parseFloat(rawVal))) ? 0 : Math.min(100, Math.max(0, parseFloat(rawVal)));

    const anticipoUSD = Math.round((monto * (pct / 100)) * 100) / 100;

    if (badge) {
      badge.innerText = `${pct}% = USD ${DataStore.formatUSD(anticipoUSD)}`;
    }
  },

  confirmTransition() {
    const id = document.getElementById('transItemId').value;
    const item = DataStore.getItemById(id);
    if (!item) return;

    const u = DataStore.currentUser;
    const isAdmin = DataStore.isAdmin();

    if (!u || u.solo_lectura || u.rol === 'visualizador' || (!u.puede_avanzar && !u.puede_asignar_partida)) {
      alert("⛔ Acceso Denegado: Tu perfil es de solo lectura y no tiene autorización para avanzar etapas.");
      return;
    }

    if (!DataStore.canUserAdvanceItem(item)) {
      alert(`⛔ Acceso Denegado: Solo puedes certificar y avanzar obras asignadas a tu usuario. Esta obra está a cargo de: ${item.responsable || 'Sin Asignar'}.`);
      return;
    }

    const currentStage = item.estado;
    const nextStage = DataStore.getNextStage(currentStage);

    const hasPartida = DataStore.hasValidPartida(item);
    const quickPartidaInput = document.getElementById('transQuickPartidaInput');
    const quickMontoInput = document.getElementById('transQuickMontoPartidaInput');
    const enteredPartida = quickPartidaInput ? quickPartidaInput.value.trim() : '';
    const enteredMonto = quickMontoInput ? quickMontoInput.value.trim() : '';

    const compDate = document.getElementById('transCompletionDate').value;
    const notes = document.getElementById('transNotes').value;

    // Validación de fecha: Hoy y hasta 7 días hacia atrás máximo
    const now = new Date();
    const maxDateStr = now.toISOString().split('T')[0];
    const minDate = new Date();
    minDate.setDate(now.getDate() - 7);
    const minDateStr = minDate.toISOString().split('T')[0];

    if (!compDate) {
      alert("⚠️ Debes seleccionar una fecha de finalización de la etapa.");
      document.getElementById('transCompletionDate').focus();
      return;
    }
    if (compDate > maxDateStr) {
      alert("⚠️ La fecha de finalización de etapa no puede ser posterior al día de hoy.");
      document.getElementById('transCompletionDate').focus();
      return;
    }
    if (compDate < minDateStr) {
      alert(`⚠️ La fecha de finalización no puede tener más de 7 días de antigüedad (rango permitido: ${minDateStr} al ${maxDateStr}).`);
      document.getElementById('transCompletionDate').focus();
      return;
    }

    // VALIDACIÓN ESTRICTA Y ASIGNACIÓN: Para avanzar de Estudio de Factibilidad a Proyecto es OBLIGATORIO tener partida presupuestaria y monto
    if (currentStage === 'Estudio de Factibilidad' && nextStage === 'Proyecto') {
      if (!hasPartida && !enteredPartida && !u.puede_asignar_partida && !isAdmin) {
        alert("⛔ No es posible avanzar a la etapa de Proyecto:\n\nEsta obra requiere que Dirección Médica o Administración asigne una Partida Presupuestaria previamente.");
        return;
      }

      if (enteredPartida && enteredPartida !== (item.partida || '')) {
        if (!u.puede_asignar_partida && !isAdmin) {
          alert("⛔ Acceso Denegado: No tienes el permiso específico para asignar partida presupuestaria.");
          return;
        }
        const montoToAssign = enteredMonto || item.monto_partida_usd || item.monto_total_usd || item.monto_obra_usd;
        const quickPmed = document.getElementById('transQuickPrioridadMedicaInput')?.value || null;
        const partRes = DataStore.asignarPartidaPresupuestaria(id, enteredPartida, montoToAssign, quickPmed);
        if (!partRes.success) {
          alert(partRes.msg);
          return;
        }
      }

      const finalPartida = (item.partida || enteredPartida).trim();
      const finalMonto = item.monto_partida_usd || DataStore.parseCurrency(enteredMonto) || item.monto_total_usd || 0;
      if (!finalPartida || finalPartida === '' || finalPartida === 'S/D' || finalPartida.toUpperCase() === 'PENDIENTE') {
        alert("⛔ No es posible avanzar a la etapa de Proyecto:\n\nEl sistema requiere obligatoriamente que la obra cuente con un Número de Partida Presupuestaria asignado por la Dirección.\n\nSi no existe número de partida, el sistema no te permitirá avanzar.");
        if (quickPartidaInput) {
          document.getElementById('transQuickPartidaContainer')?.classList.remove('hidden');
          document.getElementById('transSinPartidaNotice')?.classList.remove('hidden');
          quickPartidaInput.focus();
        }
        return;
      }
      if (!finalMonto || finalMonto <= 0) {
        alert("⛔ No es posible avanzar a la etapa de Proyecto:\n\nDebes indicar el monto oficial asignado a la partida presupuestaria (USD).");
        if (quickMontoInput) {
          document.getElementById('transQuickPartidaContainer')?.classList.remove('hidden');
          document.getElementById('transSinPartidaNotice')?.classList.remove('hidden');
          quickMontoInput.focus();
        }
        return;
      }
    }

    // Captura y validaciones de adjudicación
    const extraData = {};
    if (currentStage === 'En licitación' && nextStage === 'Obras en Curso') {
      const proveedor = (document.getElementById('transProveedorAdjudicadoInput')?.value || '').trim();
      const ordenCompra = (document.getElementById('transOrdenCompraInput')?.value || '').trim();
      const montoAdj = DataStore.parseCurrency(document.getElementById('transMontoAdjudicadoInput')?.value) || 0;
      const rawAnticipo = document.getElementById('transAnticipoPorcentajeInput')?.value;

      if (!proveedor) {
        alert("⚠️ Debes indicar la Razón Social del Proveedor Adjudicado para avanzar a 'Obras en Curso'.");
        document.getElementById('transProveedorAdjudicadoInput')?.focus();
        return;
      }
      if (!ordenCompra) {
        alert("⚠️ Debes ingresar el Número de Orden de Compra (OC) para avanzar a 'Obras en Curso'.");
        document.getElementById('transOrdenCompraInput')?.focus();
        return;
      }
      if (montoAdj <= 0) {
        alert("⚠️ Debes indicar el Monto Total de la Adjudicación (USD mayor a 0).");
        document.getElementById('transMontoAdjudicadoInput')?.focus();
        return;
      }
      if (rawAnticipo === '' || rawAnticipo === null || rawAnticipo === undefined || isNaN(parseFloat(rawAnticipo))) {
        alert("⚠️ Debes ingresar el Porcentaje de Anticipo en Orden de Compra (cargar 0 si no lleva anticipo).");
        document.getElementById('transAnticipoPorcentajeInput')?.focus();
        return;
      }
      const anticipoPct = Math.min(100, Math.max(0, parseFloat(rawAnticipo)));

      extraData.proveedor = proveedor;
      extraData.ordenCompra = ordenCompra;
      extraData.orden_compra = ordenCompra;
      extraData.numero_oc = ordenCompra;
      extraData.montoAdjudicado = montoAdj;
      extraData.porcentajeAnticipo = anticipoPct;
      // Nota: El plazo de la etapa en curso es obligación del proyectista al asumir la obra adjudicada
    }

    const res = DataStore.confirmAndAdvanceStage(id, compDate, null, notes, extraData);
    if (res.success) {
      this.closeTransitionModal();
      this.render();
      this.showToast(`¡Etapa finalizada! Obra avanzó a '${res.nextStage}' 🎉`);
    } else {
      alert(res.msg);
    }
  },

  closeTransitionModal() {
    document.getElementById('modalTransition').classList.add('hidden');
  },

  // ================= MODAL DEFINIR PLAZO OBLIGATORIO DE ETAPA =================
  openDefinirPlazoModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    const u = DataStore.currentUser;
    const canAdvance = DataStore.canUserAdvanceItem(item) || DataStore.isAdmin();
    if (!canAdvance) {
      alert("Solo el responsable asignado o Administrador puede establecer el plazo de esta etapa.");
      return;
    }

    const modal = document.getElementById('modalDefinirPlazoEtapa');
    if (!modal) return;

    document.getElementById('modalPlazoItemId').value = item.id;
    document.getElementById('modalPlazoItemCodigo').innerText = item.id;
    document.getElementById('modalPlazoItemEtapa').innerText = item.estado;
    document.getElementById('modalPlazoItemNombre').innerText = item.nombre;
    document.getElementById('modalPlazoItemResponsable').innerText = item.responsable || (u ? u.nombre : 'Sin Asignar');

    const tituloEl = document.getElementById('modalPlazoEtapaTitulo');
    const msgEl = document.getElementById('modalPlazoMensajeObligatorio');
    const labelFinEl = document.getElementById('modalPlazoFechaFinLabel');

    let labelFin = 'Fecha Estimada de Término *';
    let msg = `Como responsable asignado de la etapa de <strong>${item.estado}</strong>, debes fijar la fecha estimada de finalización para habilitar el seguimiento del cronograma y los semáforos de avance.`;

    if (item.estado === 'Proyecto') {
      if (tituloEl) tituloEl.innerText = 'Planificación de Etapa: Proyecto';
      labelFin = 'Fecha Estimada de Finalización de Proyecto *';
      msg = `Como proyectista / responsable técnico asignado, debes definir la <strong>Fecha Estimada de Finalización del Proyecto</strong> técnico antes de operar la obra.`;
    } else if (item.estado === 'En licitación') {
      if (tituloEl) tituloEl.innerText = 'Planificación de Etapa: Licitación / Compulsa';
      labelFin = 'Fecha Estimada de Cierre de Compulsa *';
      msg = `Como responsable de Compras y Licitaciones, debes definir la <strong>Fecha Estimada de Cierre de la Compulsa de Precios</strong> para coordinar el proceso licitatorio.`;
    } else if (item.estado === 'Obras en Curso') {
      if (tituloEl) tituloEl.innerText = 'Planificación de Etapa: Obras en Curso';
      labelFin = 'Fecha Estimada de Finalización de la Obra *';
      msg = `Como responsable técnico de la obra en ejecución, debes definir la <strong>Fecha Estimada de Finalización de los Trabajos</strong> (plazo de obra contractual).`;
    } else {
      if (tituloEl) tituloEl.innerText = `Planificación de Etapa: ${item.estado}`;
    }

    if (labelFinEl) labelFinEl.innerHTML = `${labelFin} <span class="text-red-500">*</span>`;
    if (msgEl) msgEl.innerHTML = msg;

    const startDate = item.fecha_inicio_etapa || new Date().toISOString().split('T')[0];
    const fechaInicioInput = document.getElementById('modalPlazoFechaInicio');
    if (fechaInicioInput) fechaInicioInput.value = startDate;

    const fechaFinInput = document.getElementById('modalPlazoFechaFinInput');
    if (fechaFinInput) {
      fechaFinInput.min = startDate;
      fechaFinInput.value = item.fecha_fin_etapa || '';
    }

    const notasInput = document.getElementById('modalPlazoNotasInput');
    if (notasInput) notasInput.value = '';

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    if (fechaFinInput) setTimeout(() => fechaFinInput.focus(), 150);
  },

  closeDefinirPlazoModal() {
    const modal = document.getElementById('modalDefinirPlazoEtapa');
    if (modal) modal.classList.add('hidden');
  },

  handleGuardarPlazoEtapa() {
    const id = document.getElementById('modalPlazoItemId')?.value;
    const fechaFin = document.getElementById('modalPlazoFechaFinInput')?.value;
    const notas = document.getElementById('modalPlazoNotasInput')?.value?.trim() || '';

    if (!fechaFin) {
      alert("⚠️ Es obligatorio ingresar la fecha estimada de término de la etapa para poder continuar.");
      document.getElementById('modalPlazoFechaFinInput')?.focus();
      return;
    }

    const res = DataStore.definirPlazoEtapa(id, fechaFin, notas);
    if (!res.success) {
      alert(res.msg);
      return;
    }

    this.closeDefinirPlazoModal();
    this.render();
    this.showToast(`Plazo de etapa establecido al ${fechaFin} 🎉`);
    // Abrir automáticamente el modal de la obra para continuar trabajando
    this.openObraModal(id);
  },

  // ================= MODAL DIRECCIÓN MÉDICA =================
  openMedicalPriorityModal() {
    const u = DataStore.currentUser;
    if (!u || u.solo_lectura || u.rol === 'visualizador' || !u.puede_priorizar_medica) {
      alert("⛔ Acceso Denegado: No cuentas con la autorización de Dirección Médica para evaluar prioridades.");
      return;
    }

    const pendingItems = DataStore.getPendingMedicalPriorityItems();
    const container = document.getElementById('medicalPriorityListContainer');
    if (!container) return;

    if (pendingItems.length === 0) {
      container.innerHTML = `<div class="text-center py-8 text-slate-500">No hay obras pendientes de evaluación médica en este momento. ¡Todo al día! 🎉</div>`;
    } else {
      let html = '<div class="space-y-4">';
      pendingItems.forEach(item => {
        const monto = DataStore.formatUSD(item.monto_total_usd || item.monto_obra_usd || 0);
        html += `
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1 flex-1">
              <div class="flex items-center space-x-2">
                <span class="font-mono text-xs font-bold text-slate-500">${item.id}</span>
                <span class="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded">📍 ${item.sede}</span>
                <span class="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded">Fase: ${item.estado}</span>
              </div>
              <div class="font-bold text-slate-900 text-sm">${item.nombre}</div>
              <div class="text-xs text-slate-500 flex items-center space-x-3">
                <span>Sector: <strong>${item.sector_solicitante || 'S/D'}</strong></span>
                <span>•</span>
                <span>Monto: <strong>${monto}</strong></span>
                <span>•</span>
                <span>Prioridad Inicial Solicitante: <strong>${item.prioridad_tecnica || 1}★</strong></span>
              </div>
            </div>

            <div class="flex items-center space-x-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <span class="text-xs font-bold text-slate-700 mr-2">Prioridad Dirección:</span>
              ${[1, 2, 3, 4, 5].map(p => `
                <button onclick="App.rateMedicalPriority('${item.id}', ${p})" 
                        class="w-8 h-8 rounded-lg font-black text-xs transition flex items-center justify-center ${
                          item.prioridad_medica == p 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-slate-100 hover:bg-blue-100 text-slate-700'
                        }">
                  ${p}★
                </button>
              `).join('')}
            </div>
          </div>
        `;
      });
      html += '</div>';
      container.innerHTML = html;
    }

    document.getElementById('modalMedicalPriority').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  rateMedicalPriority(itemId, rating) {
    const u = DataStore.currentUser;
    if (!u || u.solo_lectura || u.rol === 'visualizador' || !u.puede_priorizar_medica) {
      alert("⛔ Acceso Denegado: No cuentas con la autorización de Dirección Médica.");
      return;
    }
    DataStore.setMedicalPriority(itemId, rating, 'Evaluación asignada desde Dirección Médica');
    this.openMedicalPriorityModal();
    this.render();
    this.showToast(`Prioridad Dirección asignada: ${rating}★ para ${itemId}`);
  },

  closeMedicalPriorityModal() {
    document.getElementById('modalMedicalPriority').classList.add('hidden');
  },

  // ================= SINCRONIZACIÓN MULTI-PESTAÑA REACTIVA =================
  initMultiTabSync() {
    if (typeof sigoBroadcast !== 'undefined' && sigoBroadcast) {
      sigoBroadcast.onmessage = (event) => {
        if (event.data && (event.data.type === 'DATA_PERSISTED' || event.data.type === 'DATABASE_RESTORED' || event.data.type === 'USERS_PERSISTED')) {
          console.log('🔄 Sincronización reactiva multi-pestaña recibida:', event.data.type);
          DataStore.reloadFromStorage();
          if (DataStore.currentUser) {
            this.refreshAllViews();
          }
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'sigo_obras_data' || e.key === 'sigo_users_list') {
          console.log('🔄 Sincronización por storage event recibida:', e.key);
          DataStore.reloadFromStorage();
          if (DataStore.currentUser) {
            this.refreshAllViews();
          }
        }
      });
    }
  },

  refreshAllViews() {
    try {
      const kpis = DataStore.getKPIs(this.filters);
      this.renderKPIs(kpis);
      this.renderPipelineChart(kpis);
      this.renderFilteredTable();
      this.renderMedicalPriorityWarning();
      this.checkPendingDeadlinesNotification();
      if (this.currentView === 'cashflow') {
        this.renderCashflowView();
      } else if (this.currentView === 'sedes') {
        this.renderSedesReport();
      }
      if (window.lucide) lucide.createIcons();
    } catch (e) {
      console.warn("Error refrescando vistas:", e);
    }
  },

  // ================= GESTIÓN Y RESPALDO DE BASE DE DATOS =================
  openDatabaseBackupModal() {
    const u = DataStore.currentUser;
    if (!u || u.rol !== 'admin') {
      alert("⛔ Acceso Denegado: Solo administradores pueden gestionar la base de datos.");
      return;
    }
    this.updateDatabaseBackupModalStats();
    const modal = document.getElementById('modalDatabaseBackup');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  closeDatabaseBackupModal() {
    const modal = document.getElementById('modalDatabaseBackup');
    if (modal) modal.classList.add('hidden');
  },

  updateDatabaseBackupModalStats() {
    const kpis = DataStore.getKPIs();
    const elTot = document.getElementById('dbBackupStatTotal');
    const elAct = document.getElementById('dbBackupStatActive');
    const elUsd = document.getElementById('dbBackupStatUSD');
    if (elTot) elTot.innerText = `${(DataStore.items || []).length} obras`;
    if (elAct) elAct.innerText = `${kpis.carteraActivaCount || 0} activas`;
    if (elUsd) elUsd.innerText = DataStore.formatUSD(kpis.totalCarteraActiva);
  },

  exportDatabase() {
    try {
      const jsonStr = DataStore.exportDatabaseJSON();
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SIGO_HIBA_BASE_DATOS_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("✅ Base de datos exportada exitosamente.\nPuedes usar este archivo para restaurar o migrar el sistema en cualquier computadora.");
    } catch (e) {
      console.error("Error exportando base:", e);
      alert("⚠️ Error al exportar la base de datos: " + e.message);
    }
  },

  handleImportDatabase() {
    const fileInput = document.getElementById('importDatabaseFileInput');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert("⚠️ Por favor selecciona un archivo JSON de respaldo para restaurar.");
      return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const res = DataStore.importDatabaseJSON(content);
        if (res.success) {
          this.refreshAllViews();
          this.updateDatabaseBackupModalStats();
          alert(`✅ ¡Base de datos restaurada con éxito!\nSe cargaron ${res.count} obras correctamente.`);
          this.closeDatabaseBackupModal();
        } else {
          alert("❌ Error al restaurar la base de datos:\n" + res.error);
        }
      } catch (err) {
        alert("❌ Formato de archivo inválido:\n" + err.message);
      }
    };
    reader.readAsText(file);
  },

  handleResetToCanonical() {
    const conf = confirm("⚠️ ¿Estás seguro de que deseas restablecer la base de datos al estado canónico oficial de fábrica?\n\nEsto restaurará los 97 proyectos activos por USD 30,569,529.29 y 91 factibilidades por USD 17.62M.");
    if (!conf) return;

    const res = DataStore.resetToCanonical();
    if (res.success) {
      this.refreshAllViews();
      this.updateDatabaseBackupModalStats();
      alert(`✅ Base de datos restablecida a valores canónicos oficiales.\nTotal: ${res.count} obras cargadas.`);
      this.closeDatabaseBackupModal();
    } else {
      alert("❌ Error al restablecer base canónica: " + res.error);
    }
  },

  // ================= GESTIÓN DE USUARIOS =================
  openUsersAdminModal() {
    const u = DataStore.currentUser;
    if (!u || u.rol !== 'admin') {
      alert("⛔ Acceso Denegado: Solo administradores pueden gestionar usuarios.");
      return;
    }
    this.renderUsersList();
    document.getElementById('modalUsersAdmin').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  closeUsersAdminModal() {
    document.getElementById('modalUsersAdmin').classList.add('hidden');
  },

  renderUsersList() {
    const listEl = document.getElementById('adminUsersTableBody');
    if (!listEl) return;

    let html = '';
    DataStore.users.forEach(u => {
      const isCurrent = DataStore.currentUser && DataStore.currentUser.id === u.id;
      const assignedObras = DataStore.getUserAssignedObras(u.id);
      const obraCount = assignedObras.length;

      html += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs group">
          <td class="py-2.5 px-3 whitespace-nowrap">
            <div class="font-bold text-slate-800 font-mono text-blue-700">@${u.username || 'sin_usuario'}</div>
            ${u.debe_cambiar_clave ? '<span class="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1 mt-0.5"><i data-lucide="key" class="w-2.5 h-2.5"></i> Clave Provisoria</span>' : ''}
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            <div class="font-bold text-slate-800 flex items-center gap-1">
              <span>${u.nombre}</span>
              ${isCurrent ? '<span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">TÚ</span>' : ''}
            </div>
            <div class="text-[11px] text-slate-400 font-normal">${u.email || ''}</div>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
              ${u.dependencia || 'Sin Dependencia'}
            </span>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap text-center">
            <span class="px-2 py-0.5 rounded font-semibold text-[11px] ${
              u.sede === 'Central' ? 'bg-blue-50 text-blue-700' :
              u.sede === 'San Justo' ? 'bg-emerald-50 text-emerald-700' :
              u.sede === 'Periféricos' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
            }">${u.sede}</span>
          </td>
          <td class="py-2.5 px-3 font-semibold text-slate-700 uppercase text-[10px] whitespace-nowrap text-center">${u.rol}</td>
          <td class="py-2.5 px-3 whitespace-nowrap text-center">
            <div class="flex items-center justify-center space-x-1.5">
              ${u.rol === 'admin' ? `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs"
                      title="Supervisión total: universo completo de las 221 obras del Hospital (97 activas en ejecución + 94 en estudio de factibilidad + 24 finalizadas + 7 suspendidas)">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 mr-1 text-purple-600"></i>Supervisión Total (${obraCount} obras)
                </span>
              ` : `
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  obraCount > 0 ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                }">
                  ${obraCount} ${obraCount === 1 ? 'obra' : 'obras'}
                </span>
                <button type="button" onclick="App.openAssignUserObrasModal('${u.id}')" 
                        class="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold inline-flex items-center space-x-1 transition cursor-pointer shrink-0"
                        title="Asignar o desasignar obras a este usuario">
                  <i data-lucide="folder-plus" class="w-3 h-3 text-emerald-600"></i>
                  <span>Asignar</span>
                </button>
              `}
            </div>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap text-center">
            ${u.activo 
              ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Acceso Habilitado</span>' 
              : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>Acceso Revocado</span>'
            }
          </td>
          <td class="py-2.5 px-3 text-right sticky-action-col bg-white group-hover:bg-slate-50 border-l border-slate-200 whitespace-nowrap min-w-[340px]">
            <div class="flex items-center justify-end space-x-1.5 whitespace-nowrap">
              <!-- 0. Botón Asignar Cartera de Obras -->
              ${u.rol === 'admin' ? `
                <span class="px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded font-medium text-[10px] flex items-center space-x-1 shrink-0 cursor-default" title="El Administrador supervisa el 100% de las obras del Hospital (221 obras) sin restricciones">
                  <i data-lucide="shield-check" class="w-3 h-3 text-purple-500"></i>
                  <span>Supervisa Todas</span>
                </span>
              ` : `
                <button type="button" onclick="App.openAssignUserObrasModal('${u.id}')" title="Asignar cartera de obras e infraestructura a este usuario" class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1 shrink-0">
                  <i data-lucide="folder-kanban" class="w-3 h-3 text-emerald-600"></i>
                  <span>Asignar</span>
                </button>
              `}

              <!-- 1. Botón Cambiar Permisos -->
              <button type="button" onclick="App.openEditPermissionsModal('${u.id}')" title="Modificar rol, sede y permisos granulares" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1 shrink-0">
                <i data-lucide="settings" class="w-3 h-3"></i>
                <span>Permisos</span>
              </button>

              <!-- 2. Botón Quitar/Habilitar Acceso -->
              ${!isCurrent ? `
                <button type="button" onclick="App.handleToggleAccess('${u.id}')" title="${u.activo ? 'Quitar acceso al sistema' : 'Habilitar acceso al sistema'}" class="px-2 py-1 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1 border shrink-0 ${
                  u.activo ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                }">
                  <i data-lucide="${u.activo ? 'lock' : 'unlock'}" class="w-3 h-3"></i>
                  <span>${u.activo ? 'Quitar Acceso' : 'Habilitar Acceso'}</span>
                </button>
              ` : ''}

              <!-- 3. Botón Forzar Cambio de Clave -->
              <button type="button" onclick="App.handleForcePasswordChange('${u.id}')" title="Generar clave temporal obligatoria por olvido de contraseña" class="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1 shrink-0">
                <i data-lucide="key" class="w-3 h-3"></i>
                <span>Forzar Clave</span>
              </button>

              <!-- 4. Botón Eliminar Definitivamente -->
              ${!isCurrent ? `
                <button type="button" onclick="App.handleDeleteUserDirect('${u.id}')" title="Eliminar usuario definitivamente para que no vuelva a aparecer jamás" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1 shrink-0">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                  <span>Eliminar</span>
                </button>
              ` : ''}

              <!-- Simular sesión rápida -->
              <button type="button" onclick="App.switchUserAccount('${u.id}')" title="Iniciar sesión con este perfil" class="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium transition cursor-pointer shrink-0">
                Simular
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    listEl.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  // ================= MODAL: ASIGNACIÓN DE OBRAS A USUARIOS =================
  assignModalState: {
    targetUserId: null,
    selectedObraIds: new Set(),
    initialObraIds: new Set()
  },

  openAssignUserObrasModal(userId) {
    const user = (DataStore.users || []).find(u => u.id === userId);
    if (!user) {
      alert("Usuario no encontrado.");
      return;
    }
    if (!DataStore.isAdmin()) {
      alert("⛔ Acceso Denegado: Exclusivo para el Administrador. Solo el administrador puede asignar obras a los usuarios.");
      return;
    }

    const assignedObras = DataStore.getUserAssignedObras(userId);
    const assignedIds = new Set(assignedObras.map(o => o.id));

    this.assignModalState = {
      targetUserId: userId,
      selectedObraIds: new Set(assignedIds),
      initialObraIds: new Set(assignedIds)
    };

    const targetInput = document.getElementById('assignModalTargetUserId');
    if (targetInput) targetInput.value = userId;

    const badge = document.getElementById('assignModalUserBadge');
    if (badge) badge.innerText = `@${user.username} (${user.rol.toUpperCase()})`;

    const subtitle = document.getElementById('assignModalUserSubtitle');
    if (subtitle) subtitle.innerHTML = `Gestionando cartera a cargo de <strong>${user.nombre}</strong> (${user.sede} - ${user.rol}).`;

    const searchInput = document.getElementById('assignModalSearch');
    if (searchInput) searchInput.value = '';

    const typeFilter = document.getElementById('assignModalTypeFilter');
    if (typeFilter) typeFilter.value = 'TODOS';

    const stateFilter = document.getElementById('assignModalStateFilter');
    if (stateFilter) stateFilter.value = 'TODAS';

    this.renderAssignObrasModalList();

    const modal = document.getElementById('modalAssignUserObras');
    if (modal) {
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  },

  closeAssignUserObrasModal() {
    const modal = document.getElementById('modalAssignUserObras');
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  filterAssignObrasModalList() {
    this.renderAssignObrasModalList();
  },

  renderAssignObrasModalList() {
    const listContainer = document.getElementById('assignModalObrasList');
    if (!listContainer) return;

    const userId = this.assignModalState.targetUserId;
    const user = (DataStore.users || []).find(u => u.id === userId);
    if (!user) return;

    const searchTerm = (document.getElementById('assignModalSearch')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('assignModalTypeFilter')?.value || 'TODOS';
    const depFilter = document.getElementById('assignModalDepFilter')?.value || 'TODAS';
    const stateFilter = document.getElementById('assignModalStateFilter')?.value || 'TODAS';

    const visibleItems = (DataStore.items || []).filter(item => {
      // Type filter
      if (typeFilter !== 'TODOS') {
        const itemType = (item.tipo || '').toLowerCase();
        if (typeFilter === 'Obra Civil' && !itemType.includes('civil') && !itemType.includes('obra')) return false;
        if (typeFilter === 'Infraestructura' && !itemType.includes('infra')) return false;
      }

      // Dependencia filter
      if (depFilter !== 'TODAS') {
        const itemDep = DataStore.normalizeDependencia ? DataStore.normalizeDependencia(item.dependencia || DataStore.getObraDependencia(item)) : (item.dependencia || DataStore.getObraDependencia(item));
        const normalizedFilter = DataStore.normalizeDependencia ? DataStore.normalizeDependencia(depFilter) : depFilter;
        if (itemDep !== normalizedFilter) return false;
      }

      // Assignment status
      const isSelected = this.assignModalState.selectedObraIds.has(item.id);
      const isAssigned = DataStore.isObraAssigned(item);
      const assignedUser = DataStore.getObraAssignedUser(item);
      const isAssignedToThis = (assignedUser && assignedUser.id === userId) || isSelected;

      if (stateFilter === 'ASIGNADAS_A_ESTE' && !isAssignedToThis) return false;
      if (stateFilter === 'SIN_ASIGNAR' && isAssigned && !isSelected) return false;
      if (stateFilter === 'OTRO_RESPONSABLE' && (!isAssigned || isAssignedToThis)) return false;

      // Search term
      if (searchTerm) {
        const haystack = `${item.id} ${item.nombre} ${item.sede} ${item.dependencia || ''} ${item.responsable || ''} ${item.categoria || ''}`.toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }

      return true;
    });

    if (visibleItems.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <i data-lucide="folder-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          <p class="font-medium text-xs">No se encontraron proyectos con los filtros de búsqueda seleccionados.</p>
        </div>
      `;
      this.updateAssignModalSummary(0);
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '';
    visibleItems.forEach(item => {
      const isSelected = this.assignModalState.selectedObraIds.has(item.id);
      const isAssigned = DataStore.isObraAssigned(item);
      const assignedUser = DataStore.getObraAssignedUser(item);
      const isCurrentOwner = (assignedUser && assignedUser.id === userId) || (item.responsable_id === userId);
      const otherOwnerName = !isCurrentOwner && isAssigned ? (item.responsable || (assignedUser ? assignedUser.nombre : 'Otro')) : null;
      const monto = DataStore.formatUSD(item.monto_total_usd || item.monto_obra_usd || 0);
      const depTag = item.dependencia || DataStore.getObraDependencia(item);

      html += `
        <label class="flex items-start p-3 bg-white hover:bg-slate-50 border rounded-xl transition cursor-pointer ${
          isSelected ? 'border-blue-400 bg-blue-50/30 shadow-2xs' : 'border-slate-200'
        }">
          <div class="pt-0.5 pr-3">
            <input type="checkbox" 
                   value="${item.id}" 
                   ${isSelected ? 'checked' : ''} 
                   onchange="App.handleAssignObraCheckboxChange('${item.id}', this.checked)"
                   class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer">
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center space-x-2 flex-wrap">
                <span class="font-mono font-bold text-slate-500 text-[11px]">${item.id}</span>
                <span class="font-bold text-slate-900 text-xs">${item.nombre}</span>
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">${depTag}</span>
              </div>
              <span class="font-black text-slate-900 text-xs shrink-0">${monto}</span>
            </div>
            <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-1 flex-wrap gap-y-1">
              <span class="font-semibold text-slate-600">📍 ${item.sede}</span>
              <span>•</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold ${item.tipo === 'Infraestructura' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}">${item.tipo || 'Obra Civil'}</span>
              <span>•</span>
              <span>Fase: <strong class="text-slate-700">${item.estado}</strong></span>
              <span>•</span>
              ${isSelected ? `
                <span class="bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded-full inline-flex items-center space-x-1">
                  <i data-lucide="check" class="w-3 h-3 text-blue-600"></i>
                  <span>Seleccionada para asignar</span>
                </span>
              ` : (otherOwnerName ? `
                <span class="bg-amber-100 text-amber-900 font-semibold px-2 py-0.2 rounded-full inline-flex items-center space-x-1" title="Actualmente a cargo de otro usuario">
                  <i data-lucide="user" class="w-3 h-3 text-amber-600"></i>
                  <span>Actual: <strong>${otherOwnerName}</strong></span>
                </span>
              ` : `
                <span class="bg-slate-100 text-slate-600 font-semibold px-2 py-0.2 rounded-full inline-flex items-center space-x-1">
                  <i data-lucide="circle-dashed" class="w-3 h-3 text-slate-400"></i>
                  <span>Sin Asignar</span>
                </span>
              `)}
            </div>
          </div>
        </label>
      `;
    });

    listContainer.innerHTML = html;
    this.updateAssignModalSummary(visibleItems.length);
    if (window.lucide) lucide.createIcons();
  },

  handleAssignObraCheckboxChange(obraId, isChecked) {
    if (isChecked) {
      this.assignModalState.selectedObraIds.add(obraId);
    } else {
      this.assignModalState.selectedObraIds.delete(obraId);
    }
    this.updateAssignModalSummary();
    this.renderAssignObrasModalList();
  },

  toggleSelectAllAssignObras(select) {
    const listContainer = document.getElementById('assignModalObrasList');
    if (!listContainer) return;
    const checkboxes = listContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const obraId = cb.value;
      if (select) {
        this.assignModalState.selectedObraIds.add(obraId);
      } else {
        this.assignModalState.selectedObraIds.delete(obraId);
      }
    });
    this.renderAssignObrasModalList();
  },

  updateAssignModalSummary(visibleCount = null) {
    const summaryEl = document.getElementById('assignModalSummaryText');
    if (!summaryEl) return;

    const totalSelected = this.assignModalState.selectedObraIds.size;
    const initialSelected = this.assignModalState.initialObraIds.size;
    const diff = totalSelected - initialSelected;
    let diffText = '';
    if (diff > 0) {
      diffText = `<span class="text-emerald-700 font-bold ml-1">(+${diff} nuevas)</span>`;
    } else if (diff < 0) {
      diffText = `<span class="text-rose-600 font-bold ml-1">(${diff} removidas)</span>`;
    }

    summaryEl.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg font-bold">
          ${totalSelected} ${totalSelected === 1 ? 'obra seleccionada' : 'obras seleccionadas'}
        </span>
        ${diffText}
        ${visibleCount !== null ? `<span class="text-slate-400 font-normal">| ${visibleCount} visibles en el filtro</span>` : ''}
      </div>
    `;
  },

  saveAssignUserObras() {
    const userId = this.assignModalState.targetUserId;
    const user = (DataStore.users || []).find(u => u.id === userId);
    if (!user) return;

    const obraIds = Array.from(this.assignModalState.selectedObraIds);
    const res = DataStore.assignObrasToUser(userId, obraIds);

    if (res.success) {
      this.closeAssignUserObrasModal();
      this.renderUsersList();
      this.render();
      this.showToast(`✅ Cartera actualizada: ${res.assignedCount} obras asignadas a ${user.nombre}`);
    } else {
      alert("Error al asignar obras: " + res.msg);
    }
  },

  // ================= ASIGNACIÓN Y REASIGNACIÓN ÁGIL DE OBRAS =================
  openAsignacionInteractivaModal() {
    const u = DataStore.currentUser;
    if (!u || u.rol !== 'admin') {
      alert("⛔ Acceso Restringido: Solo los administradores pueden utilizar el Centro de Asignación y Reasignación Ágil.");
      return;
    }

    this.populateAsignacionFiltros();
    const selEstado = document.getElementById('filtroAsignacionEstado');
    if (selEstado) selEstado.value = 'sin_asignar';
    const inputBuscar = document.getElementById('filtroAsignacionBuscar');
    if (inputBuscar) inputBuscar.value = '';

    this.renderAsignacionInteractivaList();
    const modal = document.getElementById('modalAsignacionInteractiva');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  closeAsignacionInteractivaModal() {
    const modal = document.getElementById('modalAsignacionInteractiva');
    if (modal) modal.classList.add('hidden');
    this.render(); // Actualiza tablero y vistas generales
  },

  populateAsignacionFiltros() {
    const deptSelect = document.getElementById('filtroAsignacionDept');
    if (deptSelect) {
      const currentVal = deptSelect.value;
      const depts = new Set();
      (DataStore.items || []).forEach(x => {
        const dep = DataStore.normalizeDependencia ? DataStore.normalizeDependencia(x.dependencia || DataStore.getObraDependencia(x)) : x.dependencia;
        if (dep) depts.add(dep);
      });
      let html = '<option value="todos">Todos los Departamentos</option>';
      Array.from(depts).sort().forEach(d => {
        html += `<option value="${d}">${d}</option>`;
      });
      deptSelect.innerHTML = html;
      if (currentVal && depts.has(currentVal)) deptSelect.value = currentVal;
    }

    const personaSelect = document.getElementById('filtroAsignacionPersona');
    if (personaSelect) {
      const currentVal = personaSelect.value;
      let html = '<option value="todos">Cualquier Responsable</option>';
      (DataStore.users || []).forEach(u => {
        html += `<option value="${u.id}">${u.nombre} (@${u.username})</option>`;
      });
      personaSelect.innerHTML = html;
      if (currentVal) personaSelect.value = currentVal;
    }
  },

  renderAsignacionInteractivaList() {
    const listContainer = document.getElementById('asignacionInteractivaList');
    const badgeCount = document.getElementById('asignacionLiveCountBadge');
    if (!listContainer) return;

    const estadoFilter = document.getElementById('filtroAsignacionEstado')?.value || 'sin_asignar';
    const deptFilter = document.getElementById('filtroAsignacionDept')?.value || 'todos';
    const personaFilter = document.getElementById('filtroAsignacionPersona')?.value || 'todos';
    const searchQuery = (document.getElementById('filtroAsignacionBuscar')?.value || '').trim().toLowerCase();

    // Filtrado inteligente
    let items = (DataStore.items || []).filter(item => {
      // 1. Estado asignación
      const isSinAsignar = (!item.responsable_id || item.responsable === 'Sin Asignar' || item.responsable_id === 'sin-asignar');
      if (estadoFilter === 'sin_asignar' && !isSinAsignar) return false;
      if (estadoFilter === 'asignadas' && isSinAsignar) return false;

      // 2. Departamento
      if (deptFilter !== 'todos') {
        const itemDep = DataStore.normalizeDependencia ? DataStore.normalizeDependencia(item.dependencia || DataStore.getObraDependencia(item)) : item.dependencia;
        const targetDep = DataStore.normalizeDependencia ? DataStore.normalizeDependencia(deptFilter) : deptFilter;
        if (itemDep !== targetDep) return false;
      }

      // 3. Persona / Responsable actual
      if (personaFilter !== 'todos' && item.responsable_id !== personaFilter) return false;

      // 4. Búsqueda libre
      if (searchQuery) {
        const text = `${item.id} ${item.nombre} ${item.sede} ${item.partida || ''} ${item.responsable || ''} ${item.creado_por || ''} ${item.dependencia || ''}`.toLowerCase();
        if (!text.includes(searchQuery)) return false;
      }

      return true;
    });

    if (badgeCount) {
      badgeCount.innerText = `${items.length} ${items.length === 1 ? 'obra' : 'obras'}`;
    }

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-2xs">
          <div class="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <i data-lucide="check-circle-2" class="w-7 h-7"></i>
          </div>
          <h4 class="font-black text-slate-800 text-sm">¡Al día! No hay obras en este filtro</h4>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">Todas las obras han sido asignadas o no coinciden con los criterios de búsqueda actuales. Cambia de filtro o reasigna según sea necesario.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    // Opciones de usuarios para los selects
    const userOptionsHtml = (DataStore.users || []).map(u => {
      return `<option value="${u.id}">${u.nombre} - ${u.dependencia || u.rol}</option>`;
    }).join('');

    let html = '';
    items.forEach(item => {
      const isSinAsignar = (!item.responsable_id || item.responsable === 'Sin Asignar' || item.responsable_id === 'sin-asignar');
      const montoUSD = item.monto_adjudicado_usd || item.monto_partida_usd || item.monto_total_usd || item.monto_obra_usd || 0;
      const montoFormateado = montoUSD > 0 ? `US$ ${montoUSD.toLocaleString('en-US')}` : 'Sin Monto';

      html += `
        <div id="quick-assign-card-${item.id}" class="quick-assign-card bg-white rounded-xl p-3.5 border border-slate-200 hover:border-amber-300 shadow-2xs transition-all duration-200">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <!-- Datos de la Obra -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 flex-wrap gap-y-1 mb-1">
                <span class="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-amber-400">${item.id}</span>
                <span class="font-bold text-slate-900 text-xs truncate max-w-md" title="${item.nombre}">${item.nombre}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">${item.estado}</span>
                ${item.partida ? `<span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Partida: ${item.partida}</span>` : '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">Sin Partida</span>'}
              </div>

              <div class="flex items-center space-x-2 text-[11px] text-slate-500 flex-wrap gap-y-1">
                <span>📍 <strong>${item.sede}</strong></span>
                <span>•</span>
                <span>🏛️ ${item.dependencia || 'Infraestructura'}</span>
                <span>•</span>
                <span>💰 <strong>${montoFormateado}</strong></span>
                ${item.creado_por ? `<span>•</span><span>Creado por: <strong class="text-slate-700">${item.creado_por}</strong></span>` : ''}
                <span>•</span>
                <span id="label-owner-${item.id}" class="${isSinAsignar ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold'}">
                  ${isSinAsignar ? '⚠️ Sin Asignar' : `Asignado a: <strong>${item.responsable}</strong>`}
                </span>
              </div>
            </div>

            <!-- Selector Rápido de Responsable -->
            <div class="shrink-0 flex items-center space-x-2">
              <div class="text-right hidden sm:block">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asignar a:</div>
              </div>
              <select onchange="App.handleQuickAssignChange('${item.id}', this.value, this)" 
                      class="bg-amber-50/60 hover:bg-amber-100/80 border-2 border-amber-300 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs focus:outline-none transition cursor-pointer">
                <option value="">-- Seleccionar Responsable --</option>
                ${userOptionsHtml}
                <option value="sin-asignar" ${isSinAsignar ? 'selected' : ''}>⚠️ Dejar Sin Asignar</option>
              </select>
            </div>

          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  handleQuickAssignChange(itemId, newUserId, selectEl) {
    if (!newUserId) return; // No seleccionó nada

    const targetUserId = (newUserId === 'sin-asignar') ? null : newUserId;
    const res = DataStore.quickAssignObra(itemId, targetUserId);

    if (!res.success) {
      alert("Error al asignar: " + res.msg);
      selectEl.value = "";
      return;
    }

    const assignedName = res.obra.responsable || 'Sin Asignar';
    this.showToast(`⚡ ${itemId} asignada exitosamente a: ${assignedName}`);

    // Determinar si debe desaparecer de la vista actual
    const estadoFilter = document.getElementById('filtroAsignacionEstado')?.value || 'sin_asignar';
    const personaFilter = document.getElementById('filtroAsignacionPersona')?.value || 'todos';

    let shouldVanish = false;
    if (estadoFilter === 'sin_asignar' && targetUserId !== null) {
      shouldVanish = true;
    } else if (estadoFilter === 'asignadas' && targetUserId === null) {
      shouldVanish = true;
    } else if (personaFilter !== 'todos' && targetUserId !== personaFilter) {
      shouldVanish = true;
    }

    const card = document.getElementById(`quick-assign-card-${itemId}`);
    if (card) {
      if (shouldVanish) {
        // Animación suave de desaparición
        card.classList.add('transition-all', 'duration-300', 'opacity-0', 'scale-95', '-translate-y-2');
        setTimeout(() => {
          card.remove();
          const list = document.getElementById('asignacionInteractivaList');
          const remaining = list ? list.querySelectorAll('.quick-assign-card').length : 0;
          const badgeCount = document.getElementById('asignacionLiveCountBadge');
          if (badgeCount) {
            badgeCount.innerText = `${remaining} ${remaining === 1 ? 'obra' : 'obras'}`;
          }
          if (remaining === 0) {
            App.renderAsignacionInteractivaList();
          }
        }, 300);
      } else {
        // Si permanece visible (ej: vista 'todas'), actualizar labels
        const labelOwner = document.getElementById(`label-owner-${itemId}`);
        if (labelOwner) {
          const isSinAsignar = (!res.obra.responsable_id || res.obra.responsable === 'Sin Asignar');
          labelOwner.className = isSinAsignar ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold';
          labelOwner.innerHTML = isSinAsignar ? '⚠️ Sin Asignar' : `Asignado a: <strong>${res.obra.responsable}</strong>`;
        }
      }
    }
  },

  // ================= INFORME EJECUTIVO CONSOLIDADO Y TABLERO DE DIRECCIÓN =================
  openExecutiveReportModal() {
    const u = DataStore.currentUser;
    if (!u || u.rol !== 'admin') {
      alert("⛔ Acceso Restringido: El Tablero Ejecutivo de Dirección es exclusivo para Dirección General y Administración.");
      return;
    }

    this.renderExecutiveReportContent();
    const modal = document.getElementById('modalExecutiveReport');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  closeExecutiveReportModal() {
    const modal = document.getElementById('modalExecutiveReport');
    if (modal) modal.classList.add('hidden');
  },

  renderExecutiveReportContent() {
    const container = document.getElementById('executiveReportContainer');
    if (!container) return;

    const report = DataStore.getExecutiveReportData();
    const fmt = (n) => {
      const val = parseFloat(n) || 0;
      return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    const maxMesVal = Math.max(...Object.values(report.cashflowEjecucion.mesesTotales), 1);
    const totCartera = report.cashflowEjecucion.totalCarteraUSD || 1;

    let html = `
      <!-- ========================================================================= -->
      <!-- PÁGINA 1: RESUMEN EJECUTIVO & ESTADO GENERAL DE CARTERA                   -->
      <!-- ========================================================================= -->
      <div class="report-page report-page-1 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        <!-- MEMBRETE OFICIAL PÁGINA 1 -->
        <div class="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3.5">
            <img src="img/logo-hospital-italiano-icon.png" alt="Hospital Italiano" class="w-12 h-12 object-contain shrink-0">
            <div>
              <h1 class="text-base font-black text-slate-900 tracking-tight leading-none uppercase">Hospital Italiano de Buenos Aires</h1>
              <h2 class="text-xs font-bold text-blue-900 mt-1">Dirección de Infraestructura y Obras • Dirección General</h2>
              <div class="text-[10px] text-slate-500 font-mono mt-0.5">SISTEMA INTEGRAL DE GESTIÓN DE OBRAS E INVERSIONES (SIGO)</div>
            </div>
          </div>
          <div class="sm:text-right text-xs">
            <div class="flex sm:justify-end items-center space-x-1.5 mb-0.5">
              <span class="bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Confidencial</span>
              <span class="bg-blue-100 text-blue-900 text-[9px] font-bold px-2 py-0.5 rounded-full">Pág 1 de 3 • Resumen General</span>
            </div>
            <div class="text-[11px] text-slate-700">Fecha de Emisión: <strong>${report.fechaEmision}</strong></div>
            <div class="text-[10px] text-slate-500">Emitido por: <strong>${report.emisor}</strong></div>
          </div>
        </div>

        <!-- 4 TARJETAS KPI DE DIRECCIÓN -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 report-page-card">
          
          <!-- KPI 1: Obras en Curso -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 rounded-xl p-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-blue-900 mb-1">
              <span class="font-bold text-[10px] uppercase tracking-wider">Obras en Ejecución</span>
              <i data-lucide="activity" class="w-4 h-4 text-blue-600"></i>
            </div>
            <div class="text-xl font-black text-slate-900">${report.obrasEnCurso.total} <span class="text-xs font-semibold text-slate-500">obras</span></div>
            <div class="text-xs font-bold text-blue-800 mt-0.5">US$ ${fmt(report.obrasEnCurso.montoTotalUSD)}</div>
            <div class="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>Avance Físico Promedio:</span>
              <strong class="text-blue-900">${report.obrasEnCurso.avancePromedio}%</strong>
            </div>
            <div class="w-full bg-blue-200 rounded-full h-1.5 mt-1 overflow-hidden">
              <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${Math.min(100, report.obrasEnCurso.avancePromedio)}%"></div>
            </div>
          </div>

          <!-- KPI 2: Cartera en Estudio de Factibilidad (Total 94) -->
          <div class="bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-amber-900 mb-1">
              <span class="font-bold text-[10px] uppercase tracking-wider">Estudios de Factibilidad</span>
              <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i>
            </div>
            <div class="text-xl font-black text-slate-900">${report.factibilidad ? report.factibilidad.total : report.factibilidadSinPartida.total} <span class="text-xs font-semibold text-slate-500">en estudio</span></div>
            <div class="text-xs font-bold text-amber-800 mt-0.5">US$ ${fmt(report.factibilidad ? report.factibilidad.montoTotalUSD : report.factibilidadSinPartida.montoTotalUSD)} <span class="text-[9px] font-normal text-slate-500">(solicitado total)</span></div>
            <div class="mt-2 text-[10px] space-y-0.5 border-t border-amber-200/60 pt-1">
              <div class="flex justify-between text-amber-900">
                <span>Sin Partida (Pendiente):</span>
                <strong>${report.factibilidad ? report.factibilidad.sinPartidaCount : report.factibilidadSinPartida.total} (US$ ${fmt(report.factibilidad ? report.factibilidad.sinPartidaUSD : report.factibilidadSinPartida.montoTotalUSD)})</strong>
              </div>
              <div class="flex justify-between text-emerald-800">
                <span>Con Partida Asignada:</span>
                <strong>${report.factibilidad ? report.factibilidad.conPartidaCount : 0} (US$ ${fmt(report.factibilidad ? report.factibilidad.conPartidaUSD : 0)})</strong>
              </div>
            </div>
          </div>

          <!-- KPI 3: Desvíos Presupuestarios en Partidas -->
          <div class="bg-gradient-to-br from-rose-50 to-pink-50/70 border border-rose-200 rounded-xl p-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-rose-900 mb-1">
              <span class="font-bold text-[10px] uppercase tracking-wider">Desvíos Presupuestarios</span>
              <i data-lucide="trending-down" class="w-4 h-4 text-rose-600"></i>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-black text-rose-700 leading-tight">-${fmt(report.partidasDesvios.totalDeficitUSD)} USD</div>
                <div class="text-[10px] text-slate-500 font-medium">${report.partidasDesvios.totalSobreEjecutadas} partidas con déficit</div>
              </div>
              <div class="text-right">
                <div class="text-xs font-bold text-emerald-700 leading-tight">+${fmt(report.partidasDesvios.totalSuperavitUSD)} USD</div>
                <div class="text-[10px] text-slate-500 font-medium">${report.partidasDesvios.totalSubEjecutadas} con remanente</div>
              </div>
            </div>
            <div class="mt-2 text-[10px] text-slate-500 border-t border-rose-200/60 pt-1 flex justify-between">
              <span>Partidas con ajuste requerido:</span>
              <strong class="text-rose-900">${report.partidasDesvios.totalSobreEjecutadas + report.partidasDesvios.totalSubEjecutadas}</strong>
            </div>
          </div>

          <!-- KPI 4: Obras Suspendidas (Capital Inmovilizado) -->
          <div class="bg-gradient-to-br from-slate-100 to-slate-200/60 border border-slate-300 rounded-xl p-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-slate-700 mb-1">
              <span class="font-bold text-[10px] uppercase tracking-wider">Obras Suspendidas</span>
              <i data-lucide="pause-circle" class="w-4 h-4 text-slate-600"></i>
            </div>
            <div class="text-xl font-black text-slate-900">${report.obrasSuspendidas.total} <span class="text-xs font-semibold text-slate-500">en pausa</span></div>
            <div class="text-xs font-bold text-slate-700 mt-0.5">US$ ${fmt(report.obrasSuspendidas.montoTotalUSD)}</div>
            <div class="mt-2 text-[10px] bg-slate-200/80 text-slate-700 font-semibold px-2 py-0.5 rounded flex items-center space-x-1">
              <i data-lucide="lock" class="w-3 h-3 text-slate-500 shrink-0"></i>
              <span>Capital inmovilizado en cartera</span>
            </div>
          </div>

        </div>

        <!-- 3 CUADRANTES DE CONTROL EJECUTIVO -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 report-page-card">

          <!-- CUADRANTE 1: OBRAS EN CURSO (EJECUCIÓN ACTIVA) -->
          <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <h3 class="font-black text-xs text-slate-900 flex items-center space-x-1.5">
                  <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Obras en Ejecución Activa (${report.obrasEnCurso.total})</span>
                </h3>
                <span class="text-[10px] font-bold text-blue-700 font-mono">Total: US$ ${fmt(report.obrasEnCurso.montoTotalUSD)}</span>
              </div>

              <div class="overflow-x-auto max-h-[200px] overflow-y-auto">
                <table class="w-full text-[11px] text-left">
                  <thead class="bg-slate-200/60 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th class="py-1 px-1.5">Cód</th>
                      <th class="py-1 px-1.5">Proyecto & Proveedor</th>
                      <th class="py-1 px-1.5">Sede</th>
                      <th class="py-1 px-1.5 text-right">Inversión USD</th>
                      <th class="py-1 px-1.5 text-center">Avance</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    ${report.obrasEnCurso.items.length === 0 ? `
                      <tr><td colspan="5" class="py-3 text-center text-slate-400">No hay obras en curso actualmente</td></tr>
                    ` : report.obrasEnCurso.items.slice(0, 6).map(item => `
                      <tr class="hover:bg-white transition">
                        <td class="py-1 px-1.5 font-mono font-bold text-blue-700">${item.id}</td>
                        <td class="py-1 px-1.5">
                          <div class="font-bold text-slate-800 max-w-[170px] truncate" title="${item.nombre}">${item.nombre}</div>
                          <div class="text-[9px] text-slate-500 truncate">${item.proveedor || 'Sin adjudicar'}</div>
                        </td>
                        <td class="py-1 px-1.5 text-slate-600">${item.sede}</td>
                        <td class="py-1 px-1.5 text-right font-mono font-bold text-slate-900">$${fmt(item.monto_adjudicado_usd || item.monto_total_usd || 0)}</td>
                        <td class="py-1 px-1.5 text-center">
                          <span class="font-bold text-[10px] text-slate-700">${item.avance_fisico || 0}%</span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            ${report.obrasEnCurso.items.length > 6 ? `
              <div class="text-[10px] text-slate-400 text-right pt-1 mt-1 border-t border-slate-200">Mostrando 6 de ${report.obrasEnCurso.items.length} obras activas. Ver tabla completa en Pág. 2 y XLSX.</div>
            ` : ''}
          </div>

          <!-- CUADRANTE 2: CARTERA EN ESTUDIO DE FACTIBILIDAD -->
          <div class="border border-amber-200 rounded-xl p-3.5 bg-amber-50/30 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                <h3 class="font-black text-xs text-amber-950 flex items-center space-x-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Cartera en Factibilidad (${report.factibilidad ? report.factibilidad.total : report.factibilidadSinPartida.total})</span>
                </h3>
                <span class="text-[10px] font-bold text-amber-800 font-mono">Solicitado: US$ ${fmt(report.factibilidad ? report.factibilidad.montoTotalUSD : report.factibilidadSinPartida.montoTotalUSD)}</span>
              </div>

              <div class="overflow-x-auto max-h-[200px] overflow-y-auto">
                <table class="w-full text-[11px] text-left">
                  <thead class="bg-amber-100/60 text-amber-900 font-bold sticky top-0">
                    <tr>
                      <th class="py-1 px-1.5">Cód</th>
                      <th class="py-1 px-1.5">Solicitud</th>
                      <th class="py-1 px-1.5">Sede</th>
                      <th class="py-1 px-1.5">Partida</th>
                      <th class="py-1 px-1.5 text-center">Criticidad</th>
                      <th class="py-1 px-1.5 text-right">Estimado USD</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-amber-100">
                    ${(() => {
                      const list = (report.factibilidad ? report.factibilidad.items : report.factibilidadSinPartida.items);
                      if (!list || list.length === 0) {
                        return `<tr><td colspan="6" class="py-3 text-center text-slate-400">No hay factibilidades en cartera</td></tr>`;
                      }
                      const sorted = [...list].sort((a, b) => {
                        const aPart = DataStore.hasValidPartida(a) && a.monto_partida_usd > 0 ? 1 : 0;
                        const bPart = DataStore.hasValidPartida(b) && b.monto_partida_usd > 0 ? 1 : 0;
                        if (bPart !== aPart) return bPart - aPart;
                        return (b.monto_total_usd || b.monto_obra_usd || 0) - (a.monto_total_usd || a.monto_obra_usd || 0);
                      });
                      return sorted.slice(0, 6).map(item => {
                        const hasPart = DataStore.hasValidPartida(item) && item.monto_partida_usd > 0;
                        return `
                          <tr class="hover:bg-white transition">
                            <td class="py-1 px-1.5 font-mono font-bold text-amber-700">${item.id}</td>
                            <td class="py-1 px-1.5 font-bold text-slate-800 max-w-[130px] truncate" title="${item.nombre}">${item.nombre}</td>
                            <td class="py-1 px-1.5 text-slate-600">${item.sede}</td>
                            <td class="py-1 px-1.5">
                              ${hasPart 
                                ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Part. ${item.partida}</span>` 
                                : `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-800">Sin Partida</span>`}
                            </td>
                            <td class="py-1 px-1.5 text-center">
                              <span class="font-bold text-[10px] ${item.prioridad_medica_ponderada_default ? 'text-amber-700' : 'text-blue-700'}">
                                ${item.prioridad_medica || item.prioridad_tecnica || 3}★ ${item.prioridad_medica_ponderada_default ? '(Def)' : ''}
                              </span>
                            </td>
                            <td class="py-1 px-1.5 text-right font-mono font-bold text-amber-900">$${fmt(item.monto_total_usd || item.monto_obra_usd || 0)}</td>
                          </tr>
                        `;
                      }).join('');
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="text-[10px] text-slate-600 font-medium pt-1 mt-1 border-t border-amber-200 flex justify-between items-center">
              <span class="text-amber-800 font-semibold">⚠️ ${report.factibilidad ? report.factibilidad.sinPartidaCount : report.factibilidadSinPartida.total} sin partida (pendiente Dirección)</span>
              <span class="text-emerald-800 font-bold">✓ ${report.factibilidad ? report.factibilidad.conPartidaCount : 0} con partida asignada</span>
            </div>
          </div>

        </div>

        <!-- AUDITORÍA DE PARTIDAS: CUADRANTE INFERIOR DE PÁGINA 1 -->
        <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 report-page-card">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <h3 class="font-black text-xs text-slate-900 flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Auditoría de Desvíos Presupuestarios en Partidas (${report.partidasDesvios.totalSobreEjecutadas + report.partidasDesvios.totalSubEjecutadas} identificadas)</span>
            </h3>
            <span class="text-[10px] font-bold ${report.partidasDesvios.balanceNetoUSD >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
              Balance Neto: ${report.partidasDesvios.balanceNetoUSD >= 0 ? '+' : ''}$${fmt(report.partidasDesvios.balanceNetoUSD)} USD
            </span>
          </div>

          <div class="overflow-x-auto max-h-[160px] overflow-y-auto">
            <table class="w-full text-[11px] text-left">
              <thead class="bg-slate-200/60 text-slate-600 font-bold sticky top-0">
                <tr>
                  <th class="py-1 px-1.5">Partida</th>
                  <th class="py-1 px-1.5">Obra / Proyecto</th>
                  <th class="py-1 px-1.5">Estado</th>
                  <th class="py-1 px-1.5 text-right">Asignado USD</th>
                  <th class="py-1 px-1.5 text-right">Requerido USD</th>
                  <th class="py-1 px-1.5 text-right">Desvío USD</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${(report.partidasDesvios.sobreEjecutadas.concat(report.partidasDesvios.subEjecutadas)).length === 0 ? `
                  <tr><td colspan="6" class="py-3 text-center text-slate-400">Todas las partidas coinciden exactamente con el costo requerido</td></tr>
                ` : (report.partidasDesvios.sobreEjecutadas.concat(report.partidasDesvios.subEjecutadas)).slice(0, 5).map(item => {
                  const isDeficit = item.deficit_usd > 0;
                  return `
                    <tr class="hover:bg-white transition">
                      <td class="py-1 px-1.5 font-mono font-bold text-slate-700">${item.partida}</td>
                      <td class="py-1 px-1.5 font-semibold text-slate-800 max-w-[200px] truncate" title="${item.nombre}">${item.id} - ${item.nombre}</td>
                      <td class="py-1 px-1.5 text-slate-500">${item.estado}</td>
                      <td class="py-1 px-1.5 text-right font-mono text-slate-600">$${fmt(item.monto_partida_usd)}</td>
                      <td class="py-1 px-1.5 text-right font-mono text-slate-600">$${fmt(item.costo_requerido_usd)}</td>
                      <td class="py-1 px-1.5 text-right font-mono font-bold ${isDeficit ? 'text-rose-600' : 'text-emerald-600'}">
                        ${isDeficit ? `-$${fmt(item.deficit_usd)}` : `+$${fmt(item.superavit_usd)}`}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="text-[10px] text-slate-500 pt-1 mt-1 border-t border-slate-200 flex justify-between">
            <span class="text-rose-700 font-bold">Rojo: Partida Corta (Requiere Ampliación)</span>
            <span class="text-emerald-700 font-bold">Verde: Remanente Presupuestario Liberable</span>
          </div>
        </div>

        <!-- PIE INSTITUCIONAL PÁGINA 1 -->
        <div class="pt-3 mt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-3 report-page-card">
          <div class="flex items-center space-x-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
            <span>SIGO HIBA • Documento de auditoría oficial • Pág. 1 de 3: Resumen Ejecutivo</span>
          </div>
          <div class="flex items-center space-x-6 text-slate-700 font-semibold">
            <div class="border-t border-slate-400 pt-0.5 w-32 text-center text-[9px]">Dir. Infraestructura</div>
            <div class="border-t border-slate-400 pt-0.5 w-32 text-center text-[9px]">Dirección General</div>
          </div>
        </div>

      </div>

      <!-- SALTO DE PÁGINA A4 PARA PDF E IMPRESIÓN -->
      <div class="html2pdf__page-break my-6 border-b-2 border-dashed border-slate-300"></div>

      <!-- ========================================================================= -->
      <!-- PÁGINA 2: CASH FLOW OFICIAL DE OBRAS EN CURSO (01/04 A 31/03)              -->
      <!-- ========================================================================= -->
      <div class="report-page report-page-2 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        <!-- MEMBRETE OFICIAL PÁGINA 2 -->
        <div class="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3.5">
            <img src="img/logo-hospital-italiano-icon.png" alt="Hospital Italiano" class="w-12 h-12 object-contain shrink-0">
            <div>
              <h1 class="text-base font-black text-slate-900 tracking-tight leading-none uppercase">Hospital Italiano de Buenos Aires</h1>
              <h2 class="text-xs font-bold text-blue-900 mt-1">Dirección de Finanzas & Dirección de Infraestructura</h2>
              <div class="text-[10px] text-slate-500 font-mono mt-0.5">CASH FLOW OFICIAL DE OBRAS EN CURSO • EJERCICIO CONTABLE ${report.accountingInfo.label} (01/04/${report.accountingInfo.startYear} - 31/03/${report.accountingInfo.endYear})</div>
            </div>
          </div>
          <div class="sm:text-right text-xs">
            <div class="flex sm:justify-end items-center space-x-1.5 mb-0.5">
              <span class="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Flujo Oficial</span>
              <span class="bg-teal-100 text-teal-900 text-[9px] font-bold px-2 py-0.5 rounded-full">Pág 2 de 3 • Cash Flow Contable</span>
            </div>
            <div class="text-[11px] text-slate-700">Cartera: <strong>${report.cashflowEjecucion.totalObras} obras activas en curso</strong></div>
            <div class="text-[10px] text-slate-500">Excluye factibilidades y obras suspendidas</div>
          </div>
        </div>

        <!-- 4 KPIS FINANCIEROS DEL CASH FLOW -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 report-page-card">
          
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 rounded-xl p-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-blue-900 mb-1">
              <span class="font-bold text-[10px] uppercase tracking-wider">Cartera en Ejecución</span>
              <i data-lucide="activity" class="w-4 h-4 text-blue-600"></i>
            </div>
            <div class="text-xl font-black text-slate-900">US$ ${fmt(report.cashflowEjecucion.totalCarteraUSD)}</div>
            <div class="text-[10px] text-blue-700 font-semibold mt-1">${report.cashflowEjecucion.totalObras} contratos vigentes adjudicados</div>
          </div>

          <div class="bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-emerald-900 mb-1">
              <span class="font-bold text-[10px] uppercase tracking-wider">Ejercicio ${report.accountingInfo.label} (01/04 - 31/03)</span>
              <i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i>
            </div>
            <div class="text-xl font-black text-emerald-950">US$ ${fmt(report.cashflowEjecucion.totalEjercicioActualUSD)}</div>
            <div class="text-[10px] text-emerald-800 font-semibold mt-1 flex justify-between">
              <span>Pagado: <strong class="text-blue-800">$${fmt(report.cashflowEjecucion.totalYaPagadoUSD)}</strong></span>
              <span>Proyectado: <strong class="text-teal-800">$${fmt(report.cashflowEjecucion.totalProyectadoUSD)}</strong></span>
            </div>
          </div>

          <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-amber-900 mb-1">
              <span class="font-bold text-[10px] uppercase tracking-wider">Total Anticipos OC (Mes 1)</span>
              <i data-lucide="badge-percent" class="w-4 h-4 text-amber-600"></i>
            </div>
            <div class="text-xl font-black text-amber-950">US$ ${fmt(report.cashflowEjecucion.totalAnticiposUSD)}</div>
            <div class="text-[10px] text-amber-700 font-medium mt-1">Saldo de $${fmt(report.cashflowEjecucion.totalSaldoUSD)} prorrateado en cuotas</div>
          </div>

          <div class="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-purple-900 mb-1">
              <span class="font-bold text-[10px] uppercase tracking-wider">Arrastre Ejercicios Futuros</span>
              <i data-lucide="fast-forward" class="w-4 h-4 text-purple-600"></i>
            </div>
            <div class="text-xl font-black text-purple-950">US$ ${fmt(report.cashflowEjecucion.totalEjerciciosSiguientesUSD)}</div>
            <div class="text-[10px] text-purple-700 font-medium mt-1">Compromisos plurianuales post-31/03</div>
          </div>

        </div>

        <!-- GRÁFICO DE 12 BARRAS MENSUALES (ABRIL A MARZO) -->
        <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 mb-4 report-page-card">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
            <div class="flex items-center space-x-2">
              <i data-lucide="bar-chart-3" class="w-4 h-4 text-blue-600"></i>
              <span class="text-xs font-bold text-slate-800">Curva de Caída del Gasto de Inversiones • Ejercicio Contable ${report.accountingInfo.label} (12 Meses)</span>
            </div>
            <div class="flex items-center space-x-3 text-[11px]">
              <span class="inline-flex items-center space-x-1 text-blue-800 font-semibold">
                <span class="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block"></span>
                <span>Ya Pagado: <strong>US$ ${fmt(report.cashflowEjecucion.totalYaPagadoUSD)}</strong></span>
              </span>
              <span class="inline-flex items-center space-x-1 text-teal-800 font-semibold">
                <span class="w-2.5 h-2.5 rounded-xs bg-teal-500 inline-block"></span>
                <span>Proyectado a Pagar: <strong>US$ ${fmt(report.cashflowEjecucion.totalProyectadoUSD)}</strong></span>
              </span>
            </div>
          </div>

          <div class="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
            ${report.accountingInfo.meses.map(m => {
              const val = report.cashflowEjecucion.mesesTotales[m.key] || 0;
              const pct = Math.min(100, Math.max(8, Math.round((val / maxMesVal) * 100)));
              const barBg = m.isPast ? 'bg-blue-600' : 'bg-teal-500';
              const badgeBg = m.isPast ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800';
              const statusLabel = m.isPast ? 'Pagado' : 'Proy.';

              return `
                <div class="flex flex-col items-center bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs">
                  <span class="text-[10px] font-bold text-slate-700 uppercase">${m.label}</span>
                  <span class="text-[8px] font-mono text-slate-400">${m.year}</span>
                  
                  <div class="w-full bg-slate-100 rounded-sm h-14 flex items-end my-1 p-0.5">
                    <div class="w-full ${barBg} rounded-xs transition-all duration-300" style="height: ${pct}%" title="${m.label} ${m.year}: US$ ${fmt(val)}"></div>
                  </div>

                  <span class="text-[9px] font-bold font-mono text-slate-900 leading-none">$${fmt(val)}</span>
                  <span class="text-[7px] font-semibold px-1 rounded mt-1 ${badgeBg}">${statusLabel}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- TABLA DETALLADA DE CASH FLOW POR OBRA EN CURSO -->
        <div class="border border-slate-200 rounded-xl p-3 bg-white report-page-card">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <h3 class="font-black text-xs text-slate-900 flex items-center space-x-1.5">
              <i data-lucide="layers" class="w-4 h-4 text-slate-600"></i>
              <span>Detalle Contractual y Flujo por Obra en Curso (${report.cashflowEjecucion.displayList.length} proyectos)</span>
            </h3>
            <span class="text-[10px] text-slate-500">Anticipos absorbidos en Mes 1 • Saldo distribuido en meses restantes</span>
          </div>

          <div class="overflow-x-auto max-h-[220px] overflow-y-auto">
            <table class="w-full text-left text-[11px] border-collapse">
              <thead class="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                <tr>
                  <th class="py-1.5 px-2">Cód</th>
                  <th class="py-1.5 px-2">Proyecto & Contratista</th>
                  <th class="py-1.5 px-2">Sede</th>
                  <th class="py-1.5 px-2 text-right">Monto OC</th>
                  <th class="py-1.5 px-2 text-center">Anticipo OC</th>
                  <th class="py-1.5 px-2 text-center">Plazo</th>
                  <th class="py-1.5 px-2 text-right">Ejercicio ${report.accountingInfo.label}</th>
                  <th class="py-1.5 px-2 text-right">Ej. Siguientes</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${report.cashflowEjecucion.displayList.slice(0, 8).map(entry => {
                  const x = entry.item;
                  const cf = entry.cf;
                  return `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="py-1 px-2 font-mono font-bold text-blue-700">${x.id}</td>
                      <td class="py-1 px-2">
                        <div class="font-bold text-slate-800 max-w-[180px] truncate" title="${x.nombre}">${x.nombre}</div>
                        <div class="text-[9px] text-slate-500 font-medium">${x.proveedor || 'Sin contratista registrado'}</div>
                      </td>
                      <td class="py-1 px-2 text-slate-600">${x.sede}</td>
                      <td class="py-1 px-2 text-right font-mono font-bold text-slate-900">$${fmt(cf.montoTotalUSD)}</td>
                      <td class="py-1 px-2 text-center">
                        <span class="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[9px]">
                          ${cf.anticipoPct}% ($${fmt(cf.anticipoUSD)})
                        </span>
                      </td>
                      <td class="py-1 px-2 text-center font-medium text-slate-700">
                        ${cf.duracionMeses} m
                      </td>
                      <td class="py-1 px-2 text-right font-mono font-bold text-slate-900">
                        <div>$${fmt(cf.ejercicioActualUSD)}</div>
                        <div class="text-[9px] font-normal text-slate-500">Pag: $${fmt(cf.ejercicioActualPagadoUSD)} | Proy: $${fmt(cf.ejercicioActualProyectadoUSD)}</div>
                      </td>
                      <td class="py-1 px-2 text-right font-mono font-bold text-purple-700">
                        ${cf.ejerciciosSiguientesUSD > 0 ? `$${fmt(cf.ejerciciosSiguientesUSD)}` : '-'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr class="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                  <td colspan="3" class="py-2 px-2 uppercase text-[10px]">TOTALES OFICIALES (${report.cashflowEjecucion.totalObras} obras)</td>
                  <td class="py-2 px-2 text-right font-black">$${fmt(report.cashflowEjecucion.totalCarteraUSD)}</td>
                  <td class="py-2 px-2 text-center text-amber-900 font-black">$${fmt(report.cashflowEjecucion.totalAnticiposUSD)}</td>
                  <td class="py-2 px-2 text-center text-slate-500 text-[10px]">Saldo: $${fmt(report.cashflowEjecucion.totalSaldoUSD)}</td>
                  <td class="py-2 px-2 text-right font-black text-emerald-900">$${fmt(report.cashflowEjecucion.totalEjercicioActualUSD)}</td>
                  <td class="py-2 px-2 text-right font-black text-purple-900">$${fmt(report.cashflowEjecucion.totalEjerciciosSiguientesUSD)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          ${report.cashflowEjecucion.displayList.length > 8 ? `
            <div class="text-[10px] text-slate-400 text-right pt-1 mt-1 border-t border-slate-200">Mostrando 8 de ${report.cashflowEjecucion.displayList.length} obras en ejecución. Detalle completo disponible en el módulo interactivo y XLSX.</div>
          ` : ''}
        </div>

        <!-- PIE INSTITUCIONAL PÁGINA 2 -->
        <div class="pt-3 mt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-3 report-page-card">
          <div class="flex items-center space-x-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
            <span>SIGO HIBA • Período Contable 01/04 - 31/03 • Pág. 2 de 3: Cash Flow Oficial</span>
          </div>
          <div class="flex items-center space-x-6 text-slate-700 font-semibold">
            <div class="border-t border-slate-400 pt-0.5 w-32 text-center text-[9px]">Dir. Finanzas</div>
            <div class="border-t border-slate-400 pt-0.5 w-32 text-center text-[9px]">Dirección General</div>
          </div>
        </div>

      </div>

      <!-- SALTO DE PÁGINA A4 PARA PDF E IMPRESIÓN -->
      <div class="html2pdf__page-break my-6 border-b-2 border-dashed border-slate-300"></div>

      <!-- ========================================================================= -->
      <!-- PÁGINA 3: PLANIFICACIÓN PLURIANUAL, ANÁLISIS TERRITORIAL Y FIRMAS          -->
      <!-- ========================================================================= -->
      <div class="report-page report-page-3 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        <!-- MEMBRETE OFICIAL PÁGINA 3 -->
        <div class="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3.5">
            <img src="img/logo-hospital-italiano-icon.png" alt="Hospital Italiano" class="w-12 h-12 object-contain shrink-0">
            <div>
              <h1 class="text-base font-black text-slate-900 tracking-tight leading-none uppercase">Hospital Italiano de Buenos Aires</h1>
              <h2 class="text-xs font-bold text-blue-900 mt-1">Comité Directivo • Auditoría y Control de Gestión</h2>
              <div class="text-[10px] text-slate-500 font-mono mt-0.5">PLANIFICACIÓN PLURIANUAL, ANÁLISIS TERRITORIAL Y DICTAMEN DE CERTIFICACIÓN</div>
            </div>
          </div>
          <div class="sm:text-right text-xs">
            <div class="flex sm:justify-end items-center space-x-1.5 mb-0.5">
              <span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Auditoría Final</span>
              <span class="bg-purple-100 text-purple-900 text-[9px] font-bold px-2 py-0.5 rounded-full">Pág 3 de 3 • Certificación</span>
            </div>
            <div class="text-[11px] text-slate-700">Estado de Cartera: <strong>Consolidada</strong></div>
            <div class="text-[10px] text-slate-500">Dictamen con validez ejecutiva</div>
          </div>
        </div>

        <!-- 4 BLOQUES DE ANÁLISIS ESTRATÉGICO -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 report-page-card">

          <!-- BLOQUE 1: ANÁLISIS TERRITORIAL (SEDES) -->
          <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <h3 class="font-black text-xs text-slate-900 flex items-center space-x-1.5">
                <i data-lucide="map-pin" class="w-4 h-4 text-blue-600"></i>
                <span>Distribución Territorial por Sede (En Ejecución)</span>
              </h3>
              <span class="text-[10px] font-bold text-slate-500">100% Cartera</span>
            </div>

            <div class="space-y-2.5 pt-1">
              ${['Central', 'San Justo', 'Periféricos'].map(s => {
                const val = report.desgloseSedes[s] || 0;
                const pct = Math.round((val / totCartera) * 100);
                return `
                  <div>
                    <div class="flex justify-between text-[11px] mb-0.5 font-bold">
                      <span class="text-slate-700">Sede ${s}</span>
                      <span class="text-slate-900 font-mono">US$ ${fmt(val)} <span class="text-slate-400 font-normal">(${pct}%)</span></span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div class="bg-blue-600 h-2 rounded-full" style="width: ${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- BLOQUE 2: ESPECIALIDAD / MÓDULO -->
          <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <h3 class="font-black text-xs text-slate-900 flex items-center space-x-1.5">
                <i data-lucide="layers" class="w-4 h-4 text-purple-600"></i>
                <span>Distribución por Especialidad / Módulo</span>
              </h3>
              <span class="text-[10px] font-bold text-slate-500">Civil vs Infra</span>
            </div>

            <div class="space-y-2.5 pt-1">
              ${[
                { label: 'Obras Civiles (Edilicias / Arquitectura)', key: 'Obra Civil', color: 'bg-blue-600' },
                { label: 'Infraestructura (Electromecánica / Gases / Redes)', key: 'Infraestructura', color: 'bg-purple-600' }
              ].map(m => {
                const val = report.desgloseModulos[m.key] || 0;
                const pct = Math.round((val / totCartera) * 100);
                return `
                  <div>
                    <div class="flex justify-between text-[11px] mb-0.5 font-bold">
                      <span class="text-slate-700">${m.label}</span>
                      <span class="text-slate-900 font-mono">US$ ${fmt(val)} <span class="text-slate-400 font-normal">(${pct}%)</span></span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div class="${m.color} h-2 rounded-full" style="width: ${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- BLOQUE 3: CONTROL DE SEMÁFOROS Y PLAZOS CONTRACTUALES -->
          <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <h3 class="font-black text-xs text-slate-900 flex items-center space-x-1.5">
                <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i>
                <span>Semáforos de Plazos Contractuales</span>
              </h3>
              <span class="text-[10px] text-slate-500">Alerta 15% final</span>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-1 text-center">
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                <span class="text-[10px] font-bold text-emerald-800 uppercase block">En Plazo</span>
                <span class="text-lg font-black text-emerald-950">${report.semaforos.en_plazo}</span>
                <span class="text-[9px] text-emerald-600 block">Cronograma OK</span>
              </div>
              <div class="bg-amber-50 border border-amber-200 rounded-lg p-2">
                <span class="text-[10px] font-bold text-amber-800 uppercase block">Por Vencer</span>
                <span class="text-lg font-black text-amber-950">${report.semaforos.por_vencer}</span>
                <span class="text-[9px] text-amber-700 block">Último 15% plazo</span>
              </div>
              <div class="bg-rose-50 border border-rose-200 rounded-lg p-2">
                <span class="text-[10px] font-bold text-rose-800 uppercase block">Vencidos</span>
                <span class="text-lg font-black text-rose-950">${report.semaforos.vencido}</span>
                <span class="text-[9px] text-rose-700 block">Excedieron fecha</span>
              </div>
            </div>
          </div>

          <!-- BLOQUE 4: IMPACTO PLURIANUAL DE LA CARTERA -->
          <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <h3 class="font-black text-xs text-slate-900 flex items-center space-x-1.5">
                <i data-lucide="trending-up" class="w-4 h-4 text-emerald-600"></i>
                <span>Impacto Plurianual de Inversiones</span>
              </h3>
              <span class="text-[10px] font-bold text-slate-500">Ejercicio vs Arrastre</span>
            </div>

            <div class="space-y-2 pt-1 text-[11px]">
              <div class="flex justify-between font-bold">
                <span class="text-slate-700">Ejercicio Actual (${report.accountingInfo.label}):</span>
                <span class="text-emerald-800 font-mono">US$ ${fmt(report.cashflowEjecucion.totalEjercicioActualUSD)} (${Math.round((report.cashflowEjecucion.totalEjercicioActualUSD / totCartera) * 100)}%)</span>
              </div>
              <div class="flex justify-between font-bold">
                <span class="text-slate-700">Arrastre Ejercicios Siguientes (Post-31/03):</span>
                <span class="text-purple-800 font-mono">US$ ${fmt(report.cashflowEjecucion.totalEjerciciosSiguientesUSD)} (${Math.round((report.cashflowEjecucion.totalEjerciciosSiguientesUSD / totCartera) * 100)}%)</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex mt-2">
                <div class="bg-emerald-600 h-2.5" style="width: ${Math.round((report.cashflowEjecucion.totalEjercicioActualUSD / totCartera) * 100)}%"></div>
                <div class="bg-purple-600 h-2.5" style="width: ${Math.round((report.cashflowEjecucion.totalEjerciciosSiguientesUSD / totCartera) * 100)}%"></div>
              </div>
            </div>
          </div>

        </div>

        <!-- DICTAMEN FORMAL DE CERTIFICACIÓN INSTITUCIONAL -->
        <div class="border-2 border-slate-800 rounded-xl p-4 bg-slate-50 mb-4 report-page-card">
          <div class="flex items-center space-x-2 text-slate-900 font-black text-xs mb-1 uppercase tracking-wider">
            <i data-lucide="award" class="w-4 h-4 text-blue-700"></i>
            <span>Dictamen Oficial de Auditoría y Certificación de Inversiones</span>
          </div>
          <p class="text-[11px] text-slate-700 leading-relaxed text-justify">
            Se certifica formalmente que el presente informe de 3 páginas emitido por el <strong>Sistema Integral de Gestión de Obras (SIGO HIBA)</strong> consolida fielmente la totalidad de obras activas en curso valuadas en <strong>US$ ${fmt(report.cashflowEjecucion.totalCarteraUSD)}</strong>, con una afectación financiera para el ejercicio contable oficial <strong>${report.accountingInfo.label}</strong> (01/04 al 31/03) por <strong>US$ ${fmt(report.cashflowEjecucion.totalEjercicioActualUSD)}</strong>, y un arrastre para ejercicios subsiguientes por <strong>US$ ${fmt(report.cashflowEjecucion.totalEjerciciosSiguientesUSD)}</strong>. Los anticipos pactados en órdenes de compra y los saldos mensuales fueron distribuidos según las pautas contractuales de la Institución.
          </p>
        </div>

        <!-- CASILLEROS DE FIRMAS FORMALES -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 pb-2 report-page-card">
          <div class="border-t-2 border-slate-700 pt-2 text-center">
            <div class="text-xs font-bold text-slate-900">Control Presupuestario & Partidas</div>
            <div class="text-[10px] text-slate-500">Dirección de Infraestructura</div>
            <div class="text-[9px] text-slate-400 font-mono mt-2">Firma y Sello</div>
          </div>
          <div class="border-t-2 border-slate-700 pt-2 text-center">
            <div class="text-xs font-bold text-slate-900">Dirección de Compras & Contrataciones</div>
            <div class="text-[10px] text-slate-500">Administración General</div>
            <div class="text-[9px] text-slate-400 font-mono mt-2">Firma y Sello</div>
          </div>
          <div class="border-t-2 border-slate-700 pt-2 text-center">
            <div class="text-xs font-bold text-slate-900">Dirección General / Consejo Directivo</div>
            <div class="text-[10px] text-slate-500">Hospital Italiano de Buenos Aires</div>
            <div class="text-[9px] text-slate-400 font-mono mt-2">Firma y Sello</div>
          </div>
        </div>

        <!-- PIE INSTITUCIONAL PÁGINA 3 -->
        <div class="pt-3 mt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-3 report-page-card">
          <div class="flex items-center space-x-2">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
            <span>SIGO HIBA • Documento oficial auditado • Pág. 3 de 3: Planificación, Auditoría y Firmas</span>
          </div>
          <div class="text-[9px] text-slate-400 font-mono">
            ID Emisión: HIBA-DIR-${report.accountingInfo.startYear}-${new Date().getTime().toString().slice(-6)}
          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  downloadExecutiveExcel() {
    try {
      const report = DataStore.getExecutiveReportData();
      DataStore.exportExecutiveReportToExcel(report);
      this.showToast('📊 Reporte Ejecutivo exportado con éxito a Excel');
    } catch (e) {
      console.error(e);
      alert("Error exportando a Excel: " + e.message);
    }
  },

  downloadExecutivePDF() {
    const element = document.getElementById('executiveReportContainer');
    if (!element) return;

    if (typeof html2pdf === 'undefined') {
      window.print();
      return;
    }

    this.showToast('⏳ Generando PDF Oficial del Informe Ejecutivo (3 Páginas A4)...');
    const opt = {
      margin:       [4, 6, 4, 6],
      filename:     `Informe_Ejecutivo_Direccion_HIBA_3Paginas_${new Date().toISOString().slice(0, 10)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak:    { mode: ['css', 'legacy'], after: '.report-page', avoid: '.report-page-card' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      App.showToast('✅ PDF Oficial de 3 Páginas descargado correctamente.');
    }).catch(err => {
      console.error('Error generando PDF:', err);
      window.print();
    });
  },

  // ================= MODAL: EDITAR PERMISOS =================
  openEditPermissionsModal(userId) {
    const user = DataStore.users.find(x => x.id === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.nombre_pila || user.nombre || '';
    if (document.getElementById('editUserApellido')) {
      document.getElementById('editUserApellido').value = user.apellido || '';
    }
    document.getElementById('editUserUsername').value = `@${user.username || ''}`;
    document.getElementById('editUserEmail').value = user.email || '';
    if (document.getElementById('editUserDependencia')) {
      const depVal = DataStore.normalizeDependencia ? DataStore.normalizeDependencia(user.dependencia) : user.dependencia;
      document.getElementById('editUserDependencia').value = depVal || 'Departamento de Proyectos Central';
    }
    document.getElementById('editUserSede').value = user.sede || 'Central';
    document.getElementById('editUserRol').value = user.rol || 'pm_obra';

    document.getElementById('editUserPuedeCrear').checked = Boolean(user.puede_crear);
    document.getElementById('editUserPuedeAvanzar').checked = Boolean(user.puede_avanzar);
    document.getElementById('editUserPuedeMedica').checked = Boolean(user.puede_priorizar_medica);
    document.getElementById('editUserPuedePartida').checked = Boolean(user.puede_asignar_partida);
    document.getElementById('editUserSoloLectura').checked = Boolean(user.solo_lectura);
    document.getElementById('editUserDebeCambiarClave').checked = Boolean(user.debe_cambiar_clave);

    const modal = document.getElementById('modalEditPermissions');
    if (modal) {
      modal.style.setProperty('display', 'flex', 'important');
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  },

  closeEditPermissionsModal() {
    const modal = document.getElementById('modalEditPermissions');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
      modal.classList.add('hidden');
    }
  },

  handleSaveEditPermissionsSubmit(e) {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const nombrePila = document.getElementById('editUserName').value.trim();
    const apellido = (document.getElementById('editUserApellido')?.value || '').trim();
    const fullNombre = apellido && !nombrePila.includes(apellido) ? `${nombrePila} ${apellido}` : nombrePila;
    const email = document.getElementById('editUserEmail').value.trim();
    const dependencia = document.getElementById('editUserDependencia')?.value;
    const sede = document.getElementById('editUserSede').value;
    const rol = document.getElementById('editUserRol').value;

    const puedeCrear = document.getElementById('editUserPuedeCrear').checked;
    const puedeAvanzar = document.getElementById('editUserPuedeAvanzar').checked;
    const puedeMedica = document.getElementById('editUserPuedeMedica').checked;
    const puedePartida = document.getElementById('editUserPuedePartida').checked;
    const soloLectura = document.getElementById('editUserSoloLectura').checked;
    const debeCambiarClave = document.getElementById('editUserDebeCambiarClave').checked;

    const res = DataStore.updateUserPermissions(userId, {
      nombre: fullNombre,
      nombre_pila: nombrePila,
      apellido: apellido,
      email: email,
      dependencia: dependencia,
      sede: sede,
      rol: rol,
      puede_crear: puedeCrear,
      puede_avanzar: puedeAvanzar,
      puede_priorizar_medica: puedeMedica,
      puede_asignar_partida: puedePartida,
      solo_lectura: soloLectura,
      debe_cambiar_clave: debeCambiarClave
    });

    if (res.success) {
      this.closeEditPermissionsModal();
      this.renderUsersList();
      this.renderLoginScreenProfiles();
      this.updateUserUI();
      this.render();
      this.showToast(`✅ ${res.msg}`);
    } else {
      alert(res.msg);
    }
  },

  // ================= QUITAR / HABILITAR ACCESO =================
  handleToggleAccess(userId) {
    const user = DataStore.users.find(x => x.id === userId);
    if (!user) return;

    if (DataStore.currentUser && DataStore.currentUser.id === userId) {
      alert("No puedes quitarte el acceso a ti mismo mientras tienes tu sesión activa.");
      return;
    }

    if (user.activo) {
      if (confirm(`¿Estás seguro de QUITAR EL ACCESO al usuario "${user.nombre}" (@${user.username})?\n\nEl usuario quedará deshabilitado y no podrá iniciar sesión en la plataforma.`)) {
        const res = DataStore.revokeUserAccess(userId);
        if (res.success) {
          this.renderUsersList();
          this.renderLoginScreenProfiles();
          this.showToast(res.msg);
        } else {
          alert(res.msg);
        }
      }
    } else {
      const res = DataStore.restoreUserAccess(userId);
      if (res.success) {
        this.renderUsersList();
        this.renderLoginScreenProfiles();
        this.showToast(res.msg);
      } else {
        alert(res.msg);
      }
    }
  },

  // ================= FORZAR CAMBIO DE CLAVE (OLVIDO DE CLAVE) =================
  handleForcePasswordChange(userId) {
    const user = DataStore.users.find(x => x.id === userId);
    if (!user) return;

    const res = DataStore.forcePasswordChange(userId);
    if (res.success) {
      this.renderUsersList();
      this.openForcedPasswordModal(user.nombre, user.username, res.tempPassword);
      this.showToast(`🔑 Clave provisoria generada para @${user.username}`);
    } else {
      alert(res.msg);
    }
  },

  openForcedPasswordModal(nombre, username, tempPassword) {
    const descEl = document.getElementById('forcedPasswordModalUserDesc');
    const valEl = document.getElementById('forcedPasswordValue');
    const copyBtnText = document.getElementById('btnCopyForcedPasswordText');
    const modal = document.getElementById('modalForcedPasswordAlert');

    if (descEl) descEl.innerHTML = `Se ha restablecido la clave para <strong>${nombre}</strong> (<code>@${username}</code>).`;
    if (valEl) valEl.value = tempPassword;
    if (copyBtnText) copyBtnText.innerText = 'Copiar';

    if (modal) {
      modal.style.setProperty('display', 'flex', 'important');
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  },

  closeForcedPasswordModal() {
    const modal = document.getElementById('modalForcedPasswordAlert');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
      modal.classList.add('hidden');
    }
  },

  copyForcedPasswordToClipboard() {
    const valEl = document.getElementById('forcedPasswordValue');
    const copyBtnText = document.getElementById('btnCopyForcedPasswordText');
    if (!valEl) return;

    const textToCopy = valEl.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (copyBtnText) copyBtnText.innerText = '¡Copiado!';
        this.showToast('📋 ¡Clave provisoria copiada al portapapeles!');
        setTimeout(() => {
          if (copyBtnText) copyBtnText.innerText = 'Copiar';
        }, 2500);
      }).catch(() => {
        valEl.select();
        document.execCommand('copy');
        if (copyBtnText) copyBtnText.innerText = '¡Copiado!';
        this.showToast('📋 ¡Clave provisoria copiada!');
      });
    } else {
      valEl.select();
      document.execCommand('copy');
      if (copyBtnText) copyBtnText.innerText = '¡Copiado!';
      this.showToast('📋 ¡Clave provisoria copiada!');
    }
  },

  // ================= ELIMINACIÓN DIRECTA Y DEFINITIVA =================
  handleDeleteUserDirect(userId) {
    const user = DataStore.users.find(x => x.id === userId);
    if (!user) return;

    if (DataStore.currentUser && DataStore.currentUser.id === userId) {
      alert("No puedes eliminar tu propia cuenta mientras estás conectado.");
      return;
    }

    if (confirm(`¿ELIMINAR DEFINITIVAMENTE al usuario "${user.nombre}" (@${user.username})?\n\n⚠️ Esta acción borrará el registro de forma permanente. El usuario NO volverá a aparecer en la lista de usuarios, ni al reiniciar o recargar el sistema.`)) {
      const res = DataStore.deleteUser(userId);
      if (res.success) {
        this.renderUsersList();
        this.renderLoginScreenProfiles();
        this.showToast(res.msg);
      } else {
        alert(res.msg);
      }
    }
  },

  handleDeleteUser(userId) {
    this.handleDeleteUserDirect(userId);
  },

  handleResetUserPassword(userId) {
    this.handleForcePasswordChange(userId);
  },

  handleCreateUser(e) {
    e.preventDefault();
    const nombrePila = (document.getElementById('newUserNameFirst')?.value || document.getElementById('newUserName')?.value || '').trim();
    const apellido = (document.getElementById('newUserNameLast')?.value || '').trim();
    const username = (document.getElementById('newUserUsername')?.value || '').trim();
    const email = (document.getElementById('newUserEmail')?.value || '').trim();
    const dependencia = document.getElementById('newUserDependencia')?.value || 'Departamento de Proyectos Central';
    const sede = document.getElementById('newUserSede')?.value;
    const rol = document.getElementById('newUserRol')?.value;
    const tempPassword = document.getElementById('newUserTempPassword')?.value.trim() || 'Hiba2025!';
    const puedeCrear = document.getElementById('newUserPuedeCrear')?.checked ?? true;
    const puedeAvanzar = document.getElementById('newUserPuedeAvanzar')?.checked ?? true;
    const puedeMedica = document.getElementById('newUserPuedeMedica')?.checked ?? false;
    const puedePartida = document.getElementById('newUserPuedePartida')?.checked ?? false;
    const soloLectura = document.getElementById('newUserSoloLectura')?.checked ?? false;

    if (!nombrePila || !username) {
      alert("Por favor completa al menos el Nombre y el Usuario (Login).");
      return;
    }

    const fullNombre = apellido ? `${nombrePila} ${apellido}` : nombrePila;

    try {
      const result = DataStore.addUser({
        nombre: fullNombre,
        nombre_pila: nombrePila,
        apellido: apellido,
        username: username,
        email: email,
        dependencia: dependencia,
        sede: sede,
        rol: rol,
        tempPassword: tempPassword,
        puede_crear: puedeCrear,
        puede_avanzar: puedeAvanzar,
        puede_priorizar_medica: puedeMedica,
        puede_asignar_partida: puedePartida,
        solo_lectura: soloLectura
      });

      if (document.getElementById('newUserNameFirst')) document.getElementById('newUserNameFirst').value = '';
      if (document.getElementById('newUserNameLast')) document.getElementById('newUserNameLast').value = '';
      if (document.getElementById('newUserName')) document.getElementById('newUserName').value = '';
      document.getElementById('newUserUsername').value = '';
      document.getElementById('newUserEmail').value = '';
      this.generateRandomTempPassword();

      this.renderUsersList();
      this.renderLoginScreenProfiles();
      this.showToast(`Usuario "${username}" creado en "${dependencia}" con 0 obras asignadas.`);
      this.openForcedPasswordModal(result.user.nombre, result.user.username, result.tempPassword);

      // Ofrecer asignación inmediata de obras para este usuario
      setTimeout(() => {
        if (confirm(`El nuevo usuario "${result.user.nombre}" (@${result.user.username}) ha sido dado de alta en "${dependencia}" sin asignaciones (arranca en 0 obras a cargo).\n\n¿Deseas abrir ahora el panel para asignarle proyectos de obras o infraestructura?`)) {
          this.closeForcedPasswordModal();
          this.openAssignUserObrasModal(result.user.id);
        }
      }, 500);
    } catch (err) {
      alert("Error al dar de alta usuario: " + err.message);
    }
  },

  generateRandomTempPassword() {
    const pwd = 'Hiba' + Math.floor(1000 + Math.random() * 9000) + '!';
    const input = document.getElementById('newUserTempPassword');
    if (input) input.value = pwd;
    return pwd;
  },

  toggleUserActive(userId) {
    this.handleToggleAccess(userId);
  },

  switchUserAccount(userId) {
    const success = DataStore.switchActiveUser(userId);
    if (success) {
      const u = DataStore.currentUser;
      if (u.dependencia && u.dependencia !== 'Dirección General / Administración' && !DataStore.isAdmin()) {
        this.filters.dependencia = u.dependencia;
      } else {
        this.filters.dependencia = 'TODAS';
      }
      if (u.sede !== 'Todas') {
        this.filters.sede = u.sede;
      } else {
        this.filters.sede = 'TODAS';
      }
      this.updateUserUI();
      this.render();
      this.renderUsersList();
      this.showToast(`Sesión activa: ${u.nombre} (${u.dependencia || u.sede})`);
    }
  },

  // ================= CONTROL DE AUTENTICACIÓN Y LOGIN GATE =================
  checkAuth() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');

    if (!DataStore.currentUser) {
      if (loginScreen) {
        loginScreen.style.setProperty('display', 'flex', 'important');
        loginScreen.classList.remove('hidden');
      }
      if (appContainer) {
        appContainer.style.setProperty('display', 'none', 'important');
        appContainer.classList.add('hidden');
      }
      this.renderLoginScreenProfiles();
      return false;
    } else {
      if (loginScreen) {
        loginScreen.style.setProperty('display', 'none', 'important');
        loginScreen.classList.add('hidden');
      }
      if (appContainer) {
        appContainer.style.setProperty('display', 'flex', 'important');
        appContainer.classList.remove('hidden');
      }
      return true;
    }
  },

  renderLoginScreenProfiles() {
    // Deprecado por seguridad: el selector de perfiles público fue removido para evitar fugas de usuarios
  },

  checkLockoutState() {
    const lockoutBox = document.getElementById('loginLockoutMessage');
    const countdownSpan = document.getElementById('loginLockoutCountdown');
    const submitBtn = document.getElementById('btnLoginSubmit');
    const errBox = document.getElementById('loginErrorMessage');

    if (SecurityManager.isLocked()) {
      if (errBox) errBox.classList.add('hidden');
      if (lockoutBox) lockoutBox.classList.remove('hidden');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Acceso Bloqueado Temporalmente';
      }
      SecurityManager.startLockoutCountdown(
        (formattedTime) => {
          if (countdownSpan) countdownSpan.innerText = formattedTime;
        },
        () => {
          if (lockoutBox) lockoutBox.classList.add('hidden');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Ingresar al Sistema</span><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>';
            if (window.lucide) lucide.createIcons();
          }
        }
      );
      return true;
    } else {
      if (lockoutBox) lockoutBox.classList.add('hidden');
      if (submitBtn && !(submitBtn.dataset && submitBtn.dataset.busy)) {
        submitBtn.disabled = false;
        if (!submitBtn.innerHTML.includes('arrow-right')) {
          submitBtn.innerHTML = '<span>Ingresar al Sistema</span><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>';
          if (window.lucide) lucide.createIcons();
        }
      }
      return false;
    }
  },

  initInactivityWatcher(timeoutMinutes = 30) {
    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!DataStore.currentUser) return;
      timeoutId = setTimeout(() => {
        if (DataStore.currentUser) {
          const uName = DataStore.currentUser.nombre;
          DataStore.logout();
          this.checkAuth();
          alert(`🔒 Tu sesión (${uName}) ha sido cerrada automáticamente tras 30 minutos de inactividad por políticas de seguridad institucional.`);
        }
      }, timeoutMinutes * 60 * 1000);
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, resetTimer, { passive: true });
      });
      resetTimer();
    }
  },

  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  },

  async handleLoginSubmit() {
    const uInput = document.getElementById('inputLoginUsername');
    const pInput = document.getElementById('inputLoginPassword');
    const errBox = document.getElementById('loginErrorMessage');
    const errText = document.getElementById('loginErrorText');
    const submitBtn = document.getElementById('btnLoginSubmit');

    // 1. Verificar si el cliente está en período de bloqueo por fuerza bruta
    if (this.checkLockoutState()) {
      return;
    }

    if (errBox) errBox.classList.add('hidden');

    const username = uInput?.value.trim();
    const password = pInput?.value;

    if (!username || !password) {
      if (errBox && errText) {
        errText.innerText = 'Por favor ingresa tu usuario o correo institucional y contraseña.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (submitBtn) {
      if (!submitBtn.dataset) submitBtn.dataset = {};
      submitBtn.dataset.busy = 'true';
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verificando credenciales...</span>';
    }

    try {
      // 2. Retardo progresivo anti-timing/fuerza bruta si hubo intentos fallidos previos
      const prevAttempts = SecurityManager.getLockoutState().attempts || 0;
      if (prevAttempts > 0) {
        const delayMs = Math.min(prevAttempts * 400, 1500);
        await new Promise(r => setTimeout(r, delayMs));
      }

      const res = DataStore.authenticate(username, password);
      if (res.success) {
        SecurityManager.recordSuccessfulLogin();
        if (errBox) errBox.classList.add('hidden');

        if (res.mustChangePassword) {
          // Obligar cambio de contraseña temporal
          this.openChangePasswordModal();
        } else {
          if (DataStore.currentUser && DataStore.currentUser.dependencia && DataStore.currentUser.dependencia !== 'Dirección General / Administración' && !DataStore.isAdmin()) {
            this.filters.dependencia = DataStore.currentUser.dependencia;
          } else {
            this.filters.dependencia = 'TODAS';
          }
          if (DataStore.currentUser && DataStore.currentUser.sede !== 'Todas') {
            this.filters.sede = DataStore.currentUser.sede;
          }
          this.checkAuth();
          this.updateUserUI();
          this.render();
          this.showToast(`¡Bienvenido/a ${res.user.nombre}!`);
          if (window.lucide) lucide.createIcons();
        }
      } else {
        const lockoutState = SecurityManager.recordFailedAttempt(username);
        if (lockoutState.lockedUntil) {
          this.checkLockoutState();
        } else {
          const remaining = SecurityManager.MAX_ATTEMPTS - lockoutState.attempts;
          if (errBox && errText) {
            errText.innerHTML = `${res.msg}<br><span class="font-bold text-amber-700">Te quedan ${remaining} intento(s) antes del bloqueo temporal de seguridad.</span>`;
            errBox.classList.remove('hidden');
          } else {
            alert(`${res.msg}\nTe quedan ${remaining} intentos antes del bloqueo.`);
          }
        }
      }
    } catch (err) {
      console.error("Error al autenticar:", err);
      if (errBox && errText) {
        errText.innerText = "Ocurrió un error inesperado al iniciar sesión. Por favor intenta nuevamente.";
        errBox.classList.remove('hidden');
      }
    } finally {
      if (submitBtn) {
        if (submitBtn.dataset) delete submitBtn.dataset.busy;
        if (!SecurityManager.isLocked() && !DataStore.currentUser) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Ingresar al Sistema</span><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>';
        }
      }
      if (window.lucide) lucide.createIcons();
    }
  },

  openChangePasswordModal() {
    const modal = document.getElementById('modalChangePassword');
    const err = document.getElementById('modalChangePasswordError');
    if (err) err.classList.add('hidden');
    if (modal) {
      modal.style.setProperty('display', 'flex', 'important');
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  },

  closeChangePasswordModal() {
    const modal = document.getElementById('modalChangePassword');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
      modal.classList.add('hidden');
    }
  },

  handleChangePasswordSubmit() {
    const newPwd = document.getElementById('inputNewPassword')?.value;
    const confirmPwd = document.getElementById('inputConfirmNewPassword')?.value;
    const errBox = document.getElementById('modalChangePasswordError');
    const errText = document.getElementById('modalChangePasswordErrorText');

    if (errBox) errBox.classList.add('hidden');

    if (!newPwd || newPwd.length < 6) {
      if (errBox && errText) {
        errText.innerText = 'La contraseña debe tener al menos 6 caracteres.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (newPwd !== confirmPwd) {
      if (errBox && errText) {
        errText.innerText = 'Las contraseñas no coinciden. Verifica nuevamente.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (!DataStore.currentUser) {
      alert('Error de sesión. Vuelve a iniciar sesión.');
      this.closeChangePasswordModal();
      this.checkAuth();
      return;
    }

    const res = DataStore.changePassword(DataStore.currentUser.id, newPwd);
    if (res.success) {
      this.closeChangePasswordModal();
      if (DataStore.currentUser && DataStore.currentUser.dependencia && DataStore.currentUser.dependencia !== 'Dirección General / Administración' && !DataStore.isAdmin()) {
        this.filters.dependencia = DataStore.currentUser.dependencia;
      } else {
        this.filters.dependencia = 'TODAS';
      }
      if (DataStore.currentUser && DataStore.currentUser.sede !== 'Todas') {
        this.filters.sede = DataStore.currentUser.sede;
      }
      this.checkAuth();
      this.updateUserUI();
      this.render();
      this.showToast('¡Contraseña actualizada exitosamente! Bienvenido/a.');
      if (window.lucide) lucide.createIcons();
    } else {
      if (errBox && errText) {
        errText.innerText = res.msg;
        errBox.classList.remove('hidden');
      } else {
        alert(res.msg);
      }
    }
  },

  logout() {
    this.pipelineSelectedStage = null;
    DataStore.logout();
    this.checkAuth();
    this.showToast('Has cerrado sesión correctamente.');
    if (window.lucide) lucide.createIcons();
  },

  updateUserUI() {
    const u = DataStore.currentUser;
    if (!u) return;

    const nameEl = document.getElementById('userNameLabel');
    const roleEl = document.getElementById('userRoleBadge');
    const emailEl = document.getElementById('userEmailBadge');
    const sedeEl = document.getElementById('userSedeBadge');
    const sedeSelect = document.getElementById('filterSede');

    if (nameEl) nameEl.innerText = u.nombre;
    if (roleEl) roleEl.innerText = `${u.rol.toUpperCase()}`;
    if (emailEl) emailEl.innerText = u.email || '';
    const depShort = (u.dependencia || '').replace('Departamento de ', 'Dpto. ').replace('Centros Periféricos', 'Ctros. Periféricos');
    if (sedeEl) sedeEl.innerText = `${u.sede !== 'Todas' ? '📍 ' + u.sede : '🌐 Todas'} • ${depShort || 'General'}`;

    const depSelect = document.getElementById('filterDependencia');
    if (depSelect) {
      if (DataStore.isAdmin()) {
        depSelect.disabled = false;
        depSelect.classList.remove('bg-slate-200', 'cursor-not-allowed');
      } else if (u.dependencia && u.dependencia !== 'Dirección General / Administración') {
        depSelect.value = DataStore.normalizeDependencia ? DataStore.normalizeDependencia(u.dependencia) : u.dependencia;
        depSelect.disabled = true;
        depSelect.classList.add('bg-slate-200', 'cursor-not-allowed');
      }
    }

    if (sedeSelect) {
      // Cada usuario puede ver todo: navegación abierta sin deshabilitar selector de sede
      sedeSelect.disabled = false;
      sedeSelect.classList.remove('bg-slate-200', 'cursor-not-allowed');
    }

    // Visibilidad de controles según permisos y rol
    const btnNueva = document.getElementById('btnNuevaObraTop');
    if (btnNueva) {
      const canCreate = !u.solo_lectura && u.rol !== 'visualizador' && Boolean(u.puede_crear);
      btnNueva.classList.toggle('hidden', !canCreate);
    }

    const btnUsers = document.getElementById('btnUsersAdminTop');
    if (btnUsers) {
      btnUsers.classList.toggle('hidden', u.rol !== 'admin');
    }

    const btnAsignar = document.getElementById('btnAsignarObrasTop');
    if (btnAsignar) {
      btnAsignar.classList.toggle('hidden', u.rol !== 'admin');
    }

    const btnExecutive = document.getElementById('btnExecutiveReportTop');
    if (btnExecutive) {
      btnExecutive.classList.toggle('hidden', u.rol !== 'admin');
    }
  },

  // ================= CÁLCULO INSTANTÁNEO Y AUDITORÍA DE M2 =================
  calculateModalUsdM2() {
    const mObra = parseFloat(document.getElementById('modalObraMontoObra')?.value) || 0;
    const mEquip = parseFloat(document.getElementById('modalObraMontoEquip')?.value) || 0;
    const mTotal = mObra + mEquip;
    const m2 = parseFloat(document.getElementById('modalObraM2')?.value) || 0;
    const tipo = document.getElementById('modalObraTipo')?.value || 'Obra Civil';
    const isObraCivil = (tipo === 'Obra Civil');

    const badge = document.getElementById('modalObraM2RequiredBadge');
    if (badge) badge.classList.toggle('hidden', !isObraCivil);

    const usdM2 = m2 > 0 ? (Math.round((mTotal / m2) * 100) / 100) : 0;
    const elUsdM2 = document.getElementById('modalObraUsdM2');
    if (elUsdM2) elUsdM2.value = usdM2 > 0 ? usdM2.toFixed(2) : 0;

    // Actualizar panel de desglose visual de signos (+, =, ÷, =)
    const elFMO = document.getElementById('calcFormulaMontoObra');
    const elFME = document.getElementById('calcFormulaMontoEquip');
    const elFMT = document.getElementById('calcFormulaTotal');
    const elFM2 = document.getElementById('calcFormulaM2');
    const elFRes = document.getElementById('calcFormulaResultado');
    const elFNota = document.getElementById('calcFormulaNota');

    if (elFMO) elFMO.innerText = `USD ${mObra.toLocaleString('en-US')}`;
    if (elFME) elFME.innerText = `USD ${mEquip.toLocaleString('en-US')}`;
    if (elFMT) elFMT.innerText = `USD ${mTotal.toLocaleString('en-US')}`;
    if (elFM2) elFM2.innerText = m2 > 0 ? `${m2.toLocaleString('en-US')} m²` : (isObraCivil ? '0 m² (Falta m²)' : 'N/A');
    if (elFRes) elFRes.innerText = usdM2 > 0 ? `USD ${usdM2.toFixed(2)} / m²` : 'USD 0.00 / m²';
    if (elFNota) {
      if (isObraCivil && m2 <= 0) {
        elFNota.innerText = '⚠️ M² obligatorio para Obra Civil';
        elFNota.className = 'text-[10px] text-rose-600 font-bold';
      } else {
        elFNota.innerText = 'Cálculo instantáneo auditado';
        elFNota.className = 'text-[10px] text-slate-500 font-medium';
      }
    }
  },

  // ================= MODAL DETALLE OBRA =================
  populateObraModalFields(item) {
    const pond = DataStore.getPonderacionGlobal(item);

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text !== undefined && text !== null ? text : '';
    };

    const montoObra = item.monto_obra_usd !== undefined ? item.monto_obra_usd : (item.monto_total_usd || 0);
    const montoEquip = item.monto_equipamiento_usd || 0;

    setText('modalObraId', item.id);
    setVal('modalObraTitle', item.nombre);
    setVal('modalObraSede', item.sede || 'Central');
    setVal('modalObraTipo', item.tipo || 'Obra Civil');
    setVal('modalObraEstado', item.estado || 'Estudio de Factibilidad');
    const depVal = DataStore.normalizeDependencia ? DataStore.normalizeDependencia(item.dependencia || DataStore.getObraDependencia(item)) : (item.dependencia || DataStore.getObraDependencia(item));
    setVal('modalObraDependenciaSelect', depVal);
    const depBadge = document.getElementById('modalObraDepBadge');
    if (depBadge) {
      depBadge.innerText = (depVal || '').replace('Departamento de ', 'Dpto. ').replace('Centros Periféricos', 'Ctros. Periféricos');
    }
    setVal('modalObraPartida', item.partida || '');
    setVal('modalObraMontoPartida', item.monto_partida_usd || (item.partida ? item.monto_total_usd : '') || '');
    setVal('modalObraCategoria', item.categoria || 'Obra Civil');
    setVal('modalObraClasificacion', item.clasificacion || '');
    setVal('modalObraMontoObra', montoObra);
    setVal('modalObraMontoEquip', montoEquip);
    setVal('modalObraM2', item.superficie_m2 || 0);
    setVal('modalObraUsdM2', item.costo_usd_m2 || 0);
    setVal('modalObraResponsable', item.responsable || '');
    setVal('modalObraResponsableId', item.responsable_id || '');

    // Poblar y seleccionar en el selector de Responsable
    const selResp = document.getElementById('modalObraResponsableSelect');
    if (selResp) {
      let optionsHtml = '<option value="">-- Sin Asignar --</option>';
      const activeUsers = (DataStore.users || []).filter(u => u.activo);
      activeUsers.forEach(u => {
        optionsHtml += `<option value="${u.id}">${u.nombre} (@${u.username}) - ${u.sede} [${u.rol}]</option>`;
      });
      const assignedUser = DataStore.getObraAssignedUser(item);
      if (!assignedUser && item.responsable && item.responsable.trim() !== '' && item.responsable !== 'S/D' && item.responsable !== 'Sin Asignar') {
        optionsHtml += `<option value="custom:${item.responsable}">${item.responsable} (Histórico / Externo)</option>`;
      }
      selResp.innerHTML = optionsHtml;

      if (assignedUser) {
        selResp.value = assignedUser.id;
      } else if (item.responsable_id) {
        selResp.value = item.responsable_id;
      } else if (item.creado_por && item.creado_por !== 'Sin Asignar') {
        const uCreator = (DataStore.users || []).find(u => 
          (item.creado_por_id && u.id === item.creado_por_id) ||
          (u.nombre && u.nombre.toLowerCase() === item.creado_por.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === item.creado_por.toLowerCase())
        ) || DataStore.getObraAssignedUser({ ...item, responsable: item.creado_por, estado: 'Proyecto' });
        if (uCreator) {
          selResp.value = uCreator.id;
        } else {
          selResp.value = '';
        }
      } else {
        selResp.value = '';
      }
      this._currentModalItem = item;
      this.updateModalAssignmentBadge(selResp.value, item);
    }

    setVal('modalObraProveedor', item.proveedor || '');
    setVal('modalObraFechaInicio', item.fecha_inicio_etapa || '');

    const isFactibilidad = (item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto');
    const noticeFactPlazo = document.getElementById('modalObraFactibilidadPlazoNotice');
    const inputFechaFin = document.getElementById('modalObraFechaFin');
    const inputFechaFinGlobal = document.getElementById('modalObraFechaFinGlobal');

    if (noticeFactPlazo) {
      noticeFactPlazo.classList.toggle('hidden', !isFactibilidad);
    }
    if (isFactibilidad) {
      setVal('modalObraFechaFin', '');
      setVal('modalObraFechaFinGlobal', '');
      if (inputFechaFin) {
        inputFechaFin.disabled = true;
        inputFechaFin.title = 'Sin plazo en etapa de Estudio de Factibilidad';
      }
      if (inputFechaFinGlobal) {
        inputFechaFinGlobal.disabled = true;
        inputFechaFinGlobal.title = 'Sin plazo en etapa de Estudio de Factibilidad';
      }
    } else {
      setVal('modalObraFechaFin', item.fecha_fin_etapa || '');
      setVal('modalObraFechaFinGlobal', item.fecha_fin_obra || '');
      if (inputFechaFin) {
        inputFechaFin.disabled = false;
        inputFechaFin.title = '';
      }
      if (inputFechaFinGlobal) {
        inputFechaFinGlobal.disabled = false;
        inputFechaFinGlobal.title = '';
      }
    }

    setVal('modalObraPrioridadTec', item.prioridad_tecnica || 1);
    setVal('modalObraPrioridadMed', item.prioridad_medica || '');
    const badgeDefaultMed = document.getElementById('modalObraPrioridadMedDefaultBadge');
    if (badgeDefaultMed) {
      badgeDefaultMed.classList.toggle('hidden', !item.prioridad_medica_ponderada_default);
    }
    setVal('modalObraPrioridadFin', pond.valor || 1);
    setVal('modalObraObservaciones', item.observaciones || '');

    // Condiciones de Contratación y Anticipo OC
    const panelContratacion = document.getElementById('modalObraContratacionPanel');
    if (panelContratacion) {
      setVal('modalObraOrdenCompra', item.orden_compra || item.numero_oc || '');
      setVal('modalObraMontoAdjudicado', item.monto_adjudicado_usd || item.monto_total_usd || montoObra || 0);
      setVal('modalObraAnticipoPct', (item.anticipo_porcentaje !== undefined && item.anticipo_porcentaje !== null) ? item.anticipo_porcentaje : 0);
      setVal('modalObraPlazoMeses', item.plazo_meses || '');
      this.handleModalAnticipoChange();
    }

    // Calcular instantáneamente precio por m2 y actualizar desglose con signos
    this.calculateModalUsdM2();
  },

  handleModalAnticipoChange() {
    const elMonto = document.getElementById('modalObraMontoAdjudicado');
    const elPct = document.getElementById('modalObraAnticipoPct');
    const elUSD = document.getElementById('modalObraAnticipoUSD');
    const badge = document.getElementById('modalObraAnticipoInfoBadge');

    const monto = parseFloat(elMonto ? elMonto.value : 0) || 0;
    const pct = Math.min(100, Math.max(0, parseFloat(elPct ? elPct.value : 0) || 0));
    const anticipoUSD = Math.round((monto * (pct / 100)) * 100) / 100;
    const saldoUSD = Math.round((monto - anticipoUSD) * 100) / 100;

    if (elUSD) elUSD.value = `USD ${DataStore.formatUSD(anticipoUSD)}`;
    if (badge) {
      badge.innerText = pct > 0 
        ? `Anticipo OC: ${pct}% (USD ${DataStore.formatUSD(anticipoUSD)}) • Saldo Restante: USD ${DataStore.formatUSD(saldoUSD)}`
        : `Sin anticipo pactado en OC (100% distribuido uniformemente)`;
    }
  },

  handleModalResponsableSelectChange(val) {
    const hiddenResp = document.getElementById('modalObraResponsable');
    const hiddenRespId = document.getElementById('modalObraResponsableId');
    if (!val) {
      if (hiddenResp) hiddenResp.value = 'Sin Asignar';
      if (hiddenRespId) hiddenRespId.value = '';
    } else if (val.startsWith('custom:')) {
      const customName = val.replace('custom:', '');
      if (hiddenResp) hiddenResp.value = customName;
      if (hiddenRespId) hiddenRespId.value = '';
    } else {
      const user = (DataStore.users || []).find(u => u.id === val);
      if (user) {
        if (hiddenResp) hiddenResp.value = user.nombre;
        if (hiddenRespId) hiddenRespId.value = user.id;
        if (user.dependencia && user.dependencia !== 'Dirección General / Administración') {
          const depSelect = document.getElementById('modalObraDependenciaSelect');
          if (depSelect) depSelect.value = user.dependencia;
          const depBadge = document.getElementById('modalObraDepBadge');
          if (depBadge) depBadge.innerText = user.dependencia.replace('Departamento de ', 'Dpto. ').replace('Centros Periféricos', 'Ctros. Periféricos');
        }
      }
    }
    this.updateModalAssignmentBadge(val, this._currentModalItem);
  },

  handleModalDependenciaSelectChange(val) {
    const depBadge = document.getElementById('modalObraDepBadge');
    if (depBadge && val) {
      depBadge.innerText = val.replace('Departamento de ', 'Dpto. ').replace('Centros Periféricos', 'Ctros. Periféricos');
    }
  },

  updateModalAssignmentBadge(val, item = null) {
    const itm = item || this._currentModalItem;
    const badge = document.getElementById('modalObraAssignmentBadge');
    if (!badge) return;
    if (!val) {
      let html = `<span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3 text-amber-600"></i><span>Sin Asignar</span></span>`;
      if (itm && itm.creado_por) {
        html += ` <span class="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ml-1" title="Presentada por ${itm.creado_por}"><i data-lucide="user" class="w-2.5 h-2.5 text-slate-500"></i><span>Creada por: <strong>${itm.creado_por}</strong></span></span>`;
      }
      badge.innerHTML = html;
    } else if (val.startsWith('custom:')) {
      const customName = val.replace('custom:', '');
      badge.innerHTML = `<span class="bg-slate-100 text-slate-800 border border-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><i data-lucide="user" class="w-3 h-3 text-slate-600"></i><span>${customName}</span></span>`;
    } else {
      const user = (DataStore.users || []).find(u => u.id === val);
      if (user) {
        badge.innerHTML = `<span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><i data-lucide="user-check" class="w-3 h-3 text-emerald-600"></i><span>Asignada: ${user.nombre}</span></span>`;
      }
    }
    if (window.lucide) lucide.createIcons();
  },

  toggleAdminEditMode(enable) {
    const isAdmin = DataStore.isAdmin();
    if (enable && !isAdmin) {
      alert("⛔ Acceso Denegado: Exclusivo para el Administrador. Solo el perfil Administrador tiene autorización para editar datos maestros del proyecto (tarea, montos, fechas, responsable).");
      return;
    }

    this.adminEditModeActive = Boolean(enable && isAdmin);
    const active = this.adminEditModeActive;

    // Header buttons
    const btnHeaderEdit = document.getElementById('btnHeaderAdminEdit');
    if (btnHeaderEdit) {
      btnHeaderEdit.classList.toggle('hidden', !isAdmin || active);
    }

    // Banners
    const banner = document.getElementById('modalAdminEditBanner');
    if (banner) {
      banner.classList.toggle('hidden', !active);
    }
    const readOnlyNotice = document.getElementById('modalReadOnlyNotice');
    if (readOnlyNotice) {
      readOnlyNotice.classList.toggle('hidden', isAdmin);
    }

    // Footer buttons
    const btnEnable = document.getElementById('btnModalAdminEnableEdit');
    const btnCancel = document.getElementById('btnModalAdminCancelEdit');
    const btnSave = document.getElementById('btnModalSaveObra');
    const footerInfo = document.getElementById('modalObraFooterInfo');

    if (btnEnable) {
      btnEnable.classList.toggle('hidden', !isAdmin || active);
    }
    if (btnCancel) {
      btnCancel.classList.toggle('hidden', !active);
    }
    if (btnSave) {
      btnSave.classList.toggle('hidden', !active);
    }

    if (footerInfo) {
      if (active) {
        footerInfo.innerHTML = `
          <span class="inline-flex items-center space-x-1.5 text-amber-900 font-bold bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-700"></i>
            <span>Edición Administrador activa: Modifica tarea, fechas, montos o responsable y pulsa Guardar.</span>
          </span>
        `;
      } else if (isAdmin) {
        footerInfo.innerHTML = `
          <span class="inline-flex items-center space-x-1.5 text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Sesión Administrador: Haz clic en <strong>Modificar Datos</strong> para editar cualquier campo maestro.</span>
          </span>
        `;
      } else {
        footerInfo.innerHTML = `
          <span class="text-slate-400 italic">Vista de solo lectura (Edición de datos maestros exclusiva para el Administrador).</span>
        `;
      }
    }

    // Toggle editable fields
    const editableFieldIds = [
      'modalObraTitle',
      'modalObraSede',
      'modalObraTipo',
      'modalObraEstado',
      'modalObraPartida',
      'modalObraMontoPartida',
      'modalObraFechaInicio',
      'modalObraFechaFin',
      'modalObraFechaFinGlobal',
      'modalObraMontoObra',
      'modalObraMontoEquip',
      'modalObraM2',
      'modalObraResponsable',
      'modalObraResponsableSelect',
      'modalObraProveedor',
      'modalObraCategoria',
      'modalObraPrioridadTec',
      'modalObraPrioridadMed',
      'modalObraDependenciaSelect',
      'modalObraOrdenCompra',
      'modalObraAnticipoPct',
      'modalObraPlazoMeses',
      'modalObraObservaciones'
    ];

    editableFieldIds.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.disabled = !active;
        el.classList.toggle('bg-slate-100', !active);
        el.classList.toggle('cursor-not-allowed', !active);
        el.classList.toggle('bg-white', active);
        el.classList.toggle('border-amber-400', active);
      }
    });

    // USD/M2 se calcula de forma automática y siempre permanece de solo lectura
    const elUsdM2 = document.getElementById('modalObraUsdM2');
    if (elUsdM2) {
      elUsdM2.disabled = true;
      elUsdM2.classList.add('bg-slate-100');
      elUsdM2.classList.remove('bg-white', 'border-amber-400');
    }

    // If canceling edit mode, restore values from current item
    if (!enable) {
      const idEl = document.getElementById('modalObraId');
      const id = idEl ? idEl.innerText : null;
      if (id) {
        const item = DataStore.getItemById(id);
        if (item) {
          this.populateObraModalFields(item);
        }
      }
    }

    if (window.lucide) lucide.createIcons();
  },

  checkSharedPartidaNotice(partidaVal) {
    const pVal = (partidaVal || '').trim();
    const currentId = document.getElementById('modalObraId')?.innerText;
    const noticeShared = document.getElementById('modalPartidaSharedNotice');
    const textShared = document.getElementById('modalPartidaSharedText');
    if (!noticeShared || !textShared) return;

    if (pVal && pVal !== 'S/D' && pVal.toUpperCase() !== 'PENDIENTE') {
      const related = DataStore.items.filter(x => x.id !== currentId && (x.partida || '').trim() === pVal);
      if (related.length > 0) {
        const namesPreview = related.slice(0, 2).map(x => `"${x.nombre}"`).join(', ');
        const extra = related.length > 2 ? ` y ${related.length - 2} proyectos más` : '';
        textShared.innerText = `Esta partida coincide con otros ${related.length} proyecto(s) (${namesPreview}${extra}).`;
        noticeShared.classList.remove('hidden');
      } else {
        noticeShared.classList.add('hidden');
      }
    } else {
      noticeShared.classList.add('hidden');
    }
  },

  openObraModal(id, startInEditMode = false) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    const isAdmin = DataStore.isAdmin();
    const canAdvance = DataStore.canUserAdvanceItem(item) || isAdmin;

    // Si la obra requiere definición obligatoria de plazo por el responsable asignado
    if (canAdvance) {
      if (item.estado !== 'Estudio de Factibilidad' && item.estado !== 'Obras Finalizadas' && item.estado !== 'Suspendida') {
        if (item.requiere_plazo_etapa || !item.fecha_fin_etapa) {
          this.openDefinirPlazoModal(item.id);
          return;
        }
      }
    }

    const canEdit = DataStore.canUserEditObra(item);
    const u = DataStore.currentUser;

    // Poblar datalist de responsables disponibles
    const datalist = document.getElementById('responsablesDatalist');
    if (datalist) {
      const userNames = (DataStore.users || []).map(usr => usr.nombre).filter(Boolean);
      const existingNames = (DataStore.items || []).map(x => x.responsable).filter(Boolean);
      const uniqueNames = Array.from(new Set([...userNames, ...existingNames])).sort();
      datalist.innerHTML = uniqueNames.map(r => `<option value="${r}"></option>`).join('');
    }

    // Poblar campos del formulario
    this.populateObraModalFields(item);

    // Detección de partida presupuestaria compartida
    this.checkSharedPartidaNotice(item.partida);
    const chkSync = document.getElementById('chkSyncSharedPartida');
    if (chkSync) chkSync.checked = true;

    // Botón de asignación directa de partida si tiene permiso específico
    const btnAsignarPartida = document.getElementById('btnModalAsignarPartida');
    if (btnAsignarPartida) {
      const showPartidaBtn = Boolean(u && u.puede_asignar_partida) && !(item.partida && item.partida.trim() !== '');
      btnAsignarPartida.classList.toggle('hidden', !showPartidaBtn);
    }

    // Advertencia de restricción o consulta departamental si aplica
    const warningRestr = document.getElementById('modalSedeRestrWarning');
    const deptNotice = document.getElementById('modalDeptReadOnlyNotice');
    const deptNoticeText = document.getElementById('modalDeptReadOnlyNoticeText');

    if (warningRestr) warningRestr.classList.add('hidden');
    if (deptNotice) deptNotice.classList.add('hidden');

    const itemDep = item.dependencia || DataStore.getObraDependencia(item);
    const userDep = u ? (u.dependencia || '') : '';

    if (isAdmin) {
      // Control total de Administrador
    } else if (u && (u.solo_lectura || u.rol === 'visualizador')) {
      if (warningRestr) {
        warningRestr.innerText = '🔒 Perfil de Solo Lectura: Tu usuario cuenta exclusivamente con permisos de visualización.';
        warningRestr.classList.remove('hidden');
      }
    } else if (canEdit) {
      // El usuario es el responsable asignado a esta obra dentro de su departamento
    } else if (userDep && itemDep && userDep.toLowerCase() === itemDep.toLowerCase()) {
      // Pertenece al mismo departamento pero la obra está a cargo de otro colega
      if (deptNotice) {
        if (deptNoticeText) {
          const isItemAssigned = DataStore.isObraAssigned(item);
          if (!isItemAssigned) {
            deptNoticeText.innerHTML = `<strong>Modo Consulta Departamental:</strong> Esta obra pertenece a <strong>${itemDep}</strong> y se encuentra <strong class="text-amber-700">Sin Asignar</strong>${item.creado_por ? ` (presentada por <strong>${item.creado_por}</strong>)` : ''}. La Dirección aún no ha habilitado partida presupuestaria para su asignación formal.`;
          } else {
            deptNoticeText.innerHTML = `<strong>Modo Consulta Departamental:</strong> Esta obra pertenece a <strong>${itemDep}</strong>, asignada a <strong>${item.responsable || 'otro profesional'}</strong>. Puedes visualizarla pero solo el responsable asignado o el Administrador pueden editarla.`;
          }
        }
        deptNotice.classList.remove('hidden');
      }
    } else {
      if (warningRestr) {
        warningRestr.innerText = `🔒 Esta obra pertenece a otra dependencia (${itemDep}). Tu usuario solo tiene permisos de visualización.`;
        warningRestr.classList.remove('hidden');
      }
    }

    // Renderizar historial
    const histContainer = document.getElementById('modalObraHistorial');
    if (histContainer) {
      const historial = item.historial || [];
      histContainer.innerHTML = historial.length ? historial.map(h => `
        <div class="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-none">
          <div class="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-blue-600"></div>
          <div class="text-xs font-semibold text-slate-700">${h.fecha} • ${h.usuario}</div>
          <div class="text-xs text-blue-600 font-medium">Fase: ${h.estado_nuevo} ${h.estado_anterior ? '(antes: ' + h.estado_anterior + ')' : ''}</div>
          <div class="text-xs text-slate-500 mt-1">${h.observaciones || 'Sin notas'}</div>
        </div>
      `).join('') : '<div class="text-xs text-slate-400 italic">Sin registros en el historial</div>';
    }

    // Alerta de Partida Corta en el modal
    const alertaCorta = document.getElementById('modalPartidaCortaAlert');
    const textoCorta = document.getElementById('modalPartidaCortaText');
    if (alertaCorta) {
      if (DataStore.isPartidaCorta(item)) {
        const def = DataStore.getPartidaDeficit(item);
        if (textoCorta) {
          textoCorta.innerText = `Partida asignada (USD ${DataStore.formatUSD(item.monto_partida_usd)}) es menor al costo requerido de la obra (USD ${DataStore.formatUSD(item.monto_total_usd)}). Déficit presupuestario: -USD ${DataStore.formatUSD(def)}. La obra cuenta con fondos insuficientes.`;
        }
        alertaCorta.classList.remove('hidden');
      } else {
        alertaCorta.classList.add('hidden');
      }
    }

    // Configurar estado de edición según permisos
    if (isAdmin) {
      this.toggleAdminEditMode(Boolean(startInEditMode));
    } else if (u && (u.rol === 'licitaciones' || u.dependencia === 'Compras & Licitaciones') && item.estado === 'Proyecto') {
      if (warningRestr) {
        warningRestr.innerHTML = '👁️ <strong>Vista Preliminar para Compras (Solo Consulta):</strong> Esta obra se encuentra en etapa de <strong>Proyecto técnico</strong>. Tu perfil puede visualizar su alcance para previsión de adquisiciones y pliegos, pero no puede editarla ni avanzarla hasta que el proyectista finalice el proyecto y la derive a licitación.';
        warningRestr.classList.remove('hidden');
      }
    } else if (canEdit) {
      // Responsable a cargo: permitir editar fechas y observaciones
      this.adminEditModeActive = false;
      const btnHeaderEdit = document.getElementById('btnHeaderAdminEdit');
      if (btnHeaderEdit) btnHeaderEdit.classList.add('hidden');
      const banner = document.getElementById('modalAdminEditBanner');
      if (banner) banner.classList.add('hidden');
      const readOnlyNotice = document.getElementById('modalReadOnlyNotice');
      if (readOnlyNotice) readOnlyNotice.classList.add('hidden');

      const btnEnable = document.getElementById('btnModalAdminEnableEdit');
      const btnCancel = document.getElementById('btnModalAdminCancelEdit');
      const btnSave = document.getElementById('btnModalSaveObra');
      const footerInfo = document.getElementById('modalObraFooterInfo');

      if (btnEnable) btnEnable.classList.add('hidden');
      if (btnCancel) btnCancel.classList.add('hidden');
      if (btnSave) btnSave.classList.remove('hidden');

      if (footerInfo) {
        footerInfo.innerHTML = `
          <span class="inline-flex items-center space-x-1.5 text-blue-900 font-bold bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>Responsable a cargo: Puedes actualizar fechas de cronograma y observaciones.</span>
          </span>
        `;
      }

      // Bloquear todo excepto fechas y observaciones
      const lockedFieldIds = [
        'modalObraTitle', 'modalObraSede', 'modalObraTipo', 'modalObraEstado',
        'modalObraPartida', 'modalObraMontoPartida', 'modalObraMontoObra', 'modalObraMontoEquip',
        'modalObraM2', 'modalObraResponsable', 'modalObraResponsableSelect', 'modalObraProveedor',
        'modalObraCategoria', 'modalObraPrioridadTec', 'modalObraPrioridadMed', 'modalObraDependenciaSelect',
        'modalObraOrdenCompra', 'modalObraAnticipoPct', 'modalObraPlazoMeses'
      ];
      lockedFieldIds.forEach(fId => {
        const el = document.getElementById(fId);
        if (el) {
          el.disabled = true;
          el.classList.add('bg-slate-100', 'cursor-not-allowed');
          el.classList.remove('bg-white', 'border-amber-400');
        }
      });

      ['modalObraFechaInicio', 'modalObraFechaFin', 'modalObraFechaFinGlobal', 'modalObraObservaciones'].forEach(fId => {
        const el = document.getElementById(fId);
        if (el) {
          el.disabled = false;
          el.classList.remove('bg-slate-100', 'cursor-not-allowed');
          el.classList.add('bg-white');
        }
      });
    } else {
      // Modo consulta departamental / comprador en proyecto (solo lectura)
      this.toggleAdminEditMode(false);
      const btnSave = document.getElementById('btnModalSaveObra');
      if (btnSave) btnSave.classList.add('hidden');

      if (u && (u.rol === 'licitaciones' || u.dependencia === 'Compras & Licitaciones') && item.estado === 'Proyecto') {
        const footerInfo = document.getElementById('modalObraFooterInfo');
        if (footerInfo) {
          footerInfo.innerHTML = `
            <span class="inline-flex items-center space-x-1.5 text-indigo-900 font-bold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
              <i data-lucide="eye" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Perfil Comprador: Vista preliminar de Proyecto (Solo Consulta). Se habilitará para licitar cuando finalice esta etapa.</span>
            </span>
          `;
        }
      }
    }

    // Configurar botón de Avanzar Etapa en el modal
    const nextStage = DataStore.getNextStage(item.estado);
    const canAdvanceThis = DataStore.canUserAdvanceItem(item);
    const canAvanzar = canAdvanceThis && u && !u.solo_lectura && u.rol !== 'visualizador';
    const btnAvanzarModal = document.getElementById('btnModalAvanzarEtapa');
    if (btnAvanzarModal) {
      if (nextStage && canAvanzar) {
        btnAvanzarModal.classList.remove('hidden');
        btnAvanzarModal.title = `Avanzar obra a "${nextStage}"`;
        btnAvanzarModal.innerHTML = `<span>Avanzar a ${nextStage}</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
      } else {
        btnAvanzarModal.classList.add('hidden');
      }
    }

    // Alerta de ingreso de fecha estimada para el proyectista en Obras en Curso
    const noticeEnCurso = document.getElementById('modalObraEnCursoFechaNotice');
    if (noticeEnCurso) {
      const isEnCurso = (item.estado === 'Obras en Curso');
      const needsDate = !item.fecha_fin_obra || item.fecha_fin_obra === '';
      noticeEnCurso.classList.toggle('hidden', !(isEnCurso && canEdit && needsDate));
    }

    document.getElementById('modalObraDetail').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  handleModalAvanzarEtapa() {
    const id = document.getElementById('modalObraId')?.innerText;
    if (!id) return;
    this.closeObraModal();
    this.openTransitionModal(id);
  },

  saveObraModal() {
    const id = document.getElementById('modalObraId').innerText;
    const item = DataStore.getItemById(id);
    if (!item) return;

    const isAdmin = DataStore.isAdmin();
    const canEdit = DataStore.canUserEditObra(item);

    if (!isAdmin && !canEdit) {
      alert("⛔ Acceso Denegado: Solo el Administrador o el responsable asignado pueden editar esta obra.");
      return;
    }

    const u = DataStore.currentUser;

    if (!isAdmin && canEdit) {
      // Edición por parte del profesional responsable a cargo
      const newFechaInicio = document.getElementById('modalObraFechaInicio').value;
      const newFechaFin = document.getElementById('modalObraFechaFin').value;
      const newFechaFinGlobal = document.getElementById('modalObraFechaFinGlobal').value;
      const newObs = document.getElementById('modalObraObservaciones').value;

      item.fecha_inicio_etapa = newFechaInicio;
      item.fecha_fin_etapa = newFechaFin;
      item.fecha_fin_obra = newFechaFinGlobal;
      item.observaciones = newObs;

      if (!item.historial) item.historial = [];
      item.historial.unshift({
        fecha: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        usuario: `${u.nombre} (Responsable a cargo)`,
        estado_anterior: item.estado,
        estado_nuevo: item.estado,
        observaciones: `✏️ Actualización de fechas / notas por responsable a cargo.`
      });

      DataStore.saveItem(item);
      this.render();
      this.closeObraModal();
      this.showToast(`✅ Cambios guardados por ${u.nombre} en "${item.nombre}".`);
      return;
    }

    const oldNombre = item.nombre;
    const oldMontoTotal = item.monto_total_usd;
    const oldResponsable = item.responsable;
    const oldFechaFin = item.fecha_fin_etapa;
    const oldEstado = item.estado;
    const oldPartida = (item.partida || '').trim();

    const newTitle = document.getElementById('modalObraTitle').value.trim();
    if (!newTitle) {
      alert("⚠️ El nombre de la tarea / obra no puede quedar vacío.");
      document.getElementById('modalObraTitle').focus();
      return;
    }

    const newSede = document.getElementById('modalObraSede').value;
    const newTipo = document.getElementById('modalObraTipo').value;
    const newEstado = document.getElementById('modalObraEstado').value;
    const newPartida = document.getElementById('modalObraPartida').value.trim();
    const modalObraMontoPartida = document.getElementById('modalObraMontoPartida');
    const newMontoPartida = modalObraMontoPartida ? DataStore.parseCurrency(modalObraMontoPartida.value) || 0 : 0;
    const newMontoObra = parseFloat(document.getElementById('modalObraMontoObra').value) || 0;
    const newMontoEquip = parseFloat(document.getElementById('modalObraMontoEquip').value) || 0;
    const newMontoTotal = newMontoObra + newMontoEquip;
    const newM2 = parseFloat(document.getElementById('modalObraM2')?.value) || 0;

    // Validación de M2: Obligatorio para Obra Civil (mayor a 0), opcional para Infraestructura
    if (newTipo === 'Obra Civil' && newM2 <= 0) {
      alert("⚠️ Para 'Obra Civil', la Superficie (M2) es obligatoria y debe ser mayor a 0.");
      document.getElementById('modalObraM2')?.focus();
      return;
    }

    const selResp = document.getElementById('modalObraResponsableSelect');
    let newResponsable = '';
    let newResponsableId = '';
    if (selResp && selResp.value) {
      const selVal = selResp.value;
      if (selVal.startsWith('custom:')) {
        newResponsable = selVal.replace('custom:', '');
        newResponsableId = '';
      } else {
        const uObj = (DataStore.users || []).find(u => u.id === selVal);
        if (uObj) {
          newResponsable = uObj.nombre;
          newResponsableId = uObj.id;
        } else {
          newResponsable = selVal;
          newResponsableId = '';
        }
      }
    } else if (selResp && !selResp.value) {
      newResponsable = 'Sin Asignar';
      newResponsableId = '';
    } else {
      newResponsable = (document.getElementById('modalObraResponsable')?.value || '').trim() || 'Sin Asignar';
      newResponsableId = (document.getElementById('modalObraResponsableId')?.value || '').trim();
    }

    const newProveedor = document.getElementById('modalObraProveedor').value.trim();
    const newFechaInicio = document.getElementById('modalObraFechaInicio').value;
    const newFechaFin = document.getElementById('modalObraFechaFin').value;
    const newFechaFinGlobal = document.getElementById('modalObraFechaFinGlobal').value;

    // Resumen de modificaciones para auditoría
    const changes = [];
    if (oldNombre !== newTitle) changes.push(`Tarea: "${oldNombre}" ➔ "${newTitle}"`);
    if (oldMontoTotal !== newMontoTotal) changes.push(`Monto: USD ${DataStore.formatUSD(oldMontoTotal)} ➔ USD ${DataStore.formatUSD(newMontoTotal)}`);
    if ((item.superficie_m2 || 0) !== newM2) changes.push(`M2: ${item.superficie_m2 || 0} ➔ ${newM2}`);
    if ((oldResponsable || '') !== newResponsable) changes.push(`Responsable: "${oldResponsable || 'Sin asignar'}" ➔ "${newResponsable || 'Sin asignar'}"`);
    if ((oldFechaFin || '') !== newFechaFin) changes.push(`Fecha Fin: "${oldFechaFin || 'S/D'}" ➔ "${newFechaFin || 'S/D'}"`);
    if (oldEstado !== newEstado) changes.push(`Estado: "${oldEstado}" ➔ "${newEstado}"`);
    if (oldPartida !== newPartida) changes.push(`Partida: "${oldPartida || 'Pendiente'}" ➔ "${newPartida || 'Pendiente'}"`);

    const selDep = document.getElementById('modalObraDependenciaSelect');
    let newDep = selDep ? selDep.value : (item.dependencia || DataStore.getObraDependencia(item));

    // Si se asignó un usuario formal con dependencia operativa, la dependencia de la obra
    // se sincroniza obligatoriamente con la de dicho responsable para garantizar aislamiento estricto
    const chosenUser = newResponsableId ? (DataStore.users || []).find(u => u.id === newResponsableId) : null;
    if (chosenUser && chosenUser.dependencia && chosenUser.dependencia !== 'Dirección General / Administración') {
      newDep = chosenUser.dependencia;
      if (selDep) selDep.value = newDep;
    }

    const oldDep = item.dependencia || DataStore.getObraDependencia(item);
    if (newDep && oldDep !== newDep) {
      changes.push(`Dependencia: "${oldDep}" ➔ "${newDep}"`);
      item.dependencia = newDep;
    } else if (!item.dependencia) {
      item.dependencia = newDep;
    }

    item.nombre = newTitle;
    item.sede = newSede;
    item.tipo = newTipo;
    item.estado = newEstado;
    item.partida = newPartida;
    if (newPartida) {
      if (newMontoPartida > 0) {
        item.monto_partida_usd = newMontoPartida;
      } else if (!item.monto_partida_usd) {
        item.monto_partida_usd = newMontoTotal;
      }
    } else {
      item.monto_partida_usd = newMontoPartida > 0 ? newMontoPartida : 0;
    }

    const getVal = (id, fallback = '') => {
      const el = document.getElementById(id);
      return el ? el.value : fallback;
    };

    item.categoria = getVal('modalObraCategoria', item.categoria || 'Obra Civil');
    item.clasificacion = getVal('modalObraClasificacion', item.clasificacion || '');
    item.monto_obra_usd = newMontoObra;
    item.monto_equipamiento_usd = newMontoEquip;
    item.monto_total_usd = newMontoTotal;
    item.superficie_m2 = newM2;
    item.costo_usd_m2 = newM2 > 0 ? (Math.round((newMontoTotal / newM2) * 100) / 100) : 0;
    item.responsable = newResponsable;
    item.responsable_id = newResponsableId || null;
    item.proveedor = newProveedor;
    item.fecha_inicio_etapa = newFechaInicio;
    const isFact = (item.estado === 'Estudio de Factibilidad' || item.estado === 'Ante Proyecto');
    if (isFact) {
      item.fecha_fin_etapa = null;
      item.fecha_fin_obra = null;
      item.requiere_plazo_etapa = false;
    } else {
      item.fecha_fin_etapa = newFechaFin;
      item.fecha_fin_obra = newFechaFinGlobal;
    }

    item.prioridad_tecnica = parseFloat(getVal('modalObraPrioridadTec')) || 1;
    const pMedInput = parseFloat(getVal('modalObraPrioridadMed')) || null;
    if (pMedInput !== null && pMedInput > 0) {
      item.prioridad_medica = pMedInput;
      item.prioridad_medica_origen = 'Dirección Médica';
      item.prioridad_medica_ponderada_default = false;
      item.prioridad_medica_nota = 'Definida formalmente por Dirección Médica';
    } else if (DataStore.hasValidPartida(item) || item.estado === 'Proyecto') {
      item.prioridad_medica = item.prioridad_tecnica;
      item.prioridad_medica_origen = 'Default (Ponderada por falta de Dirección Médica)';
      item.prioridad_medica_ponderada_default = true;
      item.prioridad_medica_nota = 'Ponderada por default por no contar con criticidad de Dirección';
    } else {
      item.prioridad_medica = null;
      item.prioridad_medica_ponderada_default = false;
    }

    // Anticipo en Orden de Compra y Plazo de Ejecución
    const inputOC = document.getElementById('modalObraOrdenCompra');
    if (inputOC) {
      const ocVal = inputOC.value.trim();
      item.orden_compra = ocVal;
      item.numero_oc = ocVal;
    }
    const inputAnticipoPct = document.getElementById('modalObraAnticipoPct');
    if (inputAnticipoPct) {
      const aPct = Math.min(100, Math.max(0, parseFloat(inputAnticipoPct.value) || 0));
      item.anticipo_porcentaje = aPct;
      const baseMonto = item.monto_adjudicado_usd || newMontoTotal;
      item.anticipo_monto_usd = Math.round((baseMonto * (aPct / 100)) * 100) / 100;
    }
    const inputPlazoMeses = document.getElementById('modalObraPlazoMeses');
    if (inputPlazoMeses && inputPlazoMeses.value) {
      const pMeses = parseInt(inputPlazoMeses.value, 10) || 0;
      if (pMeses > 0) item.plazo_meses = pMeses;
    }

    const pond = DataStore.getPonderacionGlobal(item);
    item.prioridad_final = pond.valor;
    item.observaciones = getVal('modalObraObservaciones', '');

    // Sincronizar estructura de cashflow si existe
    if (item.cashflow && typeof item.cashflow === 'object') {
      item.cashflow.monto_total = newMontoTotal;
      const sumYears = (item.cashflow.cashflow_2026 || 0) + (item.cashflow.cashflow_2027 || 0) + (item.cashflow.cashflow_2028 || 0) + (item.cashflow.cashflow_2029 || 0);
      if (sumYears === 0 || (item.cashflow.cashflow_2027 === 0 && item.cashflow.cashflow_2028 === 0 && item.cashflow.cashflow_2029 === 0)) {
        item.cashflow.cashflow_2026 = newMontoTotal;
      }
    }

    if (!item.historial) item.historial = [];
    const changeSummary = changes.length > 0 ? changes.join(' | ') : 'Edición general de campos maestros';
    item.historial.unshift({
      fecha: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      usuario: `${u.nombre} (Administrador)`,
      estado_anterior: oldEstado,
      estado_nuevo: item.estado,
      observaciones: `✏️ Modificación Administrativa: ${changeSummary}`
    });

    // Sincronización automática de partida presupuestaria en el resto de los registros vinculados
    let syncCount = 0;
    const chkSync = document.getElementById('chkSyncSharedPartida');
    const shouldSync = chkSync ? chkSync.checked : true;

    if (shouldSync && oldPartida && oldPartida !== 'S/D' && oldPartida.toUpperCase() !== 'PENDIENTE' && (oldPartida !== newPartida || (newMontoPartida > 0 && newMontoPartida !== item.monto_partida_usd))) {
      const relatedToUpdate = DataStore.items.filter(x => x.id !== item.id && (x.partida || '').trim() === oldPartida);
      relatedToUpdate.forEach(rel => {
        rel.partida = newPartida;
        if (newMontoPartida > 0) {
          rel.monto_partida_usd = newMontoPartida;
        }
        if (!rel.historial) rel.historial = [];
        rel.historial.unshift({
          fecha: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          usuario: `${u.nombre} (Administrador)`,
          estado_anterior: rel.estado,
          estado_nuevo: rel.estado,
          observaciones: `🔄 Sincronización automática: Partida presupuestaria modificada en ${item.id} de "${oldPartida}" a "${newPartida}"`
        });
        DataStore.saveItem(rel);
        syncCount++;
      });
    }

    DataStore.saveItem(item);
    this.toggleAdminEditMode(false);
    this.closeObraModal();
    this.render();

    if (syncCount > 0) {
      this.showToast(`✅ Obra "${item.id}" y ${syncCount} registro(s) vinculado(s) actualizados en todos los tableros`);
    } else {
      this.showToast(`✅ Obra "${item.id}" actualizada exitosamente en todos los tableros y registros`);
    }
  },

  closeObraModal() {
    this.adminEditModeActive = false;
    document.getElementById('modalObraDetail').classList.add('hidden');
  },

  openSettingsModal() {
    console.info("Configuración de base de datos desacoplada de la interfaz; gestionada a nivel de backend.");
  },

  saveSettingsModal() {},

  closeSettingsModal() {},

  updateCloudStatusUI() {
    const indicator = document.getElementById('cloudStatusIndicator');
    const text = document.getElementById('cloudStatusText');
    if (SupabaseManager.isConfigured) {
      if (indicator) indicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
      if (text) text.innerText = 'Supabase Cloud';
    } else {
      if (indicator) indicator.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
      if (text) text.innerText = 'Modo Local / Demo';
    }
  },

  exportExcel() {
    DataStore.exportToExcel(this.filters);
  },

  showToast(msg) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3500);
  }
};

window.App = App;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

