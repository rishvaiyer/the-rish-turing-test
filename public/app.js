const messagesEl = document.getElementById("messages");
const composer = document.getElementById("composer");
const input = document.getElementById("input");

let sessionId = localStorage.getItem("rishSessionId");
let lastRenderedCount = 0;

async function ensureSession() {
  if (sessionId) return;
  const res = await fetch("/api/session", { method: "POST" });
  const data = await res.json();
  sessionId = data.sessionId;
  localStorage.setItem("rishSessionId", sessionId);
}

function render(messages) {
  if (messages.length === lastRenderedCount) return;
  lastRenderedCount = messages.length;
  messagesEl.innerHTML = "";
  for (const m of messages) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + (m.role === "friend" ? "me" : "them");
    bubble.textContent = m.text;
    messagesEl.appendChild(bubble);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function poll() {
  if (!sessionId) return;
  const res = await fetch(`/api/messages?sessionId=${sessionId}`);
  const data = await res.json();
  render(data.messages);
}

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await ensureSession();
  await fetch("/api/message", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, text }),
  });
  poll();
});

ensureSession().then(poll);
setInterval(poll, 1500);
