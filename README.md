# Tally

Tally is a to-do list and habit tracker, loosely modelled on Microsoft To Do. Homework and one-off tasks go into lists, one per class or project. Recurring tasks are added once with how often they repeat, and they show up in My Day on the right days. A missed habit either carries over or drops off, and each habit keeps a streak.

Live site: https://tally-to-do.web.app

## Why I made it

I have ADHD, and I couldn't find a to-do app that worked for me. Most of them are a long list of everything I have to do, which is overwhelming to look at and doesn't help me decide what to do today or when to start something that's due next week. So I built Tally around planning ahead and managing my time:

- **One day at a time.** My Day shows only what's planned for today, what's due, and today's habits, so I'm never staring at the whole list.
- **Plan the week, not just the deadline.** In Plan I spread big tasks over the days I'll work on them, put each day's tasks in order, and see tasks that are due soon but not planned yet.
- **Progress counts.** Partly done tasks, steps, "Done for today" and the daily pie show progress even when a task isn't finished.
- **Room for off days.** "Not today" skips a habit and missed habits can carry over, so one bad day doesn't wreck the plan.
- **Small rewards.** Streaks and a confetti burst make finishing things feel good.

## Features

### My Day

Today's tasks, anything due or planned for today, today's habits and any missed habits that carried over. The pie next to the title shows how many are done (for example "3 of 5"). Tasks can be dragged into your own order or sorted by due date, date created or name.

### Plan

A Sunday to Saturday week. On a computer the days are columns; on a phone they're stacked rows. Use the clock button on a task to pick which days you'll work on it, or add a task straight onto a day, and drag tasks between days to move them. Drag a task up or down within a day to set the order it shows in My Day that day. Each day has a small pie for how much of its plan is done. The arrows switch weeks and This week jumps back. Tasks due soon that haven't been planned yet sit at the top. In My Day and Plan, each task has a strip on its left edge in its list's colour.

### Scheduled, Tasks and Habits

Scheduled lists tasks with due dates, grouped into Overdue, Today, Tomorrow, Later this week, Next week and Later. Tasks holds anything that isn't in one of your lists, such as tasks added from My Day or Plan. Habits shows every repeating task with its streak.

### Lists

Each list has its own colour, picked from presets, a hex code or a colour wheel. Lists can be dragged to reorder them. Right-click a list (long-press on a phone) or use Edit at the top of it to rename, recolour or delete it. Deleting a list also deletes its tasks, and you're asked first.

### Tasks

Tick the circle to finish a task (there's a small confetti burst unless your device is set to reduce motion). Click the title to rename it, or anywhere else on the task to open its details: steps, notes, list, dates, repeat and delete. The clock button plans work days, the calendar button sets a due date and the sun button adds the task to My Day.

Right-click the circle (long-press on a phone) to mark a task as partly done, at 25%, 50%, 75% or any other percentage. Ticking off steps fills the circle too. "Done for today", in a task's details, puts it aside until tomorrow without finishing it.

### Repeats

Tasks can repeat every few days, on chosen days of the week, or on a day of the month, with optional start and end dates. If a day is missed, "Carry over" keeps it in My Day marked late until it's done, and "Let it go" drops it and resets the streak. "Not today", in a repeating task's details, hides it from My Day and today's count; undo it from Habits or the task's list. Streaks count on-time check-offs in a row; late ones don't count.

### Settings

Light, dark or system theme and an accent colour. You can import tasks from an Excel or CSV file (sorted into lists using a Class or List column), replay the tutorial, change your password, sign out, or delete your account and all its data.

### Other

On a computer the sidebar can be hidden to give tasks the full width, and the menu button brings it back. New accounts get a short tour. Controls have screen-reader labels, and headings, dialogs and task states are announced.

## Tech

- [Expo](https://expo.dev) (React Native) with TypeScript and Expo Router, running on iOS, Android and the web
- Firebase Authentication (email and password), Cloud Firestore and Firebase Hosting
- [date-fns](https://date-fns.org) for dates, which are stored as local `YYYY-MM-DD` strings
- Jest (`jest-expo`) tests for the scheduling, streak and view logic

## Getting started

You need Node.js and a Firebase project with Email/Password sign-in and Firestore turned on.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in your Firebase web app keys (Firebase console, Project settings, Your apps, Web app):

   ```bash
   cp .env.example .env.local
   ```

3. Publish the security rules in [`firestore.rules`](firestore.rules), which only let each user read and write their own data:

   ```bash
   firebase deploy --only firestore:rules
   ```

4. Start the app, then press w to open it in the browser or scan the QR code with [Expo Go](https://expo.dev/go):

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
  app/          Screens (Expo Router): sign-in, main app, root layout, web HTML shell
  components/   Sidebar, task rows, detail panel, calendar, repeat editor, settings and so on
  lib/          Logic for dates, recurrence and streaks, views, steps and repeat rules, with tests in __tests__
  providers/    Auth, Firestore data and appearance settings (React context)
  constants/    Colour palette and theme hook
```

Firestore data is stored under `users/{uid}/`:

- `lists`
- `items`: tasks, each with its repeat rule
- `completions`: one per checked-off occurrence
- `progress`: ticked steps per occurrence
- `meta/prefs`: theme and accent colour

Each day's tasks are worked out from the repeat rules rather than copied for every day.

## License

© 2026 Natasha Mykytiuk. All rights reserved. The code is published for viewing only; see [LICENSE](LICENSE).
