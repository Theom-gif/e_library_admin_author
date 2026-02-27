import React from 'react';
import { ChevronRight, CloudUpload, X, Plus } from 'lucide-react';

export const EditBookForm = ({ book, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = React.useState(book);
  const [newTag, setNewTag] = React.useState('');
  const coverInputRef = React.useRef(null);

  const handleStatusChange = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) {
      return;
    }

    setFormData((prev) => {
      if (prev.tags.includes(tag)) {
        return prev;
      }

      return {
        ...prev,
        tags: [...prev.tags, tag],
      };
    });
    setNewTag('');
  };

  const handleTagInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  };

  const handleCoverImageSelected = (event) => {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverUrl: objectUrl }));
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

      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-primary/10">
          <div>
            <label className="block text-sm font-semibold app-text-primary mb-2">Category</label>
            <select 
              className="w-full rounded-lg border border-slate-600/60 bg-slate-900/40 p-3 focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 outline-none transition-all"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="Fantasy & Mystery">Fantasy & Mystery</option>
              <option value="Sci-Fi">Science Fiction</option>
              <option value="Horror">Horror</option>
              <option value="Romance">Romance</option>
              <option value="Non-fiction">Non-fiction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold app-text-primary mb-2">Release Status</label>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => handleStatusChange('Published')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-bold text-sm ${
                  formData.status === 'Published' 
                    ? 'border-primary bg-primary/20 text-slate-100' 
                    : 'border-primary/20 text-slate-300'
                }`}
              >
                Published
              </button>
              <button 
                type="button"
                onClick={() => handleStatusChange('Draft')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-bold text-sm ${
                  formData.status === 'Draft' 
                    ? 'border-primary bg-primary/20 text-slate-100' 
                    : 'border-primary/20 text-slate-300'
                }`}
              >
                Draft
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-primary/10">
          <label className="block text-sm font-semibold app-text-primary mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-slate-100 text-xs font-medium">
                {tag} 
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-500">
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={addTag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-xs font-medium hover:brightness-110"
            >
              <Plus size={12} /> Add Tag
            </button>
          </div>
          <input 
            className="w-full rounded-lg border border-slate-600/60 bg-slate-900/40 p-3 focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 placeholder:text-slate-500 outline-none transition-all" 
            placeholder="Type a tag and press enter..." 
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-10 border-t border-primary/10">
          <button
            type="button"
            onClick={onDelete}
            disabled={!onDelete}
            className={`px-6 py-2.5 rounded-lg font-bold transition-colors ${
              onDelete ? 'text-rose-500 hover:bg-rose-500/10' : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            Delete Book
          </button>
          <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-slate-500 font-bold hover:bg-primary/5 transition-colors"
          >
            Discard Changes
          </button>
          <button 
            type="submit"
            className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
          >
            Save Book
          </button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default EditBookForm;
