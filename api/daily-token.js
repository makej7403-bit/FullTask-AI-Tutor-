// api/daily-token.js
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.DAILY_API_KEY) return res.status(500).json({ error: "DAILY_API_KEY missing" });

  const { roomName, userName } = req.body || {};
  if (!roomName) return res.status(400).json({ error: "roomName required" });

  try {
    const r = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ properties: { room_name: roomName }, user_name: userName || "guest" })
    });
    const j = await r.json();
    return res.json(j);
  } catch (err) {
    console.error("daily token error", err);
    res.status(500).json({ error: err.message || String(err) });
  }
};
