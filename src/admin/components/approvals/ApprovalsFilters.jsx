import React from "react";
import { Filter, Search } from "lucide-react";

const ApprovalsFilters = ({
  t,
  searchTerm,
  onSearchTermChange,
  status,
  onStatusChange,
  statusFilters,
  category,
  onCategoryChange,
  categories,
}) => (
  <div className="glass-card border border-white/10 p-4 flex flex-wrap items-center gap-3">
    <div className="relative w-full md:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        type="text"
        placeholder={t("Search by title, author, or category")}
        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>

    <div className="flex items-center gap-2">
      {statusFilters.map((label) => {
        const isActive = status === label || (label === "All" && status === "All");
        return (
          <button
            key={label}
            onClick={() => onStatusChange(label)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
              isActive
                ? "bg-primary text-background-dark border-primary"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {t(label)}
          </button>
        );
      })}
    </div>

    <div className="flex items-center gap-2 ml-auto">
      <Filter className="h-4 w-4 text-slate-500" />
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {categories.map((option) => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default ApprovalsFilters;
