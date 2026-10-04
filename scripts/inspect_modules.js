const fs = require("fs");
const path = require("path");

global.window = { COURSE_MODULES: [] };

for (let i = 1; i <= 5; i++) {
  const p = path.join(__dirname, "..", "course", "js", "content", "module" + i + ".js");
  if (fs.existsSync(p)) {
    new Function("window", fs.readFileSync(p, "utf8"))(window);
  }
}

window.COURSE_MODULES.forEach(m => {
  console.log("\n=======================================================");
  console.log("MODULE " + m.id + ": " + m.title + " (" + (m.subtitle || "") + ")");
  (m.topics || []).forEach(t => {
    console.log("  Topic " + t.id + ": " + t.title);
  });
});
