import React from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, Calendar, FileText, History, Search, SlidersHorizontal } from 'lucide-react';

const RESEARCH_NOTES_KEY = 'author_studio_research_notes';
const BOOKS_STORAGE_KEY = 'author_studio_books';
const RECENT_SEARCHES_KEY = 'author_studio_research_recent';

const FALLBACK_BOOKS = [
  {
    key: 'seed-book-1',
    title: 'The Writing Life',
    authorName: 'Annie Dillard',
    firstPublishYear: 1989,
    subject: 'Writing Craft',
    description: 'Reflection on the discipline, fear, and joy of writing.',
    source: 'seed',
  },
  {
    key: 'seed-book-2',
    title: 'Bird by Bird',
    authorName: 'Anne Lamott',
    firstPublishYear: 1994,
    subject: 'Creative Process',
    description: 'Practical advice for writers on structure, drafts, and revision.',
    source: 'seed',
  },
  {
    key: 'seed-book-3',
    title: 'Story',
    authorName: 'Robert McKee',
    firstPublishYear: 1997,
    subject: 'Story Structure',
    description: 'A guide to storytelling principles for fiction and screenwriting.',
    source: 'seed',
  },
  {
    key: 'seed-book-4',
    title: 'On Writing',
    authorName: 'Stephen King',
    firstPublishYear: 2000,
    subject: 'Memoir & Craft',
    description: 'Memoir and practical writing lessons from Stephen King.',
    source: 'seed',
  },
  {
    key: 'seed-book-5',
    title: 'Save the Cat!',
    authorName: 'Blake Snyder',
    firstPublishYear: 2005,
    subject: 'Plotting',
    description: 'Popular framework for beats, structure, and pacing.',
    source: 'seed',
  },
];

const normalize = (value) => String(value || '').toLowerCase();

const parseLocalBooks = () => {
  const raw = window.localStorage.getItem(BOOKS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((book) => ({
      key: `local-${book.id || book.title || Math.random()}`,
      title: book.title || 'Untitled',
      authorName: book.author || 'Unknown author',
      firstPublishYear: null,
      subject: book.genre || 'Local Manuscript',
      description: book.description || '',
      coverUrl: book.img || '',
      source: 'local',
    }));
  } catch {
    return [];
  }
};

const buildBookCorpus = () => {
  const combined = [...parseLocalBooks(), ...FALLBACK_BOOKS];
  const unique = new Map();
  combined.forEach((book) => {
    const id = `${normalize(book.title)}::${normalize(book.authorName)}`;
    if (!unique.has(id)) {
      unique.set(id, book);
    }
  });
  return Array.from(unique.values());
};

const getQueryFromUrl = (search) => {
  const params = new URLSearchParams(search || '');
  return params.get('q')?.trim() || '';
};

const getRecentSearches = () => {
  const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
};

export default function Research() {
  const location = useLocation();
  const [query, setQuery] = React.useState('');
  const [subjectFilter, setSubjectFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('relevance');
  const [selectedBook, setSelectedBook] = React.useState(null);
  const [notes, setNotes] = React.useState(() => window.localStorage.getItem(RESEARCH_NOTES_KEY) || '');
  const [recentSearches, setRecentSearches] = React.useState(() => getRecentSearches());
  const [bookCorpus, setBookCorpus] = React.useState(() => buildBookCorpus());

  React.useEffect(() => {
    window.localStorage.setItem(RESEARCH_NOTES_KEY, notes);
  }, [notes]);

  React.useEffect(() => {
    const syncBooks = () => setBookCorpus(buildBookCorpus());
    window.addEventListener('storage', syncBooks);
    return () => window.removeEventListener('storage', syncBooks);
  }, []);

  React.useEffect(() => {
    const q = getQueryFromUrl(location.search);
    if (q) {
      setQuery(q);
    }
  }, [location.search]);

  const subjects = React.useMemo(() => {
    const values = new Set();
    bookCorpus.forEach((book) => {
      if (book.subject) values.add(book.subject);
    });
    return ['all', ...Array.from(values).sort()];
  }, [bookCorpus]);

  const results = React.useMemo(() => {
    const needle = normalize(query.trim());
    const scored = bookCorpus
      .map((book) => {
        const haystackTitle = normalize(book.title);
        const haystackAuthor = normalize(book.authorName);
        const haystackSubject = normalize(book.subject);
        const haystackDescription = normalize(book.description);

        let score = 0;
        if (!needle) {
          score = 1;
        } else {
          if (haystackTitle.includes(needle)) score += 5;
          if (haystackAuthor.includes(needle)) score += 3;
          if (haystackSubject.includes(needle)) score += 2;
          if (haystackDescription.includes(needle)) score += 1;
        }

        return { book, score };
      })
      .filter(({ book, score }) => {
        if (score <= 0) return false;
        if (subjectFilter === 'all') return true;
        return normalize(book.subject) === normalize(subjectFilter);
      });

    if (sortBy === 'year_desc') {
      scored.sort((a, b) => (b.book.firstPublishYear || 0) - (a.book.firstPublishYear || 0));
    } else if (sortBy === 'year_asc') {
      scored.sort((a, b) => (a.book.firstPublishYear || 9999) - (b.book.firstPublishYear || 9999));
    } else if (sortBy === 'title_asc') {
      scored.sort((a, b) => String(a.book.title).localeCompare(String(b.book.title)));
    } else {
      scored.sort((a, b) => b.score - a.score);
    }

    return scored.map(({ book }) => book).slice(0, 24);
  }, [bookCorpus, query, sortBy, subjectFilter]);

  const selectBook = React.useCallback((book) => {
    setSelectedBook({
      ...book,
      firstPublishDate: book.firstPublishYear || '',
      description: book.description || 'No description available.',
    });
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((item) => normalize(item) !== normalize(trimmed))].slice(0, 6);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Book Research</h1>
        <p className="text-slate-400 mt-1">
          JavaScript-powered research from your local books and built-in references.
        </p>
      </div>

      <form onSubmit={submitSearch} className="bg-card-dark border border-white/5 rounded-2xl p-5 mb-8">
        <div className="flex flex-col lg:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, authors, topics..."
              className="w-full bg-primary/10 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="year_desc">Sort: Newest Year</option>
            <option value="year_asc">Sort: Oldest Year</option>
            <option value="title_asc">Sort: Title A-Z</option>
          </select>
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            Save Search
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <SlidersHorizontal className="size-4" />
            <span>{results.length} result(s)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 overflow-x-auto">
            <History className="size-4 shrink-0" />
            {recentSearches.length === 0 && <span>No recent searches</span>}
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="px-2 py-1 rounded-md border border-white/10 hover:border-accent/60 hover:text-[color:var(--text)] transition-colors whitespace-nowrap"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">Results</h2>

          {results.length === 0 && (
            <p className="text-sm text-slate-400">No books found. Try another keyword or filter.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {results.map((book) => (
              <div
                key={book.key || `${book.title}-${book.authorName}`}
                role="button"
                tabIndex={0}
                onClick={() => selectBook(book)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectBook(book);
                  }
                }}
                className={`bg-card-dark border rounded-2xl p-4 card-shadow cursor-pointer transition-colors ${
                  selectedBook?.key === book.key
                    ? 'border-accent/60'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex gap-4">
                  <img
                    src={book.coverUrl || 'https://picsum.photos/seed/local-research/160/240'}
                    alt={book.title}
                    className="w-20 h-28 rounded-lg object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{book.title}</h3>
                    <p className="text-xs text-slate-400 truncate">{book.authorName || 'Unknown author'}</p>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        {book.firstPublishYear ? `First published: ${book.firstPublishYear}` : 'Year unavailable'}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5" />
                        {book.subject || 'No subject'}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500/80">
                        Source: {book.source === 'local' ? 'Local Library' : 'Reference Set'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectBook(book)}
                      className="mt-3 text-xs font-bold text-accent hover:text-[color:var(--text)] transition-colors"
                    >
                      Inspect details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card-dark border border-white/5 rounded-2xl p-5 card-shadow">
            <h3 className="text-lg font-bold mb-3">Book Details</h3>
            {!selectedBook && (
              <p className="text-sm text-slate-400">Select a result to inspect details.</p>
            )}
            {selectedBook && (
              <div className="space-y-3">
                <h4 className="font-bold">{selectedBook.title || 'Untitled'}</h4>
                <p className="text-xs text-slate-500">
                  {selectedBook.firstPublishDate
                    ? `First publish date: ${selectedBook.firstPublishDate}`
                    : 'First publish date unavailable'}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedBook.description || 'No description available.'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-card-dark border border-white/5 rounded-2xl p-5 card-shadow">
            <h3 className="text-lg font-bold mb-3">Research Notes</h3>
            <div className="relative">
              <FileText className="absolute left-3 top-3 size-4 text-slate-500" />
              <textarea
                rows={10}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write findings, references, and ideas..."
                className="w-full bg-primary/10 border border-white/5 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Saved automatically in this browser.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
