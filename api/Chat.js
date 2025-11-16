// api/chat.js
const OpenAI = require("openai");
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  // CORS & preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.json({ ok: true, message: "API ready. POST { message }" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (!body || typeof body === "string") {
      try { body = JSON.parse(req.body || "{}"); } catch (e) { body = {}; }
    }

    const { message, toolId, transcription, fileUrl } = body || {};
    if (!message && !transcription && !fileUrl) {
      return res.status(400).json({ error: "Provide message or transcription or fileUrl" });
    }

    // short-circuit creator question
    const check = (transcription || message || "").toLowerCase();
    if (/who created|who made|creator|who built|author/.test(check)) {
      return res.json({ reply: "This platform was created by Akin S Sokpah from Liberia." });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY missing");
      return res.status(500).json({ error: "Server misconfigured. OPENAI_API_KEY missing." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build prompt parts
    const parts = [];
    if (toolId) parts.push(`Tool: ${toolId}`);
    if (fileUrl) parts.push(`User provided a file: ${fileUrl}`);
    if (transcription) parts.push(`Transcription: ${transcription}`);
    if (message) parts.push(`User: ${message}`);
    const userContent = parts.join("\n\n");

    // Use Responses API
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "You are FullTask AI Tutor — helpful, concise. Mention creator if asked." },
        { role: "user", content: userContent }
      ],
      max_output_tokens: 800,
      temperature: 0.2
    });

    // Parse reply from response
    let aiReply = "";
    try {
      if (response.output && Array.isArray(response.output)) {
        response.output.forEach(block => {
          if (Array.isArray(block.content)) block.content.forEach(c => { if (c.text) aiReply += c.text; });
        });
      } else if (response.output_text) {
        aiReply = response.output_text;
      } else {
        aiReply = JSON.stringify(response).slice(0, 2000);
      }
    } catch (e) {
      aiReply = JSON.stringify(response).slice(0, 2000);
    }

    return res.json({ reply: aiReply });
  } catch (err) {
    console.error("chat error:", err);
    return res.status(500).json({ error: "OpenAI request failed", details: err.message || String(err) });
  }
};
