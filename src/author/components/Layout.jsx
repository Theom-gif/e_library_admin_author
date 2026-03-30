import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from '../../theme/ThemeToggle';
import { useLanguage } from '../../i18n/LanguageContext';
import { getMeta, timeAgo } from '../../admin/components/notification/constants';
import { useAuthorNotifications } from '../hooks/useAuthorNotifications';

const Layout = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const menuRef = useRef(null);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading: isLoadingNotifications,
    error: notificationsError,
    refreshNotifications,
  } = useAuthorNotifications();
  const previewNotifications = notifications.slice(0, 6);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsBellOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsBellOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleViewAllNotifications = () => {
    setIsBellOpen(false);
    navigate('/author/notifications');
  };

  return (
    <div className="flex min-h-screen bg-background-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 bg-background-dark/50 backdrop-blur-md flex items-center justify-end px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <ThemeToggle className="rounded-full p-2" iconSize={20} />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsBellOpen((open) => !open)}
                className="relative p-2 text-slate-400 hover:bg-primary/20 rounded-full transition-colors"
                aria-label={t('Notifications')}
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border-2 border-background-dark bg-red-500 px-1 text-center text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isBellOpen && (
                <div className="absolute right-0 mt-3 w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-card-dark shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text)]">{t('Notifications')}</p>
                      <p className="text-xs text-slate-500">{t('Latest author activity')}</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">
                        {unreadCount} {t('unread')}
                      </span>
                    )}
                  </div>

                  <div className="max-h-[320px] overflow-y-auto p-2">
                    {isLoadingNotifications && (
                      <p className="py-6 text-center text-sm text-slate-400">{t('Loading notifications...')}</p>
                    )}

                    {!isLoadingNotifications && notificationsError && previewNotifications.length === 0 && (
                      <p className="px-3 py-6 text-center text-sm text-rose-300">{notificationsError}</p>
                    )}

                    {!isLoadingNotifications && !notificationsError && previewNotifications.length === 0 && (
                      <p className="py-6 text-center text-sm text-slate-400">{t('No notifications right now.')}</p>
                    )}

                    {!isLoadingNotifications &&
                      previewNotifications.map((notification) => {
                        const meta = getMeta(notification.type);
                        const Icon = meta.icon;

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={handleViewAllNotifications}
                            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5"
                          >
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-medium ${notification.read ? 'text-slate-400' : 'text-[color:var(--text)]'}`}>
                                {notification.message || notification.title}
                              </p>
                              {notification.description && (
                                <p className="truncate text-xs text-slate-500">{notification.description}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-[10px] text-slate-500">{timeAgo(notification.created_at)}</span>
                          </button>
                        );
                      })}
                  </div>

                  <div className="border-t border-white/5 p-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={refreshNotifications}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[color:var(--text)] transition hover:bg-white/10"
                      >
                        {t('Refresh')}
                      </button>
                      <button
                        type="button"
                        onClick={handleViewAllNotifications}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[color:var(--text)] transition hover:bg-white/10"
                      >
                        {t('View all notifications')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-white/5 mx-2"></div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
