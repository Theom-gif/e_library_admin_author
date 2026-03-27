import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import ThemeToggle from "../../theme/ThemeToggle";
import { fetchAdminBooks } from "../services/adminService";

const TITLES = {
  "/admin/dashboard": "Admin Dashboard",
  "/admin/users": "Manages Users",
  "/admin/approvals": "Book Approvals",
  "/admin/categories": "Categories",
  "/admin/books": "All Books",
  "/admin/readers": "Top Readers",
  "/admin/monitor": "System Monitor",
  "/admin/settings": "Settings",
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const title = t(TITLES[location.pathname] || "Admin");
  const menuRef = useRef(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingBooks, setPendingBooks] = useState([]);

  const loadNotifications = useCallback(async () => {
    setIsNotificationLoading(true);
    try {
      const { data, meta } = await fetchAdminBooks({
        status: "Pending",
        page: 1,
        perPage: 6,
      });
      setPendingBooks(Array.isArray(data) ? data : []);
      setPendingCount(Number(meta?.total || data?.length || 0));
    } catch {
      setPendingBooks([]);
      setPendingCount(0);
    } finally {
      setIsNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleOpenApprovals = () => {
    setIsNotificationOpen(false);
    navigate("/admin/approvals");
  };

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
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsNotificationOpen((open) => !open)}
            className="relative rounded-xl bg-white/5 p-2.5 text-slate-300 hover:bg-white/10"
            aria-label={t("Notifications")}
            title={t("Notifications")}
          >
            <Bell size={18} />
            {pendingCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border border-white/20 bg-rose-500 px-1 text-center text-[10px] font-bold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            ) : null}
          </button>

          {isNotificationOpen ? (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-white/10 bg-bg-sidebar p-3 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">{t("Notifications")}</p>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                  {t("{count} Pending", { count: pendingCount })}
                </span>
              </div>

              {isNotificationLoading ? (
                <p className="py-4 text-center text-sm text-slate-400">{t("Loading...")}</p>
              ) : pendingBooks.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  {t("No pending approvals right now.")}
                </p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-auto pr-1">
                  {pendingBooks.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={handleOpenApprovals}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
                    >
                      <p className="truncate text-sm font-medium text-slate-100">{book.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {book.author} - {book.date || t("New submission")}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleOpenApprovals}
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
              >
                {t("Open Approvals")}
              </button>
            </div>
          ) : null}
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
