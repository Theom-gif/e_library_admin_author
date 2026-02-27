import React, { useRef, useState } from 'react';
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

const BOOKS_STORAGE_KEY = 'author_studio_books';

const UploadBook = () => {
  const MotionDiv = motion.div;
  const navigate = useNavigate();
  const coverInputRef = useRef(null);
  const manuscriptInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [manuscriptFile, setManuscriptFile] = useState(null);

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
    (step === 1 && title.trim() && genre && description.trim() && coverFile) ||
    (step === 2 && manuscriptFile) ||
    step === 3;

  const handleContinue = () => {
    if (!canContinue) return;
    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }
    const newBook = {
      id: Date.now(),
      title: title.trim(),
      author: 'Alex Rivera',
      status: 'Published',
      rating: 0,
      reads: '0',
      sales: '$0',
      img: coverPreviewUrl || 'https://picsum.photos/seed/new-book/300/450',
    };

    const existingRaw = window.localStorage.getItem(BOOKS_STORAGE_KEY);
    let existingBooks = [];
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        existingBooks = Array.isArray(parsed) ? parsed : [];
      } catch {
        existingBooks = [];
      }
    }

    window.localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify([newBook, ...existingBooks]));
    navigate('/my-books');
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
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  >
                    <option value="">Select a genre</option>
                    <option>Fantasy</option>
                    <option>Sci-Fi</option>
                    <option>Mystery</option>
                    <option>Romance</option>
                    <option>Thriller</option>
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
                  <div className="p-4 bg-primary/20 rounded-full text-accent">
                    <ImageIcon className="size-8" />
                  </div>
                  <div className="text-center px-6">
                    <p className="text-sm font-bold">Upload Cover</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {coverFile ? `Selected: ${coverFile.name}` : 'Drag/drop or click. JPG, PNG (Max 5MB)'}
                    </p>
                  </div>
                </div>
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
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{manuscriptFile ? `${manuscriptSize} • Ready to process` : 'Upload a file to continue'}</p>
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
                <img src="https://picsum.photos/seed/preview/300/450" alt="Cover Preview" className="w-full aspect-[2/3] rounded-xl object-cover border border-white/10 shadow-xl" />
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{title || 'Untitled Book'}</h2>
                  <p className="text-slate-400">{genre || 'Unknown Genre'} • {manuscriptSize}</p>
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
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ChevronLeft className="size-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
              canContinue ? 'bg-accent text-white shadow-glow hover:opacity-90' : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>{step === 3 ? 'Publish Book' : 'Continue'}</span>
            {step < 3 && <ChevronRight className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadBook;
