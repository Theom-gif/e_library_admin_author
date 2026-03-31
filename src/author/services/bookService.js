import { apiClient, API_BASE_URL, API_LONG_TIMEOUT_MS } from '../../lib/apiClient';

// Backend contract uses /api/auth/* for author flows.
const BOOKS_ENDPOINTS = ['/auth/books'];
const UPLOAD_BOOK_ENDPOINTS = ['/auth/book'];
const IMPORT_BOOKS_ENDPOINT = '/auth/books/import-local';
const FILE_UPLOAD_CONFIG = { timeout: API_LONG_TIMEOUT_MS };

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
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.rtf')) return 'application/rtf';
  return '';
};

const isLoopbackHost = (host = '') =>
  host === '127.0.0.1' || host === 'localhost' || host === '::1';

const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(String(value));
const isBlobLikeUrl = (value = '') => /^data:|^blob:/i.test(String(value));
const isRootRelativeUrl = (value = '') => /^\//.test(String(value || '').trim());
const trimSlash = (value = '') => String(value || '').replace(/\/+$/, '');

// Assets live at the site root (e.g., https://example.com/storage/...), not under /api.
const stripApiSuffix = (value = '') => String(value || '').replace(/\/api(?:\/.*)?$/i, '');
const ASSET_BASE_URL = trimSlash(stripApiSuffix(API_BASE_URL));

const buildStorageUrl = (path = '') => {
  if (!path) return '';
  if (isBlobLikeUrl(path)) return path;
  if (isAbsoluteUrl(path)) return path;

  const normalized = String(path).replace(/\\/g, '/').trim();
  let clean = normalized.replace(/^\/+/, '');

  // Accept filesystem paths and common Laravel storage prefixes.
  const storageAppPublic = 'storage/app/public/';
  const storageIndex = clean.indexOf('storage/');
  const storageAppIndex = clean.indexOf(storageAppPublic);
  const publicIndex = clean.indexOf('public/');

  if (storageAppIndex !== -1) {
    clean = clean.slice(storageAppIndex + storageAppPublic.length);
  } else if (publicIndex !== -1) {
    clean = clean.slice(publicIndex + 'public/'.length);
  } else if (storageIndex !== -1) {
    clean = clean.slice(storageIndex + 'storage/'.length);
  }

  return `${ASSET_BASE_URL}/storage/${clean.replace(/^\/+/, '')}`;
};

const normalizeAssetUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (isBlobLikeUrl(raw)) return raw;
  if (isRootRelativeUrl(raw)) {
    return `${ASSET_BASE_URL}${raw}`;
  }

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
    return buildStorageUrl(raw);
  }
};

const resolveAssetUrl = (...candidates) => {
  for (const candidate of candidates) {
    const normalized =
      normalizeAssetUrl(candidate) ||
      buildStorageUrl(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return '';
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

const normalizeStatusFilter = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return 'All';
  const lower = text.toLowerCase();
  if (lower === 'all') return 'All';
  if (lower === 'approved') return 'Approved';
  if (lower === 'pending') return 'Pending';
  if (lower === 'rejected') return 'Rejected';
  return text;
};

const getBookRating = (book = {}) => {
  const candidates = [
    book?.rating,
    book?.average_rating,
    book?.averageRating,
    book?.book_rating,
    book?.score,
    book?.review_rating,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }
  }

  return 0;
};

export const mapApiBookToUiBook = (book) => ({
  bookId: toNumberId(book?.id),
  id: toNumberId(book?.id),
  title: String(book?.title || 'Untitled').trim(),
  author: book?.author_name || (typeof book?.author === 'string' ? book?.author : book?.author?.name) || 'Unknown Author',
  status: normalizeStatus(book?.status),
  rating: getBookRating(book),
  reads: '0',
  sales: '$0',
  img:
    resolveAssetUrl(
      book?.cover_image_url,
      book?.cover_view_url,
      book?.cover_api_url,
      book?.cover_image_path,
      book?.cover_image,
      book?.coverImage,
      book?.cover_url,
      book?.coverUrl,
      book?.image_url,
      book?.imageUrl,
      book?.image_path,
      book?.imagePath,
      book?.cover,
      book?.image,
      book?.thumbnail,
    ) || 'https://picsum.photos/seed/new-book/300/450',
  description: String(book?.description || '').trim(),
  genre: (typeof book?.category === 'string' ? book?.category : book?.category?.name) || book?.genre || '',
  manuscriptUrl: resolveAssetUrl(
    book?.pdf_path,
    book?.book_file_path,
    book?.book_file_url,
    book?.file,
  ),
  rawPdfPath: book?.pdf_path || '',
  rawBookFilePath: book?.book_file_path || '',
  rawBookFileUrl: book?.book_file_url || '',
  rawFile: book?.file || '',
  totalReaders: Number(book?.totalReaders ?? book?.total_readers ?? book?.readers ?? 0) || 0,
  completionRate: Number(book?.completionRate ?? book?.completion_rate ?? 0) || 0,
  monthlyReads: Number(book?.monthlyReads ?? book?.monthly_reads ?? 0) || 0,
  createdAt: book?.created_at || book?.createdAt || '',
  updatedAt: book?.updated_at || book?.updatedAt || '',
  manuscriptName: getFileName(book?.pdf_path || book?.book_file_url || book?.book_file_path || ''),
  manuscriptType: book?.manuscript_type || book?.pdf_mime_type || inferFileType(getFileName(book?.pdf_path || book?.book_file_url || book?.book_file_path || '')),
  manuscriptSizeBytes: book?.manuscript_size_bytes || 0,
  source: 'database',
});

const buildBooksQuery = (endpoint, filters = {}) => {
  const params = new URLSearchParams();
  const normalizedStatus = normalizeStatusFilter(filters.status);
  // Some backends treat "All" as an error; omit the param to mean "all statuses".
  if (normalizedStatus && normalizedStatus !== 'All') {
    params.set('status', normalizedStatus);
  }
  const search = String(filters.search || '').trim();
  if (search) {
    params.set('search', search);
  }
  return params.toString() ? `${endpoint}?${params.toString()}` : endpoint;
};

export const getBooksRequest = async (filters = {}) => {
  let lastError = null;
  for (const endpoint of BOOKS_ENDPOINTS) {
    try {
      const response = await apiClient.get(buildBooksQuery(endpoint, filters));
      const payload = response?.data;
      const rows =
        (Array.isArray(payload?.data) && payload.data) ||
        (Array.isArray(payload?.data?.data) && payload.data.data) ||
        (Array.isArray(payload?.data?.books) && payload.data.books) ||
        (Array.isArray(payload?.books) && payload.books) ||
        (Array.isArray(payload) && payload) ||
        [];
      return rows.map(mapApiBookToUiBook);
    } catch (error) {
      lastError = error;
      if (typeof window !== 'undefined') {
        console.error('[Books] Failed endpoint:', endpoint, {
          status: error?.response?.status,
          message: error?.response?.data?.message || error?.message,
          url: error?.config?.url,
        });
      }
      const status = error?.response?.status;
      // Only retry for route mismatch scenarios.
      const shouldRetry = status === 404 || status === 405;
      if (!shouldRetry) break;
    }
  }
  if (lastError) {
    throw lastError;
  }
  return [];
};

export const uploadBookRequest = async (formData) => {
  let lastError = null;
  for (const endpoint of UPLOAD_BOOK_ENDPOINTS) {
    try {
      // Let Axios/browser set the correct multipart boundary automatically.
      return await apiClient.post(endpoint, formData, FILE_UPLOAD_CONFIG);
    } catch (error) {
      lastError = error;
      if (typeof window !== 'undefined') {
        console.error('[Books] Upload failed endpoint:', endpoint, {
          status: error?.response?.status,
          message: error?.response?.data?.message || error?.message,
          url: error?.config?.url,
        });
      }
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        '';
      const errors = error?.response?.data?.errors || {};
      const bookFileErrors = errors?.book_file || errors?.bookFile || errors?.file;
      const hasBookFileError =
        /book pdf file is required/i.test(String(message)) ||
        /book[_\s-]?file/i.test(String(bookFileErrors));
      // Only retry for route mismatch scenarios.
      const shouldRetry = status === 404 || status === 405;
      if (!shouldRetry) break;
    }
  }
  if (lastError) {
    throw lastError;
  }
  return null;
};

export const importLocalBooksRequest = async (books = []) => {
  const response = await apiClient.post(IMPORT_BOOKS_ENDPOINT, { books });
  return response?.data?.data || {};
};

export const updateBookRequest = async (id, formData) => {
  let lastError = null;
  for (const endpoint of BOOKS_ENDPOINTS) {
    try {
      const payload = formData instanceof FormData ? formData : new FormData();
      if (!payload.has('_method')) {
        payload.append('_method', 'PATCH');
      }
      // Let Axios/browser set the correct multipart boundary automatically.
      return await apiClient.post(`${endpoint}/${id}`, payload, FILE_UPLOAD_CONFIG);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const shouldRetry =
        status === 401 ||
        status === 403 ||
        status === 404 ||
        status === 405 ||
        status === 500;
      if (!shouldRetry) break;
    }
  }
  if (lastError) throw lastError;
  return null;
};

export const deleteBookRequest = async (id) => {
  let lastError = null;
  for (const endpoint of BOOKS_ENDPOINTS) {
    try {
      return await apiClient.delete(`${endpoint}/${id}`);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const shouldRetry =
        status === 401 ||
        status === 403 ||
        status === 404 ||
        status === 405 ||
        status === 500;
      if (!shouldRetry) break;
    }
  }
  if (lastError) throw lastError;
  return null;
};
