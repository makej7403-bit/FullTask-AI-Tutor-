export const config = { api: { bodyParser: false } };

import formidable from "formidable";
import fs from "fs";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(400).json({ error: "Upload failed" });

        const audioPath = files.audio.filepath;

        try {
            const audioData = fs.readFileSync(audioPath);

            const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: audioData
            });

            const data = await response.json();

            return res.status(200).json({ reply: data.text });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Audio transcription failed" });
        }
    });
}
