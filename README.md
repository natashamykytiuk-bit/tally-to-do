# Tally

A to-do list and habit tracker in the style of Microsoft To Do. Put one-off tasks and homework into lists (one per class or project). Add recurring tasks once, with how often they repeat, and they appear in **My Day** on the right days. Missed habits either carry over or drop off, and each one shows its current streak.

**Live:** https://tally-to-do.web.app

## Features

- **Smart views:**
  - **Plan:** choose one or more days to work on each task, and drag tasks between days.
  - **My Day:** today's tasks, habits due today and any carried-over misses.
  - **Scheduled:** tasks with due dates, grouped Overdue, Today, Tomorrow and Later.
  - **Habits:** every recurring task, with its streak.
- **No list:** tasks added from My Day, Plan, Scheduled or Habits aren't put in a list, and collect here.
- **Lists:** each list or class has its own colour, chosen from presets, a hex code or a colour wheel. Drag the ≡ handle to reorder lists. Right-click a list (long-press on a phone) to edit or delete it.
- **Tasks:**
  - Click the title to rename.
  - 📅 sets a due date and ☀ adds the task to My Day.
  - × deletes the task.
  - Steps turn a task into a checklist; ticking the last step completes the task.
- **Repeats:** every N days, weeks (on chosen weekdays) or months (on a day of the month), with optional start and end dates.
  - **If I miss it:** *Carry over* keeps a missed day in My Day, marked late, until it's done. *Let it go* drops it and resets the streak.
  - **Streaks:** 🔥 counts consecutive on-time check-offs. Late ones don't count.
- **Settings:**
  - Light, dark or system theme, and an accent colour.
  - Change password, sign out, or delete the account along with all its data.

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
