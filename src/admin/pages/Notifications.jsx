import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchAdminNotifications } from "../services/adminService";
import { cn } from "../../lib/utils";
import { CATEGORIES, getMeta } from "../components/notification/constants";
import NotificationRow from "../components/notification/NotificationRow";
import NotificationTypesLegend from "../components/notification/NotificationTypesLegend";
import SendPanel from "../components/notification/SendPanel";

const Notifications = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAdminNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("Failed to load notifications."));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = useCallback(async () => {
    try {
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, read: true }))
      );
      // Optionally make an API call to mark all as read on the server
      // await markAllNotificationsRead();
    } catch (err) {
      setError(err?.message || t("Failed to mark all as read."));
    }
  }, [t]);

  const filtered = notifications.filter((n) =>
    activeCategory === "all" ? true : getMeta(n.type).category === activeCategory
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = cat.key === "all"
      ? notifications.length
      : notifications.filter((n) => getMeta(n.type).category === cat.key).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-6">

        {/* Page header */}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left — inbox */}
          <div className="space-y-4">

            {/* Category tabs */}
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
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    activeCategory === key
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface-overlay-10)] text-[var(--muted)]",
                  )}>
                    {categoryCounts[key] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <h3 className="font-bold text-[var(--text)]">
                  {t(CATEGORIES.find((c) => c.key === activeCategory)?.label || "All")}
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
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — send panel + legend */}
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
