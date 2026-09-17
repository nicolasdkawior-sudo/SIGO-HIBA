/**
 * app/js/executive-curve-chart.js
 * Módulo Aislado: Curva de Caída del Gasto de Inversiones (12 Meses)
 * Tablero Ejecutivo de Dirección & Administración
 * SIGO HIBA - Hospital Italiano de Buenos Aires
 */
const ExecutiveCurveChart = {
  chartInstance: null,

  renderHTML(report) {
    if (!report || !report.cashflowEjecucion) return '';

    const accounting = report.accountingInfo || {};
    const startYr = accounting.anioInicio || accounting.startYear || '2026';
    const endYr = accounting.anioFin || accounting.endYear || '2027';
    const accountingLabel = accounting.label || `${startYr} - ${endYr}`;

    const fmt = (n) => (typeof DataStore !== 'undefined' && DataStore.formatNumberAR) ? DataStore.formatNumberAR(n) : n;

    return `
      <div class="bg-slate-900 text-white border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md mb-4 report-page-card">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <div class="p-1 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400">
              <i data-lucide="trending-down" class="w-4 h-4"></i>
            </div>
            <span class="text-xs font-bold text-white uppercase tracking-wide">
              Curva de Caída del Gasto de Inversiones • Ejercicio ${accountingLabel} (12 Meses)
            </span>
          </div>
          <div class="flex items-center space-x-3 text-[10px]">
            <span class="inline-flex items-center space-x-1.5 text-blue-300 font-semibold bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-700/50">
              <span class="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
              <span>Pagado: <strong>US$ ${fmt(report.cashflowEjecucion.totalYaPagadoUSD)}</strong></span>
            </span>
            <span class="inline-flex items-center space-x-1.5 text-teal-300 font-semibold bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-700/50">
              <span class="w-2 h-2 rounded-full bg-teal-400 inline-block"></span>
              <span>Proyectado: <strong>US$ ${fmt(report.cashflowEjecucion.totalProyectadoUSD)}</strong></span>
            </span>
          </div>
        </div>

        <div class="relative w-full h-48 sm:h-52">
          <canvas id="chartExecutiveCurveAislado"></canvas>
        </div>
      </div>
    `;
  },

  renderChart(report) {
    if (this.chartInstance) {
      try {
        this.chartInstance.destroy();
      } catch (e) {
        console.warn('Error destruyendo instancia previa:', e);
      }
      this.chartInstance = null;
    }

    const canvas = document.getElementById('chartExecutiveCurveAislado');
    if (!canvas || typeof Chart === 'undefined' || !report || !report.cashflowEjecucion) return;

    const meses = (report.accountingInfo && report.accountingInfo.meses) ? report.accountingInfo.meses : [];
    const labels = [];
    const dataValues = [];
    const isPastFlags = [];

    meses.forEach(m => {
      labels.push(m.label || m.shortLabel || m.key);
      const val = (report.cashflowEjecucion.mesesTotales && report.cashflowEjecucion.mesesTotales[m.key]) ? report.cashflowEjecucion.mesesTotales[m.key] : 0;
      dataValues.push(Math.round(val * 100) / 100);
      isPastFlags.push(!!m.isPast);
    });

    const totalVal = dataValues.reduce((a, b) => a + b, 0);
    const avgVal = dataValues.length > 0 ? Math.round((totalVal / dataValues.length) * 100) / 100 : 0;
    const avgData = Array(dataValues.length).fill(avgVal);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 168, 132, 0.45)');
    gradient.addColorStop(0.7, 'rgba(0, 168, 132, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 168, 132, 0.0)');

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Promedio Mensual (Ref.)',
            data: avgData,
            borderColor: '#f59e0b',
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0
          },
          {
            label: 'Gasto Mensual',
            data: dataValues,
            borderColor: '#00a884',
            borderWidth: 2.5,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: (context) => {
              const idx = context.dataIndex;
              return isPastFlags[idx] ? '#3b82f6' : '#00a884';
            },
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                const m = meses[idx] || {};
                const estado = isPastFlags[idx] ? ' (Pagado)' : ' (Proyectado)';
                return `📅 ${m.label || ''} ${m.year || ''}${estado}`;
              },
              label: (context) => {
                const val = context.raw || 0;
                const fmtUSD = (typeof DataStore !== 'undefined' && DataStore.formatUSD) ? DataStore.formatUSD(val) : `$ ${val}`;
                if (context.dataset.label.includes('Promedio')) {
                  return ` 💰 Promedio Mensual Ref.: ${fmtUSD}`;
                }
                return ` 📉 Monto Gasto: ${fmtUSD}`;
              },
              afterBody: (items) => {
                const idx = items[0].dataIndex;
                const val = dataValues[idx] || 0;
                const diff = val - avgVal;
                const fmtDiff = (typeof DataStore !== 'undefined' && DataStore.formatUSD) ? DataStore.formatUSD(Math.abs(diff)) : `$ ${Math.abs(diff)}`;
                if (diff > 0) {
                  return [` 🔺 Excede promedio por ${fmtDiff}`];
                } else if (diff < 0) {
                  return [` 🔹 Bajo promedio por ${fmtDiff}`];
                }
                return [` ⚖️ Igual al promedio`];
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(51, 65, 85, 0.3)',
              tickColor: 'rgba(51, 65, 85, 0.3)'
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 9 }
            }
          },
          y: {
            grid: {
              color: 'rgba(51, 65, 85, 0.3)'
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 9 },
              callback: (val) => (typeof DataStore !== 'undefined' && DataStore.formatUSD) ? DataStore.formatUSD(val) : `$ ${val}`
            },
            beginAtZero: true
          }
        }
      }
    });
  }
};

if (typeof window !== 'undefined') {
  window.ExecutiveCurveChart = ExecutiveCurveChart;
}
