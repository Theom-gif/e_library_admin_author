import React, { useState } from "react";
import { Target } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatCompactNumber, formatMemberSince, getAvatarUrl, getDisplayName, getUserHandle } from "./helpers";

const PAGE_SIZE = 7;

const STATUS_STYLES = {
  "Top Reader":  "bg-indigo-50 text-indigo-700 border border-indigo-100",
  "Rising Star": "bg-emerald-50 text-emerald-700 border border-emerald-100",
  "Active":      "bg-slate-100 text-slate-600 border border-slate-200",
};

const RANK_STYLES = {
  1: "bg-amber-400 text-white font-bold",
  2: "bg-slate-400 text-white font-bold",
  3: "bg-orange-400 text-white font-bold",
};

const AvatarCell = ({ user }) => {
  const [failed, setFailed] = React.useState(false);
  const name = getDisplayName(user);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (failed || !getAvatarUrl(user)) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
        {initials || "?"}
      </div>
    );
  }

  return (
    <img
      src={getAvatarUrl(user)}
      alt={name}
      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
      onError={() => setFailed(true)}
    />
  );
};

const TopReadersTable = ({ t, rankedLeaders, rangeLabel, maxScore, getActivityScore, getStatus }) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rankedLeaders.length / PAGE_SIZE));
  const visible = rankedLeaders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{t("Leaderboard Rankings")}</h3>
          <p className="mt-0.5 text-sm text-slate-400">{t("Reader Performance")} · {rangeLabel}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
          {rankedLeaders.length} {t("users")}
        </span>
      </div>

      {/* Empty state */}
      {rankedLeaders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
          <Target size={36} className="text-slate-200" />
          <p className="text-sm font-medium">{t("No readers found")}</p>
        </div>
      )}

      {/* Desktop table */}
      {rankedLeaders.length > 0 && (
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">{t("Rank")}</th>
                <th className="px-6 py-4">{t("Reader")}</th>
                <th className="px-6 py-4">{t("Books Read")}</th>
                <th className="px-6 py-4">{t("Activity Score")}</th>
                <th className="px-6 py-4">{t("Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map((entry, idx) => {
                const globalIdx = (page - 1) * PAGE_SIZE + idx;
                const score = getActivityScore(entry);
                const scorePct = Math.max(6, Math.round((score / maxScore) * 100));
                const status = getStatus(entry, globalIdx);
                const rankStyle = RANK_STYLES[entry.rank] || "bg-slate-100 text-slate-600";

                return (
                  <tr
                    key={entry.user?.id ?? entry.rank ?? idx}
                    className="group transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full text-sm", rankStyle)}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarCell user={entry.user} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{getDisplayName(entry.user)}</p>
                          <p className="truncate text-xs text-slate-400">
                            {getUserHandle(entry.user)}
                            {entry.user?.created_at ? ` · ${formatMemberSince(entry.user.created_at)}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold tabular-nums text-slate-800">
                        {formatCompactNumber(entry.booksRead)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-slate-700">
                          {formatCompactNumber(score)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[status] || STATUS_STYLES["Active"])}>
                        <Target size={10} />
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {rankedLeaders.length > 0 && (
        <div className="divide-y divide-slate-50 md:hidden">
          {visible.map((entry, idx) => {
            const globalIdx = (page - 1) * PAGE_SIZE + idx;
            const score = getActivityScore(entry);
            const status = getStatus(entry, globalIdx);
            const rankStyle = RANK_STYLES[entry.rank] || "bg-slate-100 text-slate-600";

            return (
              <div key={entry.user?.id ?? idx} className="flex items-center gap-4 px-5 py-4">
                <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm", rankStyle)}>
                  {entry.rank}
                </span>
                <AvatarCell user={entry.user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{getDisplayName(entry.user)}</p>
                  <p className="text-xs text-slate-400">{formatCompactNumber(entry.booksRead)} books · score {formatCompactNumber(score)}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_STYLES[status] || STATUS_STYLES["Active"])}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-400">
            {t("Showing")} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rankedLeaders.length)} {t("of")} {rankedLeaders.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Prev")}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  p === page
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopReadersTable;
