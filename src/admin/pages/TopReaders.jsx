import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Download,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { USERS } from "../data/mockData";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiClient } from "../../lib/apiClient";
import { cn } from "../../lib/utils";

const fallbackLeaders = [
  { user: USERS[4], booksRead: 52, trend: 8 },
  { user: USERS[3], booksRead: 38, trend: 5 },
  { user: USERS[2], booksRead: 24, trend: 3 },
];

const medalByRank = {
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

const getDisplayName = (user = {}) =>
  `${user.first_name || "Unknown"} ${user.last_name || ""}`.trim();

const getAvatarUrl = (user) => {
  if (user?.avatar_url) return user.avatar_url;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    getDisplayName(user)
  )}&background=e2e8f0&color=1e293b`;
};

const getUserHandle = (user = {}) => {
  const local = user?.email ? String(user.email).split("@")[0] : "";
  return local ? `@${local}` : "@reader";
};

const formatCompactNumber = (value) =>
  new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const formatMemberSince = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const SurfaceCard = ({ className, children }) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_-20px_rgba(15,23,42,0.35)] transition-all duration-300 ease-out dark:border-slate-700/80 dark:bg-slate-900/85 dark:shadow-[0_10px_35px_-20px_rgba(2,6,23,0.9)]",
      className
    )}
  >
    {children}
  </div>
);

const SummaryCard = ({ icon: Icon, label, value, hint, iconTone = "indigo" }) => {
  const iconToneMap = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  };

  return (
    <SurfaceCard className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold leading-none text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 dark:border-slate-700/80",
            iconToneMap[iconTone]
          )}
        >
          <Icon size={18} />
        </div>
      </div>
    </SurfaceCard>
  );
};

const StatPill = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-800/70">
    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
      <Icon size={13} />
      {label}
    </p>
    <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
  </div>
);

const SkeletonBlock = ({ className }) => (
  <div
    className={cn(
      "animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/70",
      className
    )}
  />
);

const TopReaders = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [range, setRange] = useState("all");
  const [leaders, setLeaders] = useState(fallbackLeaders);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("books");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUnauthorized = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("bookhub_token");
      sessionStorage.removeItem("bookhub_token");
      localStorage.removeItem("bookhub_session");
      sessionStorage.removeItem("bookhub_session");
    }
    navigate("/login", { replace: true });
  };

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
          params: {
            range,
            limit: 10,
          },
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
              avatar_url: user.avatar_url || user.avatarUrl || null,
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
          setError(t("Session expired. Redirecting to login..."));
          handleUnauthorized();
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
    [leaders]
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
    [rankedLeaders]
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
      ...rows.map((row) => header.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(",")),
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
    <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-2 font-['Inter',sans-serif] sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SummaryCard
          icon={Users}
          label={t("Total Readers")}
          value={formatCompactNumber(totalReaders)}
          hint={
            <>
              <ArrowUpRight size={14} className="text-emerald-500" />
              +{formatCompactNumber(Math.max(1, totalReaders * 0.12))} {t("this period")}
            </>
          }
          iconTone="indigo"
        />

        <SummaryCard
          icon={BookOpen}
          label={t("Books Read")}
          value={formatCompactNumber(totalBooksRead)}
          hint={
            <>
              <TrendingUp size={14} className="text-emerald-500" />
              +{(rankedLeaders[0]?.trend || 0).toFixed(1)}% {t("trend")}
            </>
          }
          iconTone="emerald"
        />

        <SurfaceCard className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                {t("Weekly Reading Goal")}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("Community reading challenge progress")}
              </p>
              <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{goalPct}%</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("Target")}: {formatCompactNumber(goalTarget)}
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            {t("Top Readers")}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            {t("Users with highest reading activity across all categories")}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search users")}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
            <CalendarDays size={14} className="text-slate-400" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-transparent text-slate-700 outline-none dark:text-slate-200"
            >
              <option value="all">{t("All Time")}</option>
              <option value="month">{t("Monthly Stats")}</option>
              <option value="week">{t("This Week")}</option>
            </select>
          </div>

          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
            <BarChart3 size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-700 outline-none dark:text-slate-200"
            >
              <option value="books">{t("Sort: Books")}</option>
              <option value="activity">{t("Sort: Activity")}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
          >
            <Download size={14} />
            {t("Export Data")}
          </button>
        </div>
      </div>

      {error && !isLoading && (
        <SurfaceCard className="border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </SurfaceCard>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <SurfaceCard key={key} className="p-6">
                <SkeletonBlock className="h-5 w-24" />
                <SkeletonBlock className="mt-4 h-10 w-20" />
                <SkeletonBlock className="mt-4 h-4 w-36" />
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <SkeletonBlock className="h-14 w-full" />
                  <SkeletonBlock className="h-14 w-full" />
                </div>
              </SurfaceCard>
            ))}
          </div>
          <SurfaceCard className="overflow-hidden p-0">
            <div className="space-y-4 p-6">
              <SkeletonBlock className="h-6 w-44" />
              {[1, 2, 3, 4].map((key) => (
                <SkeletonBlock key={key} className="h-12 w-full" />
              ))}
            </div>
          </SurfaceCard>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {podium.map((entry, index) => {
              const isChampion = index === 1;
              const displayRank = isChampion ? 1 : index === 0 ? 2 : 3;
              const activityScore = getActivityScore(entry);
              const medal = medalByRank[displayRank] || medalByRank[3];

              return (
                <SurfaceCard
                  key={entry.user?.id ?? entry.rank ?? index}
                  className={cn(
                    "group relative overflow-hidden p-6 hover:-translate-y-1 hover:shadow-[0_14px_40px_-22px_rgba(79,70,229,0.45)] dark:hover:shadow-[0_14px_40px_-22px_rgba(99,102,241,0.45)]",
                    isChampion ? "md:-mt-4 md:order-2" : index === 0 ? "md:order-1" : "md:order-3"
                  )}
                >
                  {isChampion && (
                    <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-200">
                      <Sparkles size={12} />
                      {t("Top 1")}
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <img
                        src={getAvatarUrl(entry.user)}
                        alt={getDisplayName(entry.user)}
                        className={cn(
                          "rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900",
                          isChampion ? "h-20 w-20" : "h-16 w-16"
                        )}
                      />
                      <span
                        className={cn(
                          "absolute -bottom-2 -right-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm font-semibold",
                          medal.rankDot
                        )}
                      >
                        {displayRank}
                      </span>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", medal.chip)}>
                      {medal.icon} {medal.label}
                    </span>
                  </div>

                  <div className="mt-5 space-y-1">
                    <h4 className="truncate text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {getDisplayName(entry.user)}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{getUserHandle(entry.user)}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <StatPill icon={BookOpen} label={t("Books Read")} value={formatCompactNumber(entry.booksRead)} />
                    <StatPill icon={BarChart3} label={t("Activity Score")} value={formatCompactNumber(activityScore)} />
                  </div>

                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-300">
                    <ArrowUpRight size={14} />
                    {t("Momentum")} +{entry.trend}
                  </p>
                </SurfaceCard>
              );
            })}
          </div>

          <SurfaceCard className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-6 py-5 dark:border-slate-700/70">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {t("Leaderboard Rankings")}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("Reader Performance")} - {getRangeLabel(range)}
                </p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("Showing")} {rankedLeaders.length} {t("users")}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4 font-semibold">{t("Rank")}</th>
                    <th className="px-6 py-4 font-semibold">{t("Reader")}</th>
                    <th className="px-6 py-4 font-semibold">{t("Books Read")}</th>
                    <th className="px-6 py-4 font-semibold">{t("Activity Score")}</th>
                    <th className="px-6 py-4 font-semibold">{t("Status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
                  {rankedLeaders.map((entry, idx) => {
                    const score = getActivityScore(entry);
                    const scorePct = Math.max(8, Math.round((score / maxScore) * 100));
                    const status = getStatus(entry, idx);

                    return (
                      <tr
                        key={entry.user?.id ?? entry.rank ?? idx}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            #{entry.rank || idx + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getAvatarUrl(entry.user)}
                              alt={getDisplayName(entry.user)}
                              className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900 dark:text-slate-100">{getDisplayName(entry.user)}</p>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {getUserHandle(entry.user)} - {formatMemberSince(entry.user.created_at)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {formatCompactNumber(entry.booksRead)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                                style={{ width: `${scorePct}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {formatCompactNumber(score)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                              status === t("Top Reader")
                                ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-200"
                                : status === t("Rising Star")
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-200"
                                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            )}
                          >
                            <Target size={12} />
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </>
      )}
    </div>
  );
};

export default TopReaders;
