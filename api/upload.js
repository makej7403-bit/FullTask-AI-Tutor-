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

        const filePath = files.file.filepath;
        const fileData = fs.readFileSync(filePath);

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-4.1",
                    messages: [
                        {
                            role: "system",
                            content: "Analyze uploaded document, image, or audio and explain clearly."
                        },
                        {
                            role: "user",
                            content: "Here is the uploaded file. Describe and analyze it."
                        }
                    ]
                })
            });

            const data = await response.json();

            return res.status(200).json({ reply: data.choices[0].message.content });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "File analysis failed" });
        }
    });
}
