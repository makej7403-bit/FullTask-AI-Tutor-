export default async function handler(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const reply = "Your AI response goes here!";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}
