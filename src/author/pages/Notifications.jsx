import { useMemo, useState } from "react";
import { Bell, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { cn } from "../../lib/utils";
import { CATEGORIES, getMeta } from "../../admin/components/notification/constants";
import NotificationRow from "../../admin/components/notification/NotificationRow";
import NotificationTypesLegend from "../../admin/components/notification/NotificationTypesLegend";
import { useAuthorNotifications } from "../hooks/useAuthorNotifications";

const Notifications = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const {
    notifications,
    unreadCount,
    loading: isLoading,
    error,
    refreshNotifications,
  } = useAuthorNotifications();

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) =>
        activeCategory === "all"
          ? true
          : getMeta(notification.type).category === activeCategory,
      ),
    [activeCategory, notifications],
  );

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 rounded-[30px] border border-white/6 bg-[linear-gradient(135deg,rgba(74,134,143,0.22),rgba(13,18,29,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent/90">
            {t("Notification Center")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("Author Notifications")}</h1>
          {/* <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {t("Review alerts generated for your author account from")} <code>/api/author/notifications</code>.
          </p> */}
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 ? (
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
              {unreadCount} {t("unread")}
            </span>
          ) : (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              {t("All caught up")}
            </span>
          )}
          <button
            type="button"
            onClick={refreshNotifications}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} className={cn(isLoading && "animate-spin")} />
            {t("Refresh")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ key, label, icon: Icon }) => {
              const count =
                key === "all"
                  ? notifications.length
                  : notifications.filter((item) => getMeta(item.type).category === key).length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                    activeCategory === key
                      ? "border-accent/40 bg-accent text-white"
                      : "border-white/10 bg-card-dark text-slate-300 hover:bg-primary/10",
                  )}
                >
                  <Icon size={15} />
                  {t(label)}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      activeCategory === key ? "bg-white/20 text-white" : "bg-white/10 text-slate-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-white/6 bg-card-dark shadow-[0_20px_70px_rgba(0,0,0,0.16)]">
            <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
              <h2 className="font-bold text-[color:var(--text)]">
                {t(CATEGORIES.find((item) => item.key === activeCategory)?.label || "All")}
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {filteredNotifications.length} {t("items")}
              </span>
            </div>

            <div className="p-4">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">{t("Loading notifications...")}</span>
                </div>
              )}

              {!isLoading && error && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
                  {error || t("Failed to load notifications.")}
                </div>
              )}

              {!isLoading && !error && filteredNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                  <Bell size={36} className="text-slate-500/40" />
                  <p className="text-sm font-medium">{t("No notifications here")}</p>
                </div>
              )}

              {!isLoading && !error && filteredNotifications.length > 0 && (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <NotificationRow key={notification.id} notif={notification} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/6 bg-card-dark p-6 shadow-[0_20px_70px_rgba(0,0,0,0.16)]">
            <h3 className="text-lg font-bold">{t("At a glance")}</h3>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/8 bg-primary/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {t("Total")}
                </p>
                <p className="mt-2 text-2xl font-bold">{notifications.length}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-primary/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {t("Unread")}
                </p>
                <p className="mt-2 text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </div>

          <NotificationTypesLegend t={t} />
        </div>
      </div>
    </div>
  );
};

export default Notifications;
