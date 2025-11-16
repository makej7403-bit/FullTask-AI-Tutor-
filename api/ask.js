// api/ask.js
// CommonJS serverless function for Vercel
const OpenAI = require("openai");
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  // CORS & preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.json({ ok: true, message: "API ready. Use POST with JSON { message, toolId }" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (!body || typeof body === "string") {
      try {
        body = JSON.parse(req.body || "{}");
      } catch (e) {
        body = {};
      }
    }

    const { message, toolId, fileUrl, transcription } = body || {};
    if (!message && !transcription && !fileUrl) {
      return res.status(400).json({ error: "Provide message OR transcription OR fileUrl" });
    }

    // Quick server-side short-circuit for creator question
    const textCheck = (transcription || message || "").toLowerCase();
    if (/who created|who made|creator|who built|author/.test(textCheck)) {
      return res.json({ reply: "This platform was created by Akin S Sokpah from Liberia." });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY missing");
      return res.status(500).json({ error: "Server misconfigured: OPENAI_API_KEY missing" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build prompt: include fileUrl / transcription if provided
    let promptParts = [];
    if (toolId) promptParts.push(`Tool: ${toolId}`);
    if (fileUrl) promptParts.push(`User provided a file: ${fileUrl}`);
    if (transcription) promptParts.push(`Transcription: ${transcription}`);
    if (message) promptParts.push(`User: ${message}`);

    const systemMessage = `You are FullTask AI Tutor — helpful, clear, and respectful. If asked, say: "Created by Akin S Sokpah from Liberia." Use tool: ${toolId || "AI Assistant"}.`;
    const userContent = promptParts.join("\n\n");

    // Use the Responses API for best compatibility
    const response = await client.responses.create({
      model: "gpt-4o-mini", // change if you prefer another
      input: [
        { role: "system", content: systemMessage },
        { role: "user", content: userContent }
      ],
      max_output_tokens: 800,
      temperature: 0.2
    });

    // Parse the SDK's response shape
    let aiReply = "";
    try {
      if (response.output && Array.isArray(response.output) && response.output.length) {
        // response.output elements have content array
        response.output.forEach(block => {
          if (Array.isArray(block.content)) {
            block.content.forEach(c => {
              if (typeof c.text === "string") aiReply += c.text;
            });
          } else if (typeof block === "string") {
            aiReply += block;
          }
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
    console.error("ask.js error:", err);
    return res.status(500).json({ error: "OpenAI request failed", details: err.message || String(err) });
  }
};
