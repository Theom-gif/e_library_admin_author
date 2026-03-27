import React from "react";

const SettingsHeader = ({ t }) => (
  <div className="glass-card p-6 border border-white/10">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t("Control Center")}</p>
        <h2 className="text-2xl font-bold">{t("Settings & Preferences")}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t("Tune notifications, appearance, and security for your admin workspace.")}
        </p>
      </div>
      <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        {t("Live")}
      </div>
    </div>
  </div>
);

export default SettingsHeader;
