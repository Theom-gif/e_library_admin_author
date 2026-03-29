const BOOKS_STORAGE_KEY = 'author_studio_books';

const safeJsonParse = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const readLocalBooks = () => {
  if (typeof window === 'undefined') return [];
  const raw =
    window.localStorage.getItem(BOOKS_STORAGE_KEY) ||
    window.sessionStorage.getItem(BOOKS_STORAGE_KEY);
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
};

const sanitizeBooksForStorage = (books) =>
  (Array.isArray(books) ? books : []).map((book) => {
    const img = typeof book?.img === 'string' ? book.img : '';
    const shouldDropImg = img.startsWith('data:image/');
    if (!shouldDropImg) return book;
    return { ...book, img: '' };
  });

export const writeLocalBooks = (books) => {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify(Array.isArray(books) ? books : []);

  try {
    window.localStorage.setItem(BOOKS_STORAGE_KEY, payload);
    return;
  } catch {
    // Ignore and fallback below.
  }

  // If localStorage is unavailable/quota exceeded, try a smaller payload and/or sessionStorage.
  const sanitizedPayload = JSON.stringify(sanitizeBooksForStorage(books));
  try {
    window.localStorage.setItem(BOOKS_STORAGE_KEY, sanitizedPayload);
    return;
  } catch {
    // Ignore and fallback below.
  }

  try {
    window.sessionStorage.setItem(BOOKS_STORAGE_KEY, sanitizedPayload);
  } catch {
    // Give up silently; drafts won't persist.
  }
};

export const upsertLocalBook = (book) => {
  if (!book || typeof window === 'undefined') return null;
  const books = readLocalBooks();
  const clientKey = String(book.clientKey || '').trim();
  const existingIndex = clientKey
    ? books.findIndex((item) => String(item?.clientKey || '').trim() === clientKey)
    : -1;

  const id = Number(book.id);
  const nextId =
    existingIndex >= 0
      ? Number(books[existingIndex]?.id) || Date.now()
      : Number.isFinite(id) && id > 0
        ? id
        : Date.now();

  const next = {
    ...book,
    id: nextId,
    bookId: nextId,
    source: 'local',
    status: book.status || 'Draft',
    clientKey: clientKey || undefined,
    createdAt: book.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const index = existingIndex >= 0 ? existingIndex : books.findIndex((item) => Number(item?.id) === nextId);
  const updated = index >= 0 ? books.map((item, i) => (i === index ? next : item)) : [next, ...books];

  writeLocalBooks(updated);
  return next;
};

export const removeLocalBook = (bookId) => {
  if (typeof window === 'undefined') return;
  const id = Number(bookId);
  const books = readLocalBooks();
  writeLocalBooks(books.filter((item) => Number(item?.id) !== id));
};

export const removeLocalBookByClientKey = (clientKey) => {
  if (typeof window === 'undefined') return;
  const normalizedKey = String(clientKey || '').trim();
  if (!normalizedKey) return;
  const books = readLocalBooks();
  writeLocalBooks(
    books.filter((item) => String(item?.clientKey || '').trim() !== normalizedKey),
  );
};

export const clearLocalBooks = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(BOOKS_STORAGE_KEY);
  window.sessionStorage.removeItem(BOOKS_STORAGE_KEY);
};
