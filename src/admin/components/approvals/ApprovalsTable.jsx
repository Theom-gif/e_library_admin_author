import React from "react";
import { Check, Eye, Loader2, X } from "lucide-react";
import { FALLBACK_BOOK_COVER, statusStyles } from "./constants";

const ApprovalsTable = ({
  t,
  totalRecords,
  actionError,
  actionSuccess,
  isLoading,
  error,
  filteredBooks,
  actionLoadingId,
  onModerate,
  children,
}) => (
  <div className="bg-white/5 rounded-xl border border-white/5 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {t("Pending Submissions")}
        </p>
        <h4 className="font-bold">{t("Review and moderate incoming books")}</h4>
      </div>
      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
        {t("{count} results", { count: totalRecords })}
      </span>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">
          <tr>
            <th className="px-6 py-4 text-left">{t("Title")}</th>
            <th className="px-6 py-4 text-left">{t("Author")}</th>
            <th className="px-6 py-4 text-left">{t("Category")}</th>
            <th className="px-6 py-4 text-left">{t("Submitted")}</th>
            <th className="px-6 py-4 text-left">{t("Status")}</th>
            <th className="px-6 py-4 text-right">{t("Actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {(actionError || actionSuccess) && (
            <tr>
              <td
                colSpan={6}
                className={`px-6 py-3 text-sm ${actionError ? "text-rose-400" : "text-emerald-400"}`}
              >
                {actionError || actionSuccess}
              </td>
            </tr>
          )}

          {isLoading && (
            <tr>
              <td colSpan={6} className="px-6 py-6 text-center text-slate-400">
                <div className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("Loading submissions...")}</span>
                </div>
              </td>
            </tr>
          )}

          {!isLoading && error && (
            <tr>
              <td colSpan={6} className="px-6 py-6 text-center text-rose-400">
                {error}
              </td>
            </tr>
          )}

          {!isLoading && !error && filteredBooks.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-5 text-center text-slate-500">
                {t("No submissions match your filters right now.")}
              </td>
            </tr>
          )}

          {!isLoading &&
            !error &&
            filteredBooks.map((book) => {
              const hasValidId = String(book.id || "").trim() !== "";
              const disabled = book.status !== "Pending" || actionLoadingId === book.id || !hasValidId;
              const previewDisabled = !book.fileUrl;

              return (
                <tr key={book.id || `${book.title}-${book.author}`} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="h-12 w-9 rounded-md object-cover shadow-sm bg-white/5"
                        onError={(event) => {
                          if (event.currentTarget.src !== FALLBACK_BOOK_COVER) {
                            event.currentTarget.src = FALLBACK_BOOK_COVER;
                          }
                        }}
                      />
                      <div>
                        <p className="font-semibold leading-tight">{book.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {t("ID")} #{book.id || t("N/A")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-200">{book.author}</td>
                  <td className="px-6 py-4 text-slate-400">{book.category}</td>
                  <td className="px-6 py-4 text-slate-400">{book.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-2 ${
                        statusStyles[book.status] || "bg-white/5 text-slate-200 border border-white/10"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {t(book.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      {/* <button
                        disabled={previewDisabled}
                        onClick={() => {
                          if (previewDisabled) return;
                          window.open(book.fileUrl, "_blank", "noopener,noreferrer");
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          previewDisabled
                            ? "bg-white/5 text-slate-400 border-white/10 cursor-not-allowed"
                            : "bg-white/5 text-slate-100 border-white/10 hover:bg-white/10"
                        }`}
                        title={previewDisabled ? t("No file to preview") : t("Preview")}
                      >
                        <Eye size={16} />
                        {t("Preview")}
                      </button> */}
                      <button
                        disabled={disabled}
                        onClick={() => onModerate(book, "Approved")}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors border ${
                          disabled
                            ? "bg-emerald-500/5 text-emerald-300/60 border-emerald-500/10 cursor-not-allowed"
                            : "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                        }`}
                      >
                        <Check size={16} />
                        {t("Approve")}
                      </button>
                      <button
                        disabled={disabled}
                        onClick={() => onModerate(book, "Rejected")}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors border ${
                          disabled
                            ? "bg-rose-500/5 text-rose-300/60 border-rose-500/10 cursor-not-allowed"
                            : "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
                        }`}
                      >
                        <X size={16} />
                        {t("Reject")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
    {children}
  </div>
);

export default ApprovalsTable;
