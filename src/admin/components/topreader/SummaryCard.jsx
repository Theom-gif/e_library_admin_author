import React from "react";
import { cn } from "../../../lib/utils";

const toneMap = {
  indigo: {
    light: {
      icon: "bg-indigo-50 text-indigo-600",
      badge: "text-indigo-600 bg-indigo-50",
    },
    dark: {
      icon: "bg-indigo-950/30 text-indigo-400",
      badge: "text-indigo-400 bg-indigo-950/20",
    },
  },
  emerald: {
    light: {
      icon: "bg-emerald-50 text-emerald-600",
      badge: "text-emerald-600 bg-emerald-50",
    },
    dark: {
      icon: "bg-emerald-950/30 text-emerald-400",
      badge: "text-emerald-400 bg-emerald-950/20",
    },
  },
  violet: {
    light: {
      icon: "bg-violet-50 text-violet-600",
      badge: "text-violet-600 bg-violet-50",
    },
    dark: {
      icon: "bg-violet-950/30 text-violet-400",
      badge: "text-violet-400 bg-violet-950/20",
    },
  },
};

const SummaryCard = ({ isDark, icon: Icon, label, value, hint, iconTone = "indigo", progress }) => {
  const tone = (isDark ? toneMap[iconTone]?.dark : toneMap[iconTone]?.light) || (isDark ? toneMap.indigo.dark : toneMap.indigo.light);

  return (
    <div className={isDark ? "rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-sm transition-all duration-300 hover:shadow-md" : "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={isDark ? "text-xs font-semibold uppercase tracking-widest text-slate-500" : "text-xs font-semibold uppercase tracking-widest text-slate-400"}>{label}</p>
          <p className={isDark ? "mt-3 text-3xl font-bold leading-none text-slate-100" : "mt-3 text-3xl font-bold leading-none text-slate-800"}>{value}</p>
          {hint && (
            <p className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tone.badge)}>
              {hint}
            </p>
          )}
          {progress !== undefined && (
            <div className="mt-4">
              <div className={isDark ? "h-2 w-full overflow-hidden rounded-full bg-slate-700" : "h-2 w-full overflow-hidden rounded-full bg-slate-100"}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className={isDark ? "mt-1.5 text-xs text-slate-500" : "mt-1.5 text-xs text-slate-400"}>{Math.round(progress)}% of goal</p>
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
