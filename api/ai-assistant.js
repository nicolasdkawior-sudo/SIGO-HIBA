// Vercel Serverless Function: api/ai-assistant.js
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

    // Consulta a la API de Gemini (gemini-3.6-flash)
    const primaryUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    let response = await fetch(primaryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errData.error?.message || `Error de comunicación con la API de Gemini (${response.status})`
      });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se obtuvo respuesta del modelo de IA.';

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error('Error en /api/ai-assistant:', err);
    return res.status(500).json({ error: `Error interno al procesar la solicitud: ${err.message}` });
  }
};
