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
  // =========================================
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // =========================================
  // 2. Greeting, Clock & Custom Name (MVP + Challenge)
  // =========================================
  const greetingTextEl = document.getElementById("greeting-text");
  const dateDisplayEl = document.getElementById("date-display");
  const clockDisplayEl = document.getElementById("clock-display");
  const editNameBtn = document.getElementById("edit-name-btn");
  const nameForm = document.getElementById("name-form");
  const nameInput = document.getElementById("name-input");
  const cancelNameBtn = document.getElementById("cancel-name-btn");

  let customName = localStorage.getItem(STORAGE_KEYS.NAME) || "";

  function getGreetingByHour(hour) {
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    if (hour >= 18 && hour < 21) return "Good Evening";
    return "Good Night";
  }

  function updateClockAndGreeting() {
    const now = new Date();
    const baseGreeting = getGreetingByHour(now.getHours());
    greetingTextEl.textContent = customName ? `${baseGreeting}, ${customName}` : baseGreeting;

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
    localStorage.setItem(STORAGE_KEYS.NAME, customName);
    nameForm.classList.add("hidden");
    updateClockAndGreeting();
  });

  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);

  // =========================================
  // 3. Focus Timer (MVP: 25-Minute Timer)
  // =========================================
  const FOCUS_DURATION = 25 * 60;
  let remainingSeconds = FOCUS_DURATION;
  let timerInterval = null;

  const timerDisplayEl = document.getElementById("timer-display");
  const timerStatusEl = document.getElementById("timer-status");
  const timerStartBtn = document.getElementById("timer-start");
  const timerStopBtn = document.getElementById("timer-stop");
  const timerResetBtn = document.getElementById("timer-reset");

  function renderTimer() {
    const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
    const seconds = String(remainingSeconds % 60).padStart(2, "0");
    timerDisplayEl.textContent = `${minutes}:${seconds}`;
  }

  function startTimer() {
    if (timerInterval !== null) return;
    if (remainingSeconds <= 0) {
      remainingSeconds = FOCUS_DURATION;
    }

    timerStatusEl.textContent = "Focus session in progress...";
    timerInterval = setInterval(() => {
      remainingSeconds -= 1;
      renderTimer();

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerStatusEl.textContent = "Session complete! Take a short break.";
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval === null) return;
    clearInterval(timerInterval);
    timerInterval = null;
    timerStatusEl.textContent = "Paused";
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    remainingSeconds = FOCUS_DURATION;
    renderTimer();
    timerStatusEl.textContent = "Ready to focus";
  }

  timerStartBtn.addEventListener("click", startTimer);
  timerStopBtn.addEventListener("click", stopTimer);
  timerResetBtn.addEventListener("click", resetTimer);
  renderTimer();

  // =========================================
  // 4. To-Do List (MVP + Challenge: Prevent Duplicate Tasks)
  // =========================================
  const todoForm = document.getElementById("todo-form");
  const todoInput = document.getElementById("todo-input");
  const todoListEl = document.getElementById("todo-list");
  const todoEmptyEl = document.getElementById("todo-empty");
  const todoFeedbackEl = document.getElementById("todo-feedback");
  const taskCounterEl = document.getElementById("task-counter");

  let tasks = loadJSON(STORAGE_KEYS.TASKS, []);
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
    return tasks.some(
      (task) => task.id !== ignoreId && task.text.trim().toLowerCase() === normalized
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
        const editInput = document.createElement("input");
        editInput.type = "text";
        editInput.className = "todo-edit-input";
        editInput.value = task.text;
        editInput.maxLength = 120;

        const actions = document.createElement("div");
        actions.className = "todo-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "btn btn-primary btn-sm";
        saveBtn.textContent = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
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
          task.text = updatedText;
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
        return;
      }

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `Mark "${task.text}" as done`);
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = task.text;

      const actions = document.createElement("div");
      actions.className = "todo-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-icon";
      editBtn.title = "Edit task";
      editBtn.setAttribute("aria-label", `Edit "${task.text}"`);
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", () => {
        editingTaskId = task.id;
        clearFeedback();
        renderTasks();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-icon danger";
      deleteBtn.title = "Delete task";
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
      id: `task-${Date.now()}`,
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
  const linkForm = document.getElementById("link-form");
  const linkNameInput = document.getElementById("link-name");
  const linkUrlInput = document.getElementById("link-url");
  const linksListEl = document.getElementById("links-list");

  let links = loadJSON(STORAGE_KEYS.LINKS, null);
  if (links === null) {
    links = DEFAULT_LINKS;
    saveJSON(STORAGE_KEYS.LINKS, links);
  }

  function normalizeUrl(rawUrl) {
    const trimmed = rawUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function saveLinks() {
    saveJSON(STORAGE_KEYS.LINKS, links);
  }

  function renderLinks() {
    linksListEl.innerHTML = "";

    links.forEach((link) => {
      const item = document.createElement("div");
      item.className = "link-item";

      const anchor = document.createElement("a");
      anchor.className = "link-anchor";
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = link.name;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "link-delete";
      deleteBtn.title = `Remove ${link.name}`;
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
    const url = normalizeUrl(linkUrlInput.value);
    if (!name || !url) return;

    links.push({
      id: `link-${Date.now()}`,
      name,
      url,
    });
    saveLinks();
    renderLinks();
    linkForm.reset();
  });

  renderLinks();
});