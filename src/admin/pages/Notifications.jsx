import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Ban, Bell, CheckCircle, Loader2, Mail, RefreshCw, UserCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  addHandledAdminAuthorRequestId,
  addUserAuthorRequestNotification,
  getAdminAuthorRequestKey,
  getHandledAdminAuthorRequestIds,
} from "../../lib/authorRequestNotifications";
import { cn } from "../../lib/utils";
import { CATEGORIES, getMeta } from "../components/notification/constants";
import NotificationRow from "../components/notification/NotificationRow";
import NotificationTypesLegend from "../components/notification/NotificationTypesLegend";
import SendPanel from "../components/notification/SendPanel";
import { fetchAdminNotifications } from "../services/adminService";
import { approveAuthorRequest, rejectAuthorRequest } from "../services/authorService";

const Notifications = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(null);
  const [requestActionKey, setRequestActionKey] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError("");

    try {
      const adminNotifications = await fetchAdminNotifications();
      const handledIds = new Set(getHandledAdminAuthorRequestIds());
      const nextNotifications = (Array.isArray(adminNotifications) ? adminNotifications : []).filter(
        (notification) => !handledIds.has(getAdminAuthorRequestKey(notification)),
      );
      setNotifications(nextNotifications);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("Failed to load notifications."));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.state?.activeCategory) {
      setActiveCategory(location.state.activeCategory);
    }
  }, [location.state]);

  const markAllRead = useCallback(async () => {
    try {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, read: true })),
      );
    } catch (err) {
      setError(err?.message || t("Failed to mark all as read."));
    }
  }, [t]);

  const filtered = useMemo(
    () =>
      notifications.filter((notification) => {
        if (notification.type === "author.pending_approval") {
          return false;
        }

        return activeCategory === "all"
          ? true
          : getMeta(notification.type).category === activeCategory;
      }),
    [activeCategory, notifications],
  );
  const pendingAuthorRequests = useMemo(
    () =>
      notifications.filter((notification) => {
        if (notification.type !== "author.pending_approval") return false;
        return String(notification.status || "in_review").trim().toLowerCase() === "in_review";
      }),
    [notifications],
  );

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = cat.key === "all"
      ? notifications.length
      : notifications.filter((notification) => getMeta(notification.type).category === cat.key).length;
    return acc;
  }, {});

  const handleNotificationOpen = (notification) => {
    if (notification?.targetPath) {
      navigate(notification.targetPath, { state: notification.targetState || null });
      return;
    }
  };

  const handleAuthorRequestAction = useCallback(async (notification, action) => {
    const authorId = notification?.author_id;

    if (!authorId) {
      setFlash({
        type: "error",
        message: t("This notification is missing the author ID."),
      });
      return;
    }

    const actionKey = `${action}:${authorId}`;
    setRequestActionKey(actionKey);
    setFlash(null);

    try {
      const response =
        action === "approve"
          ? await approveAuthorRequest(authorId)
          : await rejectAuthorRequest(authorId);

      addUserAuthorRequestNotification(
        response?.data?.id
          ? response.data
          : {
              id: authorId,
              email: notification?.email,
            },
        action === "approve" ? "approved" : "rejected",
      );
      addHandledAdminAuthorRequestId(notification);

      setNotifications((current) =>
        current.filter(
          (item) => getAdminAuthorRequestKey(item) !== getAdminAuthorRequestKey(notification),
        ),
      );

      setFlash({
        type: "success",
        message:
          response?.message ||
          (action === "approve"
            ? t("Author request approved successfully.")
            : t("Author request rejected successfully.")),
      });
    } catch (err) {
      setFlash({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          (action === "approve"
            ? t("Failed to approve author request.")
            : t("Failed to reject author request.")),
      });
    } finally {
      setRequestActionKey("");
    }
  }, [t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">{t("Notifications")}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t("Manage system alerts, user activity, and book events")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:border-indigo-400 hover:text-indigo-400"
              >
                <CheckCircle size={14} />
                {t("Mark all read")}
              </button>
            )}
            <button
              type="button"
              onClick={load}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:border-indigo-400 hover:text-indigo-400"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              {t("Refresh")}
            </button>
          </div>
        </div>

        {flash && (
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
              flash.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400",
            )}
          >
            <div className="mt-0.5">
              {flash.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            </div>
            <div className="flex-1 font-medium">{flash.message}</div>
            <button
              type="button"
              onClick={() => setFlash(null)}
              className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80 transition hover:opacity-100"
            >
              {t("Dismiss")}
            </button>
          </div>
        )}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">{t("Pending Author Reviews")}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {t("Only reader requests waiting for admin approval appear in this section.")}
              </p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
              {pendingAuthorRequests.length} {t("In Review")}
            </span>
          </div>

          <div className="p-4">
            {pendingAuthorRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {t("No pending author requests")}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {t("New notifications with type author.pending_approval will appear here.")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAuthorRequests.map((notification) => {
                  const authorId = notification.author_id || "-";
                  const email = notification.email || t("No email provided");
                  const status = "in_review";
                  const applicantName = notification.applicant_name || t("Reader request");
                  const requestBio = notification.bio || "";
                  const requestReason = notification.reason || "";
                  const approveKey = `approve:${authorId}`;
                  const rejectKey = `reject:${authorId}`;
                  const isBusy = requestActionKey === approveKey || requestActionKey === rejectKey;

                  return (
                    <article
                      key={notification.id || `${notification.type}-${authorId}`}
                      className="rounded-2xl border border-[var(--border)] bg-[color:var(--surface-overlay-10)] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                              {t("New author request pending approval")}
                            </p>
                            <h3 className="mt-1 text-base font-bold text-[var(--text)]">
                              {notification.message || t("New author request pending approval")}
                            </h3>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                              {t("Reader request received and waiting for your decision.")}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                                {t("applicant")}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{applicantName}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                                author_id
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{authorId}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                                email
                              </p>
                              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                <Mail size={14} className="text-[var(--muted)]" />
                                <span className="break-all">{email}</span>
                              </p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                                status
                              </p>
                              <p className="mt-1">
                                <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-500">
                                  {status}
                                </span>
                              </p>
                            </div>
                          </div>

                          {(requestBio || requestReason) && (
                            <div className="grid gap-3 xl:grid-cols-2">
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                                  {t("bio")}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                                  {requestBio || t("No bio was included in this request.")}
                                </p>
                              </div>
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                                  {t("reason")}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                                  {requestReason || t("No reason was included in this request.")}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleAuthorRequestAction(notification, "approve")}
                            disabled={isBusy}
                            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-500 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <UserCheck size={16} />
                            {requestActionKey === approveKey ? t("Approving...") : t("Approve")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAuthorRequestAction(notification, "reject")}
                            disabled={isBusy}
                            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Ban size={16} />
                            {requestActionKey === rejectKey ? t("Rejecting...") : t("Reject")}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
                    activeCategory === key
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-indigo-400 hover:text-indigo-400",
                  )}
                >
                  <Icon size={14} />
                  {t(label)}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      activeCategory === key
                        ? "bg-white/20 text-white"
                        : "bg-[var(--surface-overlay-10)] text-[var(--muted)]",
                    )}
                  >
                    {categoryCounts[key] || 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <h3 className="font-bold text-[var(--text)]">
                  {t(CATEGORIES.find((category) => category.key === activeCategory)?.label || "All")}
                </h3>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">
                      {unreadCount} {t("unread")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={load}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
                    {t("Refresh")}
                  </button>
                </div>
              </div>

              <div className="p-4">
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">{t("Loading notifications...")}</span>
                  </div>
                )}
                {!isLoading && error && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                    {error}
                  </div>
                )}
                {!isLoading && !error && filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--muted)]">
                    <Bell size={36} className="opacity-20" />
                    <p className="text-sm font-medium">{t("No notifications here")}</p>
                  </div>
                )}
                {!isLoading && !error && filtered.length > 0 && (
                  <div className="space-y-2">
                    {filtered.map((notif) => (
                      <NotificationRow
                        key={notif.id}
                        notif={notif}
                        onOpen={handleNotificationOpen}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <SendPanel t={t} onSent={load} />
            <NotificationTypesLegend t={t} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
