import React from "react";

const ApprovalsPagination = ({
  t,
  pageStart,
  pageEnd,
  totalRecords,
  pagination,
  totalPages,
  onPerPageChange,
  onGoToPage,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/5 bg-white/5">
    <div className="text-xs text-slate-400 font-semibold">
      {t("Showing {start}-{end} of {total} results", {
        start: pageStart,
        end: pageEnd,
        total: totalRecords,
      })}
    </div>

    <div className="flex items-center gap-3">
      <label className="text-xs text-slate-400 font-semibold flex items-center gap-2">
        {t("Per page")}
        <select
          value={pagination.perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onGoToPage(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            pagination.page <= 1
              ? "bg-white/5 text-slate-500 border-white/10 cursor-not-allowed"
              : "bg-white/5 text-slate-100 border-white/10 hover:bg-white/10"
          }`}
        >
          {t("Previous")}
        </button>
        <span className="text-xs text-slate-400 font-semibold">
          {t("Page {page} of {total}", { page: pagination.page, total: totalPages })}
        </span>
        <button
          onClick={() => onGoToPage(pagination.page + 1)}
          disabled={pagination.page >= totalPages}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            pagination.page >= totalPages
              ? "bg-white/5 text-slate-500 border-white/10 cursor-not-allowed"
              : "bg-white/5 text-slate-100 border-white/10 hover:bg-white/10"
          }`}
        >
          {t("Next")}
        </button>
      </div>
    </div>
  </div>
);

export default ApprovalsPagination;
