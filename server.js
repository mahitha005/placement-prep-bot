const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "data.json");

// middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// helper: load DB from file
function loadDB() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading data.json:", err);
    return { questions: [], userProgress: [] };
  }
}

// helper: save DB to file
function saveDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// chatbot endpoint
app.post("/api/message", (req, res) => {
  const userMessage = (req.body.message || "").trim();

  if (!userMessage) {
    return res.json({ reply: "Please type something" });
  }

  const text = userMessage.toLowerCase();
  const db = loadDB();

  // COMMAND: question → DSA question of the day
  if (text === "question") {
    // COMMAND: question → DSA question (random)
    if (text === "question") {
      if (db.questions.length === 0) {
        return res.json({ reply: "No questions found in the database." });
      }

      const randomIndex = Math.floor(Math.random() * db.questions.length);
      const q = db.questions[randomIndex];

      return res.json({
        reply:
          `Question\n` +
          `#${q.id} - ${q.title}\n` +
          `Topic: ${q.topic}\n` +
          `Difficulty: ${q.difficulty}\n` +
          `Companies: ${q.companies.join(", ")}\n` +
          `Link: ${q.link}`
      });
    }

  }

  // COMMAND: company <name>
  if (text.startsWith("company ")) {
    const companyName = userMessage.slice(8).trim().toLowerCase();
    if (!companyName) {
      return res.json({
        reply: "Usage: company Amazon  or  company Google"
      });
    }

    const qs = db.questions.filter(q =>
      q.companies.some(c => c.toLowerCase() === companyName)
    );

    if (qs.length === 0) {
      return res.json({
        reply: `No questions found for company: ${companyName}`
      });
    }

    const lines = qs
      .map(q => `#${q.id} - ${q.title} (${q.difficulty}) [${q.topic}]`)
      .join("\n");

    return res.json({
      reply:
        `Questions for ${companyName}:\n` +
        lines +
        `\n\nTip: use  mark solved <id>  to track your progress.`
    });
  }

  // COMMAND: mark solved <id>
  if (text.startsWith("mark solved")) {
    const parts = text.split(" ").filter(Boolean);
    if (parts.length < 3) {
      return res.json({
        reply: "Usage: mark solved 1  (where 1 is question id)"
      });
    }

    const id = parseInt(parts[2], 10);
    if (isNaN(id)) {
      return res.json({ reply: "Please give a valid numeric question id." });
    }

    const exists = db.questions.find(q => q.id === id);
    if (!exists) {
      return res.json({ reply: `No question with id #${id} found.` });
    }

    // remove old entries for this question
    db.userProgress = db.userProgress.filter(p => p.questionId !== id);

    db.userProgress.push({
      questionId: id,
      status: "solved",
      date: new Date().toISOString().slice(0, 10)
    });

    saveDB(db);

    return res.json({
      reply: `Nice! Marked question #${id} - "${exists.title}" as solved.`
    });
  }

  // COMMAND: progress
  // COMMAND: progress
  if (text === "progress") {
    const total = db.questions.length;
    const solvedIds = new Set(
      db.userProgress
        .filter(p => p.status === "solved")
        .map(p => p.questionId)
    );

    const solved = solvedIds.size;
    const pending = total - solved;

    // topic-wise stats
    const topicStats = {};
    db.questions.forEach(q => {
      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { total: 0, solved: 0 };
      }
      topicStats[q.topic].total++;
      if (solvedIds.has(q.id)) {
        topicStats[q.topic].solved++;
      }
    });

    let topicLines = "";
    for (const [topic, val] of Object.entries(topicStats)) {
      topicLines += `• ${topic}: ${val.solved}/${val.total}\n`;
    }

    // 🎉 If all questions solved — show congratulations message
    if (solved === total) {
      return res.json({
        reply:
          "🎉 **Congratulations!** 🎉\n" +
          "You've completed **ALL** DSA questions (50/50)!\n" +
          "Amazing dedication and consistency! \n\n" +
          "You are fully prepared for placements — keep practicing to stay sharp!"
      });
    }

    // normal progress output
    return res.json({
      reply:
        `*Your Progress*\n` +
        `Solved: ${solved}\n` +
        `Pending: ${pending}\n` +
        `Total: ${total}\n\n` +
        `Topic-wise:\n${topicLines || "No data yet."}`
    });
  }


  // COMMAND: help
  if (text === "help") {
    return res.json({
      reply:
        "Hi! I’m your Placement Prep Bot 🤖\n\n" +
        "You can use these commands:\n" +
        "• question – Get DSA Question of the Day\n" +
        "• company <name> – Company-wise questions (example: company Amazon)\n" +
        "• mark solved <id> – Mark a question as solved\n" +
        "• progress – View your progress\n"
    });
  }

  // default response
  return res.json({
    reply:
      "I didn't understand that \n\n" +
      "Here’s what you can ask me:\n\n" +
      "• question - Get today’s DSA Question\n" +
      "• company <name> - View questions asked by a company (example: company Amazon)\n" +
      "• mark solved <id> - Mark a question as completed (example: mark solved 5)\n" +
      "• progress - Check how many questions you’ve solved\n" +
      "• help - Show all commands again"
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
