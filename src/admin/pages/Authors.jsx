import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { addUserAuthorRequestNotification } from "../../lib/authorRequestNotifications";
import { useTheme } from "../../theme/ThemeContext";
import AuthorsTable from "../components/authors/AuthorsTable";
import { fetchAdminNotifications } from "../services/adminService";
import {
  approveAuthorRegistration,
  approveAuthorRequest,
  deleteAuthor,
  fetchAuthors,
  getAuthorRegistrationStatus,
  rejectAuthorRegistration,
  rejectAuthorRequest,
  resendAuthorInvitation,
} from "../services/authorService";

function RequestStatusBadge({ status, isDark, t }) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const isPending = normalizedStatus === "pending";
  const isRejected = normalizedStatus === "rejected";
  const className = isRejected
    ? isDark
      ? "border border-red-400/25 bg-red-500/10 text-red-200"
      : "border border-red-200 bg-red-50 text-red-700"
    : isPending
      ? isDark
        ? "border border-amber-400/25 bg-amber-500/10 text-amber-200"
        : "border border-amber-200 bg-amber-50 text-amber-700"
      : isDark
        ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
        : "border border-emerald-200 bg-emerald-50 text-emerald-700";
  const label = isRejected ? t("Rejected") : isPending ? t("Pending") : t("Approved");

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${className}`}>
      <ShieldCheck size={14} />
      {label}
    </span>
  );
}

export default function Authors() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [authors, setAuthors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [flash, setFlash] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [requestActionId, setRequestActionId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const approvedAuthors = authors.filter(
    (author) => getAuthorRegistrationStatus(author) !== "pending",
  );

  const getInitials = (name = "", email = "") => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
    }

    return String(email || "R")
      .trim()
      .slice(0, 2)
      .toUpperCase();
  };

  const formatSubmittedAt = (value) => {
    if (!value) return t("Waiting for review");

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return t("Waiting for review");
    }

    return date.toLocaleString();
  };

  const buildNotificationRequest = (notification, author = {}) => {
    const authorId = notification?.author_id ?? author?.id ?? "";
    const email = notification?.email ?? author?.email ?? "";
    const fallbackName = email ? email.split("@")[0].replace(/[._-]+/g, " ").trim() : "";
    const status = String(notification?.status || "in_review").trim().toLowerCase() || "in_review";

    return {
      id: authorId,
      name: author?.name || fallbackName || t("Reader request"),
      email,
      bio:
        author?.bio ||
        t("This reader submitted an author access request and is waiting for admin review."),
      motivation:
        author?.motivation ||
        notification?.message ||
        t("New author request pending approval"),
      requested_at: notification?.created_at || author?.requested_at || author?.created_at || null,
      status: status === "in_review" ? "Pending" : status,
      request_status: status,
    };
  };

  const mergePendingRequests = (allAuthors = [], pendingAuthors = []) => {
    const byId = new Map();

    [...allAuthors, ...pendingAuthors].forEach((author) => {
      if (!author?.id) return;
      const current = byId.get(String(author.id)) || {};
      byId.set(String(author.id), { ...current, ...author });
    });

    return Array.from(byId.values()).filter((author) => {
      const normalizedStatus = String(author?.status || author?.request_status || "").trim().toLowerCase();
      return normalizedStatus === "pending";
    });
  };

  const fetchAuthorsData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const [allResult, pendingResult, adminNotifications] = await Promise.all([
        fetchAuthors(),
        fetchAuthors({ status: "pending" }).catch(() => ({ data: [] })),
        fetchAdminNotifications().catch(() => []),
      ]);

      const allAuthors = Array.isArray(allResult?.data) ? allResult.data : [];
      const fallbackPending = mergePendingRequests(
        allAuthors,
        Array.isArray(pendingResult?.data) ? pendingResult.data : [],
      );
      const authorById = new Map(allAuthors.map((author) => [String(author.id), author]));
      const pendingById = new Map();

      fallbackPending.forEach((author) => {
        if (!author?.id) return;
        pendingById.set(String(author.id), author);
      });

      (Array.isArray(adminNotifications) ? adminNotifications : [])
        .filter((notification) => notification?.type === "author.pending_approval")
        .filter((notification) => String(notification?.status || "in_review").trim().toLowerCase() === "in_review")
        .forEach((notification) => {
          const authorId = String(notification?.author_id || "");
          if (!authorId) return;

          pendingById.set(
            authorId,
            {
              ...(pendingById.get(authorId) || {}),
              ...buildNotificationRequest(notification, authorById.get(authorId) || {}),
            },
          );
        });

      const pending = Array.from(pendingById.values()).sort((left, right) => {
        const leftTime = new Date(left?.requested_at || 0).getTime() || 0;
        const rightTime = new Date(right?.requested_at || 0).getTime() || 0;
        return rightTime - leftTime;
      });
      const pendingIds = new Set(pending.map((author) => String(author.id)));

      setPendingRequests(pending);
      setAuthors(allAuthors.filter((author) => !pendingIds.has(String(author.id))));
    } catch (err) {
      setPageError(err?.message || t("Failed to fetch authors"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAuthorsData();
  }, [fetchAuthorsData]);

  useEffect(() => {
    const openRequestId = location.state?.openRequestId || location.state?.focusRequestId;
    if (!openRequestId || pendingRequests.length === 0) return;

    const match = pendingRequests.find((request) => String(request.id) === String(openRequestId));
    if (match) {
      setSelectedAuthor(match);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, pendingRequests]);

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

  const handleAuthorRequest = async (requestId, action) => {
    setRequestActionId(`${action}:${requestId}`);

    try {
      const response =
        action === "approve"
          ? await approveAuthorRequest(requestId)
          : await rejectAuthorRequest(requestId);

      setFlash({
        type: "success",
        message:
          response?.message ||
          (action === "approve"
            ? t("Author request approved. Email notification should be sent by the backend.")
            : t("Author request rejected. Email notification should be sent by the backend.")),
      });

      if (selectedAuthor?.id === requestId) {
        setSelectedAuthor(null);
      }

      addUserAuthorRequestNotification(
        response?.data?.id ? response.data : pendingRequests.find((request) => String(request.id) === String(requestId)) || { id: requestId },
        action === "approve" ? "approved" : "rejected",
      );

      await fetchAuthorsData();
    } catch (err) {
      setFlash({
        type: "error",
        message:
          err?.message ||
          (action === "approve"
            ? t("Failed to approve author request")
            : t("Failed to reject author request")),
      });
    } finally {
      setRequestActionId(null);
    }
  };

  return (
    <div className="space-y-6">
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

      <section className={`overflow-hidden rounded-[24px] border ${
        isDark ? "border-slate-800 bg-gradient-to-b from-[#15292d] via-slate-950 to-[#101927]" : "border-slate-200 bg-white"
      }`}>
        <div className={`border-b px-6 py-4 ${
          isDark ? "border-slate-800 bg-transparent" : "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {t("Pending Author Requests")}
              </h3>
              <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t("Readers who ask to become authors appear here for admin review.")}
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
              isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700"
            }`}>
              <Clock3 size={14} />
              {pendingRequests.length} {pendingRequests.length === 1 ? t("request") : t("requests")}
            </span>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              {t("No pending author requests")}
            </p>
            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {t("New reader requests will appear here when they submit the author application form.")}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 px-6 py-6 xl:grid-cols-2">
            {pendingRequests.map((request) => {
              const isApproving = requestActionId === `approve:${request.id}`;
              const isRejecting = requestActionId === `reject:${request.id}`;
              const isBusy = isApproving || isRejecting;

              return (
                <article
                  key={request.id}
                  className={`overflow-hidden rounded-[28px] border transition ${
                    isDark
                      ? "border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.88)_0%,rgba(8,15,28,0.96)_100%)] shadow-[0_24px_60px_rgba(2,8,23,0.45)]"
                      : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                  }`}
                >
                  <div className={`border-b px-6 py-5 ${
                    isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/80"
                  }`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${
                          isDark
                            ? "bg-[#1b3a40] text-cyan-100 ring-1 ring-cyan-400/20"
                            : "bg-[#e0f2f4] text-[#1f5961]"
                        }`}>
                          {getInitials(request.name, request.email)}
                        </div>
                        <div className="min-w-0">
                          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${
                            isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700"
                          }`}>
                            <Clock3 size={12} />
                            {t("Pending Review")}
                          </div>
                          <h4 className={`mt-3 text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                            {request.name || t("Unknown applicant")}
                          </h4>
                          <div className={`mt-2 flex flex-wrap items-center gap-3 text-sm ${
                            isDark ? "text-slate-400" : "text-slate-600"
                          }`}>
                            <span className="inline-flex items-center gap-2">
                              <Mail size={14} />
                              <span className="break-all">{request.email || t("No email provided")}</span>
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Clock3 size={14} />
                              {t("Submitted")}: {formatSubmittedAt(request.requested_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedAuthor(request)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                            isDark
                              ? "border-indigo-400/25 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15"
                              : "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          }`}
                        >
                          <Eye size={16} />
                          {t("View")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAuthorRequest(request.id, "approve")}
                          disabled={isBusy}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isDark
                              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
                              : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          <UserCheck size={16} />
                          {isApproving ? t("Approving...") : t("Approve")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAuthorRequest(request.id, "reject")}
                          disabled={isBusy}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isDark
                              ? "border-red-400/25 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                              : "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                          }`}
                        >
                          <Ban size={16} />
                          {isRejecting ? t("Rejecting...") : t("Reject")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1.1fr_1.1fr_0.7fr]">
                    <div className={`rounded-2xl border p-4 ${
                      isDark ? "border-slate-800 bg-slate-900/55" : "border-slate-200 bg-white"
                    }`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                        isDark ? "text-slate-500" : "text-slate-500"
                      }`}>
                        {t("Short Bio")}
                      </p>
                      <p className={`mt-3 text-sm leading-7 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}>
                        {request.bio || t("No biography provided.")}
                      </p>
                    </div>

                    <div className={`rounded-2xl border p-4 ${
                      isDark ? "border-slate-800 bg-slate-900/55" : "border-slate-200 bg-white"
                    }`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                        isDark ? "text-slate-500" : "text-slate-500"
                      }`}>
                        {t("Request Reason")}
                      </p>
                      <p className={`mt-3 text-sm leading-7 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}>
                        {request.motivation || t("No reason was included in this request.")}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      <div className={`rounded-2xl border p-4 ${
                        isDark ? "border-slate-800 bg-slate-900/55" : "border-slate-200 bg-white"
                      }`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                          isDark ? "text-slate-500" : "text-slate-500"
                        }`}>
                          {t("Status")}
                        </p>
                        <div className="mt-3">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                            isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700"
                          }`}>
                            <Clock3 size={14} />
                            {request.status || t("Pending")}
                          </span>
                        </div>
                      </div>

                      <div className={`rounded-2xl border p-4 ${
                        isDark ? "border-slate-800 bg-slate-900/55" : "border-slate-200 bg-white"
                      }`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                          isDark ? "text-slate-500" : "text-slate-500"
                        }`}>
                          {t("Author ID")}
                        </p>
                        <p className={`mt-3 text-lg font-semibold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}>
                          #{request.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={`overflow-hidden rounded-[24px] border ${
        isDark ? "border-slate-800 bg-gradient-to-b from-[#15292d] via-slate-950 to-[#101927]" : "border-slate-200 bg-white"
      }`}>
        <div className={`border-b px-6 py-4 ${
          isDark ? "border-slate-800 bg-transparent" : "border-slate-200 bg-slate-50"
        }`}>
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
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                      selectedAuthor?.status === "Pending"
                        ? isDark
                          ? "border border-amber-400/25 bg-amber-400/10 text-amber-200"
                          : "border border-amber-300 bg-amber-50 text-amber-500"
                        : isDark
                          ? "border border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                          : "border border-emerald-300 bg-emerald-50 text-emerald-600"
                    }`}>
                      <ShieldCheck size={14} />
                      {selectedAuthor?.status === "Pending" ? t("Pending Request") : t("Author")}
                    </span>
                    <RequestStatusBadge
                      status={getAuthorRegistrationStatus(selectedAuthor)}
                      isDark={isDark}
                      t={t}
                    />
                  </div>
                  <p className={`mt-3 max-w-3xl text-sm leading-6 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}>
                    {selectedAuthor.bio || selectedAuthor.motivation || t("No biography has been added for this author yet.")}
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
