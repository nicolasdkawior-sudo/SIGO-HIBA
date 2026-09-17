/**
 * app/js/ai-assistant.js
 * Auditor Ejecutivo & Asistente IA de SIGO HIBA (Google Gemini Integration)
 */
const AIAssistant = {
  chatHistory: [],
  isLoading: false,

  init() {
    this.createDrawerDOM();
    this.setupEventListeners();
    this.checkAccess();

    // Re-chequear permisos periódicamente por si cambia la sesión de usuario
    setInterval(() => this.checkAccess(), 2000);
  },

  checkAccess() {
    const btn = document.getElementById('btnAiAssistantTop');
    if (!btn) return;

    let isAuthorized = false;
    if (typeof DataStore !== 'undefined') {
      const u = DataStore.currentUser;
      const isAdmin = (typeof DataStore.isAdmin === 'function') ? DataStore.isAdmin() : false;
      const isDireccion = u && (
        u.rol === 'admin' ||
        u.rol === 'direccion' ||
        u.dependencia === 'Dirección General / Administración'
      );
      isAuthorized = Boolean(isAdmin || isDireccion);
    }

    if (isAuthorized) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  },

  createDrawerDOM() {
    if (document.getElementById('drawerAiAssistant')) return;

    const html = `
      <div id="drawerAiAssistant" class="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs hidden transition-opacity duration-300">
        <!-- Overlay clic para cerrar -->
        <div class="fixed inset-0" onclick="AIAssistant.closeModal()"></div>

        <!-- Panel Lateral Drawer -->
        <div class="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
          <!-- Header del Chat -->
          <div class="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-900 text-white p-4 flex items-center justify-between border-b border-purple-800 shadow-sm">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <i data-lucide="sparkles" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  Auditor Ejecutivo IA
                  <span class="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-full font-mono border border-purple-400/30">SIGO HIBA</span>
                </h3>
                <p class="text-[11px] text-purple-200/80">Control de Gestión, Desvíos y Métricas</p>
              </div>
            </div>

            <div class="flex items-center space-x-1">
              <button onclick="AIAssistant.clearChat()" class="p-1.5 hover:bg-purple-800/60 rounded-md text-purple-200 hover:text-white transition text-xs flex items-center space-x-1" title="Limpiar conversación">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              </button>
              <button onclick="AIAssistant.closeModal()" class="p-1.5 hover:bg-purple-800/60 rounded-md text-purple-200 hover:text-white transition" title="Cerrar (Esc)">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Subheader / Mensaje de Contexto de Seguridad -->
          <div class="bg-purple-50 border-b border-purple-100 px-3.5 py-2 text-[11px] text-purple-900 flex items-center space-x-2 shrink-0">
            <i data-lucide="shield-check" class="w-4 h-4 text-purple-600 shrink-0"></i>
            <span>Acceso seguro activo. Respuestas auditadas basadas en el estado en tiempo real de tus obras.</span>
          </div>

          <!-- Historial de Mensajes -->
          <div id="aiChatMessages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 scrollbar-thin">
            <!-- Mensaje de bienvenida inicial -->
            <div class="flex items-start space-x-2.5">
              <div class="w-7 h-7 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                ✨
              </div>
              <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-800 shadow-2xs max-w-[88%] space-y-2">
                <p class="font-semibold text-purple-950">¡Hola! Soy tu Auditor Ejecutivo y Asistente de Control de Gestión.</p>
                <p class="text-slate-600 leading-relaxed">
                  Puedo ayudarte a auditar tus obras, comparar inversiones por sede/módulo, identificar desvíos presupuestarios o de plazos, y consultar contratistas adjudicados.
                </p>
                <div class="pt-1.5 flex flex-wrap gap-1.5">
                  <button onclick="AIAssistant.sendQuickQuery('¿Cuál es el resumen de inversiones y desvíos por sede?')" class="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md border border-purple-200 font-medium transition text-left cursor-pointer">
                    📊 Resumen de inversiones por sede
                  </button>
                  <button onclick="AIAssistant.sendQuickQuery('¿Qué obras presentan mayores desvíos o alertas de plazo?')" class="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md border border-purple-200 font-medium transition text-left cursor-pointer">
                    ⚠️ Alertas y desvíos de plazos
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Spinner / Estado de Carga -->
          <div id="aiChatLoading" class="hidden px-4 py-2 bg-purple-50/80 border-t border-purple-100 flex items-center space-x-2 text-xs text-purple-800 font-medium animate-pulse shrink-0">
            <div class="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Analizando datos de obras y consultando IA...</span>
          </div>

          <!-- Caja de Entrada de Texto -->
          <div class="p-3 bg-white border-t border-slate-200 shrink-0">
            <form id="aiChatForm" onsubmit="AIAssistant.handleSubmit(event)" class="flex items-center space-x-2">
              <input
                type="text"
                id="aiChatInput"
                placeholder="Pregunta sobre obras, presupuestos o plazos..."
                autocomplete="off"
                class="flex-1 bg-slate-100 border border-slate-300 focus:bg-white text-slate-800 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition placeholder:text-slate-400"
              />
              <button
                type="submit"
                id="aiChatSendBtn"
                class="bg-purple-900 hover:bg-purple-800 text-white p-2.5 rounded-xl font-bold transition shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
              >
                <i data-lucide="send" class="w-4 h-4"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    if (window.lucide) lucide.createIcons();
  },

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const drawer = document.getElementById('drawerAiAssistant');
        if (drawer && !drawer.classList.contains('hidden')) {
          this.closeModal();
        }
      }
    });
  },

  openModal() {
    this.createDrawerDOM();
    this.checkAccess();

    const drawer = document.getElementById('drawerAiAssistant');
    if (drawer) {
      drawer.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        document.getElementById('aiChatInput')?.focus();
      }, 100);
    }
  },

  closeModal() {
    const drawer = document.getElementById('drawerAiAssistant');
    if (drawer) drawer.classList.add('hidden');
  },

  clearChat() {
    this.chatHistory = [];
    const container = document.getElementById('aiChatMessages');
    if (container) {
      container.innerHTML = `
        <div class="flex items-start space-x-2.5">
          <div class="w-7 h-7 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
            ✨
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-800 shadow-2xs max-w-[88%] space-y-2">
            <p class="font-semibold text-purple-950">Conversación reiniciada.</p>
            <p class="text-slate-600 leading-relaxed">
              ¿En qué puedo ayudarte a auditar hoy?
            </p>
          </div>
        </div>
      `;
    }
  },

  getObrasContext(userMessage = '') {
    if (typeof DataStore === 'undefined' || !DataStore.items || DataStore.items.length === 0) return {};

    const items = DataStore.items;
    const msg = (userMessage || '').toLowerCase();

    // 1. Si la consulta nombra una obra específica o código, filtrar y enviar solo esa obra
    const specificObra = items.find(item => {
      const nameMatch = item.nombre && item.nombre.length > 5 && msg.includes(item.nombre.toLowerCase().slice(0, 15));
      const codeMatch = item.id && msg.includes(item.id.toLowerCase());
      return nameMatch || codeMatch;
    });

    if (specificObra) {
      const mObra = parseFloat(specificObra.monto_obra_usd || specificObra.montoObraUSD) || 0;
      const mEquip = parseFloat(specificObra.monto_equipamiento_usd || specificObra.montoEquipUSD) || 0;
      const mTotal = parseFloat(specificObra.monto_total_usd || specificObra.monto_partida_usd) || (mObra + mEquip);
      return {
        tipoContexto: 'OBRA_ESPECIFICA',
        obra: {
          id: specificObra.id,
          nombre: specificObra.nombre,
          sede: specificObra.sede,
          dependencia: specificObra.dependencia,
          etapa: specificObra.estado,
          avance: (specificObra.porcentaje_avance || 0) + '%',
          montoTotalUSD: mTotal,
          montoObraUSD: mObra,
          montoEquipUSD: mEquip,
          responsable: specificObra.responsable || 'Sin Asignar',
          contratista: specificObra.empresa_adjudicada || 'No adjudicado',
          diasAlerta: specificObra.diasAlerta || specificObra.dias_alerta || 0
        }
      };
    }

    // 2. Resumen Ultra-Light Consolidado por Sede (~800 tokens)
    const porSede = {};
    let totalInversionUSD = 0;

    items.forEach(item => {
      const sede = item.sede || 'Sin Sede';
      const mObra = parseFloat(item.monto_obra_usd || item.montoObraUSD) || 0;
      const mEquip = parseFloat(item.monto_equipamiento_usd || item.montoEquipUSD) || 0;
      const mTotal = parseFloat(item.monto_total_usd || item.monto_partida_usd) || (mObra + mEquip);

      totalInversionUSD += mTotal;

      if (!porSede[sede]) {
        porSede[sede] = { obras: 0, montoTotalUSD: 0 };
      }
      porSede[sede].obras += 1;
      porSede[sede].montoTotalUSD += mTotal;
    });

    // Redondear montos por sede
    Object.keys(porSede).forEach(s => {
      porSede[s].montoTotalUSD = Math.round(porSede[s].montoTotalUSD);
    });

    // 3. Top 10 Obras Críticas (por días de alerta o inversión mayor)
    const topObras = [...items]
      .sort((a, b) => {
        const alertA = a.diasAlerta || a.dias_alerta || 0;
        const alertB = b.diasAlerta || b.dias_alerta || 0;
        if (alertB !== alertA) return alertB - alertA;
        const totalA = parseFloat(a.monto_total_usd) || 0;
        const totalB = parseFloat(b.monto_total_usd) || 0;
        return totalB - totalA;
      })
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        nombre: item.nombre,
        sede: item.sede,
        etapa: item.estado,
        avance: (item.porcentaje_avance || 0) + '%',
        montoTotalUSD: Math.round(parseFloat(item.monto_total_usd || item.monto_partida_usd) || 0),
        contratista: item.empresa_adjudicada || 'No adjudicado',
        diasAlerta: item.diasAlerta || item.dias_alerta || 0
      }));

    return {
      tipoContexto: 'RESUMEN_EJECUTIVO_CONSOLIDADO',
      totalesGeneral: {
        totalObras: items.length,
        inversionTotalUSD: Math.round(totalInversionUSD)
      },
      resumenPorSede: porSede,
      top10ObrasCriticas: topObras
    };
  },

  sendQuickQuery(queryText) {
    const input = document.getElementById('aiChatInput');
    if (input) {
      input.value = queryText;
      this.handleSubmit();
    }
  },

  async handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (this.isLoading) return;

    const input = document.getElementById('aiChatInput');
    const message = input ? input.value.trim() : '';

    if (!message) return;

    // Renderizar mensaje del usuario
    this.appendUserMessage(message);
    if (input) input.value = '';

    this.setLoading(true);

    try {
      const context = this.getObrasContext(message);

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          context: context,
          history: this.chatHistory.slice(-4)
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        const status = response.status || data.statusCode || 500;
        const errorMsg = data.error || `Error HTTP ${status}`;
        console.error('[AI Assistant API Diagnostic]:', status, data);
        throw new Error(`[HTTP ${status}]: ${errorMsg}`);
      }

      const replyText = data.reply || 'Sin respuesta.';

      // Guardar en historial
      this.chatHistory.push({ role: 'user', text: message });
      this.chatHistory.push({ role: 'assistant', text: replyText });

      this.appendAssistantMessage(replyText);
    } catch (err) {
      console.error('Error al enviar consulta a Asistente IA:', err);
      this.appendErrorMessage(`No se pudo procesar la consulta: ${err.message}`);
    } finally {
      this.setLoading(false);
    }
  },

  setLoading(loading) {
    this.isLoading = loading;
    const loadingEl = document.getElementById('aiChatLoading');
    const sendBtn = document.getElementById('aiChatSendBtn');
    const input = document.getElementById('aiChatInput');

    if (loadingEl) loadingEl.classList.toggle('hidden', !loading);
    if (sendBtn) sendBtn.disabled = loading;
    if (input) input.disabled = loading;
  },

  appendUserMessage(text) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;

    const escaped = this.escapeHtml(text);
    const html = `
      <div class="flex items-start justify-end space-x-2">
        <div class="bg-purple-900 text-white rounded-2xl rounded-tr-xs p-3 text-xs shadow-2xs max-w-[85%] leading-relaxed">
          ${escaped}
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
  },

  appendAssistantMessage(markdownText) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;

    const formatted = this.formatMarkdown(markdownText);
    const html = `
      <div class="flex items-start space-x-2.5">
        <div class="w-7 h-7 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
          ✨
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-800 shadow-2xs max-w-[88%] leading-relaxed space-y-2">
          ${formatted}
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
    if (window.lucide) lucide.createIcons();
  },

  appendErrorMessage(text) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;

    const html = `
      <div class="flex items-start space-x-2.5">
        <div class="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
          ⚠️
        </div>
        <div class="bg-red-50 border border-red-200 text-red-900 rounded-2xl rounded-tl-xs p-3 text-xs shadow-2xs max-w-[88%] leading-relaxed">
          ${this.escapeHtml(text)}
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
  },

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  formatMarkdown(text) {
    if (!text) return '';
    
    let html = this.escapeHtml(text);

    // Formatear código en bloque ``` ```
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-purple-200 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto my-2">$1</pre>');

    // Negrita **texto**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    
    // Cursiva *texto*
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Código inline `código`
    html = html.replace(/`(.*?)`/g, '<code class="bg-purple-100 text-purple-900 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');

    // Procesar líneas para viñetas y listas
    const lines = html.split('\n');
    let inList = false;
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.substring(2);
        const listStart = !inList ? '<ul class="list-disc list-inside space-y-1 my-1 pl-1 text-slate-700">' : '';
        inList = true;
        return `${listStart}<li>${itemContent}</li>`;
      } else {
        const listEnd = inList ? '</ul>' : '';
        inList = false;
        if (trimmed.startsWith('### ')) {
          return `${listEnd}<h4 class="font-bold text-xs text-purple-950 mt-2 mb-1 uppercase tracking-wider">${trimmed.substring(4)}</h4>`;
        } else if (trimmed.startsWith('## ')) {
          return `${listEnd}<h3 class="font-bold text-sm text-purple-950 mt-2.5 mb-1">${trimmed.substring(3)}</h3>`;
        } else if (trimmed.startsWith('# ')) {
          return `${listEnd}<h2 class="font-bold text-base text-purple-950 mt-3 mb-1.5">${trimmed.substring(2)}</h2>`;
        }
        return `${listEnd}${line}`;
      }
    });

    if (inList) processedLines.push('</ul>');

    return processedLines.join('<br>').replace(/<\/ul><br>/g, '</ul>');
  }
};

// Inicialización automática
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AIAssistant.init());
} else {
  AIAssistant.init();
}
