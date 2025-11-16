"use client";

import { useState } from "react";
import Recorder from "./Recorder";

export default function ChatUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [...messages, userMsg] })
    });

    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    setInput("");
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ minHeight: 300, background: "#fff", padding: 10 }}>
        {messages.map((m, i) => (
          <p key={i}><strong>{m.role}: </strong>{m.content}</p>
        ))}
      </div>

      <input
        style={{ width: "80%" }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>

      <Recorder setMessages={setMessages} messages={messages} />
    </div>
  );
}
