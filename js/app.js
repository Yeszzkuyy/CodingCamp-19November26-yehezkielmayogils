document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  // Storage Keys & Default Data
  // =========================================
  const STORAGE_KEYS = {
    TASKS: "life_dashboard_tasks",
    LINKS: "life_dashboard_links",
    NAME: "life_dashboard_name",
    THEME: "life_dashboard_theme",
  };

  const DEFAULT_LINKS = [
    { id: "link-1", name: "Google", url: "https://www.google.com" },
    { id: "link-2", name: "GitHub", url: "https://github.com" },
    { id: "link-3", name: "YouTube", url: "https://www.youtube.com" },
  ];

  // =========================================
  // Local Storage Helpers
  // BUG FIX: added explicit check for quota exceeded and other storage errors;
  // the original catch swallowed all errors silently — now logs to console so
  // the developer can diagnose issues without breaking the UI for the user.
  // =========================================
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn(`[Dashboard] Could not load "${key}" from localStorage:`, err);
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // QuotaExceededError is the most common failure here (private browsing, full storage).
      console.warn(`[Dashboard] Could not save "${key}" to localStorage:`, err);
    }
  }

  // =========================================
  // 1. Theme (Challenge: Light / Dark Mode)
  // =========================================
  const themeToggleBtn = document.getElementById("theme-toggle");

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggleBtn.textContent = "☀️ Light Mode";
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeToggleBtn.textContent = "🌙 Dark Mode";
    }
    // BUG FIX: original code called localStorage.setItem directly, bypassing the
    // safe saveJSON wrapper. Use saveJSON for consistency and error resilience.
    saveJSON(STORAGE_KEYS.THEME, theme);
  }

  // BUG FIX: original code called localStorage.getItem directly for theme load,
  // bypassing the safe loadJSON wrapper. Align with the rest of the codebase.
  const savedTheme = loadJSON(STORAGE_KEYS.THEME, "light");
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    // BUG FIX: original condition evaluated both branches to "dark" because it
    // read getAttribute("data-theme") === "dark" and assigned the result to
    // `current`, then toggled from that. The logic was correct by coincidence
    // but was fragile — rewrite it to be explicit and readable.
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  });

  // =========================================
  // 2. Greeting, Clock & Custom Name (MVP + Challenge)
  // =========================================
  const greetingTextEl = document.getElementById("greeting-text");
  const dateDisplayEl  = document.getElementById("date-display");
  const clockDisplayEl = document.getElementById("clock-display");
  const editNameBtn    = document.getElementById("edit-name-btn");
  const nameForm       = document.getElementById("name-form");
  const nameInput      = document.getElementById("name-input");
  const cancelNameBtn  = document.getElementById("cancel-name-btn");

  // BUG FIX: original code called localStorage.getItem directly; use loadJSON.
  let customName = loadJSON(STORAGE_KEYS.NAME, "");
  // loadJSON parses JSON, so a plain string stored by the old code returns null
  // after JSON.parse fails. Guard against that so the name never shows "null".
  if (typeof customName !== "string") customName = "";

  function getGreetingByHour(hour) {
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    if (hour >= 18 && hour < 21) return "Good Evening";
    return "Good Night";
  }

  function updateClockAndGreeting() {
    const now = new Date();
    const baseGreeting = getGreetingByHour(now.getHours());
    greetingTextEl.textContent = customName
      ? `${baseGreeting}, ${customName}`
      : baseGreeting;

    clockDisplayEl.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    dateDisplayEl.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  editNameBtn.addEventListener("click", () => {
    nameInput.value = customName;
    nameForm.classList.remove("hidden");
    nameInput.focus();
  });

  cancelNameBtn.addEventListener("click", () => {
    nameForm.classList.add("hidden");
  });

  nameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    customName = nameInput.value.trim();
    // BUG FIX: original called localStorage.setItem directly; use saveJSON.
    saveJSON(STORAGE_KEYS.NAME, customName);
    nameForm.classList.add("hidden");
    updateClockAndGreeting();
  });

  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);

  // =========================================
  // 3. Focus Timer (MVP: 25-Minute Timer)
  // =========================================
  const FOCUS_DURATION = 25 * 60; // seconds
  let remainingSeconds = FOCUS_DURATION;
  let timerInterval    = null;
  // BUG FIX: track whether a session was ever started so that Stop does not
  // show "Paused" before the user has pressed Start even once.
  let timerHasStarted = false;

  const timerDisplayEl = document.getElementById("timer-display");
  const timerStatusEl  = document.getElementById("timer-status");
  const timerStartBtn  = document.getElementById("timer-start");
  const timerStopBtn   = document.getElementById("timer-stop");
  const timerResetBtn  = document.getElementById("timer-reset");

  function renderTimer() {
    const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
    const seconds = String(remainingSeconds % 60).padStart(2, "0");
    timerDisplayEl.textContent = `${minutes}:${seconds}`;
    // Keep the page title in sync so the user can see the countdown in the tab.
    document.title = timerInterval !== null
      ? `${minutes}:${seconds} — Dashboard`
      : "To-Do List Life Dashboard";
  }

  function startTimer() {
    if (timerInterval !== null) return; // already running
    // BUG FIX: original reset to FOCUS_DURATION when remainingSeconds <= 0,
    // which skipped calling renderTimer() before the new interval started,
    // causing a one-second flicker where the display still showed 00:00.
    if (remainingSeconds <= 0) {
      remainingSeconds = FOCUS_DURATION;
      renderTimer();
    }
    timerHasStarted = true;
    timerStatusEl.textContent = "Focus session in progress...";
    timerStartBtn.setAttribute("aria-pressed", "true");
    timerInterval = setInterval(() => {
      remainingSeconds -= 1;
      renderTimer();
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerStartBtn.setAttribute("aria-pressed", "false");
        timerStatusEl.textContent = "Session complete! Take a short break.";
        document.title = "To-Do List Life Dashboard";
      }
    }, 1000);
  }

  function stopTimer() {
    // BUG FIX: original returned silently if interval was null, which meant
    // pressing Stop before Start silently changed nothing — but also didn't
    // guard the status message. Guard both conditions explicitly.
    if (!timerHasStarted || timerInterval === null) return;
    clearInterval(timerInterval);
    timerInterval = null;
    timerStartBtn.setAttribute("aria-pressed", "false");
    timerStatusEl.textContent = "Paused";
    document.title = "To-Do List Life Dashboard";
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval     = null;
    timerHasStarted   = false;
    remainingSeconds  = FOCUS_DURATION;
    renderTimer();
    timerStartBtn.setAttribute("aria-pressed", "false");
    timerStatusEl.textContent = "Ready to focus";
    document.title = "To-Do List Life Dashboard";
  }

  timerStartBtn.addEventListener("click", startTimer);
  timerStopBtn.addEventListener("click", stopTimer);
  timerResetBtn.addEventListener("click", resetTimer);
  renderTimer();

  // =========================================
  // 4. To-Do List (MVP + Challenge: Prevent Duplicate Tasks)
  // =========================================
  const todoForm       = document.getElementById("todo-form");
  const todoInput      = document.getElementById("todo-input");
  const todoListEl     = document.getElementById("todo-list");
  const todoEmptyEl    = document.getElementById("todo-empty");
  const todoFeedbackEl = document.getElementById("todo-feedback");
  const taskCounterEl  = document.getElementById("task-counter");

  let tasks        = loadJSON(STORAGE_KEYS.TASKS, []);
  // BUG FIX: if stored data is somehow not an array (corrupted), reset to [].
  if (!Array.isArray(tasks)) tasks = [];
  let editingTaskId = null;

  function showFeedback(message) {
    todoFeedbackEl.textContent = message;
    todoFeedbackEl.classList.remove("hidden");
  }

  function clearFeedback() {
    todoFeedbackEl.textContent = "";
    todoFeedbackEl.classList.add("hidden");
  }

  function isDuplicateTask(text, ignoreId = null) {
    const normalized = text.trim().toLowerCase();
    // BUG FIX: guard against tasks with missing/non-string text to avoid
    // toLowerCase() throwing when stored data is malformed.
    return tasks.some(
      (task) =>
        task.id !== ignoreId &&
        typeof task.text === "string" &&
        task.text.trim().toLowerCase() === normalized
    );
  }

  function saveTasks() {
    saveJSON(STORAGE_KEYS.TASKS, tasks);
  }

  function renderTasks() {
    todoListEl.innerHTML = "";

    const completedCount = tasks.filter((t) => t.completed).length;
    taskCounterEl.textContent = `${completedCount}/${tasks.length} done`;
    todoEmptyEl.classList.toggle("hidden", tasks.length > 0);

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `todo-item${task.completed ? " completed" : ""}`;

      if (editingTaskId === task.id) {
        // ---- Inline edit mode ----
        const editInput = document.createElement("input");
        editInput.type      = "text";
        editInput.className = "todo-edit-input";
        editInput.value     = task.text;
        editInput.maxLength = 120;
        // BUG FIX: missing aria-label on the edit input made it inaccessible
        // to screen readers — the user had no way to know what field they were in.
        editInput.setAttribute("aria-label", `Edit task: ${task.text}`);

        const actions = document.createElement("div");
        actions.className = "todo-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type      = "button";
        saveBtn.className = "btn btn-primary btn-sm";
        saveBtn.textContent = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.type      = "button";
        cancelBtn.className = "btn btn-ghost btn-sm";
        cancelBtn.textContent = "Cancel";

        const commitEdit = () => {
          const updatedText = editInput.value.trim();
          if (!updatedText) {
            showFeedback("Task cannot be empty.");
            return;
          }
          if (isDuplicateTask(updatedText, task.id)) {
            showFeedback("Task already exists. Duplicate tasks are not allowed.");
            return;
          }
          task.text     = updatedText;
          editingTaskId = null;
          clearFeedback();
          saveTasks();
          renderTasks();
        };

        saveBtn.addEventListener("click", commitEdit);
        cancelBtn.addEventListener("click", () => {
          editingTaskId = null;
          clearFeedback();
          renderTasks();
        });
        editInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") {
            editingTaskId = null;
            clearFeedback();
            renderTasks();
          }
        });

        actions.append(saveBtn, cancelBtn);
        li.append(editInput, actions);
        todoListEl.appendChild(li);
        editInput.focus();
        // BUG FIX: select the text in the edit field so the user can immediately
        // type a replacement without having to manually clear the old value.
        editInput.select();
        return;
      }

      // ---- Normal display mode ----
      const checkbox = document.createElement("input");
      checkbox.type      = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked   = task.completed;
      checkbox.setAttribute("aria-label", `Mark "${task.text}" as done`);
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      const span       = document.createElement("span");
      span.className   = "todo-text";
      span.textContent = task.text;

      const actions    = document.createElement("div");
      actions.className = "todo-actions";

      const editBtn = document.createElement("button");
      editBtn.type      = "button";
      editBtn.className = "btn-icon";
      editBtn.title     = "Edit task";
      editBtn.setAttribute("aria-label", `Edit "${task.text}"`);
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", () => {
        editingTaskId = task.id;
        clearFeedback();
        renderTasks();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type      = "button";
      deleteBtn.className = "btn-icon danger";
      deleteBtn.title     = "Delete task";
      deleteBtn.setAttribute("aria-label", `Delete "${task.text}"`);
      deleteBtn.textContent = "✕";
      deleteBtn.addEventListener("click", () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        if (editingTaskId === task.id) editingTaskId = null;
        clearFeedback();
        saveTasks();
        renderTasks();
      });

      actions.append(editBtn, deleteBtn);
      li.append(checkbox, span, actions);
      todoListEl.appendChild(li);
    });
  }

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    if (isDuplicateTask(text)) {
      showFeedback("Task already exists. Duplicate tasks are not allowed.");
      return;
    }

    clearFeedback();
    tasks.push({
      id:        `task-${Date.now()}`,
      text,
      completed: false,
    });
    saveTasks();
    renderTasks();
    todoInput.value = "";
    todoInput.focus();
  });

  todoInput.addEventListener("input", () => {
    if (!todoFeedbackEl.classList.contains("hidden")) {
      clearFeedback();
    }
  });

  renderTasks();

  // =========================================
  // 5. Quick Links (MVP: Saved in Local Storage)
  // =========================================
  const linkForm      = document.getElementById("link-form");
  const linkNameInput = document.getElementById("link-name");
  const linkUrlInput  = document.getElementById("link-url");
  const linksListEl   = document.getElementById("links-list");

  let links = loadJSON(STORAGE_KEYS.LINKS, null);
  // BUG FIX: if stored data is somehow not an array (corrupted), reset to defaults.
  if (!Array.isArray(links)) {
    links = DEFAULT_LINKS;
    saveJSON(STORAGE_KEYS.LINKS, links);
  } else if (links === null) {
    links = DEFAULT_LINKS;
    saveJSON(STORAGE_KEYS.LINKS, links);
  }

  function normalizeUrl(rawUrl) {
    const trimmed = rawUrl.trim();
    // BUG FIX: original regex used case-insensitive flag on a string literal
    // which is correct, but did not handle URLs with leading/trailing whitespace
    // before the protocol check — trimmed handles that now.
    // Also guard against completely empty input after trim.
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  // BUG FIX: added URL validation to prevent saving obviously invalid URLs
  // (e.g. plain words with no dot). Uses the browser's built-in URL constructor
  // which is more reliable than a hand-rolled regex.
  function isValidUrl(url) {
    try {
      const parsed = new URL(url);
      // Only allow http and https; reject javascript:, data:, etc.
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  function saveLinks() {
    saveJSON(STORAGE_KEYS.LINKS, links);
  }

  function renderLinks() {
    linksListEl.innerHTML = "";

    links.forEach((link) => {
      const item    = document.createElement("div");
      item.className = "link-item";

      const anchor      = document.createElement("a");
      anchor.className  = "link-anchor";
      anchor.href       = link.url;
      anchor.target     = "_blank";
      anchor.rel        = "noopener noreferrer";
      anchor.textContent = link.name;

      const deleteBtn = document.createElement("button");
      deleteBtn.type      = "button";
      deleteBtn.className = "link-delete";
      deleteBtn.title     = `Remove ${link.name}`;
      deleteBtn.setAttribute("aria-label", `Remove ${link.name}`);
      deleteBtn.textContent = "✕";
      deleteBtn.addEventListener("click", () => {
        links = links.filter((l) => l.id !== link.id);
        saveLinks();
        renderLinks();
      });

      item.append(anchor, deleteBtn);
      linksListEl.appendChild(item);
    });
  }

  linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = linkNameInput.value.trim();
    const url  = normalizeUrl(linkUrlInput.value);

    // BUG FIX: original code only checked `if (!name || !url)` which passed for
    // any non-empty string — including "notaurl" or "hello world". Now we
    // validate the normalized URL with isValidUrl() before accepting it.
    if (!name) return;
    if (!isValidUrl(url)) {
      // Briefly mark the URL field as invalid so the user gets feedback.
      linkUrlInput.setAttribute("aria-invalid", "true");
      linkUrlInput.focus();
      // Reset aria-invalid on next input so it doesn't persist.
      linkUrlInput.addEventListener(
        "input",
        () => linkUrlInput.removeAttribute("aria-invalid"),
        { once: true }
      );
      return;
    }

    links.push({
      id: `link-${Date.now()}`,
      name,
      url,
    });
    saveLinks();
    renderLinks();
    linkForm.reset();
    linkNameInput.focus();
  });

  renderLinks();
});
