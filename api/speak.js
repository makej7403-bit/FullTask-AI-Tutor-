export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { text } = req.body;

        const audioRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVEN_VOICE_ID}`, {
            method: "POST",
            headers: {
                "xi-api-key": process.env.ELEVEN_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text,
                voice_settings: { stability: 0.4, similarity_boost: 0.8 }
            })
        });

        const buffer = await audioRes.arrayBuffer();

        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(Buffer.from(buffer));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Text-to-Speech failed" });
    }
}
