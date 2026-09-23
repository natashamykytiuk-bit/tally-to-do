# Tally

A to-do list and habit tracker in the style of Microsoft To Do. Put one-off tasks and homework into lists (one per class or project). Add recurring tasks once, with how often they repeat, and they appear in **My Day** on the right days. Missed habits either carry over or drop off, and each one shows its current streak.

**Live:** https://tally-to-do.web.app

## Features

- **My Day:** today's tasks, anything due or planned for today, today's habits and any carried-over misses.
  - A progress pie next to the title fills as you finish, e.g. "3 of 5 done".
  - Drag tasks into your own order, or sort by due date, date created or A to Z.
- **Plan:** a Sunday–Saturday week, with days side by side as columns on a computer and stacked as rows on a phone.
  - Pick one or more days to work on each task with 🕒, or add tasks straight onto a day.
  - Drag a task from one day to another.
  - Each day has a small pie showing how much of what's planned for it is done.
  - ‹ and › move between weeks, and **This week** jumps back.
  - Tasks due soon that aren't planned yet wait at the top.
- **Scheduled:** tasks with due dates, grouped into Overdue, Today, Tomorrow, Later this week, Next week and Later.
- **Tasks:** everything that isn't in one of your lists, such as tasks added from My Day, Plan, Scheduled or Habits.
- **Habits:** every repeating task, with its streak.
- **Lists:** one per class or project.
  - Each list has its own colour, from presets, a hex code or a colour wheel.
  - Drag lists to reorder them.
  - Right-click a list (long-press on a phone), or use **Edit** at the top of it, to rename, recolour or delete it. Deleting a list deletes its tasks, after a warning.
- **Working with tasks:**
  - Tick the circle to finish a task. It pops and bursts into confetti, unless your device is set to reduce motion.
  - Click a title to rename it. Click anywhere else on a task to open its details: steps, notes, list, dates, repeat and Delete.
  - 🕒 plans the days to work on a task, 📅 sets its due date and ☀ adds it to My Day.
  - **Partly done:** right-click the circle (long-press on a phone) to mark a task 25%, 50%, 75% or any percent done, and the circle fills to match. Steps fill it too.
  - **Done for today:** in a task's details, this sets the task aside until tomorrow without finishing it.
- **Repeats:** every N days, weeks (on the days you pick) or months (on a day of the month), with optional start and end dates.
  - **If I miss it:** *Carry over* keeps a missed day in My Day, marked late, until it's done. *Let it go* drops it and resets the streak.
  - **Streaks:** 🔥 counts consecutive on-time check-offs. Late ones don't count.
- **Settings:**
  - Light, dark or system theme, and an accent colour.
  - Import tasks from an Excel or CSV file, sorted into lists by a Class or List column.
  - Replay the tutorial.
  - Change your password, sign out, or delete the account along with all its data.
- **On a computer,** the ‹ next to "Tally" hides the sidebar so tasks get the full width. ☰ brings it back.
- **New accounts** get a short guided tour.
- **Accessibility:** every control has a screen-reader label, and headings, dialogs and states (done, partly done, selected) are announced.

## Tech

- **App:** [Expo](https://expo.dev) (React Native) with TypeScript and Expo Router. It runs on iOS, Android and the web.
- **Backend:** Firebase Authentication (email and password), Cloud Firestore and Firebase Hosting.
- **Dates:** [date-fns](https://date-fns.org). All dates are stored as local `YYYY-MM-DD` strings.
- **Tests:** Jest (`jest-expo`) covers the scheduling, streak and view logic.

## Getting started

You'll need Node.js and a Firebase project with **Email/Password** sign-in and **Firestore** enabled.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your Firebase web app keys. In the Firebase console, go to **Project settings → Your apps → Web app**. Copy the template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

3. Publish the security rules in [`firestore.rules`](firestore.rules). They let each user read and write only their own data:

   ```bash
   firebase deploy --only firestore:rules
   ```

4. Start the app. Press **w** for the browser, or scan the QR code with [Expo Go](https://expo.dev/go):

   ```bash
   npx expo start
   ```

## Scripts

| Command | What it does |
|---|---|
| `npx expo start` | Start the dev server |
| `npm test` | Run the unit tests |
| `npx tsc --noEmit` | Type-check |
| `npm run build:web` | Build the website into `dist/` |
| `npm run deploy:web` | Build and publish to Firebase Hosting |

## Project layout

```
src/
  app/          Screens (Expo Router): sign-in, the main app, root layout, web HTML shell
  components/   Sidebar, task rows, detail panel, calendar, repeat editor, settings, …
  lib/          Pure logic: dates, recurrence and streaks, views, steps, repeat rules (+ __tests__)
  providers/    Auth, Firestore data and appearance preferences (React context)
  constants/    Colour palette and theme hook
```

Data lives under `users/{uid}/` in Firestore:
- `lists`
- `items`: tasks, each storing its repeat rule once.
- `completions`: one per checked-off occurrence.
- `progress`: step ticks per occurrence.
- `meta/prefs`: theme and accent colour.

Each day's list is computed from those rules; nothing is copied per day.

## License

© 2026 Natasha Mykytiuk. All rights reserved. The code is published for viewing only; see [LICENSE](LICENSE).
