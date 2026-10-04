const fs = require("fs");
const path = require("path");

// Environment setup for browser globals simulation
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };

const baseDir = __dirname;
const contentDir = path.join(baseDir, "js", "content");

// 1. Load expanded quizzes pool if available
if (fs.existsSync(path.join(contentDir, "expanded_quizzes.js"))) {
  new Function("window", fs.readFileSync(path.join(contentDir, "expanded_quizzes.js"), "utf8"))(window);
}

// 2. Load all 8 modules
["module0", "module1", "module2", "module3", "module4", "module5", "module6", "module7"].forEach(m => {
  const filePath = path.join(contentDir, m + ".js");
  if (fs.existsSync(filePath)) {
    new Function("window", fs.readFileSync(filePath, "utf8"))(window);
  }
});

const mods = window.COURSE_MODULES;
console.log("==========================================================");
console.log("   KIỂM ĐỊNH CHUẨN KỸ THUẬT NỘI DUNG (CES-2026 v2.5)     ");
console.log("==========================================================");
console.log(`Modules loaded: ${mods.length}`);

let totalLessons = 0, totalQuestions = 0, errors = [], warnings = [];

mods.forEach(m => {
  const lessons = (m.lessons || []).filter(l => l.type !== "quiz");
  const inlineQuiz = (m.lessons || []).find(l => l.type === "quiz");
  const expandedQuiz = (window.EXPANDED_QUIZZES && window.EXPANDED_QUIZZES[String(m.id)]) || [];
  
  // Combine unique questions
  const totalPool = (inlineQuiz ? inlineQuiz.questions.length : 0) + expandedQuiz.length;
  totalLessons += lessons.length;
  totalQuestions += totalPool;

  console.log(`\n▶ Module ${m.id}: "${m.title}"`);
  console.log(`  • Số bài vi mô: ${lessons.length} bài (Trần quy định: ≤ 22 bài)`);
  console.log(`  • Ngân hàng Quiz: ${totalPool} câu kịch bản (Yêu cầu: ≥ 36 câu)`);

  // [RULE 1] Trần cứng 22 bài/module (Đã bao gồm Synthesis)
  if (lessons.length > 22) {
    errors.push(`Module ${m.id}: VƯỢT TRẦN CỨNG 22 BÀI (${lessons.length} bài > 22 bài)`);
  } else if (lessons.length < 12) {
    warnings.push(`Module ${m.id}: Dưới định mức MVP 12 bài (${lessons.length} bài)`);
  }

  // [RULE 2] Cụm Topic: Mỗi topic tối đa 4 bài kể cả Synthesis
  const topicMap = {};
  lessons.forEach(l => {
    const parts = l.id.split("-");
    const tId = parts[1] || "1";
    if (!topicMap[tId]) topicMap[tId] = [];
    topicMap[tId].push(l);
  });

  Object.keys(topicMap).forEach(tId => {
    const count = topicMap[tId].length;
    if (count > 4) {
      errors.push(`Module ${m.id} Topic ${tId}: VƯỢT TRẦN 4 BÀI/TOPIC (${count} bài > 4 bài)`);
    }
    const hasSynthesis = topicMap[tId].some(l => l.type === "synthesis");
    if (!hasSynthesis) {
      warnings.push(`Module ${m.id} Topic ${tId}: Thiếu bài Milestone Synthesis`);
    }
  });

  // [RULE 3] Kiểm tra loại bài học (Lesson Types)
  const validTypes = ["theory", "practice", "pitfall", "challenge", "synthesis"];
  lessons.forEach(l => {
    if (!validTypes.includes(l.type)) {
      errors.push(`Bài ${l.id}: Loại bài '${l.type}' không hợp lệ (hợp lệ: ${validTypes.join(", ")})`);
    }
    if (!l.content || l.content.length < 500) {
      errors.push(`Bài ${l.id}: Nội dung quá ngắn (${l.content ? l.content.length : 0} ký tự < 500)`);
    }
  });

  // [RULE 4] Đảm bảo Quiz nằm ở cuối module nếu có inline quiz
  if (inlineQuiz && m.lessons[m.lessons.length - 1].type !== "quiz") {
    errors.push(`Module ${m.id}: Inline Quiz phải nằm ở phần tử CUỐI CÙNG của mảng lessons`);
  }

  // [RULE 5] Kiểm tra định mức Ngân hàng đề thi Quiz (≥ 36 câu)
  if (totalPool < 36) {
    errors.push(`Module ${m.id}: THIẾU CÂU HỎI QUIZ (${totalPool} câu < 36 câu tối thiểu theo CES-2026)`);
  }

  // [RULE 6] Kiểm tra Schema chuẩn 4 cấp (Course -> Module -> Topic -> Lesson)
  if (!Array.isArray(m.topics) || m.topics.length === 0) {
    errors.push(`Module ${m.id}: Thiếu mảng topics: [] chuẩn hóa phân cụm`);
  }
  if (!Array.isArray(m.outcomes) || m.outcomes.length < 3) {
    errors.push(`Module ${m.id}: Thiếu hoặc chưa đủ outcomes: [] (yêu cầu ≥ 3 mục tiêu đầu ra)`);
  }
  if (m.id > 0) {
    if (!Array.isArray(m.retrievalWarmup) || m.retrievalWarmup.length !== 3) {
      errors.push(`Module ${m.id}: Thiếu retrievalWarmup: [] gồm đúng 3 câu trắc nghiệm kích hoạt trí nhớ`);
    }
  }

  // [RULE 7] Kiểm tra tính toàn vẹn của ngân hàng câu hỏi
  const allQuestions = (inlineQuiz ? inlineQuiz.questions : []).concat(expandedQuiz);
  allQuestions.forEach((q, idx) => {
    if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.options.length) {
      errors.push(`Module ${m.id} Quiz câu ${idx + 1}: Index đáp án sai (${q.answer})`);
    }
    if (!q.explain) {
      errors.push(`Module ${m.id} Quiz câu ${idx + 1}: Thiếu phân tích explain`);
    }
    if (!q.options || q.options.length < 4) {
      warnings.push(`Module ${m.id} Quiz câu ${idx + 1}: Dưới 4 phương án lựa chọn`);
    }
  });

  // [RULE 8] Đảm bảo không trùng ID bài học
  const lessonIds = lessons.map(l => l.id);
  if (new Set(lessonIds).size !== lessonIds.length) {
    errors.push(`Module ${m.id}: Trùng lặp mã ID bài học`);
  }
});

// Markdown Renderer Integrity Check
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function inline(s) {
  if (!s) return "";
  s = escapeHtml(s);
  s = s.replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/gi, "<code>$1</code>");
  s = s.replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi, "<mark>$1</mark>");
  s = s.replace(/&lt;kbd&gt;([\s\S]*?)&lt;\/kbd&gt;/gi, "<kbd>$1</kbd>");
  s = s.replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, "<b>$1</b>");
  s = s.replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/gi, "<strong>$1</strong>");
  s = s.replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, "<i>$1</i>");
  s = s.replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/gi, "<em>$1</em>");
  s = s.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, "<u>$1</u>");
  s = s.replace(/&lt;del&gt;([\s\S]*?)&lt;\/del&gt;/gi, "<del>$1</del>");
  s = s.replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/gi, "<s>$1</s>");
  s = s.replace(/&lt;sup&gt;([\s\S]*?)&lt;\/sup&gt;/gi, "<sup>$1</sup>");
  s = s.replace(/&lt;sub&gt;([\s\S]*?)&lt;\/sub&gt;/gi, "<sub>$1</sub>");
  s = s.replace(/&lt;small&gt;([\s\S]*?)&lt;\/small&gt;/gi, "<small>$1</small>");
  s = s.replace(/&lt;br\s*\/?&gt;/gi, "<br>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
  s = s.replace(/!\[([^\]]*)\]\((https?:[^)]+)\)/g, '<img src="$2" alt="$1" class="lesson-img" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#)[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\n/g, "<br>");
  return s;
}

const checks = [
  ["bold", inline("Hello **world**").includes("<strong>world</strong>")],
  ["inline backtick code", inline("a `code` b").includes("<code>code</code>")],
  ["markdown image", inline("![Logo](https://example.com/logo.png)").includes('<img src="https://example.com/logo.png" alt="Logo" class="lesson-img" loading="lazy">')],
  ["escape", escapeHtml("<script>") === "&lt;script&gt;"]
];
checks.forEach(([name, ok]) => console.log(`  • Markdown ${name}: ${ok ? "PASS" : "FAIL"}`));
if (checks.some(c => !c[1])) errors.push("Markdown renderer failed verification");

console.log("\n----------------------------------------------------------");
console.log(`TỔNG KẾT: ${mods.length} modules, ${totalLessons} bài vi mô, ${totalQuestions} câu Quiz ngân hàng`);

if (warnings.length) {
  console.log(`\nCẢNH BÁO (${warnings.length} mục cần hoàn thiện):`);
  warnings.slice(0, 10).forEach(w => console.log(`  ⚠ ${w}`));
  if (warnings.length > 10) console.log(`  ... và ${warnings.length - 10} cảnh báo khác.`);
}

if (errors.length) {
  console.log(`\nLỖI VI PHẠM TRẦN ĐỊNH MỨC (${errors.length} lỗi):`);
  errors.forEach(e => console.log(`  ✗ ${e}`));
  console.log("\nKẾT QUẢ: CHƯA ĐẠT CHUẨN CES-2026 v2.5 ✗");
  process.exit(1);
}

console.log("\nKẾT QUẢ: 100% ĐẠT CHUẨN CES-2026 v2.5 ✓");
