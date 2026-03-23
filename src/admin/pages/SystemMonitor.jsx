import React, { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Library,
  PenLine,
  Search,
  Settings,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  fetchMonitorDashboard,
  fetchMonitorStats,
  fetchMonitorActivity,
  fetchMonitorHealth,
  fetchMonitorTopBooks,
} from "../services/adminService";

// Fallback mock data for when API is unavailable
const defaultActivityData = [
  { time: '00:00', value: 30 },
  { time: '04:00', value: 45 },
  { time: '08:00', value: 35 },
  { time: '12:00', value: 65 },
  { time: '16:00', value: 40 },
  { time: '20:00', value: 85 },
  { time: '23:59', value: 55 },
];

const defaultHealthData = [
  { name: 'CPU', cpu: 45, ram: 60 },
  { name: 'RAM', cpu: 70, ram: 40 },
  { name: 'Disk', cpu: 30, ram: 80 },
  { name: 'Net', cpu: 85, ram: 20 },
];

const defaultTopBooks = [
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

const defaultStats = [
  { label: "Active Users", value: "1,284", change: "+12%", trend: "up", icon: Users },
  { label: "Authors Online", value: "42", change: "+5%", trend: "up", icon: PenLine },
  { label: "Books Uploaded Today", value: "156", change: "+8%", trend: "up", icon: UploadCloud },
  { label: "Failed Logins", value: "12", change: "-4%", trend: "down", icon: ShieldAlert, isAlert: true },
];

const normalizeStatApiResponse = (apiStats = []) => {
  // Convert API response to expected format
  return apiStats.map((stat) => ({
    label: stat.label || "",
    value: stat.value || "—",
    change: stat.change || "0%",
    trend: stat.trend || "neutral",
    icon: mapIconString(stat.icon),
    isAlert: stat.isAlert || false,
  }));
};

const normalizeActivityData = (apiActivity = []) => {
  return (apiActivity || []).map((item) => ({
    time: item.time || item.label || "",
    value: Number(item.value || 0),
  }));
};

const normalizeHealthData = (apiHealth = []) => {
  return (apiHealth || []).map((item) => ({
    name: item.name || "",
    cpu: Number(item.cpu || 0),
    ram: Number(item.ram || 0),
  }));
};

const normalizeTopBooksData = (apiBooks = []) => {
  return (apiBooks || []).map((book) => ({
    rank: book.rank || "",
    title: book.title || "",
    author: book.author || "",
    status: book.status || "Steady",
    readers: Number(book.readers || 0),
    coverGradient: book.coverGradient || "from-slate-400 to-slate-600",
  }));
};

const mapIconString = (iconKey = "users") => {
  const iconMap = {
    users: Users,
    "pen-line": PenLine,
    "upload-cloud": UploadCloud,
    "shield-alert": ShieldAlert,
    activity: Library,
  };
  return iconMap[iconKey] || Users;
};

const SystemMonitor = () => {
  const { t } = useLanguage();
  const [range, setRange] = useState("24h");
  const [stats, setStats] = useState(defaultStats);
  const [activityData, setActivityData] = useState(defaultActivityData);
  const [healthData, setHealthData] = useState(defaultHealthData);
  const [topBooks, setTopBooks] = useState(defaultTopBooks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Try unified endpoint first
        const unified = await fetchMonitorDashboard({ signal: controller.signal });
        if (unified?.stats) setStats(normalizeStatApiResponse(unified.stats));
        if (unified?.activity) setActivityData(normalizeActivityData(unified.activity));
        if (unified?.health) setHealthData(normalizeHealthData(unified.health));
        if (unified?.topBooks) setTopBooks(normalizeTopBooksData(unified.topBooks));

        // Fill gaps with split endpoints
        if (!unified?.stats) {
          const statsRes = await fetchMonitorStats({ signal: controller.signal });
          if (statsRes?.stats)setStats(normalizeStatApiResponse(statsRes.stats));
        }

        if (!unified?.activity) {
          const activityRes = await fetchMonitorActivity(range, { signal: controller.signal });
          if (activityRes?.activity)
            setActivityData(normalizeActivityData(activityRes.activity));
        }

        if (!unified?.health) {
          const healthRes = await fetchMonitorHealth({ signal: controller.signal });
          if (healthRes?.health)
            setHealthData(normalizeHealthData(healthRes.health));
        }

        if (!unified?.topBooks) {
          const booksRes = await fetchMonitorTopBooks(5, { signal: controller.signal });
          if (booksRes?.topBooks) setTopBooks(normalizeTopBooksData(booksRes.topBooks));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Failed to load monitor data:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            t("Failed to load system monitor data. Using fallback data.")
        );
        // Keep fallback data visible
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [range, t]);

  return (
    <div className="flex h-screen flex-col bg-background-dark text-slate-100 font-sans selection:bg-primary/30">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-white/5 bg-background-dark px-6 py-3 z-20">
        <div className="flex items-center gap-8">
          <div className="relative flex items-center w-80">
            <Search className="absolute left-3 w-4 h-4 text-slate-500" />
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 py-2 focus:ring-1 focus:ring-primary text-sm transition-all outline-none"
              placeholder="Search resources, books, or users..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">Admin User</p>
              <p className="text-[10px] text-slate-500">System Overseer</p>
            </div>
            <div
              className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold overflow-hidden border-2 border-primary/20"
              style={{
                backgroundImage: "url('https://picsum.photos/seed/admin/100/100')",
                backgroundSize: 'cover'
              }}
            >
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background-dark/50 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Status Messages */}
            {(isLoading || error) && (
              <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
                {isLoading && (
                  <span className="text-slate-400 text-sm">{t("Loading monitor data...")}</span>
                )}
                {error && (
                  <span className="text-amber-300 text-sm">{error}</span>
                )}
              </div>
            )}
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                const isUp = stat.trend === "up";

                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-white/5 p-6 rounded-xl border shadow-sm ${stat.isAlert ? "border-rose-500/20 bg-rose-500/5" : "border-white/5"}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`p-2 rounded-lg ${stat.isAlert ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className={`${isUp ? "text-emerald-500" : "text-rose-500"} text-xs font-bold flex items-center gap-1`}>
                        {stat.change}
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    <h3 className={`text-2xl font-bold mt-1 ${stat.isAlert ? "text-rose-500" : ""}`}>{stat.value}</h3>
                  </motion.div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* User Activity Chart */}
              <div className="bg-white/5 p-6 rounded-xl border border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold">User Activity ({range === "24h" ? "24h" : "7 Days"})</h4>
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg focus:ring-0 outline-none p-1 px-2 text-slate-400 cursor-pointer"
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                  </select>
                </div>
                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00bcd4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a2529', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#00bcd4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#00bcd4"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Server Health Chart */}
              <div className="bg-white/5 p-6 rounded-xl border border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold">Server Health</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-primary"></span>
                      <span className="text-xs text-slate-500">CPU</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-primary/30"></span>
                      <span className="text-xs text-slate-500">RAM</span>
                    </div>
                  </div>
                </div>
                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthData}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0, 188, 212, 0.05)' }}
                        contentStyle={{ backgroundColor: '#0a2529', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      />
                      <Bar dataKey="cpu" fill="#00bcd4" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="ram" fill="rgba(0, 188, 212, 0.3)" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Books Table */}
            <div className="bg-white/5 rounded-xl border border-white/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h4 className="font-bold">Top 5 Books Currently Being Read</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Book Title</th>
                      <th className="px-6 py-4">Author</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Current Readers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topBooks.map((book) => (
                      <tr key={book.rank} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-bold text-primary">{book.rank}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-14 rounded shadow-sm overflow-hidden flex-shrink-0 bg-gradient-to-br ${book.coverGradient} flex items-center justify-center`}>
                              <BookOpen className="w-5 h-5 text-white/50" />
                            </div>
                            <span className="font-medium group-hover:text-primary transition-colors">{book.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{book.author}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${book.status === 'Trending' ? 'bg-emerald-500/10 text-emerald-500' :
                            book.status === 'Popular' ? 'bg-primary/10 text-primary' :
                              book.status === 'New Release' ? 'bg-rose-500/10 text-rose-500' :
                                'bg-slate-500/10 text-slate-500'
                            }`}>
                            {book.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">{book.readers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Footer System Health Info */}
      <footer className="bg-background-dark border-t border-white/5 px-6 py-3 text-[11px] text-slate-500 flex justify-between items-center z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Database: Connection Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Storage: 4.2TB Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>Last Backup: 12 minutes ago</span>
          </div>
        </div>
        <div className="font-mono opacity-60">
          Session ID: LB-TR-7482-9901
        </div>
      </footer>
    </div>
  );
}

export default SystemMonitor;

