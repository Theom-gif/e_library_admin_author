import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EditBookForm from './EditBookForm';
import { deleteBookRequest, updateBookRequest } from '../services/bookService';

const fallbackBook = {
  id: 0,
  title: 'Untitled Book',
  author: 'Unknown Author',
  status: 'Draft',
  rating: 0,
  reads: '0',
  sales: '$0',
  coverUrl: 'https://picsum.photos/seed/fallback-edit-cover/400/600',
  description: 'Add your book description here.',
  category: 'Fantasy & Mystery',
  tags: ['new', 'draft'],
};

const EditBookPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state ?? null;
  const initialBook = state?.book ?? fallbackBook;
  const [submitError, setSubmitError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSave = async (updatedBook) => {
    if (!initialBook?.id) {
      setSubmitError('Book ID is missing. Please reopen this page from My Books.');
      return;
    }

    setSubmitError('');
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append('title', updatedBook.title || '');
      payload.append('author', updatedBook.author || '');
      payload.append('description', updatedBook.description || '');
      payload.append('category', updatedBook.category || updatedBook.genre || '');

      if (updatedBook.coverFile instanceof File) {
        payload.append('cover_image', updatedBook.coverFile);
        payload.append('cover', updatedBook.coverFile);
        payload.append('image', updatedBook.coverFile);
      }

      if (updatedBook.coverUrl && /^https?:\/\//i.test(updatedBook.coverUrl)) {
        payload.append('cover_image_url', updatedBook.coverUrl);
      }

      await updateBookRequest(initialBook.id, payload);
      navigate('/author/my-books', { state: { refresh: true } });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.errors ||
        error?.response?.data?.message ||
        'Unable to save changes.';
      setSubmitError(
        typeof apiMessage === 'string' ? apiMessage : 'Unable to save changes. Please check your input.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/author/my-books');
  };

  const handleDelete = async () => {
    if (!initialBook?.id) {
      setSubmitError('Book ID is missing. Please reopen this page from My Books.');
      return;
    }

    const confirmed = window.confirm(`Delete "${initialBook.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setSubmitError('');
    setIsDeleting(true);
    try {
      await deleteBookRequest(initialBook.id);
      navigate('/author/my-books', { state: { refresh: true, deletedBookId: initialBook.id } });
    } catch (error) {
      const apiMessage = error?.response?.data?.message || 'Unable to delete this book.';
      setSubmitError(apiMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <EditBookForm
        book={initialBook}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
        isSaving={isSaving}
        isDeleting={isDeleting}
        errorMessage={submitError}
      />
    </div>
  );
};

export default EditBookPage;
