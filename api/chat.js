export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt } = req.body;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                messages: [
                    { role: "system", content: "You are FullTask AI Tutor made by Akin S. Sokpah from Liberia." },
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();

        return res.status(200).json({ reply: data.choices[0].message.content });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Chat API failed" });
    }
}
