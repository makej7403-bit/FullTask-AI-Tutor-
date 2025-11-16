// api/transcribe.js
const fetch = require("node-fetch");
const FormData = require("form-data");

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
    const { fileUrl } = body || {};
    if (!fileUrl) return res.status(400).json({ error: "fileUrl required" });

    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY missing" });

    // If data URL -> extract bytes
    if (fileUrl.startsWith("data:")) {
      const comma = fileUrl.indexOf(",");
      const b64 = fileUrl.slice(comma + 1);
      const buffer = Buffer.from(b64, "base64");

      const form = new FormData();
      form.append("file", buffer, { filename: "upload.webm" });
      form.append("model", "whisper-1");

      const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form
      });
      const data = await r.json();
      return res.json({ transcription: data.text || data });
    }

    // Remote URL
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) return res.status(400).json({ error: "Failed to fetch fileUrl" });
    const arrayBuffer = await fileResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const form = new FormData();
    form.append("file", buffer, { filename: "upload" });
    form.append("model", "whisper-1");

    const r2 = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });
    const j = await r2.json();
    return res.json({ transcription: j.text || j });
  } catch (err) {
    console.error("transcribe error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
