import { apiClient } from "../../lib/apiClient";

const buildBooksPath = ({ status, search } = {}) => {
  const params = new URLSearchParams();
  const normalizedStatus = String(status || "").trim();
  const normalizedSearch = String(search || "").trim();

  if (normalizedStatus && normalizedStatus.toLowerCase() !== "all") {
    params.set("status", normalizedStatus);
  }
  if (normalizedSearch) {
    params.set("search", normalizedSearch);
  }

  const query = params.toString();
  return `/admin/books${query ? `?${query}` : ""}`;
};

export const fetchAdminBooks = (filters = {}, config = {}) =>
  apiClient.get(buildBooksPath(filters), config);

export const approveBook = (id, config = {}) =>
  apiClient.post(`/admin/books/${id}/approve`, null, config);

export const rejectBook = (id, config = {}) =>
  apiClient.post(`/admin/books/${id}/reject`, null, config);

export const getPendingBooks = (config = {}) =>
  fetchAdminBooks({ status: "Pending" }, config);
