import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, Calendar, Check, Eye, Filter, Loader2, Search, UserRound, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchAdminBooks } from "../services/adminService";
import { useTheme } from "../../theme/ThemeContext";

const STATUS_FILTERS = ["All", "Approved", "Pending", "Rejected"];
const BookCoverFallback = () => (
  <div className="w-10 h-14 rounded-md bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
    <BookOpen size={18} className="text-slate-500" />
  </div>
);

const BookCover = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <BookCoverFallback />;
  return (
    <img
      src={src}
      alt={alt}
      className="w-10 h-14 rounded-md object-cover flex-shrink-0"
      onError={() => setFailed(true)}
    />
  );
};

/* Normalize backend status */
const normalizeStatus = (value) => {
  const text = String(value || "").trim().toLowerCase();

  if (!text) return "Pending";
  if (text === "approved") return "Approved";
  if (text === "pending") return "Pending";
  if (text === "rejected") return "Rejected";

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const Books = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  /* Fetch books */
  const loadBooks = useCallback(
    async (signal) => {
      try {
        setIsLoading(true);
        setError("");

        const statusParam =
          statusFilter === "All" ? "all" : statusFilter.toLowerCase();

        const { data } = await fetchAdminBooks(
          {
            status: statusParam,
            search: searchTerm.trim(),
          },
          { signal }
        );

        /* Support both API shapes */
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        /* Only update if request not aborted */
        if (!signal?.aborted) {
          setBooks(rows);
        }
      } catch (err) {
        const canceled =
          err?.name === "CanceledError" ||
          err?.name === "AbortError" ||
          err?.code === "ERR_CANCELED";

        if (!canceled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              t("Failed to load books.")
          );
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [searchTerm, statusFilter, t]
  );

  /* Auto load with debounce */
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      loadBooks(controller.signal);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadBooks]);

  /* Normalize books */
  const normalizedBooks = useMemo(() => {
    const toCategory = (raw) => {
      if (typeof raw === "string") return raw;
      if (raw && typeof raw === "object") {
        return raw.name || raw.title || raw.label || "";
      }
      return "";
    };

    return books.map((book) => ({
      ...book,
      cover: book.cover || book.coverUrl || null,
      status: normalizeStatus(book.status),
      category: toCategory(book.category),
      downloads: Number(book.downloads ?? 0),
    }));
  }, [books]);

  /* Filtering */
  const filteredBooks = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return normalizedBooks.filter((book) => {
      if (statusFilter !== "All" && book.status !== statusFilter) {
        return false;
      }

      if (!search) return true;

      const text = [
        book.title,
        book.author,
        book.category,
        book.status,
        book.date,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }, [searchTerm, statusFilter, normalizedBooks]);

  const openBookDetails = (book) => {
    setSelectedBook(book);
  };

  const closeBookDetails = () => {
    setSelectedBook(null);
  };

  const modalOverlayStyle = {
    background: isDark ? "rgba(4, 8, 20, 0.72)" : "rgba(148, 163, 184, 0.35)",
    backdropFilter: "blur(8px)",
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* HEADER */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          {/* SEARCH */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder={t("Search books, authors, categories...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-64"
            />
          </div>

          {/* STATUS FILTER */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;

              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                    active
                      ? "bg-purple-500 text-white"
                      : "text-slate-400 hover:text-white"
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
          {filteredBooks.length} {t("Total")}
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <th className="px-6 py-4">{t("Book")}</th>
            <th className="px-6 py-4">{t("Author")}</th>
            <th className="px-6 py-4">{t("Category")}</th>
            <th className="px-6 py-4">{t("Status")}</th>
            <th className="px-6 py-4">{t("Downloads")}</th>
            <th className="px-6 py-4 text-right">{t("Actions")}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">

          {/* ERROR */}
          {error && (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-rose-400">
                {error}
              </td>
            </tr>
          )}

          {/* LOADING */}
          {isLoading && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                <div className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Loading books...")}
                </div>
              </td>
            </tr>
          )}

          {/* EMPTY */}
          {!isLoading && !error && filteredBooks.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                {t("No books found for this filter.")}
              </td>
            </tr>
          )}

          {/* ROWS */}
          {!isLoading &&
            !error &&
            filteredBooks.map((book) => (
              <tr key={book.id} className="hover:bg-white/2">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <BookCover src={book.cover} alt={book.title} />
                    <div>
                      <p className="font-bold">{book.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">
                        {book.date}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-400 text-sm">
                  {book.author}
                </td>

                <td className="px-6 py-4">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/5 text-slate-400">
                    {book.category}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 w-fit",
                      book.status === "Approved"
                        ? "text-green-400 bg-green-400/10"
                        : book.status === "Pending"
                        ? "text-orange-400 bg-orange-400/10"
                        : "text-red-400 bg-red-400/10"
                    )}
                  >
                    {book.status === "Approved" ? (
                      <Check size={14} />
                    ) : book.status === "Pending" ? (
                      <Activity size={14} />
                    ) : (
                      <X size={14} />
                    )}
                    {t(book.status)}
                  </span>
                </td>

                <td className="px-6 py-4 text-slate-400 text-sm font-mono">
                  {book.downloads.toLocaleString()}
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => openBookDetails(book)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
                    style={{ border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)" }}
                  >
                    <Eye size={13} />
                    {t("View Details")}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {selectedBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={modalOverlayStyle}
          onClick={closeBookDetails}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl p-[1px]"
            style={{
              background: isDark
                ? "linear-gradient(135deg,rgba(129,140,248,0.45),rgba(59,130,246,0.18),rgba(236,72,153,0.32))"
                : "linear-gradient(135deg,rgba(99,102,241,0.42),rgba(14,165,233,0.22),rgba(236,72,153,0.28))",
              boxShadow: isDark
                ? "0 34px 90px rgba(0,0,0,0.66)"
                : "0 24px 65px rgba(15,23,42,0.26)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="relative rounded-3xl overflow-hidden p-6 md:p-8"
              style={{
                background: isDark
                  ? "linear-gradient(145deg,#0a1222 0%,#101a30 52%,#0a1222 100%)"
                  : "linear-gradient(145deg,#ffffff 0%,#f8fbff 52%,#eef4ff 100%)",
              }}
            >
              <button
                type="button"
                onClick={closeBookDetails}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 hover:bg-white/10 hover:text-white transition"
              >
                <X size={16} />
              </button>

              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
                <div className="grid grid-cols-[80px_1fr] gap-4 md:gap-5">
                  <div className="h-24 w-20 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                    {selectedBook.cover ? (
                      <img src={selectedBook.cover} alt={selectedBook.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <BookOpen size={24} className="text-slate-500" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                      {t("Book Details")}
                    </p>
                    <h3 className="mt-1 text-2xl md:text-3xl font-black leading-tight truncate">{selectedBook.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-500 truncate">{selectedBook.category || t("Uncategorized")}</p>

                    <div className="mt-3">
                      <span
                        className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5",
                          selectedBook.status === "Approved"
                            ? "text-green-400 bg-green-400/10"
                            : selectedBook.status === "Pending"
                            ? "text-orange-400 bg-orange-400/10"
                            : "text-red-400 bg-red-400/10"
                        )}
                      >
                        {selectedBook.status === "Approved" ? <Check size={13} /> : selectedBook.status === "Pending" ? <Activity size={13} /> : <X size={13} />}
                        {t(selectedBook.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">{t("Author")}</p>
                  <p className="mt-1.5 text-sm font-semibold inline-flex items-center gap-2">
                    <UserRound size={14} className="text-indigo-400" />
                    {selectedBook.author || "-"}
                  </p>
                </div>

                <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">{t("Published Date")}</p>
                  <p className="mt-1.5 text-sm font-semibold inline-flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-400" />
                    {selectedBook.date || "-"}
                  </p>
                </div>

                <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">{t("Category")}</p>
                  <p className="mt-1.5 text-sm font-semibold">{selectedBook.category || "-"}</p>
                </div>

                <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">{t("Downloads")}</p>
                  <p className="mt-1.5 text-sm font-semibold font-mono">{Number(selectedBook.downloads ?? 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end">
                <button
                  type="button"
                  onClick={closeBookDetails}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-200 hover:text-white transition"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
                >
                  {t("Close")}
                </button>
              </div>

              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.75)",
                  maskImage: "linear-gradient(to bottom, black, transparent 94%)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
