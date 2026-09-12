// ==============================================================================
// CONTROLADOR PRINCIPAL SIGO HIBA v2.2
// Gráfico interactivo con desglose por clic, Limpieza de filtros y USD estricto
// ==============================================================================

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
    DataStore.init();
    SupabaseManager.init();

    this.setupEventListeners();
    this.updateCloudStatusUI();

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
    document.getElementById('kpiTotalProyectos').innerText = `${kpis.totalItems} proyectos en lista`;

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
      
      const labels = [
        'Estudio de Factibilidad', 
        'Proyecto', 
        'Proyecto para licitar', 
        'En licitación', 
        'Obras en Curso', 
        'Obras Finalizadas', 
        'Suspendida'
      ];

      const dataValues = labels.map(lbl => kpis.estadosCount[lbl] || 0);
      const dataUsd = labels.map(lbl => (kpis.estadosUsd && kpis.estadosUsd[lbl]) ? kpis.estadosUsd[lbl] : 0);

      // Colores de las barras con borde destacado si una barra está seleccionada
      const baseColors = [
        '#94a3b8', '#3b82f6', '#0284c7', 
        '#eab308', '#22c55e', '#10b981', '#f43f5e'
      ];

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
                  if (label === 'Proyecto para licitar') return 'Para Licitar';
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
      // Filtrar todas las obras de la etapa seleccionada respetando filtros generales (Sede, Tipo)
      itemsToDisplay = DataStore.items.filter(item => {
        if (item.estado !== this.pipelineSelectedStage) return false;
        if (this.filters.sede !== 'TODAS' && (item.sede || '').toLowerCase() !== this.filters.sede.toLowerCase()) return false;
        if (this.filters.tipo !== 'TODOS' && item.tipo !== this.filters.tipo) return false;
        return true;
      });

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
        subtitleContainer.innerText = `Total comprometido en esta etapa: ${DataStore.formatUSD(totalStageUsd)}`;
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

    let html = '<div class="divide-y divide-slate-100">';
    itemsToDisplay.forEach(item => {
      const sem = DataStore.calculateSemaforo(item);
      const pond = DataStore.getPonderacionGlobal(item);
      const monto = DataStore.formatUSD(item.monto_total_usd || item.monto_obra_usd || 0);
      const nextStage = DataStore.getNextStage(item.estado);
      const u = DataStore.currentUser;
      const isAdmin = DataStore.isAdmin();
      const canAdvanceThis = DataStore.canUserAdvanceItem(item);
      const canAvanzar = canAdvanceThis && u && !u.solo_lectura && u.rol !== 'visualizador';
      const isCorta = DataStore.isPartidaCorta(item);
      const deficit = isCorta ? DataStore.getPartidaDeficit(item) : 0;
      const isAssigned = DataStore.isObraAssigned(item);

      html += `
        <div class="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition ${
          isCorta ? 'bg-rose-50/50 border-l-4 border-rose-500 my-1' :
          (!isAssigned && isAdmin ? 'bg-amber-50/40 border-l-4 border-amber-400 my-1' : '')
        }" onclick="App.openObraModal('${item.id}')">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-semibold rounded-md ${sem.class}">
              ${sem.label}
            </span>
            <div>
              <div class="font-bold text-slate-800 text-sm flex items-center space-x-2 flex-wrap">
                <span>${item.nombre}</span>
                <span class="px-1.5 py-0.2 text-[10px] rounded border ${pond.colorClass}">
                  ${pond.nivelLabel} (${pond.valor}★)
                </span>
                ${!item.partida || item.partida === 'S/D' ? `<span class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">Sin Partida</span>` : ''}
                ${isCorta ? `<span class="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.2 rounded font-bold border border-rose-300 inline-flex items-center space-x-1" title="Partida asignada menor al costo requerido (-USD ${DataStore.formatUSD(deficit)})"><i data-lucide="alert-triangle" class="w-2.5 h-2.5 text-rose-600"></i><span>Partida Corta (-USD ${DataStore.formatUSD(deficit)})</span></span>` : ''}
              </div>
              <div class="text-xs text-slate-400 flex items-center space-x-2 mt-0.5 flex-wrap gap-y-1">
                <span class="font-semibold text-slate-600">📍 ${item.sede}</span>
                <span>•</span>
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">${item.dependencia || DataStore.getObraDependencia(item)}</span>
                <span>•</span>
                <span>Fase: <strong class="text-blue-600">${item.estado}</strong></span>
                <span>•</span>
                ${isAssigned ? `
                  <span class="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center space-x-1" title="Obra a cargo de ${item.responsable}">
                    <i data-lucide="user-check" class="w-3 h-3 text-emerald-600"></i>
                    <span>Asignada: <strong>${item.responsable}</strong></span>
                  </span>
                ` : `
                  <span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center space-x-1" title="Obra pendiente de ser asignada a un responsable">
                    <i data-lucide="alert-circle" class="w-3 h-3 text-amber-600"></i>
                    <span>⚠️ Sin Asignar</span>
                  </span>
                `}
                ${(!isAdmin && !canAdvanceThis) ? `
                  <span class="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1" title="Solo lectura departamental"><i data-lucide="eye" class="w-2.5 h-2.5 text-slate-400"></i><span>Consulta</span></span>
                ` : ''}
                ${item.sector_solicitante ? `<span>• Sector: <strong>${item.sector_solicitante}</strong></span>` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <div class="text-right mr-2">
              <div class="text-sm font-bold text-slate-800">${monto}</div>
              <div class="text-xs text-slate-400">${item.fecha_fin_etapa ? 'Límite: ' + item.fecha_fin_etapa : 'Sin fecha'}</div>
            </div>
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
            ` : (nextStage && !isAdmin ? `<span class="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]" title="Solo el responsable asignado puede certificar esta obra">🔒 ${item.responsable || 'Sin Asignar'}</span>` : '')}
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

    let stages = [
      'Estudio de Factibilidad',
      'Proyecto',
      'Proyecto para licitar',
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

      html += `
        <div class="kanban-column flex flex-col p-3 shadow-xs border border-slate-200">
          <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-xs text-slate-800 uppercase tracking-wide">${stage}</span>
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

              <div class="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-500 mb-2.5 flex items-center justify-between">
                <span>Límite etapa:</span>
                <span class="font-semibold ${sem.status === 'vencido' ? 'text-red-600 font-bold' : 'text-slate-700'}">
                  ${item.fecha_fin_etapa || 'Sin fecha'}
                </span>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div class="truncate max-w-[130px]">
                  ${isAssigned ? `
                    <span class="text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold truncate inline-flex items-center space-x-1" title="Asignada a: ${item.responsable}">
                      <i data-lucide="user-check" class="w-2.5 h-2.5 text-emerald-600 shrink-0"></i>
                      <span class="truncate">${item.responsable}</span>
                    </span>
                  ` : `
                    <span class="text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center space-x-1" title="Pendiente de asignación">
                      <i data-lucide="alert-circle" class="w-2.5 h-2.5 text-amber-600 shrink-0"></i>
                      <span>Sin Asignar</span>
                    </span>
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
                  ` : (nextStage && !isAdmin ? `<span class="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]" title="Solo el responsable asignado puede certificar esta obra">🔒</span>` : '')}
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
              <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold" title="Obra sin responsable asignado">
                <i data-lucide="alert-circle" class="w-3 h-3 text-amber-600"></i>
                <span>Sin Asignar</span>
              </span>
            `}
            ${(!isAdmin && !canAdvanceThis) ? `
              <span class="text-slate-400 text-[10px] ml-1 font-medium" title="Consulta departamental">👁️</span>
            ` : ''}
          </td>
          <td class="py-3 px-4 text-xs text-slate-500">${item.fecha_fin_etapa || '-'}</td>
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
              ` : (nextStage && !isAdmin ? `<span class="text-slate-400 text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 rounded" title="Solo puede avanzar el responsable asignado: ${item.responsable || 'Sin Asignar'}">🔒 ${item.responsable || 'Sin Asignar'}</span>` : (!isAdmin ? `<span class="text-slate-300 text-xs font-mono">-</span>` : ''))}
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
      .filter(x => x.fecha_inicio_etapa || x.fecha_fin_etapa || x.fecha_fin_obra)
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

    // 3. Obtener métricas y datos calculados desde DataStore
    const summary = DataStore.getCashflowSummary(this.cashflowFilterTipo, this.cashflowFilterPartida, this.cashflowSearch);

    // 4. Renderizar Tarjetas de Resumen KPI
    const kpiContainer = document.getElementById('cashflowKpiCards');
    if (kpiContainer) {
      const pctCob = summary.totalCarteraUSD > 0 
        ? Math.round((summary.totalAsignadoPartidasUSD / summary.totalCarteraUSD) * 100) 
        : 0;

      kpiContainer.innerHTML = `
        <!-- KPI 1: TOTAL ASIGNADO EN DINERO (PARTIDAS) -->
        <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
              <i data-lucide="badge-dollar-sign" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Total Asignado en Partidas</span>
            </span>
            <span class="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              ${summary.countConPartida} obras
            </span>
          </div>
          <div class="text-xl sm:text-2xl font-black text-emerald-950 mt-1.5">
            ${DataStore.formatUSD(summary.totalAsignadoPartidasUSD)}
          </div>
          <div class="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center space-x-1">
            <i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-600"></i>
            <span>Suma total de partidas asignadas (${pctCob}% de cartera)</span>
          </div>
        </div>

        <!-- KPI 2: TOTAL CARTERA PROYECTADA -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <i data-lucide="layers" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Presupuesto Cartera Proyectada</span>
            </span>
            <span class="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              ${summary.totalObras} proyectos
            </span>
          </div>
          <div class="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
            ${DataStore.formatUSD(summary.totalCarteraUSD)}
          </div>
          <div class="text-[11px] text-slate-500 font-medium mt-1">
            Segmento: <strong>${this.cashflowFilterTipo === 'TODOS' ? 'Todo el Cashflow (Consolidado)' : this.cashflowFilterTipo}</strong>
          </div>
        </div>

        <!-- KPI 3: DESEMBOLSOS MULTIANUALES -->
        <div class="bg-blue-50/60 p-4 rounded-xl border border-blue-100 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center space-x-1">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Desembolso 2026 - 2027</span>
            </span>
            <span class="text-[10px] font-bold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full">
              Bienio Inmediato
            </span>
          </div>
          <div class="text-xl sm:text-2xl font-black text-blue-950 mt-1.5">
            ${DataStore.formatUSD(summary.tot2026Global + summary.tot2027Global)}
          </div>
          <div class="text-[10px] text-blue-800/80 font-semibold mt-1 flex items-center justify-between">
            <span>2026: <strong>${DataStore.formatUSD(summary.tot2026Global)}</strong></span>
            <span>2027: <strong>${DataStore.formatUSD(summary.tot2027Global)}</strong></span>
          </div>
        </div>

        <!-- KPI 4: PENDIENTE DE ASIGNACIÓN -->
        <div class="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600"></i>
              <span>Pendiente de Asignar Partida</span>
            </span>
            <span class="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              ${summary.countSinPartida} obras
            </span>
          </div>
          <div class="text-xl sm:text-2xl font-black text-amber-950 mt-1.5">
            ${DataStore.formatUSD(summary.totalSinPartidaUSD)}
          </div>
          <div class="text-[11px] text-amber-700 font-semibold mt-1">
            En Factibilidad o sin asignación presupuestaria formal
          </div>
        </div>
      `;
    }

    // 5. Renderizar Tabla de Cashflow
    if (summary.displayList.length === 0) {
      cashflowContainer.innerHTML = `
        <div class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <i data-lucide="folder-search" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
          <p class="text-sm font-bold text-slate-600">No se encontraron obras para los filtros seleccionados</p>
          <p class="text-xs text-slate-400 mt-1">Prueba cambiando el tipo de obra o el filtro de partida presupuestaria.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th class="py-3 px-3">Sede</th>
              <th class="py-3 px-3">Módulo</th>
              <th class="py-3 px-3">Proyecto / Obra</th>
              <th class="py-3 px-3">Partida Presupuestaria</th>
              <th class="py-3 px-3 text-right">Monto Total USD</th>
              <th class="py-3 px-3 text-right">2026</th>
              <th class="py-3 px-3 text-right">2027</th>
              <th class="py-3 px-3 text-right">2028</th>
              <th class="py-3 px-3 text-right">2029</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
    `;

    summary.displayList.forEach(x => {
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

      const mTotal = (x.cashflow && x.cashflow.monto_total > 0) ? x.cashflow.monto_total : (x.monto_total_usd || x.monto_obra_usd || 0);
      const c2026 = (x.cashflow && x.cashflow.cashflow_2026) || (!x.cashflow ? mTotal : 0);
      const c2027 = (x.cashflow && x.cashflow.cashflow_2027) || 0;
      const c2028 = (x.cashflow && x.cashflow.cashflow_2028) || 0;
      const c2029 = (x.cashflow && x.cashflow.cashflow_2029) || 0;

      html += `
        <tr class="hover:bg-slate-50 cursor-pointer transition" onclick="App.openObraModal('${x.id}')">
          <td class="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">${x.sede}</td>
          <td class="py-2.5 px-3 whitespace-nowrap">${tipoBadge}</td>
          <td class="py-2.5 px-3">
            <div class="font-bold text-slate-800 text-xs">${x.nombre}</div>
            <div class="text-[10px] text-slate-400 font-mono">${x.id} • ${x.estado || 'Estudio'}</div>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">${partidaBadge}</td>
          <td class="py-2.5 px-3 text-right font-black text-slate-900">${DataStore.formatUSD(mTotal)}</td>
          <td class="py-2.5 px-3 text-right text-slate-700 font-medium">${DataStore.formatUSD(c2026)}</td>
          <td class="py-2.5 px-3 text-right text-slate-700 font-medium">${DataStore.formatUSD(c2027)}</td>
          <td class="py-2.5 px-3 text-right text-slate-700 font-medium">${DataStore.formatUSD(c2028)}</td>
          <td class="py-2.5 px-3 text-right text-slate-700 font-medium">${DataStore.formatUSD(c2029)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
          <tfoot>
            <tr class="bg-slate-200/90 font-bold text-slate-900 border-t-2 border-slate-300">
              <td colspan="3" class="py-3 px-3 text-xs uppercase tracking-wider font-extrabold">
                TOTALES MOSTRADOS (${summary.displayList.length} obras)
              </td>
              <td class="py-3 px-3 text-xs font-black text-emerald-800">
                <span class="text-[10px] text-emerald-700 block font-normal uppercase">Asignado Partidas:</span>
                ${DataStore.formatUSD(summary.displayTotPartidas)}
              </td>
              <td class="py-3 px-3 text-right text-sm font-black text-slate-900">${DataStore.formatUSD(summary.displayTotGral)}</td>
              <td class="py-3 px-3 text-right font-bold text-slate-800">${DataStore.formatUSD(summary.displayTot2026)}</td>
              <td class="py-3 px-3 text-right font-bold text-slate-800">${DataStore.formatUSD(summary.displayTot2027)}</td>
              <td class="py-3 px-3 text-right font-bold text-slate-800">${DataStore.formatUSD(summary.displayTot2028)}</td>
              <td class="py-3 px-3 text-right font-bold text-slate-800">${DataStore.formatUSD(summary.displayTot2029)}</td>
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

    const montoVal = parseFloat(inputMonto.value) || 0;
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

    if (!monto || parseFloat(monto) <= 0) {
      alert("Debes indicar un monto válido mayor a 0 para la partida presupuestaria (USD).");
      return;
    }

    const res = DataStore.asignarPartidaPresupuestaria(id, num, monto);
    if (res.success) {
      this.closeAsignarPartidaModal();
      this.render();
      this.showToast(`Partida N° ${res.partida} asignada por ${DataStore.formatUSD(res.monto_partida_usd)}. Habilitada para Proyecto.`);
    } else {
      alert(res.msg);
    }
  },

  // ================= MODAL AVANCE SECUENCIAL =================
  openTransitionModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    const u = DataStore.currentUser;
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
    
    const defaultDeadline = DataStore.getDefaultDeadlineForStage(nextStage);
    document.getElementById('transNewDeadline').value = defaultDeadline;

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

    if (quickPartidaInput) quickPartidaInput.value = item.partida || '';
    const defMonto = item.monto_partida_usd || item.monto_total_usd || item.monto_obra_usd || (item.cashflow ? item.cashflow.monto_total : '') || '';
    if (quickMontoInput) quickMontoInput.value = (defMonto > 0) ? defMonto : '';

    const requierePartida = (currentStage === 'Estudio de Factibilidad' && nextStage === 'Proyecto');
    const tienePartida = DataStore.hasValidPartida(item) && (item.monto_partida_usd > 0 || item.monto_total_usd > 0);

    if (requierePartida && !tienePartida) {
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
    }

    const alertFinal = document.getElementById('transFinalNotice');
    if (alertFinal) {
      alertFinal.classList.toggle('hidden', nextStage !== 'Obras Finalizadas');
    }

    document.getElementById('modalTransition').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  confirmTransition() {
    const id = document.getElementById('transItemId').value;
    const item = DataStore.getItemById(id);
    if (!item) return;

    const u = DataStore.currentUser;
    const isAdmin = DataStore.isAdmin();
    if (!u || u.solo_lectura || u.rol === 'visualizador' || !u.puede_avanzar) {
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

    if (currentStage === 'Estudio de Factibilidad' && nextStage === 'Proyecto') {
      if (!hasPartida && !enteredPartida && !u.puede_asignar_partida && !isAdmin) {
        alert("⛔ No es posible avanzar a la etapa de Proyecto:\n\nEsta obra requiere que Dirección Médica o Administración asigne una Partida Presupuestaria previamente.");
        return;
      }
    }

    const compDate = document.getElementById('transCompletionDate').value;
    const newDeadline = document.getElementById('transNewDeadline').value;
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

    if (enteredPartida) {
      if (!u.puede_asignar_partida) {
        alert("⛔ Acceso Denegado: No tienes el permiso específico para asignar partida presupuestaria.");
        return;
      }
      const montoToAssign = enteredMonto || item.monto_partida_usd || item.monto_total_usd || item.monto_obra_usd;
      const partRes = DataStore.asignarPartidaPresupuestaria(id, enteredPartida, montoToAssign);
      if (!partRes.success) {
        alert(partRes.msg);
        return;
      }
    }

    // VALIDACIÓN ESTRICTA: Para avanzar de Estudio de Factibilidad a Proyecto es OBLIGATORIO tener partida presupuestaria y monto
    if (currentStage === 'Estudio de Factibilidad' && nextStage === 'Proyecto') {
      const finalPartida = (item.partida || enteredPartida).trim();
      const finalMonto = item.monto_partida_usd || parseFloat(enteredMonto) || item.monto_total_usd || 0;
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

    const res = DataStore.confirmAndAdvanceStage(id, compDate, newDeadline, notes);
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
        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
          <td class="py-2.5 px-3">
            <div class="font-bold text-slate-800 font-mono text-blue-700">@${u.username || 'sin_usuario'}</div>
            ${u.debe_cambiar_clave ? '<span class="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1 mt-0.5"><i data-lucide="key" class="w-2.5 h-2.5"></i> Clave Provisoria</span>' : ''}
          </td>
          <td class="py-2.5 px-3">
            <div class="font-bold text-slate-800 flex items-center gap-1">
              <span>${u.nombre}</span>
              ${isCurrent ? '<span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">TÚ</span>' : ''}
            </div>
            <div class="text-[11px] text-slate-400 font-normal">${u.email || ''}</div>
          </td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
              ${u.dependencia || 'Sin Dependencia'}
            </span>
          </td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded font-semibold text-[11px] ${
              u.sede === 'Central' ? 'bg-blue-50 text-blue-700' :
              u.sede === 'San Justo' ? 'bg-emerald-50 text-emerald-700' :
              u.sede === 'Periféricos' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
            }">${u.sede}</span>
          </td>
          <td class="py-2.5 px-3 font-semibold text-slate-700 uppercase text-[10px]">${u.rol}</td>
          <td class="py-2.5 px-3">
            <div class="flex items-center space-x-1.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                obraCount > 0 ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }">
                ${obraCount} ${obraCount === 1 ? 'obra' : 'obras'}
              </span>
              <button type="button" onclick="App.openAssignUserObrasModal('${u.id}')" 
                      class="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold inline-flex items-center space-x-1 transition cursor-pointer"
                      title="Asignar o desasignar obras a este usuario">
                <i data-lucide="folder-plus" class="w-3 h-3 text-emerald-600"></i>
                <span>Asignar</span>
              </button>
            </div>
          </td>
          <td class="py-2.5 px-3">
            ${u.activo 
              ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Acceso Habilitado</span>' 
              : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>Acceso Revocado</span>'
            }
          </td>
          <td class="py-2.5 px-3 text-right">
            <div class="flex items-center justify-end space-x-1.5 flex-wrap gap-y-1">
              <!-- 0. Botón Asignar Cartera de Obras -->
              <button type="button" onclick="App.openAssignUserObrasModal('${u.id}')" title="Asignar cartera de obras e infraestructura a este usuario" class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1">
                <i data-lucide="folder-kanban" class="w-3 h-3 text-emerald-600"></i>
                <span>Asignar</span>
              </button>

              <!-- 1. Botón Cambiar Permisos -->
              <button type="button" onclick="App.openEditPermissionsModal('${u.id}')" title="Modificar rol, sede y permisos granulares" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1">
                <i data-lucide="settings" class="w-3 h-3"></i>
                <span>Permisos</span>
              </button>

              <!-- 2. Botón Quitar/Habilitar Acceso -->
              ${!isCurrent ? `
                <button type="button" onclick="App.handleToggleAccess('${u.id}')" title="${u.activo ? 'Quitar acceso al sistema' : 'Habilitar acceso al sistema'}" class="px-2 py-1 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1 border ${
                  u.activo ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                }">
                  <i data-lucide="${u.activo ? 'lock' : 'unlock'}" class="w-3 h-3"></i>
                  <span>${u.activo ? 'Quitar Acceso' : 'Habilitar Acceso'}</span>
                </button>
              ` : ''}

              <!-- 3. Botón Forzar Cambio de Clave -->
              <button type="button" onclick="App.handleForcePasswordChange('${u.id}')" title="Generar clave temporal obligatoria por olvido de contraseña" class="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1">
                <i data-lucide="key" class="w-3 h-3"></i>
                <span>Forzar Clave</span>
              </button>

              <!-- 4. Botón Eliminar Definitivamente -->
              ${!isCurrent ? `
                <button type="button" onclick="App.handleDeleteUserDirect('${u.id}')" title="Eliminar usuario definitivamente para que no vuelva a aparecer jamás" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold text-[11px] transition cursor-pointer flex items-center space-x-1">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                  <span>Eliminar</span>
                </button>
              ` : ''}

              <!-- Simular sesión rápida -->
              <button type="button" onclick="App.switchUserAccount('${u.id}')" title="Iniciar sesión con este perfil" class="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium transition cursor-pointer">
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
        const itemDep = item.dependencia || DataStore.getObraDependencia(item);
        if (itemDep !== depFilter) return false;
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
      document.getElementById('editUserDependencia').value = user.dependencia || 'Departamento de Proyectos Central';
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
    const select = document.getElementById('selectAuthorizedAccount');
    if (!select) return;

    const users = DataStore.users || [];
    select.innerHTML = '<option value="">-- Seleccionar cuenta para autocompletar --</option>' +
      users.map(u => `<option value="${u.username}">${u.nombre} (Usuario: ${u.username}) - Rol: ${u.rol.toUpperCase()}</option>`).join('');
  },

  handleQuickSelectAccount(username) {
    if (!username) return;
    const uInput = document.getElementById('inputLoginUsername');
    const pInput = document.getElementById('inputLoginPassword');
    if (uInput) uInput.value = username;
    if (pInput) {
      pInput.value = 'Admin2025!';
      if (typeof pInput.focus === 'function') pInput.focus();
    }
  },

  quickFillAdminLogin() {
    const uInput = document.getElementById('inputLoginUsername');
    const pInput = document.getElementById('inputLoginPassword');
    if (uInput) uInput.value = 'admin';
    if (pInput) {
      pInput.value = 'Admin2025!';
      if (typeof pInput.focus === 'function') pInput.focus();
    }
  },

  directLogin(username, password = 'Admin2025!') {
    const uInput = document.getElementById('inputLoginUsername');
    const pInput = document.getElementById('inputLoginPassword');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
    this.handleLoginSubmit();
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  },

  handleLoginSubmit() {
    const uInput = document.getElementById('inputLoginUsername');
    const pInput = document.getElementById('inputLoginPassword');
    const errBox = document.getElementById('loginErrorMessage');
    const errText = document.getElementById('loginErrorText');

    if (errBox) errBox.classList.add('hidden');

    const username = uInput?.value.trim();
    const password = pInput?.value;

    if (!username || !password) {
      if (errBox && errText) {
        errText.innerText = 'Por favor ingresa usuario y contraseña.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    const res = DataStore.authenticate(username, password);
    if (res.success) {
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
      if (errBox && errText) {
        errText.innerText = res.msg;
        errBox.classList.remove('hidden');
      } else {
        alert(res.msg);
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
    const depShort = (u.dependencia || '').replace('Departamento de ', 'Dpto. ');
    if (sedeEl) sedeEl.innerText = `${u.sede !== 'Todas' ? '📍 ' + u.sede : '🌐 Todas'} • ${depShort || 'General'}`;

    const depSelect = document.getElementById('filterDependencia');
    if (depSelect) {
      if (DataStore.isAdmin()) {
        depSelect.disabled = false;
        depSelect.classList.remove('bg-slate-200', 'cursor-not-allowed');
      } else if (u.dependencia && u.dependencia !== 'Dirección General / Administración') {
        depSelect.value = u.dependencia;
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

    const btnSettings = document.getElementById('btnSettingsTop');
    if (btnSettings) {
      btnSettings.classList.toggle('hidden', u.rol !== 'admin');
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
    const depVal = item.dependencia || DataStore.getObraDependencia(item);
    setVal('modalObraDependenciaSelect', depVal);
    const depBadge = document.getElementById('modalObraDepBadge');
    if (depBadge) {
      depBadge.innerText = (depVal || '').replace('Departamento de ', 'Dpto. ');
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
      } else if (item.responsable && item.responsable.trim() !== '' && item.responsable !== 'S/D' && item.responsable !== 'Sin Asignar') {
        selResp.value = `custom:${item.responsable}`;
      } else {
        selResp.value = '';
      }
      this.updateModalAssignmentBadge(selResp.value);
    }

    setVal('modalObraProveedor', item.proveedor || '');
    setVal('modalObraFechaInicio', item.fecha_inicio_etapa || '');
    setVal('modalObraFechaFin', item.fecha_fin_etapa || '');
    setVal('modalObraFechaFinGlobal', item.fecha_fin_obra || '');
    setVal('modalObraPrioridadTec', item.prioridad_tecnica || 1);
    setVal('modalObraPrioridadMed', item.prioridad_medica || '');
    setVal('modalObraPrioridadFin', pond.valor || 1);
    setVal('modalObraObservaciones', item.observaciones || '');

    // Calcular instantáneamente precio por m2 y actualizar desglose con signos
    this.calculateModalUsdM2();
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
      }
    }
    this.updateModalAssignmentBadge(val);
  },

  updateModalAssignmentBadge(val) {
    const badge = document.getElementById('modalObraAssignmentBadge');
    if (!badge) return;
    if (!val) {
      badge.innerHTML = `<span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3 text-amber-600"></i><span>Sin Asignar</span></span>`;
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
          deptNoticeText.innerHTML = `<strong>Modo Consulta Departamental:</strong> Esta obra pertenece a <strong>${itemDep}</strong>, asignada a <strong>${item.responsable || 'otro profesional'}</strong>. Puedes visualizarla pero solo el responsable asignado o el Administrador pueden editarla.`;
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
        'modalObraCategoria', 'modalObraPrioridadTec', 'modalObraPrioridadMed', 'modalObraDependenciaSelect'
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
      // Modo consulta departamental (solo lectura)
      this.toggleAdminEditMode(false);
      const btnSave = document.getElementById('btnModalSaveObra');
      if (btnSave) btnSave.classList.add('hidden');
    }

    document.getElementById('modalObraDetail').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
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

    const u = DataStore.currentUser;
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
    const newMontoPartida = modalObraMontoPartida ? parseFloat(modalObraMontoPartida.value) || 0 : 0;
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
    const newDep = selDep ? selDep.value : (item.dependencia || DataStore.getObraDependencia(item));
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
    item.fecha_fin_etapa = newFechaFin;
    item.fecha_fin_obra = newFechaFinGlobal;
    item.prioridad_tecnica = parseFloat(getVal('modalObraPrioridadTec')) || 1;
    item.prioridad_medica = parseFloat(getVal('modalObraPrioridadMed')) || null;

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
    const u = DataStore.currentUser;
    if (!u || u.rol !== 'admin') {
      alert("⛔ Acceso Denegado: Solo administradores pueden configurar la conexión a la base de datos.");
      return;
    }
    const creds = SupabaseManager.getCredentials();
    document.getElementById('inputSupabaseUrl').value = creds.url;
    document.getElementById('inputSupabaseKey').value = creds.key;
    document.getElementById('modalSettings').classList.remove('hidden');
  },

  saveSettingsModal() {
    const url = document.getElementById('inputSupabaseUrl').value;
    const key = document.getElementById('inputSupabaseKey').value;

    const success = SupabaseManager.setCredentials(url, key);
    this.updateCloudStatusUI();
    document.getElementById('modalSettings').classList.add('hidden');

    if (success) {
      this.showToast('Supabase conectado correctamente 🎉');
    } else {
      this.showToast('Conexión guardada. Modo local activo.');
    }
  },

  closeSettingsModal() {
    document.getElementById('modalSettings').classList.add('hidden');
  },

  updateCloudStatusUI() {
    const indicator = document.getElementById('cloudStatusIndicator');
    const text = document.getElementById('cloudStatusText');
    if (SupabaseManager.isConfigured) {
      indicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
      text.innerText = 'Supabase Cloud';
    } else {
      indicator.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
      text.innerText = 'Modo Local / Demo';
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
window.addEventListener('DOMContentLoaded', () => App.init());
