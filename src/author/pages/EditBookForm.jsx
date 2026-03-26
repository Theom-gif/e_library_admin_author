import React from 'react';
import { ChevronRight, CloudUpload } from 'lucide-react';

export const EditBookForm = ({ book, onSave, onCancel, isSaving = false, isDeleting = false, errorMessage = '' }) => {
  const [formData, setFormData] = React.useState({
    ...book,
    tags: Array.isArray(book?.tags) ? book.tags : [],
  });
  const coverInputRef = React.useRef(null);

  const handleCoverImageSelected = (event) => {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverUrl: objectUrl, coverFile: file }));
    event.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto w-full rounded-2xl border border-white/10 bg-card-dark/40 p-6 md:p-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-6">
        <button onClick={onCancel} className="hover:text-primary transition-colors">My Books</button>
        <ChevronRight size={14} />
        <span className="app-text-primary">Edit Book</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight app-text-primary">Edit Book</h1>
        <p className="text-slate-300 mt-2">
          Update the details for <span className="text-primary font-semibold underline decoration-2 underline-offset-4">'{book.title}'</span>
        </p>
      </div>

      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <p className="text-base font-semibold app-text-primary mb-1">Book Cover</p>
            <p className="text-sm text-slate-400 mb-4">Upload a high-quality JPG or PNG.</p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => coverInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  coverInputRef.current?.click();
                }
              }}
              className="relative group cursor-pointer aspect-[3/4] w-full max-w-[240px] rounded-xl overflow-hidden bg-primary/20 border-2 border-dashed border-primary/30 flex items-center justify-center"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
                style={{ backgroundImage: `url('${formData.coverUrl}')` }}
              ></div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                <CloudUpload className="text-white" size={40} />
                <span className="text-white text-xs font-medium mt-2">Change Image</span>
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleCoverImageSelected}
              className="sr-only"
            />
          </div>

          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-semibold app-text-primary mb-2">Book Title</label>
              <input 
                className="w-full rounded-lg border border-slate-600/60 bg-slate-900/40 p-3 focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 placeholder:text-slate-500 outline-none transition-all" 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold app-text-primary mb-2">Description</label>
              <textarea 
                className="w-full rounded-lg border border-slate-600/60 bg-slate-900/40 p-3 focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 placeholder:text-slate-500 outline-none transition-all" 
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-10 border-t border-primary/10">
          <button 
            type="submit"
            disabled={isSaving || isDeleting}
            className={`px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all ${
              isSaving || isDeleting
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-primary text-on-primary shadow-primary/20 hover:brightness-110'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Book'}
          </button>
        </div>
        {errorMessage && (
          <p className="text-sm text-rose-400">{errorMessage}</p>
        )}
      </form>
    </div>
  );
};
export default EditBookForm;
