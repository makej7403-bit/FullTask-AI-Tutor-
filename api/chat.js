import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userMessage = req.body.message || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userMessage }],
    });

    const aiReply = completion.choices[0].message.content;

    return res.status(200).json({ reply: aiReply });
  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({
      error: error.message || "Unknown error",
    });
  }
}
