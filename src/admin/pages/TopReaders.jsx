import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Download,
  Search,
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

const getDisplayName = (user = {}) =>
  `${user.first_name || "Unknown"} ${user.last_name || ""}`.trim();
const getAvatarUrl = (user) => {
  if (user?.avatar_url) return user.avatar_url;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    getDisplayName(user)
  )}&background=0b1625&color=00f5a0`;
};
const getUserHandle = (user = {}) => {
  const local = user?.email ? String(user.email).split("@")[0] : "";
  return local ? `@${local}` : "@reader";
};

const formatCompactNumber = (value) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));

const formatMemberSince = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

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

        // Backend Endpoint: GET /api/admin/leaderboard/readers
        // Backend Query: Groups BookRead records by user_id, counts total books read
        // Filters by date range (all|month|week) and limits results
        // Response: { data: [{ user: {...}, booksRead: number, trend: number }, ...] }
        
        const response = await apiClient.get("/admin/leaderboard/readers", {
          params: {
            range: range,      // all | month | week
            limit: 10,         // number of top readers to return
          },
          signal: controller.signal,
        });

        // Extract data array - handle both nested and flat response structures
        const rows = Array.isArray(response?.data?.data) 
          ? response.data.data 
          : Array.isArray(response?.data) 
          ? response.data 
          : [];

        if (!isMounted) return;

        // If no data found, use fallback mock data
        if (!rows || rows.length === 0) {
          console.warn("[TopReaders] No leaderboard data from backend, using fallback data");
          setLeaders(fallbackLeaders);
          return;
        }

        // Map backend response to component format
        // Normalize field names (snake_case → camelCase)
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

        console.error("[TopReaders] API Error:", { status, message });

        if (status === 401) {
          setError(t("Session expired. Redirecting to login..."));
          handleUnauthorized();
        } else if (status === 404) {
          console.warn("[TopReaders] Endpoint not found, using fallback data");
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

  const normalizedLeaders = useMemo(() => {
    return leaders.map((entry, idx) => ({
      ...entry,
      rank: entry.rank || idx + 1,
      booksRead: Number(entry.booksRead || 0),
      trend: Number(entry.trend || 0),
    }));
  }, [leaders]);

  const rankedLeaders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = normalizedLeaders.filter((entry) => {
      if (!query) return true;
      const text = `${getDisplayName(entry.user)} ${entry.user?.email || ""}`.toLowerCase();
      return text.includes(query);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "activity") {
        const scoreA = Number(a.booksRead || 0) * 7 + Number(a.trend || 0) * 14;
        const scoreB = Number(b.booksRead || 0) * 7 + Number(b.trend || 0) * 14;
        return scoreB - scoreA;
      }
      return Number(b.booksRead || 0) - Number(a.booksRead || 0);
    });

    return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [normalizedLeaders, searchQuery, sortBy]);

  const podium = useMemo(() => {
    if (!rankedLeaders.length) return [];
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
  const maxScore = Math.max(
    ...rankedLeaders.map((entry) => Number(entry.booksRead || 0) * 7 + Number(entry.trend || 0) * 14),
    1
  );

  const getActivityScore = (entry) =>
    Number(entry.booksRead || 0) * 7 + Number(entry.trend || 0) * 14;

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
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.8fr]">
        <div className="glass-card rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(72,84,171,0.2),rgba(8,12,28,0.56))] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-black">{t("Total Readers")}</p>
              <h3 className="mt-2 text-3xl font-extrabold">{formatCompactNumber(totalReaders)}</h3>
              <p className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1">
                <ArrowUpRight size={12} />
                +{formatCompactNumber(Math.max(1, totalReaders * 0.12))} {t("this period")}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Users size={18} className="text-indigo-300" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-pink-400/25 bg-[linear-gradient(135deg,rgba(232,121,249,0.15),rgba(12,17,36,0.58))] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-black">{t("Books Read")}</p>
              <h3 className="mt-2 text-3xl font-extrabold">{formatCompactNumber(totalBooksRead)}</h3>
              <p className="mt-2 text-xs text-pink-300 inline-flex items-center gap-1">
                <TrendingUp size={12} />
                +{(rankedLeaders[0]?.trend || 0).toFixed(1)}% {t("trend")}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <BookOpen size={18} className="text-pink-300" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(72,84,171,0.2),rgba(8,12,28,0.58))] p-5">
          <div className="flex items-start justify-between gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-black">{t("Weekly Reading Goal")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("Community reading challenge progress")}</p>
              <div className="mt-4 h-2.5 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${goalPct}%`, background: "linear-gradient(90deg,#818cf8,#ec4899)" }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold">{goalPct}%</div>
              <p className="text-xs text-slate-500 mt-1">{t("Target")}: {formatCompactNumber(goalTarget)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[46px] font-black tracking-tight leading-none">{t("Top Readers")}</h2>
          <p className="text-base text-slate-500 mt-2">{t("Users with highest reading activity across all categories")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search users")}
              className="w-48 rounded-full border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <CalendarDays size={14} className="text-slate-400" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="all">{t("All Time")}</option>
              <option value="month">{t("Monthly Stats")}</option>
              <option value="week">{t("This Week")}</option>
            </select>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <BarChart3 size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="books">{t("Sort: Books")}</option>
              <option value="activity">{t("Sort: Activity")}</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10 transition"
            >
              <Download size={14} />
              {t("Export Data")}
            </button>
          </div>
        </div>
      </div>

      {(error || isLoading) && (
        <div className="glass-card p-4 border border-white/10 text-sm">
          {isLoading ? (
            <span className="text-slate-400">{t("Loading leaderboard...")}</span>
          ) : (
            <span className="text-rose-300">{error}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {podium.map((entry, index) => {
          const isChampion = index === 1;
          const displayRank = isChampion ? 1 : index === 0 ? 2 : 3;
          const activityScore = getActivityScore(entry);
          const medal = displayRank === 1
            ? {
                text: "text-amber-200",
                avatar: "border-amber-300/70",
                badge: "bg-gradient-to-br from-amber-300 to-yellow-500 text-[#4a3200]",
                card: "border-amber-300/30 shadow-amber-900/25",
              }
            : displayRank === 2
            ? {
                text: "text-slate-200",
                avatar: "border-slate-300/70",
                badge: "bg-gradient-to-br from-slate-200 to-slate-400 text-[#1f2937]",
                card: "border-slate-300/25 shadow-slate-900/20",
              }
            : {
                text: "text-orange-200",
                avatar: "border-orange-300/70",
                badge: "bg-gradient-to-br from-orange-300 to-amber-600 text-[#3f2200]",
                card: "border-orange-300/25 shadow-orange-900/20",
              };

          return (
            <div
              key={entry.user?.id ?? entry.rank ?? index}
              className={cn(
                "relative rounded-2xl p-6 text-center border border-white/10 bg-[linear-gradient(135deg,rgba(39,55,110,0.22),rgba(8,13,30,0.64))] h-full flex flex-col",
                isChampion ? "md:-mt-8 shadow-2xl" : "shadow-xl shadow-black/15",
                medal.card
              )}
            >
              {isChampion && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-5 py-1 text-xs font-black tracking-[0.16em] text-[#5b3f03] bg-[#f2c863] border border-[#ffd978]">
                  {t("Champion")}
                </div>
              )}
              <div
                className={cn(
                  "mx-auto relative rounded-full overflow-hidden border-2 shadow-lg mb-4",
                  isChampion ? "w-32 h-32" : "w-24 h-24",
                  medal.avatar
                )}
              >
                <img
                  src={getAvatarUrl(entry.user)}
                  alt={getDisplayName(entry.user)}
                  className="w-full h-full object-cover"
                />
                <div className={cn("absolute -bottom-1 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full border border-white/20 flex items-center justify-center font-black", medal.badge)}>
                  {displayRank}
                </div>
              </div>
              <h4 className={cn("font-bold leading-tight break-words", isChampion ? "text-4xl" : "text-3xl", medal.text)}>{getDisplayName(entry.user)}</h4>
              <p className="text-base text-slate-500 mt-1">{getUserHandle(entry.user)}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 py-3">
                  <p className="text-2xl font-black text-amber-300">{entry.booksRead}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 font-black">{t("Books Read")}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 py-3">
                  <p className="text-2xl font-black text-indigo-300">{activityScore}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 font-black">{t("Activity Score")}</p>
                </div>
              </div>
              <div className="mt-4 text-sm font-semibold text-emerald-300 inline-flex items-center gap-1 justify-center">
                <ArrowUpRight size={14} /> {t("Momentum")} +{entry.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card overflow-hidden border border-white/10 shadow-xl shadow-black/20 rounded-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black">{t("Leaderboard Rankings")}</h3>
            <p className="text-sm text-slate-500 mt-1">{t("Reader Performance")} - {getRangeLabel(range)}</p>
          </div>
          <p className="text-sm text-slate-500">{t("Showing")} {rankedLeaders.length} {t("users")}</p>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/2 text-slate-500 text-[11px] font-black uppercase tracking-[0.12em]">
              <th className="px-6 py-4">{t("Rank")}</th>
              <th className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} />
                  {t("Reader")}
                </span>
              </th>
              <th className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={12} />
                  {t("Books Read")}
                </span>
              </th>
              <th className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5">
                  <BarChart3 size={12} />
                  {t("Activity Score")}
                </span>
              </th>
              <th className="px-6 py-4">{t("Status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rankedLeaders.map((entry, idx) => {
              const score = getActivityScore(entry);
              const scorePct = Math.max(8, Math.round((score / maxScore) * 100));
              const status = getStatus(entry, idx);
              return (
              <tr
                key={entry.user?.id ?? entry.rank ?? idx}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 font-black text-slate-500 text-lg">
                  #{entry.rank || idx + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(entry.user)}
                      alt={getDisplayName(entry.user)}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div className="leading-tight">
                      <span className="font-semibold block">
                        {getDisplayName(entry.user)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {getUserHandle(entry.user)} - {formatMemberSince(entry.user.created_at)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-xl">
                  {entry.booksRead}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${scorePct}%`, background: "linear-gradient(90deg,#818cf8,#ec4899)" }}
                      />
                    </div>
                    <span className="font-bold text-sm">{score}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-xs font-bold inline-flex items-center gap-1 border px-2.5 py-1 rounded-full",
                    status === t("Top Reader")
                      ? "bg-pink-500/10 text-pink-300 border-pink-400/30"
                      : status === t("Rising Star")
                      ? "bg-indigo-500/10 text-indigo-300 border-indigo-400/30"
                      : "bg-white/5 text-slate-300 border-white/10"
                  )}>
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
    </div>
  );
};

export default TopReaders;

