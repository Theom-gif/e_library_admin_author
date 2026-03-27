import React from "react";
import { BarChart3, CalendarDays, Download, Search } from "lucide-react";

const TopReadersHeader = ({
  t,
  searchQuery,
  onSearchQueryChange,
  range,
  onRangeChange,
  sortBy,
  onSortByChange,
  onExport,
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
        {t("Top Readers")}
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
        {t("Users with highest reading activity across all categories")}
      </p>
    </div>

    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
      <div className="relative min-w-[220px] flex-1 sm:flex-none">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t("Search users")}
          className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
        <CalendarDays size={14} className="text-slate-400" />
        <select value={range} onChange={(e) => onRangeChange(e.target.value)} className="bg-transparent text-slate-700 outline-none dark:text-slate-200">
          <option value="all">{t("All Time")}</option>
          <option value="month">{t("Monthly Stats")}</option>
          <option value="week">{t("This Week")}</option>
        </select>
      </div>

      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
        <BarChart3 size={14} className="text-slate-400" />
        <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)} className="bg-transparent text-slate-700 outline-none dark:text-slate-200">
          <option value="books">{t("Sort: Books")}</option>
          <option value="activity">{t("Sort: Activity")}</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
      >
        <Download size={14} />
        {t("Export Data")}
      </button>
    </div>
  </div>
);

export default TopReadersHeader;
