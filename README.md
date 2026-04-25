# Easy Strength

A two-routine workout tracker for Pavel Tsatsouline's Easy Strength program.
Pick a routine, swap exercises and adjust loads on the fly, tap to check
off sets as you go, and review your history. Installs to your phone home
screen as a PWA — works offline, no account, no cloud.

🏠 **Today** — start a session or run the active one
📜 **History** — every completed session, sorted newest first
🖨 **Print** — paper-friendly sheet of any session (active or past)

---

## Install on iPhone

1. Open the deployed URL in **Safari** on your iPhone.
2. Tap the **Share** button (square with up-arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right.
5. The Easy Strength icon appears on your home screen. Tap to launch in
   full-screen mode (no browser chrome). Works offline once cached.

## Install on Android (Chrome)

1. Open the deployed URL in Chrome.
2. Tap the menu (⋮) → **Add to Home screen** → **Install**.
3. Same offline-capable PWA experience.

---

## Routines

**Workout One — Force**
- Warm-up: Farmer's Carries · Face Pulls · Rotator Cuff
- Chest Press · Squats · Shoulder Press · Deadlifts · Hangs · Bent Over Row · Triceps

**Workout Two — Finesse**
- Warm-up: Suitcase Carries · World's Greatest Stretch
- Chest Flies · Lat Raise · Single-Leg Deadlift · Reverse Lunge · Pull Ups · Biceps

Defaults: **7 reps × 3 sets** for all main lifts. **20–30 sec × 3 sets** for Hangs.

## During a workout

- Tap the colored boxes (1, 2, 3…) to mark a set complete. Tap again to undo.
- Tap an exercise name to **swap it** for any other exercise in the same
  category (e.g., swap Bent Over Row for Cable Row), change the variant,
  or override reps/sets.
- Type the working weight in the **Weight / Resistance** field.
- Use the **Notes** field for anything else (RPE, tempo, etc.).
- The bar at the bottom shows total completion across all exercises.
- When done, tap **Finish Workout** to save it to History.
- **Discard** trashes the session without saving (with a confirmation).

## Variance

Each routine slot is constrained to a **category** (push, pull, squat, hinge,
isolation, etc.). The library is seeded with the original Easy Strength
modalities (kettlebells, dumbbells, sandbags, bands) plus cable-machine
variants in every category — so you can run the same program at home or in a
fully-equipped gym.

## Privacy

All state lives in your browser's `localStorage`. No account, no server, no
data leaves your device. Means: switching phones loses history; clearing the
browser site data wipes everything. There is no cloud sync — by design.

## Customizing

If you use Claude Code, open this folder with Claude and ask for what you want
(see `CLAUDE.md` for the data model). Examples:

- "Add a third routine focused on conditioning."
- "Add Trap Bar Deadlift to the hinge category."
- "Default Hangs to 3 sets of 30–45 sec."

Manual edits live in `app.js`:
- `EXERCISE_LIBRARY` — every exercise + its variants and category
- `ROUTINES` — slot definitions per routine

After editing locally, bump `CACHE_VERSION` in `sw.js` so installed PWAs
pick up the changes on next launch.
