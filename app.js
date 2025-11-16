/* ==========  FIREBASE GOOGLE LOGIN  ========== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7cAN-mrE2PvmlQ11zLKAdHBhN7nUFjHw",
  authDomain: "fir-u-c-students-web.firebaseapp.com",
  databaseURL: "https://fir-u-c-students-web-default-rtdb.firebaseio.com",
  projectId: "fir-u-c-students-web",
  storageBucket: "fir-u-c-students-web.firebasestorage.app",
  messagingSenderId: "113569186739",
  appId: "1:113569186739:web:d8daf21059f43a79e841c6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* GOOGLE LOGIN BUTTON */
document.getElementById("googleLogin").addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        document.getElementById("userInfo").innerHTML = `
            <img src="${user.photoURL}" width="40" style="border-radius:50%;">
            <span>${user.displayName}</span>
        `;
    } catch (error) {
        console.error(error);
    }
});


/* ========== CLEAR CHAT ON REFRESH ========== */
window.addEventListener("beforeunload", () => {
    localStorage.removeItem("chatHistory");
});

let chatHistory = [];
document.getElementById("chatBox").innerHTML = "";


/* ========== OPENAI CHAT REQUEST ========== */
async function askAI(prompt) {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    return data.reply;
}


/* ========== SEND MESSAGE ========== */
document.getElementById("sendBtn").addEventListener("click", async () => {
    const input = document.getElementById("userInput").value;
    if (!input.trim()) return;

    addMessage("you", input);

    const reply = await askAI(input);

    addMessage("ai", reply);
});


/* ========== ADD MESSAGE TO SCREEN ========== */
function addMessage(sender, text) {
    const box = document.getElementById("chatBox");
    const div = document.createElement("div");

    div.className = sender === "you" ? "msg you" : "msg ai";
    div.innerText = text;

    box.appendChild(div);

    chatHistory.push({ sender, text });
}


/* ========== UPLOAD FILE & SEND TO AI ========== */
document.getElementById("uploadFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addMessage("you", `📁 Uploaded: ${file.name}`);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    addMessage("ai", data.reply);
});


/* ========== VOICE RECORDING ========== */
let mediaRecorder;
let audioChunks = [];

document.getElementById("startRecord").addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.start();

    audioChunks = [];
    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

    alert("Recording...");
});

document.getElementById("stopRecord").addEventListener("click", async () => {
    mediaRecorder.stop();
    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        const res = await fetch("/api/audio", { method: "POST", body: formData });
        const data = await res.json();

        addMessage("ai", data.reply);
    };
});


/* ========== ELEVENLABS SPEECH OUT ========== */
document.getElementById("speakBtn").addEventListener("click", async () => {
    const lastMsg = chatHistory[chatHistory.length - 1]?.text;
    if (!lastMsg) return;

    const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastMsg })
    });

    const audioBlob = await res.blob();
    const audioURL = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioURL);
    audio.play();
});
