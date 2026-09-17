// Vercel Serverless Function: api/ai-assistant.js

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetriesAndFallbacks(contents, apiKey) {
  // Modelos ligeros de alta disponibilidad ordenados por prioridad
  const candidateUrls = [
    { name: 'gemini-1.5-flash (v1beta)', url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}` },
    { name: 'gemini-1.5-flash (v1)', url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}` },
    { name: 'gemini-1.5-flash-8b (v1beta)', url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}` },
    { name: 'gemini-2.0-flash (v1beta)', url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}` }
  ];

  let lastErrorDetail = null;

  for (const candidate of candidateUrls) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(candidate.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        const errData = await response.json().catch(() => ({}));

        if (response.ok && errData.candidates?.[0]?.content?.parts?.[0]?.text) {
          return errData.candidates[0].content.parts[0].text;
        }

        const providerMsg = errData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        lastErrorDetail = {
          status: response.status,
          model: candidate.name,
          message: providerMsg
        };

        if (response.status === 429 || response.status === 503 || response.status >= 500) {
          await sleep(700 * attempt);
          continue;
        } else {
          // Si es un error de cliente (401, 403, 404), intentamos el siguiente endpoint
          break;
        }
      } catch (err) {
        lastErrorDetail = {
          status: 500,
          model: candidate.name,
          message: err.message || 'Error de red o conexión'
        };
        await sleep(700 * attempt);
      }
    }
  }

  const err = new Error(lastErrorDetail ? `[Gemini ${lastErrorDetail.status}] (${lastErrorDetail.model}): ${lastErrorDetail.message}` : 'Error de comunicación con IA');
  err.statusCode = lastErrorDetail ? lastErrorDetail.status : 502;
  err.detail = lastErrorDetail;
  throw err;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ statusCode: 405, error: 'Método no permitido. Utilizar POST.' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({
      statusCode: 500,
      error: 'La variable GEMINI_API_KEY no está configurada o está vacía en las variables de entorno de Vercel (Production).'
    });
  }

  try {
    const { message, context, history } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ statusCode: 400, error: 'Mensaje requerido.' });
    }

    const systemPrompt = `Eres el Auditor Ejecutivo y Asistente de Control de Gestión de SIGO HIBA (Hospital Italiano de Buenos Aires). Tu función exclusiva es analizar, auditar y responder dudas sobre las obras, inversiones, presupuestos, contratistas, plazos y desvíos recibidos en el contexto.

REGLAS DE SEGURIDAD ESTRICTAS:
1. Responde con números concretos, precisión contable y tono ejecutivo directo.
2. Si la consulta del usuario NO está directamente relacionada con los proyectos, obras, finanzas o infraestructura de SIGO HIBA, DEBES responder exactamente:
"Solo estoy autorizado a responder consultas operativas, analíticas y financieras sobre los proyectos y obras de SIGO HIBA."
3. Basa tus respuestas únicamente en los datos provistos en el JSON de contexto; no inventes información.`;

    const contextText = context ? `\n--- RESUMEN Y CONTEXTO COMPRIMIDO SIGO HIBA ---\n${JSON.stringify(context)}\n--- FIN CONTEXTO ---\n` : '';

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${contextText}` }]
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Listo para auditar los datos consolidados de obras de SIGO HIBA.' }]
      }
    ];

    if (Array.isArray(history)) {
      history.slice(-4).forEach(h => {
        if (h.role && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const replyText = await callGeminiWithRetriesAndFallbacks(contents, apiKey);
    return res.status(200).json({ reply: replyText });
  } catch (err) {
    const code = err.statusCode || 500;
    console.error(`[AI Assistant Handler Error ${code}]:`, err.message, err.detail);
    return res.status(code).json({
      statusCode: code,
      error: err.message,
      detail: err.detail || null
    });
  }
};
