import React from "react";

const DashboardStatusNotice = ({ t, isLoading, error }) => {
  if (!isLoading && !error) return null;

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5">
      {isLoading && <span className="text-slate-400 text-sm">{t("Loading dashboard...")}</span>}
      {error && (
        <span className={error.includes("demo data") ? "text-blue-400 text-sm" : "text-amber-300 text-sm"}>
          {error}
        </span>
      )}
    </div>
  );
};

export default DashboardStatusNotice;
