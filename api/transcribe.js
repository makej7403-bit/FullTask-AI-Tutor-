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
    const { fileUrl } = req.body || {};

    if (!fileUrl) return res.status(400).json({ error: "fileUrl required" });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY missing" });

    // Fetch binary bytes
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) return res.status(400).json({ error: "Failed to fetch fileUrl" });
    const arrayBuffer = await fileResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // multipart form for OpenAI audio/transcriptions endpoint
    const form = new FormData();
    form.append("file", buffer, { filename: "upload.wav" });
    form.append("model", "whisper-1");

    const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form
    });

    const data = await resp.json();
    if (data?.text) {
      return res.json({ transcription: data.text, raw: data });
    } else if (data?.error) {
      return res.status(500).json({ error: data.error });
    } else {
      return res.json({ transcription: data.text || JSON.stringify(data) });
    }
  } catch (err) {
    console.error("transcribe error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
