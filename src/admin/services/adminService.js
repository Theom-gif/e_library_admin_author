import { apiClient, API_BASE_URL } from "../../lib/apiClient";

const buildBooksPath = ({ status, search, page, perPage } = {}) => {
  const params = new URLSearchParams();
  const cleanStatus = String(status || "").trim();
  const cleanSearch = String(search || "").trim();
  const lowerStatus = cleanStatus.toLowerCase();
  const isPendingRoute = lowerStatus === "pending";

  const cleanPage = Number(page);
  const cleanPerPage = Number(perPage);

  if (cleanSearch) {
    params.set("search", cleanSearch);
  }

  if (Number.isFinite(cleanPage) && cleanPage > 0) {
    params.set("page", String(cleanPage));
  }

  if (Number.isFinite(cleanPerPage) && cleanPerPage > 0) {
    params.set("per_page", String(cleanPerPage));
  }

  if (isPendingRoute) {
    const query = params.toString();
    return `/api/admin/books/pending${query ? `?${query}` : ""}`;
  }

  if (cleanStatus && lowerStatus !== "all") {
    params.set("status", cleanStatus);
  }

  const query = params.toString();
  return `/api/admin/books${query ? `?${query}` : ""}`;
};

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(String(value));
const trimSlash = (value = "") => String(value || "").replace(/\/+$/, "");

// Asset URLs should point to the web root, not the /api prefix used for JSON routes.
// The default API_BASE_URL is https://elibrary.pncproject.site/api, but covers live at
// https://elibrary.pncproject.site/storage/<file>. Strip any trailing /api* before joining.
const stripApiSuffix = (value = "") =>
  String(value || "").replace(/\/api(?:\/.*)?$/i, "");

const ASSET_BASE_URL = trimSlash(stripApiSuffix(API_BASE_URL));

// const buildStorageUrl = (path = "") => {
//   if (!path) return "";
//   if (isAbsoluteUrl(path)) return path;
//   const clean = String(path).replace(/^\/+/, "");
//   const normalized = clean.startsWith("storage/") ? clean.slice("storage/".length) : clean;
//   return `${ASSET_BASE_URL}/storage/${normalized}`;
// };

const buildStorageUrl = (path = "") => {
  if (!path) return "";
  if (isAbsoluteUrl(path)) return path;

  let clean = String(path).replace(/^\/+/, "");

  // 🔥 FIX: remove wrong prefixes from backend
  clean = clean.replace(/^storage\/app\/public\//, "");
  clean = clean.replace(/^public\//, "");

  if (clean.startsWith("storage/")) {
    clean = clean.slice("storage/".length);
  }

  return `${ASSET_BASE_URL}/storage/${clean}`;
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

const toNumberOr = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
};

const normalizePagination = (meta = {}, fallbackLength = 0) => ({
  page: toNumberOr(meta.page ?? meta.current_page ?? meta.currentPage, 1),
  perPage: toNumberOr(
    meta.perPage ?? meta.per_page ?? meta.limit ?? meta.pageSize,
    fallbackLength || 10,
  ),
  total: toNumberOr(meta.total ?? meta.total_items ?? meta.totalItems ?? meta.count, fallbackLength),
});

export const fetchAdminBooks = async (filters = {}, config = {}) => {
  const response = await apiClient.get(buildBooksPath(filters), config);
  const payload = response?.data;
  const rows =
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.books) && payload.books) ||
    (Array.isArray(payload?.data?.data) && payload.data.data) ||
    (Array.isArray(payload) && payload) ||
    [];

  const paginationSource =
    payload?.meta ||
    payload?.data?.meta ||
    payload?.pagination ||
    payload?.data?.pagination ||
    {};

  const meta = normalizePagination(paginationSource, rows.length);

  return { data: rows.map(normalizeBook), meta };
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

export const fetchMonitorDashboard = (config = {}) =>
  apiClient.get("/api/admin/monitor/dashboard", config).then((res) => res?.data || {});

export const fetchMonitorStats = (config = {}) =>
  apiClient.get("/api/admin/monitor/summary", config).then((res) => res?.data || {});

export const fetchMonitorActivity = (range = "24h", config = {}) =>
  apiClient
    .get(`/api/admin/monitor/activity?range=${encodeURIComponent(range)}`, config)
    .then((res) => res?.data || {});

export const fetchMonitorHealth = (config = {}) =>
  apiClient.get("/api/admin/monitor/health", config).then((res) => res?.data || {});

export const fetchMonitorTopBooks = (limit = 5, config = {}) =>
  apiClient
    .get(`/api/admin/monitor/top-books?limit=${encodeURIComponent(limit)}`, config)
    .then((res) => res?.data || {});
