import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // FIX: Use a real model + system instruction
    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are FullTask AI Tutor, a helpful, intelligent assistant created by Akin S. Sokpah from Liberia. Give clear, detailed, high-quality answers and NEVER repeat the user's message. Produce original responses only."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    return res.status(200).json({
      reply: aiResponse // CLEAN STRING OUTPUT
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
