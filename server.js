/**
 * server.js
 *
 * Single-file Node app with:
 * - Express server and OpenAI proxy (/api/openai)
 * - Optional server-side Firebase Admin verification (/api/saveHistoryServer)
 * - Single-page UI with sliding sidebar and 20 AI features
 * - Firebase client-side Google Sign-in & Firestore history
 *
 * IMPORTANT:
 * - Do NOT commit OPENAI_API_KEY.
 * - For production deploy on Vercel, set OPENAI_API_KEY as a Vercel env var.
 *
 * Usage:
 * 1) npm init -y
 * 2) npm install express body-parser cors dotenv node-fetch@2
 *    (optional) npm install firebase-admin
 * 3) Create .env with OPENAI_API_KEY, optional ALLOWED_ORIGIN, FIREBASE_ADMIN_SDK_JSON
 * 4) node server.js
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch'); // v2
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY || null;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || null;
const FIREBASE_ADMIN_JSON = process.env.FIREBASE_ADMIN_SDK_JSON || null;

/* Optional Firebase Admin initialization for server-side ID token verification */
let firebaseAdmin = null;
let adminDb = null;
if (FIREBASE_ADMIN_JSON) {
  try {
    firebaseAdmin = require('firebase-admin');
    const cred = JSON.parse(FIREBASE_ADMIN_JSON);
    firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(cred) });
    adminDb = firebaseAdmin.firestore();
    console.log('Firebase Admin initialized — server-side verification enabled.');
  } catch (err) {
    console.error('Failed to init Firebase Admin. Check FIREBASE_ADMIN_SDK_JSON.', err);
    firebaseAdmin = null;
    adminDb = null;
  }
}

if (!OPENAI_KEY) {
  console.warn('WARNING: OPENAI_API_KEY not set. /api/openai will return an error until configured.');
}

/* Simple origin check */
function originAllowed(req) {
  if (!ALLOWED_ORIGIN) return true;
  const origin = req.headers.origin || req.headers.referer || '';
  return origin && origin.startsWith(ALLOWED_ORIGIN);
}

/* -------------------------
   OpenAI proxy endpoint
   POST /api/openai
   Body: { prompt, model?, max_tokens?, temperature? }
   ------------------------- */
app.post('/api/openai', async (req, res) => {
  if (ALLOWED_ORIGIN && !originAllowed(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (!OPENAI_KEY) return res.status(500).json({ error: 'OpenAI key not configured on server.' });

  try {
    const { prompt, model = 'gpt-4o-mini', max_tokens = 500, temperature = 0.2 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'No prompt provided.' });

    const payload = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error('OpenAI proxy error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

/* Optional server-side history save
   POST /api/saveHistoryServer
   Body: { idToken, record }
*/
app.post('/api/saveHistoryServer', async (req, res) => {
  if (!adminDb) return res.status(501).json({ error: 'Server-side history save not enabled.' });
  if (ALLOWED_ORIGIN && !originAllowed(req)) return res.status(403).json({ error: 'Origin not allowed' });

  const { idToken, record } = req.body || {};
  if (!idToken) return res.status(400).json({ error: 'No idToken provided.' });
  if (!record) return res.status(400).json({ error: 'No record provided.' });

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    if (record.uid && record.uid !== uid) return res.status(403).json({ error: 'UID mismatch' });

    const docRef = adminDb.collection('userHistories').doc(uid).collection('hist').doc();
    await docRef.set({ ...record, serverSavedAt: new Date().toISOString() });
    return res.json({ ok: true });
  } catch (err) {
    console.error('verifyIdToken error', err);
    return res.status(401).json({ error: 'Invalid ID token' });
  }
});

/* Serve single-page UI */
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderHtml());
});

app.listen(PORT, () => {
  console.log(`FullTask AI Tutor running at http://localhost:${PORT}`);
});

/* -------------------------
   Single-page HTML
   ------------------------- */

function renderHtml() {
  // Public Firebase config you gave (client-side)
  const firebaseConfig = {
    apiKey: "AIzaSyC7cAN-mrE2PvmlQ11zLKAdHBhN7nUFjHw",
    authDomain: "fir-u-c-students-web.firebaseapp.com",
    databaseURL: "https://fir-u-c-students-web-default-rtdb.firebaseio.com",
    projectId: "fir-u-c-students-web",
    storageBucket: "fir-u-c-students-web.firebasestorage.app",
    messagingSenderId: "113569186739",
    appId: "1:113569186739:web:d8daf21059f43a79e841c6"
  };

  // 20 features with prompt templates
  const FEATURES = [
    { id: '1', name: 'Writing Assistant', desc: 'Rewrite or improve text', template: (t) => `Polish and improve the clarity, grammar, and tone of the text below. Keep the original meaning.\n\nText:\n${t}\n\nImproved version:` },
    { id: '2', name: 'Code Generator', desc: 'Generate code snippets', template: (t) => `Write a clear, runnable code snippet that solves the following request. Include brief comments. Request: ${t}` },
    { id: '3', name: 'Summarizer', desc: 'Summarize long text', template: (t) => `Summarize the following text into 3 concise bullet points:\n\n${t}` },
    { id: '4', name: 'Translator', desc: 'Translate text', template: (t) => `Translate the following into the target language exactly as requested: ${t}` },
    { id: '5', name: 'Q&A', desc: 'Answer questions', template: (t) => `Answer the following question clearly and simply. If needed, include steps or examples:\n\nQuestion: ${t}` },
    { id: '6', name: 'Lesson Planner', desc: 'Create lesson plans', template: (t) => `Create a 45-minute lesson plan for this topic and student level: ${t}. Include objectives, materials, and a step-by-step timeline.` },
    { id: '7', name: 'Exam Generator', desc: 'Create quizzes & exams', template: (t) => `Generate a ${t} exam with 10 questions including answers. Provide a mix of multiple choice and short answer.` },
    { id: '8', name: 'Flashcards', desc: 'Create study flashcards', template: (t) => `Create 10 flashcards in JSON format with "front" and "back" fields for the topic: ${t}` },
    { id: '9', name: 'Conversation Practice', desc: 'Practice dialogues', template: (t) => `Roleplay a conversation based on this scenario: ${t}. Start as the interviewer and include guidance points.` },
    { id: '10', name: 'CV Writer', desc: 'Build professional CVs', template: (t) => `Write a professional CV for this profile: ${t}. Include sections for Summary, Experience, Education, Skills.` },
    { id: '11', name: 'Email Composer', desc: 'Write professional emails', template: (t) => `Write a polite, professional email based on: ${t}. Keep it concise.` },
    { id: '12', name: 'Idea Brainstormer', desc: 'Generate ideas', template: (t) => `Give 10 original, practical ideas about: ${t}. For each idea include a one-line explanation.` },
    { id: '13', name: 'Image Prompt Writer', desc: 'Create prompts for image generators', template: (t) => `Create a detailed, descriptive prompt for an image generator. Style: cinematic, ultra-detailed. Subject: ${t}` },
    { id: '14', name: 'Math Solver', desc: 'Solve math problems', template: (t) => `Solve the math problem step-by-step and give the final answer: ${t}` },
    { id: '15', name: 'Data Extractor', desc: 'Extract structured data', template: (t) => `Extract structured fields (name, phone, email, address) from the text below and return JSON:\n\n${t}` },
    { id: '16', name: 'Text-to-Speech', desc: 'Convert text to speech', template: (t) => `Provide clear text suitable for TTS (short sentences, punctuation) based on: ${t}` },
    { id: '17', name: 'Sentiment Analyzer', desc: 'Detect sentiment', template: (t) => `Analyze the sentiment of this text and return: Positive / Neutral / Negative with a one-sentence explanation:\n\n${t}` },
    { id: '18', name: 'SEO Writer', desc: 'Write SEO content', template: (t) => `Write a 300-word SEO-friendly article about: ${t}. Include an H1 and meta description.` },
    { id: '19', name: 'Study Coach', desc: 'Personalized learning plans', template: (t) => `Create a 4-week personalized study plan for the goal: ${t}. Include weekly milestones and daily tasks.` },
    { id: '20', name: 'Chat Agent', desc: 'General chatbot', template: (t) => `You are a helpful tutor. Reply conversationally to the user request: ${t}` }
  ];

  const FEATURES_JSON = JSON.stringify(FEATURES).replace(/</g, '\\u003c');
  const FIREBASE_CFG = JSON.stringify(firebaseConfig).replace(/</g, '\\u003c');
  const ALLOWED_ORIGIN_JS = JSON.stringify(ALLOWED_ORIGIN || '');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>FullTask AI Tutor</title>
<meta name="description" content="FullTask AI Tutor — Created by Akin S Sokpah from Liberia" />
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html,body,#app { height: 100%; }
  body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
  .sidebar-enter { transform: translateX(-100%); }
  .sidebar-open { transform: translateX(0); transition: transform 220ms ease-out; }
  .sidebar-close { transform: translateX(-100%); transition: transform 220ms ease-in; }
  textarea { color: #0b1220; }
  .small-muted { color: rgba(255,255,255,0.8); font-size: 0.9rem; }
</style>
</head><body class="bg-gradient-to-br from-blue-600 to-blue-900 text-white min-h-screen">
<div id="app" class="min-h-screen flex">
  <aside id="sidebar" class="fixed left-0 top-0 h-full w-72 bg-blue-800/95 backdrop-blur p-4 z-40 transform -translate-x-full" aria-hidden="true">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold">FullTask AI Tutor</h2>
        <p class="text-sm text-blue-200">20 AI tools</p>
      </div>
      <button id="closeSidebar" class="px-2 py-1 rounded bg-blue-700">Close</button>
    </div>
    <nav id="featuresNav" class="space-y-2 overflow-auto h-[calc(100%-140px)]"></nav>
    <div class="absolute bottom-4 left-4 right-4 text-blue-200 text-xs">
      <div class="mb-2">Created by Akin S Sokpah — Liberia</div>
      <a class="underline text-sm" href="https://www.facebook.com/profile.php?id=61583456361691" target="_blank" rel="noreferrer">Contact on Facebook</a>
      <div class="text-sm mt-2">sokpahakinsaye@gmail.com</div>
    </div>
  </aside>

  <button id="openSidebar" class="fixed left-4 top-4 z-50 bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur" aria-label="Open main menu">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"></path></svg>
  </button>

  <main class="flex-1 p-8 overflow-auto">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 id="featureTitle" class="text-4xl font-bold">FullTask AI Tutor</h1>
        <p id="featureDesc" class="text-blue-200">Choose a tool from the main menu</p>
      </div>
      <div class="flex items-center gap-4">
        <div id="userInfo" class="flex items-center gap-3"></div>
        <button id="authBtn" class="px-4 py-2 rounded bg-white/10">Sign in with Google</button>
      </div>
    </header>

    <div id="featureCard" class="bg-white/5 rounded shadow p-4">
      <div id="featureView" class="p-6 max-w-4xl mx-auto">
        <h2 id="fvName" class="text-3xl font-bold mb-4">Welcome</h2>
        <textarea id="inputArea" placeholder="Select a tool from the main menu to start" class="w-full h-40 rounded p-3 text-black mb-3"></textarea>
        <div class="flex gap-2">
          <button id="runBtn" class="px-4 py-2 rounded bg-blue-500/90">Run</button>
          <button id="saveHistoryBtn" class="px-4 py-2 rounded bg-white/10">Save History</button>
          <button id="resetBtn" class="px-4 py-2 rounded bg-white/10">Reset</button>
        </div>

        <div class="mt-6">
          <h3 class="font-semibold mb-2">Output</h3>
          <div id="outputBox" class="whitespace-pre-wrap bg-white/10 rounded p-4 min-h-[120px]">No output yet.</div>
        </div>

        <div id="historySection" class="mt-8">
          <h3 class="font-semibold mb-2">Your Recent History</h3>
          <div id="historyList" class="space-y-3"></div>
        </div>
      </div>
    </div>

    <div class="mt-8 text-center text-blue-200 text-sm">
      FullTask AI Tutor — Created by Akin S Sokpah from Liberia • <a class="underline" href="https://www.facebook.com/profile.php?id=61583456361691" target="_blank" rel="noreferrer">Facebook</a> • sokpahakinsaye@gmail.com
    </div>
  </main>
</div>

<!-- Firebase client SDKs (modular) -->
<script src="https://www.gstatic.com/firebasejs/10.16.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.16.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.16.0/firebase-firestore.js"></script>

<script>
  const FEATURES = ${FEATURES_JSON};
  const FIREBASE_CONFIG = ${FIREBASE_CFG};
  const ALLOWED_ORIGIN = ${ALLOWED_ORIGIN_JS};

  // UI elements
  const sidebar = document.getElementById('sidebar');
  const openBtn = document.getElementById('openSidebar');
  const closeBtn = document.getElementById('closeSidebar');
  const featuresNav = document.getElementById('featuresNav');
  const featureTitle = document.getElementById('featureTitle');
  const featureDesc = document.getElementById('featureDesc');
  const fvName = document.getElementById('fvName');
  const inputArea = document.getElementById('inputArea');
  const runBtn = document.getElementById('runBtn');
  const resetBtn = document.getElementById('resetBtn');
  const outputBox = document.getElementById('outputBox');
  const authBtn = document.getElementById('authBtn');
  const userInfo = document.getElementById('userInfo');
  const saveHistoryBtn = document.getElementById('saveHistoryBtn');
  const historyList = document.getElementById('historyList');

  let activeFeature = null;
  let user = null;
  let firestore = null;

  // Populate sidebar
  FEATURES.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'w-full text-left p-3 rounded hover:bg-blue-700/40';
    btn.innerHTML = '<div class="font-medium">' + f.name + '</div><div class="text-sm text-blue-200">' + f.desc + '</div>';
    btn.onclick = () => {
      selectFeature(f.id);
      closeSidebar();
    };
    featuresNav.appendChild(btn);
  });

  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('sidebar-open');
    sidebar.setAttribute('aria-hidden', 'false');
  }
  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('sidebar-open');
    sidebar.setAttribute('aria-hidden', 'true');
  }
  openBtn.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click', closeSidebar);

  function selectFeature(id) {
    const f = FEATURES.find(x => x.id === id);
    if (!f) return;
    activeFeature = f;
    fvName.textContent = f.name;
    featureTitle.textContent = f.name;
    featureDesc.textContent = f.desc;
    // If template exists, show short hint; else leave blank
    inputArea.value = (typeof f.template === 'function') ? '' : '';
    outputBox.textContent = 'No output yet.';
  }

  // Default select first
  selectFeature(FEATURES[0].id);

  // Run: apply template then call /api/openai
  runBtn.addEventListener('click', async () => {
    if (!activeFeature) return alert('Select a feature.');
    const raw = inputArea.value.trim();
    if (!raw) return alert('Please enter text.');

    // Short-circuit creator queries locally
    if (/who created|who made|creator|who built|author/i.test(raw)) {
      outputBox.textContent = 'This platform was created by Akin S Sokpah from Liberia.';
      return;
    }

    runBtn.disabled = true;
    runBtn.textContent = 'Running...';
    outputBox.textContent = 'Thinking...';

    try {
      const tmpl = activeFeature.template;
      const prompt = (typeof tmpl === 'function') ? tmpl(raw) : raw;

      const resp = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'gpt-4o-mini', max_tokens: 800, temperature: 0.2 })
      });
      const data = await resp.json();
      const text = (data?.choices?.[0]?.message?.content) || (data?.error?.message) || JSON.stringify(data, null, 2);
      outputBox.textContent = text;

      // Save to Firestore client-side if available
      if (user && firestore) {
        try {
          const rec = {
            uid: user.uid,
            featureId: activeFeature.id,
            featureName: activeFeature.name,
            prompt: raw,
            output: text,
            createdAt: new Date().toISOString()
          };
          await firestore.collection('userHistories').doc(user.uid).collection('hist').add(rec);
          loadHistory();
        } catch (err) {
          console.warn('Failed to save history client-side', err);
        }
      }
    } catch (err) {
      outputBox.textContent = 'Error: ' + (err.message || String(err));
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Run';
    }
  });

  resetBtn.addEventListener('click', () => {
    if (!activeFeature) return;
    inputArea.value = '';
    outputBox.textContent = 'No output yet.';
  });

  // Save history (explicit)
  saveHistoryBtn.addEventListener('click', async () => {
    if (!user) return alert('Please sign in to save history.');
    if (!firestore) return alert('Firestore not initialized.');

    const raw = inputArea.value.trim();
    const txt = outputBox.textContent || '';
    const rec = { uid: user.uid, featureId: activeFeature.id, featureName: activeFeature.name, prompt: raw, output: txt, createdAt: new Date().toISOString() };

    // If server-side admin is available, try server save first
    const serverEnabled = ${!!(firebaseAdmin ? true : false)};
    if (serverEnabled && window.firebase && firebase.auth().currentUser) {
      try {
        const idToken = await firebase.auth().currentUser.getIdToken();
        const r = await fetch('/api/saveHistoryServer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, record: rec })
        });
        const j = await r.json();
        if (j?.ok) {
          alert('History saved (server-side).');
          loadHistory();
          return;
        }
      } catch (err) {
        console.warn('Server-side save failed; falling back to client-side', err);
      }
    }

    // Client-side fallback
    try {
      await firestore.collection('userHistories').doc(user.uid).collection('hist').add(rec);
      alert('History saved (client-side).');
      loadHistory();
    } catch (err) {
      console.error('Client-side save failed', err);
      alert('Failed to save history: ' + (err.message || String(err)));
    }
  });

  /* Firebase client initialization */
  if (typeof firebase !== 'undefined' && firebase?.initializeApp) {
    try { firebase.initializeApp(FIREBASE_CONFIG); } catch (e) {}
    const auth = firebase.auth();
    firestore = firebase.firestore();

    auth.onAuthStateChanged(async (u) => {
      user = u;
      refreshUserUI();
      if (user) loadHistory();
    });

    authBtn.addEventListener('click', async () => {
      if (!user) {
        const provider = new firebase.auth.GoogleAuthProvider();
        try { await auth.signInWithPopup(provider); } catch (err) { alert('Sign-in error: ' + (err.message || err)); }
      } else {
        await auth.signOut();
      }
    });
  } else {
    console.warn('Firebase client SDK not loaded; auth unavailable.');
    authBtn.disabled = true;
    authBtn.textContent = 'Auth unavailable';
  }

  function refreshUserUI() {
    userInfo.innerHTML = '';
    if (user) {
      const name = document.createElement('div'); name.textContent = user.displayName || user.email || '';
      const img = document.createElement('img'); img.src = user.photoURL || ''; img.alt = 'avatar';
      img.className = 'w-10 h-10 rounded-full'; img.style.objectFit = 'cover';
      img.style.width = '40px'; img.style.height = '40px';
      userInfo.appendChild(name); userInfo.appendChild(img);
      authBtn.textContent = 'Sign out';
    } else {
      authBtn.textContent = 'Sign in with Google';
    }
  }

  // Load recent history client-side
  async function loadHistory() {
    if (!user || !firestore) {
      historyList.innerHTML = '<div class="small-muted">Sign in to view history.</div>';
      return;
    }
    try {
      const q = await firestore.collection('userHistories').doc(user.uid).collection('hist').orderBy('createdAt', 'desc').limit(10).get();
      historyList.innerHTML = '';
      q.forEach(doc => {
        const d = doc.data();
        const el = document.createElement('div');
        el.className = 'p-3 rounded bg-white/5';
        el.innerHTML = '<div class="font-semibold">'+ (d.featureName||'Untitled') +'</div><div class="text-xs small-muted mb-1">'+ (new Date(d.createdAt).toLocaleString()) +'</div><div class="whitespace-pre-wrap text-sm bg-white/10 p-2 rounded">'+ (d.prompt||'') +'</div><div class="mt-2 text-sm bg-white/10 p-2 rounded">'+ (d.output||'') +'</div>';
        historyList.appendChild(el);
      });
      if (q.empty) historyList.innerHTML = '<div class="small-muted">No history yet.</div>';
    } catch (err) {
      console.error('loadHistory error', err);
      historyList.innerHTML = '<div class="small-muted">Failed to load history.</div>';
    }
  }

  // Local creator short-circuit for speed/privacy
  const creatorTriggers = ['who created', 'who made', 'who built', 'creator', 'author'];
  function checkCreatorShortCircuit(text) {
    const p = (text || '').toLowerCase();
    return creatorTriggers.some(t => p.includes(t));
  }

  // Intercept run button to short-circuit if asking who created
  (function interceptRun() {
    runBtn.addEventListener('click', (e) => {
      const val = inputArea.value || '';
      if (checkCreatorShortCircuit(val)) {
        outputBox.textContent = 'This platform was created by Akin S Sokpah from Liberia.';
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, { capture: true });
  })();

  // Accessibility: ESC closes sidebar
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

</script>
</body></html>`;
}
