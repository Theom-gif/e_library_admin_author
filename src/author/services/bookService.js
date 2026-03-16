import { apiClient, API_BASE_URL } from '../../lib/apiClient';

const BOOKS_ENDPOINT = '/api/auth/books';
const UPLOAD_BOOK_ENDPOINT = '/api/auth/book';
const IMPORT_BOOKS_ENDPOINT = '/api/auth/books/import-local';

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

export const mapApiBookToUiBook = (book) => ({
  bookId: toNumberId(book?.id),
  id: toNumberId(book?.id),
  title: book?.title || 'Untitled',
  author: book?.author || 'Unknown Author',
  status: normalizeStatus(book?.status),
  rating: 0,
  reads: '0',
  sales: '$0',
  img:
    buildStorageUrl(book?.cover_image_path) ||
    buildStorageUrl(book?.cover_image_url) ||
    normalizeAssetUrl(book?.cover_image_url) ||
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
});

const buildBooksQuery = (filters = {}) => {
  const params = new URLSearchParams();
  const status = String(filters.status || 'approved').trim();
  if (status) {
    params.set('status', status);
  }
  const search = String(filters.search || '').trim();
  if (search) {
    params.set('search', search);
  }
  return params.toString() ? `${BOOKS_ENDPOINT}?${params.toString()}` : BOOKS_ENDPOINT;
};

export const getBooksRequest = async (filters = {}) => {
  const response = await apiClient.get(buildBooksQuery(filters));
  const payload = response?.data;
  const rows =
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.books) && payload.books) ||
    (Array.isArray(payload) && payload) ||
    [];
  return rows.map(mapApiBookToUiBook);
};

export const uploadBookRequest = (formData) =>
  apiClient.post(UPLOAD_BOOK_ENDPOINT, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const importLocalBooksRequest = async (books = []) => {
  const response = await apiClient.post(IMPORT_BOOKS_ENDPOINT, { books });
  return response?.data?.data || {};
};

export const updateBookRequest = (id, formData) =>
  apiClient.post(`${BOOKS_ENDPOINT}/${id}`, (() => {
    const payload = formData instanceof FormData ? formData : new FormData();
    if (!payload.has('_method')) {
      payload.append('_method', 'PATCH');
    }
    return payload;
  })(), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const deleteBookRequest = (id) => apiClient.delete(`${BOOKS_ENDPOINT}/${id}`);
