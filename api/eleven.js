// api/eleven.js
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body = req.body;
    if (!body || typeof body === "string") {
      try { body = JSON.parse(req.body || "{}"); } catch (e) { body = {}; }
    }
    const { text, voice = "alloy" } = body || {};
    if (!text) return res.status(400).json({ error: "text required" });
    if (!process.env.ELEVEN_API_KEY) return res.status(500).json({ error: "ELEVEN_API_KEY missing" });

    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`;

    const r = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVEN_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!r.ok) {
      const errBody = await r.text();
      console.error("ElevenLabs error:", errBody);
      return res.status(500).json({ error: "ElevenLabs TTS failed", details: errBody });
    }

    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const b64 = buffer.toString("base64");
    res.json({ audioBase64: b64 });
  } catch (err) {
    console.error("eleven server error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
};
