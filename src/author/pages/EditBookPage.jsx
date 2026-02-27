import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EditBookForm from './EditBookForm';

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

  const handleSave = (updatedBook) => {
    navigate('/my-books', { state: { updatedBook } });
  };

  const handleCancel = () => {
    navigate('/my-books');
  };

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete "${initialBook.title}"? This cannot be undone.`);
    if (!confirmed) return;
    navigate('/my-books', { state: { deletedBookId: initialBook.id } });
  };

  return (
    <div className="p-8">
      <EditBookForm book={initialBook} onSave={handleSave} onCancel={handleCancel} onDelete={handleDelete} />
    </div>
  );
};

export default EditBookPage;
