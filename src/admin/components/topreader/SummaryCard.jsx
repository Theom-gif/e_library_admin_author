import React from "react";
import { cn } from "../../../lib/utils";
import SurfaceCard from "./SurfaceCard";

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
            iconToneMap[iconTone],
          )}
        >
          <Icon size={18} />
        </div>
      </div>
    </SurfaceCard>
  );
};

export default SummaryCard;
