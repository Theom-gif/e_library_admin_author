import React from "react";

const StatPill = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-800/70">
    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
      <Icon size={13} />
      {label}
    </p>
    <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
  </div>
);

export default StatPill;
