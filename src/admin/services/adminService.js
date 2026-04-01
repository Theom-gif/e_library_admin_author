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
  // base = "/api" (relative) or "https://domain.com/api" (absolute)
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
    title: String(book.title ?? book.name ?? "Untitled").trim(),
    author: book.author_name ?? (typeof book.author === 'string' ? book.author : book.author?.name) ?? book.authorName ?? "Unknown",
    category: (typeof book.category === 'string' ? book.category : book.category?.name) ?? book.genre ?? book.genre_name ?? "",
    status: String(book.status ?? "Pending"),
    downloads: Number(book.downloads ?? 0),
    cover: coverPath,
    coverUrl: coverPath,
    fileUrl: filePath,
    description: String(book.description ?? "").trim(),
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

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const pickFirstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null);

const hasDashboardHealthShape = (value) =>
  isPlainObject(value) &&
  [
    "uptimePercent",
    "uptime_percent",
    "apiServer",
    "api_server",
    "database",
    "db",
    "fileStorage",
    "file_storage",
    "emailService",
    "email_service",
  ].some((key) => key in value);

const normalizeHealthStatus = (status) => {
  const value = String(status ?? "").trim().toLowerCase();

  if (!value) return "online";
  if (["online", "healthy", "ok", "up", "available", "connected", "success", "true"].includes(value)) {
    return "online";
  }
  if (["warning", "warn", "degraded", "slow", "partial"].includes(value)) {
    return "warning";
  }
  if (["offline", "down", "error", "failed", "failure", "unhealthy", "critical", "false"].includes(value)) {
    return "offline";
  }

  return "warning";
};

const pickSection = (source, keys) => {
  for (const key of keys) {
    if (isPlainObject(source?.[key])) {
      return source[key];
    }
  }

  return {};
};

const normalizeMetric = (source, keys) =>
  toNumberOr(pickFirstDefined(...keys.map((key) => source?.[key])), 0);

export const normalizeDashboardHealth = (payload = {}) => {
  const raw = hasDashboardHealthShape(payload?.health)
    ? payload.health
    : hasDashboardHealthShape(payload?.data?.health)
      ? payload.data.health
      : hasDashboardHealthShape(payload?.data)
        ? payload.data
        : hasDashboardHealthShape(payload)
          ? payload
          : {};

  const apiServer = pickSection(raw, ["apiServer", "api_server", "api"]);
  const database = pickSection(raw, ["database", "db"]);
  const fileStorage = pickSection(raw, ["fileStorage", "file_storage", "storage"]);
  const emailService = pickSection(raw, ["emailService", "email_service", "email", "mailer"]);

  return {
    uptimePercent: pickFirstDefined(raw?.uptimePercent, raw?.uptime_percent, 0),
    apiServer: {
      status: normalizeHealthStatus(
        pickFirstDefined(apiServer?.status, apiServer?.state, apiServer?.health),
      ),
      latencyMs: normalizeMetric(apiServer, ["latencyMs", "latency_ms", "latency", "responseMs", "response_ms"]),
    },
    database: {
      status: normalizeHealthStatus(
        pickFirstDefined(database?.status, database?.state, database?.health),
      ),
      queryTimeMs: normalizeMetric(database, ["queryTimeMs", "query_time_ms", "queryTime", "query_time"]),
    },
    fileStorage: {
      status: normalizeHealthStatus(
        pickFirstDefined(fileStorage?.status, fileStorage?.state, fileStorage?.health),
      ),
      usedPercent: normalizeMetric(fileStorage, ["usedPercent", "used_percent", "usagePercent", "usage_percent"]),
    },
    emailService: {
      status: normalizeHealthStatus(
        pickFirstDefined(emailService?.status, emailService?.state, emailService?.health),
      ),
      responseMs: normalizeMetric(emailService, ["responseMs", "response_ms", "responseTimeMs", "response_time_ms"]),
    },
  };
};

const buildHealthProbeUrls = () => {
  const apiBase = trimSlash(API_BASE_URL);
  const siteBase = trimSlash(stripApiSuffix(API_BASE_URL));
  const candidates = [];

  if (apiBase) {
    candidates.push(/\/api$/i.test(apiBase) ? `${apiBase}/health` : `${apiBase}/api/health`);
  }

  if (siteBase) {
    candidates.push(`${siteBase}/health`);
  }

  if (!isAbsoluteUrl(apiBase)) {
    candidates.push("/api/health");
    candidates.push("/health");
  }

  return [...new Set(candidates.filter(Boolean))];
};

export const probeApiServerHealth = async (config = {}) => {
  const urls = buildHealthProbeUrls();
  const signal = config?.signal;

  for (const url of urls) {
    const startedAt = Date.now();

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        continue;
      }

      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      const latencyMs = Math.max(1, Date.now() - startedAt);
      const status = normalizeHealthStatus(
        pickFirstDefined(payload?.status, payload?.state, payload?.health, "online"),
      );

      return {
        status,
        latencyMs,
        source: url,
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
    }
  }

  return {
    status: "offline",
    latencyMs: 0,
    source: urls[0] || "",
  };
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

const parseMaybeJsonObject = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const firstNonEmptyValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const buildAuthorRequestName = (sources = []) => {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    const directName = String(source.name ?? source.full_name ?? "").trim();
    if (directName) {
      return directName;
    }

    const firstName = String(source.first_name ?? source.firstname ?? "").trim();
    const lastName = String(source.last_name ?? source.lastname ?? "").trim();
    const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (joined) {
      return joined;
    }
  }

  return "";
};

const toTimestamp = (value) => {
  const parsed = new Date(value || "").getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const mergeNotificationEntries = (current = {}, next = {}) => ({
  ...current,
  ...next,
  title: firstNonEmptyValue(next.title, current.title) || "",
  message: firstNonEmptyValue(next.message, current.message) || "",
  description: firstNonEmptyValue(next.description, current.description) || "",
  email: firstNonEmptyValue(next.email, current.email) || "",
  author_id: firstNonEmptyValue(next.author_id, current.author_id) || "",
  status: firstNonEmptyValue(next.status, current.status) || "",
  applicant_name: firstNonEmptyValue(next.applicant_name, current.applicant_name) || "",
  bio: firstNonEmptyValue(next.bio, current.bio) || "",
  reason: firstNonEmptyValue(next.reason, current.reason) || "",
  created_at:
    toTimestamp(next.created_at) >= toTimestamp(current.created_at)
      ? next.created_at || current.created_at || ""
      : current.created_at || next.created_at || "",
  read: Boolean(current.read && next.read),
});

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

const unwrapNotifications = (res) => {
  const raw = res?.data;
  const rows =
    (Array.isArray(raw?.data) && raw.data) ||
    (Array.isArray(raw?.notifications) && raw.notifications) ||
    (Array.isArray(raw) && raw) ||
    [];
  const mapped = rows.map((item) => {
    const payload = {
      ...parseMaybeJsonObject(item?.payload),
      ...parseMaybeJsonObject(item?.data),
      ...parseMaybeJsonObject(item?.meta),
    };
    const type = String(
      firstNonEmptyValue(item.type, item.notification_type, payload.type, payload.notification_type) || "",
    ).trim();
    const authorId =
      firstNonEmptyValue(
        item.author_id,
        item.authorId,
        payload.author_id,
        payload.authorId,
        payload.user_id,
        payload.userId,
      ) || "";
    const email = firstNonEmptyValue(item.email, payload.email, payload.user_email, payload.reader_email) || "";
    const isPendingAuthorApproval = type === "author.pending_approval";
    const rawStatus = firstNonEmptyValue(item.status, payload.status, payload.request_status) || "";
    const status = isPendingAuthorApproval
      ? String(rawStatus || "in_review").trim().toLowerCase() || "in_review"
      : rawStatus;
    const requestName = buildAuthorRequestName([item, payload]);
    const requestReason = firstNonEmptyValue(
      payload.reason,
      payload.motivation,
      payload.request_reason,
      payload.request_message,
      payload.message,
      item.reason,
      item.motivation,
    ) || "";
    const requestBio = firstNonEmptyValue(payload.bio, payload.author_bio, item.bio) || "";
    const requestMessage =
      firstNonEmptyValue(item.message, payload.message, payload.title, item.title, item.body) ||
      (requestName
        ? `${requestName} requested to become an author.`
        : "New author request pending approval");

    return {
      id: item.id ?? item._id ?? "",
      type,
      title: isPendingAuthorApproval
        ? "New author request pending approval"
        : firstNonEmptyValue(item.title, payload.title, payload.subject) ?? "",
      message: isPendingAuthorApproval
        ? requestMessage
        : firstNonEmptyValue(item.message, item.title, item.body, payload.message, payload.title) ?? "",
      description:
        firstNonEmptyValue(item.description, payload.description, item.body) ??
        (isPendingAuthorApproval
          ? [email, status].filter(Boolean).join(" - ")
          : ""),
      read: Boolean(item.read ?? item.is_read ?? item.read_at),
      created_at: item.created_at ?? item.createdAt ?? "",
      author_id: authorId,
      email,
      status,
      applicant_name: requestName,
      bio: requestBio,
      reason: requestReason,
      payload,
      targetPath: isPendingAuthorApproval ? "/admin/notifications" : "",
      targetState: isPendingAuthorApproval
        ? {
            activeCategory: "user",
          }
        : null,
    };
  });

  const deduped = new Map();

  mapped.forEach((notification) => {
    const key = notification.type === "author.pending_approval"
      ? [
          notification.type,
          String(notification.email || "").trim().toLowerCase() || String(notification.author_id || "").trim(),
          notification.status || "",
        ].join("|")
      : String(notification.id || [
          notification.type,
          notification.message || "",
          notification.created_at || "",
        ].join("|"));

    const current = deduped.get(key);
    deduped.set(key, current ? mergeNotificationEntries(current, notification) : notification);
  });

  return Array.from(deduped.values()).sort(
    (left, right) => toTimestamp(right?.created_at) - toTimestamp(left?.created_at),
  );
};

// GET /api/admin/notifications
export const fetchAdminNotifications = (config = {}) =>
  apiClient.get("/admin/notifications", config).then(unwrapNotifications);

// POST /api/admin/notifications/send
export const sendAdminNotification = (payload = {}, config = {}) =>
  apiClient.post("/admin/notifications/send", payload, config).then((res) => res?.data || {});

// GET /api/author/notifications
export const fetchAuthorNotifications = (config = {}) =>
  apiClient.get("/author/notifications", config).then(unwrapNotifications);

// GET /api/user/notifications
export const fetchUserNotifications = (config = {}) =>
  apiClient.get("/user/notifications", config).then(unwrapNotifications);

// POST /api/user/notifications/{id}/read
export const markUserNotificationRead = (id, config = {}) =>
  apiClient.post(`/user/notifications/${id}/read`, null, config).then((res) => res?.data || {});

// POST /api/reading/start
export const startReading = (payload = {}, config = {}) =>
  apiClient.post("/reading/start", payload, config).then((res) => res?.data || {});

// POST /api/reading/finish
export const finishReading = (payload = {}, config = {}) =>
  apiClient.post("/reading/finish", payload, config).then((res) => res?.data || {});

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
  fetchUserNotifications,
  markUserNotificationRead,
  sendAdminNotification,
  startReading,
  finishReading,
  normalizeBook,
  buildStorageUrl,
};
