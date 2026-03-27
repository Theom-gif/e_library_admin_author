import React from "react";
import { Target } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatCompactNumber, formatMemberSince, getAvatarUrl, getDisplayName, getUserHandle } from "./helpers";
import SurfaceCard from "./SurfaceCard";

const TopReadersTable = ({ t, rankedLeaders, rangeLabel, maxScore, getActivityScore, getStatus }) => (
  <SurfaceCard className="overflow-hidden p-0">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-6 py-5 dark:border-slate-700/70">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {t("Leaderboard Rankings")}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("Reader Performance")} - {rangeLabel}
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
              <tr key={entry.user?.id ?? entry.rank ?? idx} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    #{entry.rank || idx + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={getAvatarUrl(entry.user)} alt={getDisplayName(entry.user)} className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700" />
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
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out" style={{ width: `${scorePct}%` }} />
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
                          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
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
);

export default TopReadersTable;
