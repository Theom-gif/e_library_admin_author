import { useState, useEffect, useCallback } from "react";
import { Trash2, Edit2, Mail, CheckCircle, UserRound, Search } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";
import { cn } from "../../lib/utils";
import { API_BASE_URL } from "../../lib/apiClient";
import CreateAuthorForm from "../components/authors/CreateAuthorForm";
import {
  fetchAuthors,
  fetchAuthorUsers,
  deleteAuthor,
  resendAuthorInvitation,
} from "../services/authorService";

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
   * Fetch authors with Author role from users list
   */
  const fetchAuthorsData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAuthorUsers({ search: searchQuery });
      setAuthors(result.data || []);
    } catch (err) {
      setError(err?.message || t("Failed to fetch authors"));
      console.error("Fetch authors error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, t]);

  // Fetch authors on mount and when search changes
  useEffect(() => {
    fetchAuthorsData();
  }, [fetchAuthorsData]);

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
      await deleteAuthor(authorId);
      setAuthors((prev) => prev.filter((a) => a.id !== authorId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err?.message || t("Failed to delete author"));
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
      const response = await resendAuthorInvitation(authorId);
      if (response?.success) {
        setError("");
        alert(t("Invitation email sent successfully"));
      }
    } catch (err) {
      setError(err?.message || t("Failed to resend invitation"));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className={cn("rounded-lg border overflow-hidden", isDark ? "bg-slate-800 border-white/5" : "bg-white border-slate-200")}>
      {/* Search Bar */}
      <div className={cn("p-6 flex gap-4", isDark ? "border-white/5" : "border-slate-200")}>
        <div className="relative flex-1">
          <Search size={16} className={cn("absolute left-3 top-2.5", isDark ? "text-slate-400" : "text-slate-400")} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search authors...")}
            className={cn("w-full pl-8 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:border-purple-500", 
              isDark 
                ? "bg-white/5 border-white/10 text-white placeholder-slate-500" 
                : "bg-white border-slate-300 text-slate-900 placeholder-slate-500"
            )}
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn("px-6 py-2 rounded-lg font-medium transition-all", 
            isDark
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-purple-500 hover:bg-purple-600 text-white"
          )}
        >
          {showForm ? t("Cancel") : t("Create Author")}
        </button>
      </div>

      {/* Create Form Section */}
      {showForm && (
        <div className={cn("p-6 border-t", isDark ? "border-white/5 bg-slate-800/50" : "border-slate-200 bg-slate-50")}>
          <CreateAuthorForm onSuccess={handleAuthorCreated} />
        </div>
      )}

      {/* Table Section */}
      <div className={cn("overflow-x-auto", isDark ? "border-t border-white/5" : "border-t border-slate-200")}>
        <table className="w-full text-left">
          <thead>
            <tr className={cn("text-xs", isDark ? "text-slate-400 border-white/5 bg-white/5" : "text-slate-600 border-slate-200")}>
              <th className="px-6 py-4">{t("Profile")}</th>
              <th className="px-6 py-4">{t("Email")}</th>
              <th className="px-6 py-4">{t("Status")}</th>
              <th className="px-6 py-4 text-right">{t("Action")}</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y", isDark ? "divide-white/5" : "divide-slate-200")}>
            {error && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-red-400 text-sm">{error}</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="4" className={cn("text-center py-8 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                  <div className="inline-block animate-spin">⚙️</div>
                  <p className="mt-2">{t("Loading authors...")}</p>
                </td>
              </tr>
            )}
            {!loading && authors.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8">
                  <p className={cn("text-lg font-medium", isDark ? "text-gray-300" : "text-gray-700")}>{t("No authors found")}</p>
                  <p className={cn("mt-1", isDark ? "text-gray-500" : "text-gray-600")}>{t("Create a new author to get started")}</p>
                </td>
              </tr>
            )}
            {!loading && authors.map((author) => (
              <tr key={author.id} className={cn("transition", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                {/* Profile */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {author.profile_image_url ? (
                      <img 
                        src={author.profile_image_url} 
                        alt={author.name}
                        className={cn("w-10 h-10 rounded-full object-cover border", isDark ? "border-white/10" : "border-slate-200")}
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-purple-500/20" : "bg-purple-100")}>
                        <UserRound size={18} className={isDark ? "text-purple-400" : "text-purple-600"} />
                      </div>
                    )}
                    <div>
                      <div className={cn("font-semibold text-sm", isDark ? "text-white" : "text-slate-900")}>{author.name}</div>
                      {author.bio && (
                        <div className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-500")}>
                          {author.bio.substring(0, 40)}
                          {author.bio.length > 40 ? "..." : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* Email */}
                <td className={cn("px-6 py-4 text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                  {author.email}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", 
                    author.is_active
                      ? isDark 
                        ? "bg-emerald-500/20 text-emerald-300" 
                        : "bg-emerald-100 text-emerald-700"
                      : isDark
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-yellow-100 text-yellow-700"
                  )}>
                    {author.is_active ? t("Active") : t("Pending")}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!author.is_active && (
                      <button
                        onClick={() => handleResendInvite(author.id)}
                        disabled={actionLoadingId === author.id}
                        className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50",
                          isDark
                            ? "text-blue-300 hover:bg-blue-500/20 border border-blue-400/30 bg-blue-500/10"
                            : "text-blue-600 hover:bg-blue-100 border border-blue-200 bg-blue-50"
                        )}
                        title={t("Resend invitation")}
                      >
                        <Mail size={13} />
                        {actionLoadingId === author.id ? t("Sending...") : t("Invite")}
                      </button>
                    )}
                    
                    {deleteConfirm === author.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteAuthor(author.id)}
                          disabled={actionLoadingId === author.id}
                          className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50",
                            isDark
                              ? "text-red-300 hover:bg-red-500/20 border border-red-400/30 bg-red-500/10"
                              : "text-red-600 hover:bg-red-100 border border-red-200 bg-red-50"
                          )}
                        >
                          {actionLoadingId === author.id ? t("Deleting...") : t("Confirm")}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                            isDark
                              ? "text-slate-300 hover:bg-slate-500/20 border border-slate-400/30 bg-slate-500/10"
                              : "text-slate-600 hover:bg-slate-100 border border-slate-200 bg-slate-50"
                          )}
                        >
                          {t("Cancel")}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(author.id)}
                        className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                          isDark
                            ? "text-red-300 hover:bg-red-500/20 border border-red-400/30 bg-red-500/10"
                            : "text-red-600 hover:bg-red-100 border border-red-200 bg-red-50"
                        )}
                        title={t("Delete author")}
                      >
                        <Trash2 size={13} />
                        {t("Delete")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
