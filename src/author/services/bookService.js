import { apiClient, API_BASE_URL } from '../../lib/apiClient';

const BOOKS_ENDPOINTS = ['/api/auth/books'];
const UPLOAD_BOOK_ENDPOINTS = ['/api/auth/book'];
const IMPORT_BOOKS_ENDPOINTS = ['/api/auth/books/import-local'];
const TOKEN_KEY = 'bookhub_token';
const UPLOAD_TIMEOUT_MS = Number(import.meta.env.VITE_UPLOAD_TIMEOUT_MS) || 120000;
const UPLOAD_RETRY_LIMIT = 1;

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token =
    window.localStorage.getItem(TOKEN_KEY) ||
    window.sessionStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const withAuth = (config = {}) => ({
  ...config,
  headers: {
    ...(config.headers || {}),
    ...getAuthHeaders(),
  },
});

const shouldTryFallback = (error) => {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403 || status === 404 || status === 405;
};

const requestWithFallback = async (endpoints, requestFn) => {
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      return await requestFn(endpoint);
    } catch (error) {
      lastError = error;
      if (!shouldTryFallback(error)) {
        throw error;
      }
    }
  }
  throw lastError || new Error('Unable to reach the book service.');
};

const isTimeoutError = (error) =>
  error?.code === 'ECONNABORTED' || String(error?.message || '').toLowerCase().includes('timeout');

const postWithRetry = async (endpoint, formData) => {
  let attempt = 0;
  // Retry on timeout only, once by default.
  while (attempt <= UPLOAD_RETRY_LIMIT) {
    try {
      return await apiClient.post(
        endpoint,
        formData,
        withAuth({
          timeout: UPLOAD_TIMEOUT_MS,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }),
      );
    } catch (error) {
      if (!isTimeoutError(error) || attempt >= UPLOAD_RETRY_LIMIT) {
        throw error;
      }
      attempt += 1;
    }
  }
  throw new Error('Upload failed after retry.');
};

const toNumberId = (value, fallback = Date.now()) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getFileName = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const normalized = trimmed.split('?')[0];
  const segments = normalized.split('/');
  return segments[segments.length - 1] || '';
};

const inferFileType = (fileName = '') => {
  const lower = String(fileName).toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.epub')) return 'application/epub+zip';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.doc')) return 'application/msword';
  return '';
};

const isLoopbackHost = (host = '') =>
  host === '127.0.0.1' || host === 'localhost' || host === '::1';

const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(String(value));
const isBlobLikeUrl = (value = '') => /^data:|^blob:/i.test(String(value));
const trimSlash = (value = '') => String(value || '').replace(/\/+$/, '');

const buildStorageUrl = (path = '') => {
  if (!path) return '';
  if (isBlobLikeUrl(path)) return path;
  if (isAbsoluteUrl(path)) return path;
  const clean = String(path).replace(/^\/+/, '');
  const normalized = clean.startsWith('storage/') ? clean.slice('storage/'.length) : clean;
  return `${trimSlash(API_BASE_URL)}/storage/${normalized}`;
};

const normalizeAssetUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const currentHost = window.location.hostname;
      if (!isLoopbackHost(currentHost) && isLoopbackHost(url.hostname)) {
        url.hostname = currentHost;
      }
    }
    return url.toString();
  } catch {
    return raw;
  }
};

const normalizeStatus = (value) => {
  const text = String(value || '').trim();
  if (!text) return 'Pending';
  const lower = text.toLowerCase();
  if (lower === 'approved') return 'Approved';
  if (lower === 'rejected') return 'Rejected';
  if (lower === 'pending') return 'Pending';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const pickCoverValue = (book) =>
  book?.cover_image_path ??
  book?.cover_image_url ??
  book?.cover_image ??
  book?.cover ??
  book?.cover_path ??
  book?.coverUrl ??
  book?.image ??
  '';

export const mapApiBookToUiBook = (book) => {
  const coverValue = pickCoverValue(book);
  return {
  bookId: toNumberId(book?.id),
  id: toNumberId(book?.id),
  title: book?.title || 'Untitled',
  author: book?.author || 'Unknown Author',
  status: normalizeStatus(book?.status),
  rating: 0,
  reads: '0',
  sales: '$0',
  img:
    buildStorageUrl(coverValue) ||
    normalizeAssetUrl(coverValue) ||
    'https://picsum.photos/seed/new-book/300/450',
  description: book?.description || '',
  genre: book?.category || '',
  manuscriptUrl:
    buildStorageUrl(book?.book_file_path) ||
    buildStorageUrl(book?.book_file_url) ||
    normalizeAssetUrl(book?.book_file_url),
  manuscriptName: getFileName(book?.book_file_url || book?.book_file_path || ''),
  manuscriptType: book?.manuscript_type || inferFileType(getFileName(book?.book_file_url || book?.book_file_path || '')),
  manuscriptSizeBytes: book?.manuscript_size_bytes || 0,
  source: 'database',
  };
};

const buildBooksQuery = (filters = {}) => {
  const params = new URLSearchParams();
  // Only apply status filter if explicitly provided in filters
  const status = String(filters.status ?? '').trim();
  if (status) {
    params.set('status', status);
  }
  const search = String(filters.search || '').trim();
  if (search) {
    params.set('search', search);
  }
  const query = params.toString();
  return (endpoint) => (query ? `${endpoint}?${query}` : endpoint);
};

export const getBooksRequest = async (filters = {}) => {
  const buildQuery = buildBooksQuery(filters);
  const response = await requestWithFallback(BOOKS_ENDPOINTS, (endpoint) =>
    apiClient.get(buildQuery(endpoint), withAuth()),
  );
  const payload = response?.data;
  const rows =
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.books) && payload.books) ||
    (Array.isArray(payload) && payload) ||
    [];
  return rows.map(mapApiBookToUiBook);
};

export const uploadBookRequest = (formData) =>
  requestWithFallback(UPLOAD_BOOK_ENDPOINTS, (endpoint) =>
    postWithRetry(endpoint, formData),
  );

export const importLocalBooksRequest = async (books = []) => {
  const response = await requestWithFallback(IMPORT_BOOKS_ENDPOINTS, (endpoint) =>
    apiClient.post(endpoint, { books }, withAuth()),
  );
  return response?.data?.data || {};
};

export const updateBookRequest = (id, formData) =>
  requestWithFallback(BOOKS_ENDPOINTS, (endpoint) =>
    postWithRetry(
      `${endpoint}/${id}`,
      (() => {
        const payload = formData instanceof FormData ? formData : new FormData();
        if (!payload.has('_method')) {
          payload.append('_method', 'PATCH');
        }
        return payload;
      })(),
    ),
  );

export const deleteBookRequest = (id) =>
  requestWithFallback(BOOKS_ENDPOINTS, (endpoint) =>
    apiClient.delete(`${endpoint}/${id}`, withAuth()),
  );
