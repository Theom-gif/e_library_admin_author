import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Mail, PenTool, ShieldCheck, UserRound, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";
import CreateAuthorForm from "../components/authors/CreateAuthorForm";
import AuthorsTable from "../components/authors/AuthorsTable";
import { deleteAuthor, fetchAuthors, resendAuthorInvitation } from "../services/authorService";

export default function Authors() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [flash, setFlash] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  const fetchAuthorsData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await fetchAuthors();
      setAuthors(result.data || []);
    } catch (err) {
      setPageError(err?.message || t("Failed to fetch authors"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAuthorsData();
  }, [fetchAuthorsData]);

  const handleAuthorCreated = ({ message }) => {
    setFlash({
      type: "success",
      message: message || t("Author created successfully"),
    });
    setShowForm(false);
    fetchAuthorsData();
  };

  const handleDeleteAuthor = async (authorId) => {
    setActionLoadingId(authorId);

    try {
      const response = await deleteAuthor(authorId);
      setAuthors((prev) => prev.filter((author) => author.id !== authorId));
      setDeleteConfirm(null);
      if (selectedAuthor?.id === authorId) {
        setSelectedAuthor(null);
      }
      setFlash({
        type: "success",
        message: response?.message || t("Author deleted successfully"),
      });
    } catch (err) {
      setFlash({
        type: "error",
        message: err?.message || t("Failed to delete author"),
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendInvite = async (authorId) => {
    setActionLoadingId(authorId);

    try {
      const response = await resendAuthorInvitation(authorId);
      setFlash({
        type: "success",
        message: response?.message || t("Invitation email sent successfully"),
      });
    } catch (err) {
      setFlash({
        type: "error",
        message: err?.message || t("Failed to resend invitation"),
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
            isDark
              ? "bg-[#214046] text-white hover:bg-[#2a525a]"
              : "bg-[#4a868f] text-white hover:bg-[#3f7880]"
          }`}
        >
          <PenTool size={18} />
          {showForm ? t("Hide Form") : t("Create Author")}
        </button>
      </div>

      {flash && (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
          flash.type === "success"
            ? isDark
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
            : isDark
              ? "border-red-500/25 bg-red-500/10 text-red-200"
              : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {flash.type === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-medium">{flash.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="text-sm opacity-80 transition hover:opacity-100"
          >
            {t("Dismiss")}
          </button>
        </div>
      )}

      {showForm && (
        <CreateAuthorForm
          onSuccess={handleAuthorCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {pageError && (
        <div className={`rounded-2xl border px-4 py-3 ${
          isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {pageError}
        </div>
      )}

      <section className={`overflow-hidden rounded-[24px] border ${
        isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"
      }`}>
        <div className={`border-b px-6 py-4 ${
          isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"
        }`}>
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("Author Directory")}
          </h3>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {t("All created authors appear here immediately after a successful submission.")}
          </p>
        </div>

        {selectedAuthor && (
          <div className={`border-b px-6 py-5 ${
            isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-slate-50/80"
          }`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                  isDark ? "bg-[#214046] text-white" : "bg-[#4a868f] text-white"
                }`}>
                  {String(selectedAuthor.name || "AU")
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() || "")
                    .join("")}
                </div>
                <div>
                  <h4 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {selectedAuthor.name}
                  </h4>
                  <div className={`mt-2 flex flex-wrap items-center gap-3 text-sm ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}>
                    <span className="inline-flex items-center gap-2">
                      <Mail size={15} />
                      {selectedAuthor.email}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-500">
                      <ShieldCheck size={14} />
                      Author
                    </span>
                  </div>
                  <p className={`mt-3 max-w-3xl text-sm leading-6 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}>
                    {selectedAuthor.bio || t("No biography has been added for this author yet.")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAuthor(null)}
                className={`inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isDark
                    ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                <X size={16} />
                {t("Close")}
              </button>
            </div>
          </div>
        )}

        <AuthorsTable
          authors={authors}
          loading={loading}
          emptyTitle={t("No authors found")}
          emptyDescription={t("Create a new author to get started")}
          actionLoadingId={actionLoadingId}
          deleteConfirm={deleteConfirm}
          onDeleteRequest={setDeleteConfirm}
          onDeleteConfirm={handleDeleteAuthor}
          onDeleteCancel={() => setDeleteConfirm(null)}
          onResendInvite={handleResendInvite}
          onViewAuthor={setSelectedAuthor}
        />
      </section>
    </div>
  );
}
