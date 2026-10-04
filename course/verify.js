const fs = require("fs");
global.window = { COURSE_MODULES: [] };

["module0","module1","module2","module3","module4","module5","module6","module7"].forEach(m => {
  new Function("window", fs.readFileSync("js/content/" + m + ".js", "utf8"))(window);
});

const mods = window.COURSE_MODULES;
console.log("Modules loaded:", mods.length);

let totalLessons = 0, totalQuestions = 0, errors = [];

mods.forEach(m => {
  const lessons = m.lessons.filter(l => l.type === "lesson");
  const quiz = m.lessons.find(l => l.type === "quiz");
  const qn = quiz ? quiz.questions.length : 0;
  totalLessons += lessons.length;
  totalQuestions += qn;
  console.log(`  M${m.id} "${m.title}": ${lessons.length} lessons + quiz(${qn}q)`);

  // Validate quiz integrity
  if (quiz) {
    quiz.questions.forEach((q, i) => {
      if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.options.length)
        errors.push(`M${m.id} q${i+1}: bad answer index`);
      if (!q.explain) errors.push(`M${m.id} q${i+1}: missing explain`);
      if (q.options.length < 2) errors.push(`M${m.id} q${i+1}: <2 options`);
    });
  }

  // Validate lesson content non-empty + no unescaped template leftovers
  lessons.forEach(l => {
    if (!l.content || l.content.length < 500) errors.push(`${l.id}: content too short`);
  });

  // Validate ID order sequential + quiz position (chặn bug thứ tự Module 7 tái phát)
  m.lessons.forEach((l, i) => {
    if (l.type === "lesson") {
      const expect = `${m.id}-${lessons.indexOf(l) + 1}`;
      if (l.id !== expect) errors.push(`M${m.id}[${i}]: id "${l.id}" sai vị trí, kỳ vọng "${expect}"`);
    }
  });
  if (quiz && m.lessons[m.lessons.length - 1].type !== "quiz")
    errors.push(`M${m.id}: quiz phải là phần tử CUỐI module (đang ở vị trí ${m.lessons.indexOf(quiz) + 1}/${m.lessons.length})`);
  const lessonIds = m.lessons.filter(l => l.type === "lesson").map(l => l.id);
  if (new Set(lessonIds).size !== lessonIds.length)
    errors.push(`M${m.id}: duplicate lesson id`);
});

// Test markdown renderer — standalone copy of app.js logic
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function inline(s) {
  if (!s) return "";
  s = escapeHtml(s);
  s = s.replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/gi, "<code>$1</code>");
  s = s.replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi, "<mark>$1</mark>");
  s = s.replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, "<b>$1</b>");
  s = s.replace(/&lt;br\s*\/?&gt;/gi, "<br>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\n/g, "<br>");
  return s;
}
const testMd = "## Title\n\nHello **world** `code`\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n~~~java\nint x = 1;\n~~~\n\n:::tip HELLO\ncontent here\n:::";
// simulate key transform outcomes
const checks = [
  ["bold", inline("Hello **world**").includes("<strong>world</strong>")],
  ["inline backtick code", inline("a `code` b").includes("<code>code</code>")],
  ["inline html code tag", inline("Dùng <code>JAVA_HOME</code> chuẩn.").includes("<code>JAVA_HOME</code>")],
  ["escape", escapeHtml("<script>") === "&lt;script&gt;"]
];
checks.forEach(([name, ok]) => console.log(`  markdown ${name}: ${ok ? "PASS" : "FAIL"}`));
if (checks.some(c => !c[1])) errors.push("markdown renderer failed a check");

console.log("---");
console.log(`Total: ${mods.length} modules, ${totalLessons} lessons, ${totalQuestions} quiz questions`);
if (errors.length) { console.log("ERRORS:"); errors.forEach(e => console.log("  ✗ " + e)); process.exit(1); }
console.log("ALL VALID ✓");
