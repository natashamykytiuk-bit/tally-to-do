import type { Item } from './types';

/** Where the app should be while a step is showing. 'list' means the user's first list. */
export type TourView = 'myday' | 'plan' | 'planned' | 'habits' | 'list';

export type TourStep = { icon: string; title: string; body: string; view?: TourView };

export const TOUR: TourStep[] = [
  {
    icon: '👋',
    title: 'Welcome to Tally',
    body: 'Tally keeps your to-dos and your habits in one place. Here’s a quick look around. It takes about a minute.',
  },
  {
    icon: '☀',
    title: 'My Day',
    body: 'Everything for today: tasks you’ve added to My Day, anything due or overdue, and habits scheduled for today.',
    view: 'myday',
  },
  {
    icon: '📚',
    title: 'Lists',
    body: 'Make a list for each class or project in the sidebar. Drag ≡ to reorder, and right-click a list (long-press on a phone) to rename it, recolour it or delete it. Tasks you add outside a list collect under Tasks.',
    view: 'list',
  },
  {
    icon: '✏️',
    title: 'Tasks',
    body: 'Type in the box at the top and press Enter to add a task. Click a title to rename it, 🕒 to plan days to work on it, 📅 to set a due date, ☀ to add it to My Day, and × to delete it. Click anywhere else on a task for details, notes and steps.',
    view: 'list',
  },
  {
    icon: '✎',
    title: 'Plan',
    body: 'Plan when you’ll work on things before they’re due. Tap 🕒 on a task and pick one or more days, or add tasks straight onto a day here. Drag ≡ to move a task to another day. Tasks due soon that aren’t planned yet wait at the top.',
    view: 'plan',
  },
  {
    icon: '↻',
    title: 'Habits and repeats',
    body: 'Open a task and switch on Repeat to make it a habit: every few days, weeks or months. Choose whether a missed day carries over or is let go. 🔥 shows your streak.',
    view: 'habits',
  },
  {
    icon: '▦',
    title: 'Scheduled',
    body: 'Every task with a due date, grouped into Overdue, Today, Tomorrow and Later.',
    view: 'planned',
  },
  {
    icon: '⚙',
    title: 'Make it yours',
    body: 'Settings, at the bottom of the sidebar, has light and dark mode and your accent colour. You can replay this tour from there too.',
  },
];

/** Show the tour to new accounts only: never finished it, and no tasks yet. */
export const shouldShowTour = (tourDone: boolean | undefined, items: Item[]): boolean => !tourDone && items.length === 0;
