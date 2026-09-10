// Controlador Principal de la Aplicación ERP - SIGO HIBA
const App = {
  currentView: 'dashboard',
  filters: {
    sede: 'TODAS',
    tipo: 'TODOS',
    estado: 'TODOS',
    semaforo: 'TODOS',
    responsable: 'TODOS',
    search: ''
  },
  charts: {},

  init() {
    // Inicializar almacén y Supabase
    DataStore.init();
    SupabaseManager.init();

    this.setupEventListeners();
    this.updateRoleUI();
    this.updateCloudStatusUI();
    this.render();

    // Inicializar iconos lucide
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  setupEventListeners() {
    // Navegación por tabs
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

    // Botones de filtro rápido de semáforo en KPI cards
    document.getElementById('cardKpiVencidos')?.addEventListener('click', () => {
      this.setSemaforoFilter('vencido');
    });
    document.getElementById('cardKpiPorVencer')?.addEventListener('click', () => {
      this.setSemaforoFilter('por_vencer');
    });
    document.getElementById('cardKpiEnPlazo')?.addEventListener('click', () => {
      this.setSemaforoFilter('en_plazo');
    });
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
    const totalUsdFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(kpis.totalUsd);

    document.getElementById('kpiTotalUsd').innerText = totalUsdFormatted;
    document.getElementById('kpiTotalProyectos').innerText = `${kpis.totalItems} obras`;
    
    document.getElementById('kpiEnPlazoCount').innerText = `${kpis.enPlazo} obras`;
    document.getElementById('kpiEnPlazoPct').innerText = `${kpis.porcentajeEnPlazo}%`;

    document.getElementById('kpiPorVencerCount').innerText = `${kpis.porVencer}`;
    document.getElementById('kpiVencidosCount').innerText = `${kpis.vencidos}`;

    document.getElementById('kpiFinalizadasCount').innerText = `${kpis.finalizadas}`;
    document.getElementById('kpiSuspendidasCount').innerText = `${kpis.suspendidas}`;

    // Actualizar badge de filtro activo en tabla
    const badgeFilter = document.getElementById('activeFilterBadge');
    if (badgeFilter) {
      if (this.filters.semaforo !== 'TODOS') {
        badgeFilter.classList.remove('hidden');
        badgeFilter.innerText = `Filtro Semáforo: ${this.filters.semaforo.toUpperCase()}`;
      } else {
        badgeFilter.classList.add('hidden');
      }
    }
  },

  renderCharts(kpis) {
    // 1. Chart Pipeline Estados
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
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 2. Chart Distribución Sedes (USD)
    const ctxSedes = document.getElementById('chartSedes')?.getContext('2d');
    if (ctxSedes) {
      if (this.charts.sedes) this.charts.sedes.destroy();
      const labels = Object.keys(kpis.sedesCount);
      const dataUsd = labels.map(s => kpis.sedesCount[s].usd);

      this.charts.sedes = new Chart(ctxSedes, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: dataUsd,
            backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'],
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
                  const val = ctx.raw || 0;
                  return ` USD ${val.toLocaleString()}`;
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

    // Buscar obras vencidas o próximas a vencer ordenadas por monto USD
    const critical = DataStore.getFilteredItems(this.filters)
      .map(item => ({ item, sem: DataStore.calculateSemaforo(item) }))
      .filter(x => x.sem.status === 'vencido' || x.sem.status === 'por_vencer')
      .sort((a, b) => (b.item.monto_total_usd || b.item.monto_obra_usd || 0) - (a.item.monto_total_usd || a.item.monto_obra_usd || 0))
      .slice(0, 6);

    if (critical.length === 0) {
      listContainer.innerHTML = `<div class="text-center py-6 text-slate-400 text-sm">No hay obras vencidas ni por vencer con los filtros seleccionados. 🎉</div>`;
      return;
    }

    let html = '<div class="divide-y divide-slate-100">';
    critical.forEach(({ item, sem }) => {
      const monto = (item.monto_total_usd || item.monto_obra_usd || 0).toLocaleString();
      html += `
        <div class="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition" onclick="App.openObraModal('${item.id}')">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-semibold rounded-md ${sem.class}">
              ${sem.label}
            </span>
            <div>
              <div class="font-medium text-slate-800 text-sm">${item.nombre}</div>
              <div class="text-xs text-slate-400 flex items-center space-x-2">
                <span>📍 ${item.sede}</span>
                <span>•</span>
                <span>👤 ${item.responsable || 'Sin asignar'}</span>
                <span>•</span>
                <span>Fase: <strong class="text-slate-600">${item.estado}</strong></span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-slate-700">USD ${monto}</div>
            <div class="text-xs text-slate-400">${item.fecha_fin_etapa ? 'Límite: ' + item.fecha_fin_etapa : 'Sin fecha'}</div>
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

    const stages = [
      'Estudio de Factibilidad',
      'Ante Proyecto',
      'Proyecto',
      'Proyecto para licitar',
      'En licitación',
      'Obras en Curso',
      'Obras Finalizadas',
      'Suspendida'
    ];

    const items = DataStore.getFilteredItems(this.filters);

    let html = '<div class="flex space-x-4 overflow-x-auto pb-4 items-start">';
    stages.forEach(stage => {
      const stageItems = items.filter(x => x.estado === stage);
      const stageUsd = stageItems.reduce((acc, x) => acc + (x.monto_total_usd || x.monto_obra_usd || 0), 0);

      html += `
        <div class="kanban-column flex flex-col p-3 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-xs text-slate-700 uppercase tracking-wide">${stage}</span>
              <span class="bg-white text-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold border border-slate-200">${stageItems.length}</span>
            </div>
            <span class="text-xs text-slate-500 font-medium">$${Math.round(stageUsd / 1000)}k</span>
          </div>

          <div class="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
      `;

      if (stageItems.length === 0) {
        html += `<div class="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">Sin proyectos en esta etapa</div>`;
      } else {
        stageItems.forEach(item => {
          const sem = DataStore.calculateSemaforo(item);
          const monto = (item.monto_total_usd || item.monto_obra_usd || 0).toLocaleString();
          
          html += `
            <div class="kanban-card bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-pointer" onclick="App.openObraModal('${item.id}')">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono font-bold text-slate-400">${item.id}</span>
                <span class="px-2 py-0.5 text-[11px] font-semibold rounded ${sem.class}">${sem.label}</span>
              </div>
              <h4 class="font-semibold text-slate-800 text-sm leading-tight mb-2">${item.nombre}</h4>
              <div class="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">${item.sede}</span>
                <span class="font-semibold text-slate-700">USD ${monto}</span>
              </div>
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                <span>👤 ${item.responsable || 'Sin PM'}</span>
                <button onclick="event.stopPropagation(); App.openTransitionModal('${item.id}')" 
                        class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded font-medium flex items-center space-x-1"
                        title="Avanzar de Estado">
                  <span>Avanzar</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
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
    if (tableCount) tableCount.innerText = `${items.length} obras encontradas`;

    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400 text-sm">No se encontraron obras con los filtros aplicados.</td></tr>`;
      return;
    }

    let html = '';
    items.forEach(item => {
      const sem = DataStore.calculateSemaforo(item);
      const monto = (item.monto_total_usd || item.monto_obra_usd || 0).toLocaleString();

      html += `
        <tr class="hover:bg-slate-50/80 transition cursor-pointer border-b border-slate-100" onclick="App.openObraModal('${item.id}')">
          <td class="py-3 px-4 text-xs font-mono font-bold text-slate-500">${item.id}</td>
          <td class="py-3 px-4 text-xs font-semibold text-slate-700">
            <span class="px-2 py-0.5 rounded ${item.sede === 'Almagro' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}">${item.sede}</span>
          </td>
          <td class="py-3 px-4">
            <div class="font-medium text-slate-900 text-sm">${item.nombre}</div>
            <div class="text-xs text-slate-400">${item.categoria || 'Obra'} • Partida: ${item.partida || 'S/D'}</div>
          </td>
          <td class="py-3 px-4 text-xs">
            <span class="font-medium text-slate-700">${item.estado}</span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-1 text-xs font-semibold rounded-md ${sem.class}">${sem.label}</span>
          </td>
          <td class="py-3 px-4 text-sm font-semibold text-slate-800 text-right">USD ${monto}</td>
          <td class="py-3 px-4 text-xs text-slate-600">${item.responsable || '-'}</td>
          <td class="py-3 px-4 text-xs text-slate-500">${item.fecha_fin_etapa || item.fecha_fin_obra || '-'}</td>
          <td class="py-3 px-4 text-center" onclick="event.stopPropagation()">
            <button onclick="App.openTransitionModal('${item.id}')" class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Avanzar etapa">
              <i data-lucide="arrow-right-circle" class="w-4 h-4"></i>
            </button>
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
      .slice(0, 40); // Mostrar las primeras 40 con fechas

    const months = [
      'Ene 26', 'Feb 26', 'Mar 26', 'Abr 26', 'May 26', 'Jun 26',
      'Jul 26', 'Ago 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dic 26',
      'Ene 27', 'Feb 27', 'Mar 27', 'Abr 27', 'May 27', 'Jun 27'
    ];

    let html = `
      <div class="overflow-x-auto">
        <div class="min-w-[1200px]">
          <!-- Header Meses -->
          <div class="flex border-b border-slate-200 bg-slate-100 font-semibold text-xs text-slate-600 py-2">
            <div class="w-[320px] px-4">Proyecto / Obra</div>
            <div class="w-[120px] px-2 text-center">Fase</div>
            <div class="flex-1 flex">
              ${months.map(m => `<div class="gantt-month-cell text-center py-1">${m}</div>`).join('')}
            </div>
          </div>
          <!-- Filas -->
          <div class="divide-y divide-slate-100 bg-white">
    `;

    items.forEach((item, idx) => {
      const sem = DataStore.calculateSemaforo(item);
      // Heurística de cálculo visual del timeline
      const startMonth = idx % 8;
      const duration = Math.max(2, (idx * 3) % 9);

      let barColor = 'bg-blue-500';
      if (sem.status === 'vencido') barColor = 'bg-red-500';
      else if (sem.status === 'por_vencer') barColor = 'bg-amber-500';
      else if (sem.status === 'finalizado') barColor = 'bg-emerald-500';

      html += `
        <div class="flex items-center py-2.5 hover:bg-slate-50 cursor-pointer" onclick="App.openObraModal('${item.id}')">
          <div class="w-[320px] px-4">
            <div class="font-medium text-slate-800 text-xs truncate" title="${item.nombre}">${item.nombre}</div>
            <div class="text-[11px] text-slate-400 font-mono">${item.id} • ${item.sede}</div>
          </div>
          <div class="w-[120px] px-2 text-center">
            <span class="px-2 py-0.5 text-[10px] font-semibold rounded ${sem.class}">${sem.label}</span>
          </div>
          <div class="flex-1 flex items-center relative h-6">
            <div class="absolute h-4 rounded ${barColor} opacity-85 shadow-sm text-[10px] text-white flex items-center px-2 truncate"
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
      .filter(x => x.cashflow && x.cashflow.cashflow_2026);

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
              <th class="py-3 px-4 text-right">Monto Total USD</th>
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
          <td class="py-2.5 px-4 font-medium text-slate-800">${x.nombre}</td>
          <td class="py-2.5 px-4 text-right font-bold text-slate-900">$${(x.cashflow.monto_total || 0).toLocaleString()}</td>
          <td class="py-2.5 px-4 text-right text-slate-700">$${(x.cashflow.cashflow_2026 || 0).toLocaleString()}</td>
          <td class="py-2.5 px-4 text-right text-slate-700">$${(x.cashflow.cashflow_2027 || 0).toLocaleString()}</td>
          <td class="py-2.5 px-4 text-right text-slate-700">$${(x.cashflow.cashflow_2028 || 0).toLocaleString()}</td>
          <td class="py-2.5 px-4 text-right text-slate-700">$${(x.cashflow.cashflow_2029 || 0).toLocaleString()}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
          <tfoot>
            <tr class="bg-slate-200/80 font-bold text-slate-900 border-t-2 border-slate-300">
              <td colspan="2" class="py-3 px-4 text-sm">TOTALES CONSOLIDADOS (USD)</td>
              <td class="py-3 px-4 text-right text-sm font-black">$${totGral.toLocaleString()}</td>
              <td class="py-3 px-4 text-right">$${tot2026.toLocaleString()}</td>
              <td class="py-3 px-4 text-right">$${tot2027.toLocaleString()}</td>
              <td class="py-3 px-4 text-right">$${tot2028.toLocaleString()}</td>
              <td class="py-3 px-4 text-right">$${tot2029.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    cashflowContainer.innerHTML = html;
  },

  openObraModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

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
    document.getElementById('modalObraPrioridadMed').value = item.prioridad_medica || 1;
    document.getElementById('modalObraPrioridadFin').value = item.prioridad_final || 1;
    document.getElementById('modalObraObservaciones').value = item.observaciones || '';

    // Render historial
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

    item.nombre = document.getElementById('modalObraTitle').value;
    item.sede = document.getElementById('modalObraSede').value;
    item.tipo = document.getElementById('modalObraTipo').value;
    item.estado = document.getElementById('modalObraEstado').value;
    item.partida = document.getElementById('modalObraPartida').value;
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
    item.prioridad_medica = parseFloat(document.getElementById('modalObraPrioridadMed').value) || 1;
    item.prioridad_final = parseFloat(document.getElementById('modalObraPrioridadFin').value) || 1;
    item.observaciones = document.getElementById('modalObraObservaciones').value;

    DataStore.saveItem(item);
    this.closeObraModal();
    this.render();
    this.showToast('Obra guardada exitosamente');
  },

  closeObraModal() {
    document.getElementById('modalObraDetail').classList.add('hidden');
  },

  openTransitionModal(id) {
    const item = DataStore.getItemById(id);
    if (!item) return;

    document.getElementById('transItemId').value = item.id;
    document.getElementById('transItemName').innerText = `${item.id}: ${item.nombre}`;
    document.getElementById('transCurrentStage').innerText = item.estado;
    document.getElementById('transNewDeadline').value = item.fecha_fin_etapa || '';
    document.getElementById('transNotes').value = '';

    document.getElementById('modalTransition').classList.remove('hidden');
  },

  confirmTransition() {
    const id = document.getElementById('transItemId').value;
    const newStage = document.getElementById('transNextStage').value;
    const newDeadline = document.getElementById('transNewDeadline').value;
    const notes = document.getElementById('transNotes').value;

    DataStore.transitionStage(id, newStage, newDeadline, notes);
    this.closeTransitionModal();
    this.render();
    this.showToast(`Estado actualizado a: ${newStage}`);
  },

  closeTransitionModal() {
    document.getElementById('modalTransition').classList.add('hidden');
  },

  openNewObraModal() {
    const newId = `OBRA-${(DataStore.items.length + 1).toString().padStart(3, '0')}`;
    const newItem = {
      id: newId,
      tipo: 'Obra Civil',
      partida: '',
      nombre: 'Nueva Obra / Proyecto',
      sede: 'Almagro',
      estado: 'Estudio de Factibilidad',
      monto_obra_usd: 0,
      monto_equipamiento_usd: 0,
      monto_total_usd: 0,
      prioridad_tecnica: 3,
      prioridad_medica: 3,
      prioridad_final: 3,
      responsable: DataStore.currentUser.nombre || 'Sin Asignar',
      categoria: 'Obra Civil',
      fecha_inicio_etapa: new Date().toISOString().split('T')[0],
      fecha_fin_etapa: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0]
    };

    DataStore.saveItem(newItem);
    this.openObraModal(newId);
    this.showToast('Borrador creado. Completa los datos.');
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

  openRoleModal() {
    document.getElementById('modalRole').classList.remove('hidden');
  },

  switchRole(roleName, userTitle) {
    DataStore.currentRole = roleName;
    DataStore.currentUser = {
      nombre: userTitle,
      email: `${roleName}@hiba.org.ar`,
      rol: roleName
    };
    this.updateRoleUI();
    document.getElementById('modalRole').classList.add('hidden');
    this.showToast(`Perfil cambiado a: ${userTitle}`);
  },

  updateRoleUI() {
    const roleBadge = document.getElementById('userRoleBadge');
    const userName = document.getElementById('userNameLabel');
    if (roleBadge) roleBadge.innerText = DataStore.currentUser.rol.toUpperCase();
    if (userName) userName.innerText = DataStore.currentUser.nombre;
  },

  updateCloudStatusUI() {
    const indicator = document.getElementById('cloudStatusIndicator');
    const text = document.getElementById('cloudStatusText');
    if (SupabaseManager.isConfigured) {
      indicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
      text.innerText = 'Supabase Conectado';
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
    }, 3000);
  }
};

window.App = App;
window.addEventListener('DOMContentLoaded', () => App.init());
