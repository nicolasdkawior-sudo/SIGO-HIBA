/**
 * js/cashflow-chart-48m.js
 * Módulo Aislado: Proyección Financiera Plurianual (48 Meses) para Cashflow
 * SIGO HIBA - Hospital Italiano de Buenos Aires
 */
const CashflowProjection48M = {
  chartInstance: null,

  renderHTML(summary) {
    if (!summary || !summary.accountingInfo) return '';

    const startYear = summary.accountingInfo.anioInicio;

    return `
      <div class="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-5 shadow-xl border border-slate-800">
        <!-- Encabezado Corporativo -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div class="flex items-center space-x-2">
              <div class="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <i data-lucide="trending-up" class="w-4 h-4"></i>
              </div>
              <h3 class="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                Proyección Financiera Plurianual (48 Meses)
                <span class="text-[10px] bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full font-mono border border-teal-500/30">
                  01/04/${startYear} al 31/03/${startYear + 4}
                </span>
              </h3>
            </div>
            <p class="text-xs text-slate-400 mt-1 pl-9">
              Evolución continua del flujo de fondos y límite de disponibilidad presupuestaria HIBA
            </p>
          </div>

          <!-- Leyenda e Indicadores -->
          <div class="flex flex-wrap items-center gap-2.5 text-xs">
            <div class="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
              <span class="w-3 h-3 rounded-xs bg-teal-400 inline-block"></span>
              <span class="text-slate-300 font-medium">Gasto Proyectado</span>
            </div>
            <div class="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
              <span class="w-3 h-0.5 bg-amber-400 inline-block border-t border-dashed border-amber-400"></span>
              <span class="text-slate-300 font-medium">Disponibilidad Partidas (Ref.)</span>
            </div>
            <div class="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
              <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              <span class="text-slate-300 font-medium">Ejercicio Actual</span>
            </div>
          </div>
        </div>

        <!-- Canvas del Gráfico Aislado -->
        <div class="relative w-full overflow-x-auto scrollbar-thin">
          <div class="min-w-[850px] sm:min-w-full h-72 sm:h-80">
            <canvas id="chartCashflowPlurianualAislado"></canvas>
          </div>
        </div>
      </div>
    `;
  },

  renderChart(summary) {
    // 1. Destruir la instancia anterior para prevenir fugas de memoria
    if (this.chartInstance) {
      try {
        this.chartInstance.destroy();
      } catch (e) {
        console.warn('Error destruyendo instancia previa:', e);
      }
      this.chartInstance = null;
    }

    const canvas = document.getElementById('chartCashflowPlurianualAislado');
    if (!canvas || typeof Chart === 'undefined' || !summary || !summary.accountingInfo) return;

    const startYear = summary.accountingInfo.anioInicio;
    const startMonth = 4; // Abril (1-indexed)

    const shortLabels48 = [];
    const labels48 = [];
    const dataGasto48 = [];
    const monthFullNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthShortNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 0; i < 48; i++) {
      const mIdx = (startMonth - 1 + i) % 12;
      const mNum = mIdx + 1;
      const year = startYear + Math.floor((startMonth - 1 + i) / 12);
      const mStr = mNum < 10 ? `0${mNum}` : `${mNum}`;
      const key = `${year}-${mStr}`;

      const labelShort = `${monthShortNames[mIdx]} ${String(year).slice(-2)}`;
      const labelFull = `${monthFullNames[mIdx]} ${year}`;

      let gastoMes = 0;
      (summary.displayList || []).forEach(entry => {
        if (entry.cf && entry.cf.cuotas) {
          entry.cf.cuotas.forEach(c => {
            if (c.key === key) {
              gastoMes += (c.monto || 0);
            }
          });
        }
      });

      shortLabels48.push(labelShort);
      labels48.push(labelFull);
      dataGasto48.push(Math.round(gastoMes * 100) / 100);
    }

    const totalPartidas = summary.totalAsignadoPartidasUSD || 0;
    const partidaLineaRef = (summary.totalEjercicioActualUSD > 0 && totalPartidas > 0)
      ? Math.round((totalPartidas / 12) * 100) / 100
      : 0;
    const dataPartida48 = Array(48).fill(partidaLineaRef);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 168, 132, 0.45)');
    gradient.addColorStop(0.7, 'rgba(0, 168, 132, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 168, 132, 0.0)');

    const verticalLinesPlugin = {
      id: 'fiscalYearLinesAislado',
      afterDraw: (chart) => {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales.x) return;

        ctx.save();

        // Línea 1: Inicio Ejercicio (Mes 0: 01/04)
        const x0 = scales.x.getPixelForValue(0);
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.moveTo(x0, chartArea.top);
        ctx.lineTo(x0, chartArea.bottom);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('📌 01/04 Inicio Ejercicio', x0 + 4, chartArea.top + 14);

        // Línea 2: Cierre Ejercicio (Mes 11: 31/03)
        const x11 = scales.x.getPixelForValue(11);
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.moveTo(x11, chartArea.top);
        ctx.lineTo(x11, chartArea.bottom);
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('📌 31/03 Cierre Ejercicio', Math.max(x0 + 10, x11 - 120), chartArea.top + 14);

        ctx.restore();
      }
    };

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: shortLabels48,
        datasets: [
          {
            label: 'Disponibilidad Partidas Autorizadas',
            data: dataPartida48,
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0
          },
          {
            label: 'Gasto Proyectado',
            data: dataGasto48,
            borderColor: '#00a884',
            borderWidth: 2.5,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: (context) => {
              const idx = context.dataIndex;
              return idx < 12 ? '#38bdf8' : '#a855f7';
            },
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: (context) => {
              const idx = context.dataIndex;
              return (idx === 0 || idx === 11 || (dataGasto48[idx] > 0 && idx % 3 === 0)) ? 4 : 2;
            },
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
            padding: 12,
            cornerRadius: 10,
            displayColors: true,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                return `📅 ${labels48[idx]}`;
              },
              label: (context) => {
                const val = context.raw || 0;
                const fmt = (typeof DataStore !== 'undefined' && DataStore.formatUSD) ? DataStore.formatUSD(val) : `$ ${val}`;
                if (context.dataset.label.includes('Partida')) {
                  return ` 💰 Partida Autorizada Ref. Mensual: ${fmt}`;
                }
                return ` 📈 Gasto Proyectado Mensual: ${fmt}`;
              },
              afterBody: (items) => {
                const idx = items[0].dataIndex;
                const gasto = dataGasto48[idx] || 0;
                const partida = dataPartida48[idx] || 0;
                const diff = partida - gasto;

                const fmtDiff = (typeof DataStore !== 'undefined' && DataStore.formatUSD) ? DataStore.formatUSD(Math.abs(diff)) : `$ ${Math.abs(diff)}`;
                let lines = [];
                if (partida > 0) {
                  if (diff >= 0) {
                    lines.push(` 🟢 Margen Disponible: ${fmtDiff}`);
                  } else {
                    lines.push(` 🔴 Desvío Excedido: ${fmtDiff}`);
                  }
                }
                lines.push(idx < 12 ? ' 📌 Periodo: Ejercicio Fiscal Actual' : ' 🔮 Periodo: Proyección Plurianual Futura');
                return lines;
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
              color: (context) => {
                const idx = context.index;
                if (idx === 0 || idx === 11) return '#38bdf8';
                return '#94a3b8';
              },
              font: (context) => {
                const idx = context.index;
                return {
                  size: 10,
                  weight: (idx === 0 || idx === 11) ? 'bold' : 'normal'
                };
              },
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            grid: {
              color: 'rgba(51, 65, 85, 0.3)'
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              callback: (val) => (typeof DataStore !== 'undefined' && DataStore.formatUSD) ? DataStore.formatUSD(val) : `$ ${val}`
            },
            beginAtZero: true
          }
        }
      },
      plugins: [verticalLinesPlugin]
    });
  }
};
