"use client";

import { useState } from "react";

export default function Recorder({ messages, setMessages }) {
  const [recording, setRecording] = useState(false);
  let mediaRecorder;
  let chunks = [];

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    setRecording(true);

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      // Add transcription to chat
      const userMsg = { role: "user", content: data.text };
      setMessages((m) => [...m, userMsg]);

      // Send to AI
      const aiRes = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });

      const aiData = await aiRes.json();

      setMessages((m) => [...m, { role: "assistant", content: aiData.reply }]);
    };
  };

  const stopRec = () => {
    setRecording(false);
    mediaRecorder.stop();
  };

  return (
    <div>
      {!recording ? (
        <button onClick={startRec}>🎤 Record</button>
      ) : (
        <button onClick={stopRec}>⛔ Stop</button>
      )}
    </div>
  );
}
