export async function POST(req) {
  try {
    const { text } = await req.json();

    const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/<VOICE_ID>", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVEN_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text
      })
    });

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg"
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
