import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { API_BASE_URL } from "../../lib/apiClient";
import { approveBook, fetchAdminBooks, rejectBook } from "../services/adminService";
import ApprovalsFilters from "../components/approvals/ApprovalsFilters";
import ApprovalsHeader from "../components/approvals/ApprovalsHeader";
import ApprovalsPagination from "../components/approvals/ApprovalsPagination";
import ApprovalsTable from "../components/approvals/ApprovalsTable";
import { FALLBACK_BOOK_COVER, statusFilters } from "../components/approvals/constants";

const normalizeStatus = (value) => {
  const text = String(value || "").trim();
  if (!text) return "Pending";
  const lower = text.toLowerCase();
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

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(String(value));

// Keep cover/file URLs pointing to the site root, not the /api prefix.
const stripApiSuffix = (value = "") =>
  String(value || "").replace(/\/api(?:\/.*)?$/i, "");
const assetBaseUrl = stripApiSuffix(API_BASE_URL).replace(/\/+$/, "");

const buildStorageUrl = (path = "") => {
  if (!path) return "";
  if (isAbsoluteUrl(path)) return path;
  
  let clean = String(path).replace(/^\/+/, "");
  
  // Normalize backend storage prefixes before building public URL.
  clean = clean.replace(/^storage\/app\/public\//, "");
  clean = clean.replace(/^public\//, "");
  
  if (clean.startsWith("storage/")) {
    clean = clean.slice("storage/".length);
  }
  
  return `${assetBaseUrl}/storage/${clean}`;
};

const buildCoverApiUrl = (id) => {
  if (!id) return "";
  const base = String(API_BASE_URL || "").replace(/\/+$/, "");
  if (/\/api$/i.test(base)) {
    return `${base}/books/${id}/cover`;
  }
  return `${base}/api/books/${id}/cover`;
};

const extractString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return String(value.name ?? value.title ?? value.label ?? "");
  return String(value);
};

const toUiBook = (book = {}) => {
  // Prefer already-resolved absolute URLs; only run buildStorageUrl on relative paths.
  const resolveCover = (...candidates) => {
    for (const c of candidates) {
      if (!c) continue;
      if (isAbsoluteUrl(c)) return c;
      const built = buildStorageUrl(c);
      if (built) return built;
    }
    return FALLBACK_BOOK_COVER;
  };

  const resolveFile = (...candidates) => {
    for (const c of candidates) {
      if (!c) continue;
      if (isAbsoluteUrl(c)) return c;
      const built = buildStorageUrl(c);
      if (built) return built;
    }
    return "";
  };

  const cover = resolveCover(
    book.coverUrl,
    book.cover,
    book.cover_api_url,
    book.cover_image_url,
    book.cover_image_path,
    buildCoverApiUrl(book.id ?? book._id ?? book.bookId),
  );

  const fileUrl = resolveFile(
    book.fileUrl,
    book.book_file_url,
    book.book_file_path,
    book.file,
  );

  return {
    id: book.id ?? book._id ?? book.bookId ?? book.slug ?? "",
    title: book.title ?? book.name ?? "Untitled",
    author: extractString(book.author) || extractString(book.author_name) || extractString(book.authorName) || "Unknown",
    category: extractString(book.category) || extractString(book.genre) || extractString(book.genre_name) || "Uncategorized",
    status: normalizeStatus(book.status),
    date: formatDateLabel(book.date ?? book.created_at ?? book.createdAt ?? book.updated_at ?? ""),
    cover,
    fileUrl,
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
  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const categories = useMemo(() => {
    const unique = new Set(books.map((book) => book.category).filter(Boolean));
    return ["All", ...Array.from(unique)];
  }, [books]);

  useEffect(() => {
    if (category !== "All" && !categories.includes(category)) {
      setCategory("All");
    }
  }, [categories, category]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [status]);

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
        const { data, meta } = await fetchAdminBooks(
          {
            status: status === "All" ? "all" : status,
            search: searchTerm.trim(),
            page: pagination.page,
            perPage: pagination.perPage,
          },
          { signal },
        );

        if (signal?.aborted) return;

        const normalized = Array.isArray(data) ? data.map(toUiBook) : [];
        setBooks(normalized);
        setPagination((prev) => {
          const next = {
            page: meta?.page ?? prev.page,
            perPage: meta?.perPage ?? prev.perPage,
            total: meta?.total ?? prev.total ?? normalized.length,
          };

          if (
            next.page === prev.page &&
            next.perPage === prev.perPage &&
            next.total === prev.total
          ) {
            return prev;
          }

          return next;
        });
      } catch (fetchError) {
        const isCanceled =
          fetchError?.name === "CanceledError" ||
          fetchError?.name === "AbortError" ||
          fetchError?.code === "ERR_CANCELED";

        if (!isCanceled) {
          setError(getErrorMessage(fetchError, t("Failed to load submissions.")));
          setBooks([]);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [pagination.page, pagination.perPage, searchTerm, status, t],
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

  const totalRecords = pagination.total || filteredBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pagination.perPage));
  const pageStart = totalRecords === 0 ? 0 : (pagination.page - 1) * pagination.perPage + 1;
  const pageEnd = totalRecords === 0
    ? 0
    : Math.min(pagination.page * pagination.perPage, totalRecords);

  const goToPage = (nextPage) => {
    setPagination((prev) => {
      const safePage = Math.min(Math.max(1, nextPage), totalPages);
      if (safePage === prev.page) return prev;
      return { ...prev, page: safePage };
    });
  };

  const handlePerPageChange = (value) => {
    setPagination((prev) => ({ ...prev, perPage: value, page: 1 }));
  };

  const handleModeration = async (book, nextStatus) => {
    if (!book?.id) {
      setActionError(t("Cannot moderate this submission because ID is missing."));
      return;
    }

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
      <ApprovalsHeader t={t} stats={stats} />
      <ApprovalsFilters
        t={t}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        status={status}
        onStatusChange={setStatus}
        statusFilters={statusFilters}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
      />
      <ApprovalsTable
        t={t}
        totalRecords={totalRecords}
        actionError={actionError}
        actionSuccess={actionSuccess}
        isLoading={isLoading}
        error={error}
        filteredBooks={filteredBooks}
        actionLoadingId={actionLoadingId}
        onModerate={handleModeration}
      >
        <ApprovalsPagination
          t={t}
          pageStart={pageStart}
          pageEnd={pageEnd}
          totalRecords={totalRecords}
          pagination={pagination}
          totalPages={totalPages}
          onPerPageChange={handlePerPageChange}
          onGoToPage={goToPage}
        />
      </ApprovalsTable>
    </div>
  );
};

export default Approvals;
