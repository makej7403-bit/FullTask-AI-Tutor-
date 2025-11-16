import OpenAI from "openai";

export default async function handler(req, res) {
    try {
        const body = req.method === "POST" ? req.body : JSON.parse(req.body || "{}");
        const userMessage = body.message;

        if (!userMessage) {
            return res.status(400).json({ error: "No message provided" });
        }

        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Special creator message
        if (userMessage.toLowerCase().includes("who created")) {
            return res.status(200).json({
                reply: "FullTask AI Tutor was created by Akin S. Sokpah from Liberia."
            });
        }

        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input: userMessage
        });

        const aiReply = response.output[0].content[0].text;

        res.status(200).json({ reply: aiReply });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
}
