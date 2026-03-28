import React from "react";
import { cn } from "../../../lib/utils";

const toneMap = {
  indigo: {
    icon: "bg-indigo-50 text-indigo-600",
    badge: "text-indigo-600 bg-indigo-50",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    badge: "text-emerald-600 bg-emerald-50",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600",
    badge: "text-violet-600 bg-violet-50",
  },
};

const SummaryCard = ({ icon: Icon, label, value, hint, iconTone = "indigo", progress }) => {
  const tone = toneMap[iconTone] || toneMap.indigo;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold leading-none text-slate-800">{value}</p>
          {hint && (
            <p className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tone.badge)}>
              {hint}
            </p>
          )}
          {progress !== undefined && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{Math.round(progress)}% of goal</p>
            </div>
          )}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone.icon)}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
