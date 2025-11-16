export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const body = await req.json();
    const message = (body.message || "").toString().trim();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    // Strong system prompt to avoid echo
    const systemPrompt = "You are FullTask AI Tutor created by Akin S Sokpah from Liberia. Provide helpful, original, detailed answers. Never repeat the user's message verbatim; always expand and respond fully.";

    // Call OpenAI Chat Completions (standard REST)
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 900,
        temperature: 0.6
      })
    });

    const data = await openaiRes.json();

    if (data.error) {
      console.error("OpenAI error:", data.error);
      return new Response(JSON.stringify({ error: data.error.message || "OpenAI error" }), { status: 500 });
    }

    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? data.choices[0].message.content : (data.choices?.[0]?.text || "No response");

    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (err) {
    console.error("chat handler error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}
