import { PenLine, ShieldAlert, UploadCloud, Users } from "lucide-react";

// ── Legacy dashboard constants ─────────────────────────────────────────────────
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
  { rank: "#1", title: "The Shadows of Time",   author: "Elena Thorne",    status: "Trending",     readers: 428, coverGradient: "from-primary to-slate-900" },
  { rank: "#2", title: "Digital Renaissance",   author: "Marcus Vane",     status: "Popular",      readers: 312, coverGradient: "from-indigo-500 to-purple-800" },
  { rank: "#3", title: "Minimal Architecture",  author: "Sara Jenkins",    status: "Popular",      readers: 195, coverGradient: "from-slate-400 to-slate-600" },
  { rank: "#4", title: "The Silent Echo",        author: "Liam Fletcher",   status: "Steady",       readers: 87,  coverGradient: "from-emerald-500 to-teal-800" },
  { rank: "#5", title: "Quantum Leaps",          author: "Dr. Julian Reis", status: "New Release",  readers: 64,  coverGradient: "from-rose-500 to-primary" },
];

export const footerItems = [
  { dotClass: "bg-emerald-500",              text: "Database: Connection Active" },
  { dotClass: "bg-emerald-500",              text: "Storage: 4.2TB Available" },
  { dotClass: "bg-primary animate-pulse",    text: "Last Backup: 12 minutes ago" },
];

// ── System monitor simulation constants ───────────────────────────────────────
export const REGIONS  = ["phnom-penh", "singapore", "tokyo", "frankfurt"];
export const SERVICES = ["ssh", "sudo", "nginx", "postgres", "systemd"];
export const ACTIONS  = [
  "SSH login", "Sudo elevation", "API token refresh",
  "Config deployment", "Session timeout", "Permission denied",
];
export const LOG_USERS = ["root", "deploy", "monitor", "ubuntu", "ops", "admin"];

export const ALERT_THRESHOLDS = [
  { metric: "cpu",    label: "CPU",    warn: 85, crit: 95 },
  { metric: "memory", label: "Memory", warn: 88, crit: 96 },
  { metric: "disk",   label: "Disk",   warn: 90, crit: 97 },
  { metric: "swap",   label: "Swap",   warn: 70, crit: 90 },
];

export const PROCESS_NAMES = [
  "node", "nginx", "postgres", "redis-server", "python3",
  "systemd", "sshd", "cron", "dockerd", "vite",
  "java", "mongod", "rabbitmq", "elasticsearch", "grafana",
];

export const DISK_PARTITIONS = [
  { device: "/dev/sda1", mountpoint: "/",       fstype: "ext4",  totalGb: 100 },
  { device: "/dev/sda2", mountpoint: "/home",   fstype: "ext4",  totalGb: 200 },
  { device: "/dev/sdb1", mountpoint: "/data",   fstype: "xfs",   totalGb: 500 },
  { device: "/dev/sdc1", mountpoint: "/backup", fstype: "ext4",  totalGb: 1000 },
];

export const NETWORK_INTERFACES = [
  { name: "eth0",  speedMbps: 1000 },
  { name: "eth1",  speedMbps: 1000 },
  { name: "lo",    speedMbps: 0 },
  { name: "wlan0", speedMbps: 300 },
];

// ── Legacy stat defaults ───────────────────────────────────────────────────────
export const defaultStats = [
  { label: "Active Users",        value: "1,284", change: "+12%", trend: "up",   icon: Users,       isAlert: false },
  { label: "Authors Online",      value: "42",    change: "+5%",  trend: "up",   icon: PenLine,     isAlert: false },
  { label: "Books Uploaded Today",value: "156",   change: "+8%",  trend: "up",   icon: UploadCloud, isAlert: false },
  { label: "Failed Logins",       value: "12",    change: "-4%",  trend: "down", icon: ShieldAlert, isAlert: true  },
];
