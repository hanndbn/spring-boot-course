const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
const contentDir = path.join(__dirname, '..', 'course', 'js', 'content');

['module0', 'module1', 'module2', 'module3', 'module4', 'module5', 'module6', 'module7'].forEach(m => {
  const filePath = path.join(contentDir, m + '.js');
  if (fs.existsSync(filePath)) {
    new Function('window', fs.readFileSync(filePath, 'utf8'))(window);
  }
});

let missingMermaid = [];
let missingTable = [];
let missingLineTable = [];

window.COURSE_MODULES.forEach(mod => {
  const lessons = (mod.lessons || []).filter(l => l.type !== 'quiz');
  lessons.forEach(l => {
    if (!l.content.includes('```mermaid')) {
      missingMermaid.push({ id: l.id, mod: mod.id, title: l.title });
    }
    if (!l.content.includes('|') || !l.content.includes('---')) {
      missingTable.push({ id: l.id, mod: mod.id, title: l.title });
    }
    const hasLine = l.content.includes('Dòng code') || l.content.includes('Dòng |') || l.content.includes('Cú pháp') || (l.content.includes('Dòng') && l.content.includes('Ý nghĩa'));
    if (!hasLine) {
      missingLineTable.push({ id: l.id, mod: mod.id, title: l.title });
    }
  });
});

console.log('=== MISSING MERMAID (' + missingMermaid.length + ') ===');
missingMermaid.forEach(x => console.log(`[${x.id}] ${x.title}`));

console.log('\n=== MISSING TABLE (' + missingTable.length + ') ===');
missingTable.forEach(x => console.log(`[${x.id}] ${x.title}`));

console.log('\n=== MISSING LINE BREAKDOWN (' + missingLineTable.length + ') ===');
missingLineTable.forEach(x => console.log(`[${x.id}] ${x.title}`));
