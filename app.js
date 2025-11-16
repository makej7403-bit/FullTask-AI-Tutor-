// ===============================
// FullTask AI Tutor - Frontend
// ===============================

// DOM elements
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Clear chat automatically when page refreshes
window.onload = () => {
  chatBox.innerHTML = "";
};

// Add message to screen
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-msg" : "ai-msg";
  msg.innerText = text;
  chatBox.appendChild(msg);

  // Auto-scroll
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to backend
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  userInput.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (data.error) {
      addMessage("ai", "⚠️ Error: " + data.error);
    } else {
      addMessage("ai", data.reply);
    }
  } catch (err) {
    addMessage("ai", "⚠️ Network error. Please retry.");
  }
}

// Button click
sendBtn.onclick = sendMessage;

// Enter key submit
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
