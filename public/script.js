// public/script.js

const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

// Helper to escape text so user messages can't inject HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addMessage(sender, textHtml, isHtml = false) {
  const div = document.createElement("div");
  div.classList.add("message", sender);

  const span = document.createElement("span");
  if (isHtml) {
    // safe: bot replies are controlled by server (we trust server)
    span.innerHTML = textHtml;
  } else {
    // user messages: escape to prevent XSS
    span.textContent = textHtml;
  }

  div.appendChild(span);
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessage() {
  const raw = input.value.trim();
  if (!raw) return;

  // Show user message (escaped automatically via addMessage)
  addMessage("user", raw, false);
  input.value = "";

  try {
    const res = await fetch("/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: raw })
    });

    // parse JSON
    const data = await res.json();
    const reply = data.reply || "No reply from server.";

    // Show bot message as HTML (server returns safe HTML for links)
    addMessage("bot", reply, true);
  } catch (err) {
    console.error(err);
    addMessage("bot", "⚠️ Error connecting to server.", true);
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// initial welcome message (bot, uses HTML allowed)
addMessage(
  "bot",
  "Hi! I'm your Placement Prep Bot 🤖<br/><br/>Type <code>help</code> to see commands.",
  true
);
