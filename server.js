const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function loadDB() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// ROUTE
app.post("/api/message", (req, res) => {
  const userMessage = (req.body.message || "").trim().toLowerCase();
  const db = loadDB();

  if (!userMessage) {
    return res.json({ reply: "Please type something" });
  }

  // =========================
  // FEATURE 1: RANDOM QUESTION
  // =========================
  if (userMessage === "question") {
    const q = db.questions[Math.floor(Math.random() * db.questions.length)];

    return res.json({
      reply:
        `Random Question\n` +
        `#${q.id} - ${q.title}\n` +
        `Topic: ${q.topic}\nDifficulty: ${q.difficulty}\nCompanies: ${q.companies.join(", ")}\n` +
        `Link: <a href="${q.link}" target="_blank">Click Here</a>`

    });
  }

  // =========================
  // FEATURE 2: COMPANY-WISE
  // =========================
  if (userMessage.startsWith("company ")) {
    const company = userMessage.replace("company ", "").trim();

    const results = db.questions.filter(q =>
      q.companies.map(c => c.toLowerCase()).includes(company)
    );

    if (results.length === 0) {
      return res.json({ reply: `No questions found for: ${company}` });
    }

    const list = results
      .map(q => `#${q.id} - ${q.title} (${q.difficulty})`)
      .join("\n");

    return res.json({
      reply: `Questions asked in ${company.toUpperCase()}:\n${list}`
    });
  }

  // =========================
  // FEATURE 3: TOPIC FILTER
  // =========================
  if (userMessage.startsWith("topic ")) {
    const topic = userMessage.replace("topic ", "").trim();

    const results = db.questions.filter(
      q => q.topic.toLowerCase() === topic.toLowerCase()
    );

    if (results.length === 0) {
      return res.json({ reply: `No questions found for topic: ${topic}` });
    }

    const list = results.map(q => `#${q.id} - ${q.title}`).join("\n");

    return res.json({
      reply: `Questions under ${topic}:\n${list}`
    });
  }

  // =========================
  // FEATURE 4: DIFFICULTY FILTER
  // =========================
  if (["easy", "medium", "hard"].includes(userMessage)) {
    const difficulty = userMessage;

    const results = db.questions.filter(
      q => q.difficulty.toLowerCase() === difficulty
    );

    const list = results.map(q => `#${q.id} - ${q.title}`).join("\n");

    return res.json({
      reply: `${difficulty.toUpperCase()} Questions\n${list}`
    });
  }

  // =========================
  // FEATURE 5: 3-QUESTION RANDOM SET
  // =========================
  if (userMessage === "3 questions") {
    const easy = db.questions.filter(q => q.difficulty === "Easy");
    const medium = db.questions.filter(q => q.difficulty === "Medium");
    const hard = db.questions.filter(q => q.difficulty === "Hard");

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    return res.json({
      reply:
        `3-Question Set\n\n` +
        `Easy: ${pick(easy).title}\n` +
        `Medium: ${pick(medium).title}\n` +
        `Hard: ${pick(hard).title}`
    });
  }

  // =========================
  // FEATURE 6: INTERVIEW MODE
  // =========================
  if (userMessage === "interview") {
    const shuffled = [...db.questions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    const list = selected.map(q => `#${q.id} - ${q.title}`).join("\n");

    return res.json({
      reply: `Interview Warmup Set (5 questions)\n${list}`
    });
  }

  // =========================
  // HELP COMMAND
  // =========================
  if (userMessage === "help") {
    return res.json({
      reply:
        "Available Commands\n" +
        "• question → random DSA question\n" +
        "• company <name> → questions by company\n" +
        "• topic <topic> → e.g., topic array, topic backtracking\n" +
        "• easy / medium / hard → filter by difficulty\n" +
        "• 3 questions → easy + medium + hard set\n" +
        "• interview → 5-question warmup\n" +
        "• help → show this menu\n"
    });
  }

  // =========================
  // DEFAULT
  // =========================
  return res.json({
    reply:
      "I didn't understand that 😅\nType help to see all commands."
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
