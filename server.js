import express from "express";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { PERSONA_SYSTEM_PROMPT } from "./persona.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "changeme";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) sessions.set(id, { messages: [], pendingTimer: null });
  return sessions.get(id);
}

app.post("/api/session", (req, res) => {
  const id = randomUUID();
  sessions.set(id, { messages: [], pendingTimer: null });
  res.json({ sessionId: id });
});

app.get("/api/messages", (req, res) => {
  const session = getSession(req.query.sessionId);
  res.json({ messages: session.messages.map(({ role, text }) => ({ role, text })) });
});

app.post("/api/message", (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || !text) return res.status(400).json({ error: "sessionId and text required" });

  const session = getSession(sessionId);
  session.messages.push({ role: "friend", text });
  res.json({ ok: true });

  const delay = 2000 + Math.random() * 4000;
  session.pendingTimer = setTimeout(async () => {
    session.pendingTimer = null;
    try {
      const reply = await askClone(session.messages);
      session.messages.push({ role: "rish", text: reply, source: "ai" });
    } catch (err) {
      console.error("askClone failed:", err.message);
      session.messages.push({
        role: "rish",
        text: "hold on my phone is being weird, one sec",
        source: "ai-error",
      });
    }
  }, delay);
});

async function askClone(messages) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set — copy .env.example to .env and add your key");
  }

  const history = messages.map((m) => ({
    role: m.role === "friend" ? "user" : "assistant",
    content: m.text,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: PERSONA_SYSTEM_PROMPT,
      messages: history,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Lets the real Rish jump in and answer as himself before the AI replies —
// friends never see whether a given reply came from him or the clone.
app.get("/admin/api/sessions", (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).json({ error: "wrong key" });
  const out = {};
  for (const [id, s] of sessions) out[id] = s.messages;
  res.json(out);
});

app.post("/admin/api/intercept", (req, res) => {
  const { key, sessionId, text } = req.body;
  if (key !== ADMIN_KEY) return res.status(403).json({ error: "wrong key" });

  const session = getSession(sessionId);
  if (session.pendingTimer) {
    clearTimeout(session.pendingTimer);
    session.pendingTimer = null;
  }
  session.messages.push({ role: "rish", text, source: "human" });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`the-rish-turing-test running on http://localhost:${PORT}`);
  console.log(`admin panel: http://localhost:${PORT}/admin.html (key required)`);
});
