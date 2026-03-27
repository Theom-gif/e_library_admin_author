import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchAdminBooks } from "../services/adminService";
import { useTheme } from "../../theme/ThemeContext";
import BookDetailsModal from "../components/books/BookDetailsModal";
import BooksTable from "../components/books/BooksTable";
import BooksToolbar from "../components/books/BooksToolbar";
import { STATUS_FILTERS } from "../components/books/constants";

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

  return (
    <div className="glass-card overflow-hidden">
      <BooksToolbar
        t={t}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusFilters={STATUS_FILTERS}
        total={filteredBooks.length}
      />
      <BooksTable
        t={t}
        error={error}
        isLoading={isLoading}
        filteredBooks={filteredBooks}
        onOpenBookDetails={openBookDetails}
      />
      <BookDetailsModal
        t={t}
        selectedBook={selectedBook}
        isDark={isDark}
        onClose={closeBookDetails}
      />
    </div>
  );
};

export default Books;
