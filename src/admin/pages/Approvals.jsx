import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Check, Eye, Filter, Loader2, Search, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { approveBook, fetchAdminBooks, rejectBook } from "../services/adminService";

const statusStyles = {
  Pending: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  Approved: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
};

const normalizeStatus = (value) => {
  const text = String(value || "").trim();
  if (!text) return "Pending";
  const lower = text.toLowerCase();
  if (lower === "approved") return "Approved";
  if (lower === "rejected") return "Rejected";
  if (lower === "pending") return "Pending";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatDateLabel = (value) => {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
  }

  if (typeof value === "string") {
    const parsedMs = Date.parse(value);
    if (!Number.isNaN(parsedMs)) {
      return new Date(parsedMs).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return value;
  }

  return "";
};

const fallbackId = () => `book-${Math.random().toString(36).slice(2, 10)}`;
const toUiBook = (book = {}) => {
  const cover = book.coverUrl || book.cover || "https://via.placeholder.com/64x96?text=Book";
  return {
    id: book.id ?? book._id ?? book.bookId ?? book.slug ?? fallbackId(),
    title: book.title ?? book.name ?? "Untitled",
    author: book.author ?? book.authorName ?? book.author_name ?? "Unknown",
    category: book.category ?? book.genre ?? book.genre_name ?? "Uncategorized",
    status: normalizeStatus(book.status),
    date: formatDateLabel(
      book.date ??
        book.created_at ??
        book.createdAt ??
        book.updated_at ??
        "",
    ),
    cover,
    fileUrl: book.fileUrl || "",
  };
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const Approvals = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("Pending");
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const statusFilters = ["Pending", "Approved", "Rejected", "All"];

  const categories = useMemo(() => {
    const unique = new Set(books.map((book) => book.category).filter(Boolean));
    return ["All", ...Array.from(unique)];
  }, [books]);

  useEffect(() => {
    if (category !== "All" && !categories.includes(category)) {
      setCategory("All");
    }
  }, [categories, category]);

  const stats = useMemo(
    () => ({
      pending: books.filter((b) => b.status === "Pending").length,
      approved: books.filter((b) => b.status === "Approved").length,
      rejected: books.filter((b) => b.status === "Rejected").length,
    }),
    [books],
  );

  const loadBooks = useCallback(
    async (signal) => {
      setIsLoading(true);
      setError("");
      try {
        // Backend currently exposes a pending-only listing; we merge it with any
        // locally moderated rows so filters keep showing already approved/rejected items.
        const rows = await fetchAdminBooks(
          { status: "Pending", search: searchTerm.trim() },
          { signal },
        );
        const fresh = Array.isArray(rows) ? rows.map(toUiBook) : [];
        setBooks((prev) => {
          const moderated = prev.filter((b) => b.status !== "Pending");
          const byId = new Map(moderated.map((b) => [String(b.id), b]));
          fresh.forEach((entry) => byId.set(String(entry.id), entry));
          return Array.from(byId.values());
        });
      } catch (fetchError) {
        const isCanceled =
          fetchError?.name === "CanceledError" ||
          fetchError?.name === "AbortError" ||
          fetchError?.code === "ERR_CANCELED";
        if (isCanceled) {
          return;
        }
        setError(getErrorMessage(fetchError, t("Failed to load submissions.")));
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [searchTerm, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadBooks(controller.signal);
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadBooks]);

  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return books.filter((book) => {
      const matchesStatus = status === "All" ? true : book.status === status;
      const matchesCategory = category === "All" ? true : book.category === category;
      const matchesTerm =
        !term ||
        `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(term);
      return matchesStatus && matchesCategory && matchesTerm;
    });
  }, [searchTerm, category, status, books]);

  const handleModeration = async (book, nextStatus) => {
    setActionLoadingId(book.id);
    setActionError("");
    setActionSuccess("");

    try {
      const apiCall = nextStatus === "Approved" ? approveBook : rejectBook;
      const response = await apiCall(book.id);
      const updatedPayload = response?.data?.data || response?.data || {};
      const normalized = toUiBook({ ...book, ...updatedPayload, status: updatedPayload.status || nextStatus });

      setBooks((prev) => prev.map((entry) => (entry.id === book.id ? normalized : entry)));

      setActionSuccess(
        nextStatus === "Approved" ? t("Book approved.") : t("Book rejected."),
      );
    } catch (actionErr) {
      setActionError(getErrorMessage(actionErr, t("Action failed. Please try again.")));
    } finally {
      setActionLoadingId(null);
    }
  };

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
              {(actionError || actionSuccess) && (
                <tr>
                  <td colSpan={6} className={`px-6 py-3 text-sm ${actionError ? "text-rose-400" : "text-emerald-400"}`}>
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

              {!isLoading && !error && filteredBooks.map((book) => {
                const disabled = book.status !== "Pending" || actionLoadingId === book.id;
                const previewDisabled = !book.fileUrl;
                return (
                  <tr key={book.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="h-12 w-9 rounded-md object-cover shadow-sm bg-white/5"
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
                        </button>
                        <button
                          disabled={disabled}
                          onClick={() => handleModeration(book, "Approved")}
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
                          onClick={() => handleModeration(book, "Rejected")}
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
