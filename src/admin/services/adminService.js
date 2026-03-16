import { apiClient, API_BASE_URL } from "../../lib/apiClient";

const buildBooksPath = ({ status, search } = {}) => {
  const params = new URLSearchParams();
  const cleanStatus = String(status || "").trim();
  const cleanSearch = String(search || "").trim();
  const isPendingRoute = !cleanStatus || cleanStatus.toLowerCase() === "pending";

  if (cleanSearch) {
    params.set("search", cleanSearch);
  }

  if (isPendingRoute) {
    const query = params.toString();
    return `/api/admin/books/pending${query ? `?${query}` : ""}`;
  }

  if (cleanStatus && cleanStatus.toLowerCase() !== "all") {
    params.set("status", cleanStatus);
  }

  const query = params.toString();
  return `/api/admin/books${query ? `?${query}` : ""}`;
};

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(String(value));
const trimSlash = (value = "") => String(value || "").replace(/\/+$/, "");

const buildStorageUrl = (path = "") => {
  if (!path) return "";
  if (isAbsoluteUrl(path)) return path;
  const clean = String(path).replace(/^\/+/, "");
  const normalized = clean.startsWith("storage/") ? clean.slice("storage/".length) : clean;
  return `${trimSlash(API_BASE_URL)}/storage/${normalized}`;
};

export const normalizeBook = (book = {}) => {
  const coverPath =
    book.cover_image_url ??
    book.cover_image_path ??
    book.cover ??
    "";
  const filePath =
    book.book_file_url ??
    book.book_file_path ??
    book.file ??
    "";

  return {
    id: book.id ?? book.bookId ?? book._id ?? "",
    title: book.title ?? book.name ?? "Untitled",
    author: book.author ?? book.authorName ?? book.author_name ?? "Unknown",
    category: book.category ?? book.genre ?? book.genre_name ?? "",
    status: book.status ?? "Pending",
    downloads: Number(book.downloads ?? 0),
    coverUrl: buildStorageUrl(coverPath),
    fileUrl: buildStorageUrl(filePath),
    description: book.description ?? "",
    date: book.date ?? book.created_at ?? "",
    first_publish_year: book.first_publish_year,
    manuscript_type: book.manuscript_type,
    manuscript_size_bytes: book.manuscript_size_bytes,
  };
};

export const fetchAdminBooks = async (filters = {}, config = {}) => {
  const response = await apiClient.get(buildBooksPath(filters), config);
  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];
  return rows.map(normalizeBook);
};

export const approveBook = (id, config = {}) =>
  apiClient.post(`/api/admin/books/${id}/approve`, null, config);

export const rejectBook = (id, config = {}) =>
  apiClient.post(`/api/admin/books/${id}/reject`, null, config);

export const fetchDashboard = (config = {}) =>
  apiClient.get("/admin/dashboard", config).then((res) => res?.data || {});

export const fetchDashboardStats = (config = {}) =>
  apiClient.get("/admin/dashboard/stats", config).then((res) => res?.data || {});

export const fetchDashboardActivity = (range = "7d", config = {}) =>
  apiClient
    .get(`/admin/dashboard/activity?range=${encodeURIComponent(range)}`, config)
    .then((res) => res?.data || {});

export const fetchDashboardHealth = (config = {}) =>
  apiClient.get("/admin/dashboard/health", config).then((res) => res?.data || {});
