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

const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(String(value || '').trim());

const joinUrl = (base, path) => {
  const normalizedBase = String(base || '').replace(/\/+$/, '');
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
};

const normalizeAssetUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/')) {
    return joinUrl(API_BASE_URL, raw);
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
    return raw;
  }
};

const resolveStoragePath = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (isAbsoluteUrl(raw)) return normalizeAssetUrl(raw);
  if (raw.startsWith('/')) return joinUrl(API_BASE_URL, raw);
  if (raw.startsWith('storage/') || raw.startsWith('uploads/')) {
    return joinUrl(API_BASE_URL, raw);
  }
  return joinUrl(API_BASE_URL, `storage/${raw}`);
};

const pickFirst = (...values) => {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const mapApiBookToUiBook = (book) => ({
  bookId: toNumberId(book?.id),
  id: toNumberId(book?.id),
  title: book?.title || 'Untitled',
  author: book?.author || 'Unknown Author',
  status: 'Published',
  rating: 0,
  reads: '0',
  sales: '$0',
  img: pickFirst(
    resolveStoragePath(book?.cover_image_path),
    normalizeAssetUrl(book?.cover_image_url),
    normalizeAssetUrl(book?.cover_image),
    normalizeAssetUrl(book?.cover_url),
    normalizeAssetUrl(book?.cover),
    normalizeAssetUrl(book?.poster),
    normalizeAssetUrl(book?.image),
    normalizeAssetUrl(book?.img),
    'https://picsum.photos/seed/new-book/300/450',
  ),
  description: book?.description || '',
  genre: book?.category || '',
  manuscriptUrl: pickFirst(
    resolveStoragePath(book?.book_file_path),
    normalizeAssetUrl(book?.book_file_url),
    normalizeAssetUrl(book?.book_file),
    normalizeAssetUrl(book?.manuscript_url),
    normalizeAssetUrl(book?.file_url),
  ),
  manuscriptName: pickFirst(
    book?.book_file_name,
    book?.manuscript_name,
    book?.file_name,
    book?.filename,
    getFileName(book?.book_file_url || book?.book_file_path || book?.book_file || book?.file_url || ''),
  ),
  manuscriptType: inferFileType(
    pickFirst(
      book?.book_file_name,
      book?.manuscript_name,
      book?.file_name,
      book?.filename,
      getFileName(book?.book_file_url || book?.book_file_path || book?.book_file || book?.file_url || ''),
    ),
  ),
  manuscriptSizeBytes: toNumber(
    book?.book_file_size ||
      book?.manuscript_size ||
      book?.file_size ||
      book?.size ||
      0,
  ),
  source: 'database',
});

export const getBooksRequest = async () => {
  const response = await apiClient.get(BOOKS_ENDPOINT);
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
