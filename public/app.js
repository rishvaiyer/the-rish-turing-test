const messagesEl = document.getElementById("messages");
const composer = document.getElementById("composer");
const input = document.getElementById("input");

let sessionId = localStorage.getItem("rishSessionId");
let messages = [];
let waitingForReply = false;

async function ensureSession() {
  if (sessionId) return;
  const res = await fetch("/api/session", { method: "POST" });
  const data = await res.json();
  sessionId = data.sessionId;
  localStorage.setItem("rishSessionId", sessionId);
}

function renderAll() {
  messagesEl.innerHTML = "";
  for (const m of messages) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + (m.role === "friend" ? "me" : "them");
    bubble.textContent = m.text;
    messagesEl.appendChild(bubble);
  }
  if (waitingForReply) {
    const typing = document.createElement("div");
    typing.className = "bubble them typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(typing);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function poll() {
  if (!sessionId) return;
  const res = await fetch(`/api/messages?sessionId=${sessionId}`);
  const data = await res.json();
  if (data.messages.length === messages.length) return;

  const lastNew = data.messages[data.messages.length - 1];
  if (lastNew && lastNew.role !== "friend") waitingForReply = false;
  messages = data.messages;
  renderAll();
}

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await ensureSession();

  messages.push({ role: "friend", text });
  waitingForReply = true;
  renderAll();

  await fetch("/api/message", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, text }),
  });
  poll();
});

ensureSession().then(poll);
setInterval(poll, 1500);
