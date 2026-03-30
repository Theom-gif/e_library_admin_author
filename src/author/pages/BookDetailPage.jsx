import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpenText, CalendarDays, UserRound } from 'lucide-react';
import { getWorkDetails } from '../services/openLibraryService';
import { getManuscriptFile } from '../services/manuscriptStorage';
import { apiClient, API_BASE_URL } from '../../lib/apiClient';

const fallbackBook = {
  title: 'Unknown Book',
  author: 'Unknown Author',
  coverUrl: 'https://picsum.photos/seed/book-detail-fallback/400/600',
  description: 'No description available.',
  source: 'local',
};

const statusBadgeClass = (status) => {
  const key = String(status || '').toLowerCase();
  if (key === 'approved') return 'bg-emerald-500/90 text-white';
  if (key === 'pending') return 'bg-amber-500/90 text-white';
  if (key === 'rejected') return 'bg-rose-500/90 text-white';
  return 'bg-slate-500/90 text-white';
};

const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(String(value));
const isRootRelativeUrl = (value = '') => /^\//.test(String(value || '').trim());

// Covers are served from the site root (e.g., https://elibrary.pncproject.site/storage/...)
// while API calls use /api. Strip any /api suffix from the base to build correct asset URLs.
const stripApiSuffix = (value = '') => String(value || '').replace(/\/api(?:\/.*)?$/i, '');
const assetBaseUrl = stripApiSuffix(API_BASE_URL).replace(/\/+$/, '');
const apiBaseUrl = API_BASE_URL.replace(/\/+$/, '');

const buildStorageUrl = (path = '') => {
  if (!path) return '';
  if (isAbsoluteUrl(path) || path.startsWith('data:image/')) return path;
  if (isRootRelativeUrl(path)) return `${assetBaseUrl}${path}`;
  
  let clean = String(path).replace(/\\/g, '/').replace(/^\/+/, '');
  
  // 🔥 FIX: remove wrong prefixes from backend
  clean = clean.replace(/^storage\/app\/public\//, '');
  clean = clean.replace(/^public\//, '');

  if (/^api\//i.test(clean)) {
    return `${assetBaseUrl}/${clean}`;
  }

  if (/^auth\//i.test(clean)) {
    return `${apiBaseUrl}/${clean}`;
  }
  
  if (clean.startsWith('storage/')) {
    clean = clean.slice('storage/'.length);
  }
  
  return `${assetBaseUrl}/storage/${clean}`;
};

const getSafeCoverUrl = (value) => {
  const text = String(value || '').trim();
  return buildStorageUrl(text) || fallbackBook.coverUrl;
};

const looksLikePdf = (value = '') => /\.pdf(\?|$)/i.test(String(value || '').trim());

const dedupeList = (values = []) => {
  const seen = new Set();
  return values.filter((value) => {
    const key = String(value || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildManuscriptCandidates = (book = {}) => {
  const directCandidates = [
    book.manuscriptUrl,
    book.rawBookFileUrl,
    book.rawBookFilePath,
    book.rawPdfPath,
    book.rawFile,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .map((value) => {
      if (isAbsoluteUrl(value) || isRootRelativeUrl(value)) return value;
      if (/^(?:api|auth)\//i.test(value)) return value;
      return buildStorageUrl(value);
    });

  const id = String(book.id || '').trim();
  const apiCandidates = id
    ? [
        `/auth/books/${id}/file`,
        `/auth/books/${id}/download`,
        `/books/${id}/file`,
        `/books/${id}/download`,
      ]
    : [];

  return dedupeList([...directCandidates, ...apiCandidates]);
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

const BookDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const book = location.state?.book ?? fallbackBook;

  const [workDetails, setWorkDetails] = React.useState(null);
  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const [detailError, setDetailError] = React.useState('');
  const [pdfUrl, setPdfUrl] = React.useState('');
  const [loadingPdf, setLoadingPdf] = React.useState(false);
  const [pdfError, setPdfError] = React.useState('');
  const pdfObjectUrlRef = React.useRef('');

  React.useEffect(() => {
    if (book.source !== 'openlibrary' || !book.key) return;

    const controller = new AbortController();
    const loadDetails = async () => {
      setLoadingDetails(true);
      setDetailError('');
      try {
        const details = await getWorkDetails(book.key, { signal: controller.signal });
        setWorkDetails(details);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setDetailError('Could not load full book details from Open Library.');
        }
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
    return () => controller.abort();
  }, [book.key, book.source]);

  React.useEffect(() => {
    if (pdfObjectUrlRef.current) {
      URL.revokeObjectURL(pdfObjectUrlRef.current);
      pdfObjectUrlRef.current = '';
    }

    const manuscriptCandidates = buildManuscriptCandidates(book);
    if (manuscriptCandidates.length > 0) {
      const controller = new AbortController();

      const loadRemotePdf = async () => {
        setLoadingPdf(true);
        setPdfError('');
        setPdfUrl('');

        try {
          let lastStatus = 0;

          for (const candidate of manuscriptCandidates) {
            try {
              const response = await apiClient.get(candidate, {
                responseType: 'blob',
                signal: controller.signal,
              });
              const fileBlob = response?.data;
              const contentType = String(fileBlob?.type || response?.headers?.['content-type'] || '').toLowerCase();
              const isPdfBlob = contentType.includes('pdf') || looksLikePdf(candidate) || looksLikePdf(book.manuscriptName);

              if (!isPdfBlob) {
                continue;
              }

              const objectUrl = URL.createObjectURL(fileBlob);
              pdfObjectUrlRef.current = objectUrl;
              setPdfUrl(objectUrl);
              return;
            } catch (error) {
              if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
                return;
              }

              lastStatus = error?.response?.status || lastStatus;
            }
          }

          if (lastStatus === 403) {
            setPdfError('This PDF file is protected by the backend and could not be opened with your current file URL.');
          } else if (lastStatus === 404) {
            setPdfError('The PDF file could not be found on the server.');
          } else {
            setPdfError('Could not load uploaded PDF file.');
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoadingPdf(false);
          }
        }
      };

      loadRemotePdf();

      return () => {
        controller.abort();
        setPdfUrl('');
        if (pdfObjectUrlRef.current) {
          URL.revokeObjectURL(pdfObjectUrlRef.current);
          pdfObjectUrlRef.current = '';
        }
      };
    }

    if (book.source !== 'local' || !book.id) return undefined;

    const loadPdf = async () => {
      setLoadingPdf(true);
      setPdfError('');
      try {
        const file = await getManuscriptFile(book.id);
        if (!file) {
          setLoadingPdf(false);
          return;
        }

        const isPdfFile =
          file.type === 'application/pdf' ||
          file.name?.toLowerCase().endsWith('.pdf');

        if (!isPdfFile) {
          setPdfError('Uploaded manuscript is not a PDF. Preview is available for PDF only.');
          setLoadingPdf(false);
          return;
        }

        const objectUrl = URL.createObjectURL(file);
        pdfObjectUrlRef.current = objectUrl;
        setPdfUrl(objectUrl);
      } catch {
        setPdfError('Could not load uploaded PDF file.');
      } finally {
        setLoadingPdf(false);
      }
    };

    loadPdf();

    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = '';
      }
      setPdfUrl('');
    };
  }, [
    book.id,
    book.manuscriptUrl,
    book.rawBookFilePath,
    book.rawBookFileUrl,
    book.rawFile,
    book.rawPdfPath,
    book.source,
  ]);

  const effectiveDescription =
    workDetails?.description ||
    book.description ||
    'No description available.';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/author/my-books')}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
      >
        <ArrowLeft className="size-4" />
        <span>Back to My Books</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        <div className="bg-card-dark rounded-2xl border border-white/5 p-4">
          <img
            src={getSafeCoverUrl(
              book.cover_view_url ||
                book.cover_api_url ||
                book.coverUrl ||
                book.cover ||
                book.cover_image_url ||
                book.cover_image_path ||
                book.img
            )}
            alt={book.title}
            className="w-full aspect-[2/3] object-cover rounded-xl border border-white/10"
            onError={(event) => {
              if (event.currentTarget.src !== fallbackBook.coverUrl) {
                event.currentTarget.src = fallbackBook.coverUrl;
              }
            }}
          />
        </div>

        <div className="bg-card-dark rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-sky-500/90 text-white">
              {book.source === 'openlibrary' ? 'Open Library' : 'My Library'}
            </span>
            {book.status && (
              <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${statusBadgeClass(book.status)}`}>
                {book.status}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">{workDetails?.title || book.title}</h1>

          <div className="space-y-2 text-sm text-slate-300 mb-6">
            <p className="flex items-center gap-2"><UserRound className="size-4 text-slate-400" /> {book.author || book.authorName || 'Unknown Author'}</p>
            {(book.firstPublishYear || workDetails?.firstPublishDate) && (
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-slate-400" />
                {book.firstPublishYear || workDetails?.firstPublishDate}
              </p>
            )}
            {book.key && (
              <a
                href={`https://openlibrary.org${book.key}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:underline"
              >
                <BookOpenText className="size-4" />
                View on Open Library
              </a>
            )}
            {book.genre && (
              <p className="text-slate-300">Genre: {book.genre}</p>
            )}
            {book.manuscriptName && (
              <p className="text-slate-300">File: {book.manuscriptName}</p>
            )}
            {(book.manuscriptType || book.manuscriptSizeBytes) && (
              <p className="text-slate-300">
                Format: {book.manuscriptType || 'application/pdf'}
                {book.manuscriptSizeBytes ? ` | ${formatFileSize(book.manuscriptSizeBytes)}` : ''}
              </p>
            )}
          </div>

          {loadingDetails && <p className="text-sm text-slate-400 mb-4">Loading more details...</p>}
          {detailError && <p className="text-sm text-rose-400 mb-4">{detailError}</p>}

          <div>
            <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-2">Description</h2>
            <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-line">{effectiveDescription}</p>
          </div>
        </div>
      </div>

      {(book.source === 'local' || book.source === 'database') && (
        <div className="mt-8 bg-card-dark rounded-2xl border border-white/5 p-6">
          <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3">PDF Reader</h2>
          {loadingPdf && <p className="text-sm text-slate-400">Loading PDF...</p>}
          {!loadingPdf && pdfError && <p className="text-sm text-rose-400">{pdfError}</p>}
          {!loadingPdf && !pdfError && !pdfUrl && (
            <p className="text-sm text-slate-400">No readable PDF found for this book.</p>
          )}
          {!loadingPdf && pdfUrl && (
            <div className="space-y-3">
              <iframe
                title={`PDF reader for ${book.title}`}
                src={pdfUrl}
                className="w-full h-[70vh] rounded-xl border border-white/10 bg-black/20"
              />
              <a
                href={pdfUrl}
                download={book.manuscriptName || `${book.title}.pdf`}
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
              >
                Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookDetailPage;
