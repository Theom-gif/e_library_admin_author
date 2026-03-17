import { apiClient, API_BASE_URL } from "../../lib/apiClient";

const buildBooksPath = ({ status, search } = {}) => {
  const params = new URLSearchParams();
  const cleanStatus = String(status || "").trim();
  const cleanSearch = String(search || "").trim();
  const lowerStatus = cleanStatus.toLowerCase();
  const isPendingRoute = lowerStatus === "pending";

  if (cleanSearch) {
    params.set("search", cleanSearch);
  }

  if (isPendingRoute) {
    const query = params.toString();
    return `/api/admin/books/pending${query ? `?${query}` : ""}`;
  }

  if (cleanStatus) {
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

const DEFAULT_CATEGORY_ICON = "Tech";

const normalizeCategory = (category = {}) => ({
  id: category?.id ?? category?._id ?? "",
  name: category?.name ?? category?.title ?? "",
  count: Number(category?.count ?? category?.books_count ?? 0),
  icon: category?.icon || DEFAULT_CATEGORY_ICON,
});

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
  const payload = response?.data;
  const rows =
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.books) && payload.books) ||
    (Array.isArray(payload?.data?.data) && payload.data.data) ||
    (Array.isArray(payload) && payload) ||
    [];
  return rows.map(normalizeBook);
};

export const approveBook = (id, config = {}) =>
  apiClient.post(`/api/admin/books/${id}/approve`, null, config);

export const rejectBook = (id, config = {}) =>
  apiClient.post(`/api/admin/books/${id}/reject`, null, config);

export const fetchAdminCategories = async (filters = {}, config = {}) => {
  const response = await apiClient.get("/api/admin/categories", {
    ...config,
    params: { ...(config?.params || {}), ...(filters || {}) },
  });

  const payload = response?.data;
  const rows =
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.categories) && payload.categories) ||
    (Array.isArray(payload) && payload) ||
    [];

  return rows.map(normalizeCategory);
};

export const createAdminCategory = async (payload = {}, config = {}) => {
  const response = await apiClient.post("/api/admin/categories", payload, config);
  const body = response?.data;
  const created =
    (body && typeof body === "object" && !Array.isArray(body) && body.data && !Array.isArray(body.data)
      ? body.data
      : body) || {};

  return normalizeCategory(created);
};

export const fetchDashboard = (config = {}) =>
  apiClient.get("/api/admin/dashboard", config).then((res) => res?.data || {});

export const fetchDashboardStats = (config = {}) =>
  apiClient.get("/api/admin/dashboard/stats", config).then((res) => res?.data || {});

export const fetchDashboardActivity = (range = "7d", config = {}) =>
  apiClient
    .get(`/api/admin/dashboard/activity?range=${encodeURIComponent(range)}`, config)
    .then((res) => res?.data || {});

export const fetchDashboardHealth = (config = {}) =>
  apiClient.get("/api/admin/dashboard/health", config).then((res) => res?.data || {});
