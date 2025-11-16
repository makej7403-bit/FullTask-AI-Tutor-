import OpenAI from "openai";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe"
    });

    return Response.json({ text: transcription.text });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
