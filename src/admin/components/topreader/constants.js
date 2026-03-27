import { USERS } from "../../data/mockData";

export const fallbackLeaders = [
  { user: USERS[4], booksRead: 52, trend: 8 },
  { user: USERS[3], booksRead: 38, trend: 5 },
  { user: USERS[2], booksRead: 24, trend: 3 },
];

export const medalByRank = {
  1: {
    icon: "🥇",
    label: "Gold",
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/20",
    rankDot: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/20",
  },
  2: {
    icon: "🥈",
    label: "Silver",
    chip: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-400/20",
    rankDot: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-400/20",
  },
  3: {
    icon: "🥉",
    label: "Bronze",
    chip: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-400/20",
    rankDot: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-400/20",
  },
};
