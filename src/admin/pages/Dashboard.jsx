import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckSquare,
  Grid,
  Users,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  fetchDashboard,
  fetchDashboardActivity,
  fetchDashboardHealth,
  fetchDashboardStats,
  fetchTopReaders,
} from "../services/adminService";
import ActivityChartCard from "../components/dashboard/ActivityChartCard";
import DashboardStatsGrid from "../components/dashboard/DashboardStatsGrid";
import DashboardStatusNotice from "../components/dashboard/DashboardStatusNotice";
import SystemHealthCard from "../components/dashboard/SystemHealthCard";
import TopReadersCard from "../components/dashboard/TopReadersCard";
import {
  MOCK_ACTIVITY_30D,
  MOCK_ACTIVITY_7D,
  MOCK_HEALTH,
  MOCK_STATS,
  MOCK_TOP_READERS,
  MOCK_TRENDS,
} from "../components/dashboard/constants";

const formatNumber = (value) =>
  Number.isFinite(Number(value))
    ? Number(value).toLocaleString()
    : "0";

const toActivity = (rows = []) =>
  rows.map((row) => ({
    name: row.name ?? row.label ?? row.date ?? "",
    users: Number(row.users ?? row.value ?? 0),
  }));


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
        // 1. Try unified endpoint first
        const unified = await fetchDashboard({ signal: controller.signal });
        if (unified?.stats) setStats(unified.stats);
        if (unified?.trends) setTrends(unified.trends);
        if (Array.isArray(unified?.activity)) setActivity(toActivity(unified.activity));
        if (unified?.health) setHealth(unified.health);

        // 2. Fill stats gap if unified didn't return them
        if (!unified?.stats || !unified?.trends) {
          const statsRes = await fetchDashboardStats({ signal: controller.signal });
          if (statsRes?.stats) setStats(statsRes.stats);
          if (statsRes?.trends) setTrends(statsRes.trends);
        }

        // 3. Activity — { activity: [...], meta: { range, startDate, endDate, totalUsers } }
        const activityRes = await fetchDashboardActivity(range, { signal: controller.signal });
        if (Array.isArray(activityRes?.activity)) {
          setActivity(toActivity(activityRes.activity));
        }

        // 4. Health — response is the health object directly (no wrapper key)
        // Shape: { uptimePercent, apiServer, database, fileStorage, emailService }
        const healthRes = await fetchDashboardHealth({ signal: controller.signal });
        if (healthRes?.apiServer || healthRes?.uptimePercent !== undefined) {
          setHealth(healthRes);
        } else if (healthRes?.health) {
          setHealth(healthRes.health);
        }

        // 5. Top readers
        setTopReadersLoading(true);
        const readersRes = await fetchTopReaders(topReadersRange, 3, { signal: controller.signal });
        if (Array.isArray(readersRes?.data)) setTopReaders(readersRes.data);
        else if (Array.isArray(readersRes)) setTopReaders(readersRes);
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
      <DashboardStatusNotice t={t} isLoading={isLoading} error={error} />
      <DashboardStatsGrid statCards={statCards} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <ActivityChartCard t={t} range={range} onRangeChange={setRange} activity={activity} isLoading={isLoading} />
        <TopReadersCard
          t={t}
          topReadersRange={topReadersRange}
          onTopReadersRangeChange={setTopReadersRange}
          topReadersLoading={topReadersLoading}
          topReaders={topReaders}
        />
        <SystemHealthCard t={t} uptimeText={uptimeText} health={health} trends={trends} />
      </div>
    </div>
  );
};

export default Dashboard;
