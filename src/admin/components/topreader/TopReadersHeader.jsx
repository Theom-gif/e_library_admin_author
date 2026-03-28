import React from "react";
import { BarChart3, CalendarDays, Download } from "lucide-react";

const TopReadersHeader = ({
  t,
  range,
  onRangeChange,
  sortBy,
  onSortByChange,
  onExport,
}) => (
  <div className="flex flex-wrap items-end justify-end gap-4">
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm">
        <CalendarDays size={14} className="text-slate-400" />
        <select
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
          className="bg-transparent text-slate-600 outline-none"
        >
          <option value="all">{t("All Time")}</option>
          <option value="month">{t("This Month")}</option>
          <option value="week">{t("This Week")}</option>
        </select>
      </div>

      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm">
        <BarChart3 size={14} className="text-slate-400" />
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="bg-transparent text-slate-600 outline-none"
        >
          <option value="books">{t("Sort: Books")}</option>
          <option value="activity">{t("Sort: Activity")}</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <Download size={14} />
        {t("Export")}
      </button>
    </div>
  </div>
);

export default TopReadersHeader;
