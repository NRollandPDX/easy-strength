# Easy Strength v2 — Project Notes for Claude

This is a static, single-page PWA workout tracker for Pavel Tsatsouline's
Easy Strength program. It's deployed to GitHub Pages and installed to the
user's iPhone home screen. Read this file before making changes.

## File layout

```
EasyStrengthV2/
├── index.html              ← app shell + view containers
├── styles.css              ← all CSS (NeuroTrainer visual style)
├── app.js                  ← all logic: data, state, views, persistence
├── manifest.webmanifest    ← PWA manifest
├── sw.js                   ← service worker (cache-first app shell)
├── README.md               ← user-facing docs
└── CLAUDE.md               ← this file
```

There's no build step. Edit, refresh, done. (For PWA users on the deployed
site, also bump `CACHE_VERSION` in `sw.js` so the service worker picks up
your changes — see "Deployment" below.)

## Architecture

- **Vanilla JS, no frameworks, no dependencies, no CDN.** All assets must
  be local — the service worker caches the app shell (`index.html`,
  `styles.css`, `app.js`, `manifest.webmanifest`) and the app must work
  fully offline.
- **State is in `localStorage`** under two keys: `es.activeSession` (the
  in-progress workout) and `es.history` (array of completed sessions,
  newest first). No backend, no auth, no cloud.
- **Three views**: `today` (start panel or run view), `history` (list +
  detail), `print` (PDF-friendly sheet via `window.print()`).
- **PWA**: installable on iOS/Android via "Add to Home Screen". Service
  worker provides offline support.

## Data model

### `EXERCISE_LIBRARY` (in `app.js`)

```js
"Chest Press": {
  category: "horizontal-push",        // controls swap eligibility
  variants: ["Flat", "Incline"],      // [] for fixed exercises
  repsLabel: "20–30 sec",             // optional — auto-fills reps when picked
}
```

### Categories (current)

| Category            | Examples |
|---------------------|----------|
| `horizontal-push`   | Chest Press, Chest Flies, Cable Chest Press, Push-up |
| `vertical-push`     | Shoulder Press, Push Press, Cable Overhead Press |
| `shoulder-iso`      | Lat Raise, Cable Lateral Raise, Cable Rear Delt Fly |
| `horizontal-pull`   | Bent Over Row, One-Arm Row, Cable Row |
| `vertical-pull`     | Pull Ups, Cable Lat Pulldown |
| `triceps`           | Triceps, Cable Tricep Pushdown |
| `biceps`            | Biceps, Cable Curl |
| `squat`             | Squats, Goblet Squat, Reverse Lunge, Cable Squat |
| `hinge`             | Deadlifts, Single-Leg Deadlift, Cable Pull-Through, Cable RDL |
| `hold`              | Hangs |

The user can swap any exercise for another exercise in the **same category**.
This preserves the program's movement-pattern intent.

### `ROUTINES`

```js
force: {
  id: "force",
  name: "Workout One",
  focus: "Force",
  warmup: ["Farmer's Carries", ...],     // strings only, no reps/sets
  slots: [
    {
      category: "horizontal-push",       // constrains swap candidates
      default: "Chest Press",            // initial pick
      reps: "7",
      sets: 3,
    },
    ...
  ]
}
```

### `activeSession` schema (in localStorage)

```js
{
  id: "s_1745601...",                    // unique
  routineId: "force",
  date: "2026-04-25",
  location: "West Linn",
  startedAt: "2026-04-25T16:32:00Z",
  exercises: [
    {
      slotCategory: "horizontal-push",   // preserved so swap modal can filter
      name: "Chest Press",
      variant: "Incline",
      reps: "7",
      sets: 3,
      setLog: [true, true, false],       // boolean per set
      weight: "55",                       // free text
      notes: "",
    },
    ...
  ],
  completedAt: "2026-04-25T17:05:00Z"    // only set when moved to history
}
```

## Common edits

| User asks for... | What to change |
|---|---|
| "Add a new exercise to the library" | Add an entry to `EXERCISE_LIBRARY` with the right category. It becomes available as a swap option in any slot of that category. |
| "Add a new routine" | Add a key to `ROUTINES` with `id`, `name`, `focus`, `warmup`, `slots`. The routine picker renders automatically. |
| "Change a default exercise" | Update the slot's `default` in the routine. Existing in-progress sessions are not affected. |
| "Add a new category" | Use a new string for `category` in both `EXERCISE_LIBRARY` and the relevant routine slot. No central registry. |
| "Change default reps for X" | Find the slot in `ROUTINES` and update its `reps` / `sets`. |
| "Change brand color" | Edit `--indigo` in `styles.css`. |
| "Add a finisher / extra credit section" | Currently no special section — recommend adding it as a slot with `category: "finisher"` and treating it visually like the rest. Discuss with user before restructuring. |

## Deployment

Deployed to **GitHub Pages** at `https://nrolland.github.io/easy-strength`.

Standard flow:
```bash
git add -A
git commit -m "..."
git push origin main
```

Pages picks up the change in ~30 sec. **Bump `CACHE_VERSION` in `sw.js`**
on every deploy so installed PWAs invalidate their cache and pull new code.

## Constraints (do not break without asking)

1. **No external dependencies.** No CDN scripts, no Google Fonts, no
   tracking, no analytics. Everything must work offline.
2. **No backend, no cloud sync, no auth.** State is `localStorage` only.
   This is a deliberate v2 scope decision.
3. **Mobile-first design.** All tap targets ≥ 44×44px (Apple HIG).
   `font-size: 16px` minimum on inputs (prevents iOS zoom on focus).
4. **NeuroTrainer visual style** (visual style only, no logo or product
   claims). Electric Indigo (`#6366F1`) is the single accent color.
   Don't introduce new accent colors.
5. **`window.print()` for PDF output** — never add a JS PDF library.

## Anti-patterns to avoid

- Don't introduce a framework (React, Vue, Svelte). Vanilla JS is part of
  the offline/zero-deps promise.
- Don't add an icon library — use system Unicode glyphs or CSS shapes.
- Don't add login, sign-up, or any account concept.
- Don't make the printed sheet decorative (gradients, shadows, emojis).
  Aesthetic is precision/data-driven.
- Don't write to localStorage on every keystroke if it can be avoided —
  it's fine for boolean toggles and explicit save actions, but text inputs
  for `weight` and `notes` use direct mutation + save (which is fine
  since localStorage writes are synchronous and fast).

## Testing changes

After editing locally:
1. Refresh the browser — no build step.
2. To test the PWA shell, serve via a local HTTP server (service workers
   don't load over `file://`):
   ```bash
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```
3. To test the print output, open the Print view, pick a session, click
   Print / Save as PDF, and use the browser's print preview.
4. To test on iPhone before deploying, use your computer's IP on the local
   network: `http://<your-mac-ip>:8000` from Safari on the phone.
   Note: PWA install only works over HTTPS (or localhost), so on-device
   install testing should happen against the deployed GitHub Pages URL.
