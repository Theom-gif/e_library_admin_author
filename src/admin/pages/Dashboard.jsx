import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  CheckSquare,
  Database,
  Grid,
  HardDrive,
  Mail,
  Server,
  TrendingUp,
  Users,
  Crown,
  Medal,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import HealthItem from "../components/HealthItem";
import StatCard from "../components/StatCard";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiClient } from "../../lib/apiClient";
import {
  fetchDashboard,
  fetchDashboardActivity,
  fetchDashboardHealth,
  fetchDashboardStats,
  fetchTopReaders,
} from "../services/adminService";

const formatNumber = (value) =>
  Number.isFinite(Number(value))
    ? Number(value).toLocaleString()
    : "0";

const toActivity = (rows = []) =>
  rows.map((row) => ({
    name: row.name ?? row.label ?? row.date ?? "",
    users: Number(row.users ?? row.value ?? 0),
  }));

// Mock data for when API is unavailable
const MOCK_STATS = {
  totalUsers: 12483,
  totalBooks: 2847,
  pendingApprovals: 24,
  authors: 1234,
};

const MOCK_TRENDS = {
  totalUsers: 342,
  totalBooks: 127,
  pendingApprovals: -4,
  authors: 89,
};

const MOCK_ACTIVITY_7D = [
  { name: "Mon", users: 45 },
  { name: "Tue", users: 62 },
  { name: "Wed", users: 38 },
  { name: "Thu", users: 71 },
  { name: "Fri", users: 55 },
  { name: "Sat", users: 29 },
  { name: "Sun", users: 33 },
];

const MOCK_ACTIVITY_30D = [
  { name: "Mar 1", users: 120 }, { name: "Mar 5", users: 145 }, { name: "Mar 10", users: 98 },
  { name: "Mar 15", users: 167 }, { name: "Mar 20", users: 134 }, { name: "Mar 24", users: 89 },
];

const MOCK_HEALTH = {
  uptimePercent: 99.98,
  apiServer: { status: "online", latencyMs: 12 },
  database: { status: "online", queryTimeMs: 4 },
  fileStorage: { status: "warning", usedPercent: 78 },
  emailService: { status: "online", responseMs: 67 },
};

const MOCK_TOP_READERS = [
  {
    user: {
      id: 1,
      first_name: "Alice",
      last_name: "Johnson",
      email: "alice@example.com",
      avatar_url: "https://ui-avatars.com/api/?name=Alice+Johnson&background=0b1625&color=00f5a0",
    },
    booksRead: 52,
    trend: 8,
  },
  {
    user: {
      id: 2,
      first_name: "Bob",
      last_name: "Smith",
      email: "bob@example.com",
      avatar_url: "https://ui-avatars.com/api/?name=Bob+Smith&background=0b1625&color=00f5a0",
    },
    booksRead: 38,
    trend: 5,
  },
  {
    user: {
      id: 3,
      first_name: "Carol",
      last_name: "Davis",
      email: "carol@example.com",
      avatar_url: "https://ui-avatars.com/api/?name=Carol+Davis&background=0b1625&color=00f5a0",
    },
    booksRead: 24,
    trend: 3,
  },
];

const Dashboard = () => {
  const { t } = useLanguage();
  const [range, setRange] = useState("7d");
  const [topReadersRange, setTopReadersRange] = useState("week");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    pendingApprovals: 0,
    authors: 0,
  });
  const [trends, setTrends] = useState({
    totalUsers: 0,
    totalBooks: 0,
    pendingApprovals: 0,
    authors: 0,
  });
  const [activity, setActivity] = useState([]);
  const [topReaders, setTopReaders] = useState([]);
  const [health, setHealth] = useState({
    uptimePercent: 0,
    apiServer: { status: "online", latencyMs: 0 },
    database: { status: "online", queryTimeMs: 0 },
    fileStorage: { status: "online", usedPercent: 0 },
    emailService: { status: "online", responseMs: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [topReadersLoading, setTopReadersLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Try the unified endpoint first
        const unified = await fetchDashboard({ signal: controller.signal });
        if (unified?.stats) setStats(unified.stats);
        if (unified?.trends) setTrends(unified.trends);
        if (unified?.activity) setActivity(toActivity(unified.activity));
        if (unified?.health) setHealth(unified.health);

        // Fill gaps using split endpoints, if any data missing
        if (!unified?.stats || !unified?.trends) {
          const statsRes = await fetchDashboardStats({ signal: controller.signal });
          if (statsRes?.stats) setStats(statsRes.stats);
          if (statsRes?.trends) setTrends(statsRes.trends);
        }

        const activityRes = await fetchDashboardActivity(range, { signal: controller.signal });
        if (activityRes?.activity) setActivity(toActivity(activityRes.activity));

        const healthRes = await fetchDashboardHealth({ signal: controller.signal });
        if (healthRes?.health) setHealth(healthRes.health);

        setTopReadersLoading(true);
        const readersRes = await fetchTopReaders(topReadersRange, 3, { signal: controller.signal });
        if (readersRes?.data) setTopReaders(readersRes.data);
        setTopReadersLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        
        // Use mock data as fallback when API is unavailable
        console.warn("[Dashboard] API unavailable, using mock data:", err?.message);
        setStats(MOCK_STATS);
        setTrends(MOCK_TRENDS);
        setActivity(range === "7d" ? MOCK_ACTIVITY_7D : MOCK_ACTIVITY_30D);
        setHealth(MOCK_HEALTH);
        setTopReaders(MOCK_TOP_READERS);
        
        // Set a subtle notice instead of error
        setError(t("Showing demo data - API endpoints not configured"));
      } finally {
        if (mounted) setIsLoading(false);
        setTopReadersLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [range, topReadersRange, t]);

  const statCards = useMemo(
    () => [
      { label: t("Total Users"), value: formatNumber(stats.totalUsers), trend: trends.totalUsers, icon: Users, color: "bg-purple-500" },
      { label: t("Total Books"), value: formatNumber(stats.totalBooks), trend: trends.totalBooks, icon: BookOpen, color: "bg-pink-500" },
      { label: t("Pending Approvals"), value: formatNumber(stats.pendingApprovals), trend: trends.pendingApprovals, icon: CheckSquare, color: "bg-orange-500" },
      { label: t("Authors"), value: formatNumber(stats.authors), trend: trends.authors, icon: Grid, color: "bg-green-500" },
    ],
    [stats, trends, t],
  );

  const uptimeText = useMemo(() => {
    const value = health?.uptimePercent;
    if (!Number.isFinite(Number(value))) return t("99.9% uptime");
    return t("{value}% uptime", { value });
  }, [health?.uptimePercent, t]);

  return (
    <div className="space-y-8">
      {/* Error/Loading Messages */}
      {(isLoading || error) && (
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          {isLoading && (
            <span className="text-slate-400 text-sm">{t("Loading dashboard...")}</span>
          )}
          {error && (
            <span className={error.includes("demo data") ? "text-blue-400 text-sm" : "text-amber-300 text-sm"}>
              {error}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            trend={card.trend >= 0 ? `+${card.trend}` : `${card.trend}`}
            icon={card.icon}
            color={card.color}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-purple-500" />
              <h3 className="text-xl font-bold">{t("Platform Activity")}</h3>
            </div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="7d">{t("Last 7 days")}</option>
              <option value="30d">{t("Last 30 days")}</option>
            </select>
          </div>

          <div className="h-[300px] w-full min-w-0 overflow-hidden">
            {activity && activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1d26",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                {isLoading ? (
                  <span>{t("Loading activity data...")}</span>
                ) : (
                  <span>{t("No activity data available")}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Medal size={20} className="text-yellow-500" />
              <h3 className="text-xl font-bold">{t("Top Readers")}</h3>
            </div>
            <select
              value={topReadersRange}
              onChange={(e) => setTopReadersRange(e.target.value)}
              className="bg-gray-800 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value="week">{t("Week")}</option>
              <option value="month">{t("Month")}</option>
              <option value="all">{t("All Time")}</option>
            </select>
          </div>

          <div className="space-y-3 flex-1">
            {topReadersLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                {t("Loading...")}
              </div>
            ) : topReaders && topReaders.length > 0 ? (
              topReaders.map((reader, idx) => (
                <div key={reader.user?.id || idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {reader.user?.first_name && reader.user?.last_name
                        ? `${reader.user.first_name} ${reader.user.last_name}`
                        : reader.user?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {reader.booksRead} {t("books read")}
                    </p>
                  </div>
                  {reader.trend !== undefined && (
                    <div className={`text-xs font-semibold ${
                      reader.trend > 0 ? "text-green-400" : reader.trend < 0 ? "text-red-400" : "text-slate-400"
                    }`}>
                      {reader.trend > 0 ? "+" : ""}{reader.trend}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                {t("No readers data available")}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">{t("System Health")}</h3>
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              {uptimeText}
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <HealthItem label="API Server" value={`${health.apiServer?.latencyMs ?? 0}ms latency`} status={health.apiServer?.status || "online"} icon={Server} />
            <HealthItem label="Database" value={`${health.database?.queryTimeMs ?? 0}ms query time`} status={health.database?.status || "online"} icon={Database} />
            <HealthItem label="File Storage" value={`${health.fileStorage?.usedPercent ?? 0}% used`} status={health.fileStorage?.status || "online"} icon={HardDrive} />
            <HealthItem label="Email Service" value={`${health.emailService?.responseMs ?? 0}ms response`} status={health.emailService?.status || "online"} icon={Mail} />
          </div>

          <div className="mt-auto p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-purple-400">
                {trends.totalUsers >= 0 ? `+${trends.totalUsers}` : trends.totalUsers}
              </p>
              <TrendingUp size={16} className="text-purple-400" />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {t("Platform engagement is at an all-time high. Keep up the good work.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
