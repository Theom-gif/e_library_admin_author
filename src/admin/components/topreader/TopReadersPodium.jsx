import React from "react";
import { ArrowUpRight, BarChart3, BookOpen, Sparkles } from "lucide-react";
import { cn } from "../../../lib/utils";
import { medalByRank } from "./constants";
import { formatCompactNumber, getAvatarUrl, getDisplayName, getUserHandle } from "./helpers";
import StatPill from "./StatPill";
import SurfaceCard from "./SurfaceCard";

const TopReadersPodium = ({ t, podium, getActivityScore }) => (
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
            isChampion ? "md:-mt-4 md:order-2" : index === 0 ? "md:order-1" : "md:order-3",
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
              <img src={getAvatarUrl(entry.user)} alt={getDisplayName(entry.user)} className={cn("rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900", isChampion ? "h-20 w-20" : "h-16 w-16")} />
              <span className={cn("absolute -bottom-2 -right-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm font-semibold", medal.rankDot)}>
                {displayRank}
              </span>
            </div>
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", medal.chip)}>
              {medal.icon} {medal.label}
            </span>
          </div>

          <div className="mt-5 space-y-1">
            <h4 className="truncate text-xl font-semibold text-slate-900 dark:text-slate-100">{getDisplayName(entry.user)}</h4>
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
);

export default TopReadersPodium;
