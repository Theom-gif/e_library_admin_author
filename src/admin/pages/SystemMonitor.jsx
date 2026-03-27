import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  fetchMonitorActivity,
  fetchMonitorDashboard,
  fetchMonitorHealth,
  fetchMonitorStats,
  fetchMonitorTopBooks,
} from "../services/adminService";
import ActivityChartCard from "../components/system/ActivityChartCard";
import HealthChartCard from "../components/system/HealthChartCard";
import SystemMonitorFooter from "../components/system/SystemMonitorFooter";
import SystemStatusBanner from "../components/system/SystemStatusBanner";
import TopBooksTable from "../components/system/TopBooksTable";
import {
  defaultActivityData,
  defaultHealthData,
  defaultTopBooks,
  footerItems,
} from "../components/system/constants";
import {
  defaultStats,
  normalizeActivityData,
  normalizeHealthData,
  normalizeStatApiResponse,
  normalizeTopBooksData,
} from "../components/system/helpers";

const SystemMonitor = () => {
  const { t } = useLanguage();
  const [range, setRange] = useState("24h");
  const [, setStats] = useState(defaultStats);
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
        const unified = await fetchMonitorDashboard({ signal: controller.signal });
        if (unified?.stats) setStats(normalizeStatApiResponse(unified.stats));
        if (unified?.activity) setActivityData(normalizeActivityData(unified.activity));
        if (unified?.health) setHealthData(normalizeHealthData(unified.health));
        if (unified?.topBooks) setTopBooks(normalizeTopBooksData(unified.topBooks));

        if (!unified?.stats) {
          const statsRes = await fetchMonitorStats({ signal: controller.signal });
          if (statsRes?.stats) setStats(normalizeStatApiResponse(statsRes.stats));
        }

        if (!unified?.activity) {
          const activityRes = await fetchMonitorActivity(range, { signal: controller.signal });
          if (activityRes?.activity) setActivityData(normalizeActivityData(activityRes.activity));
        }

        if (!unified?.health) {
          const healthRes = await fetchMonitorHealth({ signal: controller.signal });
          if (healthRes?.health) setHealthData(normalizeHealthData(healthRes.health));
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
            t("Failed to load system monitor data. Using fallback data."),
        );
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
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background-dark/50 p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <SystemStatusBanner t={t} isLoading={isLoading} error={error} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ActivityChartCard range={range} onRangeChange={setRange} activityData={activityData} />
              <HealthChartCard healthData={healthData} />
            </div>

            <TopBooksTable topBooks={topBooks} />
          </motion.div>
        </main>
      </div>

      <SystemMonitorFooter items={footerItems} />
    </div>
  );
};

export default SystemMonitor;
