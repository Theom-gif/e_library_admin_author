import { useState, useEffect, useCallback } from "react";
import { Trash2, Edit2, Mail, CheckCircle } from "lucide-react";
import { apiClient } from "../../lib/apiClient";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";
import CreateAuthorForm from "./authors/CreateAuthorForm";

/**
 * Authors Page Component
 * 
 * Admin page to:
 * - Create new authors via the CreateAuthorForm
 * - View list of all authors
 * - Delete authors
 * - Resend invitation email to authors
 * - View author details (email, bio, profile image)
 */
export default function Authors() {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // State
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /**
   * Fetch all authors from API
   */
  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(
        `/admin/authors${searchQuery ? `?search=${searchQuery}` : ""}`
      );
      setAuthors(response?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("Failed to fetch authors"));
      console.error("Fetch authors error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, t]);

  // Fetch authors on mount and when search changes
  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  /**
   * Handle new author creation
   */
  const handleAuthorCreated = (newAuthor) => {
    setAuthors((prev) => [newAuthor, ...prev]);
    setShowForm(false);
  };

  /**
   * Delete author
   */
  const handleDeleteAuthor = async (authorId) => {
    setActionLoadingId(authorId);
    try {
      await apiClient.delete(`/admin/authors/${authorId}`);
      setAuthors((prev) => prev.filter((a) => a.id !== authorId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err?.response?.data?.message || t("Failed to delete author"));
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Resend invitation email to author
   */
  const handleResendInvite = async (authorId) => {
    setActionLoadingId(authorId);
    try {
      const response = await apiClient.post(
        `/admin/authors/${authorId}/resend-invitation`
      );
      if (response?.data?.success) {
        setError("");
        alert(t("Invitation email sent successfully"));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || t("Failed to resend invitation")
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {t("Authors Management")}
          </h1>
          <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {t("Create and manage platform authors")}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`mt-4 md:mt-0 px-6 py-2 rounded-lg font-medium transition-all ${
            isDark
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-purple-500 hover:bg-purple-600 text-white"
          }`}
        >
          {showForm ? t("Cancel") : t("Create Author")}
        </button>
      </div>

      {/* Create Form Section */}
      {showForm && (
        <div className={`p-6 rounded-lg border ${
          isDark
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}>
          <CreateAuthorForm onSuccess={handleAuthorCreated} />
        </div>
      )}

      {/* Authors List Section */}
      <div className={`rounded-lg border ${
        isDark
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}>
        {/* Search Bar */}
        <div className={`p-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search authors by name or email...")}
            className={`w-full px-4 py-2 rounded-lg border transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`p-4 border-b ${
            isDark
              ? "bg-red-900/20 border-red-700/50 text-red-300"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin">⚙️</div>
            <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {t("Loading authors...")}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && authors.length === 0 && (
          <div className="p-8 text-center">
            <p className={`text-lg font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {t("No authors found")}
            </p>
            <p className={`mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
              {t("Create a new author to get started")}
            </p>
          </div>
        )}

        {/* Authors Table */}
        {!loading && authors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${
                  isDark ? "border-gray-700 bg-gray-700/50" : "border-gray-200 bg-gray-50"
                }`}>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {t("Name")}
                  </th>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {t("Email")}
                  </th>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {t("Status")}
                  </th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {t("Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {authors.map((author) => (
                  <tr
                    key={author.id}
                    className={`border-b transition-colors hover:bg-gray-700/30 ${
                      isDark
                        ? "border-gray-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {/* Author Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {author.profile_image_url && (
                          <img
                            src={author.profile_image_url}
                            alt={author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                            {author.name}
                          </p>
                          {author.bio && (
                            <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                              {author.bio.substring(0, 50)}
                              {author.bio.length > 50 ? "..." : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className={`px-6 py-4 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {author.email}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        author.is_active
                          ? isDark
                            ? "bg-green-900/30 text-green-300"
                            : "bg-green-100 text-green-700"
                          : isDark
                            ? "bg-yellow-900/30 text-yellow-300"
                            : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {author.is_active ? (
                          <>
                            <CheckCircle size={14} />
                            {t("Active")}
                          </>
                        ) : (
                          <>
                            <Mail size={14} />
                            {t("Pending")}
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Resend Invitation */}
                        {!author.is_active && (
                          <button
                            onClick={() => handleResendInvite(author.id)}
                            disabled={actionLoadingId === author.id}
                            className={`p-2 rounded transition-colors ${
                              isDark
                                ? "hover:bg-gray-700 text-blue-400"
                                : "hover:bg-gray-100 text-blue-600"
                            } ${actionLoadingId === author.id ? "opacity-50" : ""}`}
                            title={t("Resend invitation")}
                          >
                            <Mail size={18} />
                          </button>
                        )}

                        {/* Delete Button */}
                        {deleteConfirm === author.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteAuthor(author.id)}
                              disabled={actionLoadingId === author.id}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                isDark
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-red-500 hover:bg-red-600 text-white"
                              } ${actionLoadingId === author.id ? "opacity-50" : ""}`}
                            >
                              {actionLoadingId === author.id ? t("Deleting...") : t("Confirm")}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                isDark
                                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                              }`}
                            >
                              {t("Cancel")}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(author.id)}
                            className={`p-2 rounded transition-colors ${
                              isDark
                                ? "hover:bg-gray-700 text-red-400"
                                : "hover:bg-gray-100 text-red-600"
                            }`}
                            title={t("Delete author")}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
