export const defaultActivityData = [
  { time: "00:00", value: 30 },
  { time: "04:00", value: 45 },
  { time: "08:00", value: 35 },
  { time: "12:00", value: 65 },
  { time: "16:00", value: 40 },
  { time: "20:00", value: 85 },
  { time: "23:59", value: 55 },
];

export const defaultHealthData = [
  { name: "CPU", cpu: 45, ram: 60 },
  { name: "RAM", cpu: 70, ram: 40 },
  { name: "Disk", cpu: 30, ram: 80 },
  { name: "Net", cpu: 85, ram: 20 },
];

export const defaultTopBooks = [
  {
    rank: "#1",
    title: "The Shadows of Time",
    author: "Elena Thorne",
    status: "Trending",
    readers: 428,
    coverGradient: "from-primary to-slate-900",
  },
  {
    rank: "#2",
    title: "Digital Renaissance",
    author: "Marcus Vane",
    status: "Popular",
    readers: 312,
    coverGradient: "from-indigo-500 to-purple-800",
  },
  {
    rank: "#3",
    title: "Minimal Architecture",
    author: "Sara Jenkins",
    status: "Popular",
    readers: 195,
    coverGradient: "from-slate-400 to-slate-600",
  },
  {
    rank: "#4",
    title: "The Silent Echo",
    author: "Liam Fletcher",
    status: "Steady",
    readers: 87,
    coverGradient: "from-emerald-500 to-teal-800",
  },
  {
    rank: "#5",
    title: "Quantum Leaps",
    author: "Dr. Julian Reis",
    status: "New Release",
    readers: 64,
    coverGradient: "from-rose-500 to-primary",
  },
];

export const footerItems = [
  { dotClass: "bg-emerald-500", text: "Database: Connection Active" },
  { dotClass: "bg-emerald-500", text: "Storage: 4.2TB Available" },
  { dotClass: "bg-primary animate-pulse", text: "Last Backup: 12 minutes ago" },
];
