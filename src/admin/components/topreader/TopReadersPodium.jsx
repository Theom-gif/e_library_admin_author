import React from "react";
import { BarChart3, BookOpen, Crown } from "lucide-react";
import { cn } from "../../../lib/utils";
import { medalByRank } from "./constants";
import { formatCompactNumber, getAvatarUrl, getDisplayName, getUserHandle } from "./helpers";

const RANK_CONFIG = {
  light: {
    1: {
      ring: "ring-4 ring-amber-400",
      badge: "bg-amber-50 text-amber-700 border border-amber-200",
      crown: "text-amber-400",
      gradient: "from-amber-50 to-orange-50",
      border: "border-amber-100",
      rankBg: "bg-amber-400 text-white",
    },
    2: {
      ring: "ring-4 ring-slate-300",
      badge: "bg-slate-100 text-slate-600 border border-slate-200",
      crown: "text-slate-400",
      gradient: "from-slate-50 to-slate-50",
      border: "border-slate-100",
      rankBg: "bg-slate-400 text-white",
    },
    3: {
      ring: "ring-4 ring-orange-300",
      badge: "bg-orange-50 text-orange-700 border border-orange-200",
      crown: "text-orange-400",
      gradient: "from-orange-50 to-amber-50",
      border: "border-orange-100",
      rankBg: "bg-orange-400 text-white",
    },
  },
  dark: {
    1: {
      ring: "ring-4 ring-amber-500",
      badge: "bg-amber-950/30 text-amber-300 border border-amber-700/40",
      crown: "text-amber-400",
      gradient: "from-amber-950/20 to-orange-950/20",
      border: "border-amber-700/40",
      rankBg: "bg-amber-500 text-white",
    },
    2: {
      ring: "ring-4 ring-slate-500",
      badge: "bg-slate-700 text-slate-300 border border-slate-600",
      crown: "text-slate-400",
      gradient: "from-slate-700/30 to-slate-700/30",
      border: "border-slate-600",
      rankBg: "bg-slate-500 text-white",
    },
    3: {
      ring: "ring-4 ring-orange-400",
      badge: "bg-orange-950/30 text-orange-300 border border-orange-700/40",
      crown: "text-orange-400",
      gradient: "from-orange-950/20 to-amber-950/20",
      border: "border-orange-700/40",
      rankBg: "bg-orange-500 text-white",
    },
  },
};

const AvatarWithFallback = ({ user, size = "h-20 w-20", ring = "" }) => {
  const [failed, setFailed] = React.useState(false);
  const name = getDisplayName(user);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (failed || !getAvatarUrl(user)) {
    return (
      <div className={cn("flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white", size, ring)}>
        {initials || "?"}
      </div>
    );
  }

  return (
    <img
      src={getAvatarUrl(user)}
      alt={name}
      className={cn("rounded-full object-cover", size, ring)}
      onError={() => setFailed(true)}
    />
  );
};

const PodiumCard = ({ isDark, entry, displayRank, isChampion }) => {
  const config = RANK_CONFIG[isDark ? 'dark' : 'light'][displayRank] || RANK_CONFIG[isDark ? 'dark' : 'light'][3];
  const medal = medalByRank[displayRank] || medalByRank[3];

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center rounded-2xl border bg-gradient-to-b p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        config.gradient,
        config.border,
        isChampion ? "md:-mt-4 md:pb-8 md:pt-8" : "",
      )}
    >
      {/* Rank badge */}
      <div className={cn("absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold shadow-sm border", medal.rankDot)}>
        #{displayRank}
      </div>

      {/* Champion crown */}
      {isChampion && (
        <div className="mb-2 flex items-center gap-1">
          <Crown size={16} className={config.crown} />
          <span className={isDark ? "text-xs font-semibold text-amber-400" : "text-xs font-semibold text-amber-600"}>Champion</span>
        </div>
      )}

      {/* Avatar */}
      <AvatarWithFallback
        user={entry.user}
        size={isChampion ? "h-24 w-24" : "h-16 w-16"}
        ring={config.ring}
      />

      {/* Name */}
      <div className="mt-4 text-center">
        <h4 className={cn("font-bold truncate max-w-[160px]", isDark ? "text-slate-100" : "text-slate-800", isChampion ? "text-lg" : "text-base")}>
          {getDisplayName(entry.user)}
        </h4>
        <p className={cn("mt-0.5 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>{getUserHandle(entry.user)}</p>
      </div>

      {/* Status badge — uses emoji icon from medalByRank */}
      <span className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border", medal.chip)}>
        <span>{medal.icon}</span>
        {medal.label}
      </span>

      {/* Stats */}
      <div className="mt-4 grid w-full grid-cols-2 gap-2">
        <div className={isDark ? "rounded-xl bg-slate-700/50 p-3 text-center shadow-sm" : "rounded-xl bg-white/80 p-3 text-center shadow-sm"}>
          <div className={cn("flex items-center justify-center gap-1", isDark ? "text-slate-400" : "text-slate-400")}>
            <BookOpen size={11} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Books</span>
          </div>
          <p className={isDark ? "mt-1 text-lg font-bold text-slate-200" : "mt-1 text-lg font-bold text-slate-800"}>{formatCompactNumber(entry.booksRead)}</p>
        </div>
        <div className={isDark ? "rounded-xl bg-slate-700/50 p-3 text-center shadow-sm" : "rounded-xl bg-white/80 p-3 text-center shadow-sm"}>
          <div className={cn("flex items-center justify-center gap-1", isDark ? "text-slate-400" : "text-slate-400")}>
            <BarChart3 size={11} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Score</span>
          </div>
          <p className={isDark ? "mt-1 text-lg font-bold text-slate-200" : "mt-1 text-lg font-bold text-slate-800"}>
            {formatCompactNumber(entry.booksRead * 7 + entry.trend * 14)}
          </p>
        </div>
      </div>

      {/* Trend */}
      {entry.trend > 0 && (
        <p className={isDark ? "mt-3 text-xs font-medium text-emerald-400" : "mt-3 text-xs font-medium text-emerald-600"}>
          ↑ +{entry.trend} momentum
        </p>
      )}
    </div>
  );
};

const TopReadersPodium = ({ isDark, t, podium, getActivityScore }) => {
  if (!podium || podium.length === 0) return null;

  // podium arrives as [2nd, 1st, 3rd]
  const [second, first, third] = podium;

  return (
    <div>
      <h3 className={isDark ? "mb-5 text-lg font-semibold text-slate-300" : "mb-5 text-lg font-semibold text-slate-700"}>{t("Top 3 Readers")}</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {second && <PodiumCard isDark={isDark} entry={second} displayRank={2} isChampion={false} />}
        {first  && <PodiumCard isDark={isDark} entry={first}  displayRank={1} isChampion={true}  />}
        {third  && <PodiumCard isDark={isDark} entry={third}  displayRank={3} isChampion={false} />}
      </div>
    </div>
  );
};

export default TopReadersPodium;
