/* =====================================================
   Spring Boot Mastery — App Engine
   Router + Renderer + Markdown parser + Quiz + Progress
   ===================================================== */
(function () {
  "use strict";

  const MODULES = (window.COURSE_MODULES || []).slice().sort((a, b) => a.id - b.id);
  const STORE_KEY = "sbmastery-progress-v1";
  const TOKEN_KEY = "sbmastery-jwt-token";
  const USER_KEY = "sbmastery-user-info";
  const API_BASE_KEY = "sbmastery-api-base";
  let API_BASE = window.API_BASE_URL || localStorage.getItem(API_BASE_KEY) || (location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "http://localhost:8080/api/v1" : "");

  // ---------- State ----------
  const state = {
    view: "dashboard",        // dashboard | lesson | quiz | curriculum
    currentLesson: null,      // lesson id
    currentQuizModule: null,  // module id
    completed: {},            // { lessonId: true }
    quizScores: {},           // { moduleId: {score, total} }
    searchIdx: [],
    currentUser: null,        // { id, username, email, fullName, role }
    token: null               // JWT string
  };

  // ---------- Utils ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      completed: state.completed,
      quizScores: state.quizScores
    }));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        state.completed = data.completed || {};
        state.quizScores = data.quizScores || {};
      }
      const rawToken = localStorage.getItem(TOKEN_KEY);
      const rawUser = localStorage.getItem(USER_KEY);
      if (rawToken && rawUser) {
        state.token = rawToken;
        state.currentUser = JSON.parse(rawUser);
      }
    } catch (e) { /* fresh */ }
  }

  // ---------- Supabase Direct Cloud Integration ----------
  const SUPABASE_URL = "https://rdtvdhliqnbflqstatsq.supabase.co";
  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdHZkaGxpcW5iZmxxc3RhdHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTM2MTAsImV4cCI6MjA4MzQyOTYxMH0._PuQmvqp026dvpEYgM0sbEZqhQk6sg4C4dz0hKrxp90";

  async function hashPassword(str) {
    const enc = new TextEncoder().encode(str + "_sbmastery_salt");
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function supabaseCall(endpoint, method = "GET", body = null, extraHeaders = {}) {
    const headers = {
      "apikey": SUPABASE_ANON,
      "Authorization": "Bearer " + SUPABASE_ANON,
      "Content-Type": "application/json",
      ...extraHeaders
    };
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1" + endpoint, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err && (err.message || err.detail) ? (err.message || err.detail) : ("Lỗi Supabase HTTP " + res.status));
      }
      if (res.status === 204) return null;
      return await res.json().catch(() => null);
    } catch (err) {
      console.warn("Supabase API Error [" + endpoint + "]:", err.message);
      throw err;
    }
  }

  async function syncLocalAndCloud() {
    if (!state.currentUser) return;
    const uid = state.currentUser.id;
    try {
      // 1. Lấy bài học đã hoàn thành từ Supabase
      const remoteLessons = await supabaseCall("/user_lesson_progress?user_id=eq." + uid + "&completed=eq.true&select=lesson_id");
      if (Array.isArray(remoteLessons)) {
        remoteLessons.forEach(r => { state.completed[r.lesson_id] = true; });
      }

      // 2. Lấy điểm quiz từ Supabase
      const remoteQuiz = await supabaseCall("/user_quiz_results?user_id=eq." + uid + "&select=module_id,score,total_questions");
      if (Array.isArray(remoteQuiz)) {
        remoteQuiz.forEach(r => {
          state.quizScores[r.module_id] = { score: r.score, total: r.total_questions };
        });
      }

      // 3. Đẩy các bài học hoàn thành ở local lên Supabase nếu chưa có
      const localLessonIds = Object.keys(state.completed).filter(id => state.completed[id]);
      if (localLessonIds.length > 0) {
        const payload = localLessonIds.map(id => ({ user_id: uid, lesson_id: id, completed: true }));
        await supabaseCall("/user_lesson_progress", "POST", payload, { "Prefer": "resolution=merge-duplicates" }).catch(() => {});
      }

      // 4. Đẩy điểm quiz ở local lên Supabase
      const quizKeys = Object.keys(state.quizScores);
      if (quizKeys.length > 0) {
        const qPayload = quizKeys.map(mId => ({
          user_id: uid,
          module_id: String(mId),
          score: state.quizScores[mId].score,
          total_questions: state.quizScores[mId].total,
          passed: (state.quizScores[mId].score / state.quizScores[mId].total) >= 0.8
        }));
        await supabaseCall("/user_quiz_results", "POST", qPayload, { "Prefer": "resolution=merge-duplicates" }).catch(() => {});
      }

      save();
      renderAll();
    } catch (e) {
      console.warn("Cloud sync warning:", e.message);
    }
  }

  function syncCompleteLessonCloud(lessonId) {
    if (!state.currentUser) return;
    supabaseCall("/user_lesson_progress", "POST", {
      user_id: state.currentUser.id,
      lesson_id: lessonId,
      completed: true
    }, { "Prefer": "resolution=merge-duplicates" }).catch(err => console.warn(err));
  }

  function syncUncompleteLessonCloud(lessonId) {
    if (!state.currentUser) return;
    supabaseCall("/user_lesson_progress?user_id=eq." + state.currentUser.id + "&lesson_id=eq." + encodeURIComponent(lessonId), "DELETE")
      .catch(err => console.warn(err));
  }

  function syncQuizCloud(moduleId, score, totalQuestions) {
    if (!state.currentUser) return;
    supabaseCall("/user_quiz_results", "POST", {
      user_id: state.currentUser.id,
      module_id: String(moduleId),
      score: score,
      total_questions: totalQuestions,
      passed: (score / totalQuestions) >= 0.8
    }, { "Prefer": "resolution=merge-duplicates" }).catch(err => console.warn(err));
  }

  // ---------- Auth & User UI ----------
  function updateAuthUI() {
    const authBtn = $("#authBtn");
    const authBtnText = $("#authBtnText");
    const userDropdown = $("#userDropdown");
    const dropdownAvatar = $("#dropdownAvatar");
    const dropdownName = $("#dropdownName");
    const dropdownEmail = $("#dropdownEmail");

    if (state.currentUser && state.token) {
      if (authBtn) authBtn.classList.add("logged-in");
      const displayName = state.currentUser.full_name || state.currentUser.fullName || state.currentUser.username || "Học viên";
      const initial = (state.currentUser.full_name || state.currentUser.fullName || state.currentUser.username || "U").charAt(0).toUpperCase();
      if (authBtnText) authBtnText.textContent = displayName;
      if (dropdownAvatar) dropdownAvatar.textContent = initial;
      if (dropdownName) dropdownName.textContent = displayName;
      if (dropdownEmail) dropdownEmail.textContent = state.currentUser.email || "";
    } else {
      if (authBtn) authBtn.classList.remove("logged-in");
      if (authBtnText) authBtnText.textContent = "Đăng nhập";
      if (userDropdown) userDropdown.style.display = "none";
    }
  }

  function showAuthAlert(msg, isError = true) {
    const alert = $("#authAlert");
    if (!alert) return;
    alert.textContent = msg;
    alert.className = isError ? "auth-alert error" : "auth-alert success";
    alert.style.display = "block";
  }

  function hideAuthAlert() {
    const alert = $("#authAlert");
    if (alert) alert.style.display = "none";
  }

  function openAuthModal(tab = "login") {
    const backdrop = $("#authModalBackdrop");
    const tabLogin = $("#tabLogin");
    const tabRegister = $("#tabRegister");
    const formLogin = $("#loginForm");
    const formRegister = $("#registerForm");
    const modalTitle = $("#authModalTitle");

    hideAuthAlert();
    if (tab === "login") {
      if (tabLogin) tabLogin.classList.add("active");
      if (tabRegister) tabRegister.classList.remove("active");
      if (formLogin) formLogin.style.display = "flex";
      if (formRegister) formRegister.style.display = "none";
      if (modalTitle) modalTitle.textContent = "Đăng Nhập Khóa Học";
      setTimeout(() => $("#loginUsername") && $("#loginUsername").focus(), 50);
    } else {
      if (tabRegister) tabRegister.classList.add("active");
      if (tabLogin) tabLogin.classList.remove("active");
      if (formLogin) formLogin.style.display = "none";
      if (formRegister) formRegister.style.display = "flex";
      if (modalTitle) modalTitle.textContent = "Tạo Tài Khoản Khóa Học";
      setTimeout(() => $("#regFullName") && $("#regFullName").focus(), 50);
    }
    if (backdrop) backdrop.style.display = "flex";
  }

  function closeAuthModal() {
    const backdrop = $("#authModalBackdrop");
    if (backdrop) backdrop.style.display = "none";
    hideAuthAlert();
  }

  function findLesson(id) {
    for (const m of MODULES) {
      const l = m.lessons.find((x) => x.id === id);
      if (l) return { module: m, lesson: l };
    }
    return null;
  }

  function allItems() {
    const items = [];
    MODULES.forEach((m) => m.lessons.forEach((l) => items.push({ module: m, lesson: l })));
    return items;
  }

  function flatIndex() {
    return allItems().filter((x) => x.lesson.type !== "quiz")
      .concat(allItems().filter((x) => x.lesson.type === "quiz"));
  }

  function moduleProgress(m) {
    const done = m.lessons.filter((l) => state.completed[l.id]).length;
    return { done, total: m.lessons.length, pct: Math.round((done / m.lessons.length) * 100) };
  }

  function overallProgress() {
    const items = allItems();
    const done = items.filter((x) => state.completed[x.lesson.id]).length;
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
  }

  function nextIncompleteItem() {
    return flatIndex().find((x) => !state.completed[x.lesson.id]);
  }

  function toast(msg) {
    const t = $("#toast");
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------- Markdown renderer (custom mini) ----------
  function renderMarkdown(src) {
    const lines = src.split("\n");
    let html = "";
    let i = 0;

    const codeBlock = (lang) => {
      let buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("~~~")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing ~~~
      const code = buf.join("\n");
      const esc = escapeHtml(code);
      if (lang === "mermaid") {
        return `<div class="diagram-wrapper"><div class="diagram-header"><span class="diagram-badge">📊 SƠ ĐỒ MÔ PHỎNG KIẾN TRÚC</span></div><div class="mermaid">${esc}</div></div>`;
      }
      if (lang && window.hljs) {
        try {
          return `<div class="code-block"><div class="code-block-header"><span class="cb-lang">${lang}</span><button class="cb-copy" data-code="${encodeURIComponent(code)}">Sao chép</button></div><pre><code class="language-${lang} hljs">${window.hljs.highlight(code, { language: lang }).value}</code></pre></div>`;
        } catch (e) { /* fallthrough */ }
      }
      return `<div class="code-block"><div class="code-block-header"><span class="cb-lang">${lang || "code"}</span><button class="cb-copy" data-code="${encodeURIComponent(code)}">Sao chép</button></div><pre><code>${esc}</code></pre></div>`;
    };

    while (i < lines.length) {
      const line = lines[i];

      // Fenced code
      if (line.startsWith("~~~")) {
        const lang = line.slice(3).trim();
        html += codeBlock(lang);
        continue;
      }

      // Callouts :::type Title ... :::
      if (line.startsWith(":::")) {
        const parts = line.slice(3).trim().split(" ");
        const type = parts[0] || "info";
        const title = parts.slice(1).join(" ");
        const icons = { tip: "💡", warn: "⚠️", danger: "🚫", info: "ℹ️", laas: "🏢", takeaways: "🎯" };
        let buf = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(":::")) {
          buf.push(lines[i]);
          i++;
        }
        i++; // skip closing
        const inner = renderMarkdown(buf.join("\n"));
        const icon = icons[type] || "ℹ️";
        const t = title ? `<div class="callout-title">${escapeHtml(title)}</div>` : "";
        if (type === "takeaways") {
          html += `<div class="key-takeaways"><h3>🎯 Ghi nhớ bài học</h3>${inner}</div>`;
        } else {
          html += `<div class="callout ${type}"><div class="callout-icon">${icon}</div><div class="callout-body">${t}${inner}</div></div>`;
        }
        continue;
      }

      // Headings
      if (line.startsWith("### ")) { html += `<h3>${inline(line.slice(4))}</h3>`; i++; continue; }
      if (line.startsWith("## ")) { html += `<h2>${inline(line.slice(3))}</h2>`; i++; continue; }

      // HR
      if (/^---+$/.test(line.trim())) { html += `<hr>`; i++; continue; }

      // Table
      if (line.trim().startsWith("|") && i + 1 < lines.length &&
          /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        let tbl = [`<div class="table-wrap"><table>`];
        const parseRow = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "")
          .split("|").map((c) => c.trim());
        const headers = parseRow(line);
        tbl.push("<thead><tr>" + headers.map((h) => `<th>${inline(h)}</th>`).join("") + "</tr></thead>");
        i += 2;
        tbl.push("<tbody>");
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          const cells = parseRow(lines[i]);
          tbl.push("<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
          i++;
        }
        tbl.push("</tbody></table></div>");
        html += tbl.join("");
        continue;
      }

      // Checklist
      if (/^\s*- \[ \] /.test(line)) {
        let buf = [];
        while (i < lines.length && /^\s*- \[ \] /.test(lines[i])) {
          buf.push(`<li>${inline(lines[i].replace(/^\s*- \[ \] /, ""))}</li>`);
          i++;
        }
        html += `<ul class="checklist">${buf.join("")}</ul>`;
        continue;
      }

      // Lists
      if (/^\s*[-*] /.test(line)) {
        let buf = [];
        while (i < lines.length && /^\s*[-*] /.test(lines[i])) {
          buf.push(`<li>${inline(lines[i].replace(/^\s*[-*] /, ""))}</li>`);
          i++;
        }
        html += `<ul>${buf.join("")}</ul>`;
        continue;
      }
      if (/^\s*\d+\. /.test(line)) {
        let buf = [];
        while (i < lines.length && /^\s*\d+\. /.test(lines[i])) {
          buf.push(`<li>${inline(lines[i].replace(/^\s*\d+\. /, ""))}</li>`);
          i++;
        }
        html += `<ol>${buf.join("")}</ol>`;
        continue;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        let buf = [];
        while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
          buf.push(lines[i].replace(/^> ?/, ""));
          i++;
        }
        html += `<blockquote>${renderMarkdown(buf.join("\n"))}</blockquote>`;
        i++;
        continue;
      }

      // Paragraph
      if (line.trim() === "") { i++; continue; }
      let para = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== "" &&
             !lines[i].startsWith("~~~") && !lines[i].startsWith(":::") &&
             !lines[i].startsWith("#") && !lines[i].trim().startsWith("|") &&
             !/^\s*[-*] /.test(lines[i]) && !/^\s*\d+\. /.test(lines[i]) &&
             !lines[i].startsWith("> ") && !/^---+$/.test(lines[i].trim())) {
        para.push(lines[i]);
        i++;
      }
      html += `<p>${inline(para.join("\n"))}</p>`;
    }

    return html;
  }

  // Inline markdown: **bold**, *em*, `code`, [text](url)
  function inline(s) {
    s = escapeHtml(s);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    s = s.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
    s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // line break inside paragraph
    s = s.replace(/\n/g, "<br>");
    return s;
  }

  // ---------- Sidebar ----------
  function renderSidebar(activeLessonId) {
    const nav = $("#sidebarNav");
    let html = `
      <a class="nav-home ${state.view === "dashboard" ? "active" : ""}" data-view="dashboard">
        🏠 Tổng quan
      </a>
      <a class="nav-home ${state.view === "curriculum" ? "active" : ""}" data-view="curriculum">
        📚 Chương trình chi tiết
      </a>`;

    MODULES.forEach((m) => {
      const prog = moduleProgress(m);
      const hasActive = m.lessons.some((l) => l.id === activeLessonId) ||
                        (state.view === "quiz" && state.currentQuizModule === m.id);
      const open = hasActive || prog.pct > 0;
      html += `
      <div class="nav-module mc-${m.id} ${open ? "open" : ""} ${prog.pct === 100 ? "done" : ""}">
        <div class="nav-module-head" data-module="${m.id}">
          <span class="nm-badge" style="background: var(--mc-color)">${m.icon}</span>
          <span class="nm-title">${m.id}. ${escapeHtml(m.title)}</span>
          <span class="nm-check">✓</span>
          <span class="nm-count">${prog.done}/${prog.total}</span>
        </div>
        <div class="nav-lessons">
          ${m.lessons.map((l) => `
            <div class="nav-lesson ${state.completed[l.id] ? "done" : ""} ${l.id === activeLessonId ? "active" : ""}"
                 data-lesson="${l.id}">
              <span class="nl-dot"></span>
              <span class="nl-title">${l.type === "quiz" ? "🏆 " : ""}${escapeHtml(l.title)}</span>
              <span class="nl-mins">${l.minutes}p</span>
            </div>`).join("")}
        </div>
      </div>`;
    });

    nav.innerHTML = html;

    $$(".nav-home", nav).forEach((el) =>
      el.addEventListener("click", () => gotoView(el.dataset.view)));
    $$(".nav-module-head", nav).forEach((el) =>
      el.addEventListener("click", () => el.parentElement.classList.toggle("open")));
    $$(".nav-lesson", nav).forEach((el) =>
      el.addEventListener("click", () => gotoLesson(el.dataset.lesson)));
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const total = overallProgress();
    const items = allItems();
    const lessonsDone = items.filter((x) => x.lesson.type !== "quiz" && state.completed[x.lesson.id]).length;
    const lessonsTotal = items.filter((x) => x.lesson.type !== "quiz").length;
    const modulesDone = MODULES.filter((m) => moduleProgress(m).pct === 100).length;
    const scores = Object.values(state.quizScores);
    const avg = scores.length
      ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length) + "%"
      : "—";

    $("#statLessonsDone").textContent = `${lessonsDone}/${lessonsTotal}`;
    $("#statModulesDone").textContent = `${modulesDone}/${MODULES.length}`;
    $("#statQuizAvg").textContent = avg;
    $("#headerProgressPct").textContent = total.pct + "%";
    $("#dashRingText").textContent = total.pct + "%";

    const streakEl = $("#streakSub");
    if (streakEl) {
      const quizCount = MODULES.reduce((acc, m) => {
        const q = m.lessons.find((l) => l.type === "quiz");
        return acc + (q && q.questions ? q.questions.length : 0);
      }, 0);
      streakEl.textContent = `${lessonsTotal} bài · ${MODULES.length} module · ${quizCount} câu quiz`;
    }

    const CIRC = 226.2;
    $("#dashRing").style.strokeDashoffset = CIRC - (CIRC * total.pct) / 100;
    const HCIRC = 100.5;
    $("#headerRing").style.strokeDashoffset = HCIRC - (HCIRC * total.pct) / 100;

    const grid = $("#moduleGrid");
    grid.innerHTML = MODULES.map((m) => {
      const p = moduleProgress(m);
      const firstLesson = m.lessons[0];
      return `
      <div class="module-card mc-${m.id}" data-lesson="${firstLesson.id}">
        <div class="mc-top">
          <div class="mc-badge">${m.icon}</div>
          <div>
            <div class="mc-title">Module ${m.id}: ${escapeHtml(m.title)}</div>
            <div class="mc-sub">${escapeHtml(m.subtitle)}</div>
          </div>
        </div>
        <div class="mc-desc">${escapeHtml(m.desc)}</div>
        <div class="mc-meta">
          <span>📖 ${m.lessons.filter(l => l.type === "lesson").length} bài</span>
          <span>🏆 1 quiz</span>
          <span>⏱ ${m.lessons.reduce((a, l) => a + l.minutes, 0)} phút</span>
        </div>
        <div class="mc-progress">
          <div class="mc-progress-bar"><div class="mc-progress-fill" style="width:${p.pct}%"></div></div>
          <div class="mc-progress-text"><span>${p.done}/${p.total} hoàn thành</span><span>${p.pct}%</span></div>
        </div>
      </div>`;
    }).join("");

    $$(".module-card", grid).forEach((card) =>
      card.addEventListener("click", () => gotoLesson(card.dataset.lesson)));
  }

  // ---------- Lesson ----------
  function renderLesson(lessonId) {
    const found = findLesson(lessonId);
    if (!found) return gotoView("dashboard");
    const { module: m, lesson } = found;
    state.currentLesson = lessonId;

    const flat = flatIndex();
    const idx = flat.findIndex((x) => x.lesson.id === lessonId);
    const prev = flat[idx - 1];
    const next = flat[idx + 1];
    const done = !!state.completed[lessonId];

    const view = $("#view-lesson");
    view.innerHTML = `
      <div class="lesson-header">
        <div class="breadcrumb">
          <a data-view="dashboard">Tổng quan</a><span class="sep">›</span>
          <span>Module ${m.id}: ${escapeHtml(m.title)}</span><span class="sep">›</span>
          <span>${escapeHtml(lesson.title)}</span>
        </div>
        <h1 class="lesson-title">${escapeHtml(lesson.title)}</h1>
        <div class="lesson-meta">
          <span>📖 Bài ${lessonId}</span>
          <span>⏱ ${lesson.minutes} phút</span>
          <span>📦 Module ${m.id} — ${escapeHtml(m.title)}</span>
        </div>
      </div>
      <article class="lesson-body">${renderMarkdown(lesson.content)}</article>
      <button class="btn-complete ${done ? "done" : ""}" id="completeBtn">
        ${done ? "✓ Đã hoàn thành bài này" : "☐ Đánh dấu hoàn thành"}
      </button>
      <div class="lesson-footer">
        ${prev ? `<button class="lf-btn" data-nav="${prev.lesson.id}">
            <span class="lf-label">← Bài trước</span>
            <span class="lf-title">${escapeHtml(prev.lesson.title)}</span>
          </button>` : `<div></div>`}
        ${next ? `<button class="lf-btn next" data-nav="${next.lesson.id}">
            <span class="lf-label">Bài tiếp theo →</span>
            <span class="lf-title ${next.lesson.type === "quiz" ? "finish" : ""}">${escapeHtml(next.lesson.title)}</span>
          </button>` : `<div></div>`}
      </div>`;

    $("#completeBtn").addEventListener("click", () => {
      if (state.completed[lessonId]) {
        delete state.completed[lessonId];
        syncUncompleteLessonCloud(lessonId);
      } else {
        state.completed[lessonId] = true;
        toast("🎉 Đánh dấu hoàn thành!");
        syncCompleteLessonCloud(lessonId);
      }
      save();
      renderAll();
    });
    $$("[data-nav]", view).forEach((b) =>
      b.addEventListener("click", () => gotoLesson(b.dataset.nav)));
    $$(".breadcrumb [data-view]", view).forEach((b) =>
      b.addEventListener("click", () => gotoView(b.dataset.view)));
    bindCopyButtons(view);
    if (window.mermaid) {
      setTimeout(() => {
        try {
          const diagrams = view.querySelectorAll(".mermaid");
          if (diagrams.length > 0) {
            window.mermaid.run({ nodes: diagrams });
          }
        } catch (e) {
          console.warn("Mermaid execution error:", e);
        }
      }, 50);
    }
  }

  function bindCopyButtons(root) {
    $$(".cb-copy", root).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const code = decodeURIComponent(btn.dataset.code);
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "✓ Đã sao chép";
          setTimeout(() => (btn.textContent = "Sao chép"), 1600);
        });
      });
    });
  }

  // ---------- Quiz ----------
  const quizState = { module: null, idx: 0, answers: [], finished: false };

  function gotoQuiz(moduleId) {
    const m = MODULES.find((x) => x.id === moduleId);
    const quiz = m && m.lessons.find((l) => l.type === "quiz");
    if (!quiz) return gotoView("dashboard");
    quizState.module = m;
    quizState.quiz = quiz;
    quizState.idx = 0;
    quizState.answers = new Array(quiz.questions.length).fill(null);
    quizState.finished = false;
    state.currentQuizModule = moduleId;
    showView("quiz");
    renderQuiz();
  }

  function renderQuiz() {
    const { quiz, idx, answers } = quizState;
    const view = $("#view-quiz");
    const total = quiz.questions.length;

    if (quizState.finished) {
      const score = answers.filter((a, i) => a === quiz.questions[i].answer).length;
      state.quizScores[quizState.module.id] = { score, total };
      state.completed[quiz.id] = true;
      save();
      syncQuizCloud(quizState.module.id, score, total);
      syncCompleteLessonCloud(quiz.id);
      const pct = Math.round((score / total) * 100);
      const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📖";
      const msg = pct >= 80
        ? "Xuất sắc! Bạn đã nắm vững kiến thức module này. Tiếp tục phát huy!"
        : pct >= 50
        ? "Khá ổn! Xem lại các câu sai ở trên (giải thích kèm theo) rồi thử lại nhé."
        : "Đừng nản — hãy đọc lại bài học, mọi giải thích đều có ở trên. Bạn làm được!";

      const items = allItems();
      const flat = flatIndex();
      const qIdx = flat.findIndex((x) => x.lesson.id === quiz.id);
      const next = flat[qIdx + 1];

      view.innerHTML = `
        <div class="quiz-wrap">
          <div class="quiz-result">
            <div class="qr-emoji">${emoji}</div>
            <div class="qr-score">${score}<span class="qr-total">/${total}</span></div>
            <div style="font-weight:700;font-size:15px;color:var(--text-2)">${pct}% đúng</div>
            <p class="qr-msg">${msg}</p>
            <div class="qr-actions">
              <button class="btn btn-ghost" id="retryQuiz">🔄 Làm lại</button>
              ${next ? `<button class="btn btn-primary" id="nextAfterQuiz">Tiếp tục: ${escapeHtml(next.lesson.title)} →</button>`
                     : `<button class="btn btn-primary" data-view="dashboard">Về tổng quan 🎉</button>`}
            </div>
          </div>
        </div>`;

      $("#retryQuiz").addEventListener("click", () => gotoQuiz(quizState.module.id));
      const nxt = $("#nextAfterQuiz");
      if (nxt) nxt.addEventListener("click", () => gotoLesson(next.lesson.id));
      $$("[data-view]", view).forEach((b) =>
        b.addEventListener("click", () => gotoView(b.dataset.view)));
      return;
    }

    const q = quiz.questions[idx];
    const chosen = answers[idx];
    const letters = ["A", "B", "C", "D", "E"];

    view.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="q-badge">🏆 ${escapeHtml(quiz.title)}</div>
          <h2>Câu ${idx + 1} / ${total}</h2>
          <p>Chọn đáp án rồi bấm Xác nhận — bạn sẽ thấy giải thích ngay.</p>
        </div>
        <div class="quiz-progress">
          ${quiz.questions.map((_, i) =>
            `<div class="qp-dot ${i === idx ? "current" : answers[i] !== null ? "answered" : ""}"></div>`).join("")}
        </div>
        <div class="quiz-card">
          <div class="quiz-qnum">Câu hỏi ${idx + 1} / ${total}${q.level ? ` · <span class="q-level ${q.level}">${q.level === "hard" ? "🔥 Khó" : q.level === "medium" ? "⚡ Vừa" : "🎯 Cơ bản"}</span>` : ""}</div>
          ${q.scenario ? `<div class="quiz-scenario"><div class="qs-label">📋 Tình huống</div><div class="qs-text">${escapeHtml(q.scenario)}</div></div>` : ""}
          <div class="quiz-question">${escapeHtml(q.q)}</div>
          ${q.code ? `<div class="quiz-code">${codeHtml(q.code, q.codeLang || "java")}</div>` : ""}
          <div class="quiz-options">
            ${q.options.map((opt, oi) => {
              let cls = "quiz-opt";
              if (chosen !== null) {
                if (oi === q.answer) cls += " correct";
                else if (oi === chosen) cls += " wrong";
              }
              return `<button class="${cls}" data-opt="${oi}" ${chosen !== null ? "disabled" : ""}>
                <span class="qo-letter">${letters[oi]}</span>
                <span>${escapeHtml(opt)}</span>
              </button>`;
            }).join("")}
          </div>
          ${chosen !== null ? `
            <div class="quiz-explain ${chosen === q.answer ? "ok" : "bad"}">
              <strong>${chosen === q.answer ? "✅ Chính xác!" : `❌ Chưa đúng — đáp án đúng là ${letters[q.answer]}.`}</strong>
              ${escapeHtml(q.explain)}
            </div>
            ${q.why ? `<div class="quiz-why"><div class="qw-title">🔍 Mổ xẻ từng phương án</div>${q.why.map((w, wi) => `
              <div class="qw-row ${wi === q.answer ? "correct" : wi === chosen ? "chosen-wrong" : ""}">
                <span class="qw-letter">${letters[wi]}</span>
                <span class="qw-text">${escapeHtml(w)}</span>
              </div>`).join("")}</div>` : ""}` : ""}
        </div>
        <div class="quiz-actions">
          <button class="btn-secondary" id="quizPrev" ${idx === 0 ? "disabled" : ""}>← Trước</button>
          <button class="btn-primary btn" id="quizNext" style="border:none">
            ${chosen === null ? "Xác nhận →" : idx === total - 1 ? "Xem kết quả 🏁" : "Tiếp →"}
          </button>
        </div>
      </div>`;

    $$(".quiz-opt", view).forEach((b) =>
      b.addEventListener("click", () => {
        if (answers[idx] !== null) return;
        answers[idx] = parseInt(b.dataset.opt, 10);
        if (idx === total - 1) {
          quizState.finished = true;
        }
        renderQuiz();
        if (quizState.finished) {
          state.completed[quiz.id] = true;
          save();
          renderSidebar(null);
        }
      }));

    $("#quizPrev").addEventListener("click", () => {
      if (idx > 0) { quizState.idx--; renderQuiz(); }
    });
    $("#quizNext").addEventListener("click", () => {
      if (answers[idx] === null && idx < total - 1) return;
      if (idx < total - 1) { quizState.idx++; renderQuiz(); }
      else { quizState.finished = true; renderQuiz(); }
    });
  }

  function codeHtml(code, lang) {
    let highlighted = escapeHtml(code);
    if (window.hljs) {
      try { highlighted = window.hljs.highlight(code, { language: lang }).value; } catch (e) {}
    }
    return `<div class="code-block"><div class="code-block-header"><span class="cb-lang">${lang}</span><button class="cb-copy" data-code="${encodeURIComponent(code)}">Sao chép</button></div><pre><code>${highlighted}</code></pre></div>`;
  }

  // ---------- Curriculum ----------
  function renderCurriculum() {
    const view = $("#view-curriculum");
    view.innerHTML = `
      <div class="curr-intro">
        <h2>📚 Chương trình chi tiết</h2>
        <p>8 module · ${allItems().length} bài học + quiz · ~80 giờ — click từng bài để bắt đầu học ngay.</p>
      </div>
      ${MODULES.map((m) => {
        const p = moduleProgress(m);
        return `
        <div class="curr-module mc-${m.id}">
          <div class="curr-module-head">
            <div class="cm-badge">${m.icon}</div>
            <div class="cm-info">
              <div class="cm-title">Module ${m.id}: ${escapeHtml(m.title)}</div>
              <div class="cm-meta">${m.lessons.length} mục · ${m.lessons.reduce((a, l) => a + l.minutes, 0)} phút · ${p.done}/${p.total} xong</div>
            </div>
            <svg class="cm-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div class="curr-lessons">
            ${m.lessons.map((l) => `
              <div class="curr-lesson ${state.completed[l.id] ? "done" : ""}" data-lesson="${l.id}">
                <span class="cl-check">✓</span>
                <span class="cl-title">${escapeHtml(l.title)}</span>
                <span class="cl-type ${l.type}">${l.type === "quiz" ? "Quiz" : l.minutes >= 100 ? "Project" : "Bài học"}</span>
                <span class="cl-mins">${l.minutes} phút</span>
              </div>`).join("")}
          </div>
        </div>`;
      }).join("")}`;

    $$(".curr-module-head", view).forEach((h) =>
      h.addEventListener("click", () => h.parentElement.classList.toggle("open")));
    $$(".curr-lesson", view).forEach((el) =>
      el.addEventListener("click", () => gotoLesson(el.dataset.lesson)));
  }

  // ---------- Search ----------
  function buildSearchIndex() {
    state.searchIdx = [];
    MODULES.forEach((m) => m.lessons.forEach((l) => {
      if (l.type === "quiz") {
        l.questions.forEach((q, i) =>
          state.searchIdx.push({
            title: `Quiz: ${q.q.slice(0, 60)}...`,
            meta: `${m.title} · Câu ${i + 1}`,
            target: l.id, isQuiz: true, moduleId: m.id,
            hay: (q.q + " " + q.explain).toLowerCase()
          }));
      } else {
        state.searchIdx.push({
          title: l.title, meta: `Module ${m.id} · ${m.title}`,
          target: l.id, isQuiz: false,
          hay: (l.title + " " + l.content).toLowerCase()
        });
      }
    }));
  }

  function doSearch(q) {
    const box = $("#searchResults");
    if (!q || q.length < 2) { box.classList.remove("open"); return; }
    const needle = q.toLowerCase();
    const hits = state.searchIdx
      .filter((x) => x.hay.includes(needle))
      .slice(0, 8);
    if (!hits.length) {
      box.innerHTML = `<div class="search-item"><span class="si-title">Không tìm thấy kết quả cho "${escapeHtml(q)}"</span></div>`;
      box.classList.add("open");
      return;
    }
    box.innerHTML = hits.map((h, i) => `
      <div class="search-item ${i === 0 ? "active" : ""}" data-target="${h.target}" data-quiz="${h.isQuiz}" data-module="${h.moduleId || ""}">
        <span class="si-title">${mark(h.title, q)}</span>
        <span class="si-meta">${escapeHtml(h.meta)}</span>
      </div>`).join("");
    box.classList.add("open");

    $$(".search-item[data-target]", box).forEach((el) =>
      el.addEventListener("click", () => {
        box.classList.remove("open");
        $("#searchInput").value = "";
        if (el.dataset.quiz === "true") gotoQuiz(parseInt(el.dataset.module, 10));
        else gotoLesson(el.dataset.target);
      }));
  }

  function mark(text, q) {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx)) +
      `<mark>${escapeHtml(text.slice(idx, idx + q.length))}</mark>` +
      escapeHtml(text.slice(idx + q.length));
  }

  // ---------- Router ----------
  function showView(name) {
    state.view = name;
    ["dashboard", "lesson", "quiz", "curriculum"].forEach((v) => {
      const el = $("#view-" + v);
      if (el) el.hidden = v !== name;
    });
    window.scrollTo({ top: 0 });
    closeSidebar();
  }

  function gotoView(name) {
    if (name === "dashboard") { showView("dashboard"); renderAll(); }
    else if (name === "curriculum") { showView("curriculum"); renderCurriculum(); renderSidebar(null); }
  }

  function gotoLesson(id) {
    const found = findLesson(id);
    if (!found) return;
    if (found.lesson.type === "quiz") return gotoQuiz(found.module.id);
    showView("lesson");
    renderLesson(id);
    renderSidebar(id);
    renderDashboardStats();
  }

  function renderDashboardStats() {
    const total = overallProgress();
    $("#headerProgressPct").textContent = total.pct + "%";
    const HCIRC = 100.5;
    $("#headerRing").style.strokeDashoffset = HCIRC - (HCIRC * total.pct) / 100;
  }

  function renderAll() {
    renderSidebar(state.currentLesson);
    renderDashboard();
    if (state.view === "curriculum") renderCurriculum();
  }

  // ---------- Sidebar mobile ----------
  function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#backdrop").classList.remove("show");
  }

  // ---------- Init ----------
  function init() {
    load();
    buildSearchIndex();

    $("#menuToggle").addEventListener("click", () => {
      $("#sidebar").classList.toggle("open");
      $("#backdrop").classList.toggle("show");
    });
    $("#backdrop").addEventListener("click", closeSidebar);

    $("#continueBtn").addEventListener("click", () => {
      const next = nextIncompleteItem();
      if (next) gotoLesson(next.lesson.id);
      else gotoView("curriculum");
    });

    $$("[data-view]").forEach((el) => {
      if (el.closest("#sidebarNav") || el.closest("#view-lesson") || el.closest("#view-quiz")) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        gotoView(el.dataset.view);
      });
    });

    const searchInput = $("#searchInput");
    searchInput.addEventListener("input", (e) => doSearch(e.target.value));
    searchInput.addEventListener("focus", (e) => doSearch(e.target.value));
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === "Escape") {
        $("#searchResults").classList.remove("open");
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-box"))
        $("#searchResults").classList.remove("open");
    });

    $("#resetProgress").addEventListener("click", () => {
      if (!confirm("Xóa toàn bộ tiến độ học tập?")) return;
      state.completed = {};
      state.quizScores = {};
      save();
      renderAll();
      toast("🗑️ Đã xóa tiến độ — bắt đầu lại từ đầu!");
    });

    // ---------- Auth Modal & User Event Listeners ----------
    const tabLogin = $("#tabLogin");
    const tabRegister = $("#tabRegister");
    const modalClose = $("#modalClose");
    const authModalBackdrop = $("#authModalBackdrop");
    const loginForm = $("#loginForm");
    const registerForm = $("#registerForm");
    const authBtn = $("#authBtn");
    const userDropdown = $("#userDropdown");
    const btnLogout = $("#btnLogout");
    const btnSyncCloud = $("#btnSyncCloud");

    if (tabLogin) tabLogin.addEventListener("click", () => openAuthModal("login"));
    if (tabRegister) tabRegister.addEventListener("click", () => openAuthModal("register"));
    if (modalClose) modalClose.addEventListener("click", closeAuthModal);
    if (authModalBackdrop) {
      authModalBackdrop.addEventListener("click", (e) => {
        if (e.target === authModalBackdrop) closeAuthModal();
      });
    }

    if (authBtn) {
      authBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (state.currentUser && state.token) {
          userDropdown.style.display = userDropdown.style.display === "none" ? "block" : "none";
        } else {
          openAuthModal("login");
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (userDropdown && !e.target.closest("#userMenuWrapper")) {
        userDropdown.style.display = "none";
      }
    });

    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        state.currentUser = null;
        state.token = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        userDropdown.style.display = "none";
        updateAuthUI();
        toast("👋 Đã đăng xuất thành công.");
      });
    }

    if (btnSyncCloud) {
      btnSyncCloud.addEventListener("click", async () => {
        userDropdown.style.display = "none";
        toast("⏳ Đang đồng bộ tiến độ với máy chủ...");
        try {
          await syncLocalAndCloud();
          toast("☁️ Đồng bộ tiến độ thành công!");
        } catch (e) {
          toast("⚠️ Không thể kết nối máy chủ để đồng bộ.");
        }
      });
    }

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = $("#loginUsername").value.trim();
        const password = $("#loginPassword").value;
        const submitBtn = $("#btnLoginSubmit");
        const btnText = submitBtn.querySelector(".btn-text") || submitBtn;
        const originalText = btnText.textContent;
        try {
          btnText.textContent = "Đang kiểm tra...";
          submitBtn.disabled = true;
          hideAuthAlert();

          const users = await supabaseCall("/users?or=(username.eq." + encodeURIComponent(username) + ",email.eq." + encodeURIComponent(username) + ")&select=*");
          if (!users || users.length === 0) {
            throw new Error("Không tìm thấy tài khoản với Username hoặc Email này.");
          }

          const user = users[0];
          const hashed = await hashPassword(password);
          if (user.password_hash !== hashed) {
            throw new Error("Mật khẩu không chính xác.");
          }

          state.currentUser = user;
          state.token = "sb-session-" + user.id;
          localStorage.setItem(TOKEN_KEY, state.token);
          localStorage.setItem(USER_KEY, JSON.stringify(state.currentUser));
          updateAuthUI();
          closeAuthModal();
          toast("🎉 Chào mừng trở lại, " + (state.currentUser.full_name || state.currentUser.username) + "!");
          await syncLocalAndCloud();
        } catch (err) {
          showAuthAlert(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
        } finally {
          btnText.textContent = originalText;
          submitBtn.disabled = false;
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fullName = $("#regFullName").value.trim();
        const username = $("#regUsername").value.trim();
        const email = $("#regEmail").value.trim();
        const password = $("#regPassword").value;
        const submitBtn = $("#btnRegisterSubmit");
        const btnText = submitBtn.querySelector(".btn-text") || submitBtn;
        const originalText = btnText.textContent;
        try {
          btnText.textContent = "Đang tạo tài khoản...";
          submitBtn.disabled = true;
          hideAuthAlert();

          const existing = await supabaseCall("/users?or=(username.eq." + encodeURIComponent(username) + ",email.eq." + encodeURIComponent(email) + ")&select=id");
          if (existing && existing.length > 0) {
            throw new Error("Username hoặc Email này đã tồn tại trong hệ thống.");
          }

          const hashed = await hashPassword(password);
          const created = await supabaseCall("/users", "POST", {
            username: username,
            email: email,
            password_hash: hashed,
            full_name: fullName || username,
            role: "ROLE_USER"
          }, { "Prefer": "return=representation" });

          if (!created || created.length === 0) {
            throw new Error("Không thể tạo tài khoản trên máy chủ.");
          }

          state.currentUser = created[0];
          state.token = "sb-session-" + state.currentUser.id;
          localStorage.setItem(TOKEN_KEY, state.token);
          localStorage.setItem(USER_KEY, JSON.stringify(state.currentUser));
          updateAuthUI();
          closeAuthModal();
          toast("✨ Đăng ký thành công! Chào mừng " + (state.currentUser.full_name || state.currentUser.username));
          await syncLocalAndCloud();
        } catch (err) {
          showAuthAlert(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
          btnText.textContent = originalText;
          submitBtn.disabled = false;
        }
      });
    }

    updateAuthUI();
    if (state.token) {
      syncLocalAndCloud();
    }

    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
