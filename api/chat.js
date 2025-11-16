export const config = {
  runtime: "edge", // Fastest Vercel runtime
};

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405 }
      );
    }

    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message" }),
        { status: 400 }
      );
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // SAFE
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are FullTask AI Tutor, created by Akin S. Sokpah from Liberia. You help with essays, homework, explanations, and tutoring. Respond in a friendly, clear, helpful tone."
          },
          { role: "user", content: message }
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    // If OpenAI returns an error
    if (data.error) {
      return new Response(
        JSON.stringify({ error: data.error.message }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ reply: data.choices[0].message.content }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
