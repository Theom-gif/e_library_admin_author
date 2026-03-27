import React from "react";
import { Filter, Search } from "lucide-react";
import { cn } from "../../../lib/utils";

const BooksToolbar = ({
  t,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  statusFilters,
  total,
}) => (
  <div className="p-6 border-b border-white/5 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          size={16}
        />
        <input
          type="text"
          placeholder={t("Search books, authors, categories...")}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-64"
        />
      </div>

      <div className="flex items-center bg-white/5 rounded-lg p-1">
        {statusFilters.map((status) => {
          const active = statusFilter === status;

          return (
            <button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                active
                  ? "bg-purple-500 text-white"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {t(status)}
            </button>
          );
        })}
      </div>
    </div>

    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
      <Filter size={18} />
      {total} {t("Total")}
    </div>
  </div>
);

export default BooksToolbar;
