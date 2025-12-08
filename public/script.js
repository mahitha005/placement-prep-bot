const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);

  const span = document.createElement("span");
  span.textContent = text;
  div.appendChild(span);

  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  // show user message
  addMessage("user", text);
  input.value = "";

  try {
    const res = await fetch("/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    const reply = data.reply || "No reply from server.";

    addMessage("bot", reply);
  } catch (err) {
    console.error(err);
    addMessage("bot", "⚠ Error connecting to server.");
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// initial welcome message
addMessage(
  "bot",
  "Hi! I'm your Placement Prep Bot\n\n" +
    "Commands:\n" +
    "• question - Get DSA Question of the Day\n" +
    "• company <name> - Company-wise questions (e.g., company Amazon)\n" +
    "• mark solved <id> - Mark a question as solved\n" +
    "• progress - See your progress\n" +
    "• help - Show this again"
);
