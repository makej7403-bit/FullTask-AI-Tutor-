import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const audioFile = req.body.audioBase64;

    const buffer = Buffer.from(audioFile, "base64");

    const transcription = await openai.audio.transcriptions.create({
      file: buffer,
      model: "gpt-4o-transcribe",
    });

    return res.status(200).json({
      text: transcription.text, // <-- CLEAN TEXT ONLY
    });

  } catch (error) {
    console.error("Transcription Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
