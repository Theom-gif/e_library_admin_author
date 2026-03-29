import React from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter, 
  Plus, 
  Eye, 
  Edit3,
  Star,
  Trash2
} from 'lucide-react';
import { searchBooks } from '../services/openLibraryService';
import { deleteBookRequest, getBooksRequest } from '../services/bookService';
import { clearAllManuscriptFiles } from '../services/manuscriptStorage';
import { clearAllCoverFiles } from '../services/coverStorage';
import { clearLocalBooks } from '../services/localBookStorage';

const DEFAULT_COVER = 'https://picsum.photos/seed/new-book/300/450';
const FALLBACK_COVER_URL = DEFAULT_COVER;
const COVER_CACHE_KEY = 'author_book_covers';
const buildCoverKey = (title, author) =>
  `${String(title || '').trim().toLowerCase()}|${String(author || '').trim().toLowerCase()}`;

const statusStyles = {
  Approved: 'bg-emerald-500/90 text-white',
  Pending: 'bg-amber-500/90 text-white',
  Rejected: 'bg-rose-500/90 text-white',
  Published: 'bg-emerald-500/90 text-white',
  Draft: 'bg-slate-500/90 text-white',
};

const getSafeCoverUrl = (value) => {
  const text = String(value || '').trim();
  if (text.startsWith('data:image/') || text.startsWith('blob:') || /^https?:\/\//i.test(text)) {
    return text;
  }
  return FALLBACK_COVER_URL;
};

const isPlaceholderCover = (value) => {
  const text = String(value || '').trim();
  return text === DEFAULT_COVER || text === FALLBACK_COVER_URL;
};

const resolveCoverUrl = (book, overrideUrl) => {
  const apiCover = getSafeCoverUrl(book?.img);
  if (apiCover && !isPlaceholderCover(apiCover)) {
    return apiCover;
  }

  const overrideCover = getSafeCoverUrl(overrideUrl);
  if (overrideCover && !isPlaceholderCover(overrideCover)) {
    return overrideCover;
  }

  return FALLBACK_COVER_URL;
};

const readCoverCache = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COVER_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const MyBooks = () => {
  const MotionDiv = motion.div;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [apiBooks, setApiBooks] = React.useState([]);
  const [apiLoading, setApiLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState('');
  const [books, setBooks] = React.useState([]);
  const [booksLoading, setBooksLoading] = React.useState(false);
  const [booksError, setBooksError] = React.useState('');
  const [deletingBookId, setDeletingBookId] = React.useState(null);
  const [recentCover, setRecentCover] = React.useState(null);
  const [coverCache, setCoverCache] = React.useState(() => readCoverCache());

  React.useEffect(() => {
    clearLocalBooks();
    window.localStorage.removeItem(COVER_CACHE_KEY);
    setCoverCache({});
    clearAllCoverFiles().catch(() => {});
    clearAllManuscriptFiles().catch(() => {});
  }, []);

  const loadBooks = React.useCallback(async () => {
    setBooksLoading(true);
    setBooksError('');
    try {
      const dbBooks = await getBooksRequest({ status: 'All' });
      setBooks(dbBooks);
    } catch (error) {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error || '';

      if (error?.isCorsError) {
        setBooksError('API blocked by CORS. Use /api proxy (VITE_API_BASE_URL=/api) or enable backend CORS.');
      } else if (status) {
        setBooksError(`Unable to load books (${status}). ${serverMessage || 'Please try again.'}`.trim());
      } else {
        setBooksError(`Unable to load books. ${error?.message || 'Please try again.'}`.trim());
      }
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  React.useEffect(() => {
    const state = location.state || null;
    if (!state) return;

    if (state.refresh) {
      loadBooks();
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (state.uploadedCover) {
      setRecentCover(state.uploadedCover);
      setCoverCache((current) => ({
        ...current,
        [state.uploadedCover.key]: state.uploadedCover.url,
      }));
    }

    loadBooks();
    navigate(location.pathname, { replace: true, state: null });
  }, [loadBooks, location.pathname, location.state, navigate]);

  React.useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setApiBooks([]);
      setApiError('');
      return;
    }

    const controller = new AbortController();
    const timerId = window.setTimeout(async () => {
      setApiLoading(true);
      setApiError('');
      try {
        const results = await searchBooks(query, {
          limit: 8,
          signal: controller.signal,
        });
        setApiBooks(results);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setApiError('Unable to load books from Open Library.');
          setApiBooks([]);
        }
      } finally {
        setApiLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timerId);
    };
  }, [searchQuery]);

  const filteredLocalBooks = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return books;
    return books.filter((book) => {
      const haystack = `${book.title} ${book.author} ${book.status}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [books, searchQuery]);

  const toEditableBook = (book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    status: book.status || 'Pending',
    rating: book.rating,
    reads: book.reads,
    sales: book.sales,
    coverUrl: getSafeCoverUrl(book.img),
    description: book.description || `${book.title} by ${book.author}.`,
    category: book.genre || 'Fantasy & Mystery',
    manuscriptName: book.manuscriptName || '',
    manuscriptType: book.manuscriptType || '',
    manuscriptSizeBytes: book.manuscriptSizeBytes || 0,
    source: 'database',
    tags: ['fiction', book.status.toLowerCase()],
  });

  const toDetailBook = (book) => ({
    id: book.bookId || book.id,
    key: '',
    title: book.title,
    author: book.author,
    coverUrl: getSafeCoverUrl(book.img),
    status: book.status,
    rating: book.rating,
    reads: book.reads,
    sales: book.sales,
    description: book.description || `${book.title} by ${book.author}.`,
    genre: book.genre || '',
    manuscriptName: book.manuscriptName || '',
    manuscriptType: book.manuscriptType || '',
    manuscriptSizeBytes: book.manuscriptSizeBytes || 0,
    manuscriptUrl: book.manuscriptUrl || '',
    source: book.source || 'database',
  });

  const toApiDetailBook = (book) => ({
    key: book.key,
    title: book.title,
    author: book.authorName,
    coverUrl: getSafeCoverUrl(book.coverUrl),
    firstPublishYear: book.firstPublishYear,
    description: '',
    source: 'openlibrary',
  });

  const handleDeleteBook = async (book) => {
    if (!book?.id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${book.title}"? This cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingBookId(book.id);
      await deleteBookRequest(book.id);
      await loadBooks();
    } catch {
      window.alert('Unable to delete this book. Please try again.');
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
          <p className="text-slate-400 mt-1">Manage and track your published books.</p>
        </div>
        <button
          onClick={() => navigate('/author/upload')}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-bold shadow-glow hover:opacity-90 transition-all"
        >
          <Plus className="size-5" />
          <span>Add New Book</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your uploaded books..." 
            className="w-full bg-card-dark border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.alert('Filter options coming soon.')}
            className="flex items-center gap-2 px-4 py-3 bg-card-dark border border-white/5 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Filter className="size-4" />
            <span>Filter</span>
          </button>
          <select className="bg-card-dark border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all">
            <option>Sort by: Newest</option>
            <option>Sort by: Popularity</option>
            <option>Sort by: Rating</option>
            <option>Sort by: Sales</option>
          </select>
        </div>
      </div>

      {booksError && <p className="text-sm text-rose-400 mb-4">{booksError}</p>}
      {booksLoading && <p className="text-sm text-slate-400 mb-4">Loading books from database...</p>}
      {!booksLoading && filteredLocalBooks.length === 0 && (
        <p className="text-sm text-slate-400 mb-8">
          No books yet. Upload a book and it will appear here.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {filteredLocalBooks.map((book, i) => {
          const coverKey = buildCoverKey(book.title, book.author);
          const cachedCover = coverCache?.[coverKey] || null;
          const coverOverride =
            ((recentCover &&
              (recentCover.id === book.id || recentCover.key === coverKey))
              ? recentCover.url
              : cachedCover);
          const resolvedCoverUrl = resolveCoverUrl(book, coverOverride);

          return (
            <MotionDiv 
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex gap-6 bg-card-dark border border-white/5 rounded-2xl p-4 card-shadow hover:border-accent/30 transition-all duration-300"
            >
              <div className="relative w-28 sm:w-32 shrink-0">
                <img 
                  src={resolvedCoverUrl}
                  alt={book.title} 
                  className="w-full aspect-[2/3] rounded-2xl object-cover border border-white/5 group-hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
                  onClick={() => navigate('/author/book-detail', { state: { book: toDetailBook(book) } })}
                  onError={(event) => {
                    if (event.currentTarget.src !== FALLBACK_COVER_URL) {
                      event.currentTarget.src = FALLBACK_COVER_URL;
                    }
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      statusStyles[book.status] || 'bg-slate-500/90 text-white'
                    }`}
                  >
                    {book.status || 'Pending'}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleDeleteBook(book)}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-rose-600 transition-colors"
                    aria-label={`Delete ${book.title}`}
                    disabled={deletingBookId === book.id}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold text-[color:var(--text)] truncate">{book.title}</h3>
                    <p className="text-sm text-slate-500 truncate">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pt-1">
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold">{book.rating || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="size-4" />
                    {book.reads || '0'}
                  </span>
                  {book.genre ? <span className="truncate">{book.genre}</span> : null}
                </div>

                {book.description ? (
                  <p className="text-sm text-slate-400 leading-relaxed max-h-[4.5rem] overflow-hidden">
                    {book.description}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {book.genre ? (
                    <span className="inline-flex items-center rounded-md bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                      {book.genre}
                    </span>
                  ) : null}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => navigate('/author/book-detail', { state: { book: toDetailBook(book) } })}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:brightness-110 transition-colors"
                  >
                    <Eye className="size-3.5" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => navigate('/author/edit-book', { state: { book: toEditableBook(book) } })}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/80 transition-colors"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
              
              {/* <div className="grid grid-cols-2 gap-4 pt-4 border-top border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Reads</p>
                  <p className="text-sm font-bold">{book.reads}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Sales</p>
                  <p className="text-sm font-bold">{book.sales}</p>
                </div>
              </div> */}
            </MotionDiv>
          );
        })}
      </div>

      {searchQuery.trim() && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Open Library Results</h2>
            {apiLoading && <p className="text-xs text-slate-400">Searching...</p>}
          </div>

          {apiError && (
            <p className="text-sm text-rose-400 mb-4">{apiError}</p>
          )}

          {!apiError && !apiLoading && apiBooks.length === 0 && (
            <p className="text-sm text-slate-400 mb-4">No API results found.</p>
          )}

          {apiBooks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {apiBooks.map((book, i) => (
                <MotionDiv
                  key={book.key || `${book.title}-${book.authorName}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group bg-card-dark border border-white/5 rounded-2xl overflow-hidden card-shadow hover:border-accent/30 transition-all duration-300"
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                      src={getSafeCoverUrl(book.coverUrl)}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(event) => {
                        if (event.currentTarget.src !== FALLBACK_COVER_URL) {
                          event.currentTarget.src = FALLBACK_COVER_URL;
                        }
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-500/90 text-white">
                        Open Library
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[color:var(--text)] truncate">{book.title}</h3>
                    <p className="text-xs text-slate-500 mb-2">{book.authorName || 'Unknown Author'}</p>
                    <p className="text-[11px] text-slate-500">
                      {book.firstPublishYear ? `First published: ${book.firstPublishYear}` : 'Publish year unavailable'}
                    </p>
                    <button
                      onClick={() => navigate('/author/book-detail', { state: { book: toApiDetailBook(book) } })}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="size-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </MotionDiv>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyBooks;
