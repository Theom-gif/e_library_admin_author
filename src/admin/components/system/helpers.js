import { PenLine, ShieldAlert, UploadCloud, Users } from "lucide-react";
import {
  ACTIONS, ALERT_THRESHOLDS, DISK_PARTITIONS,
  LOG_USERS, NETWORK_INTERFACES, PROCESS_NAMES, REGIONS, SERVICES,
} from "./constants";

// ── Utilities ──────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round = (v, d = 1) => parseFloat(v.toFixed(d));

let _cpuBase    = rand(30, 55);
let _memBase    = rand(45, 65);
let _diskBase   = rand(40, 60);
let _swapBase   = rand(10, 30);
let _netInBase  = rand(0.1, 1.5);
let _netOutBase = rand(0.05, 0.8);
let _bootTime   = Date.now() - randInt(3600, 86400 * 7) * 1000;

const drift = (base, delta, lo, hi) => {
  const next = base + rand(-delta, delta);
  return clamp(next, lo, hi);
};

// ── Health snapshot ────────────────────────────────────────────────────────────
export const generateHealth = () => {
  _cpuBase    = drift(_cpuBase,    4,  2,  98);
  _memBase    = drift(_memBase,    2,  5,  98);
  _diskBase   = drift(_diskBase,   0.3, 10, 98);
  _swapBase   = drift(_swapBase,   1,  0,  95);
  _netInBase  = drift(_netInBase,  0.3, 0,  10);
  _netOutBase = drift(_netOutBase, 0.2, 0,  5);

  const cpu    = round(_cpuBase);
  const memory = round(_memBase);
  const disk   = round(_diskBase);
  const swap   = round(_swapBase);

  const uptimeSec = Math.floor((Date.now() - _bootTime) / 1000);
  const days = Math.floor(uptimeSec / 86400);
  const hrs  = Math.floor((uptimeSec % 86400) / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const uptime = days ? `${days}d ${hrs}h ${mins}m` : hrs ? `${hrs}h ${mins}m` : `${mins}m`;

  const alerts = [];
  const now = new Date().toISOString();
  for (const { metric, label, warn, crit } of ALERT_THRESHOLDS) {
    const val = { cpu, memory, disk, swap }[metric];
    if (val >= crit) {
      alerts.push({ id: `${metric}-crit`, level: "critical", metric, value: val, threshold: crit,
        message: `${label} critical: ${val}% (threshold ${crit}%)`, at: now });
    } else if (val >= warn) {
      alerts.push({ id: `${metric}-warn`, level: "warning", metric, value: val, threshold: warn,
        message: `${label} elevated: ${val}% (threshold ${warn}%)`, at: now });
    }
  }

  const cpuCores = 8;
  const scaled   = Math.max(cpu / 100, 0.1) * cpuCores;
  return {
    hostname: "bookhub-server-01",
    platform: "Linux",
    cpu,
    cpuCores,
    cpuFreqMhz: round(rand(2400, 3800), 0),
    memory,
    memoryTotalGb: 16,
    memoryUsedGb: round(16 * memory / 100, 2),
    swap,
    swapTotalGb: 4,
    disk,
    uptime,
    uptimeSeconds: uptimeSec,
    networkIn:  round(_netInBase, 3),
    networkOut: round(_netOutBase, 3),
    networkTotalInMb:  round(rand(500, 2000), 2),
    networkTotalOutMb: round(rand(200, 800), 2),
    activeSessions: randInt(1, 8),
    processCount:   randInt(120, 280),
    threadCount:    randInt(400, 900),
    loadAverage: [
      round(clamp(scaled * 0.8 + rand(-0.1, 0.1), 0.1, scaled * 1.5), 2),
      round(clamp(scaled       + rand(-0.1, 0.1), 0.1, scaled * 1.5), 2),
      round(clamp(scaled * 1.1 + rand(-0.1, 0.1), 0.1, scaled * 1.5), 2),
    ],
    alerts,
    updatedAt: new Date().toISOString(),
  };
};

// ── History (ring buffer, max 120 points) ─────────────────────────────────────
const _ring = [];
const RING_MAX = 120;

export const pushHistory = (health) => {
  _ring.push({
    timestamp:  health.updatedAt,
    cpu:        health.cpu,
    memory:     health.memory,
    disk:       health.disk,
    networkIn:  health.networkIn,
    networkOut: health.networkOut,
  });
  if (_ring.length > RING_MAX) _ring.shift();
};

export const getHistory = (points = 48) => {
  if (_ring.length >= points) return _ring.slice(-points);

  // Pad with synthetic back-fill
  const needed = points - _ring.length;
  const now    = Date.now();
  const pad    = [];
  for (let i = needed; i > 0; i--) {
    const phase = i / 3.2;
    pad.push({
      timestamp:  new Date(now - i * 5000).toISOString(),
      cpu:        round(clamp(_cpuBase    + Math.sin(phase) * 9  + rand(-3, 3),   2, 99)),
      memory:     round(clamp(_memBase    + Math.cos(phase / 1.7) * 6 + rand(-2, 2), 5, 99)),
      disk:       round(clamp(_diskBase   + Math.sin(phase / 2.4) * 2 + rand(-0.8, 0.8), 10, 99)),
      networkIn:  round(rand(0, 2), 3),
      networkOut: round(rand(0, 1), 3),
    });
  }
  return [...pad, ..._ring];
};

// ── Logs ───────────────────────────────────────────────────────────────────────
const logStatus = () => {
  const r = Math.random();
  return r < 0.12 ? "error" : r < 0.30 ? "warning" : "success";
};

export const generateLogs = (limit = 60) => {
  const now = Date.now();
  return Array.from({ length: limit }, (_, i) => ({
    id:       `log-${Date.now()}-${i}`,
    user:     pick(LOG_USERS),
    action:   pick(ACTIONS),
    sourceIp: `10.21.${i % 8}.${20 + i}`,
    status:   logStatus(),
    service:  pick(SERVICES),
    region:   pick(REGIONS),
    at:       new Date(now - i * 3 * 60 * 1000).toISOString(),
  }));
};

// ── Processes ──────────────────────────────────────────────────────────────────
export const generateProcesses = (limit = 30, sortBy = "cpu") => {
  const procs = PROCESS_NAMES.slice(0, Math.max(limit, PROCESS_NAMES.length)).map((name, i) => ({
    pid:           1000 + i * 37,
    name,
    status:        Math.random() > 0.05 ? "running" : "sleeping",
    cpu:           round(rand(0, 35)),
    memoryMb:      round(rand(10, 512), 2),
    memoryPercent: round(rand(0.1, 8), 2),
    threads:       randInt(1, 32),
    user:          pick(["root", "www-data", "postgres", "node", "ubuntu"]),
    created:       new Date(Date.now() - randInt(60, 86400 * 30) * 1000).toISOString(),
  }));

  const keyMap = { cpu: "cpu", memory: "memoryMb", name: "name", pid: "pid", threads: "threads" };
  const key    = keyMap[sortBy] || "cpu";
  procs.sort((a, b) => key === "name" ? a.name.localeCompare(b.name) : b[key] - a[key]);
  return procs.slice(0, limit);
};

// ── Disks ──────────────────────────────────────────────────────────────────────
export const generateDisks = () =>
  DISK_PARTITIONS.map(({ device, mountpoint, fstype, totalGb }) => {
    const usedGb = round(rand(totalGb * 0.2, totalGb * 0.85), 2);
    return {
      device, mountpoint, fstype,
      totalGb,
      usedGb,
      freeGb:  round(totalGb - usedGb, 2),
      percent: round((usedGb / totalGb) * 100),
    };
  });

// ── Network interfaces ─────────────────────────────────────────────────────────
export const generateNetworkInterfaces = () =>
  NETWORK_INTERFACES.map(({ name, speedMbps }) => ({
    name,
    isUp:         name !== "wlan0" || Math.random() > 0.1,
    speedMbps,
    bytesSentMb:  round(rand(100, 5000), 2),
    bytesRecvMb:  round(rand(200, 8000), 2),
    packetsSent:  randInt(10000, 500000),
    packetsRecv:  randInt(15000, 600000),
    errIn:        randInt(0, 5),
    errOut:       randInt(0, 3),
    addresses:    name === "lo" ? ["127.0.0.1"] : [`192.168.1.${randInt(1, 254)}`],
  }));

// ── Stats summary ──────────────────────────────────────────────────────────────
export const generateStats = (logs, health) => {
  const byStatus  = { success: 0, warning: 0, error: 0 };
  const byService = {};
  for (const l of logs) {
    byStatus[l.status]  = (byStatus[l.status]  || 0) + 1;
    byService[l.service] = (byService[l.service] || 0) + 1;
  }
  const byLevel = { warning: 0, critical: 0 };
  for (const a of health.alerts) byLevel[a.level] = (byLevel[a.level] || 0) + 1;

  return {
    logStats:   { byStatus, byService, total: logs.length },
    alertStats: { byLevel, total: health.alerts.length, active: health.alerts.map((a) => a.metric) },
  };
};

// ── Legacy normalizers (kept for backward compat) ─────────────────────────────
const iconMap = { users: Users, "pen-line": PenLine, "upload-cloud": UploadCloud, "shield-alert": ShieldAlert };
export const mapIconString = (key = "users") => iconMap[key] || Users;

export const normalizeStatApiResponse = (apiStats = []) =>
  apiStats.map((s) => ({
    label: s.label || "", value: s.value || "—", change: s.change || "0%",
    trend: s.trend || "neutral", icon: mapIconString(s.icon), isAlert: s.isAlert || false,
  }));

export const normalizeActivityData = (apiActivity = []) =>
  (apiActivity || []).map((item) => ({ time: item.time || item.label || "", value: Number(item.value || 0) }));

export const normalizeHealthData = (apiHealth = []) =>
  (apiHealth || []).map((item) => ({ name: item.name || "", cpu: Number(item.cpu || 0), ram: Number(item.ram || 0) }));

export const normalizeTopBooksData = (apiBooks = []) =>
  (apiBooks || []).map((book) => ({
    rank: book.rank || "", title: book.title || "", author: book.author || "",
    status: book.status || "Steady", readers: Number(book.readers || 0),
    coverGradient: book.coverGradient || "from-slate-400 to-slate-600",
  }));

export const defaultStats = [
  { label: "Active Users",         value: "1,284", change: "+12%", trend: "up",   icon: Users,       isAlert: false },
  { label: "Authors Online",       value: "42",    change: "+5%",  trend: "up",   icon: PenLine,     isAlert: false },
  { label: "Books Uploaded Today", value: "156",   change: "+8%",  trend: "up",   icon: UploadCloud, isAlert: false },
  { label: "Failed Logins",        value: "12",    change: "-4%",  trend: "down", icon: ShieldAlert, isAlert: true  },
];
