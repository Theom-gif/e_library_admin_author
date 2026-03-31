import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, TrendingUp, Users } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";
import { apiClient } from "../../lib/apiClient";
import { fallbackLeaders } from "../components/topreader/constants";
import {
  formatCompactNumber,
  getDisplayName,
  formatMemberSince,
  getUserHandle,
} from "../components/topreader/helpers";
import SummaryCard from "../components/topreader/SummaryCard";
import TopReadersHeader from "../components/topreader/TopReadersHeader";
import TopReadersLoading from "../components/topreader/TopReadersLoading";
import TopReadersPodium from "../components/topreader/TopReadersPodium";
import TopReadersTable from "../components/topreader/TopReadersTable";

const TopReaders = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [range, setRange] = useState("all");
  const [leaders, setLeaders] = useState(fallbackLeaders);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("books");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getRangeLabel = (rangeValue) => {
    switch (rangeValue) {
      case "week":
        return t("This Week");
      case "month":
        return t("This Month");
      case "all":
      default:
        return t("All Time");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await apiClient.get("/admin/leaderboard/readers", {
          params: { range, limit: 10 },
          signal: controller.signal,
        });

        const rows = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
            ? response.data
            : [];

        if (!isMounted) return;

        if (!rows || rows.length === 0) {
          setLeaders(fallbackLeaders);
          return;
        }

        const normalized = rows.map((row, idx) => {
          const user = row.user || {};
          return {
            user: {
              id: user.id ?? "",
              first_name: user.first_name ?? user.firstName ?? "Unknown",
              last_name: user.last_name ?? user.lastName ?? "",
              email: user.email ?? "",
              avatar_url:
                user.avatar_url ||
                user.avatarUrl ||
                user.profile_photo_url ||
                user.profile_image ||
                user.photo ||
                null,
              created_at: user.created_at ?? user.createdAt ?? "",
            },
            booksRead: Number(row.booksRead ?? row.books_read ?? 0),
            trend: Number(row.trend ?? 0),
            rank: idx + 1,
          };
        });

        setLeaders(normalized);
      } catch (err) {
        if (!isMounted || controller.signal.aborted) return;

        const status = err?.response?.status;
        const message = err?.response?.data?.message || err?.message;

        if (status === 401) {
          setError(message || t("You are not authorized to view this leaderboard right now."));
          setLeaders(fallbackLeaders);
        } else if (status === 404) {
          setLeaders(fallbackLeaders);
        } else {
          setError(message || t("Failed to load leaderboard."));
          setLeaders(fallbackLeaders);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [range, t]);

  const normalizedLeaders = useMemo(
    () =>
      leaders.map((entry, idx) => ({
        ...entry,
        rank: entry.rank || idx + 1,
        booksRead: Number(entry.booksRead || 0),
        trend: Number(entry.trend || 0),
      })),
    [leaders],
  );

  const getActivityScore = (entry) => Number(entry.booksRead || 0) * 7 + Number(entry.trend || 0) * 14;

  const rankedLeaders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = normalizedLeaders.filter((entry) => {
      if (!query) return true;
      const text = `${getDisplayName(entry.user)} ${entry.user?.email || ""}`.toLowerCase();
      return text.includes(query);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "activity") return getActivityScore(b) - getActivityScore(a);
      return Number(b.booksRead || 0) - Number(a.booksRead || 0);
    });

    return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [normalizedLeaders, searchQuery, sortBy]);

  const podium = useMemo(() => {
    const first = rankedLeaders[0];
    const second = rankedLeaders[1];
    const third = rankedLeaders[2];
    return [second, first, third].filter(Boolean);
  }, [rankedLeaders]);

  const totalBooksRead = useMemo(
    () => rankedLeaders.reduce((sum, entry) => sum + Number(entry.booksRead || 0), 0),
    [rankedLeaders],
  );

  const totalReaders = rankedLeaders.length;
  const goalTarget = Math.max(100, totalReaders * 40);
  const goalPct = Math.min(100, Math.round((totalBooksRead / goalTarget) * 100));
  const maxScore = Math.max(...rankedLeaders.map((entry) => getActivityScore(entry)), 1);

  const getStatus = (entry, idx) => {
    if (idx < 3) return t("Top Reader");
    if (Number(entry.trend || 0) >= 7) return t("Rising Star");
    return t("Active");
  };

  const handleExportData = () => {
    const rows = rankedLeaders.map((entry, idx) => ({
      rank: entry.rank || idx + 1,
      name: getDisplayName(entry.user),
      handle: getUserHandle(entry.user),
      books_read: entry.booksRead,
      activity_score: getActivityScore(entry),
      trend: entry.trend,
      member_since: formatMemberSince(entry.user?.created_at),
    }));
    const header = Object.keys(rows[0] || {
      rank: "",
      name: "",
      handle: "",
      books_read: "",
      activity_score: "",
      trend: "",
      member_since: "",
    });
    const csv = [
      header.join(","),
      ...rows.map((row) =>
        header.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `top-readers-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={isDark ? "min-h-screen bg-slate-900 px-4 py-6 sm:px-6 lg:px-8" : "min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"}>
      <div className="mx-auto max-w-[1280px] space-y-8 font-['Inter',sans-serif]">
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <SummaryCard
            isDark={isDark}
            icon={Users}
            label={t("Total Readers")}
            value={formatCompactNumber(totalReaders)}
            hint={<><ArrowUpRight size={12} />+{formatCompactNumber(Math.max(1, Math.round(totalReaders * 0.12)))} {t("this period")}</>}
            iconTone="indigo"
          />
          <SummaryCard
            isDark={isDark}
            icon={BookOpen}
            label={t("Books Read")}
            value={formatCompactNumber(totalBooksRead)}
            hint={<><TrendingUp size={12} />+{(rankedLeaders[0]?.trend || 0).toFixed(1)}% {t("trend")}</>}
            iconTone="emerald"
          />
          <SummaryCard
            isDark={isDark}
            icon={TrendingUp}
            label={t("Weekly Reading Goal")}
            value={`${goalPct}%`}
            hint={t("Community reading challenge")}
            iconTone="violet"
            progress={goalPct}
          />
        </div>

        {/* Header + controls */}
        <TopReadersHeader
          isDark={isDark}
          t={t}
          range={range}
          onRangeChange={setRange}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onExport={handleExportData}
        />

        {/* Error */}
        {error && !isLoading && (
          <div className={isDark ? "rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4 text-sm text-rose-400" : "rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600"}>
            {error}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <TopReadersLoading />
        ) : (
          <>
            <TopReadersPodium isDark={isDark} t={t} podium={podium} getActivityScore={getActivityScore} />
            <TopReadersTable
              isDark={isDark}
              t={t}
              rankedLeaders={rankedLeaders}
              rangeLabel={getRangeLabel(range)}
              maxScore={maxScore}
              getActivityScore={getActivityScore}
              getStatus={getStatus}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TopReaders;
