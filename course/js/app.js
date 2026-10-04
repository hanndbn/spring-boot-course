/* =====================================================
   DevMastery — Multi-Course App Engine
   Fullstack & Cloud Native Learning Platform
   Router + Renderer + Multi-Course Architecture + Quiz Bank + Supabase Sync
   ===================================================== */
(function () {
  "use strict";

  const STORE_KEY = "sbmastery-progress-v1";
  const TOKEN_KEY = "sbmastery-jwt-token";
  const USER_KEY = "sbmastery-user-info";
  const ENROLL_KEY = "sbmastery-enrolled-modules-";
  const COURSE_ENROLL_KEY = "sbmastery-enrolled-courses-";
  const ACTIVE_COURSE_KEY = "sbmastery-active-course";
  const API_BASE_KEY = "sbmastery-api-base";
  let API_BASE = window.API_BASE_URL || localStorage.getItem(API_BASE_KEY) || (location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "http://localhost:8080/api/v1" : "");

  // ---------- Multi-Course Catalog Architecture ----------
  const COURSES = [
    {
      id: "spring-boot-mastery",
      title: "Spring Boot Mastery — Từ Zero đến Production",
      shortTitle: "Spring Boot Mastery",
      icon: "🍃",
      badge: "Backend & Microservices",
      category: "backend",
      level: "Zero to Production",
      hours: "~80h",
      modulesCount: 8,
      lessonsCount: 56,
      quizCount: 256,
      desc: "Khóa học Spring Boot 3 & Java 21 toàn diện nhất: 8 Module, 56 bài học, 256 câu quiz thực chiến, Microservices, Spring Security, Kafka, Docker & Kubernetes.",
      tags: ["Java 21", "Spring Boot 3", "JPA/Hibernate", "Spring Security", "Microservices", "Docker", "K8s"],
      isAvailable: true,
      modules: []
    },
    {
      id: "java-core-mastery",
      title: "Java Core & Clean Code Professional",
      shortTitle: "Java Core & Design Patterns",
      icon: "☕",
      badge: "Java Foundation & OOP",
      category: "backend",
      level: "Core to Advanced",
      hours: "~35h",
      modulesCount: 4,
      lessonsCount: 15,
      quizCount: 8,
      desc: "Nền tảng vững chắc với Java 21 LTS: OOP, SOLID, Design Patterns, Collection Framework, Concurrency, Virtual Threads & Clean Code.",
      tags: ["Java 21", "OOP", "SOLID", "Collections", "Virtual Threads", "Design Patterns"],
      isAvailable: true,
      modules: []
    },
    {
      id: "react-mastery",
      title: "React 19 & Next.js 15 — Fullstack Enterprise",
      shortTitle: "React 19 & Next.js 15",
      icon: "⚛️",
      badge: "Frontend & Fullstack",
      category: "frontend",
      level: "Intermediate & Advanced",
      hours: "~45h",
      modulesCount: 4,
      lessonsCount: 9,
      quizCount: 4,
      desc: "Làm chủ React 19, Server Components, Server Actions, Next.js 15 App Router, TypeScript, Zustand và Clean Architecture cho ứng dụng Enterprise.",
      tags: ["React 19", "Next.js 15", "TypeScript", "Zustand", "Tailwind CSS", "Server Actions"],
      isAvailable: true,
      modules: []
    },
    {
      id: "devops-k8s",
      title: "Cloud Native DevOps & Kubernetes Production",
      shortTitle: "DevOps & Kubernetes",
      icon: "☸️",
      badge: "DevOps & Cloud Native",
      category: "devops",
      level: "Advanced & Production",
      hours: "~50h",
      modulesCount: 4,
      lessonsCount: 8,
      quizCount: 4,
      desc: "Thực hành triển khai production: Docker containerization, Kubernetes cluster, Helm, CI/CD GitHub Actions, Prometheus, Grafana & ELK Stack.",
      tags: ["Docker", "Kubernetes", "CI/CD", "Helm", "Prometheus", "Grafana", "AWS"],
      isAvailable: true,
      modules: []
    }
  ];

  // Initialize course data from window globals
  function initializeCoursesData() {
    // 1. Spring Boot
    const sb = COURSES.find(c => c.id === "spring-boot-mastery");
    if (sb) {
      sb.modules = (window.COURSE_MODULES || []).slice().sort((a, b) => a.id - b.id);
      sb.modulesCount = sb.modules.length;
      sb.lessonsCount = sb.modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0);
      sb.quizCount = sb.modules.reduce((acc, m) => {
        const q = (m.lessons || []).find(l => l.type === "quiz");
        return acc + (q && q.questions ? q.questions.length : 0);
      }, 0);
    }

    // 2. Extra courses (Java, React, DevOps)
    if (window.EXTRA_COURSES) {
      Object.keys(window.EXTRA_COURSES).forEach(cid => {
        const src = window.EXTRA_COURSES[cid];
        const target = COURSES.find(c => c.id === cid);
        if (target && src && src.modules) {
          target.modules = src.modules;
          target.modulesCount = src.modules.length;
          target.lessonsCount = src.modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0);
          target.quizCount = src.modules.reduce((acc, m) => {
            const q = (m.lessons || []).find(l => l.type === "quiz");
            return acc + (q && q.questions ? q.questions.length : 0);
          }, 0);
        }
      });
    }
  }

  // ---------- State ----------
  const state = {
    view: "dashboard",        // dashboard | lesson | quiz | curriculum | user-dashboard | courses
    activeCourseId: localStorage.getItem(ACTIVE_COURSE_KEY) || "spring-boot-mastery",
    currentLesson: null,      // lesson id
    currentQuizModule: null,  // module id
    completed: {},            // { lessonId: true }
    quizScores: {},           // { moduleId: {score, total} }
    enrolledCourses: {},      // { [courseId]: true }
    enrolledModules: {},      // legacy support
    catalogCategory: "all",   // all | backend | frontend | devops
    catalogSearch: "",
    pendingEnrollCourse: null,
    pendingTargetLesson: null,
    searchIdx: [],
    currentUser: null,        // { id, username, email, fullName, role }
    token: null               // JWT string
  };

  // Backward-compatibility: MODULES references active course modules
  function getActiveCourse() {
    return COURSES.find(c => c.id === state.activeCourseId) || COURSES[0];
  }

  function getActiveModules() {
    return getActiveCourse().modules || [];
  }

  function getCourse(courseId) {
    return COURSES.find(c => c.id === courseId) || COURSES[0];
  }

  // ---------- Utils ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      completed: state.completed,
      quizScores: state.quizScores
    }));
    const uid = state.currentUser ? state.currentUser.id : "guest";
    localStorage.setItem(ENROLL_KEY + uid, JSON.stringify(state.enrolledModules));
    localStorage.setItem(COURSE_ENROLL_KEY + uid, JSON.stringify(state.enrolledCourses));
    localStorage.setItem(ACTIVE_COURSE_KEY, state.activeCourseId);
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
      const rawCourseEnroll = localStorage.getItem(COURSE_ENROLL_KEY + uid);
      if (rawCourseEnroll) {
        state.enrolledCourses = JSON.parse(rawCourseEnroll) || {};
      } else {
        state.enrolledCourses = {};
      }
      // Migration bridge: If user previously enrolled any module, grant Spring Boot Mastery course
      if (Object.keys(state.enrolledModules).length > 0) {
        state.enrolledCourses["spring-boot-mastery"] = true;
      }
      const savedActive = localStorage.getItem(ACTIVE_COURSE_KEY);
      if (savedActive && COURSES.some(c => c.id === savedActive)) {
        state.activeCourseId = savedActive;
      }
    } catch (e) { /* fresh */ }
  }

  // Course-level access control
  function isCourseEnrolled(courseId) {
    if (!state.currentUser) return false;
    const cId = String(courseId);
    if (state.enrolledCourses[cId]) return true;
    if (cId === "spring-boot-mastery") {
      if (Object.keys(state.enrolledModules).length > 0) return true;
      const sb = COURSES.find(c => c.id === "spring-boot-mastery");
      if (sb && (sb.modules || []).some(m => (m.lessons || []).some(l => state.completed[l.id]) || !!state.quizScores[m.id])) {
        return true;
      }
    }
    return false;
  }

  function isModuleEnrolled(moduleId) {
    return isCourseEnrolled(state.activeCourseId);
  }

  async function enrollCourse(courseId, silent = false) {
    const cId = String(courseId);
    const course = COURSES.find(c => c.id === cId) || { title: cId, shortTitle: cId };
    if (!state.currentUser) {
      state.pendingEnrollCourse = cId;
      openAuthModal("login");
      toast(`🔑 Vui lòng đăng nhập để ghi danh khóa học <strong>${escapeHtml(course.title || cId)}</strong>!`);
      return false;
    }

    state.enrolledCourses[cId] = true;
    if (cId === "spring-boot-mastery") {
      const sb = COURSES.find(c => c.id === "spring-boot-mastery");
      if (sb && sb.modules) {
        sb.modules.forEach(m => { state.enrolledModules[String(m.id)] = true; });
      }
    }
    save();

    supabaseCall("/user_enrollments", "POST", {
      user_id: state.currentUser.id,
      module_id: cId
    }, { "Prefer": "resolution=merge-duplicates" }).catch(err => console.warn(err));

    if (!silent) {
      toast(`🎉 Chúc mừng! Bạn đã ghi danh thành công khóa học <strong>${escapeHtml(course.title)}</strong>!`);
    }
    renderAll();
    return true;
  }

  async function unenrollCourse(courseId) {
    if (!state.currentUser) return;
    const cId = String(courseId);
    const course = COURSES.find(c => c.id === cId) || { title: cId };
    if (!confirm(`Bạn có chắc muốn hủy ghi danh khóa học "${course.title}" khỏi danh sách học cá nhân?\n(Lịch sử bài học đã làm vẫn được lưu trữ an toàn)`)) {
      return;
    }

    delete state.enrolledCourses[cId];
    if (cId === "spring-boot-mastery") {
      state.enrolledModules = {};
    }
    save();

    await supabaseCall("/user_enrollments?user_id=eq." + state.currentUser.id + "&module_id=eq." + encodeURIComponent(cId), "DELETE")
      .catch(e => console.warn(e));

    if (cId === "spring-boot-mastery") {
      for (let i = 0; i <= 7; i++) {
        supabaseCall("/user_enrollments?user_id=eq." + state.currentUser.id + "&module_id=eq." + i, "DELETE").catch(() => {});
      }
    }

    toast(`ℹ️ Đã hủy ghi danh khóa học "${escapeHtml(course.title)}".`);
    renderAll();
  }

  function switchCourse(courseId, targetLessonId = null) {
    const c = COURSES.find(x => x.id === courseId);
    if (!c) return;
    state.activeCourseId = c.id;
    localStorage.setItem(ACTIVE_COURSE_KEY, c.id);

    // Update Brand Text
    const brandText = $("#brandText");
    if (brandText) {
      brandText.innerHTML = `${escapeHtml(c.shortTitle)} <em>Mastery</em>`;
    }

    if (targetLessonId) {
      gotoLesson(targetLessonId);
    } else {
      gotoView("dashboard");
    }
    renderAll();
    toast(`📚 Đã chuyển sang khóa học: <strong>${escapeHtml(c.title)}</strong>`);
  }

  // Backward-compatibility aliases
  async function enrollModule(moduleId, silent = false) {
    return enrollCourse(state.activeCourseId, silent);
  }
  async function enrollAllModules() {
    return enrollCourse(state.activeCourseId);
  }
  async function unenrollModule(moduleId) {
    return unenrollCourse(state.activeCourseId);
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

      // 2b. Lấy danh sách khóa học đã ghi danh từ Supabase
      const remoteEnrolls = await supabaseCall("/user_enrollments?user_id=eq." + uid + "&select=module_id,enrolled_at");
      if (Array.isArray(remoteEnrolls)) {
        remoteEnrolls.forEach(r => {
          const mid = String(r.module_id);
          if (mid === "spring-boot-mastery" || ["0", "1", "2", "3", "4", "5", "6", "7"].includes(mid)) {
            state.enrolledCourses["spring-boot-mastery"] = true;
            const sb = COURSES.find(c => c.id === "spring-boot-mastery");
            if (sb && sb.modules) {
              sb.modules.forEach(m => { state.enrolledModules[String(m.id)] = true; });
            }
          } else {
            state.enrolledCourses[mid] = true;
          }
        });
      }

      save();
      renderAll();
    } catch (e) {
      console.warn("Sync cloud failed:", e);
    }
  }

  function syncCompleteLessonCloud(lessonId) {
    if (!state.currentUser) return;
    supabaseCall("/user_lesson_progress", "POST", {
      user_id: state.currentUser.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString()
    }, { "Prefer": "resolution=merge-duplicates" }).catch(err => console.warn(err));
  }

  function syncUncompleteLessonCloud(lessonId) {
    if (!state.currentUser) return;
    supabaseCall("/user_lesson_progress?user_id=eq." + state.currentUser.id + "&lesson_id=eq." + lessonId, "DELETE")
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

    if (state.currentUser) {
      const displayName = state.currentUser.full_name || state.currentUser.fullName || state.currentUser.username;
      authBtnText.textContent = displayName;
      authBtn.title = "Xin chào, " + displayName;
      if (dropdownAvatar) dropdownAvatar.textContent = displayName.charAt(0).toUpperCase();
      if (dropdownName) dropdownName.textContent = displayName;
      if (dropdownEmail) dropdownEmail.textContent = state.currentUser.email || "";
    } else {
      authBtnText.textContent = "Đăng nhập";
      authBtn.title = "Tài khoản học viên";
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

  // ---------- Navigation & Progress Helpers ----------
  function findLesson(id) {
    // 1. Search active course
    const active = getActiveCourse();
    for (const m of (active.modules || [])) {
      const l = (m.lessons || []).find((x) => x.id === id);
      if (l) return { course: active, module: m, lesson: l };
    }
    // 2. Search all courses
    for (const c of COURSES) {
      for (const m of (c.modules || [])) {
        const l = (m.lessons || []).find((x) => x.id === id);
        if (l) return { course: c, module: m, lesson: l };
      }
    }
    return null;
  }

  function allItems(courseId = state.activeCourseId) {
    const c = COURSES.find(x => x.id === courseId) || getActiveCourse();
    const items = [];
    (c.modules || []).forEach((m) => (m.lessons || []).forEach((l) => items.push({ course: c, module: m, lesson: l })));
    return items;
  }

  function flatIndex(courseId = state.activeCourseId) {
    const items = allItems(courseId);
    return items.filter((x) => x.lesson.type !== "quiz")
      .concat(items.filter((x) => x.lesson.type === "quiz"));
  }

  function moduleProgress(m) {
    const lessons = m.lessons || [];
    const done = lessons.filter((l) => state.completed[l.id]).length;
    return { done, total: lessons.length, pct: lessons.length ? Math.round((done / lessons.length) * 100) : 0 };
  }

  function overallProgress(courseId = state.activeCourseId) {
    const items = allItems(courseId);
    const done = items.filter((x) => state.completed[x.lesson.id]).length;
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  }

  function totalPlatformProgress() {
    let totalDone = 0;
    let totalLessons = 0;
    COURSES.forEach(c => {
      const items = allItems(c.id);
      totalLessons += items.filter(x => x.lesson.type !== "quiz").length;
      totalDone += items.filter(x => x.lesson.type !== "quiz" && state.completed[x.lesson.id]).length;
    });
    return { done: totalDone, total: totalLessons, pct: totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0 };
  }

  function toast(msg) {
    const t = $("#toast");
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  // ---------- Markdown Parser ----------
  function renderMarkdown(md) {
    if (!md) return "";
    let html = "";
    const lines = md.split("\n");
    let i = 0;

    const codeBlock = (fence, lang) => {
      let code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(fence)) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const rawCode = code.join("\n");
      const cleanLang = (lang || "java").trim().toLowerCase();
      if (cleanLang === "mermaid") {
        return `<div class="mermaid">${escapeHtml(rawCode)}</div>`;
      }
      return codeHtml(rawCode, cleanLang);
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

  function inline(s) {
    if (!s) return "";
    s = escapeHtml(s);
    // Restore safe inline tags
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

    s = s.replace(/\n/g, "<br>");
    return s;
  }

  // ---------- Sidebar ----------
  function renderSidebar(activeLessonId) {
    const nav = $("#sidebarNav");
    const activeCourse = getActiveCourse();
    const modules = getActiveModules();
    const isGuest = !state.currentUser;
    const isEnrolled = isCourseEnrolled(activeCourse.id);
    const enrolledCoursesCount = COURSES.filter(c => isCourseEnrolled(c.id)).length;

    let html = `
      <!-- Course Switcher Top Header -->
      <div class="sidebar-course-selector" id="sidebarCourseSelector">
        <div class="scs-current" id="scsCurrentBtn" title="Bấm để chuyển đổi giữa các khóa học">
          <span class="scs-icon">${activeCourse.icon}</span>
          <div class="scs-info">
            <span class="scs-label">Đang học khóa:</span>
            <span class="scs-name">${escapeHtml(activeCourse.shortTitle)}</span>
          </div>
          <span class="scs-arrow">▾</span>
        </div>
        <div class="scs-dropdown" id="scsDropdown" style="display: none;">
          <div class="scs-dropdown-title">CHỌN KHÓA HỌC:</div>
          ${COURSES.map(c => `
            <div class="scs-item ${c.id === activeCourse.id ? "active" : ""}" data-switch-course="${c.id}">
              <span class="scs-item-icon">${c.icon}</span>
              <div class="scs-item-body">
                <div class="scs-item-title">${escapeHtml(c.shortTitle)}</div>
                <div class="scs-item-sub">${c.modulesCount} Module · ${c.lessonsCount} bài</div>
              </div>
              ${c.id === activeCourse.id 
                ? '<span class="scs-active-badge">Đang mở</span>' 
                : isCourseEnrolled(c.id) 
                ? '<span class="scs-enrolled-badge">Đã ghi danh</span>' 
                : '<span class="scs-free-badge">Miễn phí</span>'
              }
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Navigation Links -->
      <a class="nav-home ${state.view === "dashboard" ? "active" : ""}" data-view="dashboard">
        🏠 Tổng quan khóa học
      </a>
      <a class="nav-home ${state.view === "courses" ? "active" : ""}" data-view="courses">
        🌟 Tất cả khóa học (Catalog)
      </a>
      <a class="nav-home ${state.view === "user-dashboard" ? "active" : ""}" data-view="user-dashboard">
        📊 Tiến độ của tôi ${enrolledCoursesCount > 0 ? `(${enrolledCoursesCount} khóa)` : ""}
      </a>
      <a class="nav-home ${state.view === "curriculum" ? "active" : ""}" data-view="curriculum">
        📚 Giáo trình chi tiết
      </a>`;

    if (!isGuest && !isEnrolled) {
      html += `
        <div class="sidebar-course-cta">
          <div class="s-cta-title">${activeCourse.icon} ${escapeHtml(activeCourse.shortTitle)}</div>
          <p class="s-cta-desc">Chưa ghi danh khóa học này</p>
          <button class="btn btn-sm btn-primary s-cta-btn" id="btnSidebarEnroll">🚀 Ghi danh khóa này</button>
        </div>`;
    }

    html += `
      <div class="sidebar-section-title">
        <span>GIÁO TRÌNH ${activeCourse.shortTitle.toUpperCase()} (${modules.length} MODULE)</span>
      </div>`;

    modules.forEach((m) => {
      const prog = moduleProgress(m);
      const hasActive = (m.lessons || []).some((l) => l.id === activeLessonId) ||
                        (state.view === "quiz" && state.currentQuizModule === m.id);
      const open = hasActive || prog.pct > 0;

      html += `
      <div class="nav-module mc-${m.id} ${open ? "open" : ""} ${prog.pct === 100 ? "done" : ""}">
        <div class="nav-module-head" data-module="${m.id}">
          <span class="nm-badge" style="background: var(--mc-color, #22c55e)">${m.icon}</span>
          <span class="nm-title">${m.id}. ${escapeHtml(m.title)}</span>
          ${isEnrolled ? (prog.pct === 100 ? '<span class="nm-check">✓</span>' : '') : '<span class="nm-lock-icon">🔒</span>'}
          <span class="nm-count">${prog.done}/${prog.total}</span>
        </div>
        <div class="nav-lessons">
          ${(m.lessons || []).map((l) => `
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

    // Course Selector interactions
    const scsCurrentBtn = $("#scsCurrentBtn", nav);
    const scsDropdown = $("#scsDropdown", nav);
    if (scsCurrentBtn && scsDropdown) {
      scsCurrentBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = scsDropdown.style.display !== "none";
        scsDropdown.style.display = isOpen ? "none" : "block";
      });
      document.addEventListener("click", () => {
        if (scsDropdown) scsDropdown.style.display = "none";
      });
    }

    $$("[data-switch-course]", nav).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (scsDropdown) scsDropdown.style.display = "none";
        switchCourse(el.dataset.switchCourse);
      });
    });

    const btnSidebarEnroll = $("#btnSidebarEnroll", nav);
    if (btnSidebarEnroll) {
      btnSidebarEnroll.addEventListener("click", () => enrollCourse(activeCourse.id));
    }
    $$(".nav-home", nav).forEach((el) =>
      el.addEventListener("click", () => gotoView(el.dataset.view)));
    $$(".nav-module-head", nav).forEach((el) =>
      el.addEventListener("click", () => el.parentElement.classList.toggle("open")));
    $$(".nav-lesson", nav).forEach((el) =>
      el.addEventListener("click", () => gotoLesson(el.dataset.lesson)));
  }

  function formatHeroTitle(title) {
    const main = (title || "").split("—")[0].trim();
    const parts = main.split(" ");
    if (parts.length <= 1) return escapeHtml(main);
    const last = parts.pop();
    return `${escapeHtml(parts.join(" "))} <span class="grad-text">${escapeHtml(last)}</span>`;
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const activeCourse = getActiveCourse();
    const modules = getActiveModules();
    const total = overallProgress();
    const items = allItems();
    const lessonsDone = items.filter((x) => x.lesson.type !== "quiz" && state.completed[x.lesson.id]).length;
    const lessonsTotal = items.filter((x) => x.lesson.type !== "quiz").length;
    const modulesDone = modules.filter((m) => moduleProgress(m).pct === 100).length;
    
    // Quiz avg for active course
    const modIds = modules.map(m => m.id);
    const scores = Object.keys(state.quizScores)
      .filter(k => modIds.includes(k) || modIds.includes(parseInt(k, 10)))
      .map(k => state.quizScores[k]);
    const avg = scores.length
      ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length) + "%"
      : "—";

    // Hero title & sub
    const view = $("#view-dashboard");
    if (!view) return;

    view.innerHTML = `
      <div class="hero">
        <div class="hero-badge">${activeCourse.icon} ${escapeHtml(activeCourse.badge)} · ${activeCourse.level}</div>
        <h1>${formatHeroTitle(activeCourse.title)}</h1>
        <p class="hero-sub">${escapeHtml(activeCourse.desc)}</p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="continueBtn">▶ Tiếp tục học</button>
          <button class="btn btn-secondary" data-view="courses">🌟 Khám phá các khóa khác</button>
          <button class="btn btn-ghost" data-view="user-dashboard">📊 Tiến độ của tôi</button>
          <button class="btn btn-ghost" data-view="curriculum">Xem giáo trình</button>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-ring-lg">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>
              <circle cx="45" cy="45" r="36" fill="none" stroke="url(#ringGrad2)" stroke-width="8" stroke-linecap="round" stroke-dasharray="226.2" stroke-dashoffset="${226.2 - (226.2 * total.pct) / 100}" id="dashRing" transform="rotate(-90 45 45)"/>
              <defs><linearGradient id="ringGrad2" x1="0" y1="0" x2="90" y2="90"><stop stop-color="#8BE36B"/><stop offset="1" stop-color="#2DD4A7"/></linearGradient></defs>
              <text x="45" y="50" text-anchor="middle" class="ring-text" id="dashRingText">${total.pct}%</text>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-num" id="statLessonsDone">${lessonsDone}/${lessonsTotal}</div>
            <div class="stat-label">Bài đã hoàn thành</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🧩</div>
          <div class="stat-info">
            <div class="stat-num" id="statModulesDone">${modulesDone}/${modules.length}</div>
            <div class="stat-label">Module đã xong</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <div class="stat-num" id="statQuizAvg">${avg}</div>
            <div class="stat-label">Điểm quiz trung bình</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <div class="stat-num">${activeCourse.hours}</div>
            <div class="stat-label">Thời lượng ước tính</div>
          </div>
        </div>
      </div>

      <h2 class="section-title">📚 Các Module Khóa Học: ${escapeHtml(activeCourse.shortTitle)}</h2>
      <div class="module-grid" id="moduleGrid"></div>
    `;

    renderDashboardStats();

    const streakEl = $("#streakSub");
    if (streakEl) {
      const quizCount = modules.reduce((acc, m) => {
        const q = (m.lessons || []).find(l => l.type === "quiz");
        return acc + (q && q.questions ? q.questions.length : 0);
      }, 0);
      streakEl.textContent = `${lessonsTotal} bài · ${modules.length} module · ${quizCount} câu quiz`;
    }

    const grid = $("#moduleGrid", view);
    const isEnrolled = isCourseEnrolled(activeCourse.id);

    grid.innerHTML = modules.map((m) => {
      const prog = moduleProgress(m);
      const firstIncomplete = (m.lessons || []).find((l) => !state.completed[l.id]) || m.lessons[0];
      const allDone = prog.pct === 100;
      const started = prog.done > 0;
      const quiz = (m.lessons || []).find((l) => l.type === "quiz");

      let statusBadge = "";
      if (allDone) {
        statusBadge = '<span class="status-badge done">✓ Hoàn thành</span>';
      } else if (started) {
        statusBadge = `<span class="status-badge in-progress">Đang học (${prog.done}/${prog.total})</span>`;
      } else {
        statusBadge = '<span class="status-badge not-started">Chưa học</span>';
      }

      const buttonLabel = allDone
        ? "Ôn tập lại"
        : started
        ? `Học tiếp: ${escapeHtml(firstIncomplete.title)}`
        : `Bắt đầu: ${escapeHtml(firstIncomplete.title)}`;

      return `
      <div class="module-card mc-${m.id} ${allDone ? "done" : ""}" data-module="${m.id}" data-lesson="${firstIncomplete ? firstIncomplete.id : ""}">
        <div class="module-card-top">
          <span class="module-card-badge">${m.icon}</span>
          <span class="module-card-num">Module ${m.id}</span>
          ${statusBadge}
        </div>
        <h3 class="module-card-title">${escapeHtml(m.title)}</h3>
        <p class="module-card-desc">${escapeHtml(m.desc || "")}</p>
        <div class="module-card-meta">
          <span>📖 ${(m.lessons || []).length} bài</span>
          <span>⏱ ~${(m.lessons || []).reduce((a, l) => a + (l.minutes || 0), 0)}p</span>
          ${quiz ? `<span>🏆 ${quiz.questions ? quiz.questions.length : 0} câu quiz</span>` : ""}
        </div>
        <div class="module-card-progress">
          <div class="mcp-bar">
            <div class="mcp-fill" style="width: ${prog.pct}%"></div>
          </div>
          <span class="mcp-pct">${prog.pct}%</span>
        </div>
        <button class="btn btn-sm ${allDone ? "btn-ghost" : "btn-primary"} module-card-btn btn-card-action">
          ${buttonLabel} →
        </button>
        <div class="module-card-footer">
          ${isEnrolled ? `
            <span class="mc-enrolled-pill">✓ Đã mở khóa toàn bộ</span>
          ` : `
            <button class="btn btn-sm btn-primary btn-card-enroll-course" style="font-size:11px;padding:3px 8px;">
              🚀 Ghi danh khóa học
            </button>
          `}
        </div>
      </div>`;
    }).join("");

    $$(".module-card", grid).forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-card-enroll-course")) {
          e.stopPropagation();
          enrollCourse(activeCourse.id);
        } else {
          gotoLesson(card.dataset.lesson);
        }
      });
    });

    $$("[data-view]", view).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        gotoView(el.dataset.view);
      });
    });

    const continueBtn = $("#continueBtn", view);
    if (continueBtn) {
      continueBtn.addEventListener("click", async () => {
        if (!state.currentUser) {
          state.pendingEnrollCourse = activeCourse.id;
          openAuthModal("login");
          return;
        }
        if (!isCourseEnrolled(activeCourse.id)) {
          await enrollCourse(activeCourse.id);
        }
        for (const m of modules) {
          const nextInMod = (m.lessons || []).find(l => !state.completed[l.id]);
          if (nextInMod) {
            gotoLesson(nextInMod.id);
            return;
          }
        }
        gotoView("user-dashboard");
      });
    }
  }

  // ---------- Dedicated Course Catalog Page ----------
  function renderCoursesCatalog() {
    const view = $("#view-courses");
    if (!view) return;

    const filtered = COURSES.filter(c => {
      if (state.catalogCategory !== "all" && c.category !== state.catalogCategory) return false;
      if (state.catalogSearch) {
        const q = state.catalogSearch.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchTags = c.tags.some(t => t.toLowerCase().includes(q));
        const matchDesc = c.desc.toLowerCase().includes(q);
        if (!matchTitle && !matchTags && !matchDesc) return false;
      }
      return true;
    });

    const enrolledCount = COURSES.filter(c => isCourseEnrolled(c.id)).length;

    let html = `
      <div class="cat-page-container">
        <!-- Catalog Hero -->
        <div class="cat-hero">
          <div class="cat-hero-badge">🎓 Hệ thống Đào tạo Fullstack &amp; Cloud Native Enterprise</div>
          <h1>Khám Phá <span class="grad-text">Tất Cả Khóa Học</span></h1>
          <p class="cat-hero-sub">
            Lộ trình đào tạo bài bản và chuyên sâu từ Java Core, Spring Boot 3 &amp; Microservices, React 19 &amp; Next.js 15 đến Cloud Native DevOps &amp; Kubernetes. Ghi danh miễn phí và bắt đầu học ngay!
          </p>

          <!-- Search & Filter Controls -->
          <div class="cat-controls">
            <div class="cat-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" id="catSearchInput" placeholder="Tìm kiếm theo tên khóa, công nghệ (Java, React, K8s, Kafka...)" value="${escapeHtml(state.catalogSearch)}">
              ${state.catalogSearch ? '<button class="cat-search-clear" id="catSearchClear">&times;</button>' : ''}
            </div>

            <div class="cat-filter-tabs">
              <button class="cat-tab ${state.catalogCategory === "all" ? "active" : ""}" data-category="all">
                Tất cả (${COURSES.length})
              </button>
              <button class="cat-tab ${state.catalogCategory === "backend" ? "active" : ""}" data-category="backend">
                🍃 Backend &amp; Java (2)
              </button>
              <button class="cat-tab ${state.catalogCategory === "frontend" ? "active" : ""}" data-category="frontend">
                ⚛️ Frontend &amp; Web (1)
              </button>
              <button class="cat-tab ${state.catalogCategory === "devops" ? "active" : ""}" data-category="devops">
                ☸️ DevOps &amp; Cloud (1)
              </button>
            </div>
          </div>
        </div>

        <!-- Course Cards Grid -->
        <div class="cat-cards-grid">
          ${filtered.map(c => {
            const enrolled = isCourseEnrolled(c.id);
            const isActive = c.id === state.activeCourseId;
            const prog = overallProgress(c.id);

            return `
            <div class="cat-card ${enrolled ? "enrolled" : ""} ${isActive ? "active-learning" : ""}">
              <div class="cat-card-header">
                <div class="cat-card-icon-box">${c.icon}</div>
                <div class="cat-card-title-box">
                  <div class="cat-card-badge-row">
                    <span class="cat-badge-cat">${c.badge}</span>
                    <span class="cat-badge-lvl">${c.level}</span>
                    ${isActive ? '<span class="cat-badge-active">⚡ Đang học</span>' : ''}
                  </div>
                  <h3 class="cat-card-title">${escapeHtml(c.title)}</h3>
                </div>
              </div>

              <p class="cat-card-desc">${escapeHtml(c.desc)}</p>

              <!-- Tags -->
              <div class="cat-card-tags">
                ${c.tags.map(t => `<span class="cat-tag">${t}</span>`).join("")}
              </div>

              <!-- Syllabus Preview -->
              <div class="cat-card-syllabus">
                <div class="ccs-head">Lộ trình ${c.modulesCount} Module:</div>
                <div class="ccs-list">
                  ${(c.modules || []).slice(0, 4).map(m => `
                    <div class="ccs-item">
                      <span class="ccs-icon">${m.icon}</span>
                      <span class="ccs-name">M${m.id}: ${escapeHtml(m.title)}</span>
                    </div>
                  `).join("")}
                  ${c.modulesCount > 4 ? `<div class="ccs-more">+ và ${c.modulesCount - 4} module chuyên sâu khác...</div>` : ''}
                </div>
              </div>

              <!-- Meta Stats -->
              <div class="cat-card-meta">
                <span>🧩 ${c.modulesCount} Module</span>
                <span>📖 ${c.lessonsCount} Bài học</span>
                <span>🏆 ${c.quizCount} Câu Quiz</span>
                <span>⏱ ${c.hours}</span>
              </div>

              <!-- Progress if enrolled -->
              ${enrolled ? `
                <div class="cat-card-progress">
                  <div class="ccp-bar"><div class="ccp-fill" style="width: ${prog.pct}%"></div></div>
                  <div class="ccp-info">
                    <span>Tiến độ học tập: ${prog.pct}%</span>
                    <span>${prog.done}/${prog.total} mục xong</span>
                  </div>
                </div>
              ` : ''}

              <!-- Actions -->
              <div class="cat-card-footer">
                ${enrolled ? `
                  <div class="cat-enrolled-actions">
                    <button class="btn btn-primary cat-btn-start" data-goto-course="${c.id}">
                      ${isActive ? "Học tiếp bài đang dở →" : "🚀 Vào học khóa này →"}
                    </button>
                    <button class="btn-unenroll-cat" data-unenroll-course="${c.id}" title="Hủy ghi danh">
                      ✕ Hủy ghi danh
                    </button>
                  </div>
                ` : `
                  <div class="cat-unenrolled-actions">
                    <span class="cat-free-tag">Miễn phí 100%</span>
                    <button class="btn btn-primary cat-btn-enroll" data-enroll-course="${c.id}">
                      📝 Ghi danh khóa học
                    </button>
                  </div>
                `}
              </div>
            </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    view.innerHTML = html;

    // Search events
    const catSearchInput = $("#catSearchInput", view);
    if (catSearchInput) {
      catSearchInput.addEventListener("input", (e) => {
        state.catalogSearch = e.target.value;
        renderCoursesCatalog();
        $("#catSearchInput")?.focus();
      });
    }

    const catSearchClear = $("#catSearchClear", view);
    if (catSearchClear) {
      catSearchClear.addEventListener("click", () => {
        state.catalogSearch = "";
        renderCoursesCatalog();
      });
    }

    // Category Tabs
    $$(".cat-tab", view).forEach(tab => {
      tab.addEventListener("click", () => {
        state.catalogCategory = tab.dataset.category;
        renderCoursesCatalog();
      });
    });

    // Action buttons
    $$("[data-enroll-course]", view).forEach(btn => {
      btn.addEventListener("click", () => enrollCourse(btn.dataset.enrollCourse));
    });

    $$("[data-unenroll-course]", view).forEach(btn => {
      btn.addEventListener("click", () => unenrollCourse(btn.dataset.unenrollCourse));
    });

    $$("[data-goto-course]", view).forEach(btn => {
      btn.addEventListener("click", () => switchCourse(btn.dataset.gotoCourse));
    });
  }

  // ---------- Lesson ----------
  function renderLesson(lessonId) {
    const found = findLesson(lessonId);
    if (!found) return gotoView("dashboard");
    const { course: c, module: m, lesson } = found;
    state.currentLesson = lessonId;

    // Auto-sync active course
    if (state.activeCourseId !== c.id) {
      state.activeCourseId = c.id;
      localStorage.setItem(ACTIVE_COURSE_KEY, c.id);
    }

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
            <p class="gate-subtitle">Thuộc khóa <strong>${escapeHtml(c.title)}</strong> · Module ${m.id}: ${escapeHtml(m.title)} · ~${lesson.minutes || 15} phút</p>
            <div class="gate-divider"></div>
            <p class="gate-desc">
              Bạn chưa đăng nhập! Vui lòng đăng nhập hoặc tạo tài khoản miễn phí để ghi danh khóa học <strong>${escapeHtml(c.title)}</strong>, mở khóa toàn bộ ${c.modulesCount} module, thực hành code, lưu tiến độ trên đám mây và thi trắc nghiệm.
            </p>
            <div class="gate-features">
              <div class="gate-feat-item"><span class="feat-icon">${c.icon}</span> Mở khóa trọn bộ ${c.modulesCount} Module và ${c.lessonsCount} bài học ${escapeHtml(c.shortTitle)}</div>
              <div class="gate-feat-item"><span class="feat-icon">☁️</span> Đồng bộ bài học vĩnh viễn trên Supabase Cloud Database</div>
              <div class="gate-feat-item"><span class="feat-icon">🏆</span> Thi Quiz trắc nghiệm đánh giá kiến thức sau mỗi module</div>
            </div>
            <div class="gate-actions">
              <button class="btn btn-primary btn-lg" id="btnGateLogin">🔑 Đăng nhập để học bài này</button>
              <button class="btn btn-secondary btn-lg" id="btnGateRegister">📝 Đăng ký tài khoản miễn phí</button>
            </div>
            <div class="gate-footer">
              <button class="btn-link" id="btnGateBack">← Quay lại danh mục khóa học</button>
            </div>
          </div>
        </div>`;

      $("#btnGateLogin", view)?.addEventListener("click", () => {
        state.pendingTargetLesson = lessonId;
        state.pendingEnrollCourse = c.id;
        openAuthModal("login");
      });
      $("#btnGateRegister", view)?.addEventListener("click", () => {
        state.pendingTargetLesson = lessonId;
        state.pendingEnrollCourse = c.id;
        openAuthModal("register");
      });
      $("#btnGateBack", view)?.addEventListener("click", () => gotoView("dashboard"));
      $$(".breadcrumb [data-view]", view).forEach((b) =>
        b.addEventListener("click", () => gotoView(b.dataset.view)));
      return;
    }

    // Access check 2: Đã đăng nhập nhưng chưa ghi danh khóa học
    if (!isCourseEnrolled(c.id)) {
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
            <div class="gate-icon-badge badge-enroll">🎓</div>
            <span class="gate-tag tag-enroll">Chưa ghi danh khóa học</span>
            <h2>${escapeHtml(lesson.title)}</h2>
            <p class="gate-subtitle">Khóa học: <strong>${escapeHtml(c.title)}</strong></p>
            <div class="gate-divider"></div>
            <p class="gate-desc">
              Bài học này nằm trong khóa học <strong>${escapeHtml(c.title)}</strong> (${c.modulesCount} Module · ${c.lessonsCount} Bài học · ${c.quizCount} Câu quiz).<br>
              Bạn chỉ cần ghi danh khóa học <strong>1 lần duy nhất</strong> (hoàn toàn miễn phí) để mở khóa toàn bộ ${c.modulesCount} module cùng ${c.lessonsCount} bài học!
            </p>
            <div class="gate-features">
              <div class="gate-feat-item"><span class="feat-icon">✨</span> Ghi danh 1 lần mở khóa toàn bộ các module (không cần đăng ký lẻ từng bài)</div>
              <div class="gate-feat-item"><span class="feat-icon">💻</span> Toàn quyền truy cập source code dự án mẫu &amp; sơ đồ kiến trúc</div>
              <div class="gate-feat-item"><span class="feat-icon">📈</span> Tự động lưu tiến độ vào Dashboard cá nhân trên Supabase Cloud</div>
            </div>
            <div class="gate-actions">
              <button class="btn btn-primary btn-lg" id="btnGateEnroll">🚀 Ghi danh khóa ${escapeHtml(c.shortTitle)} (Miễn phí)</button>
              <button class="btn btn-ghost btn-lg" id="btnGateGoDashboard">📊 Về trang học tập của tôi</button>
            </div>
            <div class="gate-footer">
              <button class="btn-link" id="btnGateBack">← Quay lại danh mục khóa học</button>
            </div>
          </div>
        </div>`;

      $("#btnGateEnroll", view)?.addEventListener("click", async () => {
        await enrollCourse(c.id);
        renderLesson(lessonId);
      });
      $("#btnGateGoDashboard", view)?.addEventListener("click", () => gotoView("user-dashboard"));
      $("#btnGateBack", view)?.addEventListener("click", () => gotoView("dashboard"));
      $$(".breadcrumb [data-view]", view).forEach((b) =>
        b.addEventListener("click", () => gotoView(b.dataset.view)));
      return;
    }

    const flat = flatIndex(c.id);
    const idx = flat.findIndex((x) => x.lesson.id === lessonId);
    const prev = flat[idx - 1];
    const next = flat[idx + 1];
    const done = !!state.completed[lessonId];

    view.innerHTML = `
      <div class="lesson-header">
        <div class="breadcrumb">
          <a data-view="dashboard">${escapeHtml(c.shortTitle)}</a><span class="sep">›</span>
          <span>Module ${m.id}: ${escapeHtml(m.title)}</span><span class="sep">›</span>
          <span>${escapeHtml(lesson.title)}</span>
        </div>
        <h1 class="lesson-title">${escapeHtml(lesson.title)}</h1>
        <div class="lesson-meta">
          <span>📖 ${lessonId}</span>
          <span>⏱ ${lesson.minutes} phút</span>
          <span>📦 Module ${m.id} — ${escapeHtml(m.title)}</span>
          <span class="ud-badge badge-user">${c.badge}</span>
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
  const quizState = { course: null, module: null, idx: 0, answers: [], finished: false };

  function gotoQuiz(moduleId) {
    const activeCourse = getActiveCourse();
    const modules = getActiveModules();
    const m = modules.find((x) => String(x.id) === String(moduleId));
    const quiz = m && (m.lessons || []).find((l) => l.type === "quiz");
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
        state.pendingEnrollCourse = activeCourse.id;
        openAuthModal("login");
      });
      $("#btnQuizGateRegister", view)?.addEventListener("click", () => {
        state.pendingEnrollCourse = activeCourse.id;
        openAuthModal("register");
      });
      $("#btnQuizGateBack", view)?.addEventListener("click", () => gotoView("dashboard"));
      return;
    }

    // Access check 2: Chưa ghi danh khóa học
    if (!isCourseEnrolled(activeCourse.id)) {
      view.innerHTML = `
        <div class="lesson-gate-container">
          <div class="lesson-gate-card">
            <div class="gate-icon-badge badge-enroll">🎓</div>
            <span class="gate-tag tag-enroll">Chưa ghi danh khóa học</span>
            <h2>Bài thi trắc nghiệm Quiz — Module ${m.id}</h2>
            <p class="gate-subtitle">Khóa học: <strong>${escapeHtml(activeCourse.title)}</strong> (${quiz.questions.length} câu hỏi)</p>
            <div class="gate-divider"></div>
            <p class="gate-desc">Bạn chưa ghi danh khóa học <strong>${escapeHtml(activeCourse.title)}</strong>. Hãy ghi danh ngay để mở khóa toàn bộ bài thi Quiz và bài học trong khóa!</p>
            <div class="gate-actions">
              <button class="btn btn-primary btn-lg" id="btnQuizGateEnroll">🚀 Ghi danh khóa ${escapeHtml(activeCourse.shortTitle)} (Miễn phí)</button>
              <button class="btn btn-ghost btn-lg" id="btnQuizGateBack">📊 Về Dashboard của tôi</button>
            </div>
            <div class="gate-footer">
              <button class="btn-link" id="btnQuizGateHome">← Quay lại danh mục khóa học</button>
            </div>
          </div>
        </div>`;
      $("#btnQuizGateEnroll", view)?.addEventListener("click", async () => {
        await enrollCourse(activeCourse.id);
        gotoQuiz(moduleId);
      });
      $("#btnQuizGateBack", view)?.addEventListener("click", () => gotoView("user-dashboard"));
      $("#btnQuizGateHome", view)?.addEventListener("click", () => gotoView("dashboard"));
      return;
    }

    quizState.course = activeCourse;
    quizState.module = m;
    quizState.quiz = quiz;
    quizState.idx = 0;
    quizState.answers = new Array(quiz.questions.length).fill(null);
    quizState.finished = false;
    state.currentQuizModule = moduleId;
    renderQuiz();
  }

  function renderQuiz() {
    const { quiz, idx, answers, course } = quizState;
    const view = $("#view-quiz");
    const total = quiz.questions.length;
    const scoreKey = quizState.course.id === "spring-boot-mastery" 
      ? quizState.module.id 
      : `${quizState.course.id}-${quizState.module.id}`;

    if (quizState.finished) {
      const score = answers.filter((a, i) => a === quiz.questions[i].answer).length;
      state.quizScores[scoreKey] = { score, total };
      state.completed[quiz.id] = true;
      save();
      syncQuizCloud(scoreKey, score, total);
      syncCompleteLessonCloud(quiz.id);
      const pct = Math.round((score / total) * 100);
      const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📖";
      const msg = pct >= 80
        ? "Xuất sắc! Bạn đã nắm vững toàn bộ kiến thức chuyên sâu của module này. Tiếp tục phát huy!"
        : pct >= 50
        ? "Khá ổn! Hãy xem lại các câu sai ở phần phân tích chi tiết bên dưới rồi thi lại để đạt điểm tối đa nhé."
        : "Đừng nản — hãy đọc lại bài học, mọi giải thích chi tiết đều có ở phần xem lại đáp án. Bạn làm được!";

      const flat = flatIndex(course.id);
      const qIdx = flat.findIndex((x) => x.lesson.id === quiz.id);
      const next = flat[qIdx + 1];

      view.innerHTML = `
        <div class="quiz-wrap">
          <div class="quiz-result">
            <div class="qr-emoji">${emoji}</div>
            <div class="qr-score">${score}<span class="qr-total">/${total}</span></div>
            <div style="font-weight:700;font-size:16px;color:var(--text-2);margin-bottom:8px;">${pct}% câu trả lời chính xác</div>
            <p class="qr-msg">${msg}</p>
            <div class="qr-actions">
              <button class="btn btn-ghost" id="retryQuiz">🔄 Thi lại Quiz</button>
              ${next ? `<button class="btn btn-primary" id="nextAfterQuiz">Tiếp tục: ${escapeHtml(next.lesson.title)} →</button>`
                     : `<button class="btn btn-primary" data-view="dashboard">Về tổng quan khóa học 🎉</button>`}
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
    const answeredCount = answers.filter(a => a !== null).length;

    view.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="q-badge">🏆 ${escapeHtml(quiz.title)} · ${escapeHtml(course.shortTitle)}</div>
          <h2>Câu hỏi ${idx + 1} / ${total}</h2>
          <p>Đã trả lời: <strong>${answeredCount}/${total}</strong> câu · Chọn đáp án rồi bấm Tiếp để xem giải thích.</p>
        </div>

        <!-- Question Navigator Grid (Interactive 30-50 questions) -->
        <div class="quiz-nav-container">
          <div class="qnc-title">BẢNG ĐIỀU HƯỚNG CÂU HỎI (${total} CÂU):</div>
          <div class="quiz-nav-grid">
            ${quiz.questions.map((_, i) => {
              const isCurrent = i === idx;
              const isAnswered = answers[i] !== null;
              const isCorrect = isAnswered && answers[i] === quiz.questions[i].answer;
              let cls = "qn-btn";
              if (isCurrent) cls += " current";
              if (isAnswered) cls += (isCorrect ? " correct" : " wrong");
              return `<button class="${cls}" data-jump-q="${i}" title="Câu ${i + 1}">${i + 1}</button>`;
            }).join("")}
          </div>
        </div>

        <div class="quiz-card">
          <div class="quiz-qnum">
            <span>Câu hỏi ${idx + 1} / ${total}</span>
            ${q.level ? `<span class="q-level ${q.level}">${q.level === "hard" ? "🔥 Khó / Senior" : q.level === "medium" ? "⚡ Vừa / Thực chiến" : "🎯 Cơ bản"}</span>` : ""}
          </div>
          ${q.scenario ? `<div class="quiz-scenario"><div class="qs-label">📋 Tình huống thực tế</div><div class="qs-text">${inline(q.scenario)}</div></div>` : ""}
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
            ${chosen === null ? "Xác nhận →" : idx === total - 1 ? "Xem kết quả 🏁" : "Câu tiếp →"}
          </button>
        </div>
      </div>`;

    // Jump to specific question
    $$("[data-jump-q]", view).forEach(btn => {
      btn.addEventListener("click", () => {
        quizState.idx = parseInt(btn.dataset.jumpQ, 10);
        renderQuiz();
      });
    });

    $$(".quiz-opt", view).forEach((b) =>
      b.addEventListener("click", () => {
        if (answers[idx] !== null) return;
        answers[idx] = parseInt(b.dataset.opt, 10);
        if (idx === total - 1 && answers.every(a => a !== null)) {
          quizState.finished = true;
        }
        renderQuiz();
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
    const activeCourse = getActiveCourse();
    const modules = getActiveModules();
    const isEnrolled = isCourseEnrolled(activeCourse.id);

    view.innerHTML = `
      <div class="curr-intro">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h2>📚 Giáo trình: ${escapeHtml(activeCourse.title)}</h2>
            <p>${modules.length} module · ${allItems().length} bài học + quiz · ${activeCourse.hours} — click từng bài để bắt đầu học ngay.</p>
          </div>
          ${isEnrolled ? `
            <span class="mc-enrolled-pill" style="font-size:13px;padding:6px 12px;">✓ Đã ghi danh khóa học</span>
          ` : `
            <button class="btn btn-primary btn-sm" id="btnCurrEnrollCourse">🚀 Ghi danh khóa học (Miễn phí)</button>
          `}
        </div>
      </div>
      ${modules.map((m) => {
        const p = moduleProgress(m);
        return `
        <div class="curr-module mc-${m.id}">
          <div class="curr-module-head">
            <div class="cm-badge">${m.icon}</div>
            <div class="cm-info">
              <div class="cm-title">Module ${m.id}: ${escapeHtml(m.title)}</div>
              <div class="cm-meta">${(m.lessons || []).length} mục · ${(m.lessons || []).reduce((a, l) => a + (l.minutes || 0), 0)} phút · ${p.done}/${p.total} xong</div>
            </div>
            ${isEnrolled ? '<span class="mc-enrolled-pill" style="margin-right:10px;">✓ Đã mở khóa</span>' : '<span class="mc-unenrolled-pill" style="margin-right:10px;">🔒 Chưa ghi danh</span>'}
            <svg class="cm-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div class="curr-lessons">
            ${(m.lessons || []).map((l) => `
              <div class="curr-lesson ${state.completed[l.id] ? "done" : ""}" data-lesson="${l.id}">
                <span class="cl-check">✓</span>
                <span class="cl-title">${escapeHtml(l.title)}</span>
                <span class="cl-type ${l.type}">${l.type === "quiz" ? "Quiz" : l.minutes >= 100 ? "Project" : "Bài học"}</span>
                <span class="cl-mins">${l.minutes} phút</span>
              </div>`).join("")}
          </div>
        </div>`;
      }).join("")}`;

    $("#btnCurrEnrollCourse", view)?.addEventListener("click", () => enrollCourse(activeCourse.id));
    $$(".curr-module-head", view).forEach((h) =>
      h.addEventListener("click", () => h.parentElement.classList.toggle("open")));
    $$(".curr-lesson", view).forEach((el) =>
      el.addEventListener("click", () => gotoLesson(el.dataset.lesson)));
  }

  // ---------- User Dashboard & Personal Progress Page ----------
  function renderUserDashboard() {
    const view = $("#view-user-dashboard");
    if (!view) return;

    const scores = Object.values(state.quizScores);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length) + "%"
      : "—";

    const enrolledCourses = COURSES.filter((c) => isCourseEnrolled(c.id));
    const platProg = totalPlatformProgress();
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
              <p class="ud-email">${escapeHtml(email || "Đăng nhập để lưu tiến độ vĩnh viễn và đăng ký các khóa học")}</p>
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
              <span class="ud-stat-title">Khóa học đã ghi danh</span>
              <span class="ud-stat-icon">🎓</span>
            </div>
            <div class="ud-stat-num">${enrolledCourses.length} / ${COURSES.length}</div>
            <div class="ud-stat-sub">Đang theo học ${enrolledCourses.length} lộ trình chuyên sâu</div>
          </div>

          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Tổng bài học hoàn thành</span>
              <span class="ud-stat-icon">📖</span>
            </div>
            <div class="ud-stat-num">${platProg.done} / ${platProg.total}</div>
            <div class="ud-stat-progress">
              <div class="ud-progress-bar"><div class="ud-progress-fill" style="width: ${platProg.pct}%"></div></div>
              <span>${platProg.pct}%</span>
            </div>
          </div>

          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Điểm Quiz trung bình</span>
              <span class="ud-stat-icon">🏆</span>
            </div>
            <div class="ud-stat-num">${avgScore}</div>
            <div class="ud-stat-sub">Đã thi ${scores.length} bài thi module</div>
          </div>

          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Lộ trình Platform</span>
              <span class="ud-stat-icon">🚀</span>
            </div>
            <div class="ud-stat-num">4 Khóa</div>
            <div class="ud-stat-sub">Java, Spring Boot, React, Kubernetes</div>
          </div>
        </div>

        <!-- Section 1: Khóa học đã ghi danh của tôi -->
        <div class="ud-section-head">
          <div class="ud-section-actions">
            <div>
              <h3>🎓 Khóa học đã ghi danh của tôi (${enrolledCourses.length}/${COURSES.length} khóa)</h3>
              <p>Toàn bộ các khóa học bạn đã đăng ký kèm tiến độ học tập chi tiết.</p>
            </div>
            <button class="btn btn-secondary btn-sm" data-view="courses">🌟 Khám phá thêm khóa học</button>
          </div>
        </div>

        ${!user ? `
          <div class="ud-empty-state">
            <div class="ud-empty-icon">🔒</div>
            <h3>Vui lòng đăng nhập để xem các khóa học của bạn</h3>
            <p>Sau khi đăng nhập hoặc tạo tài khoản miễn phí, bạn có thể ghi danh các khóa học mong muốn và theo dõi tiến độ học tập trên mọi thiết bị.</p>
            <button class="btn btn-primary" id="udBtnLoginPrompt">🔑 Đăng nhập / Đăng ký ngay</button>
          </div>
        ` : enrolledCourses.length === 0 ? `
          <div class="ud-empty-state">
            <div class="ud-empty-icon">📂</div>
            <h3>Chưa có khóa học nào trong danh sách học của bạn</h3>
            <p>Bạn chưa ghi danh vào khóa học nào. Hãy khám phá danh mục các khóa học bên dưới và bấm <strong>Ghi danh khóa học</strong> để bắt đầu!</p>
            <button class="btn btn-primary" id="udBtnEnrollSbEmpty">🚀 Ghi danh khóa Spring Boot Mastery (Miễn phí)</button>
          </div>
        ` : `
          <div class="ud-courses-list">
            ${enrolledCourses.map((c) => {
              const cProg = overallProgress(c.id);
              const cItems = allItems(c.id);
              const nextIncomplete = cItems.find(x => !state.completed[x.lesson.id]);
              const isActive = c.id === state.activeCourseId;

              return `
              <div class="ud-course-card ${isActive ? "active-learning" : ""}">
                <div class="ud-course-header">
                  <div class="ud-course-left">
                    <span class="ud-course-icon">${c.icon}</span>
                    <div>
                      <div class="ud-course-title">
                        ${escapeHtml(c.title)}
                        ${isActive ? '<span class="cat-badge-active" style="margin-left:8px;">⚡ Đang học</span>' : ''}
                      </div>
                      <div class="ud-course-meta">
                        <span>🧩 ${c.modulesCount} Module</span>
                        <span>📖 ${c.lessonsCount} Bài học</span>
                        <span>🏆 ${c.quizCount} Câu Quiz</span>
                        <span>⏱ ${c.hours}</span>
                        <span class="ud-badge badge-user">${c.badge}</span>
                      </div>
                    </div>
                  </div>
                  <div class="ud-course-right">
                    ${cProg.pct === 100 
                      ? '<span class="ud-mod-status done">🏆 Hoàn thành 100%</span>' 
                      : cProg.pct > 0 
                      ? `<span class="ud-mod-status in-progress">⚡ Đang học (${cProg.pct}%)</span>` 
                      : '<span class="ud-mod-status not-started">⏳ Chưa bắt đầu</span>'
                    }
                  </div>
                </div>

                <div class="ud-course-desc">${escapeHtml(c.desc)}</div>

                <!-- Progress Bar -->
                <div class="ud-course-progress-box">
                  <div class="ud-course-bar">
                    <div class="ud-course-fill" style="width: ${cProg.pct}%"></div>
                  </div>
                  <div class="ud-course-counts">
                    <span>${cProg.done}/${cProg.total} bài học hoàn thành</span>
                    <span>${cProg.pct}%</span>
                  </div>
                </div>

                <!-- Mini Modules Tracker -->
                <div class="ud-mini-modules">
                  ${(c.modules || []).map((m) => {
                    const p = moduleProgress(m);
                    const cls = p.pct === 100 ? "done" : p.pct > 0 ? "in-progress" : "";
                    const firstL = m.lessons && m.lessons[0];
                    return `<div class="ud-mini-chip ${cls}" data-goto-lesson="${firstL ? firstL.id : ""}" title="Module ${m.id}: ${escapeHtml(m.title)} (${p.done}/${p.total})">
                      M${m.id}: ${p.done}/${p.total} ${p.pct === 100 ? '✓' : ''}
                    </div>`;
                  }).join("")}
                </div>

                <!-- Next Step & Actions -->
                <div class="ud-course-footer">
                  <div class="ud-course-next">
                    ${cProg.pct === 100
                      ? '<span class="ud-next-done">🎉 Bạn đã hoàn thành toàn bộ khóa học này!</span>'
                      : nextIncomplete
                      ? `<span class="ud-next-label">Bài tiếp theo:</span> <strong>${escapeHtml(nextIncomplete.lesson.title)}</strong>`
                      : ""
                    }
                  </div>
                  <div class="ud-course-actions">
                    <button class="btn-unenroll" data-unenroll-course="${c.id}" title="Hủy ghi danh">✕ Hủy ghi danh</button>
                    <button class="btn btn-ghost btn-sm" data-switch-curriculum="${c.id}">📚 Xem giáo trình</button>
                    <button class="btn btn-primary btn-sm" data-switch-course="${c.id}" data-target-lesson="${nextIncomplete ? nextIncomplete.lesson.id : (cItems[0] ? cItems[0].lesson.id : '')}">
                      ${isActive ? "Học tiếp bài này →" : "🚀 Vào học khóa này →"}
                    </button>
                  </div>
                </div>
              </div>`;
            }).join("")}
          </div>
        `}

        <!-- Section 2: Khám phá tất cả khóa học (Course Catalog) -->
        <div class="ud-catalog-section">
          <div class="ud-section-actions">
            <div>
              <h3>🌟 Khám phá tất cả khóa học trên nền tảng (${COURSES.length} khóa học)</h3>
              <p>Ghi danh các khóa học chuyên sâu từ Backend, Frontend đến DevOps để hoàn thiện bộ kỹ năng Fullstack Enterprise.</p>
            </div>
            <button class="btn btn-secondary btn-sm" data-view="courses">Xem trang Catalog đầy đủ →</button>
          </div>

          <div class="ud-catalog-grid">
            ${COURSES.map((c) => {
              const enrolled = isCourseEnrolled(c.id);
              const isActive = c.id === state.activeCourseId;
              return `
              <div class="ud-catalog-card ${enrolled ? "enrolled-card" : ""}">
                <div>
                  <div class="ud-cat-top">
                    <div class="ud-cat-badge">${c.icon}</div>
                    <div>
                      <div class="ud-cat-title">${escapeHtml(c.title)}</div>
                      <div class="ud-cat-sub">${escapeHtml(c.badge)} · ${c.level}</div>
                    </div>
                  </div>
                  <div class="ud-cat-desc">${escapeHtml(c.desc)}</div>
                  <div class="ud-tags-row">
                    ${c.tags.map(t => `<span class="ud-tag">${t}</span>`).join("")}
                  </div>
                  <div class="ud-cat-meta">
                    <span>🧩 ${c.modulesCount} Module</span>
                    <span>📖 ${c.lessonsCount} Bài học</span>
                    <span>🏆 ${c.quizCount} Quiz</span>
                    <span>⏱ ${c.hours}</span>
                  </div>
                </div>
                <div class="ud-cat-footer">
                  ${enrolled ? `
                    <span class="mc-enrolled-pill">✓ Đã trong danh sách học</span>
                    <button class="btn btn-primary btn-sm" data-switch-course="${c.id}">
                      ${isActive ? "Đang học khóa này →" : "Vào học ngay →"}
                    </button>
                  ` : `
                    <span class="mc-unenrolled-pill">Miễn phí 100%</span>
                    <button class="btn btn-primary btn-sm" data-enroll-course="${c.id}">
                      🚀 Ghi danh khóa học
                    </button>
                  `}
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    view.innerHTML = html;

    // Listeners
    $("#udBtnSync", view)?.addEventListener("click", async () => {
      toast("⏳ Đang đồng bộ với Supabase...");
      await syncLocalAndCloud();
      renderUserDashboard();
      toast("☁️ Đã đồng bộ mới nhất từ Supabase!");
    });

    $("#udBtnLogout", view)?.addEventListener("click", () => {
      state.currentUser = null;
      state.token = null;
      state.enrolledModules = {};
      state.enrolledCourses = {};
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      updateAuthUI();
      renderUserDashboard();
      toast("👋 Đã đăng xuất.");
    });

    $("#udBtnLogin", view)?.addEventListener("click", () => openAuthModal("login"));
    $("#udBtnLoginPrompt", view)?.addEventListener("click", () => openAuthModal("login"));
    $("#udBtnEnrollSbEmpty", view)?.addEventListener("click", () => enrollCourse("spring-boot-mastery"));

    $$("[data-enroll-course]", view).forEach((btn) => {
      btn.addEventListener("click", () => enrollCourse(btn.dataset.enrollCourse));
    });

    $$("[data-unenroll-course]", view).forEach((btn) => {
      btn.addEventListener("click", () => unenrollCourse(btn.dataset.unenrollCourse));
    });

    $$("[data-switch-course]", view).forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetLesson = btn.dataset.targetLesson;
        switchCourse(btn.dataset.switchCourse, targetLesson || null);
      });
    });

    $$("[data-switch-curriculum]", view).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeCourseId = btn.dataset.switchCurriculum;
        localStorage.setItem(ACTIVE_COURSE_KEY, state.activeCourseId);
        gotoView("curriculum");
      });
    });

    $$("[data-goto-lesson]", view).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.gotoLesson) gotoLesson(btn.dataset.gotoLesson);
      });
    });

    $$("[data-view]", view).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        gotoView(el.dataset.view);
      });
    });
  }

  // ---------- Search ----------
  function buildSearchIndex() {
    state.searchIdx = [];
    COURSES.forEach(c => {
      (c.modules || []).forEach((m) => (m.lessons || []).forEach((l) => {
        if (l.type === "quiz") {
          (l.questions || []).forEach((q, i) =>
            state.searchIdx.push({
              title: `Quiz: ${q.q.slice(0, 60)}...`,
              snippet: `${c.shortTitle} · M${m.id} · Câu ${i + 1}`,
              target: l.id,
              courseId: c.id
            })
          );
        } else {
          state.searchIdx.push({
            title: l.title,
            snippet: `${c.shortTitle} · Module ${m.id}: ${m.title}`,
            target: l.id,
            courseId: c.id
          });
        }
      }));
    });
  }

  function doSearch(q) {
    const box = $("#searchResults");
    if (!q || q.trim().length < 2) {
      box.classList.remove("open");
      box.innerHTML = "";
      return;
    }
    const needle = q.toLowerCase();
    const hits = state.searchIdx
      .filter((x) => x.title.toLowerCase().includes(needle) || x.snippet.toLowerCase().includes(needle))
      .slice(0, 8);

    if (hits.length === 0) {
      box.innerHTML = `<div class="search-empty">Không tìm thấy bài học nào phù hợp</div>`;
    } else {
      box.innerHTML = hits
        .map((h) => `
          <div class="search-item" data-target="${h.target}" data-course="${h.courseId || ""}">
            <div class="si-title">${escapeHtml(h.title)}</div>
            <div class="si-mod">${escapeHtml(h.snippet)}</div>
          </div>`)
        .join("");

      $$(".search-item", box).forEach((el) =>
        el.addEventListener("click", () => {
          box.classList.remove("open");
          $("#searchInput").value = "";
          if (el.dataset.course) {
            state.activeCourseId = el.dataset.course;
          }
          gotoLesson(el.dataset.target);
        }));
    }
    box.classList.add("open");
  }

  // ---------- Router ----------
  function showView(name) {
    state.view = name;
    ["dashboard", "lesson", "quiz", "curriculum", "user-dashboard", "courses"].forEach((v) => {
      const el = $("#view-" + v);
      if (el) el.hidden = v !== name;
    });
    window.scrollTo({ top: 0 });
    closeSidebar();
  }

  function gotoView(name) {
    if (name === "dashboard") { showView("dashboard"); renderAll(); }
    else if (name === "courses") { showView("courses"); renderCoursesCatalog(); renderSidebar(null); }
    else if (name === "curriculum") { showView("curriculum"); renderCurriculum(); renderSidebar(null); }
    else if (name === "user-dashboard") { showView("user-dashboard"); renderUserDashboard(); renderSidebar(null); }
  }

  function gotoLesson(id) {
    const found = findLesson(id);
    if (!found) return;
    if (found.course && state.activeCourseId !== found.course.id) {
      state.activeCourseId = found.course.id;
      localStorage.setItem(ACTIVE_COURSE_KEY, found.course.id);
    }
    if (found.lesson.type === "quiz") return gotoQuiz(found.module.id);
    showView("lesson");
    renderLesson(id);
    renderSidebar(id);
    renderDashboardStats();
  }

  function renderDashboardStats() {
    const total = overallProgress();
    const pctEl = $("#headerProgressPct");
    if (pctEl) pctEl.textContent = total.pct + "%";
    const ring = $("#headerRing");
    if (ring) {
      const HCIRC = 100.5;
      ring.style.strokeDashoffset = HCIRC - (HCIRC * total.pct) / 100;
    }
  }

  function renderAll() {
    renderSidebar(state.currentLesson);
    renderDashboard();
    if (state.view === "courses") renderCoursesCatalog();
    if (state.view === "curriculum") renderCurriculum();
    if (state.view === "user-dashboard") renderUserDashboard();
    renderDashboardStats();
  }

  // ---------- Sidebar mobile ----------
  function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#backdrop").classList.remove("show");
  }

  // ---------- Init ----------
  function init() {
    initializeCoursesData();
    load();
    buildSearchIndex();

    // Brand title update
    const activeCourse = getActiveCourse();
    const brandText = $("#brandText");
    if (brandText) {
      brandText.innerHTML = `${escapeHtml(activeCourse.shortTitle)} <em>Mastery</em>`;
    }

    $("#menuToggle").addEventListener("click", () => {
      $("#sidebar").classList.toggle("open");
      $("#backdrop").classList.toggle("show");
    });
    $("#backdrop").addEventListener("click", closeSidebar);

    // Header Catalog Button
    $("#btnHeaderCatalog")?.addEventListener("click", (e) => {
      e.preventDefault();
      gotoView("courses");
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
      if (!e.target.closest(".search-box")) {
        $("#searchResults").classList.remove("open");
      }
    });

    $("#resetProgress").addEventListener("click", () => {
      if (confirm("Bạn có chắc muốn xóa toàn bộ tiến độ học và điểm quiz trên trình duyệt này không?")) {
        state.completed = {};
        state.quizScores = {};
        save();
        renderAll();
        toast("🗑️ Đã xóa tiến độ!");
      }
    });

    // Auth events
    $("#authBtn").addEventListener("click", () => {
      if (state.currentUser) {
        const dd = $("#userDropdown");
        dd.style.display = dd.style.display === "none" ? "block" : "none";
      } else {
        openAuthModal("login");
      }
    });

    document.addEventListener("click", (e) => {
      const wrapper = $("#userMenuWrapper");
      if (wrapper && !wrapper.contains(e.target)) {
        const dd = $("#userDropdown");
        if (dd) dd.style.display = "none";
      }
    });

    $("#tabLogin")?.addEventListener("click", () => openAuthModal("login"));
    $("#tabRegister")?.addEventListener("click", () => openAuthModal("register"));
    $("#modalClose")?.addEventListener("click", closeAuthModal);
    $("#authModalBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "authModalBackdrop") closeAuthModal();
    });

    $("#loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const u = $("#loginUsername").value.trim();
      const p = $("#loginPassword").value;
      const btn = $("#btnLoginSubmit");
      const btnText = btn.querySelector(".btn-text");

      try {
        btn.disabled = true;
        btnText.textContent = "Đang đăng nhập...";
        hideAuthAlert();

        const passHash = await hashPassword(p);
        const users = await supabaseCall("/users?or=(username.eq." + encodeURIComponent(u) + ",email.eq." + encodeURIComponent(u) + ")&password_hash.eq." + passHash + "&select=*");

        if (!users || users.length === 0) {
          throw new Error("Sai tên đăng nhập hoặc mật khẩu! Vui lòng kiểm tra lại.");
        }

        const user = users[0];
        state.currentUser = user;
        state.token = "sb_jwt_" + user.id + "_" + Date.now();
        localStorage.setItem(TOKEN_KEY, state.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        showAuthAlert("Đăng nhập thành công!", false);
        toast(`👋 Chào mừng bạn trở lại, <strong>${escapeHtml(user.full_name || user.username)}</strong>!`);

        await syncLocalAndCloud();
        updateAuthUI();

        setTimeout(() => {
          closeAuthModal();
          btn.disabled = false;
          btnText.textContent = "Đăng Nhập";

          if (state.pendingEnrollCourse) {
            enrollCourse(state.pendingEnrollCourse);
            state.pendingEnrollCourse = null;
          }
          if (state.pendingTargetLesson) {
            gotoLesson(state.pendingTargetLesson);
            state.pendingTargetLesson = null;
          }
        }, 500);
      } catch (err) {
        showAuthAlert(err.message || "Đăng nhập thất bại.");
        btn.disabled = false;
        btnText.textContent = "Đăng Nhập";
      }
    });

    $("#registerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = $("#regFullName").value.trim();
      const u = $("#regUsername").value.trim();
      const em = $("#regEmail").value.trim();
      const p = $("#regPassword").value;
      const btn = $("#btnRegisterSubmit");
      const btnText = btn.querySelector(".btn-text");

      try {
        btn.disabled = true;
        btnText.textContent = "Đang tạo tài khoản...";
        hideAuthAlert();

        if (p.length < 6) throw new Error("Mật khẩu phải có tối thiểu 6 ký tự!");
        if (u.length < 3) throw new Error("Tên đăng nhập phải có ít nhất 3 ký tự!");

        const exist = await supabaseCall("/users?or=(username.eq." + encodeURIComponent(u) + ",email.eq." + encodeURIComponent(em) + ")&select=id");
        if (exist && exist.length > 0) {
          throw new Error("Username hoặc Email này đã tồn tại trong hệ thống!");
        }

        const passHash = await hashPassword(p);
        const newUser = {
          username: u,
          email: em,
          password_hash: passHash,
          full_name: fullName || u,
          role: "ROLE_USER"
        };

        const created = await supabaseCall("/users", "POST", newUser, { "Prefer": "return=representation" });
        const user = Array.isArray(created) ? created[0] : (created || newUser);

        state.currentUser = user;
        state.token = "sb_jwt_" + (user.id || u) + "_" + Date.now();
        localStorage.setItem(TOKEN_KEY, state.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        showAuthAlert("Tạo tài khoản thành công!", false);
        toast(`🎉 Chúc mừng bạn đã đăng ký tài khoản thành công!`);

        await syncLocalAndCloud();
        updateAuthUI();

        setTimeout(() => {
          closeAuthModal();
          btn.disabled = false;
          btnText.textContent = "Tạo Tài Khoản";

          if (state.pendingEnrollCourse) {
            enrollCourse(state.pendingEnrollCourse);
            state.pendingEnrollCourse = null;
          }
          if (state.pendingTargetLesson) {
            gotoLesson(state.pendingTargetLesson);
            state.pendingTargetLesson = null;
          }
        }, 600);
      } catch (err) {
        showAuthAlert(err.message || "Đăng ký thất bại.");
        btn.disabled = false;
        btnText.textContent = "Tạo Tài Khoản";
      }
    });

    $("#btnLogout")?.addEventListener("click", () => {
      state.currentUser = null;
      state.token = null;
      state.enrolledModules = {};
      state.enrolledCourses = {};
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      updateAuthUI();
      renderAll();
      toast("👋 Đã đăng xuất.");
    });

    $("#btnGoUserDashboard")?.addEventListener("click", () => {
      const dd = $("#userDropdown");
      if (dd) dd.style.display = "none";
      gotoView("user-dashboard");
    });

    $("#btnSyncCloud")?.addEventListener("click", async () => {
      const dd = $("#userDropdown");
      if (dd) dd.style.display = "none";
      toast("⏳ Đang đồng bộ với Supabase Cloud...");
      await syncLocalAndCloud();
      toast("☁️ Đã đồng bộ tiến độ mới nhất!");
    });

    updateAuthUI();
    if (state.currentUser) {
      syncLocalAndCloud();
    }

    renderAll();
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
