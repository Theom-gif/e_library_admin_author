import React from "react";
import { Activity, Check, X } from "lucide-react";

const ApprovalsHeader = ({ t, stats }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t("Approvals")}</p>
      <h1 className="text-2xl font-bold tracking-tight">{t("Submission Reviews")}</h1>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-amber-500/10 text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-500/20">
        <Activity size={14} />
        {t("{count} Pending", { count: stats.pending })}
      </div>
      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20">
        <Check size={14} />
        {t("{count} Approved", { count: stats.approved })}
      </div>
      <div className="flex items-center gap-2 bg-rose-500/10 text-rose-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-rose-500/20">
        <X size={14} />
        {t("{count} Rejected", { count: stats.rejected })}
      </div>
    </div>
  </div>
);

export default ApprovalsHeader;
