import { PenLine, ShieldAlert, UploadCloud, Users } from "lucide-react";

export const defaultStats = [
  { label: "Active Users", value: "1,284", change: "+12%", trend: "up", icon: Users },
  { label: "Authors Online", value: "42", change: "+5%", trend: "up", icon: PenLine },
  { label: "Books Uploaded Today", value: "156", change: "+8%", trend: "up", icon: UploadCloud },
  { label: "Failed Logins", value: "12", change: "-4%", trend: "down", icon: ShieldAlert, isAlert: true },
];

export const mapIconString = (iconKey = "users") => {
  const iconMap = {
    users: Users,
    "pen-line": PenLine,
    "upload-cloud": UploadCloud,
    "shield-alert": ShieldAlert,
  };
  return iconMap[iconKey] || Users;
};

export const normalizeStatApiResponse = (apiStats = []) =>
  apiStats.map((stat) => ({
    label: stat.label || "",
    value: stat.value || "—",
    change: stat.change || "0%",
    trend: stat.trend || "neutral",
    icon: mapIconString(stat.icon),
    isAlert: stat.isAlert || false,
  }));

export const normalizeActivityData = (apiActivity = []) =>
  (apiActivity || []).map((item) => ({
    time: item.time || item.label || "",
    value: Number(item.value || 0),
  }));

export const normalizeHealthData = (apiHealth = []) =>
  (apiHealth || []).map((item) => ({
    name: item.name || "",
    cpu: Number(item.cpu || 0),
    ram: Number(item.ram || 0),
  }));

export const normalizeTopBooksData = (apiBooks = []) =>
  (apiBooks || []).map((book) => ({
    rank: book.rank || "",
    title: book.title || "",
    author: book.author || "",
    status: book.status || "Steady",
    readers: Number(book.readers || 0),
    coverGradient: book.coverGradient || "from-slate-400 to-slate-600",
  }));
