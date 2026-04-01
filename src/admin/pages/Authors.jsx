import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";
import AuthorsTable from "../components/authors/AuthorsTable";
import {
  approveAuthorRegistration,
  deleteAuthor,
  fetchAuthors,
  getAuthorRegistrationStatus,
  rejectAuthorRegistration,
  resendAuthorInvitation,
} from "../services/authorService";

function formatTimestamp(value) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function RequestStatusBadge({ status, isDark, t }) {
  const styles = {
    approved: isDark
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: isDark
      ? "border-red-400/25 bg-red-500/10 text-red-200"
      : "border-red-200 bg-red-50 text-red-700",
    pending: isDark
      ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700",
  };

  const labels = {
    approved: t("Approved"),
    rejected: t("Rejected"),
    pending: t("Pending Review"),
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || styles.pending}`}>
      <Clock3 size={13} />
      {labels[status] || labels.pending}
    </span>
  );
}

function ReviewButton({ icon, label, onClick, loading, tone = "neutral", isDark }) {
  const className = tone === "approve"
    ? isDark
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
    : tone === "reject"
      ? isDark
        ? "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/15"
        : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      : isDark
        ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function Authors() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [flash, setFlash] = useState(null);
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

  const pendingAuthors = useMemo(
    () =>
      authors.filter((author) => {
        const status = getAuthorRegistrationStatus(author);
        return status === "pending" || status === "rejected";
      }),
    [authors],
  );

  const approvedAuthors = useMemo(
    () => authors.filter((author) => getAuthorRegistrationStatus(author) === "approved"),
    [authors],
  );

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

  const handleReviewAuthor = async (authorId, decision) => {
    const actionKey = `review-${authorId}`;
    setActionLoadingId(actionKey);

    try {
      const response = decision === "approve"
        ? await approveAuthorRegistration(authorId)
        : await rejectAuthorRegistration(authorId);

      setFlash({
        type: "success",
        message:
          response?.message ||
          (decision === "approve"
            ? t("Author request approved successfully")
            : t("Author request rejected successfully")),
      });
      await fetchAuthorsData();
    } catch (err) {
      setFlash({
        type: "error",
        message:
          err?.message ||
          (decision === "approve"
            ? t("Failed to approve author request")
            : t("Failed to reject author request")),
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("Author Requests")}
          </h2>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {t("Review author registration submissions before they appear in the approved directory.")}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAuthorsData}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isDark
              ? "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {t("Refresh")}
        </button>
      </div>

      {flash && (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
            flash.type === "success"
              ? isDark
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
              : isDark
                ? "border-red-500/25 bg-red-500/10 text-red-200"
                : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {flash.type === "success" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
          )}
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

      {pageError && (
        <div
          className={`rounded-2xl border px-4 py-3 ${
            isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {pageError}
        </div>
      )}

      <section
        className={`overflow-hidden rounded-[24px] border ${
          isDark ? "border-slate-800 bg-gradient-to-b from-[#15292d] via-slate-950 to-[#101927]" : "border-slate-200 bg-white"
        }`}
      >
        <div
          className={`border-b px-6 py-4 ${
            isDark ? "border-slate-800 bg-transparent" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {t("Pending Registration Queue")}
              </h3>
              <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t("New author applications sent through /api/auth/author_registration appear here for approval or rejection.")}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isDark ? "bg-slate-900 text-slate-300" : "bg-slate-100 text-slate-600"
              }`}
            >
              {pendingAuthors.length} {t("in review")}
            </span>
          </div>
        </div>

        {pendingAuthors.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              {t("No pending author requests")}
            </p>
            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {t("Once an author submits the registration form, their request will appear here.")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/10">
            {pendingAuthors.map((author) => {
              const status = getAuthorRegistrationStatus(author);
              const isReviewing = actionLoadingId === `review-${author.id}`;

              return (
                <article
                  key={author.id}
                  className={`px-6 py-5 ${isDark ? "bg-slate-950/25" : "bg-white"}`}
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                          isDark ? "bg-[#214046] text-white ring-2 ring-cyan-500/15" : "bg-[#4a868f] text-white"
                        }`}
                      >
                        {String(author.name || "AU")
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase() || "")
                          .join("")}
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                            {author.name || t("Unnamed applicant")}
                          </h4>
                          <RequestStatusBadge status={status} isDark={isDark} t={t} />
                        </div>

                        <div
                          className={`flex flex-wrap items-center gap-3 text-sm ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Mail size={15} />
                            {author.email || t("No email provided")}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Clock3 size={15} />
                            {t("Submitted")} {formatTimestamp(author.created_at || author.updated_at)}
                          </span>
                        </div>

                        <div
                          className={`rounded-2xl border px-4 py-3 ${
                            isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <p
                            className={`mb-2 text-xs font-bold uppercase tracking-[0.18em] ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {t("Application")}
                          </p>
                          <p
                            className={`text-sm leading-6 ${
                              isDark ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            {author.bio || t("This applicant did not include a bio in the registration form.")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                      <ReviewButton
                        icon={<FileText size={16} />}
                        label={t("View")}
                        onClick={() => setSelectedAuthor(author)}
                        isDark={isDark}
                      />
                      <ReviewButton
                        icon={<Check size={16} />}
                        label={isReviewing ? t("Saving...") : t("Approve")}
                        onClick={() => handleReviewAuthor(author.id, "approve")}
                        loading={isReviewing}
                        tone="approve"
                        isDark={isDark}
                      />
                      <ReviewButton
                        icon={<Ban size={16} />}
                        label={isReviewing ? t("Saving...") : t("Reject")}
                        onClick={() => handleReviewAuthor(author.id, "reject")}
                        loading={isReviewing}
                        tone="reject"
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        className={`overflow-hidden rounded-[24px] border ${
          isDark ? "border-slate-800 bg-gradient-to-b from-[#15292d] via-slate-950 to-[#101927]" : "border-slate-200 bg-white"
        }`}
      >
        <div
          className={`border-b px-6 py-4 ${
            isDark ? "border-slate-800 bg-transparent" : "border-slate-200 bg-slate-50"
          }`}
        >
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("Author Directory")}
          </h3>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {t("Approved author accounts appear here after the registration request is reviewed.")}
          </p>
        </div>

        {selectedAuthor && (
          <div
            className={`border-b px-6 py-5 ${
              isDark ? "border-slate-800 bg-slate-900/55" : "border-slate-200 bg-slate-50/80"
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                    isDark ? "bg-[#214046] text-white ring-2 ring-cyan-500/15" : "bg-[#4a868f] text-white"
                  }`}
                >
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
                  <div
                    className={`mt-2 flex flex-wrap items-center gap-3 text-sm ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Mail size={15} />
                      {selectedAuthor.email}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                        isDark
                          ? "border border-amber-400/25 bg-amber-400/10 text-amber-200"
                          : "border border-amber-300 bg-amber-50 text-amber-500"
                      }`}
                    >
                      <ShieldCheck size={14} />
                      {getAuthorRegistrationStatus(selectedAuthor) === "approved"
                        ? t("Author")
                        : t("Registration Request")}
                    </span>
                    <RequestStatusBadge
                      status={getAuthorRegistrationStatus(selectedAuthor)}
                      isDark={isDark}
                      t={t}
                    />
                  </div>
                  <p className={`mt-3 max-w-3xl text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {selectedAuthor.bio || t("No biography has been added for this author yet.")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAuthor(null)}
                className={`inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
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
          authors={approvedAuthors}
          loading={loading}
          isDark={isDark}
          emptyTitle={t("No approved authors found")}
          emptyDescription={t("Approved author accounts will appear here after you review pending registrations.")}
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
