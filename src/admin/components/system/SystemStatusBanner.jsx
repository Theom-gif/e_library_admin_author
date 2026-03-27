import React from "react";

const SystemStatusBanner = ({ t, isLoading, error }) => {
  if (!isLoading && !error) return null;

  return (
    <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
      {isLoading && <span className="text-slate-400 text-sm">{t("Loading monitor data...")}</span>}
      {error && <span className="text-amber-300 text-sm">{error}</span>}
    </div>
  );
};

export default SystemStatusBanner;
