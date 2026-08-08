const sessionsEl = document.getElementById("sessions");
const keyInput = document.getElementById("adminKey");
const loadBtn = document.getElementById("loadBtn");

let adminKey = localStorage.getItem("rishAdminKey") || "";
keyInput.value = adminKey;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function refresh() {
  if (!adminKey) return;
  const res = await fetch(`/admin/api/sessions?key=${encodeURIComponent(adminKey)}`);
  if (!res.ok) {
    sessionsEl.innerHTML = "<p style='padding:16px'>wrong key</p>";
    return;
  }
  const data = await res.json();
  const ids = Object.keys(data);
  if (ids.length === 0) {
    sessionsEl.innerHTML = "<p style='padding:16px'>no active chats yet</p>";
    return;
  }
  sessionsEl.innerHTML = ids
    .map((id) => {
      const msgs = data[id]
        .map((m) => {
          const who = m.role === "friend" ? "friend" : "rish";
          const tag = m.role === "rish" ? `<span class="tag ${m.source === "human" ? "human" : "ai"}">${m.source === "human" ? "YOU" : "AI"}</span>` : "";
          return `<div><strong>${who}:</strong> ${escapeHtml(m.text)} ${tag}</div>`;
        })
        .join("");
      return `
        <div class="session" data-id="${id}">
          <h3>session ${id.slice(0, 8)}</h3>
          ${msgs}
          <div class="intercept-row">
            <input type="text" placeholder="reply as the real you..." />
            <button>send as me</button>
          </div>
        </div>`;
    })
    .join("");

  sessionsEl.querySelectorAll(".session").forEach((el) => {
    const id = el.dataset.id;
    const input = el.querySelector(".intercept-row input");
    const btn = el.querySelector(".intercept-row button");
    btn.addEventListener("click", async () => {
      const text = input.value.trim();
      if (!text) return;
      await fetch("/admin/api/intercept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: adminKey, sessionId: id, text }),
      });
      input.value = "";
      refresh();
    });
  });
}

loadBtn.addEventListener("click", () => {
  adminKey = keyInput.value.trim();
  localStorage.setItem("rishAdminKey", adminKey);
  refresh();
});

if (adminKey) refresh();
setInterval(refresh, 2000);
