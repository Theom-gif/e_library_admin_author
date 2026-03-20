import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Crown,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { USERS } from "../data/mockData";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiClient } from "../../lib/apiClient";

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

const PodiumBadge = ({ rank }) => {
  const palette = [
    "from-emerald-500 to-emerald-300",
    "from-slate-600 to-slate-400",
    "from-amber-500 to-amber-300",
  ];
  return (
    <div
      className={`absolute -top-6 w-14 h-14 rounded-2xl bg-gradient-to-br ${
        palette[rank] || palette[0]
      } shadow-lg shadow-emerald-900/30 border border-white/10 flex items-center justify-center text-bg-dark text-2xl font-black`}
    >
      {rank + 1}
    </div>
  );
};

const TopReaders = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState(fallbackLeaders);
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

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        const { data } = await apiClient.get(
          "/api/admin/leaderboard/readers",
          { params: { range: "all", limit: 50 } }
        );
        const rows = Array.isArray(data?.data) ? data.data : [];
        if (!isMounted) return;
        if (!rows.length) {
          setLeaders(fallbackLeaders);
          return;
        }
        const normalized = rows.map((row, idx) => ({
          ...row,
          rank: idx + 1,
        }));
        setLeaders(normalized);
      } catch (err) {
        if (!isMounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          setError(t("Session expired. Redirecting to login..."));
          handleUnauthorized();
        } else {
          setError(err?.response?.data?.message || err?.message || t("Failed to load leaderboard."));
          setLeaders(fallbackLeaders);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const podium = useMemo(() => {
    if (!leaders.length) return [];
    const enriched = leaders.map((entry, idx) => ({ ...entry, rank: entry.rank || idx + 1 }));
    const first = enriched[0];
    const second = enriched[1];
    const third = enriched[2];
    const order = [];
    if (second) order.push(second);
    if (first) order.push(first);
    if (third) order.push(third);
    return order;
  }, [leaders]);

  return (
    <div className="space-y-8">
      {/* Header / Shell */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 px-6 py-4 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-300 flex items-center justify-center text-bg-dark font-black shadow-lg shadow-emerald-900/30">
            <Crown size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
              Obsidian Ledger
            </p>
            <h2 className="text-xl font-bold">Top Readers Leaderboard</h2>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-200 px-3 py-1 border border-emerald-400/20">
            <TrendingUp size={16} />
            {t("Engagement +12%")}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 text-slate-200 px-3 py-1 border border-white/10">
            <Sparkles size={16} />
            {t("Updated daily")}
          </span>
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

      {/* Podium with centered #1 */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
        {podium.map((entry, index) => {
          const isCenter = index === 1;
          const rankIndex = isCenter ? 0 : index === 0 ? 1 : 2; // visual badge gradient
          const cardClasses = isCenter
            ? "md:-mt-8 scale-100 md:scale-105 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/70 border border-emerald-400/20 shadow-2xl shadow-emerald-900/30"
            : "bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-800/60 border border-white/10 shadow-xl shadow-black/25";

          return (
            <div
              key={entry.user?.id ?? entry.rank ?? index}
              className={`relative rounded-2xl px-6 pt-10 pb-6 w-full max-w-sm flex flex-col items-center text-center ${cardClasses}`}
            >
              <PodiumBadge rank={rankIndex} />
              <div
                className={`rounded-2xl overflow-hidden border ${
                  isCenter ? "border-emerald-400/40" : "border-white/10"
                } shadow-lg shadow-black/30 mb-4`}
              >
                <img
                  src={getAvatarUrl(entry.user)}
                  alt={getDisplayName(entry.user)}
                  className={`object-cover ${
                    isCenter ? "w-28 h-28" : "w-24 h-24"
                  }`}
                />
              </div>
              <h4
                className={`font-bold ${
                  isCenter ? "text-xl" : "text-lg"
                }`}
              >
                {getDisplayName(entry.user)}
              </h4>
              <p className="text-slate-400 text-sm mb-4">
                {entry.user.email}
              </p>
              <div
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border ${
                  isCenter
                    ? "bg-emerald-500/10 border-emerald-400/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <BookOpen
                  size={16}
                  className={isCenter ? "text-emerald-300" : "text-emerald-200"}
                />
                <span
                  className={`font-bold ${
                    isCenter ? "text-2xl" : "text-xl"
                  } text-white`}
                >
                  {entry.booksRead}
                </span>
                <span className="text-xs text-slate-400 uppercase font-black tracking-wide">
                  {t("Books")}
                </span>
              </div>
              <div className="mt-3 text-xs font-semibold text-emerald-200 inline-flex items-center gap-1">
                <ArrowUpRight size={14} /> {t("Momentum")} +{entry.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="glass-card overflow-hidden border border-white/10 shadow-xl shadow-black/25">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {t("Complete Leaderboard")}
            </p>
            <h3 className="text-lg font-bold text-white">
              {t("Reader Performance")}
            </h3>
          </div>
          <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none text-slate-100">
            <option>{t("All Time")}</option>
            <option>{t("This Month")}</option>
            <option>{t("This Week")}</option>
          </select>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/2 text-slate-500 text-[11px] font-black uppercase tracking-[0.12em]">
              <th className="px-6 py-4">{t("Rank")}</th>
              <th className="px-6 py-4">{t("Reader")}</th>
              <th className="px-6 py-4">{t("Books Read")}</th>
              <th className="px-6 py-4">{t("Member Since")}</th>
              <th className="px-6 py-4 text-right">{t("Trend")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leaders.map((entry, idx) => (
              <tr
                key={entry.user?.id ?? entry.rank ?? idx}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 font-black text-slate-500">
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
                      <span className="font-semibold text-white block">
                        {getDisplayName(entry.user)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {entry.user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-emerald-200">
                  {entry.booksRead}
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {entry.user.created_at}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-emerald-300 text-xs font-bold inline-flex items-center justify-end gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                    <ArrowUpRight size={14} />
                    +{entry.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopReaders;
