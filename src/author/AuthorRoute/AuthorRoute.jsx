/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../auth/ProtectedRoute';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import MyBooks from '../pages/MyBooks';
import UploadBook from '../pages/UploadBook';
import Profile from '../pages/Profile';
import Settings from '../pages/Setting';
import Feedback from '../pages/Feedback';
import EditBookPage from '../pages/EditBookPage';
import BookDetailPage from '../pages/BookDetailPage';
import Research from '../pages/Research';
import Analytics from '../pages/Analytics';

export default function App() {
  return (
    <Routes>
      <Route
        path="/author"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="my-books" element={<MyBooks />} />
        <Route path="upload" element={<UploadBook />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="research" element={<Research />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="edit-book" element={<EditBookPage />} />
        <Route path="book-detail" element={<BookDetailPage />} />
      </Route>
    </Routes>
  );
}
