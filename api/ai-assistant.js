// Vercel Serverless Function: api/ai-assistant.js

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetriesAndFallbacks(contents, apiKey) {
  // Modelos ordenados prioritariamente desde la versión recomendada a modelos alternativos y más ligeros
  const candidateUrls = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`
  ];

  let lastError = null;

  for (const url of candidateUrls) {
    // Hasta 2 intentos con reintento y retardo incremental (exponential backoff)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim() !== '') {
            return replyText;
          }
        }

        const errData = await response.json().catch(() => ({}));
        const msg = errData.error?.message || `Error HTTP ${response.status}`;
        lastError = new Error(msg);

        // Si es rate limit (429) o saturación/servidor (503, 500), se reintenta con backoff
        if (response.status === 429 || response.status === 503 || response.status >= 500) {
          await sleep(700 * attempt);
          continue;
        } else {
          // Si el modelo no está disponible o da error 4xx cliente, probamos el siguiente modelo
          break;
        }
      } catch (err) {
        lastError = err;
        await sleep(700 * attempt);
      }
    }
  }

  throw lastError || new Error('Servicio de IA saturado o no disponible.');
}

module.exports = async function handler(req, res) {
  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilizar POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'La API Key de Gemini (GEMINI_API_KEY) no está configurada en las variables de entorno del servidor.' });
  }

  try {
    const { message, context, history } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Mensaje requerido.' });
    }

    const systemPrompt = `Eres el Auditor Ejecutivo y Asistente de Control de Gestión de SIGO HIBA (Hospital Italiano de Buenos Aires). Tu función exclusiva es analizar, auditar y responder dudas sobre las obras, inversiones, presupuestos, contratistas, plazos y desvíos recibidos en el contexto.

REGLAS DE SEGURIDAD ESTRICTAS:
1. Responde con números concretos, precisión contable y tono ejecutivo directo.
2. Si la consulta del usuario NO está directamente relacionada con los proyectos, obras, finanzas o infraestructura de SIGO HIBA (por ejemplo: preguntas generales, clima, recetas, traducción ajena, redacción externa o programación general), DEBES responder exactamente:
"Solo estoy autorizado a responder consultas operativas, analíticas y financieras sobre los proyectos y obras de SIGO HIBA."
3. Basa tus respuestas únicamente en los datos provistos en el JSON de contexto; no inventes información.`;

    const contextText = context ? `\n--- DATOS ACTUALES DE OBRAS Y PROYECTOS SIGO HIBA ---\n${JSON.stringify(context, null, 2)}\n--- FIN DATOS CONTEXTO ---\n` : '';

    const contents = [];

    // Instrucción de sistema y contexto inicial
    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n${contextText}` }]
    });

    contents.push({
      role: 'model',
      parts: [{ text: 'Entendido. Estoy listo para auditar los datos de las obras y proyectos de SIGO HIBA según las reglas e información recibidas.' }]
    });

    // Historial previo de la conversación si existiera
    if (Array.isArray(history)) {
      history.forEach(h => {
        if (h.role && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      });
    }

    // Consulta actual del usuario
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const replyText = await callGeminiWithRetriesAndFallbacks(contents, apiKey);
    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error('Error/Saturación en /api/ai-assistant:', err);
    return res.status(503).json({
      error: 'El servicio de Inteligencia Artificial se encuentra actualmente con alta demanda o saturación temporal. Por favor, reintenta tu consulta en unos momentos.'
    });
  }
};
