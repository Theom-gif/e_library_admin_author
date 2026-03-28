import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, BookOpen, LogOut, Shield, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import ThemeToggle from "../../theme/ThemeToggle";
import { fetchAdminNotifications, fetchAdminBooks } from "../services/adminService";

const TITLES = {
  "/admin/dashboard":     "Admin Dashboard",
  "/admin/users":         "Manages Users",
  "/admin/approvals":     "Book Approvals",
  "/admin/categories":    "Categories",
  "/admin/books":         "All Books",
  "/admin/readers":       "Top Readers",
  "/admin/monitor":       "System Monitor",
  "/admin/settings":      "Settings",
  "/admin/notifications": "Notifications",
};

const TYPE_META = {
  user_registered: { icon: User,          color: "text-indigo-400",  bg: "bg-indigo-500/10" },
  user_login:      { icon: User,          color: "text-blue-400",    bg: "bg-blue-500/10" },
  user_milestone:  { icon: User,          color: "text-violet-400",  bg: "bg-violet-500/10" },
  book_added:      { icon: BookOpen,      color: "text-emerald-400", bg: "bg-emerald-500/10" },
  book_updated:    { icon: BookOpen,      color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  book_deleted:    { icon: BookOpen,      color: "text-rose-400",    bg: "bg-rose-500/10" },
  book_reported:   { icon: AlertTriangle, color: "text-orange-400",  bg: "bg-orange-500/10" },
  book_pending:    { icon: BookOpen,      color: "text-amber-400",   bg: "bg-amber-500/10" },
  server_error:    { icon: AlertTriangle, color: "text-red-400",     bg: "bg-red-500/10" },
  failed_login:    { icon: Shield,        color: "text-rose-400",    bg: "bg-rose-500/10" },
  auth_issue:      { icon: Shield,        color: "text-orange-400",  bg: "bg-orange-500/10" },
  system_alert:    { icon: AlertTriangle, color: "text-red-400",     bg: "bg-red-500/10" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getMeta(type) {
  return TYPE_META[type] || { icon: Bell, color: "text-slate-400", bg: "bg-white/5" };
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const title = t(TITLES[location.pathname] || "Admin");
  const menuRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      // GET /api/admin/notifications
      const data = await fetchAdminNotifications();
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data.slice(0, 6));
        setPendingCount(data.filter((n) => !n.read).length);
        return;
      }
    } catch { /* fall through to pending books fallback */ }

    // Fallback: show pending book approvals when notifications endpoint unavailable
    try {
      const { data, meta } = await fetchAdminBooks({ status: "Pending", page: 1, perPage: 6 });
      const mapped = (Array.isArray(data) ? data : []).map((book) => ({
        id: book.id,
        type: "book_pending",
        message: book.title,
        description: `${book.author} · ${book.date || t("New submission")}`,
        read: false,
        created_at: book.date,
      }));
      setNotifications(mapped);
      setPendingCount(Number(meta?.total || mapped.length || 0));
    } catch {
      setNotifications([]);
      setPendingCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    const onDown = (e) => { if (!menuRef.current?.contains(e.target)) setIsOpen(false); };
    const onKey  = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const handleViewAll = () => { setIsOpen(false); navigate("/admin/notifications"); };

  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-slate-400">
          {t("Admin control center")}
          {user ? ` - ${user.name} (${t(user.role)})` : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Bell */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            className="relative rounded-xl bg-white/5 p-2.5 text-slate-300 hover:bg-white/10"
            aria-label={t("Notifications")}
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border border-white/20 bg-rose-500 px-1 text-center text-[10px] font-bold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 z-50 mt-2 w-[340px] rounded-2xl border border-white/10 bg-bg-sidebar shadow-2xl">
              {/* Dropdown header */}
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-slate-400" />
                  <p className="text-sm font-semibold text-slate-100">{t("Notifications")}</p>
                </div>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-400">
                    {pendingCount} {t("unread")}
                  </span>
                )}
              </div>

              {/* List */}
              <div className="max-h-[320px] overflow-y-auto p-2">
                {isLoading && (
                  <p className="py-6 text-center text-sm text-slate-400">{t("Loading...")}</p>
                )}
                {!isLoading && notifications.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">
                    {t("No notifications right now.")}
                  </p>
                )}
                {!isLoading && notifications.map((notif) => {
                  const meta = getMeta(notif.type);
                  const Icon = meta.icon;
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={handleViewAll}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5"
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                        <Icon size={13} className={meta.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${notif.read ? "text-slate-400" : "text-slate-100"}`}>
                          {notif.message || notif.title}
                        </p>
                        {notif.description && (
                          <p className="truncate text-xs text-slate-500">{notif.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {timeAgo(notif.created_at)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-white/5 p-2">
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  {t("View all notifications")}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          <LogOut size={16} />
          {t("Logout")}
        </button>
      </div>
    </header>
  );
}
