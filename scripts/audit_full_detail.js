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

const report = [];

window.COURSE_MODULES.forEach(mod => {
  const lessons = (mod.lessons || []).filter(l => l.type !== 'quiz');
  lessons.forEach(l => {
    const hasMermaid = l.content.includes('```mermaid');
    const hasTable = l.content.includes('|') && l.content.includes('---');
    const hasCode = l.content.includes('```java') || l.content.includes('```xml') || l.content.includes('```yaml') || l.content.includes('```sql') || l.content.includes('```bash') || l.content.includes('```properties') || l.content.includes('```dockerfile') || l.content.includes('```');
    const hasLineTable = l.content.includes('Dòng code') || l.content.includes('Cú pháp') || l.content.includes('Dòng | Cú pháp') || (l.content.includes('Dòng') && l.content.includes('Ý nghĩa'));
    
    if (!hasMermaid || !hasTable || !hasLineTable) {
      report.push({
        id: l.id,
        mod: mod.id,
        title: l.title.replace(/^Bài \d+\.\d+\.\d+:\s*/, ''),
        mermaid: hasMermaid ? '✓' : 'MISSING',
        table: hasTable ? '✓' : 'MISSING',
        lineTable: hasLineTable ? '✓' : 'MISSING',
        code: hasCode ? '✓' : 'MISSING'
      });
    }
  });
});

console.log('Total imperfect lessons:', report.length, 'out of 132');
console.table(report);
