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
    return `/admin/books/pending${query ? `?${query}` : ""}`;
  }

  if (cleanStatus && lowerStatus !== "all") {
    params.set("status", cleanStatus);
  }

  const query = params.toString();
  return `/admin/books${query ? `?${query}` : ""}`;
};

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(String(value));
const isBlobLikeUrl = (value = "") => /^data:|^blob:/i.test(String(value));
const isRootRelativeUrl = (value = "") => /^\//.test(String(value || "").trim());
const trimSlash = (value = "") => String(value || "").replace(/\/+$/, "");

// Asset URLs should point to the web root, not the /api prefix used for JSON routes.
// The default API_BASE_URL is https://elibrary.pncproject.site/api, but covers live at
// https://elibrary.pncproject.site/storage/<file>. Strip any trailing /api* before joining.
const stripApiSuffix = (value = "") =>
  String(value || "").replace(/\/api(?:\/.*)?$/i, "");

const ASSET_BASE_URL = trimSlash(stripApiSuffix(API_BASE_URL));

const buildCoverApiUrl = (id) => {
  if (!id) return "";
  const base = trimSlash(API_BASE_URL);
  if (/\/api$/i.test(base)) {
    return `${base}/books/${id}/cover`;
  }
  return `${base}/api/books/${id}/cover`;
};

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
  if (isBlobLikeUrl(path)) return path;
  if (isRootRelativeUrl(path)) return `${ASSET_BASE_URL}${path}`;

  let clean = String(path).replace(/^\/+/, "");

  // 🔥 FIX: remove wrong prefixes from backend
  clean = clean.replace(/^storage\/app\/public\//, "");
  clean = clean.replace(/^public\//, "");

  if (clean.startsWith("storage/")) {
    clean = clean.slice("storage/".length);
  }

  return `${ASSET_BASE_URL}/storage/${clean}`;
};

const resolveAssetUrl = (...candidates) => {
  for (const candidate of candidates) {
    const resolved = buildStorageUrl(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return "";
};


const DEFAULT_CATEGORY_ICON = "Tech";

const normalizeCategory = (category = {}) => ({
  id: category?.id ?? category?._id ?? "",
  name: category?.name ?? category?.title ?? "",
  count: Number(category?.count ?? category?.books_count ?? 0),
  icon: category?.icon || DEFAULT_CATEGORY_ICON,
});

export const normalizeBook = (book = {}) => {
  const coverPath = resolveAssetUrl(
    book.cover_view_url,
    book.cover_api_url,
    book.cover_image_url,
    book.cover_image_path,
    book.cover_image,
    book.coverImage,
    book.cover_url,
    book.coverUrl,
    book.image_url,
    book.imageUrl,
    book.image_path,
    book.imagePath,
    book.cover,
    book.image,
    book.thumbnail,
    buildCoverApiUrl(book.id ?? book.bookId ?? book._id),
  );
  const filePath = resolveAssetUrl(
    book.book_file_url,
    book.book_file_path,
    book.file,
  );

  return {
    id: book.id ?? book.bookId ?? book._id ?? "",
    title: book.title ?? book.name ?? "Untitled",
    author: book.author ?? book.authorName ?? book.author_name ?? "Unknown",
    category: book.category ?? book.genre ?? book.genre_name ?? "",
    status: book.status ?? "Pending",
    downloads: Number(book.downloads ?? 0),
    coverUrl: coverPath,
    fileUrl: filePath,
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
  apiClient.post(`/admin/books/${id}/approve`, null, config);

export const rejectBook = (id, config = {}) =>
  apiClient.post(`/admin/books/${id}/reject`, null, config);

export const fetchAdminCategories = async (filters = {}, config = {}) => {
  const response = await apiClient.get("/admin/categories", {
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
  const response = await apiClient.post("/admin/categories", payload, config);
  const body = response?.data;
  const created =
    (body && typeof body === "object" && !Array.isArray(body) && body.data && !Array.isArray(body.data)
      ? body.data
      : body) || {};

  return normalizeCategory(created);
};

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

export const fetchMonitorDashboard = (config = {}) =>
  apiClient.get("/admin/monitor/dashboard", config).then((res) => res?.data || {});

export const fetchMonitorStats = (config = {}) =>
  apiClient.get("/admin/monitor/summary", config).then((res) => res?.data || {});

export const fetchMonitorActivity = (range = "24h", config = {}) =>
  apiClient
    .get(`/admin/monitor/activity?range=${encodeURIComponent(range)}`, config)
    .then((res) => res?.data || {});

export const fetchMonitorHealth = (config = {}) =>
  apiClient.get("/admin/monitor/health", config).then((res) => res?.data || {});

export const fetchMonitorTopBooks = (limit = 5, config = {}) =>
  apiClient
    .get(`/admin/monitor/top-books?limit=${encodeURIComponent(limit)}`, config)
    .then((res) => res?.data || {});

export const fetchTopReaders = (range = "week", limit = 3, config = {}) =>
  apiClient
    .get(`/admin/leaderboard/readers?range=${encodeURIComponent(range)}&limit=${encodeURIComponent(limit)}`, config)
    .then((res) => res?.data || {});

const unwrapPayload = (payload, fallback) => {
  if (payload == null) return fallback;
  if (payload?.data != null) return payload.data;
  return payload;
};

const unwrapObjectPayload = (payload) => {
  const value = unwrapPayload(payload, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
};

const unwrapArrayPayload = (payload) => {
  const value = unwrapPayload(payload, []);
  return Array.isArray(value) ? value : [];
};

const isRequestConfig = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("signal" in value || "headers" in value || "params" in value || "timeout" in value),
  );

// ============================================
// Author Dashboard Endpoints
// ============================================

export const fetchAuthorStats = (config = {}) =>
  apiClient.get("/author/dashboard/stats", config).then((res) => unwrapObjectPayload(res?.data));

export const fetchAuthorPerformance = (range = "30d", groupBy = "daily", config = {}) =>
  apiClient
    .get(`/author/dashboard/performance?range=${encodeURIComponent(range)}&groupBy=${encodeURIComponent(groupBy)}`, config)
    .then((res) => unwrapArrayPayload(res?.data));

export const fetchAuthorTopBooks = (optionsOrConfig = {}, config = {}) => {
  const options = isRequestConfig(optionsOrConfig) ? {} : optionsOrConfig;
  const requestConfig = isRequestConfig(optionsOrConfig) ? optionsOrConfig : config;
  const limit = Number(options?.limit) > 0 ? Number(options.limit) : 4;
  const orderBy = String(options?.orderBy || "sales").trim() || "sales";

  return apiClient
    .get(
      `/author/dashboard/top-books?limit=${encodeURIComponent(limit)}&orderBy=${encodeURIComponent(orderBy)}`,
      requestConfig,
    )
    .then((res) => unwrapArrayPayload(res?.data));
};

export const fetchAuthorFeedback = (limit = 10, filter = "all", config = {}) =>
  apiClient
    .get(`/author/dashboard/feedback?limit=${encodeURIComponent(limit)}&filter=${encodeURIComponent(filter)}`, config)
    .then((res) => unwrapArrayPayload(res?.data));

export const fetchAuthorDemographics = (config = {}) =>
  apiClient.get("/author/dashboard/demographics", config).then((res) => unwrapObjectPayload(res?.data));

// ============================================
// Notifications Endpoints
// ============================================

export const fetchAuthorNotifications = (config = {}) =>
  apiClient.get("/author/notifications", config).then((res) => res?.data || {});

export const fetchAdminNotifications = (config = {}) =>
  apiClient.get("/admin/notifications", config).then((res) => res?.data || {});

export const sendAdminNotification = (payload = {}, config = {}) =>
  apiClient.post("/admin/notifications/send", payload, config).then((res) => res?.data || {});

// Export as object for consistent naming
export default {
  fetchAdminBooks,
  approveBook,
  rejectBook,
  fetchAdminCategories,
  createAdminCategory,
  fetchDashboard,
  fetchDashboardStats,
  fetchDashboardActivity,
  fetchDashboardHealth,
  fetchMonitorDashboard,
  fetchMonitorStats,
  fetchMonitorActivity,
  fetchMonitorHealth,
  fetchMonitorTopBooks,
  fetchTopReaders,
  fetchAuthorStats,
  fetchAuthorPerformance,
  fetchAuthorTopBooks,
  fetchAuthorFeedback,
  fetchAuthorDemographics,
  fetchAuthorNotifications,
  fetchAdminNotifications,
  sendAdminNotification,
  normalizeBook,
  buildStorageUrl,
};
