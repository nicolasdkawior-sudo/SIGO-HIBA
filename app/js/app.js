// ==============================================================================
// CONTROLADOR PRINCIPAL SIGO HIBA v2.1
// Formato USD estricto, Flujo de Factibilidad, Asignación de Partidas y Ponderación
// ==============================================================================

const App = {
  currentView: 'dashboard',
  filters: {
    sede: 'TODAS',
    tipo: 'TODOS',
    estado: 'TODOS',
    semaforo: 'TODOS',
    responsable: 'TODOS',
    filtroFinalizadas: 'activas', // 'activas', 'finalizadas', 'suspendidas', 'todas'
    search: ''
  },
  charts: {},

  init() {
    DataStore.init();
    SupabaseManager.init();

    if (DataStore.currentUser && DataStore.currentUser.sede !== 'Todas') {
      this.filters.sede = DataStore.currentUser.sede;
    }

    this.setupEventListeners();
    this.updateUserUI();
    this.updateCloudStatusUI();
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
    document.getElementById('filterSede')?.addEventListener('change', (e) => {
      this.filters.sede = e.target.value;
      this.render();
    });

    document.getElementById('filterTipo')?.addEventListener('change', (e) => {
      this.filters.tipo = e.target.value;
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

    this.render();
  },

  setSemaforoFilter(status) {
    this.filters.semaforo = this.filters.semaforo === status ? 'TODOS' : status;
    this.switchView('table');
  },

  render() {
    const kpis = DataStore.getKPIs(this.filters);
    this.renderKPIs(kpis);
    this.renderMedicalAlert();

    if (this.currentView === 'dashboard') {
      this.renderCharts(kpis);
      this.renderCriticalList();
    } else if (this.currentView === 'kanban') {
      this.renderKanban();
    } else if (this.currentView === 'table') {
      this.renderTable();
    } else if (this.currentView === 'gantt') {
      this.renderGantt();
    } else if (this.currentView === 'cashflow') {
      this.renderCashflow();
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderKPIs(kpis) {
    // 1. Inversión Cartera Activa (USD)
    document.getElementById('kpiTotalUsd').innerText = DataStore.formatUSD(kpis.totalCarteraActiva);
    document.getElementById('kpiTotalProyectos').innerText = `${kpis.totalItems} proyectos en lista`;

    // Desglose transparente
    const pillCivil = document.getElementById('kpiPillCivil');
    const pillEquip = document.getElementById('kpiPillEquip');
    const pillInfra = document.getElementById('kpiPillInfra');
    if (pillCivil) pillCivil.innerText = `Obra: ${DataStore.formatUSD(kpis.sumObraActiva)}`;
    if (pillEquip) pillEquip.innerText = `Equip: ${DataStore.formatUSD(kpis.sumEquipActivo)}`;
    if (pillInfra) pillInfra.innerText = `Infra: ${DataStore.formatUSD(kpis.sumInfraActiva)}`;

    // 2. En Plazo
    document.getElementById('kpiEnPlazoCount').innerText = `${kpis.enPlazo}`;
    document.getElementById('kpiEnPlazoPct').innerText = `${kpis.porcentajeEnPlazo}%`;

    // 3. Por Vencer & Vencidos
    document.getElementById('kpiPorVencerCount').innerText = `${kpis.porVencer}`;
    document.getElementById('kpiVencidosCount').innerText = `${kpis.vencidos}`;

    // 4. Finalizadas & Suspendidas
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
    if (count > 0 && (DataStore.currentUser.rol === 'direccion_medica' || DataStore.currentUser.rol === 'admin' || DataStore.currentUser.puede_priorizar_medica)) {
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
      const labels = Object.keys(kpis.estadosCount);
      const dataValues = Object.values(kpis.estadosCount);

      this.charts.pipeline = new Chart(ctxPipeline, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Cantidad de Obras',
            data: dataValues,
            backgroundColor: [
              '#94a3b8', '#64748b', '#3b82f6', '#0284c7', 
              '#eab308', '#22c55e', '#10b981', '#f43f5e'
            ],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false }, ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    const ctxSedes = document.getElementById('chartSedes')?.getContext('2d');
    if (ctxSedes) {
      if (this.charts.sedes) this.charts.sedes.destroy();
      const labels = ['Central', 'San Justo', 'Periféricos'];
      const dataUsd = labels.map(s => kpis.sedesCount[s]?.usd || 0);

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
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(ctx) {
                  return ` ${DataStore.formatUSD(ctx.raw || 0)}`;
                }
              }
            }
          }
        }
      });
    }
  },

  renderCriticalList() {
    const listContainer = document.getElementById('criticalListContainer');
    if (!listContainer) return;

    const critical = DataStore.getFilteredItems(this.filters)
      .filter(x => x.estado !== 'Obras Finalizadas' && x.estado !== 'Suspendida')
      .map(item => ({ item, sem: DataStore.calculateSemaforo(item), pond: DataStore.getPonderacionGlobal(item) }))
      .filter(x => x.sem.status === 'vencido' || x.sem.status === 'por_vencer')
      .sort((a, b) => (b.item.monto_total_usd || b.item.monto_obra_usd || 0) - (a.item.monto_total_usd || a.item.monto_obra_usd || 0))
      .slice(0, 6);

    if (critical.length === 0) {
      listContainer.innerHTML = `<div class="text-center py-6 text-slate-400 text-sm">No hay obras vencidas ni por vencer con los filtros actuales. 🎉</div>`;
      return;
    }

    let html = '<div class="divide-y divide-slate-100">';
    critical.forEach(({ item, sem, pond }) => {
      const monto = DataStore.formatUSD(item.monto_total_usd || item.monto_obra_usd || 0);
      const nextStage = DataStore.getNextStage(item.estado);

      html += `
        <div class="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition" onclick="App.openObraModal('${item.id}')">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-semibold rounded-md ${sem.class}">
              ${sem.label}
            </span>
            <div>
              <div class="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <span>${item.nombre}</span>
                <span class="px-2 py-0.2 text-[10px] rounded border ${pond.colorClass}">
                  ${pond.nivelLabel} (${pond.valor}★)
                </span>
                ${!item.partida || item.partida === 'S/D' ? `<span class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">Sin Partida</span>` : ''}
              </div>
              <div class="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                <span class="font-semibold text-slate-600">📍 ${item.sede}</span>
                <span>•</span>
                <span>Fase: <strong class="text-blue-600">${item.estado}</strong></span>
                <span>•</span>
                <span>PM: ${item.responsable || 'Sin asignar'}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <div class="text-sm font-bold text-slate-800">${monto}</div>
              <div class="text-xs text-slate-400">${item.fecha_fin_etapa ? 'Límite: ' + item.fecha_fin_etapa : 'Sin fecha'}</div>
            </div>
            ${nextStage ? `
              <button onclick="event.stopPropagation(); App.openTransitionModal('${item.id}')" 
                      class="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1">
                <span>Avanzar</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    listContainer.innerHTML = html;
  },

  renderKanban() {
    const kanbanContainer = document.getElementById('kanbanContainer');
    if (!kanbanContainer) return;

    let stages = [
      'Estudio de Factibilidad',
      'Ante Proyecto',
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
          const canEdit = DataStore.canUserEditObra(item);

          html += `
            <div class="kanban-card bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer" onclick="App.openObraModal('${item.id}')">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-mono font-bold text-slate-400">${item.id}</span>
                <span class="px-2 py-0.5 text-[11px] font-semibold rounded ${sem.class}">${sem.label}</span>
              </div>

              <!-- Badge de Ponderación -->
              <div class="mb-2 flex items-center space-x-1.5">
                <span class="px-1.5 py-0.2 text-[10px] rounded border ${pond.colorClass}">
                  ${pond.nivelLabel} (${pond.valor}★)
                </span>
                ${!item.partida || item.partida === 'S/D' ? `<span class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">Sin Partida</span>` : ''}
              </div>

              <h4 class="font-bold text-slate-800 text-sm leading-tight mb-2">${item.nombre}</h4>
              
              <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">📍 ${item.sede}</span>
                <span class="font-bold text-slate-800">${monto}</span>
              </div>

              <!-- Fechas -->
              <div class="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-500 mb-2.5 flex items-center justify-between">
                <span>Límite etapa:</span>
                <span class="font-semibold ${sem.status === 'vencido' ? 'text-red-600 font-bold' : 'text-slate-700'}">
                  ${item.fecha_fin_etapa || 'Sin fecha'}
                </span>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span class="text-slate-400 truncate max-w-[110px]">👤 ${item.responsable || 'S/D'}</span>
                
                ${nextStage && canEdit ? `
                  <button onclick="event.stopPropagation(); App.openTransitionModal('${item.id}')" 
                          class="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-md font-bold flex items-center space-x-1 transition shadow-2xs"
                          title="Finalizar esta etapa y avanzar a ${nextStage}">
                    <span>Avanzar</span>
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
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
      const canEdit = DataStore.canUserEditObra(item);

      html += `
        <tr class="hover:bg-slate-50/80 transition cursor-pointer border-b border-slate-100" onclick="App.openObraModal('${item.id}')">
          <td class="py-3 px-4 text-xs font-mono font-bold text-slate-500">${item.id}</td>
          <td class="py-3 px-4 text-xs font-semibold">
            <span class="px-2 py-0.5 rounded ${
              item.sede === 'Central' ? 'bg-blue-50 text-blue-700' :
              item.sede === 'San Justo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }">${item.sede}</span>
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-slate-900 text-sm">${item.nombre}</div>
            <div class="text-xs text-slate-400">${item.categoria || 'Obra'} • Partida: <span class="font-mono font-bold text-slate-600">${item.partida || 'PENDIENTE'}</span></div>
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
          <td class="py-3 px-4 text-xs text-slate-600">${item.responsable || '-'}</td>
          <td class="py-3 px-4 text-xs text-slate-500">${item.fecha_fin_etapa || '-'}</td>
          <td class="py-3 px-4 text-center" onclick="event.stopPropagation()">
            ${nextStage && canEdit ? `
              <button onclick="App.openTransitionModal('${item.id}')" 
                      class="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded text-xs font-bold flex items-center space-x-1 mx-auto transition" 
                      title="Finalizar etapa y avanzar a ${nextStage}">
                <span>Avanzar</span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            ` : `<span class="text-slate-300 text-xs font-mono">-</span>`}
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

  renderCashflow() {
    const cashflowContainer = document.getElementById('cashflowContainer');
    if (!cashflowContainer) return;

    const items = DataStore.getFilteredItems(this.filters)
      .filter(x => x.cashflow && (x.cashflow.cashflow_2026 || x.cashflow.monto_total));

    let tot2026 = 0, tot2027 = 0, tot2028 = 0, tot2029 = 0, totGral = 0;

    items.forEach(x => {
      tot2026 += x.cashflow.cashflow_2026 || 0;
      tot2027 += x.cashflow.cashflow_2027 || 0;
      tot2028 += x.cashflow.cashflow_2028 || 0;
      tot2029 += x.cashflow.cashflow_2029 || 0;
      totGral += x.cashflow.monto_total || 0;
    });

    let html = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th class="py-3 px-4">Sede</th>
              <th class="py-3 px-4">Obra / Proyecto</th>
              <th class="py-3 px-4 text-right">Monto Total</th>
              <th class="py-3 px-4 text-right">2026</th>
              <th class="py-3 px-4 text-right">2027</th>
              <th class="py-3 px-4 text-right">2028</th>
              <th class="py-3 px-4 text-right">2029</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
    `;

    items.forEach(x => {
      html += `
        <tr class="hover:bg-slate-50 cursor-pointer" onclick="App.openObraModal('${x.id}')">
          <td class="py-2.5 px-4 font-semibold text-slate-600">${x.sede}</td>
          <td class="py-2.5 px-4 font-bold text-slate-800">${x.nombre}</td>
          <td class="py-2.5 px-4 text-right font-black text-slate-900">${DataStore.formatUSD(x.cashflow.monto_total || 0)}</td>
          <td class="py-2.5 px-4 text-right text-slate-700">${DataStore.formatUSD(x.cashflow.cashflow_2026 || 0)}</td>
          <td class="py-2.5 px-4 text-right text-slate-700">${DataStore.formatUSD(x.cashflow.cashflow_2027 || 0)}</td>
          <td class="py-2.5 px-4 text-right text-slate-700">${DataStore.formatUSD(x.cashflow.cashflow_2028 || 0)}</td>
          <td class="py-2.5 px-4 text-right text-slate-700">${DataStore.formatUSD(x.cashflow.cashflow_2029 || 0)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
          <tfoot>
            <tr class="bg-slate-200/80 font-bold text-slate-900 border-t-2 border-slate-300">
              <td colspan="2" class="py-3 px-4 text-sm">TOTALES CONSOLIDADOS (USD)</td>
              <td class="py-3 px-4 text-right text-sm font-black">${DataStore.formatUSD(totGral)}</td>
              <td class="py-3 px-4 text-right font-bold">${DataStore.formatUSD(tot2026)}</td>
              <td class="py-3 px-4 text-right font-bold">${DataStore.formatUSD(tot2027)}</td>
              <td class="py-3 px-4 text-right font-bold">${DataStore.formatUSD(tot2028)}</td>
              <td class="py-3 px-4 text-right font-bold">${DataStore.formatUSD(tot2029)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    cashflowContainer.innerHTML = html;
  },

  // ================= MODAL: NUEVA OBRA / ESTUDIO DE FACTIBILIDAD =================
  openNewObraModal() {
    const userSede = DataStore.currentUser.sede !== 'Todas' ? DataStore.currentUser.sede : 'Central';

    // Cargar valores iniciales en modal de factibilidad
    const form = document.getElementById('formNuevaFactibilidad');
    if (form) form.reset();

    const sedeSelect = document.getElementById('factSede');
    if (sedeSelect) {
      sedeSelect.value = userSede;
      sedeSelect.disabled = (DataStore.currentUser.sede !== 'Todas');
    }

    const respInput = document.getElementById('factResponsable');
    if (respInput) respInput.value = DataStore.currentUser.nombre;

    document.getElementById('modalNuevaFactibilidad').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  closeNewObraModal() {
    document.getElementById('modalNuevaFactibilidad').classList.add('hidden');
  },

  handleCreateFactibilidadSubmit(e) {
    e.preventDefault();

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
    this.showToast(`¡Estudio de Factibilidad ${newObra.id} registrado con éxito! Enviado a Dirección para evaluación.`);
  },

  // ================= MODAL ASIGNAR PARTIDA =================
  openAsignarPartidaModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    document.getElementById('partidaItemId').value = item.id;
    document.getElementById('partidaItemName').innerText = `${item.id}: ${item.nombre}`;
    document.getElementById('inputNumeroPartida').value = item.partida || '';

    document.getElementById('modalAsignarPartida').classList.remove('hidden');
  },

  closeAsignarPartidaModal() {
    document.getElementById('modalAsignarPartida').classList.add('hidden');
  },

  handleGuardarPartidaSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('partidaItemId').value;
    const num = document.getElementById('inputNumeroPartida').value.trim();

    const res = DataStore.asignarPartidaPresupuestaria(id, num);
    if (res.success) {
      this.closeAsignarPartidaModal();
      this.render();
      this.showToast(`Partida Presupuestaria N° ${res.partida} asignada. Proceso formal habilitado.`);
    } else {
      alert(res.msg);
    }
  },

  // ================= MODAL AVANCE SECUENCIAL =================
  openTransitionModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    if (!DataStore.canUserEditObra(item)) {
      this.showToast(`Acceso restringido: Solo puedes gestionar obras de sede ${DataStore.currentUser.sede}`);
      return;
    }

    const currentStage = item.estado;
    const nextStage = DataStore.getNextStage(currentStage);
    if (!nextStage) {
      this.showToast('Esta obra ya se encuentra en su etapa final');
      return;
    }

    document.getElementById('transItemId').value = item.id;
    document.getElementById('transItemName').innerText = `${item.id}: ${item.nombre}`;
    document.getElementById('transCurrentStage').innerText = currentStage;
    document.getElementById('transNextStageAuto').innerText = nextStage;
    
    // Sugerencia de fecha límite automática
    const defaultDeadline = DataStore.getDefaultDeadlineForStage(nextStage);
    document.getElementById('transNewDeadline').value = defaultDeadline;
    document.getElementById('transCompletionDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('transNotes').value = '';

    // Si avanza a Anteproyecto pero no tiene partida
    const warnSinPartida = document.getElementById('transSinPartidaNotice');
    const inputQuickPartida = document.getElementById('transQuickPartidaContainer');
    if (currentStage === 'Estudio de Factibilidad' && (!item.partida || item.partida.trim() === '')) {
      if (warnSinPartida) warnSinPartida.classList.remove('hidden');
      if (inputQuickPartida) inputQuickPartida.classList.remove('hidden');
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
    const compDate = document.getElementById('transCompletionDate').value;
    const newDeadline = document.getElementById('transNewDeadline').value;
    const notes = document.getElementById('transNotes').value;

    // Si estaba sin partida y la cargó en el modal
    const quickPartidaInput = document.getElementById('transQuickPartidaInput');
    if (quickPartidaInput && !quickPartidaInput.parentElement.classList.contains('hidden') && quickPartidaInput.value.trim() !== '') {
      DataStore.asignarPartidaPresupuestaria(id, quickPartidaInput.value.trim());
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

            <!-- Selector 1 a 5 estrellas -->
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
    DataStore.setMedicalPriority(itemId, rating, 'Evaluación asignada desde Dirección Médica');
    this.openMedicalPriorityModal();
    this.render();
    this.showToast(`Prioridad Dirección asignada: ${rating}★ para ${itemId}`);
  },

  closeMedicalPriorityModal() {
    document.getElementById('modalMedicalPriority').classList.add('hidden');
  },

  // ================= GESTIÓN DE USUARIOS (ADMIN) =================
  openUsersAdminModal() {
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
      html += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
          <td class="py-2.5 px-3">
            <div class="font-bold text-slate-800">${u.nombre} ${isCurrent ? '<span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded ml-1 font-semibold">TÚ</span>' : ''}</div>
            <div class="text-[11px] text-slate-400">${u.email}</div>
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
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              ${u.activo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td class="py-2.5 px-3 text-right space-x-1">
            <button onclick="App.switchUserAccount('${u.id}')" class="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded font-medium text-[11px] transition">
              Simular
            </button>
            ${!isCurrent ? `
              <button onclick="App.toggleUserActive('${u.id}')" class="px-2 py-1 rounded text-[11px] font-medium transition ${
                u.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }">
                ${u.activo ? 'Dar de Baja' : 'Reactivar'}
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    });
    listEl.innerHTML = html;
  },

  handleCreateUser(e) {
    e.preventDefault();
    const nombre = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const sede = document.getElementById('newUserSede').value;
    const rol = document.getElementById('newUserRol').value;
    const puedeCrear = document.getElementById('newUserPuedeCrear').checked;
    const puedeAvanzar = document.getElementById('newUserPuedeAvanzar').checked;
    const puedeMedica = document.getElementById('newUserPuedeMedica').checked;
    const puedePartida = document.getElementById('newUserPuedePartida').checked;
    const soloLectura = document.getElementById('newUserSoloLectura').checked;

    if (!nombre || !email) {
      alert("Por favor completa nombre y correo Gmail");
      return;
    }

    DataStore.addUser({
      nombre,
      email,
      sede,
      rol,
      puede_crear: puedeCrear,
      puede_avanzar: puedeAvanzar,
      puede_priorizar_medica: puedeMedica,
      puede_asignar_partida: puedePartida,
      solo_lectura: soloLectura
    });

    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    this.renderUsersList();
    this.showToast(`Usuario ${nombre} registrado con éxito 🎉`);
  },

  toggleUserActive(userId) {
    const activo = DataStore.toggleUserStatus(userId);
    this.renderUsersList();
    this.showToast(activo ? "Usuario reactivado" : "Usuario dado de baja");
  },

  switchUserAccount(userId) {
    const success = DataStore.switchActiveUser(userId);
    if (success) {
      if (DataStore.currentUser.sede !== 'Todas') {
        this.filters.sede = DataStore.currentUser.sede;
      } else {
        this.filters.sede = 'TODAS';
      }
      this.updateUserUI();
      this.render();
      this.renderUsersList();
      this.showToast(`Sesión activa: ${DataStore.currentUser.nombre} (${DataStore.currentUser.sede})`);
    }
  },

  openGoogleLoginModal() {
    document.getElementById('modalGoogleLogin').classList.remove('hidden');
  },

  closeGoogleLoginModal() {
    document.getElementById('modalGoogleLogin').classList.add('hidden');
  },

  handleGoogleLoginSubmit() {
    const email = document.getElementById('inputGoogleEmail').value.trim();
    if (!email || !email.includes('@')) {
      alert("Por favor ingresa un correo de Gmail válido");
      return;
    }

    const res = DataStore.loginWithGoogle(email);
    if (res.success) {
      if (DataStore.currentUser.sede !== 'Todas') {
        this.filters.sede = DataStore.currentUser.sede;
      }
      this.updateUserUI();
      this.closeGoogleLoginModal();
      this.render();
      this.showToast(res.msg || `¡Bienvenido ${res.user.nombre}!`);
    } else {
      alert(res.msg);
    }
  },

  updateUserUI() {
    const u = DataStore.currentUser;
    if (!u) return;

    const nameEl = document.getElementById('userNameLabel');
    const roleEl = document.getElementById('userRoleBadge');
    const sedeEl = document.getElementById('userSedeBadge');
    const sedeSelect = document.getElementById('filterSede');

    if (nameEl) nameEl.innerText = u.nombre;
    if (roleEl) roleEl.innerText = `${u.rol.toUpperCase()}`;
    if (sedeEl) sedeEl.innerText = u.sede !== 'Todas' ? `📍 Sede: ${u.sede}` : '🌐 Todas las Sedes';

    if (sedeSelect) {
      if (u.sede !== 'Todas') {
        sedeSelect.value = u.sede;
        sedeSelect.disabled = true;
        sedeSelect.classList.add('bg-slate-200', 'cursor-not-allowed');
      } else {
        sedeSelect.disabled = false;
        sedeSelect.classList.remove('bg-slate-200', 'cursor-not-allowed');
      }
    }
  },

  // ================= MODAL DETALLE / EDICIÓN OBRA =================
  openObraModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    const canEdit = DataStore.canUserEditObra(item);
    const pond = DataStore.getPonderacionGlobal(item);

    document.getElementById('modalObraId').innerText = item.id;
    document.getElementById('modalObraTitle').value = item.nombre;
    document.getElementById('modalObraSede').value = item.sede;
    document.getElementById('modalObraTipo').value = item.tipo;
    document.getElementById('modalObraEstado').value = item.estado;
    document.getElementById('modalObraPartida').value = item.partida || '';
    document.getElementById('modalObraCategoria').value = item.categoria || 'Obra Civil';
    document.getElementById('modalObraClasificacion').value = item.clasificacion || '';
    document.getElementById('modalObraMontoObra').value = item.monto_obra_usd || 0;
    document.getElementById('modalObraMontoEquip').value = item.monto_equipamiento_usd || 0;
    document.getElementById('modalObraM2').value = item.superficie_m2 || 0;
    document.getElementById('modalObraUsdM2').value = item.costo_usd_m2 || 0;
    document.getElementById('modalObraResponsable').value = item.responsable || '';
    document.getElementById('modalObraProveedor').value = item.proveedor || '';
    document.getElementById('modalObraFechaInicio').value = item.fecha_inicio_etapa || '';
    document.getElementById('modalObraFechaFin').value = item.fecha_fin_etapa || '';
    document.getElementById('modalObraFechaFinGlobal').value = item.fecha_fin_obra || '';
    document.getElementById('modalObraPrioridadTec').value = item.prioridad_tecnica || 1;
    document.getElementById('modalObraPrioridadMed').value = item.prioridad_medica || '';
    document.getElementById('modalObraPrioridadFin').value = pond.valor || 1;
    document.getElementById('modalObraObservaciones').value = item.observaciones || '';

    // Botón para asignar partida si no tiene
    const btnAsignarPartida = document.getElementById('btnModalAsignarPartida');
    if (btnAsignarPartida) {
      btnAsignarPartida.classList.toggle('hidden', !!(item.partida && item.partida.trim() !== ''));
    }

    const btnSave = document.getElementById('btnModalSaveObra');
    const warningRestr = document.getElementById('modalSedeRestrWarning');
    if (btnSave) {
      btnSave.disabled = !canEdit || DataStore.currentUser.solo_lectura;
      btnSave.classList.toggle('opacity-50', !canEdit || DataStore.currentUser.solo_lectura);
    }
    if (warningRestr) {
      warningRestr.classList.toggle('hidden', canEdit);
    }

    const histContainer = document.getElementById('modalObraHistorial');
    if (histContainer) {
      const historial = item.historial || [];
      histContainer.innerHTML = historial.map(h => `
        <div class="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-none">
          <div class="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-blue-600"></div>
          <div class="text-xs font-semibold text-slate-700">${h.fecha} • ${h.usuario}</div>
          <div class="text-xs text-blue-600 font-medium">Fase: ${h.estado_nuevo} ${h.estado_anterior ? '(antes: ' + h.estado_anterior + ')' : ''}</div>
          <div class="text-xs text-slate-500 mt-1">${h.observaciones || 'Sin notas'}</div>
        </div>
      `).join('');
    }

    document.getElementById('modalObraDetail').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  saveObraModal() {
    const id = document.getElementById('modalObraId').innerText;
    const item = DataStore.getItemById(id);
    if (!item) return;

    if (!DataStore.canUserEditObra(item)) {
      alert("No tienes permiso para editar obras en esta sede.");
      return;
    }

    item.nombre = document.getElementById('modalObraTitle').value;
    item.sede = document.getElementById('modalObraSede').value;
    item.tipo = document.getElementById('modalObraTipo').value;
    item.estado = document.getElementById('modalObraEstado').value;
    item.partida = document.getElementById('modalObraPartida').value.trim();
    item.categoria = document.getElementById('modalObraCategoria').value;
    item.clasificacion = document.getElementById('modalObraClasificacion').value;
    item.monto_obra_usd = parseFloat(document.getElementById('modalObraMontoObra').value) || 0;
    item.monto_equipamiento_usd = parseFloat(document.getElementById('modalObraMontoEquip').value) || 0;
    item.monto_total_usd = item.monto_obra_usd + item.monto_equipamiento_usd;
    item.superficie_m2 = parseFloat(document.getElementById('modalObraM2').value) || 0;
    item.costo_usd_m2 = parseFloat(document.getElementById('modalObraUsdM2').value) || 0;
    item.responsable = document.getElementById('modalObraResponsable').value;
    item.proveedor = document.getElementById('modalObraProveedor').value;
    item.fecha_inicio_etapa = document.getElementById('modalObraFechaInicio').value;
    item.fecha_fin_etapa = document.getElementById('modalObraFechaFin').value;
    item.fecha_fin_obra = document.getElementById('modalObraFechaFinGlobal').value;
    item.prioridad_tecnica = parseFloat(document.getElementById('modalObraPrioridadTec').value) || 1;
    item.prioridad_medica = parseFloat(document.getElementById('modalObraPrioridadMed').value) || null;
    
    const pond = DataStore.getPonderacionGlobal(item);
    item.prioridad_final = pond.valor;
    item.observaciones = document.getElementById('modalObraObservaciones').value;

    DataStore.saveItem(item);
    this.closeObraModal();
    this.render();
    this.showToast('Obra guardada exitosamente');
  },

  closeObraModal() {
    document.getElementById('modalObraDetail').classList.add('hidden');
  },

  openSettingsModal() {
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
