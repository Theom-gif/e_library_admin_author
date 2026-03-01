import { apiClient } from "../apiClient";

export const approveBook = (id) =>
  apiClient.post(`/admin/books/${id}/approve`);

export const rejectBook = (id) =>
  apiClient.post(`/admin/books/${id}/reject`);

export const getPendingBooks = () =>
  apiClient.get(`/admin/books/pending`);