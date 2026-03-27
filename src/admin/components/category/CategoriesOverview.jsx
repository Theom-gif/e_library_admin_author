import React from "react";

const CategoriesOverview = ({ t, categoriesLength, totalBooks, averageBooks }) => (
  <div className="glass-card p-6 md:p-8">
    <div className="space-y-2">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("Categories")}</h2>
        <p className="text-base text-slate-400 md:text-lg">{t("Manage book categories and genres")}</p>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("Total Categories")}</p>
        <p className="mt-2 text-2xl font-bold">{categoriesLength}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("Total Books")}</p>
        <p className="mt-2 text-2xl font-bold">{totalBooks}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("Average Books")}</p>
        <p className="mt-2 text-2xl font-bold">{averageBooks}</p>
      </div>
    </div>
  </div>
);

export default CategoriesOverview;
