import React, { useMemo, useState } from "react";
import { Activity, Check, Eye, Filter, Search, X } from "lucide-react";
import { BOOKS, CATEGORIES } from "../data/mockData";
import { useLanguage } from "../../i18n/LanguageContext";

const statusStyles = {
  Pending: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  Approved: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
};

const Approvals = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("Pending");

  const categories = useMemo(
    () => ["All", ...CATEGORIES.map((c) => c.name)],
    []
  );
  const statusFilters = ["Pending", "Approved", "Rejected", "All"];
  const stats = useMemo(
    () => ({
      pending: BOOKS.filter((b) => b.status === "Pending").length,
      approved: BOOKS.filter((b) => b.status === "Approved").length,
      rejected: BOOKS.filter((b) => b.status === "Rejected").length,
    }),
    []
  );

  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return BOOKS.filter((book) => {
      const matchesStatus = status === "All" ? true : book.status === status;
      const matchesCategory = category === "All" ? true : book.category === category;
      const matchesTerm =
        !term ||
        `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(term);
      return matchesStatus && matchesCategory && matchesTerm;
    });
  }, [searchTerm, category, status]);

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t("Approvals")}</p>
          <h1 className="text-2xl font-bold tracking-tight">{t("Submission Reviews")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-500/20">
            <Activity size={14} />
            {t("{count} Pending", { count: stats.pending })}
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20">
            <Check size={14} />
            {t("{count} Approved", { count: stats.approved })}
          </div>
          <div className="flex items-center gap-2 bg-rose-500/10 text-rose-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-rose-500/20">
            <X size={14} />
            {t("{count} Rejected", { count: stats.rejected })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card border border-white/10 p-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                onClick={() => setStatus(label)}
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
            onChange={(e) => setCategory(e.target.value)}
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

      {/* Pending Submissions Table */}
      <div className="bg-white/5 rounded-xl border border-white/5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("Pending Submissions")}
            </p>
            <h4 className="font-bold">{t("Review and moderate incoming books")}</h4>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {t("{count} results", { count: filteredBooks.length })}
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
              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-5 text-center text-slate-500">
                    {t("No submissions match your filters right now.")}
                  </td>
                </tr>
              )}

              {filteredBooks.map((book) => {
                const disabled = book.status !== "Pending";
                return (
                  <tr key={book.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="h-12 w-9 rounded-md object-cover shadow-sm"
                        />
                        <div>
                          <p className="font-semibold leading-tight">{book.title}</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {t("ID")} #{book.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-200">{book.author}</td>
                    <td className="px-6 py-4 text-slate-400">{book.category}</td>
                    <td className="px-6 py-4 text-slate-400">{book.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-2 ${statusStyles[book.status] || "bg-white/5 text-slate-200 border border-white/10"}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {t(book.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10 transition-colors"
                          title={t("Preview")}
                        >
                          <Eye size={16} />
                          {t("Preview")}
                        </button>
                        <button
                          disabled={disabled}
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
      </div>
    </div>
  );
};

export default Approvals;
