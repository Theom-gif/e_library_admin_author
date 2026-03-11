import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Info,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { searchAuthors, searchBooks } from '../services/openLibraryService';
import { uploadBookRequest } from '../services/bookService';
import { saveManuscriptFile } from '../services/manuscriptStorage';
import { extractApiErrorMessage } from '../../lib/apiError';

const PROFILE_STORAGE_KEY = 'author_studio_profile';
const GENRE_OPTIONS = ['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Thriller'];
const NATIVE_OPTION_STYLE = { color: '#0f172a', backgroundColor: '#ffffff' };
const FALLBACK_COVER_URL = 'https://picsum.photos/seed/new-book/300/450';

const mapOpenLibrarySubjectToGenre = (subject = '') => {
  const normalized = subject.toLowerCase();
  if (normalized.includes('science') || normalized.includes('sci-fi')) return 'Sci-Fi';
  if (normalized.includes('fantasy')) return 'Fantasy';
  if (normalized.includes('mystery') || normalized.includes('crime')) return 'Mystery';
  if (normalized.includes('romance') || normalized.includes('love')) return 'Romance';
  if (normalized.includes('thriller') || normalized.includes('suspense')) return 'Thriller';
  return '';
};

const isValidCoverUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  const trimmed = value.trim();
  return trimmed.startsWith('data:image/') || /^https?:\/\//i.test(trimmed);
};

const UploadBook = () => {
  const MotionDiv = motion.div;
  const navigate = useNavigate();
  const coverInputRef = useRef(null);
  const manuscriptInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [bookError, setBookError] = useState('');
  const [showBookResults, setShowBookResults] = useState(false);
  const [authorQuery, setAuthorQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [authorResults, setAuthorResults] = useState([]);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(false);
  const [authorError, setAuthorError] = useState('');
  const [showAuthorResults, setShowAuthorResults] = useState(false);
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [coverError, setCoverError] = useState('');
  const [manuscriptFile, setManuscriptFile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const defaultAuthor = 'Alex Rivera';
    const profileRaw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!profileRaw) {
      setAuthorQuery(defaultAuthor);
      return;
    }

    try {
      const profile = JSON.parse(profileRaw);
      setAuthorQuery(profile?.fullName?.trim() || defaultAuthor);
    } catch {
      setAuthorQuery(defaultAuthor);
    }
  }, []);

  useEffect(() => {
    const query = bookQuery.trim();
    if (!query || title.trim() === query) {
      setBookResults([]);
      setBookError('');
      return;
    }

    const controller = new AbortController();
    const timerId = window.setTimeout(async () => {
      setIsLoadingBooks(true);
      setBookError('');
      try {
        const results = await searchBooks(query, {
          limit: 6,
          signal: controller.signal,
        });
        setBookResults(results);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setBookError('Unable to load books from Open Library.');
          setBookResults([]);
        }
      } finally {
        setIsLoadingBooks(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timerId);
    };
  }, [bookQuery, title]);

  useEffect(() => {
    const query = authorQuery.trim();
    if (!query || selectedAuthor?.name === query) {
      setAuthorResults([]);
      setAuthorError('');
      return;
    }

    const controller = new AbortController();
    const timerId = window.setTimeout(async () => {
      setIsLoadingAuthors(true);
      setAuthorError('');
      try {
        const results = await searchAuthors(query, {
          limit: 6,
          signal: controller.signal,
        });
        setAuthorResults(results);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setAuthorError('Unable to load authors from Open Library.');
          setAuthorResults([]);
        }
      } finally {
        setIsLoadingAuthors(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timerId);
    };
  }, [authorQuery, selectedAuthor]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleCoverSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
      setCoverError('Please choose a valid image file.');
      e.target.value = '';
      return;
    }
    setCoverError('');
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManuscriptSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setManuscriptFile(file);
    e.target.value = '';
  };

  const canContinue =
    (step === 1 && title.trim() && authorQuery.trim() && genre && description.trim() && (coverFile || coverPreviewUrl)) ||
    (step === 2 && manuscriptFile) ||
    step === 3;

  const getStepValidationError = () => {
    if (step === 1) {
      if (!title.trim()) return 'Please enter a book title.';
      if (!authorQuery.trim()) return 'Please enter an author name.';
      if (!genre) return 'Please select a genre.';
      if (!description.trim()) return 'Please enter a description.';
      if (!coverFile && !coverPreviewUrl) return 'Please upload a cover image.';
    }

    if (step === 2 && !manuscriptFile) {
      return 'Please upload a manuscript file before continuing.';
    }

    return '';
  };

  const handleContinue = async () => {
    const validationError = getStepValidationError();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    if (step < 3) {
      setSubmitError('');
      setStep((prev) => prev + 1);
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', title.trim());
      payload.append('author', selectedAuthor?.name || authorQuery.trim());
      payload.append('category', genre.trim());
      payload.append('description', description.trim());

      if (manuscriptFile instanceof File) {
        payload.append('book_file', manuscriptFile);
      }

      if (coverFile instanceof File) {
        payload.append('cover_image', coverFile);
      } else if (coverPreviewUrl) {
        payload.append('cover_image_url', coverPreviewUrl);
      }

      const response = await uploadBookRequest(payload);
      const uploaded =
        response?.data?.data ||
        response?.data?.book ||
        response?.data ||
        null;
      const uploadedId =
        uploaded?.id ||
        uploaded?.book_id ||
        uploaded?.bookId ||
        null;

      if (uploadedId && manuscriptFile instanceof File) {
        try {
          await saveManuscriptFile(uploadedId, manuscriptFile);
        } catch {
          // Keep upload success even if IndexedDB storage fails.
        }
      }
      navigate('/author/my-books');
    } catch (error) {
      setSubmitError(
        extractApiErrorMessage(error, 'Unable to upload book. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const manuscriptSize = manuscriptFile
    ? `${(manuscriptFile.size / (1024 * 1024)).toFixed(1)} MB`
    : 'No manuscript';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Upload New Book</h1>
        <p className="text-slate-400 mt-1">Follow the steps to publish your book.</p>
      </div>

      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step >= i ? 'bg-accent text-white shadow-glow' : 'bg-card-dark border border-white/10 text-slate-500'
              }`}
            >
              {step > i ? <CheckCircle2 className="size-5" /> : i}
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${step >= i ? 'text-accent' : 'text-slate-500'}`}>
              {i === 1 ? 'Details' : i === 2 ? 'Content' : 'Review'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-card-dark border border-white/5 rounded-2xl p-8 card-shadow">
        {step === 1 && (
          <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Book Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The Chronicles of Inkwell"
                    className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Find Book (Open Library)</label>
                  <input
                    type="text"
                    value={bookQuery}
                    onFocus={() => setShowBookResults(true)}
                    onBlur={() => {
                      window.setTimeout(() => setShowBookResults(false), 150);
                    }}
                    onChange={(e) => {
                      setBookQuery(e.target.value);
                      setShowBookResults(true);
                    }}
                    placeholder="Search title and import details"
                    className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                  {showBookResults && (bookResults.length > 0 || isLoadingBooks || bookError) && (
                    <div className="absolute top-full mt-2 w-full z-20 bg-card-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {isLoadingBooks && (
                        <p className="px-4 py-3 text-xs text-slate-400">Searching books...</p>
                      )}
                      {!isLoadingBooks && bookError && (
                        <p className="px-4 py-3 text-xs text-rose-400">{bookError}</p>
                      )}
                      {!isLoadingBooks &&
                        !bookError &&
                        bookResults.map((book) => (
                          <button
                            key={book.key || `${book.title}-${book.authorName}`}
                            type="button"
                            onClick={() => {
                              setTitle(book.title || '');
                              setBookQuery(book.title || '');
                              if (book.authorName) {
                                setAuthorQuery(book.authorName);
                                setSelectedAuthor(null);
                              }
                              if (book.subject && !genre) {
                                const mappedGenre = mapOpenLibrarySubjectToGenre(book.subject);
                                if (mappedGenre) {
                                  setGenre(mappedGenre);
                                }
                              }
                              if (!description.trim()) {
                                const publish = book.firstPublishYear ? `First published: ${book.firstPublishYear}.` : '';
                                const summary = [book.title, book.authorName].filter(Boolean).join(' by ');
                                setDescription([summary, publish].filter(Boolean).join(' '));
                              }
                              if (book.coverUrl) {
                                setCoverPreviewUrl(book.coverUrl);
                                setCoverFile({
                                  name: 'Open Library cover',
                                });
                                setCoverError('');
                              }
                              setShowBookResults(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-primary/20 transition-colors border-b border-white/5 last:border-b-0"
                          >
                            <p className="text-sm font-semibold">{book.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {book.authorName || 'Unknown author'}
                              {book.firstPublishYear ? ` | ${book.firstPublishYear}` : ''}
                            </p>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Author</label>
                  <input
                    type="text"
                    value={authorQuery}
                    onFocus={() => setShowAuthorResults(true)}
                    onBlur={() => {
                      window.setTimeout(() => setShowAuthorResults(false), 150);
                    }}
                    onChange={(e) => {
                      setAuthorQuery(e.target.value);
                      setSelectedAuthor(null);
                      setShowAuthorResults(true);
                    }}
                    placeholder="Search author from Open Library"
                    className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  />

                  {showAuthorResults && (authorResults.length > 0 || isLoadingAuthors || authorError) && (
                    <div className="absolute top-full mt-2 w-full z-20 bg-card-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {isLoadingAuthors && (
                        <p className="px-4 py-3 text-xs text-slate-400">Searching authors...</p>
                      )}
                      {!isLoadingAuthors && authorError && (
                        <p className="px-4 py-3 text-xs text-rose-400">{authorError}</p>
                      )}
                      {!isLoadingAuthors &&
                        !authorError &&
                        authorResults.map((author) => (
                          <button
                            key={author.key || author.name}
                            type="button"
                            onClick={() => {
                              setSelectedAuthor(author);
                              setAuthorQuery(author.name);
                              setShowAuthorResults(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-primary/20 transition-colors border-b border-white/5 last:border-b-0"
                          >
                            <p className="text-sm font-semibold">{author.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {author.topWork ? `Top work: ${author.topWork}` : 'Open Library author'}
                              {author.workCount ? ` | Works: ${author.workCount}` : ''}
                            </p>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  >
                    <option value="" style={NATIVE_OPTION_STYLE}>Select a genre</option>
                    {GENRE_OPTIONS.map((option) => (
                      <option key={option} style={NATIVE_OPTION_STYLE}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a compelling summary..."
                    className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cover Image</label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => coverInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      coverInputRef.current?.click();
                    }
                  }}
                  className={`aspect-[2/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
                    dragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                >
                  {coverPreviewUrl ? (
                    <img
                      src={coverPreviewUrl}
                      alt="Selected cover preview"
                      className="w-full h-full rounded-2xl object-cover"
                      onError={() => {
                        setCoverPreviewUrl('');
                        setCoverError('Cover preview could not be displayed.');
                      }}
                    />
                  ) : (
                    <>
                      <div className="p-4 bg-primary/20 rounded-full text-accent">
                        <ImageIcon className="size-8" />
                      </div>
                      <div className="text-center px-6">
                        <p className="text-sm font-bold">Upload Cover</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {coverFile ? `Selected: ${coverFile.name}` : 'Drag/drop or click. JPG, PNG (Max 5MB)'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {coverError && <p className="text-xs text-rose-400">{coverError}</p>}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleCoverSelected}
                  className="sr-only"
                />
              </div>
            </div>
          </MotionDiv>
        )}

        {step === 2 && (
          <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div
              role="button"
              tabIndex={0}
              onClick={() => manuscriptInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  manuscriptInputRef.current?.click();
                }
              }}
              className={`h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
                dragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
            >
              <div className="p-4 bg-primary/20 rounded-full text-accent">
                <Upload className="size-8" />
              </div>
              <div className="text-center px-6">
                <p className="text-lg font-bold">Upload Manuscript</p>
                <p className="text-sm text-slate-500 mt-1">Support for PDF, EPUB, DOCX (Max 50MB)</p>
              </div>
            </div>
            <input
              ref={manuscriptInputRef}
              type="file"
              accept=".pdf,.epub,.docx"
              onChange={handleManuscriptSelected}
              className="sr-only"
            />

            <div className="bg-primary/5 rounded-xl p-6 border border-white/5">
              <div className="flex gap-4">
                <div className="p-2 bg-accent/20 rounded-lg text-accent h-fit">
                  <Info className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1">Formatting Tips</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use clear chapter headings and consistent styles for best results.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold">Uploaded Files</h4>
              <div className="flex items-center justify-between p-4 bg-card-dark border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">{manuscriptFile?.name ?? 'No manuscript selected'}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">
                      {manuscriptFile ? `${manuscriptSize} | Ready to process` : 'Upload a file to continue'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setManuscriptFile(null)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </MotionDiv>
        )}

        {step === 3 && (
          <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex gap-8">
              <div className="w-40 flex-shrink-0">
                <img
                  src={coverPreviewUrl || 'https://picsum.photos/seed/preview/300/450'}
                  alt="Cover Preview"
                  className="w-full aspect-[2/3] rounded-xl object-cover border border-white/10 shadow-xl"
                />
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{title || 'Untitled Book'}</h2>
                  <p className="text-slate-400">
                    {authorQuery || 'Unknown Author'} | {genre || 'Unknown Genre'} | {manuscriptSize}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Summary</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{description || 'No summary provided yet.'}</p>
                </div>
              </div>
            </div>
          </MotionDiv>
        )}

        <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-[color:var(--text)] hover:bg-white/5'
            }`}
          >
            <ChevronLeft className="size-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleContinue}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
              !isSubmitting && canContinue
                ? 'bg-accent text-white shadow-glow hover:opacity-90'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>{isSubmitting ? 'Publishing...' : step === 3 ? 'Publish Book' : 'Continue'}</span>
            {step < 3 && <ChevronRight className="size-4" />}
          </button>
        </div>
        {submitError && (
          <p className="mt-4 text-sm text-rose-400">{submitError}</p>
        )}
      </div>
    </div>
  );
};

export default UploadBook;
