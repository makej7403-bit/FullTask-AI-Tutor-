const chatArea = document.getElementById("chatArea");
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("userInput");

function addMessage(sender, text) {
    const div = document.createElement("div");
    div.className = sender;
    div.innerText = text;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

sendBtn.onclick = async () => {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage("user", msg);
    input.value = "";

    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
    });

    const data = await response.json();
    addMessage("ai", data.reply);
};
