/* ===========================================================
   Easy Strength v2.1 — app logic
   - vanilla JS, no deps
   - state in localStorage
   - 3 views: today (run), history, print
   - Two session types:
       1. "strength" — Easy Strength two-routine model
       2. "emom"     — Kettlebell EMOM timer with chimes + per-round weights
   =========================================================== */

(() => {
"use strict";

// ===========================================================
// EXERCISE LIBRARY (strength)
// Categories define what can swap with what.
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
// ROUTINES — strength slot definitions
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
// KETTLEBELL EMOM library + constants
// ===========================================================
const KB_LIBRARY = [
  "Two-Hand Swing",
  "One-Hand Swing",
  "Snatch",
  "Clean",
  "Clean + Press",
  "Goblet Squat",
  "Front Squat",
  "Turkish Get-Up",
  "Long Cycle",
];
const KB_WEIGHTS = ["12", "16", "20", "24", "28", "32"]; // kg
const KB_DURATIONS = [10, 15, 20];                      // minutes
const PRE_START_SECONDS = 5;

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
    if (!raw) return null;
    return migrateSession(JSON.parse(raw));
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
    if (!raw) return [];
    return JSON.parse(raw).map(migrateSession);
  } catch { return []; }
}
function saveHistory(arr) {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(arr));
}

/* Migration: pre-2.1 sessions had no `type` field — they were strength. */
function migrateSession(s) {
  if (!s) return s;
  if (!s.type) s.type = "strength";
  return s;
}

// ===========================================================
// STATE
// ===========================================================
const state = {
  view: "today",
  // Strength draft
  strengthRoutineDraft: null,        // "force" | "finesse" | null
  // KB EMOM draft
  kbDraft: {
    duration: 10,
    exercise: KB_LIBRARY[0],
    defaultWeight: null,
  },
  // Common draft fields
  draftDate: todayISO(),
  draftLocation: "",
  // Active session
  active: loadActive(),
  history: loadHistory(),
  editingSlotId: null,               // strength edit modal target
  historyDetailId: null,
  // EMOM runtime (in-memory, not persisted)
  timer: null,                       // see Timer module
};

// ===========================================================
// HELPERS
// ===========================================================
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const mon = dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${day} · ${mon} ${d}, ${y}`;
}
function formatMS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
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
function escapeHTML(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

// ===========================================================
// AUDIO — synthesized chimes via Web Audio API
// iOS requires AudioContext to be created/resumed inside a user gesture.
// Call audio.unlock() from the Start button click to prime it.
// ===========================================================
const audio = (() => {
  let ctx = null;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone({ freq = 880, duration = 0.6, type = "sine", volume = 0.25, attack = 0.01, when = 0 }) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t0); osc.stop(t0 + duration + 0.05);
  }
  return {
    unlock() {
      const c = ensure(); if (!c) return;
      // play a silent tick to actually open the iOS audio path
      tone({ freq: 1, duration: 0.02, volume: 0.0001 });
    },
    tick()   { tone({ freq: 1000, duration: 0.10, volume: 0.18 }); },
    chime()  {
      tone({ freq: 880, duration: 0.55, volume: 0.30 });
      tone({ freq: 1320, duration: 0.45, volume: 0.18, when: 0.04 });
    },
    finish() {
      tone({ freq: 660, duration: 0.30, volume: 0.30 });
      tone({ freq: 880, duration: 0.30, volume: 0.30, when: 0.30 });
      tone({ freq: 1320, duration: 0.50, volume: 0.30, when: 0.60 });
    },
  };
})();

// ===========================================================
// WAKE LOCK — keep screen on during a workout
// ===========================================================
const wakeLock = (() => {
  let lock = null;
  return {
    async acquire() {
      try {
        if ("wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
          // Re-acquire on visibility change
          document.addEventListener("visibilitychange", async () => {
            if (lock !== null && document.visibilityState === "visible") {
              try { lock = await navigator.wakeLock.request("screen"); } catch {}
            }
          });
        }
      } catch {}
    },
    async release() {
      try {
        if (lock) { await lock.release(); lock = null; }
      } catch {}
    },
  };
})();

// ===========================================================
// TIMER — EMOM engine
// Runtime only; mutates active session for round.done/.completedAt.
// ===========================================================
const timerEngine = (() => {
  let intervalId = null;
  let phase = "idle";     // idle | preStart | running | finished
  let preRemaining = 0;   // seconds remaining in pre-start countdown
  let elapsed = 0;        // seconds since first round chime
  let lastRoundFired = -1;

  function clear() {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  }

  function start(session) {
    clear();
    phase = "preStart";
    preRemaining = PRE_START_SECONDS;
    elapsed = 0;
    lastRoundFired = -1;
    audio.tick();
    renderRunView();
    intervalId = setInterval(() => tick(session), 1000);
  }

  function tick(session) {
    if (phase === "preStart") {
      preRemaining -= 1;
      if (preRemaining > 0) {
        audio.tick();
      } else {
        phase = "running";
        // Fire round 0 chime + start clock
        audio.chime();
        lastRoundFired = 0;
        elapsed = 0;
      }
      renderRunView();
      return;
    }
    if (phase === "running") {
      elapsed += 1;
      const totalSeconds = session.durationMinutes * 60;
      // Fire chime at every minute boundary that hasn't been fired
      const minute = Math.floor(elapsed / 60);
      if (minute > lastRoundFired && minute < session.durationMinutes) {
        audio.chime();
        lastRoundFired = minute;
      }
      // Workout complete?
      if (elapsed >= totalSeconds) {
        phase = "finished";
        audio.finish();
        clear();
      }
      renderRunView();
      return;
    }
  }

  function stop() {
    clear();
    phase = "idle";
  }

  return {
    start, stop,
    state: () => ({ phase, preRemaining, elapsed }),
    isRunning: () => phase === "running" || phase === "preStart",
    isPreStart: () => phase === "preStart",
    isFinished: () => phase === "finished",
    currentRound: () => Math.floor(elapsed / 60),  // 0-indexed
  };
})();

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
  if (name === "today") renderToday();
  else if (name === "history") renderHistory();
  else if (name === "history-detail") renderHistoryDetail();
  else if (name === "print") renderPrintView();
}

// ===========================================================
// TODAY VIEW — dispatch by active session type
// ===========================================================
function renderToday() {
  const empty = document.getElementById("emptyState");
  const runStrength = document.getElementById("runState");
  const runEmom = document.getElementById("runEmomState");
  empty.classList.add("hidden");
  runStrength.classList.add("hidden");
  runEmom.classList.add("hidden");

  if (!state.active) {
    empty.classList.remove("hidden");
    renderEmptyState();
  } else if (state.active.type === "strength") {
    runStrength.classList.remove("hidden");
    renderStrengthRunView();
  } else if (state.active.type === "emom") {
    runEmom.classList.remove("hidden");
    renderEmomRunView();
  }
  renderTopbarRight();
}

function renderTopbarRight() {
  const el = document.getElementById("topbarRight");
  if (state.active) {
    if (state.active.type === "strength") {
      const r = ROUTINES[state.active.routineId];
      el.textContent = `${r.focus.toUpperCase()} · IN PROGRESS`;
    } else if (state.active.type === "emom") {
      el.textContent = `EMOM · ${state.active.durationMinutes} MIN`;
    }
  } else {
    el.textContent = formatDate(todayISO());
  }
}

// ===========================================================
// EMPTY STATE — pick a workout type
// ===========================================================
function renderEmptyState() {
  // Strength routines section
  const sBox = document.getElementById("strengthPicker");
  sBox.innerHTML = "";
  Object.values(ROUTINES).forEach(r => {
    const btn = elt("button", {
      class: state.strengthRoutineDraft === r.id ? "selected" : "",
      onclick: () => { state.strengthRoutineDraft = r.id; renderEmptyState(); },
    }, [
      elt("div", { class: "name" }, r.name),
      elt("div", { class: "focus" }, r.focus),
    ]);
    sBox.appendChild(btn);
  });

  // KB durations
  const dBox = document.getElementById("kbDurationPicker");
  dBox.innerHTML = "";
  KB_DURATIONS.forEach(d => {
    const btn = elt("button", {
      class: "duration-chip" + (state.kbDraft.duration === d ? " selected" : ""),
      onclick: () => { state.kbDraft.duration = d; renderEmptyState(); },
    }, `${d} min`);
    dBox.appendChild(btn);
  });

  // KB exercise
  const exSel = document.getElementById("kbExerciseSelect");
  exSel.innerHTML = "";
  KB_LIBRARY.forEach(name => {
    const o = elt("option", { value: name }, name);
    if (name === state.kbDraft.exercise) o.selected = true;
    exSel.appendChild(o);
  });
  exSel.onchange = () => { state.kbDraft.exercise = exSel.value; };

  // KB default weight chips
  const wBox = document.getElementById("kbDefaultWeight");
  wBox.innerHTML = "";
  KB_WEIGHTS.forEach(w => {
    const isSel = state.kbDraft.defaultWeight === w;
    const chip = elt("button", {
      class: "weight-chip" + (isSel ? " selected" : ""),
      onclick: () => {
        state.kbDraft.defaultWeight = isSel ? null : w;
        renderEmptyState();
      },
    }, `${w} KG`);
    wBox.appendChild(chip);
  });

  // Common: date / location
  document.getElementById("newSessionDate").value = state.draftDate;
  document.getElementById("newSessionLocation").value = state.draftLocation;

  // Enable Start buttons based on selection
  document.getElementById("startStrengthBtn").disabled = !state.strengthRoutineDraft;
  // KB always startable (sensible defaults)
  document.getElementById("startKbBtn").disabled = false;
}

function startStrengthSession() {
  if (!state.strengthRoutineDraft) return;
  const r = ROUTINES[state.strengthRoutineDraft];
  const session = {
    id: `s_${Date.now()}`,
    type: "strength",
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

function startKbSession() {
  const d = state.kbDraft;
  const rounds = [];
  for (let i = 0; i < d.duration; i++) {
    rounds.push({
      idx: i,
      done: false,
      weight: d.defaultWeight,
      completedAt: null,
    });
  }
  const session = {
    id: `s_${Date.now()}`,
    type: "emom",
    date: state.draftDate,
    location: state.draftLocation,
    exercise: d.exercise,
    durationMinutes: d.duration,
    defaultWeight: d.defaultWeight,
    rounds,
    notes: "",
    startedAt: new Date().toISOString(),
  };
  state.active = session;
  saveActive(session);
  audio.unlock();          // unlock iOS audio path inside this user gesture
  wakeLock.acquire();
  timerEngine.start(session);
  renderToday();
}

// ===========================================================
// STRENGTH RUN VIEW (unchanged from v2)
// ===========================================================
function renderStrengthRunView() {
  const a = state.active;
  const r = ROUTINES[a.routineId];

  document.getElementById("runName").textContent = r.name;
  document.getElementById("runFocus").textContent = r.focus.toUpperCase();
  const loc = (a.location || "").trim();
  const meta = loc ? `${formatDate(a.date)}  ·  ${loc.toUpperCase()}` : formatDate(a.date);
  document.getElementById("runMeta").textContent = meta;

  const wlist = document.getElementById("warmupList");
  wlist.innerHTML = "";
  r.warmup.forEach(item => wlist.appendChild(elt("li", {}, item)));
  document.getElementById("warmupSummary").textContent = `${r.warmup.length} item${r.warmup.length === 1 ? "" : "s"}`;

  const list = document.getElementById("exerciseList");
  list.innerHTML = "";
  a.exercises.forEach((ex, idx) => list.appendChild(renderExerciseCard(ex, idx)));

  const totalSets = a.exercises.reduce((s, ex) => s + ex.sets, 0);
  const doneSets = a.exercises.reduce((s, ex) => s + ex.setLog.filter(Boolean).length, 0);
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;
  document.getElementById("meterFill").style.width = `${pct}%`;
  document.getElementById("meterLabel").textContent = `${doneSets} of ${totalSets} sets complete · ${pct}%`;
}

function renderExerciseCard(ex, idx) {
  const allDone = ex.setLog.length > 0 && ex.setLog.every(Boolean);
  const card = elt("div", { class: `exercise-card ${allDone ? "complete" : ""}` });

  const nameBlock = elt("div", { class: "ex-name-block", onclick: () => openEditModal(idx) }, [
    elt("div", { class: "ex-name" }, ex.name),
    ex.variant ? elt("div", { class: "ex-variant" }, ex.variant) : null,
    elt("div", { class: "ex-name-tap-hint" }, "Tap to swap or edit"),
  ].filter(Boolean));
  const repsBlock = elt("div", { class: "ex-reps" }, ex.reps);
  card.appendChild(elt("div", { class: "ex-card-top" }, [nameBlock, repsBlock]));

  const setRow = elt("div", { class: "ex-set-row" });
  for (let i = 0; i < ex.sets; i++) {
    const isDone = !!ex.setLog[i];
    const cb = elt("button", {
      class: `set-checkbox ${isDone ? "done" : ""}`,
      "aria-label": `Set ${i + 1}`,
      onclick: () => toggleStrengthSet(idx, i),
    }, isDone ? "✓" : String(i + 1));
    setRow.appendChild(cb);
  }
  card.appendChild(setRow);

  const weightInput = elt("input", {
    type: "text", inputmode: "decimal", placeholder: "—", value: ex.weight || "",
    oninput: (e) => updateStrengthExercise(idx, { weight: e.target.value }),
  });
  const notesInput = elt("input", {
    type: "text", placeholder: "—", value: ex.notes || "",
    oninput: (e) => updateStrengthExercise(idx, { notes: e.target.value }),
  });
  const inputRow = elt("div", { class: "ex-input-row" }, [
    elt("div", {}, [elt("label", {}, "Weight / Resistance"), weightInput]),
    elt("div", {}, [elt("label", {}, "Notes"), notesInput]),
  ]);
  card.appendChild(inputRow);
  return card;
}

function toggleStrengthSet(exIdx, setIdx) {
  const ex = state.active.exercises[exIdx];
  ex.setLog[setIdx] = !ex.setLog[setIdx];
  saveActive(state.active);
  renderStrengthRunView();
}
function updateStrengthExercise(exIdx, patch) {
  Object.assign(state.active.exercises[exIdx], patch);
  saveActive(state.active);
}

// ===========================================================
// STRENGTH EDIT MODAL
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
  if (newSets !== ex.sets) {
    const newLog = new Array(newSets).fill(false);
    for (let i = 0; i < Math.min(ex.setLog.length, newSets); i++) newLog[i] = ex.setLog[i];
    ex.setLog = newLog;
    ex.sets = newSets;
  }
  saveActive(state.active);
  state.editingSlotId = null;
  hideModal("exerciseEditModal");
  renderStrengthRunView();
}

// ===========================================================
// EMOM RUN VIEW
// ===========================================================
function renderEmomRunView() {
  const a = state.active;
  const ts = timerEngine.state();
  const totalSeconds = a.durationMinutes * 60;
  const remaining = Math.max(0, totalSeconds - ts.elapsed);
  const currentRoundIdx = Math.min(a.durationMinutes - 1, Math.floor(ts.elapsed / 60));

  // Header
  document.getElementById("emomTitle").textContent = a.exercise;
  const loc = (a.location || "").trim();
  document.getElementById("emomMeta").textContent = `${formatDate(a.date)}  ·  ${a.durationMinutes} MIN EMOM${loc ? "  ·  " + loc.toUpperCase() : ""}`;

  // Pre-start overlay
  const preEl = document.getElementById("preCountdown");
  if (timerEngine.isPreStart()) {
    preEl.classList.remove("hidden");
    preEl.textContent = String(ts.preRemaining || 1);
  } else {
    preEl.classList.add("hidden");
  }

  // Big timer display
  const timerEl = document.getElementById("emomBigTimer");
  if (timerEngine.isFinished()) {
    timerEl.textContent = "DONE";
    timerEl.classList.add("done");
  } else {
    timerEl.textContent = formatMS(remaining);
    timerEl.classList.toggle("done", false);
  }

  // Current round badge
  const badge = document.getElementById("emomRoundBadge");
  if (timerEngine.isPreStart()) {
    badge.textContent = `STARTING IN ${ts.preRemaining || 0}`;
  } else if (timerEngine.isFinished()) {
    const done = a.rounds.filter(r => r.done).length;
    badge.textContent = `${done} OF ${a.durationMinutes} ROUNDS COMPLETE`;
  } else {
    badge.textContent = `ROUND ${currentRoundIdx + 1} OF ${a.durationMinutes}`;
  }

  // Round list
  const list = document.getElementById("emomRoundList");
  list.innerHTML = "";
  a.rounds.forEach((round, idx) => {
    list.appendChild(renderRoundRow(round, idx, currentRoundIdx, timerEngine.isRunning()));
  });

  // Action buttons
  const startBtn = document.getElementById("emomStartTimerBtn");
  const stopBtn = document.getElementById("emomStopTimerBtn");
  if (timerEngine.isRunning()) {
    startBtn.classList.add("hidden");
    stopBtn.classList.remove("hidden");
  } else {
    stopBtn.classList.add("hidden");
    if (timerEngine.isFinished()) {
      startBtn.classList.add("hidden");
    } else {
      startBtn.classList.remove("hidden");
      startBtn.textContent = ts.elapsed > 0 ? "Resume Timer" : "Start Timer";
    }
  }
}

function renderRoundRow(round, idx, currentIdx, timerLive) {
  const isCurrent = timerLive && idx === currentIdx;
  const row = elt("div", { class: "round-row" + (round.done ? " done" : "") + (isCurrent ? " current" : "") });

  // Checkbox
  const cb = elt("button", {
    class: "round-check" + (round.done ? " done" : ""),
    "aria-label": `Round ${idx + 1}`,
    onclick: () => toggleRound(idx),
  }, round.done ? "✓" : String(idx + 1));
  row.appendChild(cb);

  // Label + chips column
  const main = elt("div", { class: "round-main" });
  main.appendChild(elt("div", { class: "round-label" }, `Round ${idx + 1}`));

  const chipRow = elt("div", { class: "round-weight-chips" });
  KB_WEIGHTS.forEach(w => {
    const isSel = round.weight === w;
    chipRow.appendChild(elt("button", {
      class: "weight-chip-sm" + (isSel ? " selected" : ""),
      onclick: () => setRoundWeight(idx, isSel ? null : w),
    }, w));
  });
  main.appendChild(chipRow);
  row.appendChild(main);
  return row;
}

function toggleRound(idx) {
  const r = state.active.rounds[idx];
  r.done = !r.done;
  r.completedAt = r.done ? new Date().toISOString() : null;
  saveActive(state.active);
  renderEmomRunView();
}

function setRoundWeight(idx, weight) {
  state.active.rounds[idx].weight = weight;
  saveActive(state.active);
  renderEmomRunView();
}

function emomStartTimer() {
  audio.unlock();
  wakeLock.acquire();
  timerEngine.start(state.active);
  // renderEmomRunView is called inside the engine
}
function emomStopTimer() {
  timerEngine.stop();
  wakeLock.release();
  renderEmomRunView();
}

// ===========================================================
// FINISH / DISCARD (shared)
// ===========================================================
function finishWorkout() {
  showConfirm({
    title: "Finish workout?",
    body: "This moves the session to History. You can't add more after finishing.",
    okLabel: "Finish",
    onOk: () => {
      timerEngine.stop();
      wakeLock.release();
      const completed = { ...state.active, completedAt: new Date().toISOString() };
      const hist = loadHistory();
      hist.unshift(completed);
      saveHistory(hist);
      state.history = hist;
      state.active = null;
      saveActive(null);
      // Reset drafts
      state.strengthRoutineDraft = null;
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
      timerEngine.stop();
      wakeLock.release();
      state.active = null;
      saveActive(null);
      state.strengthRoutineDraft = null;
      renderToday();
    },
  });
}

// ===========================================================
// HISTORY
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
    const card = (s.type === "emom") ? renderHistoryCardEmom(s) : renderHistoryCardStrength(s);
    list.appendChild(card);
  });
}

function renderHistoryCardStrength(s) {
  const r = ROUTINES[s.routineId];
  const totalSets = s.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const doneSets = s.exercises.reduce((sum, ex) => sum + ex.setLog.filter(Boolean).length, 0);
  return elt("div", { class: "history-card", onclick: () => openHistoryDetail(s.id) }, [
    elt("div", { class: "history-card-top" }, [
      elt("span", { class: "history-date" }, formatDate(s.date)),
      elt("span", { class: "history-routine" }, r ? `${r.name} · ${r.focus}` : "Workout"),
    ]),
    elt("div", { class: "history-summary" }, `Strength · ${s.exercises.length} exercises · ${doneSets}/${totalSets} sets`),
  ]);
}

function renderHistoryCardEmom(s) {
  const done = s.rounds.filter(r => r.done).length;
  const weights = [...new Set(s.rounds.filter(r => r.weight).map(r => r.weight))].sort((a,b)=>+a-+b);
  const wStr = weights.length ? weights.map(w => w + "KG").join(" / ") : "no weight logged";
  return elt("div", { class: "history-card", onclick: () => openHistoryDetail(s.id) }, [
    elt("div", { class: "history-card-top" }, [
      elt("span", { class: "history-date" }, formatDate(s.date)),
      elt("span", { class: "history-routine" }, `EMOM · ${s.durationMinutes} MIN`),
    ]),
    elt("div", { class: "history-summary" }, `${s.exercise} · ${done}/${s.durationMinutes} rounds · ${wStr}`),
  ]);
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
  if (s.type === "emom") renderHistoryDetailEmom(c, s);
  else renderHistoryDetailStrength(c, s);

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

function renderHistoryDetailStrength(c, s) {
  const r = ROUTINES[s.routineId];
  c.appendChild(elt("div", { class: "view-header" }, [
    elt("h1", {}, r ? r.name : "Workout"),
    elt("p", { class: "muted" }, `${formatDate(s.date)}${s.location ? "  ·  " + s.location.toUpperCase() : ""}  ·  ${r ? r.focus : ""}`),
  ]));
  const section = elt("div", { class: "detail-section" });
  s.exercises.forEach(ex => {
    const done = ex.setLog.filter(Boolean).length;
    const stats = `${done}/${ex.sets} × ${ex.reps}`;
    section.appendChild(elt("div", { class: "detail-ex-row" }, [
      elt("div", {}, [
        elt("div", { class: "detail-ex-name" }, ex.name),
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
}

function renderHistoryDetailEmom(c, s) {
  c.appendChild(elt("div", { class: "view-header" }, [
    elt("h1", {}, `Kettlebell EMOM · ${s.durationMinutes} min`),
    elt("p", { class: "muted" }, `${formatDate(s.date)}${s.location ? "  ·  " + s.location.toUpperCase() : ""}  ·  ${s.exercise.toUpperCase()}`),
  ]));

  // Stats row
  const done = s.rounds.filter(r => r.done).length;
  const weightCounts = {};
  s.rounds.forEach(r => { if (r.weight) weightCounts[r.weight] = (weightCounts[r.weight]||0) + 1; });
  const weightSummary = Object.entries(weightCounts)
    .sort(([a],[b]) => +a - +b)
    .map(([w, n]) => `${n}× ${w}KG`)
    .join(" · ") || "no weight logged";
  const stats = elt("div", { class: "detail-section" }, [
    elt("div", { class: "detail-ex-row" }, [
      elt("div", { class: "detail-ex-name" }, "Rounds completed"),
      elt("div", { class: "detail-ex-stats" }, `${done} / ${s.durationMinutes}`),
    ]),
    elt("div", { class: "detail-ex-row" }, [
      elt("div", { class: "detail-ex-name" }, "Weight breakdown"),
      elt("div", { class: "detail-ex-stats" }, weightSummary),
    ]),
  ]);
  c.appendChild(stats);

  // Round-by-round
  const rounds = elt("div", { class: "detail-section" });
  rounds.appendChild(elt("div", { class: "section-label", style: "margin-top:0;" }, "Round-by-round"));
  s.rounds.forEach((r, i) => {
    rounds.appendChild(elt("div", { class: "detail-ex-row" }, [
      elt("div", { class: "detail-ex-name" }, `Round ${i + 1}`),
      elt("div", { class: "detail-ex-stats" }, [
        elt("div", { class: "detail-ex-weight" }, r.weight ? `${r.weight} KG` : "—"),
        elt("div", {}, r.done ? "Complete" : "Skipped"),
      ]),
    ]));
  });
  c.appendChild(rounds);
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
    const r = (s.type === "strength") ? ROUTINES[s.routineId] : null;
    const label = (s.type === "emom")
      ? `${formatDate(s.date)} — EMOM ${s.durationMinutes}m (${s.exercise})`
      : `${formatDate(s.date)} — ${r ? r.name : "Workout"}`;
    sel.appendChild(elt("option", { value: s.id }, label));
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
  preview.appendChild(session.type === "emom" ? buildSheetEmom(session) : buildSheetStrength(session));
  preview.style.display = "block";
}

function buildSheetStrength(session) {
  const r = ROUTINES[session.routineId];
  const sheet = elt("div", { class: "sheet" });
  const titleRow = elt("div", { class: "title-row" });
  titleRow.appendChild(elt("h1", {}, "Easy Strength"));
  const meta = elt("div", { class: "sub-meta" });
  meta.appendChild(elt("span", {}, [elt("span", { class: "focus-pill" }, `${(r?r.name:"").toUpperCase()} · ${(r?r.focus:"").toUpperCase()}`)]));
  meta.appendChild(elt("span", {}, `${formatDate(session.date)}${session.location ? "  ·  " + session.location.toUpperCase() : ""}`));
  titleRow.appendChild(meta);
  sheet.appendChild(titleRow);

  sheet.appendChild(elt("div", { class: "sheet-section" }, "Warm Up"));
  const wu = elt("ul", { class: "warmup-list" });
  (r ? r.warmup : []).forEach(w => wu.appendChild(elt("li", {}, w)));
  sheet.appendChild(wu);

  sheet.appendChild(elt("div", { class: "sheet-section" }, "Main Block"));
  const tbl = elt("table", { class: "sheet-table" });
  tbl.appendChild(elt("thead", {}, elt("tr", {}, [
    elt("th", { style: "width:42%;" }, "Exercise"),
    elt("th", { class: "center", style: "width:9%;" }, "Reps"),
    elt("th", { class: "center", style: "width:18%;" }, "Sets"),
    elt("th", { style: "width:31%;" }, "Weight / Resistance"),
  ])));
  const tbody = elt("tbody");
  session.exercises.forEach(ex => {
    const setBoxes = elt("td", { class: "sets-cell" });
    for (let i = 0; i < ex.sets; i++) {
      setBoxes.appendChild(elt("span", { class: "set-box" + (ex.setLog && ex.setLog[i] ? " done" : "") }));
    }
    const weightCell = elt("td", { class: "weight-cell" }, ex.weight ? elt("span", { class: "filled" }, ex.weight) : "");
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

  sheet.appendChild(elt("div", { class: "footer-note" }, [
    elt("span", {}, "Quantify · Train · Prevail"),
    elt("span", {}, formatDate(session.date)),
  ]));
  return sheet;
}

function buildSheetEmom(session) {
  const sheet = elt("div", { class: "sheet" });
  const titleRow = elt("div", { class: "title-row" });
  titleRow.appendChild(elt("h1", {}, `Kettlebell EMOM · ${session.durationMinutes} min`));
  const meta = elt("div", { class: "sub-meta" });
  meta.appendChild(elt("span", {}, [elt("span", { class: "focus-pill" }, session.exercise.toUpperCase())]));
  meta.appendChild(elt("span", {}, `${formatDate(session.date)}${session.location ? "  ·  " + session.location.toUpperCase() : ""}`));
  titleRow.appendChild(meta);
  sheet.appendChild(titleRow);

  sheet.appendChild(elt("div", { class: "sheet-section" }, "Rounds"));
  const tbl = elt("table", { class: "sheet-table" });
  tbl.appendChild(elt("thead", {}, elt("tr", {}, [
    elt("th", { class: "center", style: "width:10%;" }, "#"),
    elt("th", { class: "center", style: "width:10%;" }, "Done"),
    elt("th", { style: "width:50%;" }, "Weight"),
    elt("th", { style: "width:30%;" }, "Notes"),
  ])));
  const tbody = elt("tbody");
  session.rounds.forEach((r, i) => {
    const box = elt("td", { class: "sets-cell" }, elt("span", { class: "set-box" + (r.done ? " done" : "") }));
    tbody.appendChild(elt("tr", {}, [
      elt("td", { class: "reps" }, String(i + 1)),
      box,
      elt("td", { class: "weight-cell" }, r.weight ? elt("span", { class: "filled" }, `${r.weight} KG`) : ""),
      elt("td", { class: "weight-cell" }, ""),
    ]));
  });
  tbl.appendChild(tbody);
  sheet.appendChild(tbl);

  // Summary block
  const done = session.rounds.filter(r => r.done).length;
  const weightCounts = {};
  session.rounds.forEach(r => { if (r.weight) weightCounts[r.weight] = (weightCounts[r.weight]||0) + 1; });
  const weightSummary = Object.entries(weightCounts).sort(([a],[b]) => +a - +b).map(([w, n]) => `${n}× ${w} KG`).join(" · ") || "—";
  sheet.appendChild(elt("div", { class: "sheet-section" }, "Summary"));
  sheet.appendChild(elt("table", { class: "sheet-table" }, elt("tbody", {}, [
    elt("tr", {}, [elt("td", { html: "<b>Rounds completed</b>" }), elt("td", { class: "reps" }, `${done} / ${session.durationMinutes}`)]),
    elt("tr", {}, [elt("td", { html: "<b>Weight breakdown</b>" }), elt("td", {}, weightSummary)]),
  ])));

  sheet.appendChild(elt("div", { class: "footer-note" }, [
    elt("span", {}, "Quantify · Train · Prevail"),
    elt("span", {}, formatDate(session.date)),
  ]));
  return sheet;
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
  okBtn.onclick = () => { hideModal("confirmModal"); if (onOk) onOk(); };
  showModal("confirmModal");
}

// ===========================================================
// INIT
// ===========================================================
function init() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  document.getElementById("newSessionDate").addEventListener("change", e => state.draftDate = e.target.value);
  document.getElementById("newSessionLocation").addEventListener("input", e => state.draftLocation = e.target.value);
  document.getElementById("startStrengthBtn").addEventListener("click", startStrengthSession);
  document.getElementById("startKbBtn").addEventListener("click", startKbSession);

  // Strength run
  document.getElementById("finishBtn").addEventListener("click", finishWorkout);
  document.getElementById("cancelBtn").addEventListener("click", discardWorkout);
  // EMOM run
  document.getElementById("emomFinishBtn").addEventListener("click", finishWorkout);
  document.getElementById("emomCancelBtn").addEventListener("click", discardWorkout);
  document.getElementById("emomStartTimerBtn").addEventListener("click", emomStartTimer);
  document.getElementById("emomStopTimerBtn").addEventListener("click", emomStopTimer);

  // Modals
  document.querySelectorAll("[data-close]").forEach(el => {
    el.addEventListener("click", () => el.closest(".modal").classList.add("hidden"));
  });
  document.getElementById("editSaveBtn").addEventListener("click", saveEdit);

  // Print
  document.getElementById("printBtn").addEventListener("click", () => window.print());

  showView("today");

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
