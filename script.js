// ======================================
// STUD - JAVASCRIPT
// ======================================
// SAVE AND LOAD DATA
const loadData = (key, fallback = []) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};
let notes = loadData("stud_notes");
let noteCollections = loadData("stud_note_collections");
let activeCollectionId = "all";
let tasks = loadData("stud_tasks");
let classSchedule = loadData("stud_class_schedule");
let quizAttempts = 0;
try {
    quizAttempts = Number(localStorage.getItem("stud_quiz_attempts")) || 0;
} catch (error) {
    console.error("Stud could not load quiz history:", error);
}
let customQuizzes = loadData("stud_custom_quizzes");
function saveData() {
    localStorage.setItem("stud_notes", JSON.stringify(notes));
    localStorage.setItem("stud_note_collections", JSON.stringify(noteCollections));
    localStorage.setItem("stud_tasks", JSON.stringify(tasks));
    localStorage.setItem("stud_class_schedule", JSON.stringify(classSchedule));
    localStorage.setItem("stud_quiz_attempts", quizAttempts);
    localStorage.setItem("stud_custom_quizzes", JSON.stringify(customQuizzes));
}
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}
// NAVIGATION
const pageNames = {
    dashboard: "Dashboard",
    notes: "My Notes",
    schedule: "Planner",
    planner: "Study Planner",
    quiz: "Self Quiz",
    settings: "Settings"
};
function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });
    document.getElementById(page).classList.add("active");
    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });
    document.getElementById("page-heading").textContent = pageNames[page];
    document.getElementById("page-subheading").textContent =
        page === "dashboard" ? "Your personal study space" :
        page === "notes" ? "Your saved lessons and ideas" :
        page === "schedule" ? "Stay on top of your schoolwork" :
        page === "planner" ? "Make every study session count" :
        page === "quiz" ? "Practice makes progress" :
        "Personalize your study space";
    if (page === "dashboard") renderDashboard();
    if (page === "notes") renderNotes();
    if (page === "schedule") {
        renderTasks();
        renderClassSchedule();
    }
    if (page === "quiz") renderCustomQuizzes();
    window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});
// DATE DISPLAY
function updateDate() {
    const today = new Date();
    document.getElementById("today-date").textContent =
        today.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    document.getElementById("task-date").value =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
// DASHBOARD
function renderDashboard() {
    const pendingTasks = tasks.filter(task => !task.completed);
    document.getElementById("note-count").textContent = notes.length;
    document.getElementById("task-count").textContent = pendingTasks.length;
    document.getElementById("quiz-count").textContent = quizAttempts;
    const container = document.getElementById("dashboard-tasks");
    if (pendingTasks.length === 0) {
        container.innerHTML =
            '<p class="empty-state">No pending tasks. Enjoy your free time! 🌻</p>';
        return;
    }
    container.innerHTML = pendingTasks
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4)
        .map(task => `
            <div class="task-item">
                <input class="task-check" type="checkbox"
                    aria-label="Complete ${escapeHTML(task.title)}"
                    onchange="toggleTask(${task.id})">
                <div class="task-info">
                    <strong>${escapeHTML(task.title)}</strong>
                    <small>${escapeHTML(task.date)}</small>
                </div>
                <span class="priority ${task.priority}">
                    ${task.priority}
                </span>
            </div>
        `).join("");
}
// NOTES
function renderCollections() {
    const bar = document.getElementById("collections-bar");
    if (!bar) return;
    const allCount = notes.length;
    bar.innerHTML =
        `<button class="collection-chip ${activeCollectionId === "all" ? "active" : ""}"
            onclick="selectCollection('all')">
            All Notes <span class="count">${allCount}</span>
        </button>` +
        noteCollections.map(collection => {
            const count = notes.filter(
                note => String(note.collectionId || "") === String(collection.id)
            ).length;
            const isActive =
                String(activeCollectionId) === String(collection.id);
            const deleteButton = isActive
                ? `<span class="collection-actions">
                    <button onclick="deleteCollection(${collection.id})">
                        Delete
                    </button>
                   </span>`
                : "";
            return `
                <div class="collection-wrap">
                    <button class="collection-chip ${isActive ? "active" : ""}"
                        onclick="selectCollection('${collection.id}')">
                        ${escapeHTML(collection.name)}
                        <span class="count">${count}</span>
                    </button>
                    ${deleteButton}
                </div>
            `;
        }).join("");
}
function selectCollection(id) { activeCollectionId = id; renderCollections(); renderNotes(); }
function openCollectionForm() {
    document.getElementById("collection-form-title").textContent = "Create a collection";
    document.getElementById("collection-name").value = "";
    const modal = document.getElementById("collection-form");
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    setTimeout(() => document.getElementById("collection-name").focus(), 80);
}
function closeCollectionForm() {
    document.getElementById("collection-form").classList.add("hidden");
    document.body.classList.remove("modal-open");
}
function saveCollection() {
    const name = document.getElementById("collection-name").value.trim();
    if (!name) { showToast("Please enter a collection name.", "error"); return; }
    if (noteCollections.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        showToast("That collection already exists.", "error"); return;
    }
    const collection = { id: Date.now(), name };
    noteCollections.push(collection);
    activeCollectionId = collection.id;
    saveData(); closeCollectionForm(); renderCollections(); renderNotes();
    showToast("Collection created!");
}
function deleteCollection(id) {
    showConfirm("Notes in this collection will be moved to All Notes. Continue?", () => {
        noteCollections = noteCollections.filter(item => item.id !== id);
                notes.forEach(note => { if (String(note.collectionId || "") === String(id)) note.collectionId = ""; });
        if (String(activeCollectionId) === String(id)) activeCollectionId = "all";
        saveData(); renderCollections(); renderNotes(); showToast("Collection deleted.");
    }, "Delete collection?", "📁", "Delete collection");
}
function updateNoteCollectionOptions(selectedId = "") {
    const select = document.getElementById("note-collection");
    if (!select) return;
    select.innerHTML = '<option value="">No collection</option>' + noteCollections.map(item => `<option value="${item.id}">${escapeHTML(item.name)}</option>`).join("");
    select.value = selectedId || "";
}
function openNoteForm(id = null) {
    const form = document.getElementById("note-form");
    updateNoteCollectionOptions();
    if (id !== null) {
        const note = notes.find(item => Number(item.id) === Number(id));
        if (!note) return;
        document.getElementById("note-form-title").textContent = "Edit note details";
        document.getElementById("edit-note-id").value = note.id;
        document.getElementById("note-title").value = note.title || "";
        document.getElementById("note-subject").value = note.subject || "";
        updateNoteCollectionOptions(note.collectionId || "");
        form.querySelector(".primary-button").textContent = "Save Changes";
    } else {
        document.getElementById("note-form-title").textContent = "Create a note";
        document.getElementById("edit-note-id").value = "";
        document.getElementById("note-title").value = "";
        document.getElementById("note-subject").value = "";
        updateNoteCollectionOptions(activeCollectionId === "all" ? "" : activeCollectionId);
        form.querySelector(".primary-button").textContent = "Create Note";
    }
    form.classList.remove("hidden");
    document.body.classList.add("modal-open");
    setTimeout(() => document.getElementById("note-title").focus(), 80);
}
function closeNoteForm() {
    document.getElementById("note-form").classList.add("hidden");
    document.body.classList.remove("modal-open");
}
function saveNote() {
    const title = document.getElementById("note-title").value.trim();
    const subject = document.getElementById("note-subject").value.trim();
    const editId = document.getElementById("edit-note-id").value;
    const collectionId = document.getElementById("note-collection").value;
    if (!title) { showToast("Please enter a note title.", "error"); return; }
    if (editId) {
        const note = notes.find(item => Number(item.id) === Number(editId));
        if (note) {
            note.title = title;
            note.subject = subject || "General";
            note.collectionId = collectionId;
            note.updatedAt = new Date().toISOString();
        }
        saveData(); closeNoteForm(); renderCollections(); renderNotes(); renderDashboard();
        showToast("Note details updated!");
    } else {
        const note = {
            id: Date.now(),
            title,
            subject: subject || "General",
            content: "",
            collectionId,
            updatedAt: new Date().toISOString()
        };
        notes.unshift(note);
        saveData(); closeNoteForm(); renderCollections(); renderNotes(); renderDashboard();
        showToast("Note created! Open it with Read to start writing.");
        readNote(note.id);
    }
}
function getNotePlainText(content) {
    const holder = document.createElement("div");
    holder.innerHTML = String(content || "");
    return (holder.textContent || holder.innerText || "").replace(/\s+/g, " ").trim();
}
function sanitizeNoteHTML(html) {
    const parsed = new DOMParser().parseFromString(String(html || ""), "text/html");
    const allowed = new Set(["P", "BR", "DIV", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "H1", "H2", "H3", "BLOCKQUOTE", "SPAN"]);
    const walk = node => {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (child.tagName === "FONT") {
                    const sizeMap = { "1": "12px", "2": "14px", "3": "16px", "4": "20px", "5": "24px", "6": "28px", "7": "32px" };
                    const replacement = document.createElement("span");
                    replacement.style.fontSize = sizeMap[child.getAttribute("size")] || "16px";
                    replacement.innerHTML = child.innerHTML;
                    child.replaceWith(replacement);
                    walk(replacement);
                    return;
                }
                if (!allowed.has(child.tagName)) {
                    child.replaceWith(...child.childNodes);
                    return;
                }
                [...child.attributes].forEach(attr => {
                    if (attr.name !== "style") child.removeAttribute(attr.name);
                });
                if (child.hasAttribute("style")) {
                    const safe = [];
                    const style = child.style;
                    if (style.color && /^(#[0-9a-f]{3,8}|rgb\\([\\d\\s%,.]+\\)|rgba\\([\\d\\s%,.]+\\))$/i.test(style.color)) safe.push(`color:${style.color}`);
                    if (style.backgroundColor && /^(#[0-9a-f]{3,8}|rgb\\([\\d\\s%,.]+\\)|rgba\\([\\d\\s%,.]+\\))$/i.test(style.backgroundColor)) safe.push(`background-color:${style.backgroundColor}`);
                    if (style.fontSize && /^\d{1,2}px$/.test(style.fontSize)) safe.push(`font-size:${style.fontSize}`);
                    if (safe.length) child.setAttribute("style", safe.join(";"));
                    else child.removeAttribute("style");
                }
                walk(child);
            } else if (child.nodeType !== Node.TEXT_NODE) {
                child.remove();
            }
        });
    };
    walk(parsed.body);
    return parsed.body.innerHTML;
}
function renderNotes() {
    const container = document.getElementById("notes-container");
    const search = document.getElementById("note-search").value.toLowerCase();
    const filteredNotes = notes.filter(note => {
        const title = String(note.title || "");
        const subject = String(note.subject || "General");
        const content = getNotePlainText(note.content || "");
        const matchesSearch = title.toLowerCase().includes(search) || subject.toLowerCase().includes(search) || content.toLowerCase().includes(search);
        const matchesCollection = activeCollectionId === "all" || String(note.collectionId || "") === String(activeCollectionId);
        return matchesSearch && matchesCollection;
    });
    renderCollections();
    if (filteredNotes.length === 0) {
        container.innerHTML = '<p class="empty-state">No notes here yet. Create a note or choose another collection! ✨</p>';
        return;
    }
    container.innerHTML = filteredNotes.map(note => {
        const collection = noteCollections.find(item => String(item.id) === String(note.collectionId));
        const preview = getNotePlainText(note.content || "");
        return `
            <div class="note-card">
                <span class="note-subject">${escapeHTML(note.subject || "General")}</span>
                <h3>${escapeHTML(note.title || "Untitled note")}</h3>
                <p>${escapeHTML(preview || "No content yet. Select Read to start writing.")}</p>
                ${collection ? `<span class="note-collection-tag">📁 ${escapeHTML(collection.name)}</span>` : ""}
                                <div class="note-actions">
                    <button class="read-note-button" onclick="readNote(${Number(note.id)})">✎ Open</button>
                    <button onclick="openNoteForm(${Number(note.id)})">✎ Details</button>
                    <button onclick="deleteNote(${Number(note.id)})">✕ Delete</button>
                </div>
            </div>`;
    }).join("");
}
// FULL-SCREEN NOTE EDITOR
let activeEditorNoteId = null;
let editorSavedTimer = null;
function readNote(id) {
    const note = notes.find(item => Number(item.id) === Number(id));
    if (!note) return;
    closeNoteReader(false);
    activeEditorNoteId = note.id;
    const overlay = document.createElement("section");
    overlay.id = "note-reader";
    overlay.className = "note-editor-overlay";
    overlay.innerHTML = `
      <div class="note-editor-shell">
        <header class="note-editor-topbar">
          <button class="editor-back-button" onclick="closeNoteReader()">← Back to My Notes</button>
          <div class="editor-save-state" id="editor-save-state">All changes saved</div>
          <button class="editor-done-button" onclick="closeNoteReader()">Done ✓</button>
        </header>
        <div class="note-editor-heading">
          <div>
            <span class="note-editor-subject">${escapeHTML(note.subject || "General")}</span>
            <h1>${escapeHTML(note.title || "Untitled note")}</h1>
          </div>
          <div class="editor-word-count" id="editor-word-count">0 words</div>
        </div>
        <div class="note-editor-toolbar" role="toolbar" aria-label="Note formatting tools">
          <button type="button" data-command="bold" title="Bold"><b>B</b></button>
          <button type="button" data-command="italic" title="Italic"><i>I</i></button>
          <button type="button" data-command="underline" title="Underline"><u>U</u></button>
          <span class="editor-tool-divider"></span>
          <label class="editor-color-tool" title="Font color">A <input type="color" id="editor-font-color" value="#44372f" aria-label="Font color"></label>
          <label class="editor-color-tool highlight-tool" title="Highlight">▰ <input type="color" id="editor-highlight-color" value="#fff0a8" aria-label="Highlight color"></label>
          <select id="editor-font-size" aria-label="Font size">
            <option value="3">Normal</option><option value="2">Small</option><option value="4">Large</option><option value="5">Extra large</option>
          </select>
          <span class="editor-tool-divider"></span>
          <button type="button" data-command="insertUnorderedList" title="Bulleted list">• List</button>
          <button type="button" data-command="insertOrderedList" title="Numbered list">1. List</button>
          <button type="button" data-command="undo" title="Undo">↶</button>
          <button type="button" data-command="redo" title="Redo">↷</button>
          <button type="button" data-command="removeFormat" title="Clear formatting">Clear</button>
        </div>
        <main class="note-editor-scroll">
          <article id="note-editor-content" class="note-editor-content" contenteditable="true" spellcheck="true" data-placeholder="Start writing your notes here..."></article>
        </main>
        <footer class="note-editor-footer">
          <span>Autosave is on · Your note is stored in this browser</span>
          <span id="editor-footer-count">0 words</span>
        </footer>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add("note-editor-open");
    const editor = document.getElementById("note-editor-content");
    const saved = String(note.content || "");
    editor.innerHTML = saved.trim().startsWith("<") ? sanitizeNoteHTML(saved) : escapeHTML(saved).replace(/\n/g, "<br>");
    updateEditorWordCount();
    editor.focus();
    overlay.querySelectorAll("[data-command]").forEach(button => {
        button.addEventListener("mousedown", event => event.preventDefault());
        button.addEventListener("click", () => {
            editor.focus();
            document.execCommand(button.dataset.command, false, null);
            saveActiveNote();
        });
    });
    document.getElementById("editor-font-color").addEventListener("input", event => {
        editor.focus(); document.execCommand("foreColor", false, event.target.value); saveActiveNote();
    });
    document.getElementById("editor-highlight-color").addEventListener("input", event => {
        editor.focus(); document.execCommand("hiliteColor", false, event.target.value); saveActiveNote();
    });
    document.getElementById("editor-font-size").addEventListener("change", event => {
        editor.focus(); document.execCommand("fontSize", false, event.target.value); saveActiveNote();
    });
    editor.addEventListener("input", () => {
        updateEditorWordCount();
        document.getElementById("editor-save-state").textContent = "Saving…";
        clearTimeout(editorSavedTimer);
        editorSavedTimer = setTimeout(saveActiveNote, 350);
    });
    document.addEventListener("keydown", editorEscapeHandler);
}
function editorEscapeHandler(event) {
    if (event.key === "Escape" && document.getElementById("note-reader")) closeNoteReader();
}
function updateEditorWordCount() {
    const editor = document.getElementById("note-editor-content");
    if (!editor) return;
    const words = (editor.innerText.trim().match(/\S+/g) || []).length;
    document.getElementById("editor-word-count").textContent = `${words} ${words === 1 ? "word" : "words"}`;
    document.getElementById("editor-footer-count").textContent = `${words} ${words === 1 ? "word" : "words"}`;
}
function saveActiveNote() {
    const editor = document.getElementById("note-editor-content");
    if (!editor || activeEditorNoteId === null) return;
    const note = notes.find(item => Number(item.id) === Number(activeEditorNoteId));
    if (!note) return;
    note.content = sanitizeNoteHTML(editor.innerHTML);
    note.updatedAt = new Date().toISOString();
    saveData();
    const status = document.getElementById("editor-save-state");
    if (status) status.textContent = "All changes saved";
    renderNotes();
    renderDashboard();
}
function closeNoteReader(restore = true) {
    clearTimeout(editorSavedTimer);
    if (document.getElementById("note-editor-content")) saveActiveNote();
    const reader = document.getElementById("note-reader");
    if (reader) reader.remove();
    document.removeEventListener("keydown", editorEscapeHandler);
    activeEditorNoteId = null;
    document.body.classList.remove("note-editor-open");
    if (restore) {
        renderNotes();
        showPage("notes");
    }
}
// CUSTOM CONFIRMATION FOR DELETING NOTES
function deleteNote(id) {
    showConfirm(
        "This note will be permanently deleted. Are you sure?",
        () => {
            notes = notes.filter(note => note.id !== id);
            saveData();
            renderNotes();
            renderDashboard();
            showToast("Note deleted successfully!");
        },
        "Delete this note?",
        "🗑️",
        "Delete note"
    );
}
document.getElementById("note-search").addEventListener("input", renderNotes);
// ======================================
// PLANNER: CLASS SCHEDULE + TASKS & GOALS
// ======================================
const plannerDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];
// SWITCH BETWEEN PLANNER SECTIONS
function showScheduleTab(tab) {
    const classes = tab === "classes";
    document.getElementById("class-schedule-panel")
        .classList.toggle("hidden", !classes);
    document.getElementById("tasks-panel")
        .classList.toggle("hidden", classes);
    document.getElementById("class-tab")
        .classList.toggle("active", classes);
    document.getElementById("tasks-tab")
        .classList.toggle("active", !classes);
    document.getElementById("class-tab")
        .setAttribute("aria-selected", String(classes));
    document.getElementById("tasks-tab")
        .setAttribute("aria-selected", String(!classes));
    if (classes) {
        renderClassSchedule();
    } else {
        renderTasks();
    }
}
// ADD A CLASS
function openClassForm() {
    document.getElementById("class-form-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
    setTimeout(() => document.getElementById("class-subject").focus(), 80);
}
function closeClassForm() {
    document.getElementById("class-form-modal").classList.add("hidden");
    document.body.classList.remove("modal-open");
}
function openTaskForm() {
    document.getElementById("task-form-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
    setTimeout(() => document.getElementById("task-title").focus(), 80);
}
function closeTaskForm() {
    document.getElementById("task-form-modal").classList.add("hidden");
    document.body.classList.remove("modal-open");
}
function addClassSchedule() {
    const subject = document.getElementById("class-subject").value.trim();
    const day = document.getElementById("class-day").value;
    const start = document.getElementById("class-start").value;
    const end = document.getElementById("class-end").value;
    const room = document.getElementById("class-room").value.trim();
    if (!subject || !start || !end) {
        showToast("Enter a subject and both class times.", "error");
        return;
    }
    if (end <= start) {
        showToast("The end time must be later than the start time.", "error");
        return;
    }
    classSchedule.push({
        id: Date.now(),
        subject,
        day,
        start,
        end,
        room
    });
    document.getElementById("class-subject").value = "";
    document.getElementById("class-start").value = "";
    document.getElementById("class-end").value = "";
    document.getElementById("class-room").value = "";
    saveData();
    renderClassSchedule();
    showToast("Class added to your timetable!");
}
// FORMAT CLASS TIME
function formatClassTime(value) {
    if (!value) return "";
    const [hour, minute] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
}
// DISPLAY WEEKLY CLASS SCHEDULE
function renderClassSchedule() {
    const container = document.getElementById("class-schedule-list");
    if (!container) return;
    const filter =
        document.getElementById("class-day-filter")?.value || "All";
    const days = filter === "All" ? plannerDays : [filter];
    container.innerHTML = days.map(day => {
        const entries = classSchedule
            .filter(item => item.day === day)
            .sort((a, b) => a.start.localeCompare(b.start));
        return `
            <section class="class-day-card">
                <div class="class-day-heading">
                    <h3>${day}</h3>
                    <span>
                        ${entries.length}
                        ${entries.length === 1 ? "class" : "classes"}
                    </span>
                </div>
                ${
                    entries.length
                    ? entries.map(item => `
                        <div class="class-entry">
                            <div class="class-time">
                                ${formatClassTime(item.start)}
                                <br>
                                – ${formatClassTime(item.end)}
                            </div>
                            <div class="class-details">
                                <strong>${escapeHTML(item.subject)}</strong>
                                <small>
                                    ${item.room
                                        ? escapeHTML(item.room)
                                        : "Room not specified"}
                                </small>
                            </div>
                            <button class="class-delete"
                                aria-label="Delete class"
                                onclick="deleteClassSchedule(${item.id})">
                                ✕
                            </button>
                        </div>
                    `).join("")
                    : `<p class="empty-state">No classes added for this day.</p>`
                }
            </section>
        `;
    }).join("");
}
// DELETE A CLASS
function deleteClassSchedule(id) {
    showConfirm(
        "Remove this class from your weekly timetable?",
        () => {
            classSchedule = classSchedule.filter(
                item => item.id !== id
            );
            saveData();
            renderClassSchedule();
            showToast("Class removed.");
        },
        "Delete class?",
        "🗑️",
        "Delete class"
    );
}
// ADD TASK, ASSIGNMENT, PLAN, OR GOAL
function addTask() {
    const title = document.getElementById("task-title").value.trim();
    const date = document.getElementById("task-date").value;
    const priority = document.getElementById("task-priority").value;
    const kind =
        document.getElementById("task-kind")?.value || "Task";
    if (!title || !date) {
        showToast("Please enter an item and its due date.", "error");
        return;
    }
    tasks.push({
        id: Date.now(),
        title,
        date,
        priority,
        kind,
        completed: false
    });
    document.getElementById("task-title").value = "";
    saveData();
    renderTasks();
    renderDashboard();
    showToast(`${kind} added successfully!`);
}
// DISPLAY TASKS AND GOALS
function renderTasks() {
    const container = document.getElementById("all-tasks");
    if (!container) return;
    const filter =
        document.getElementById("task-filter")?.value || "all";
    let visibleTasks = [...tasks];
    if (filter === "pending") {
        visibleTasks = visibleTasks.filter(task => !task.completed);
    }
    else if (filter === "completed") {
        visibleTasks = visibleTasks.filter(task => task.completed);
    }
    else if (["High", "Normal", "Low"].includes(filter)) {
        visibleTasks = visibleTasks.filter(
            task => task.priority === filter
        );
    }
    visibleTasks.sort((a, b) => a.date.localeCompare(b.date));
    if (!visibleTasks.length) {
        container.innerHTML = `
            <p class="empty-state">
                ${
                    tasks.length
                    ? "No items match this filter."
                    : "Nothing here yet. Add your first task, assignment, plan, or goal! 🌱"
                }
            </p>
        `;
        return;
    }
    container.innerHTML = visibleTasks.map(task => `
        <div class="task-item ${task.completed ? "completed" : ""}">
            <input class="task-check"
                type="checkbox"
                                aria-label="Complete ${escapeHTML(task.title)}"
                ${task.completed ? "checked" : ""}
                onchange="toggleTask(${task.id})">
            <div class="task-info">
                <strong>${escapeHTML(task.title)}</strong>
                <small>
                    ${escapeHTML(task.kind || "Task")}
                    · Due: ${escapeHTML(task.date)}
                </small>
            </div>
            <span class="priority ${escapeHTML(task.priority || "Normal")}">
                ${escapeHTML(task.priority || "Normal")}
            </span>
            <button class="delete-task"
                aria-label="Delete item"
                onclick="deleteTask(${task.id})">
                ✕
            </button>
        </div>
    `).join("");
}
// MARK TASK AS COMPLETED
function toggleTask(id) {
    const task = tasks.find(item => item.id === id);
    if (task) {
        task.completed = !task.completed;
    }
    saveData();
    renderTasks();
    renderDashboard();
}
// DELETE TASK
function deleteTask(id) {
    showConfirm(
        "This item will be permanently deleted. Are you sure?",
        () => {
            tasks = tasks.filter(task => task.id !== id);
            saveData();
            renderTasks();
            renderDashboard();
            showToast("Item deleted successfully!");
        },
        "Delete item?",
        "🗑️",
        "Delete item"
    );
}
// CUSTOM STUDY / BREAK TIMER
let timerSeconds = 25 * 60;
let selectedStudyMinutes = 25;
let selectedBreakMinutes = 10;
let timeIncrement = 1;
let timerInterval = null;
let timerRunning = false;
let timerPhase = "setup";
let audioContext = null;
let ambientOscillators = [];
function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    document.getElementById("timer-display").textContent = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}
function selectTimeIncrement(minutes) {
    timeIncrement = minutes;
    document.querySelectorAll(".time-increments button").forEach(button => button.classList.toggle("selected", Number(button.dataset.increment) === minutes));
}
function adjustStudyTime(direction) {
    selectedStudyMinutes = Math.max(1, Math.min(600, selectedStudyMinutes + direction * timeIncrement));
    document.getElementById("study-minutes-value").textContent = selectedStudyMinutes;
    document.getElementById("timer-display").textContent = String(selectedStudyMinutes).padStart(2, "0") + ":00";
}
function confirmStudyTime() {
    document.getElementById("study-time-setup").classList.add("hidden");
    document.getElementById("break-time-setup").classList.remove("hidden");
    document.getElementById("timer-phase-label").textContent = "CHOOSE YOUR BREAK";
    document.getElementById("timer-status").textContent = `Study for ${selectedStudyMinutes} minutes, then take a break.`;
    timerSeconds = selectedStudyMinutes * 60; updateTimerDisplay();
}
function chooseBreakTime(minutes) {
    selectedBreakMinutes = minutes;
    document.querySelectorAll(".break-options button").forEach(button => button.classList.toggle("selected", Number.parseInt(button.textContent, 10) === minutes));
}
function startAmbientSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContext) audioContext = new AudioCtx();
        if (audioContext.state === "suspended") audioContext.resume();
        if (ambientOscillators.length) return;
        [174.61, 220].forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = "sine"; oscillator.frequency.value = frequency;
            gain.gain.value = index === 0 ? 0.012 : 0.006;
            oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start();
            ambientOscillators.push({ oscillator, gain });
        });
    } catch (error) { console.warn("Background audio is unavailable.", error); }
}
function stopAmbientSound() {
    ambientOscillators.forEach(item => { try { item.gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.15); item.oscillator.stop(audioContext.currentTime + 0.6); } catch {} });
    ambientOscillators = [];
}
function playGentleChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContext) audioContext = new AudioCtx();
        if (audioContext.state === "suspended") audioContext.resume();
        [659.25, 783.99].forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
            oscillator.type = "sine"; oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.07, audioContext.currentTime + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.65 + index * 0.12);
            oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + 0.8 + index * 0.12);
        });
    } catch (error) { console.warn("Notification sound is unavailable.", error); }
}
function beginStudyLoop() {
    document.getElementById("break-time-setup").classList.add("hidden");
    document.getElementById("timer-controls").classList.remove("hidden");
    timerPhase = "study"; timerSeconds = selectedStudyMinutes * 60;
    document.getElementById("timer-phase-label").textContent = "FOCUS SESSION";
    document.getElementById("timer-status").textContent = "Your focus session is starting. You've got this!";
    document.getElementById("timer-start").textContent = "Pause";
    startAmbientSound(); runTimer();
}
function runTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerRunning = true;
    const startButton = document.getElementById("timer-start");
    if (startButton) startButton.textContent = "Pause";
    timerInterval = setInterval(() => {
        timerSeconds--; updateTimerDisplay();
        if (timerSeconds <= 0) {
            clearInterval(timerInterval); timerInterval = null; timerRunning = false;
            stopAmbientSound(); playGentleChime();
            if (timerPhase === "study") {
                timerPhase = "break"; timerSeconds = selectedBreakMinutes * 60;
                document.getElementById("timer-phase-label").textContent = "BREAK TIME ☕";
                document.getElementById("timer-status").textContent = `Great work! Relax for ${selectedBreakMinutes} minutes. The next study session starts automatically.`;
            } else {
                timerPhase = "study"; timerSeconds = selectedStudyMinutes * 60;
                document.getElementById("timer-phase-label").textContent = "FOCUS SESSION";
                document.getElementById("timer-status").textContent = "Break complete. Back to your studies!";
                startAmbientSound();
            }
            updateTimerDisplay();
            document.getElementById("timer-start").textContent = "Start next phase";
            showToast(timerPhase === "break" ? "Study time is over. Take a break!" : "Break is over. Focus time again!", "success");
            // Continue automatically after a short transition.
                        setTimeout(() => { if (timerPhase !== "finished") runTimer(); }, 1800);
        }
    }, 1000);
}
function startTimer() {
    if (timerRunning) {
        clearInterval(timerInterval); timerInterval = null; timerRunning = false;
        if (timerPhase === "study") stopAmbientSound();
        document.getElementById("timer-start").textContent = "Resume";
        document.getElementById("timer-status").textContent = "Timer paused";
    } else {
        if (timerPhase === "study") startAmbientSound();
        document.getElementById("timer-start").textContent = "Pause"; runTimer();
    }
}
function finishStudy() {
    clearInterval(timerInterval); timerInterval = null; timerRunning = false; timerPhase = "finished"; stopAmbientSound();
    document.getElementById("timer-controls").classList.add("hidden");
    document.getElementById("study-time-setup").classList.remove("hidden");
    document.getElementById("break-time-setup").classList.add("hidden");
    selectedStudyMinutes = 25; timeIncrement = 1;
    document.getElementById("study-minutes-value").textContent = "25";
    selectTimeIncrement(1); timerSeconds = 25 * 60; updateTimerDisplay();
    document.getElementById("timer-phase-label").textContent = "SET YOUR STUDY TIME";
    document.getElementById("timer-status").textContent = "Study session finished. Well done! 🌟";
    showToast("You finished your study session. Great job!", "success");
}
function resetTimer() { finishStudy(); }
// ======================================
// CUSTOM QUIZ MAKER
// ======================================
let activeCustomQuiz = null;
let typingQuestionIndex = 0;
let typingScore = 0;
let typingResults = [];
let answerChecked = false;
// QUIZ SCREEN NAVIGATION
function hideQuizScreens() {
    document.getElementById("quiz-home").classList.add("hidden");
    document.getElementById("quiz-creator").classList.add("hidden");
    document.getElementById("quiz-taking").classList.add("hidden");
    document.getElementById("custom-quiz-result").classList.add("hidden");
}
function openQuizCreator() {
    hideQuizScreens();
    document.getElementById("quiz-creator").classList.remove("hidden");
    document.body.classList.add("modal-open");
    document.getElementById("custom-quiz-title").value = "";
    document.getElementById("custom-quiz-subject").value = "";
    document.getElementById("question-builder").innerHTML = "";
    addQuestionField();
}
function closeQuizCreator() {
    hideQuizScreens();
    document.getElementById("quiz-home").classList.remove("hidden");
    document.body.classList.remove("modal-open");
}
function exitQuiz() {
    hideQuizScreens();
    document.getElementById("quiz-home").classList.remove("hidden");
    activeCustomQuiz = null;
    renderCustomQuizzes();
    renderDashboard();
}
// QUESTION BUILDER
function addQuestionField() {
    const container = document.getElementById("question-builder");
    const questionNumber = container.children.length + 1;
    const questionBox = document.createElement("div");
    questionBox.className = "question-builder-item";
    questionBox.innerHTML = `
        <div class="question-builder-top">
            <strong>Question ${questionNumber}</strong>
            <button type="button"
                class="remove-question"
                onclick="removeQuestionField(this)">
                ✕ Remove
            </button>
        </div>
        <textarea
            class="builder-question"
            placeholder="Type your question here..."
            required></textarea>
        <input
            type="text"
            class="builder-answer"
            placeholder="Enter the correct answer..."
            required>
    `;
    container.appendChild(questionBox);
    updateQuestionCounter();
    questionBox.querySelector(".builder-question").focus();
}
function removeQuestionField(button) {
    const container = document.getElementById("question-builder");
    if (container.children.length <= 1) {
        showToast("A quiz needs at least one question!", "error");
        return;
    }
    button.closest(".question-builder-item").remove();
    renumberQuestions();
}
function renumberQuestions() {
    const items = document.querySelectorAll(".question-builder-item");
    items.forEach((item, index) => {
        item.querySelector("strong").textContent =
            `Question ${index + 1}`;
    });
    updateQuestionCounter();
}
function updateQuestionCounter() {
    const count =
        document.querySelectorAll(".question-builder-item").length;
    document.getElementById("question-counter").textContent =
        `${count} ${count === 1 ? "Question" : "Questions"}`;
}
// SAVE CUSTOM QUIZ
function saveCustomQuiz() {
    const title = document.getElementById("custom-quiz-title").value.trim();
    const subject = document.getElementById("custom-quiz-subject").value.trim();
    const questionItems = document.querySelectorAll(".question-builder-item");
    if (!title || !subject) {
        showToast("Please enter a quiz title and subject!", "error");
        return;
    }
    const questions = [];
    for (const item of questionItems) {
        const question = item.querySelector(".builder-question").value.trim();
        const answer = item.querySelector(".builder-answer").value.trim();
        if (!question || !answer) {
            showToast("Please complete every question and its correct answer!", "error");
            return;
        }
        questions.push({ question, answer });
    }
    if (questions.length === 0) {
        showToast("Please add at least one question!", "error");
        return;
    }
    const newQuiz = {
        id: Date.now(),
        title,
        subject,
        questions,
        createdAt: new Date().toLocaleDateString()
    };
    customQuizzes.unshift(newQuiz);
    saveData();
    showToast("Your quiz has been successfully created! 🎉", "success");
    closeQuizCreator();
    renderCustomQuizzes();
    renderDashboard();
}
// DISPLAY CREATED QUIZZES
function renderCustomQuizzes() {
    const container = document.getElementById("custom-quiz-container");
    if (customQuizzes.length === 0) {
        container.innerHTML = `
            <div class="quiz-empty">
                <div class="quiz-empty-icon">📖</div>
                <h3>No quizzes yet!</h3>
                <p>Create your first quiz and start practicing.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = customQuizzes.map(quiz => `
        <div class="custom-quiz-card">
            <div class="custom-quiz-card-top">
                <div class="custom-quiz-icon">🧠</div>
                <span class="quiz-card-subject">
                    ${escapeHTML(quiz.subject)}
                </span>
            </div>
            <h3>${escapeHTML(quiz.title)}</h3>
            <p>
                ${quiz.questions.length}
                ${quiz.questions.length === 1 ? "Question" : "Questions"}
                · Created ${escapeHTML(quiz.createdAt || "")}
            </p>
            <div class="quiz-card-actions">
                <button class="quiz-play-button"
                    onclick="startCustomQuiz(${quiz.id})">
                    Start Quiz →
                </button>
                <button class="quiz-delete-button"
                    aria-label="Delete quiz"
                    onclick="deleteCustomQuiz(${quiz.id})">
                    ✕
                </button>
            </div>
        </div>
    `).join("");
}
// CUSTOM CONFIRMATION FOR DELETING QUIZZES
function deleteCustomQuiz(id) {
    showConfirm(
        "This quiz will be permanently deleted. Are you sure?",
        () => {
            customQuizzes = customQuizzes.filter(
                quiz => quiz.id !== id
            );
            localStorage.setItem(
                "stud_custom_quizzes",
                JSON.stringify(customQuizzes)
            );
            renderCustomQuizzes();
            renderDashboard();
            showToast("Quiz deleted successfully!");
        },
        "Delete this quiz?",
        "🗑️",
        "Delete quiz"
    );
}
// START QUIZ
function startCustomQuiz(id) {
    const quiz = customQuizzes.find(item => item.id === id);
    if (!quiz) return;
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        showToast("This quiz has no questions.", "error");
        return;
    }
    activeCustomQuiz = quiz;
    typingQuestionIndex = 0;
    typingScore = 0;
    typingResults = [];
    answerChecked = false;
    hideQuizScreens();
    document.getElementById("quiz-taking").classList.remove("hidden");
    document.getElementById("taking-quiz-title").textContent = quiz.title;
    document.getElementById("taking-quiz-subject").textContent = quiz.subject;
    showTypingQuestion();
}
// DISPLAY EACH QUESTION
function showTypingQuestion() {
    const question = activeCustomQuiz.questions[typingQuestionIndex];
    answerChecked = false;
    const area = document.getElementById("typing-question-area");
    // Restart the entrance animation
    area.style.animation = "none";
    void area.offsetWidth;
    area.style.animation = "questionEnter 0.45s ease";
    document.getElementById("typing-question-counter").textContent =
        `Question ${typingQuestionIndex + 1} of ${activeCustomQuiz.questions.length}`;
    document.getElementById("typing-progress-bar").style.width =
        ((typingQuestionIndex / activeCustomQuiz.questions.length) * 100) + "%";
    document.getElementById("typing-question-number").textContent =
        `QUESTION ${String(typingQuestionIndex + 1).padStart(2, "0")}`;
    document.getElementById("typing-question").textContent = question.question;
    const answerInput = document.getElementById("typed-answer");
    answerInput.value = "";
    answerInput.disabled = false;
    document.getElementById("typing-feedback").textContent = "";
    document.getElementById("check-answer-button").classList.remove("hidden");
    document.getElementById("next-typing-question").classList.add("hidden");
    answerInput.focus();
}
// CHECK TYPED ANSWER
function normalizeAnswer(answer) {
    return answer
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}
function checkTypedAnswer() {
    if (answerChecked) return;
    const input = document.getElementById("typed-answer");
    const studentAnswer = input.value.trim();
    if (!studentAnswer) {
        showToast("Please type your answer first!", "error");
        input.focus();
        return;
    }
    const question = activeCustomQuiz.questions[typingQuestionIndex];
    const correct =
        normalizeAnswer(studentAnswer) === normalizeAnswer(question.answer);
    answerChecked = true;
    if (correct) {
        typingScore++;
        document.getElementById("typing-feedback").textContent =
            "✓ Correct! Excellent work! 🎉";
        document.getElementById("typing-feedback").style.color = "#55a879";
    } else {
        document.getElementById("typing-feedback").textContent =
            `✗ Not quite! Correct answer: ${question.answer}`;
        document.getElementById("typing-feedback").style.color = "#d46c6c";
    }
    typingResults.push({
        question: question.question,
        studentAnswer,
        correctAnswer: question.answer,
        correct
    });
    input.disabled = true;
    document.getElementById("check-answer-button").classList.add("hidden");
    const nextButton = document.getElementById("next-typing-question");
    nextButton.classList.remove("hidden");
    nextButton.textContent =
        typingQuestionIndex === activeCustomQuiz.questions.length - 1
            ? "Finish Quiz ✓"
            : "Next Question →";
}
// NEXT QUESTION
function nextTypingQuestion() {
    if (!answerChecked) return;
    typingQuestionIndex++;
    if (typingQuestionIndex < activeCustomQuiz.questions.length) {
        showTypingQuestion();
    } else {
        showCustomQuizResult();
    }
}
// QUIZ RESULTS
function showCustomQuizResult() {
    hideQuizScreens();
    document.getElementById("custom-quiz-result").classList.remove("hidden");
    const total = activeCustomQuiz.questions.length;
    const percentage = Math.round((typingScore / total) * 100);
    document.getElementById("typing-progress-bar").style.width = "100%";
    document.getElementById("custom-result-percentage").textContent =
        percentage + "%";
    document.getElementById("custom-result-score").textContent =
        `${typingScore} out of ${total} correct`;
    let message;
    if (percentage === 100) {
        message = "Perfect score! You mastered this quiz! 🏆";
    } else if (percentage >= 80) {
        message = "Amazing work! You're doing really well! 🌟";
    } else if (percentage >= 60) {
        message = "Good job! A little more practice will help! 💪";
    } else {
        message = "Don't give up! Review your lessons and try again! 🌱";
    }
    document.getElementById("custom-result-message").textContent = message;
    const reviewContainer = document.getElementById("answer-review-list");
    reviewContainer.innerHTML = typingResults.map((result, index) => `
        <div class="review-item ${result.correct ? "review-correct" : "review-wrong"}">
            <strong>
                ${result.correct ? "✓" : "✗"}
                Question ${index + 1}: ${escapeHTML(result.question)}
            </strong>
            <p>Your answer: ${escapeHTML(result.studentAnswer)}</p>
            <p>Correct answer: ${escapeHTML(result.correctAnswer)}</p>
            <p>${result.correct ? "Correct answer!" : "Needs improvement"}</p>
        </div>
    `).join("");
    quizAttempts++;
    saveData();
    renderDashboard();
}
// RETRY QUIZ
function retryCustomQuiz() {
    if (activeCustomQuiz) {
        startCustomQuiz(activeCustomQuiz.id);
    }
}
// ======================================
// THEME CUSTOMIZATION
// ======================================
const themes = {
    "#e98a45": {
        dark: "#bd642c",
        light: "#fff0e3",
        sidebar: "#ad572b"
    },
    "#e8799b": {
        dark: "#bd5275",
        light: "#fff0f5",
        sidebar: "#a94368"
    },
    "#8b83d9": {
        dark: "#625bb2",
        light: "#f0efff",
        sidebar: "#50499d"
    },
    "#55a9a0": {
        dark: "#327f77",
        light: "#e8f8f5",
        sidebar: "#286d66"
    },
    "#6595d5": {
        dark: "#4775b0",
        light: "#edf4ff",
        sidebar: "#385f96"
    },
    "#78a66b": {
        dark: "#507e48",
        light: "#eff8eb",
        sidebar: "#416b3c"
    }
};
function applyTheme(color) {
    const theme = themes[color];
    if (!theme) return;
    document.documentElement.style.setProperty("--primary", color);
    document.documentElement.style.setProperty("--primary-dark", theme.dark);
    document.documentElement.style.setProperty("--primary-light", theme.light);
        document.documentElement.style.setProperty("--sidebar", theme.sidebar);
    localStorage.setItem("stud_theme", color);
    document.querySelectorAll(".color-choice").forEach(button => {
        button.classList.toggle(
            "selected",
            button.dataset.color === color
        );
    });
}
document.querySelectorAll(".color-choice").forEach(button => {
    button.addEventListener("click", () => {
        applyTheme(button.dataset.color);
    });
});
// CLEAR SAVED DATA WITH CUSTOM CONFIRMATION
function clearData() {
    showConfirm(
        "This will permanently delete all your saved notes, tasks, quizzes, and quiz history. This action cannot be undone.",
        () => {
            notes = [];
            tasks = [];
            classSchedule = [];
            quizAttempts = 0;
            customQuizzes = [];
            saveData();
            renderDashboard();
            renderNotes();
            renderTasks();
            renderClassSchedule();
            renderCustomQuizzes();
            showToast("Your saved data has been cleared!");
        },
        "Clear all saved data?",
        "⚠️",
        "Yes, clear everything"
    );
}
// ======================================
// CUSTOM CONFIRMATION SYSTEM
// ======================================
let confirmCallback = null;
function showConfirm(
    message,
    onConfirm,
    title = "Are you sure?",
    icon = "⚠️",
    buttonText = "Yes, continue"
) {
    const modal = document.getElementById("confirmModal");
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;
    document.getElementById("confirmIcon").textContent = icon;
    document.getElementById("confirmAccept").textContent = buttonText;
    confirmCallback = onConfirm;
    modal.classList.add("active");
}
function closeConfirm() {
    document.getElementById("confirmModal").classList.remove("active");
    confirmCallback = null;
}
document.getElementById("confirmCancel").addEventListener("click", closeConfirm);
document.getElementById("confirmAccept").addEventListener("click", () => {
    const callback = confirmCallback;
    closeConfirm();
    if (callback) callback();
});
document.getElementById("confirmModal").addEventListener("click", event => {
    if (event.target.id === "confirmModal") {
        closeConfirm();
    }
});
// CLOSE CONFIRMATION WITH ESCAPE KEY
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeConfirm();
    }
});
// ======================================
// INITIALIZE WEBSITE
// ======================================
function initializeStud() {
    updateDate();
    const savedTheme = localStorage.getItem("stud_theme") || "#e98a45";
    applyTheme(savedTheme);
    renderDashboard();
    renderCollections();
    renderNotes();
    renderTasks();
    renderClassSchedule();
    renderCustomQuizzes();
    document.getElementById("note-search").addEventListener("input", renderNotes);
    updateTimerDisplay();
    showPage("dashboard");
}
// ======================================
// STUD NOTIFICATION SYSTEM
// ======================================
function showToast(message, type = "success") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        container.setAttribute("aria-live", "polite");
        container.setAttribute("aria-atomic", "true");
        document.body.appendChild(container);
    }
    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ"
    };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.textContent = icons[type] || icons.success;
    const text = document.createElement("span");
    text.className = "toast-message";
    text.textContent = message;
    toast.append(icon, text);
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 250);
    }, 3000);
}
initializeStud();