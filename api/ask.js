// api/ask.js
// CommonJS serverless function for Vercel
// Accepts:
//  - GET  -> simple status response for testing
//  - POST -> { message: string, toolId?: string } -> returns { reply: string }

const OpenAI = require("openai");

module.exports = async (req, res) => {
  // Allow CORS preflight and simple GET check
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "API ready. Use POST to /api/ask with { message, toolId }" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Protect: require JSON body
  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(req.body || "{}");
    } catch (err) {
      // if body can't be parsed
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const { message, toolId } = body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "No message provided" });
  }

  // Short-circuit common creator question quickly server-side (also handled client-side)
  if (/who created|who made|creator|who built|author/i.test(message)) {
    return res.status(200).json({ reply: "This platform was created by Akin S Sokpah from Liberia." });
  }

  // Build tool-specific prompt templates server-side
  const templates = {
    "Essay Writer": (m) => `Write a well-structured essay based on the following prompt. Use clear paragraphs and a strong conclusion.\n\nPrompt:\n${m}`,
    "Math Solver": (m) => `Solve the following math problem step-by-step and give the final answer:\n\n${m}`,
    "Code Generator": (m) => `Write a clean, runnable code snippet that accomplishes the request below. Include short comments and explain any assumptions.\n\nRequest: ${m}`,
    "Image Description": (m) => `Create a detailed textual description suitable as a prompt for an image generator. Be vivid and specific:\n\n${m}`,
    "Email Writer": (m) => `Write a concise, polite professional email based on the following instructions:\n\n${m}`,
    "Chatbot Tutor": (m) => `You are a helpful tutor. Have a friendly, instructive conversation with the user based on: ${m}`,
    "Summarizer": (m) => `Summarize the following text into 5 concise bullet points:\n\n${m}`,
    "Translator": (m) => `Translate the following text exactly as requested (preserve meaning):\n\n${m}`,
    "Career Advisor": (m) => `Act as a career advisor. Provide practical steps, skills to learn, and next actions for: ${m}`,
    "Health Tips": (m) => `Give safe general health advice and tips (not medical diagnosis) for: ${m}`,
    "Motivation Coach": (m) => `Provide an encouraging motivational message and 3 actionable steps for: ${m}`,
    "Business Ideas": (m) => `Provide 10 short startup or side-business ideas around: ${m}. For each idea give a one-line rationale.`,
    "Poem Creator": (m) => `Write a short poem (3-4 stanzas) inspired by: ${m}`,
    "Story Generator": (m) => `Write a short story (about 400 words) inspired by: ${m}`,
    "Grammar Corrector": (m) => `Correct and improve the grammar, clarity, and flow of the text below. Keep meaning the same:\n\n${m}`,
    "Study Planner": (m) => `Create a 4-week study plan with weekly goals and daily tasks for: ${m}`,
    "Research Helper": (m) => `Give a research plan, key topics, and 5 academic sources/keywords for: ${m}`,
    "Lesson Explainer": (m) => `Explain the topic like a teacher would to a student. Use simple language and examples:\n\n${m}`,
    "Financial Guide": (m) => `Provide a high-level financial guide or tips for: ${m}`,
    "AI Assistant": (m) => `Act as a helpful AI assistant for the following request:\n\n${m}`
  };

  const toolName = toolId || "AI Assistant";
  const templateFn = templates[toolName] || templates["AI Assistant"];
  const prompt = templateFn(message);

  // Make sure OPENAI key exists
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing");
    return res.status(500).json({ error: "Server not configured. OPENAI_API_KEY missing." });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Using chat completions style (works with openai v4 node client)
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are FullTask AI Tutor — helpful, clear, and respectful. Mention creator if asked." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.2
    });

    // Support returned shape: completion.choices[0].message.content
    let aiReply = "";
    if (completion && completion.choices && completion.choices[0] && completion.choices[0].message) {
      aiReply = (completion.choices[0].message.content || "").toString();
    } else if (completion && completion.output && completion.output[0] && completion.output[0].content) {
      // fallback for other response shapes
      aiReply = completion.output[0].content.map(c => c.text || "").join("\n");
    } else {
      aiReply = JSON.stringify(completion).slice(0, 1000);
    }

    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "OpenAI request failed", details: err && err.message ? err.message : String(err) });
  }
};
