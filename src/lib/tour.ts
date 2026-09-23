import type { Item } from './types';

/** Where the app should be while a step is showing. 'list' means the user's first list (or Tasks if none). */
export type TourView = 'myday' | 'plan' | 'planned' | 'habits' | 'nolist' | 'list';

export type TourStep = { icon: string; title: string; body: string; view?: TourView };

export const TOUR: TourStep[] = [
  {
    icon: '👋',
    title: 'Welcome to Tally',
    body: 'Tally keeps your to-dos, plans and habits in one place. Here’s a quick look around; it takes about two minutes.',
  },
  {
    icon: '✏️',
    title: 'Adding and editing tasks',
    body: 'Type in the box at the top and press Enter. Click a task’s title to rename it, or anywhere else on it to open its details: steps, notes, its list, dates and more. Delete is at the bottom of the details.',
    view: 'nolist',
  },
  {
    icon: '☀',
    title: 'My Day',
    body: 'Everything for today: tasks you’ve added with ☀, anything due or planned for today, and today’s habits. Drag tasks up and down to put them in your own order, or use Sort for due date, date created or A to Z.',
    view: 'myday',
  },
  {
    icon: '✎',
    title: 'Plan',
    body: 'Decide when you’ll work on things before they’re due. Tap 🕒 on a task to pick one or more days, or add tasks straight onto a day. Drag a task to move it to another day. Tasks due soon that aren’t planned yet wait at the top.',
    view: 'plan',
  },
  {
    icon: '📅',
    title: 'Due dates and Scheduled',
    body: 'Tap 📅 on a task to give it a due date. Scheduled shows every task with a due date, grouped into Overdue, Today, Tomorrow, Later this week, Next week and Later.',
    view: 'planned',
  },
  {
    icon: '◔',
    title: 'Partly done',
    body: 'Right-click a task’s circle (long-press on a phone) to mark it 25%, 50%, 75% or any percent done; the circle fills to match. Steps fill it too. Worked on something enough today? Open it and choose Done for today to set it aside until tomorrow.',
    view: 'myday',
  },
  {
    icon: '📚',
    title: 'Lists',
    body: 'Make a list for each class or project with “New list” in the sidebar. Drag lists to reorder them. Right-click a list (or use Edit at the top of it) to rename it, change its colour or delete it; deleting a list deletes its tasks too. Tasks that aren’t in a list live under Tasks.',
    view: 'list',
  },
  {
    icon: '↻',
    title: 'Habits and repeats',
    body: 'Open a task and switch on Repeat to make it a habit: every few days, weeks (on the days you pick) or months, with an optional end date. Choose whether a missed day carries over or is let go. 🔥 shows your streak.',
    view: 'habits',
  },
  {
    icon: '⚙',
    title: 'Settings',
    body: 'At the bottom of the sidebar: light or dark mode and your accent colour, importing tasks from an Excel or CSV file, your account, and this tutorial if you want to see it again.',
  },
];

/** Show the tour to new accounts only: never finished it, and no tasks yet. */
export const shouldShowTour = (tourDone: boolean | undefined, items: Item[]): boolean => !tourDone && items.length === 0;
