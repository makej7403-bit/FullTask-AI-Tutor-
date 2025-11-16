import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const audioBase64 = req.body.audioBase64;
    if (!audioBase64) {
      return res.status(400).json({ error: "Audio file missing" });
    }

    const buffer = Buffer.from(audioBase64, "base64");

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const transcription = await client.audio.transcriptions.create({
      file: buffer,
      model: "gpt-4o-transcribe"
    });

    res.status(200).json({
      text: transcription.text
    });

  } catch (error) {
    console.error("Transcription Error:", error);
    res.status(500).json({ error: error.message });
  }
}
