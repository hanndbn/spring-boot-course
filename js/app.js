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
  const ENROLL_KEY = "sbmastery-enrolled-modules-";
  const API_BASE_KEY = "sbmastery-api-base";
  let API_BASE = window.API_BASE_URL || localStorage.getItem(API_BASE_KEY) || (location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "http://localhost:8080/api/v1" : "");

  // ---------- State ----------
  const state = {
    view: "dashboard",        // dashboard | lesson | quiz | curriculum | user-dashboard
    currentLesson: null,      // lesson id
    currentQuizModule: null,  // module id
    completed: {},            // { lessonId: true }
    quizScores: {},           // { moduleId: {score, total} }
    enrolledModules: {},      // { moduleId: true }
    sidebarTab: "enrolled",   // "enrolled" | "all"
    pendingEnrollModule: null,
    pendingTargetLesson: null,
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
    const uid = state.currentUser ? state.currentUser.id : "guest";
    localStorage.setItem(ENROLL_KEY + uid, JSON.stringify(state.enrolledModules));
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
      const uid = state.currentUser ? state.currentUser.id : "guest";
      const rawEnroll = localStorage.getItem(ENROLL_KEY + uid);
      if (rawEnroll) {
        state.enrolledModules = JSON.parse(rawEnroll) || {};
      } else {
        state.enrolledModules = {};
      }
    } catch (e) { /* fresh */ }
  }

  function isModuleEnrolled(moduleId) {
    if (!state.currentUser) return false;
    return !!state.enrolledModules[String(moduleId)];
  }

  async function enrollModule(moduleId, silent = false) {
    const mId = String(moduleId);
    if (!state.currentUser) {
      state.pendingEnrollModule = mId;
      openAuthModal("login");
      toast("🔑 Vui lòng đăng nhập để đăng ký học giáo trình này!");
      return false;
    }
    state.enrolledModules[mId] = true;
    save();
    supabaseCall("/user_enrollments", "POST", {
      user_id: state.currentUser.id,
      module_id: mId
    }, { "Prefer": "resolution=merge-duplicates" }).catch(err => console.warn(err));

    if (!silent) {
      const mod = MODULES.find(m => String(m.id) === mId);
      const modTitle = mod ? `Module ${mod.id}: ${mod.title}` : `Module ${mId}`;
      toast(`🎉 Đã thêm <strong>${escapeHtml(modTitle)}</strong> vào danh sách học của bạn!`);
    }
    renderAll();
    return true;
  }

  async function enrollAllModules() {
    if (!state.currentUser) {
      openAuthModal("login");
      toast("🔑 Vui lòng đăng nhập để đăng ký các giáo trình!");
      return;
    }
    MODULES.forEach(m => {
      state.enrolledModules[String(m.id)] = true;
    });
    save();

    const payload = MODULES.map(m => ({
      user_id: state.currentUser.id,
      module_id: String(m.id)
    }));
    await supabaseCall("/user_enrollments", "POST", payload, { "Prefer": "resolution=merge-duplicates" }).catch(e => console.warn(e));

    toast("🎉 Chúc mừng! Bạn đã đăng ký trọn bộ 8 giáo trình Spring Boot Mastery.");
    renderAll();
  }

  async function unenrollModule(moduleId) {
    if (!state.currentUser) return;
    const mId = String(moduleId);
    const mod = MODULES.find(m => String(m.id) === mId);
    const modTitle = mod ? `Module ${mod.id}: ${mod.title}` : `Module ${mId}`;
    if (!confirm(`Bạn có chắc muốn hủy đăng ký "${modTitle}" khỏi danh sách học cá nhân?\n(Ghi chú: Lịch sử và kết quả bài học đã làm vẫn được lưu trữ an toàn)`)) {
      return;
    }
    delete state.enrolledModules[mId];
    save();

    await supabaseCall("/user_enrollments?user_id=eq." + state.currentUser.id + "&module_id=eq." + encodeURIComponent(mId), "DELETE")
      .catch(e => console.warn(e));

    toast(`ℹ️ Đã xóa ${escapeHtml(modTitle)} khỏi danh sách học.`);
    renderAll();
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

      // 2b. Lấy danh sách giáo trình đã enroll từ Supabase
      const remoteEnrolls = await supabaseCall("/user_enrollments?user_id=eq." + uid + "&select=module_id,enrolled_at");
      if (Array.isArray(remoteEnrolls)) {
        remoteEnrolls.forEach(r => {
          state.enrolledModules[String(r.module_id)] = true;
        });
      }

      // 2c. Nếu học viên đã có bài học hoàn thành hoặc điểm quiz ở module nào, tự động enroll
      MODULES.forEach(m => {
        const hasCompleted = m.lessons.some(l => state.completed[l.id]) || !!state.quizScores[m.id];
        if (hasCompleted && !state.enrolledModules[String(m.id)]) {
          state.enrolledModules[String(m.id)] = true;
          supabaseCall("/user_enrollments", "POST", { user_id: uid, module_id: String(m.id) }, { "Prefer": "resolution=merge-duplicates" }).catch(() => {});
        }
      });

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

    const codeBlock = (fence, lang) => {
      let buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(fence)) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const code = buf.join("\n");
      const esc = escapeHtml(code);
      if (lang === "mermaid") {
        return `<div class="diagram-wrapper"><div class="diagram-header"><span class="diagram-badge">📊 SƠ ĐỒ MÔ PHỎNG KIẾN TRÚC</span></div><div class="mermaid">${esc}</div></div>`;
      }
      if (lang && window.hljs) {
        try {
          return `<div class="code-block"><div class="code-block-header"><span class="cb-lang">${lang}</span><button class="cb-copy" data-code="${encodeURIComponent(code)}">Sao chép</button></div><pre><code class="language-${lang} hljs">${window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value}</code></pre></div>`;
        } catch (e) { /* fallthrough */ }
      }
      return `<div class="code-block"><div class="code-block-header"><span class="cb-lang">${lang || "code"}</span><button class="cb-copy" data-code="${encodeURIComponent(code)}">Sao chép</button></div><pre><code>${esc}</code></pre></div>`;
    };

    while (i < lines.length) {
      const line = lines[i];

      // Fenced code: support both ~~~ and ```
      if (line.startsWith("~~~") || line.startsWith("```")) {
        const fence = line.startsWith("~~~") ? "~~~" : "```";
        const lang = line.slice(3).trim();
        html += codeBlock(fence, lang);
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
        const t = title ? `<div class="callout-title">${inline(title)}</div>` : "";
        if (type === "takeaways") {
          html += `<div class="key-takeaways"><h3>🎯 Ghi nhớ bài học</h3>${inner}</div>`;
        } else {
          html += `<div class="callout ${type}"><div class="callout-icon">${icon}</div><div class="callout-body">${t}${inner}</div></div>`;
        }
        continue;
      }

      // Headings
      if (line.startsWith("###### ")) { html += `<h6>${inline(line.slice(7))}</h6>`; i++; continue; }
      if (line.startsWith("##### ")) { html += `<h5>${inline(line.slice(6))}</h5>`; i++; continue; }
      if (line.startsWith("#### ")) { html += `<h4>${inline(line.slice(5))}</h4>`; i++; continue; }
      if (line.startsWith("### ")) { html += `<h3>${inline(line.slice(4))}</h3>`; i++; continue; }
      if (line.startsWith("## ")) { html += `<h2>${inline(line.slice(3))}</h2>`; i++; continue; }
      if (line.startsWith("# ")) { html += `<h1>${inline(line.slice(2))}</h1>`; i++; continue; }

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
             !lines[i].startsWith("~~~") && !lines[i].startsWith("```") &&
             !lines[i].startsWith(":::") && !lines[i].startsWith("#") && !lines[i].trim().startsWith("|") &&
             !/^\s*[-*] /.test(lines[i]) && !/^\s*\d+\. /.test(lines[i]) &&
             !lines[i].startsWith("> ") && !/^---+$/.test(lines[i].trim())) {
        para.push(lines[i]);
        i++;
      }
      html += `<p>${inline(para.join("\n"))}</p>`;
    }

    return html;
  }

  // Inline markdown & safe HTML tag re-hydration
  function inline(s) {
    if (!s) return "";
    s = escapeHtml(s);
    // Restore safe inline tags that the author intended as HTML
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

    // Markdown formatting
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    s = s.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
    s = s.replace(/!\[([^\]]*)\]\((https?:[^)]+)\)/g,
      '<img src="$2" alt="$1" class="lesson-img" loading="lazy">');
    s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#)[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // line break inside paragraph
    s = s.replace(/\n/g, "<br>");
    return s;
  }

  // ---------- Sidebar ----------
  function renderSidebar(activeLessonId) {
    const nav = $("#sidebarNav");
    const isGuest = !state.currentUser;
    const enrolledMods = MODULES.filter((m) => isModuleEnrolled(m.id));

    let html = `
      <a class="nav-home ${state.view === "dashboard" ? "active" : ""}" data-view="dashboard">
        🏠 Tổng quan
      </a>
      <a class="nav-home ${state.view === "user-dashboard" ? "active" : ""}" data-view="user-dashboard">
        📊 Tiến độ của tôi ${enrolledMods.length > 0 ? `(${enrolledMods.length})` : ""}
      </a>
      <a class="nav-home ${state.view === "curriculum" ? "active" : ""}" data-view="curriculum">
        📚 Chương trình chi tiết
      </a>`;

    if (!isGuest) {
      html += `
        <div class="sidebar-tabs">
          <button class="s-tab ${state.sidebarTab === "enrolled" ? "active" : ""}" data-stab="enrolled">
            Đang học (${enrolledMods.length})
          </button>
          <button class="s-tab ${state.sidebarTab === "all" ? "active" : ""}" data-stab="all">
            Tất cả (${MODULES.length})
          </button>
        </div>`;
    }

    const modsToDisplay = (!isGuest && state.sidebarTab === "enrolled")
      ? enrolledMods
      : MODULES;

    if (!isGuest && state.sidebarTab === "enrolled" && enrolledMods.length === 0) {
      html += `
        <div class="sidebar-empty-hint">
          <span>Chưa có giáo trình nào trong danh sách học.</span><br>
          <a data-view="user-dashboard">👉 Khám phá &amp; Đăng ký ngay</a>
        </div>`;
    } else {
      modsToDisplay.forEach((m) => {
        const prog = moduleProgress(m);
        const hasActive = m.lessons.some((l) => l.id === activeLessonId) ||
                          (state.view === "quiz" && state.currentQuizModule === m.id);
        const open = hasActive || prog.pct > 0;
        const enrolled = isModuleEnrolled(m.id);

        html += `
        <div class="nav-module mc-${m.id} ${open ? "open" : ""} ${prog.pct === 100 ? "done" : ""}">
          <div class="nav-module-head" data-module="${m.id}">
            <span class="nm-badge" style="background: var(--mc-color)">${m.icon}</span>
            <span class="nm-title">${m.id}. ${escapeHtml(m.title)}</span>
            ${enrolled ? '<span class="nm-check">✓</span>' : isGuest ? '<span class="nm-lock-icon">🔒</span>' : '<span class="nm-badge-unenrolled">+ Enroll</span>'}
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
    }

    nav.innerHTML = html;

    $$(".s-tab", nav).forEach((tab) => {
      tab.addEventListener("click", () => {
        state.sidebarTab = tab.dataset.stab;
        renderSidebar(activeLessonId);
      });
    });
    $$(".nav-home", nav).forEach((el) =>
      el.addEventListener("click", () => gotoView(el.dataset.view)));
    $$(".sidebar-empty-hint a", nav).forEach((el) =>
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
      const enrolled = isModuleEnrolled(m.id);
      return `
      <div class="module-card mc-${m.id}" data-lesson="${firstLesson.id}" data-module="${m.id}">
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
        <div class="module-card-footer">
          ${enrolled 
            ? '<span class="mc-enrolled-pill">✓ Đã trong danh sách học</span><button class="btn btn-sm btn-primary btn-card-action" data-lesson="' + firstLesson.id + '">Vào học tiếp →</button>'
            : state.currentUser 
            ? '<span class="mc-unenrolled-pill">Chưa đăng ký</span><button class="btn btn-sm btn-secondary btn-card-enroll" data-module="' + m.id + '">+ Đăng ký học</button>'
            : '<span class="mc-unenrolled-pill">Khóa học 8 Module</span><button class="btn btn-sm btn-primary btn-card-enroll" data-module="' + m.id + '">🔒 Đăng ký học</button>'
          }
        </div>
      </div>`;
    }).join("");

    $$(".module-card", grid).forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-card-enroll")) {
          e.stopPropagation();
          enrollModule(card.dataset.module);
        } else if (e.target.closest(".btn-card-action")) {
          e.stopPropagation();
          gotoLesson(card.dataset.lesson);
        } else {
          gotoLesson(card.dataset.lesson);
        }
      });
    });
  }

  // ---------- Lesson ----------
  function renderLesson(lessonId) {
    const found = findLesson(lessonId);
    if (!found) return gotoView("dashboard");
    const { module: m, lesson } = found;
    state.currentLesson = lessonId;

    const view = $("#view-lesson");

    // Access check 1: Chưa đăng nhập
    if (!state.currentUser) {
      view.innerHTML = `
        <div class="lesson-header">
          <div class="breadcrumb">
            <a data-view="dashboard">Tổng quan</a><span class="sep">›</span>
            <span>Module ${m.id}: ${escapeHtml(m.title)}</span><span class="sep">›</span>
            <span>${escapeHtml(lesson.title)}</span>
          </div>
        </div>
        <div class="lesson-gate-container">
          <div class="lesson-gate-card">
            <div class="gate-icon-badge">🔒</div>
            <span class="gate-tag">Yêu cầu tài khoản học viên</span>
            <h2>${escapeHtml(lesson.title)}</h2>
            <p class="gate-subtitle">Module ${m.id}: ${escapeHtml(m.title)} · Thời lượng: ~${lesson.minutes || 15} phút</p>
            <div class="gate-divider"></div>
            <p class="gate-desc">
              Bạn chưa đăng nhập! Vui lòng đăng nhập hoặc tạo tài khoản để xem toàn bộ nội dung chi tiết bài học, sơ đồ tương tác, code mẫu production, lưu trữ tiến độ trên đám mây và thi trắc nghiệm.
            </p>
            <div class="gate-features">
              <div class="gate-feat-item"><span class="feat-icon">☁️</span> Đồng bộ bài học vĩnh viễn trên Supabase Cloud Database</div>
              <div class="gate-feat-item"><span class="feat-icon">🏆</span> Thi Quiz trắc nghiệm đánh giá kiến thức sau mỗi module</div>
              <div class="gate-feat-item"><span class="feat-icon">📋</span> Tự do ghi danh và quản lý lộ trình học tập cá nhân</div>
            </div>
            <div class="gate-actions">
              <button class="btn btn-primary btn-lg" id="btnGateLogin">🔑 Đăng nhập để học bài này</button>
              <button class="btn btn-secondary btn-lg" id="btnGateRegister">📝 Đăng ký tài khoản miễn phí</button>
            </div>
            <div class="gate-footer">
              <button class="btn-link" id="btnGateBack">← Quay lại danh mục giáo trình</button>
            </div>
          </div>
        </div>`;

      const btnGateLogin = $("#btnGateLogin", view);
      if (btnGateLogin) {
        btnGateLogin.addEventListener("click", () => {
          state.pendingTargetLesson = lessonId;
          state.pendingEnrollModule = String(m.id);
          openAuthModal("login");
        });
      }
      const btnGateReg = $("#btnGateRegister", view);
      if (btnGateReg) {
        btnGateReg.addEventListener("click", () => {
          state.pendingTargetLesson = lessonId;
          state.pendingEnrollModule = String(m.id);
          openAuthModal("register");
        });
      }
      const btnGateBack = $("#btnGateBack", view);
      if (btnGateBack) {
        btnGateBack.addEventListener("click", () => gotoView("dashboard"));
      }
      $$(".breadcrumb [data-view]", view).forEach((b) =>
        b.addEventListener("click", () => gotoView(b.dataset.view)));
      return;
    }

    // Access check 2: Đã đăng nhập nhưng chưa enroll module này
    if (!isModuleEnrolled(m.id)) {
      view.innerHTML = `
        <div class="lesson-header">
          <div class="breadcrumb">
            <a data-view="dashboard">Tổng quan</a><span class="sep">›</span>
            <span>Module ${m.id}: ${escapeHtml(m.title)}</span><span class="sep">›</span>
            <span>${escapeHtml(lesson.title)}</span>
          </div>
        </div>
        <div class="lesson-gate-container">
          <div class="lesson-gate-card">
            <div class="gate-icon-badge badge-enroll">📌</div>
            <span class="gate-tag tag-enroll">Chưa đăng ký giáo trình này</span>
            <h2>${escapeHtml(lesson.title)}</h2>
            <p class="gate-subtitle">Thuộc Module ${m.id}: ${escapeHtml(m.title)} (${m.lessons.length} bài học · 1 bài thi Quiz)</p>
            <div class="gate-divider"></div>
            <p class="gate-desc">
              Giáo trình này hiện chưa có trong <strong>Danh sách học của bạn</strong>.
              Hãy bấm nút bên dưới để ghi danh (hoàn toàn miễn phí) và mở khóa bài học này cùng toàn bộ các bài khác trong module!
            </p>
            <div class="gate-actions">
              <button class="btn btn-primary btn-lg" id="btnGateEnroll">🚀 Đăng ký học Module ${m.id} ngay</button>
              <button class="btn btn-ghost btn-lg" id="btnGateGoDashboard">📊 Về trang học tập của tôi</button>
            </div>
            <div class="gate-footer">
              <button class="btn-link" id="btnGateBack">← Quay lại danh mục giáo trình</button>
            </div>
          </div>
        </div>`;

      const btnGateEnroll = $("#btnGateEnroll", view);
      if (btnGateEnroll) {
        btnGateEnroll.addEventListener("click", async () => {
          await enrollModule(m.id);
          renderLesson(lessonId);
        });
      }
      const btnGateGoDash = $("#btnGateGoDashboard", view);
      if (btnGateGoDash) {
        btnGateGoDash.addEventListener("click", () => gotoView("user-dashboard"));
      }
      const btnGateBack = $("#btnGateBack", view);
      if (btnGateBack) {
        btnGateBack.addEventListener("click", () => gotoView("dashboard"));
      }
      $$(".breadcrumb [data-view]", view).forEach((b) =>
        b.addEventListener("click", () => gotoView(b.dataset.view)));
      return;
    }

    const flat = flatIndex();
    const idx = flat.findIndex((x) => x.lesson.id === lessonId);
    const prev = flat[idx - 1];
    const next = flat[idx + 1];
    const done = !!state.completed[lessonId];

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
    showView("quiz");
    const view = $("#view-quiz");

    // Access check 1: Chưa đăng nhập
    if (!state.currentUser) {
      view.innerHTML = `
        <div class="lesson-gate-container">
          <div class="lesson-gate-card">
            <div class="gate-icon-badge">🔒</div>
            <span class="gate-tag">Yêu cầu đăng nhập</span>
            <h2>Bài thi trắc nghiệm Quiz — Module ${m.id}</h2>
            <p class="gate-subtitle">${escapeHtml(m.title)} · ${quiz.questions.length} câu hỏi trắc nghiệm</p>
            <div class="gate-divider"></div>
            <p class="gate-desc">Vui lòng đăng nhập tài khoản học viên để tham gia thi Quiz, ghi nhận điểm số và xếp hạng trên hệ thống!</p>
            <div class="gate-actions">
              <button class="btn btn-primary btn-lg" id="btnQuizGateLogin">🔑 Đăng nhập ngay</button>
              <button class="btn btn-secondary btn-lg" id="btnQuizGateRegister">📝 Đăng ký tài khoản</button>
            </div>
            <div class="gate-footer">
              <button class="btn-link" id="btnQuizGateBack">← Về danh mục giáo trình</button>
            </div>
          </div>
        </div>`;
      $("#btnQuizGateLogin", view)?.addEventListener("click", () => {
        state.pendingEnrollModule = String(m.id);
        openAuthModal("login");
      });
      $("#btnQuizGateRegister", view)?.addEventListener("click", () => {
        state.pendingEnrollModule = String(m.id);
        openAuthModal("register");
      });
      $("#btnQuizGateBack", view)?.addEventListener("click", () => gotoView("dashboard"));
      return;
    }

    // Access check 2: Chưa đăng ký module
    if (!isModuleEnrolled(m.id)) {
      view.innerHTML = `
        <div class="lesson-gate-container">
          <div class="lesson-gate-card">
            <div class="gate-icon-badge badge-enroll">📌</div>
            <span class="gate-tag tag-enroll">Chưa đăng ký giáo trình này</span>
            <h2>Bài thi trắc nghiệm Quiz — Module ${m.id}</h2>
            <p class="gate-subtitle">${escapeHtml(m.title)} · ${quiz.questions.length} câu hỏi</p>
            <div class="gate-divider"></div>
            <p class="gate-desc">Bạn chưa đăng ký <strong>Module ${m.id}: ${escapeHtml(m.title)}</strong> vào danh sách học. Hãy đăng ký để mở khóa bài thi Quiz này!</p>
            <div class="gate-actions">
              <button class="btn btn-primary btn-lg" id="btnQuizGateEnroll">🚀 Đăng ký học Module ${m.id}</button>
              <button class="btn btn-ghost btn-lg" id="btnQuizGateBack">📊 Về Dashboard của tôi</button>
            </div>
          </div>
        </div>`;
      $("#btnQuizGateEnroll", view)?.addEventListener("click", async () => {
        await enrollModule(m.id);
        gotoQuiz(moduleId);
      });
      $("#btnQuizGateBack", view)?.addEventListener("click", () => gotoView("user-dashboard"));
      return;
    }

    quizState.module = m;
    quizState.quiz = quiz;
    quizState.idx = 0;
    quizState.answers = new Array(quiz.questions.length).fill(null);
    quizState.finished = false;
    state.currentQuizModule = moduleId;
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
          ${q.scenario ? `<div class="quiz-scenario"><div class="qs-label">📋 Tình huống</div><div class="qs-text">${inline(q.scenario)}</div></div>` : ""}
          <div class="quiz-question">${inline(q.q)}</div>
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
                <span>${inline(opt)}</span>
              </button>`;
            }).join("")}
          </div>
          ${chosen !== null ? `
            <div class="quiz-explain ${chosen === q.answer ? "ok" : "bad"}">
              <strong>${chosen === q.answer ? "✅ Chính xác!" : `❌ Chưa đúng — đáp án đúng là ${letters[q.answer]}.`}</strong>
              ${inline(q.explain)}
            </div>
            ${q.why ? `<div class="quiz-why"><div class="qw-title">🔍 Mổ xẻ từng phương án</div>${q.why.map((w, wi) => `
              <div class="qw-row ${wi === q.answer ? "correct" : wi === chosen ? "chosen-wrong" : ""}">
                <span class="qw-letter">${letters[wi]}</span>
                <span class="qw-text">${inline(w)}</span>
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
    bindCopyButtons(view);
  }

  function codeHtml(code, lang) {
    let highlighted = escapeHtml(code);
    if (window.hljs) {
      try { highlighted = window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value; } catch (e) {}
    }
    return `<div class="code-block"><div class="code-block-header"><span class="cb-lang">${lang}</span><button class="cb-copy" data-code="${encodeURIComponent(code)}">Sao chép</button></div><pre><code class="language-${lang} hljs">${highlighted}</code></pre></div>`;
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
        const enrolled = isModuleEnrolled(m.id);
        return `
        <div class="curr-module mc-${m.id}">
          <div class="curr-module-head">
            <div class="cm-badge">${m.icon}</div>
            <div class="cm-info">
              <div class="cm-title">Module ${m.id}: ${escapeHtml(m.title)}</div>
              <div class="cm-meta">${m.lessons.length} mục · ${m.lessons.reduce((a, l) => a + l.minutes, 0)} phút · ${p.done}/${p.total} xong</div>
            </div>
            ${enrolled ? '<span class="mc-enrolled-pill" style="margin-right:10px;">✓ Đã đăng ký</span>' : '<span class="mc-unenrolled-pill" style="margin-right:10px;">Chưa đăng ký</span>'}
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

  // ---------- User Dashboard & Detailed Progress Page ----------
  function renderUserDashboard() {
    const view = $("#view-user-dashboard");
    if (!view) return;

    const total = overallProgress();
    const scores = Object.values(state.quizScores);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length) + "%"
      : "—";

    const all = allItems();
    const doneLessonsCount = all.filter((x) => x.lesson.type !== "quiz" && state.completed[x.lesson.id]).length;
    const totalLessonsCount = all.filter((x) => x.lesson.type !== "quiz").length;
    const doneMinutes = all
      .filter((x) => state.completed[x.lesson.id])
      .reduce((acc, x) => acc + (x.lesson.minutes || 0), 0);
    const doneHours = Math.round((doneMinutes / 60) * 10) / 10;

    const enrolledMods = MODULES.filter((m) => isModuleEnrolled(m.id));
    const unenrolledMods = MODULES.filter((m) => !isModuleEnrolled(m.id));
    const completedEnrolled = enrolledMods.filter((m) => moduleProgress(m).pct === 100).length;

    const user = state.currentUser;
    const displayName = user ? (user.full_name || user.fullName || user.username) : "Khách thăm quan";
    const initial = displayName.charAt(0).toUpperCase();
    const email = user ? (user.email || "") : "";
    const roleText = user && user.role === "ROLE_ADMIN" ? "Quản trị viên (Admin)" : user ? "Học viên chính thức" : "Chưa đăng nhập";

    let html = `
      <div class="ud-container">
        <!-- Profile Header -->
        <div class="ud-profile-header ${user ? "is-logged-in" : "is-guest"}">
          <div class="ud-profile-left">
            <div class="ud-avatar">${initial}</div>
            <div class="ud-profile-meta">
              <div class="ud-name-row">
                <h2>${escapeHtml(displayName)}</h2>
                <span class="ud-badge ${user && user.role === "ROLE_ADMIN" ? "badge-admin" : "badge-user"}">${roleText}</span>
                ${user ? '<span class="ud-badge badge-cloud">☁️ Đã kết nối Supabase Cloud</span>' : '<span class="ud-badge badge-local">🔒 Hãy đăng nhập để lưu trữ tiến độ &amp; ghi danh</span>'}
              </div>
              <p class="ud-email">${escapeHtml(email || "Đăng nhập để lưu tiến độ vĩnh viễn và đăng ký học các giáo trình")}</p>
            </div>
          </div>
          <div class="ud-profile-actions">
            ${user ? `
              <button class="btn btn-secondary btn-sm" id="udBtnSync">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Đồng bộ ngay
              </button>
              <button class="btn btn-ghost btn-sm" id="udBtnLogout">Đăng xuất</button>
            ` : `
              <button class="btn btn-primary btn-sm" id="udBtnLogin">🔑 Đăng nhập / Đăng ký</button>
            `}
          </div>
        </div>

        <!-- 4 Key Stat Cards -->
        <div class="ud-stats-grid">
          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Giáo trình đã ghi danh</span>
              <span class="ud-stat-icon">🎓</span>
            </div>
            <div class="ud-stat-num">${enrolledMods.length} / ${MODULES.length}</div>
            <div class="ud-stat-sub">${completedEnrolled} giáo trình đã hoàn thành 100%</div>
          </div>

          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Tổng bài học hoàn thành</span>
              <span class="ud-stat-icon">📖</span>
            </div>
            <div class="ud-stat-num">${doneLessonsCount} / ${totalLessonsCount}</div>
            <div class="ud-stat-progress">
              <div class="ud-progress-bar"><div class="ud-progress-fill" style="width: ${total.pct}%"></div></div>
              <span>${total.pct}%</span>
            </div>
          </div>

          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Điểm Quiz trung bình</span>
              <span class="ud-stat-icon">🏆</span>
            </div>
            <div class="ud-stat-num">${avgScore}</div>
            <div class="ud-stat-sub">Đã thi ${scores.length}/${MODULES.length} module quiz</div>
          </div>

          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Thời lượng tích lũy</span>
              <span class="ud-stat-icon">⏱️</span>
            </div>
            <div class="ud-stat-num">~${doneHours}h</div>
            <div class="ud-stat-sub">Tương đương ${doneMinutes} phút học</div>
          </div>
        </div>

        <!-- Section 1: Danh sách giáo trình của tôi (Đã đăng ký) -->
        <div class="ud-section-head">
          <div class="ud-section-actions">
            <div>
              <h3>🎓 Danh sách giáo trình của tôi (${enrolledMods.length}/${MODULES.length} đã đăng ký)</h3>
              <p>Chỉ những giáo trình bạn đã ghi danh mới hiển thị và cho phép vào học ở đây.</p>
            </div>
            ${user && unenrolledMods.length > 0 ? `
              <button class="btn btn-secondary btn-sm" id="udBtnEnrollAllTop">✨ Đăng ký tất cả 8 Module</button>
            ` : ""}
          </div>
        </div>

        ${!user ? `
          <div class="ud-empty-state">
            <div class="ud-empty-icon">🔒</div>
            <h3>Vui lòng đăng nhập để xem danh sách giáo trình của bạn</h3>
            <p>Sau khi đăng nhập hoặc tạo tài khoản miễn phí, bạn có thể đăng ký các giáo trình mong muốn để lưu trữ tiến độ cá nhân.</p>
            <button class="btn btn-primary" id="udBtnLoginPrompt">🔑 Đăng nhập / Đăng ký ngay</button>
          </div>
        ` : enrolledMods.length === 0 ? `
          <div class="ud-empty-state">
            <div class="ud-empty-icon">📂</div>
            <h3>Chưa có giáo trình nào trong danh sách học của bạn</h3>
            <p>Bạn chưa ghi danh vào giáo trình nào. Hãy xem danh mục các giáo trình có sẵn bên dưới và bấm <strong>Đăng ký học</strong> để bắt đầu!</p>
            <button class="btn btn-primary" id="udBtnEnrollAllEmpty">✨ Đăng ký trọn bộ 8 Module Spring Boot</button>
          </div>
        ` : `
          <div class="ud-modules-list">
            ${enrolledMods.map((m) => {
              const p = moduleProgress(m);
              const quizScore = state.quizScores[m.id];
              const nextIncomplete = m.lessons.find((l) => !state.completed[l.id]);
              const isCompleted = p.pct === 100;
              const isStarted = p.pct > 0;
              
              let statusBadge = "";
              if (isCompleted) {
                statusBadge = '<span class="ud-mod-status done">✓ Hoàn thành 100%</span>';
              } else if (isStarted) {
                statusBadge = `<span class="ud-mod-status in-progress">⚡ Đang học (${p.pct}%)</span>`;
              } else {
                statusBadge = '<span class="ud-mod-status not-started">⏳ Chưa bắt đầu</span>';
              }

              let quizText = "";
              if (quizScore) {
                const qPct = Math.round((quizScore.score / quizScore.total) * 100);
                const qEmoji = qPct >= 80 ? "🏆" : qPct >= 50 ? "💪" : "📖";
                quizText = `<span class="ud-mod-quiz passed">${qEmoji} Quiz: ${quizScore.score}/${quizScore.total} (${qPct}%)</span>`;
              } else {
                const quizItem = m.lessons.find(l => l.type === "quiz");
                quizText = `<span class="ud-mod-quiz todo">📝 Quiz: ${quizItem && quizItem.questions ? quizItem.questions.length : 0} câu</span>`;
              }

              return `
              <div class="ud-module-card mc-${m.id} ${isCompleted ? "is-done" : isStarted ? "is-started" : ""}">
                <div class="ud-mc-header">
                  <div class="ud-mc-left">
                    <span class="ud-mc-icon">${m.icon}</span>
                    <div>
                      <div class="ud-mc-title">Module ${m.id}: ${escapeHtml(m.title)}</div>
                      <div class="ud-mc-sub">${escapeHtml(m.subtitle)}</div>
                    </div>
                  </div>
                  <div class="ud-mc-right">
                    ${statusBadge}
                    ${quizText}
                  </div>
                </div>

                <!-- Progress bar -->
                <div class="ud-mc-progress-box">
                  <div class="ud-mc-bar">
                    <div class="ud-mc-fill" style="width: ${p.pct}%"></div>
                  </div>
                  <div class="ud-mc-counts">
                    <span>${p.done}/${p.total} mục đã xong</span>
                    <span>${p.pct}%</span>
                  </div>
                </div>

                <!-- Current position & Next step -->
                <div class="ud-mc-footer">
                  <div class="ud-mc-next">
                    ${isCompleted 
                      ? '<span class="ud-next-done">🎉 Bạn đã hoàn thành toàn bộ bài học và bài thi của giáo trình này!</span>'
                      : nextIncomplete 
                      ? `<span class="ud-next-label">Bài tiếp theo cần học:</span> <strong>${nextIncomplete.type === "quiz" ? "🏆 Bài thi Quiz tổng hợp" : "📖 " + escapeHtml(nextIncomplete.title)}</strong>`
                      : ""
                    }
                  </div>
                  <div class="ud-mc-action" style="display:flex;align-items:center;gap:10px;">
                    <button class="btn-unenroll" data-unenroll="${m.id}" title="Hủy đăng ký giáo trình này">✕ Hủy đăng ký</button>
                    ${isCompleted 
                      ? `<button class="btn btn-ghost btn-sm" data-lesson-id="${m.lessons[0].id}">🔄 Ôn tập lại</button>`
                      : nextIncomplete 
                      ? `<button class="btn btn-primary btn-sm" data-lesson-id="${nextIncomplete.id}">Học tiếp →</button>`
                      : `<button class="btn btn-primary btn-sm" data-lesson-id="${m.lessons[0].id}">Bắt đầu →</button>`
                    }
                  </div>
                </div>
              </div>`;
            }).join("")}
          </div>
        `}

        <!-- Section 2: Danh mục giáo trình có thể đăng ký (Catalog) -->
        <div class="ud-catalog-section">
          <div class="ud-section-actions">
            <div>
              <h3>🌟 Danh mục giáo trình có sẵn để đăng ký (${unenrolledMods.length} giáo trình)</h3>
              <p>Khám phá các module chuyên sâu và bấm <strong>+ Đăng ký học</strong> để đưa vào danh sách học tập của bạn.</p>
            </div>
            ${user && unenrolledMods.length > 0 ? `
              <button class="btn btn-secondary btn-sm" id="udBtnEnrollRemaining">✨ Đăng ký tất cả (${unenrolledMods.length}) module còn lại</button>
            ` : ""}
          </div>

          ${unenrolledMods.length === 0 ? `
            <div class="ud-all-enrolled">
              <span>🎉 Tuyệt vời! Bạn đã đăng ký đầy đủ tất cả 8/8 giáo trình của Spring Boot Mastery. Chúc bạn học tập thật tốt!</span>
            </div>
          ` : `
            <div class="ud-catalog-grid">
              ${unenrolledMods.map((m) => {
                const lessonCount = m.lessons.filter(l => l.type === "lesson").length;
                const totalMins = m.lessons.reduce((a, l) => a + l.minutes, 0);
                return `
                <div class="ud-catalog-card mc-${m.id}">
                  <div>
                    <div class="ud-cat-top">
                      <div class="ud-cat-badge">${m.icon}</div>
                      <div>
                        <div class="ud-cat-title">Module ${m.id}: ${escapeHtml(m.title)}</div>
                        <div class="ud-cat-sub">${escapeHtml(m.subtitle)}</div>
                      </div>
                    </div>
                    <div class="ud-cat-desc">${escapeHtml(m.desc)}</div>
                    <div class="ud-cat-meta">
                      <span>📖 ${lessonCount} bài học</span>
                      <span>🏆 1 bài thi Quiz</span>
                      <span>⏱ ~${totalMins} phút</span>
                    </div>
                  </div>
                  <div class="ud-cat-footer">
                    <button class="btn btn-primary btn-sm" data-enroll-module="${m.id}">
                      + Đăng ký học giáo trình này
                    </button>
                  </div>
                </div>`;
              }).join("")}
            </div>
          `}
        </div>
      </div>
    `;

    view.innerHTML = html;

    // Event listeners
    const btnSync = $("#udBtnSync", view);
    if (btnSync) {
      btnSync.addEventListener("click", async () => {
        toast("⏳ Đang đồng bộ với Supabase...");
        await syncLocalAndCloud();
        renderUserDashboard();
        toast("☁️ Đã đồng bộ mới nhất từ Supabase!");
      });
    }

    const btnLogout = $("#udBtnLogout", view);
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        state.currentUser = null;
        state.token = null;
        state.enrolledModules = {};
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        updateAuthUI();
        renderUserDashboard();
        toast("👋 Đã đăng xuất.");
      });
    }

    const btnLogin = $("#udBtnLogin", view);
    if (btnLogin) {
      btnLogin.addEventListener("click", () => openAuthModal("login"));
    }

    const btnLoginPrompt = $("#udBtnLoginPrompt", view);
    if (btnLoginPrompt) {
      btnLoginPrompt.addEventListener("click", () => openAuthModal("login"));
    }

    const btnEnrollAllTop = $("#udBtnEnrollAllTop", view);
    if (btnEnrollAllTop) {
      btnEnrollAllTop.addEventListener("click", enrollAllModules);
    }

    const btnEnrollAllEmpty = $("#udBtnEnrollAllEmpty", view);
    if (btnEnrollAllEmpty) {
      btnEnrollAllEmpty.addEventListener("click", enrollAllModules);
    }

    const btnEnrollRemaining = $("#udBtnEnrollRemaining", view);
    if (btnEnrollRemaining) {
      btnEnrollRemaining.addEventListener("click", enrollAllModules);
    }

    $$("[data-enroll-module]", view).forEach((btn) => {
      btn.addEventListener("click", () => enrollModule(btn.dataset.enrollModule));
    });

    $$("[data-unenroll]", view).forEach((btn) => {
      btn.addEventListener("click", () => unenrollModule(btn.dataset.unenroll));
    });

    $$("[data-lesson-id]", view).forEach((btn) => {
      btn.addEventListener("click", () => gotoLesson(btn.dataset.lessonId));
    });
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
    ["dashboard", "lesson", "quiz", "curriculum", "user-dashboard"].forEach((v) => {
      const el = $("#view-" + v);
      if (el) el.hidden = v !== name;
    });
    window.scrollTo({ top: 0 });
    closeSidebar();
  }

  function gotoView(name) {
    if (name === "dashboard") { showView("dashboard"); renderAll(); }
    else if (name === "curriculum") { showView("curriculum"); renderCurriculum(); renderSidebar(null); }
    else if (name === "user-dashboard") { showView("user-dashboard"); renderUserDashboard(); renderSidebar(null); }
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
    if (state.view === "user-dashboard") renderUserDashboard();
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
      if (!state.currentUser) {
        openAuthModal("login");
        toast("🔑 Vui lòng đăng nhập để bắt đầu học!");
        return;
      }
      const enrolledMods = MODULES.filter(m => isModuleEnrolled(m.id));
      if (enrolledMods.length === 0) {
        gotoView("user-dashboard");
        toast("👉 Bạn chưa đăng ký giáo trình nào. Hãy chọn giáo trình để bắt đầu!");
        return;
      }
      for (const m of enrolledMods) {
        const nextInMod = m.lessons.find(l => !state.completed[l.id]);
        if (nextInMod) {
          gotoLesson(nextInMod.id);
          return;
        }
      }
      gotoView("user-dashboard");
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
    const btnGoUserDashboard = $("#btnGoUserDashboard");

    if (btnGoUserDashboard) {
      btnGoUserDashboard.addEventListener("click", () => {
        if (userDropdown) userDropdown.style.display = "none";
        gotoView("user-dashboard");
      });
    }

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
        state.enrolledModules = {};
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        userDropdown.style.display = "none";
        updateAuthUI();
        if (state.view === "lesson" || state.view === "quiz") {
          gotoView("dashboard");
        } else {
          renderAll();
        }
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

          if (state.pendingEnrollModule) {
            const pMod = state.pendingEnrollModule;
            state.pendingEnrollModule = null;
            await enrollModule(pMod, true);
          }
          if (state.pendingTargetLesson) {
            const pTarget = state.pendingTargetLesson;
            state.pendingTargetLesson = null;
            gotoLesson(pTarget);
            return;
          }
          renderAll();
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

          if (state.pendingEnrollModule) {
            const pMod = state.pendingEnrollModule;
            state.pendingEnrollModule = null;
            await enrollModule(pMod, true);
          }
          if (state.pendingTargetLesson) {
            const pTarget = state.pendingTargetLesson;
            state.pendingTargetLesson = null;
            gotoLesson(pTarget);
            return;
          }
          renderAll();
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
