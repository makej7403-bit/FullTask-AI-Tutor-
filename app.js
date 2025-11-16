// app.js (client)
const TOOLS = [
  { id:"AI Assistant", example:"Ask me anything." },
  { id:"Essay Writer", example:"Write a 600-word essay about the importance of renewable energy." },
  { id:"Math Solver", example:"Integrate x^3 from 0 to 2 and show steps." },
  { id:"Code Generator", example:"Write a JS debounce function." },
  { id:"Image Description", example:"Describe a neon futuristic city scene." },
  { id:"Email Writer", example:"Write a polite follow-up email after an interview." },
  { id:"Chatbot Tutor", example:"Explain Ohm's Law with a simple example." },
  { id:"Summarizer", example:"Summarize this article in five bullets." },
  { id:"Translator", example:"Translate to French: How are you?" },
  { id:"Career Advisor", example:"How to become a fullstack dev in 6 months?" },
  { id:"Health Tips", example:"How to improve sleep quality?" },
  { id:"Motivation Coach", example:"Create a 7-day study routine." },
  { id:"Business Ideas", example:"10 edtech ideas for students." },
  { id:"Poem Creator", example:"Write a short poem about the Atlantic Ocean." },
  { id:"Story Generator", example:"Write a sci-fi short story about a message in a bottle." },
  { id:"Grammar Corrector", example:"Correct: I has went to the market yesterday." },
  { id:"Study Planner", example:"Create a 4-week plan to learn Python." },
  { id:"Research Helper", example:"Plan research on soil erosion in Liberia." },
  { id:"Lesson Explainer", example:"Explain photosynthesis to a 12-year-old." },
  { id:"Financial Guide", example:"Budgeting tips for students." }
];

// DOM refs
const toolList = document.getElementById("toolList");
const toolsGrid = document.getElementById("toolsGrid");
const toolSearch = document.getElementById("toolSearch");
const activeToolEl = document.getElementById("activeTool");
const promptInput = document.getElementById("promptInput");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");
const chatWindow = document.getElementById("chatWindow");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const userInfo = document.getElementById("userInfo");
const startRec = document.getElementById("startRec");
const stopRec = document.getElementById("stopRec");
const ttsBtn = document.getElementById("ttsBtn");
const joinCallBtn = document.getElementById("joinCallBtn");
const featureHelp = document.getElementById("featureHelp");

// state
let currentTool = TOOLS[0];
let user = null;
let mediaRecorder = null;
let recordedChunks = [];

// init
function renderToolList(filter="") {
  toolList.innerHTML = "";
  TOOLS.filter(t => t.id.toLowerCase().includes(filter.toLowerCase())).forEach(t => {
    const b = document.createElement("button");
    b.className = "tool-btn";
    b.innerText = t.id;
    b.onclick = () => selectTool(t.id);
    if (t.id === currentTool.id) b.classList.add("active");
    toolList.appendChild(b);
  });
}
function renderGrid() {
  toolsGrid.innerHTML = "";
  TOOLS.forEach(t => {
    const tile = document.createElement("div");
    tile.className = "tool-tile";
    tile.innerHTML = `<strong>${t.id}</strong><div class="muted small">${t.example.slice(0,80)}${t.example.length>80?'...':''}</div>`;
    tile.onclick = () => selectTool(t.id);
    toolsGrid.appendChild(tile);
  });
}
function selectTool(id) {
  const t = TOOLS.find(x => x.id === id);
  if (!t) return;
  currentTool = t;
  activeToolEl.innerText = t.id;
  promptInput.value = t.example;
  featureHelp.innerText = "Tip: " + t.example;
  renderToolList(toolSearch.value);
}
renderToolList();
renderGrid();
selectTool(TOOLS[0].id);

// search
toolSearch.addEventListener("input", ()=> renderToolList(toolSearch.value));

// chat UI
function appendMessage(text, who="ai") {
  const el = document.createElement("div");
  el.className = "message " + (who==="user" ? "user" : "ai");
  const label = document.createElement("div");
  label.style.fontSize = "12px"; label.style.color = "var(--muted)"; label.style.marginBottom="6px";
  label.innerText = who==="user" ? "You" : "FullTask AI";
  el.appendChild(label);
  const body = document.createElement("div"); body.innerText = text;
  el.appendChild(body);
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
function setThinking() {
  const el = document.createElement("div");
  el.className = "message ai";
  el.id = "thinking";
  el.innerHTML = `<div style="font-size:12px;color:var(--muted);margin-bottom:6px">FullTask AI</div><div class="muted">Thinking<span id="dots">.</span></div>`;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  let dots=1; el._interval = setInterval(()=>{ const d=document.getElementById("dots"); if(d){ dots=(dots%3)+1; d.innerText='.'.repeat(dots);} },350);
}
function clearThinking() { const t=document.getElementById("thinking"); if(t){ clearInterval(t._interval); t.remove(); } }

// send to backend
async function sendToServer(text) {
  appendMessage(text,"user");
  setThinking();
  try {
    const res = await fetch("/api/chat", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ message: text })
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) {
      const txt = await res.text();
      clearThinking();
      appendMessage("Server error: " + (txt || res.statusText), "ai");
      return;
    }
    if (ct.includes("application/json")) {
      const j = await res.json();
      clearThinking();
      appendMessage(j.reply || j.error || "No reply","ai");
    } else {
      const t = await res.text();
      clearThinking();
      appendMessage("Server returned invalid response. See console.", "ai");
      console.error("Invalid response from /api/chat:", t);
    }
  } catch (err) {
    clearThinking();
    appendMessage("Network error: " + err.message, "ai");
    console.error(err);
  }
}

// Run button
runBtn.onclick = async () => {
  const text = promptInput.value.trim();
  if (!text) return alert("Enter a prompt.");
  await sendToServer(text);
};
resetBtn.onclick = ()=> { promptInput.value = currentTool.example; };

// enter to send
promptInput.addEventListener("keydown", (e)=> {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runBtn.click(); }
});

// Recording (basic)
startRec.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size) recordedChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type:"audio/webm" });
      // convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        appendMessage("[Recorded audio sent for transcription...]", "ai");
        try {
          // If you later add /api/transcribe, call it here. For now: send short message to AI
          // We'll send a hint to AI that audio was uploaded and user expects transcription.
          await sendToServer("Transcribe this audio (audio data not attached): " + currentTool.id);
        } catch (err) { appendMessage("Transcription error: "+err.message, "ai"); }
      };
      reader.readAsDataURL(blob);
    };
    mediaRecorder.start();
    startRec.disabled = true; stopRec.disabled = false;
    appendMessage("[Recording... Click stop to finish.]", "ai");
  } catch (err) {
    alert("Microphone permission denied: " + err.message);
  }
};
stopRec.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
  startRec.disabled = false; stopRec.disabled = true;
};

// TTS button currently calls /api/eleven if you add it later
ttsBtn.onclick = async () => {
  const msgs = Array.from(chatWindow.querySelectorAll(".message.ai"));
  const last = msgs.length ? msgs[msgs.length-1].innerText : "";
  if (!last) return alert("No AI reply to speak");
  try {
    const r = await fetch("/api/eleven", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: last })});
    const j = await r.json();
    if (j.audioBase64) {
      const blob = base64ToBlob(j.audioBase64, "audio/mpeg");
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.play();
    } else alert("TTS not available (server missing).");
  } catch(err) { alert("TTS error: "+err.message); }
};
function base64ToBlob(b64, mime) {
  const bin = atob(b64), len = bin.length, arr = new Uint8Array(len);
  for (let i=0;i<len;i++) arr[i]=bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Google Sign-in (client)
signInBtn.onclick = async () => {
  try {
    const auth = window.__FT__.auth;
    const provider = window.__FT__.provider;
    const signInWithPopup = window.__FT__.signInWithPopup;
    const res = await signInWithPopup(auth, provider);
    user = res.user;
    signInBtn.style.display = "none";
    signOutBtn.style.display = "inline-block";
    userInfo.innerHTML = `<img src="${user.photoURL}" style="width:32px;border-radius:16px;vertical-align:middle;margin-right:8px"> ${user.displayName || user.email}`;
    appendMessage(`Signed in as ${user.displayName || user.email}`, "ai");
  } catch (err) { console.error(err); alert("Sign-in failed."); }
};
signOutBtn.onclick = async () => {
  try { await window.__FT__.signOut(window.__FT__.auth); user=null; signInBtn.style.display="inline-block"; signOutBtn.style.display="none"; userInfo.innerText=""; appendMessage("Signed out","ai"); } catch(e){console.error(e);}
};
window.__FT__.onAuthStateChanged(window.__FT__.auth, u => {
  if (u) { user=u; signInBtn.style.display="none"; signOutBtn.style.display="inline-block"; userInfo.innerHTML=`<img src="${u.photoURL}" style="width:32px;border-radius:16px;margin-right:8px"> ${u.displayName||u.email}`; }
});

// clear local history on reload (ephemeral)
try { localStorage.clear(); sessionStorage.clear(); } catch(e){}

// quick helpers exposed
window.FullTask = { send: ()=> runBtn.click(), selectTool: (id)=> selectTool(id) };
