/* ===========================================================
   Easy Strength v2 — app logic
   - vanilla JS, no deps
   - state in localStorage
   - 3 views: today (run), history, print
   =========================================================== */

(() => {
"use strict";

// ===========================================================
// EXERCISE LIBRARY
// Categories define what can swap with what.
// "current modalities + cable machine" per the spec.
// ===========================================================
const EXERCISE_LIBRARY = {
  // ---- horizontal-push (chest press patterns) ----
  "Chest Press":         { category: "horizontal-push", variants: ["Flat", "Incline"] },
  "Chest Flies":         { category: "horizontal-push", variants: ["Flat", "Incline"] },
  "Cable Chest Press":   { category: "horizontal-push", variants: ["Flat", "Incline", "Single-arm"] },
  "Cable Chest Fly":     { category: "horizontal-push", variants: ["High to Low", "Low to High", "Mid"] },
  "Push-up":             { category: "horizontal-push", variants: ["Bodyweight", "Weighted", "Decline"] },

  // ---- vertical-push (overhead press patterns) ----
  "Shoulder Press":      { category: "vertical-push",   variants: ["Standing", "Sitting", "Kneeling (one leg)"] },
  "Cable Overhead Press":{ category: "vertical-push",   variants: ["Standing", "Half-kneeling"] },
  "Push Press":          { category: "vertical-push",   variants: ["Dumbbell", "Kettlebell"] },

  // ---- shoulder-isolation (lateral / rear delt) ----
  "Lat Raise":           { category: "shoulder-iso",    variants: ["Band — Standing", "Band — Kneeling", "Dumbbell — Standing", "Dumbbell — Kneeling"] },
  "Cable Lateral Raise": { category: "shoulder-iso",    variants: ["Standing", "Single-arm"] },
  "Cable Rear Delt Fly": { category: "shoulder-iso",    variants: ["Standing", "Single-arm"] },

  // ---- horizontal-pull (rows) ----
  "Bent Over Row":       { category: "horizontal-pull", variants: ["Kettlebell", "Dumbbell", "Sandbag"] },
  "One-Arm Row":         { category: "horizontal-pull", variants: ["Kettlebell", "Dumbbell"] },
  "Cable Row":           { category: "horizontal-pull", variants: ["Wide grip", "Close grip", "Single-arm"] },

  // ---- vertical-pull (pull-ups / pulldowns) ----
  "Pull Ups":            { category: "vertical-pull",   variants: ["Strict", "Assisted", "Chin-up", "Neutral"] },
  "Cable Lat Pulldown":  { category: "vertical-pull",   variants: ["Wide grip", "Close grip", "Neutral"] },

  // ---- triceps ----
  "Triceps":             { category: "triceps",         variants: ["Extension", "Press"] },
  "Cable Tricep Pushdown":{ category: "triceps",        variants: ["Rope", "Bar", "Single-arm"] },
  "Cable Overhead Tricep":{ category: "triceps",        variants: ["Rope", "Single-arm"] },

  // ---- biceps ----
  "Biceps":              { category: "biceps",          variants: ["Curl", "Hammer Curl", "Concentration"] },
  "Cable Curl":          { category: "biceps",          variants: ["Bar", "Rope", "Single-arm"] },

  // ---- squat (quad-dominant) ----
  "Squats":              { category: "squat",           variants: ["Kettlebells", "Dumbbells", "Sandbags"] },
  "Goblet Squat":        { category: "squat",           variants: ["Kettlebell", "Dumbbell"] },
  "Reverse Lunge":       { category: "squat",           variants: ["Dumbbell", "Kettlebells"] },
  "Cable Squat":         { category: "squat",           variants: ["Goblet style", "Belt squat"] },

  // ---- hinge (posterior chain) ----
  "Deadlifts":           { category: "hinge",           variants: ["Kettlebells", "Dumbbells", "Sandbags"] },
  "Single-Leg Deadlift": { category: "hinge",           variants: ["Dumbbell", "Kettlebells"] },
  "Cable Pull-Through":  { category: "hinge",           variants: ["Standard", "Single-leg"] },
  "Cable RDL":           { category: "hinge",           variants: ["Standard", "Single-leg"] },

  // ---- hold (hangs / isometrics) ----
  "Hangs":               { category: "hold",            variants: [], repsLabel: "20–30 sec" },
};

// ===========================================================
// ROUTINES — slot definitions
// Each slot has a category constraint and a default exercise.
// ===========================================================
const ROUTINES = {
  force: {
    id: "force",
    name: "Workout One",
    focus: "Force",
    warmup: ["Farmer's Carries", "Face Pulls", "Rotator Cuff"],
    slots: [
      { category: "horizontal-push", default: "Chest Press",    reps: "7", sets: 3 },
      { category: "squat",           default: "Squats",         reps: "7", sets: 3 },
      { category: "vertical-push",   default: "Shoulder Press", reps: "7", sets: 3 },
      { category: "hinge",           default: "Deadlifts",      reps: "7", sets: 3 },
      { category: "hold",            default: "Hangs",          reps: "20–30 sec", sets: 3 },
      { category: "horizontal-pull", default: "Bent Over Row",  reps: "7", sets: 3 },
      { category: "triceps",         default: "Triceps",        reps: "7", sets: 3 },
    ],
  },
  finesse: {
    id: "finesse",
    name: "Workout Two",
    focus: "Finesse",
    warmup: ["Suitcase Carries", "World's Greatest Stretch"],
    slots: [
      { category: "horizontal-push", default: "Chest Flies",         reps: "7", sets: 3 },
      { category: "shoulder-iso",    default: "Lat Raise",           reps: "7", sets: 3 },
      { category: "hinge",           default: "Single-Leg Deadlift", reps: "7", sets: 3 },
      { category: "squat",           default: "Reverse Lunge",       reps: "7", sets: 3 },
      { category: "vertical-pull",   default: "Pull Ups",            reps: "7", sets: 3 },
      { category: "biceps",          default: "Biceps",              reps: "7", sets: 3 },
    ],
  },
};

// ===========================================================
// STORAGE
// ===========================================================
const STORAGE_KEYS = {
  active: "es.activeSession",
  history: "es.history",
};

function loadActive() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.active);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveActive(session) {
  if (session === null) {
    localStorage.removeItem(STORAGE_KEYS.active);
  } else {
    localStorage.setItem(STORAGE_KEYS.active, JSON.stringify(session));
  }
}
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHistory(arr) {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(arr));
}

// ===========================================================
// STATE
// ===========================================================
const state = {
  view: "today",
  routineDraft: null,         // routine id selected on the start panel
  draftDate: todayISO(),
  draftLocation: "",
  active: loadActive(),       // active in-progress session, or null
  history: loadHistory(),
  editingSlotId: null,        // index into active.exercises during modal edit
  historyDetailId: null,
};

// ===========================================================
// HELPERS
// ===========================================================
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const mon = dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${day} · ${mon} ${d}, ${y}`;
}
function exercisesInCategory(cat) {
  return Object.entries(EXERCISE_LIBRARY)
    .filter(([, info]) => info.category === cat)
    .map(([name, info]) => ({ name, ...info }));
}
function elt(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(e.dataset, v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

// ===========================================================
// VIEW SWITCHING
// ===========================================================
function showView(name) {
  state.view = name;
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  if (name === "history-detail") {
    document.getElementById("view-history-detail").classList.remove("hidden");
  } else {
    document.getElementById(`view-${name}`).classList.remove("hidden");
  }
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.view === (name === "history-detail" ? "history" : name));
  });
  // Render the view
  if (name === "today") renderToday();
  else if (name === "history") renderHistory();
  else if (name === "history-detail") renderHistoryDetail();
  else if (name === "print") renderPrintView();
}

// ===========================================================
// TODAY VIEW
// ===========================================================
function renderToday() {
  const empty = document.getElementById("emptyState");
  const run = document.getElementById("runState");
  if (state.active) {
    empty.classList.add("hidden");
    run.classList.remove("hidden");
    renderRunView();
  } else {
    empty.classList.remove("hidden");
    run.classList.add("hidden");
    renderEmptyState();
  }
  renderTopbarRight();
}

function renderTopbarRight() {
  const el = document.getElementById("topbarRight");
  if (state.active) {
    const r = ROUTINES[state.active.routineId];
    el.textContent = `${r.focus} · IN PROGRESS`;
  } else {
    el.textContent = formatDate(todayISO());
  }
}

function renderEmptyState() {
  const picker = document.getElementById("routinePicker");
  picker.innerHTML = "";
  Object.values(ROUTINES).forEach(r => {
    const btn = elt("button", {
      class: state.routineDraft === r.id ? "selected" : "",
      onclick: () => {
        state.routineDraft = r.id;
        renderEmptyState();
        validateStart();
      },
    }, [
      elt("div", { class: "name" }, r.name),
      elt("div", { class: "focus" }, r.focus),
    ]);
    picker.appendChild(btn);
  });

  document.getElementById("newSessionDate").value = state.draftDate;
  document.getElementById("newSessionLocation").value = state.draftLocation;
  validateStart();
}

function validateStart() {
  document.getElementById("startBtn").disabled = !state.routineDraft;
}

function startSession() {
  if (!state.routineDraft) return;
  const r = ROUTINES[state.routineDraft];
  const session = {
    id: `s_${Date.now()}`,
    routineId: r.id,
    date: state.draftDate,
    location: state.draftLocation,
    startedAt: new Date().toISOString(),
    exercises: r.slots.map(slot => {
      const lib = EXERCISE_LIBRARY[slot.default];
      return {
        slotCategory: slot.category,
        name: slot.default,
        variant: lib.variants.length ? lib.variants[0] : "",
        reps: slot.reps,
        sets: slot.sets,
        setLog: new Array(slot.sets).fill(false),
        weight: "",
        notes: "",
      };
    }),
  };
  state.active = session;
  saveActive(session);
  renderToday();
}

function renderRunView() {
  const a = state.active;
  const r = ROUTINES[a.routineId];

  document.getElementById("runName").textContent = r.name;
  document.getElementById("runFocus").textContent = r.focus.toUpperCase();
  const loc = (a.location || "").trim();
  const meta = loc ? `${formatDate(a.date)}  ·  ${loc.toUpperCase()}` : formatDate(a.date);
  document.getElementById("runMeta").textContent = meta;

  // Warmup
  const wlist = document.getElementById("warmupList");
  wlist.innerHTML = "";
  r.warmup.forEach(item => wlist.appendChild(elt("li", {}, item)));
  document.getElementById("warmupSummary").textContent = `${r.warmup.length} item${r.warmup.length === 1 ? "" : "s"}`;

  // Exercises
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";
  a.exercises.forEach((ex, idx) => list.appendChild(renderExerciseCard(ex, idx)));

  // Completion meter
  const totalSets = a.exercises.reduce((s, ex) => s + ex.sets, 0);
  const doneSets = a.exercises.reduce((s, ex) => s + ex.setLog.filter(Boolean).length, 0);
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;
  document.getElementById("meterFill").style.width = `${pct}%`;
  document.getElementById("meterLabel").textContent = `${doneSets} of ${totalSets} sets complete · ${pct}%`;
}

function renderExerciseCard(ex, idx) {
  const allDone = ex.setLog.length > 0 && ex.setLog.every(Boolean);
  const card = elt("div", { class: `exercise-card ${allDone ? "complete" : ""}` });

  // Top row: name + reps
  const nameBlock = elt("div", { class: "ex-name-block", onclick: () => openEditModal(idx) }, [
    elt("div", { class: "ex-name" }, ex.name),
    ex.variant ? elt("div", { class: "ex-variant" }, ex.variant) : null,
    elt("div", { class: "ex-name-tap-hint" }, "Tap to swap or edit"),
  ].filter(Boolean));
  const repsBlock = elt("div", { class: "ex-reps" }, ex.reps);
  card.appendChild(elt("div", { class: "ex-card-top" }, [nameBlock, repsBlock]));

  // Set checkboxes
  const setRow = elt("div", { class: "ex-set-row" });
  for (let i = 0; i < ex.sets; i++) {
    const isDone = !!ex.setLog[i];
    const cb = elt("button", {
      class: `set-checkbox ${isDone ? "done" : ""}`,
      "aria-label": `Set ${i + 1}`,
      onclick: () => toggleSet(idx, i),
    }, isDone ? "✓" : String(i + 1));
    setRow.appendChild(cb);
  }
  card.appendChild(setRow);

  // Weight + notes
  const weightInput = elt("input", {
    type: "text",
    inputmode: "decimal",
    placeholder: "—",
    value: ex.weight || "",
    oninput: (e) => updateExercise(idx, { weight: e.target.value }),
  });
  const notesInput = elt("input", {
    type: "text",
    placeholder: "—",
    value: ex.notes || "",
    oninput: (e) => updateExercise(idx, { notes: e.target.value }),
  });
  const inputRow = elt("div", { class: "ex-input-row" }, [
    elt("div", {}, [
      elt("label", {}, "Weight / Resistance"),
      weightInput,
    ]),
    elt("div", {}, [
      elt("label", {}, "Notes"),
      notesInput,
    ]),
  ]);
  card.appendChild(inputRow);

  return card;
}

function toggleSet(exIdx, setIdx) {
  const ex = state.active.exercises[exIdx];
  ex.setLog[setIdx] = !ex.setLog[setIdx];
  saveActive(state.active);
  renderRunView();
}

function updateExercise(exIdx, patch) {
  Object.assign(state.active.exercises[exIdx], patch);
  saveActive(state.active);
  // Don't re-render entire view on text input — just save
}

// ===========================================================
// EDIT MODAL (swap exercise / change variant / reps / sets)
// ===========================================================
function openEditModal(exIdx) {
  state.editingSlotId = exIdx;
  const ex = state.active.exercises[exIdx];
  const exSelect = document.getElementById("editExercise");
  exSelect.innerHTML = "";
  exercisesInCategory(ex.slotCategory).forEach(opt => {
    const o = elt("option", { value: opt.name }, opt.name);
    if (opt.name === ex.name) o.selected = true;
    exSelect.appendChild(o);
  });
  populateVariantSelect(ex.name, ex.variant);
  exSelect.onchange = () => {
    const newName = exSelect.value;
    const lib = EXERCISE_LIBRARY[newName];
    populateVariantSelect(newName, lib.variants[0] || "");
    // If exercise has a default reps label (e.g. Hangs), seed the reps input
    if (lib.repsLabel) document.getElementById("editReps").value = lib.repsLabel;
  };
  document.getElementById("editReps").value = ex.reps;
  document.getElementById("editSets").value = ex.sets;
  showModal("exerciseEditModal");
}

function populateVariantSelect(exName, current) {
  const variantSel = document.getElementById("editVariant");
  variantSel.innerHTML = "";
  const lib = EXERCISE_LIBRARY[exName];
  if (!lib.variants.length) {
    variantSel.appendChild(elt("option", { value: "" }, "— none —"));
    variantSel.disabled = true;
  } else {
    variantSel.disabled = false;
    lib.variants.forEach(v => {
      const o = elt("option", { value: v }, v);
      if (v === current) o.selected = true;
      variantSel.appendChild(o);
    });
  }
}

function saveEdit() {
  const exIdx = state.editingSlotId;
  if (exIdx == null) return;
  const ex = state.active.exercises[exIdx];
  const newName = document.getElementById("editExercise").value;
  const newVariant = document.getElementById("editVariant").value;
  const newReps = document.getElementById("editReps").value.trim() || ex.reps;
  const newSets = Math.max(1, Math.min(10, parseInt(document.getElementById("editSets").value, 10) || ex.sets));

  ex.name = newName;
  ex.variant = newVariant;
  ex.reps = newReps;
  // If sets changed, resize the setLog (preserve existing booleans, add false for new)
  if (newSets !== ex.sets) {
    const newLog = new Array(newSets).fill(false);
    for (let i = 0; i < Math.min(ex.setLog.length, newSets); i++) newLog[i] = ex.setLog[i];
    ex.setLog = newLog;
    ex.sets = newSets;
  }
  saveActive(state.active);
  state.editingSlotId = null;
  hideModal("exerciseEditModal");
  renderRunView();
}

// ===========================================================
// FINISH / DISCARD
// ===========================================================
function finishWorkout() {
  showConfirm({
    title: "Finish workout?",
    body: "This moves the session to History. You can't add more sets after finishing.",
    okLabel: "Finish",
    onOk: () => {
      const completed = {
        ...state.active,
        completedAt: new Date().toISOString(),
      };
      const hist = loadHistory();
      hist.unshift(completed);
      saveHistory(hist);
      state.history = hist;
      state.active = null;
      saveActive(null);
      // Reset draft for next session
      state.routineDraft = null;
      state.draftDate = todayISO();
      state.draftLocation = "";
      renderToday();
    },
  });
}

function discardWorkout() {
  showConfirm({
    title: "Discard this session?",
    body: "All progress will be lost. This can't be undone.",
    okLabel: "Discard",
    onOk: () => {
      state.active = null;
      saveActive(null);
      state.routineDraft = null;
      renderToday();
    },
  });
}

// ===========================================================
// HISTORY VIEW
// ===========================================================
function renderHistory() {
  const list = document.getElementById("historyList");
  const empty = document.getElementById("historyEmpty");
  const count = document.getElementById("historyCount");
  list.innerHTML = "";
  state.history = loadHistory();

  if (!state.history.length) {
    empty.classList.remove("hidden");
    count.textContent = "";
    return;
  }
  empty.classList.add("hidden");
  count.textContent = `${state.history.length} session${state.history.length === 1 ? "" : "s"} logged`;

  state.history.forEach(s => {
    const r = ROUTINES[s.routineId];
    const totalSets = s.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const doneSets = s.exercises.reduce((sum, ex) => sum + ex.setLog.filter(Boolean).length, 0);
    const card = elt("div", { class: "history-card", onclick: () => openHistoryDetail(s.id) }, [
      elt("div", { class: "history-card-top" }, [
        elt("span", { class: "history-date" }, formatDate(s.date)),
        elt("span", { class: "history-routine" }, r ? `${r.name} · ${r.focus}` : "Workout"),
      ]),
      elt("div", { class: "history-summary" }, `${s.exercises.length} exercises · ${doneSets} of ${totalSets} sets complete`),
    ]);
    list.appendChild(card);
  });
}

function openHistoryDetail(sessionId) {
  state.historyDetailId = sessionId;
  showView("history-detail");
}

function renderHistoryDetail() {
  const s = state.history.find(h => h.id === state.historyDetailId);
  const c = document.getElementById("historyDetail");
  c.innerHTML = "";
  if (!s) {
    c.appendChild(elt("p", { class: "muted" }, "Session not found."));
    return;
  }
  const r = ROUTINES[s.routineId];

  // Header
  c.appendChild(elt("div", { class: "view-header" }, [
    elt("h1", {}, r ? r.name : "Workout"),
    elt("p", { class: "muted" }, `${formatDate(s.date)}${s.location ? "  ·  " + s.location.toUpperCase() : ""}  ·  ${r ? r.focus : ""}`),
  ]));

  // Exercise list
  const section = elt("div", { class: "detail-section" });
  s.exercises.forEach(ex => {
    const done = ex.setLog.filter(Boolean).length;
    const stats = `${done}/${ex.sets} × ${ex.reps}`;
    section.appendChild(elt("div", { class: "detail-ex-row" }, [
      elt("div", {}, [
        elt("div", { class: "detail-ex-name" }, ex.name + (ex.variant ? "" : "")),
        ex.variant ? elt("div", { class: "detail-ex-variant" }, ex.variant) : null,
        ex.notes ? elt("div", { class: "detail-ex-variant" }, "Note: " + ex.notes) : null,
      ].filter(Boolean)),
      elt("div", { class: "detail-ex-stats" }, [
        elt("div", {}, stats),
        elt("div", { class: "detail-ex-weight" }, ex.weight ? ex.weight : "—"),
      ]),
    ]));
  });
  c.appendChild(section);

  // Delete button
  const del = elt("button", {
    class: "btn btn-secondary",
    style: "margin-top:16px;width:100%;",
    onclick: () => {
      showConfirm({
        title: "Delete session?",
        body: "This permanently removes the session from history.",
        okLabel: "Delete",
        onOk: () => {
          state.history = state.history.filter(h => h.id !== s.id);
          saveHistory(state.history);
          showView("history");
        },
      });
    },
  }, "Delete Session");
  c.appendChild(del);
}

// ===========================================================
// PRINT VIEW
// ===========================================================
function renderPrintView() {
  const sel = document.getElementById("printSource");
  sel.innerHTML = "";
  if (state.active) {
    sel.appendChild(elt("option", { value: "active" }, "Active session (in progress)"));
  }
  state.history.forEach(s => {
    const r = ROUTINES[s.routineId];
    sel.appendChild(elt("option", { value: s.id }, `${formatDate(s.date)} — ${r ? r.name : "Workout"}`));
  });
  if (!sel.options.length) {
    sel.appendChild(elt("option", { value: "" }, "No sessions available"));
    document.getElementById("printBtn").disabled = true;
  } else {
    document.getElementById("printBtn").disabled = false;
  }
  sel.onchange = renderPrintPreview;
  renderPrintPreview();
}

function renderPrintPreview() {
  const sel = document.getElementById("printSource");
  const val = sel.value;
  let session = null;
  if (val === "active") session = state.active;
  else session = state.history.find(h => h.id === val);
  const preview = document.getElementById("printPreview");
  preview.innerHTML = "";
  if (!session) return;
  preview.appendChild(buildSheet(session));
  // Show preview always (CSS hides only .print-preview by default for screens? we want it visible)
  preview.style.display = "block";
}

function buildSheet(session) {
  const r = ROUTINES[session.routineId];
  const sheet = elt("div", { class: "sheet" });

  // Title
  const titleRow = elt("div", { class: "title-row" });
  titleRow.appendChild(elt("h1", {}, "Easy Strength"));
  const meta = elt("div", { class: "sub-meta" });
  meta.appendChild(elt("span", {}, [elt("span", { class: "focus-pill" }, `${(r ? r.name : "").toUpperCase()} · ${(r ? r.focus : "").toUpperCase()}`)]));
  meta.appendChild(elt("span", {}, `${formatDate(session.date)}${session.location ? "  ·  " + session.location.toUpperCase() : ""}`));
  titleRow.appendChild(meta);
  sheet.appendChild(titleRow);

  // Warmup
  sheet.appendChild(elt("div", { class: "sheet-section" }, "Warm Up"));
  const wu = elt("ul", { class: "warmup-list" });
  (r ? r.warmup : []).forEach(w => wu.appendChild(elt("li", {}, w)));
  sheet.appendChild(wu);

  // Main block
  sheet.appendChild(elt("div", { class: "sheet-section" }, "Main Block"));
  const tbl = elt("table", { class: "sheet-table" });
  const thead = elt("thead", {}, elt("tr", {}, [
    elt("th", { style: "width:42%;" }, "Exercise"),
    elt("th", { class: "center", style: "width:9%;" }, "Reps"),
    elt("th", { class: "center", style: "width:18%;" }, "Sets"),
    elt("th", { style: "width:31%;" }, "Weight / Resistance"),
  ]));
  tbl.appendChild(thead);
  const tbody = elt("tbody");
  session.exercises.forEach(ex => {
    const setBoxes = elt("td", { class: "sets-cell" });
    for (let i = 0; i < ex.sets; i++) {
      const box = elt("span", { class: "set-box" + (ex.setLog && ex.setLog[i] ? " done" : "") });
      setBoxes.appendChild(box);
    }
    const weightCell = elt("td", { class: "weight-cell" }, ex.weight
      ? elt("span", { class: "filled" }, ex.weight)
      : ""
    );
    const nameHtml = `<span style="font-weight:700;">${escapeHTML(ex.name)}</span>${ex.variant ? `  <span style="color:#6B7280;font-size:12px;">— ${escapeHTML(ex.variant)}</span>` : ""}`;
    tbody.appendChild(elt("tr", {}, [
      elt("td", { html: nameHtml }),
      elt("td", { class: "reps" }, ex.reps),
      setBoxes,
      weightCell,
    ]));
  });
  tbl.appendChild(tbody);
  sheet.appendChild(tbl);

  // Footer
  sheet.appendChild(elt("div", { class: "footer-note" }, [
    elt("span", {}, "Quantify · Train · Prevail"),
    elt("span", {}, formatDate(session.date)),
  ]));
  return sheet;
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ===========================================================
// MODAL HELPERS
// ===========================================================
function showModal(id) {
  const m = document.getElementById(id);
  m.classList.remove("hidden");
  m.setAttribute("aria-hidden", "false");
}
function hideModal(id) {
  const m = document.getElementById(id);
  m.classList.add("hidden");
  m.setAttribute("aria-hidden", "true");
}
function showConfirm({ title, body, okLabel, onOk }) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmBody").textContent = body;
  const okBtn = document.getElementById("confirmOkBtn");
  okBtn.textContent = okLabel || "Confirm";
  okBtn.onclick = () => {
    hideModal("confirmModal");
    if (onOk) onOk();
  };
  showModal("confirmModal");
}

// ===========================================================
// INIT
// ===========================================================
function init() {
  // Bottom nav
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  // Empty-state form fields
  document.getElementById("newSessionDate").addEventListener("change", e => state.draftDate = e.target.value);
  document.getElementById("newSessionLocation").addEventListener("input", e => state.draftLocation = e.target.value);
  document.getElementById("startBtn").addEventListener("click", startSession);

  // Run-state action buttons
  document.getElementById("finishBtn").addEventListener("click", finishWorkout);
  document.getElementById("cancelBtn").addEventListener("click", discardWorkout);

  // Modal close handlers
  document.querySelectorAll("[data-close]").forEach(el => {
    el.addEventListener("click", () => {
      el.closest(".modal").classList.add("hidden");
    });
  });
  document.getElementById("editSaveBtn").addEventListener("click", saveEdit);

  // Print button
  document.getElementById("printBtn").addEventListener("click", () => window.print());

  // Initial render
  showView("today");

  // Register service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(err => console.warn("SW reg failed:", err));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

})();
