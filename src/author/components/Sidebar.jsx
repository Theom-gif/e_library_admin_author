import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusSquare, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  AUTHOR_PROFILE_KEY,
  AUTHOR_PROFILE_UPDATED_EVENT,
  normalizeAuthorProfile,
  readAuthorProfileStorage,
} from '../services/profileStorage';

const Sidebar = () => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState(() => readAuthorProfileStorage());

  const navItems = [
    { icon: LayoutDashboard, label: t('Dashboard'), path: '/author' },
    { icon: BookOpen, label: t('My Books'), path: '/author/my-books' },
    // { icon: Filter, label: t('Categories'), path: '/author/category/technology' },
    { icon: PlusSquare, label: t('Upload New'), path: '/author/upload' },
    { icon: BarChart3, label: t('Analytics'), path: '/author/analytics' },
    { icon: MessageSquare, label: t('Feedback'), path: '/author/feedback' },
    { icon: Settings, label: t('Settings'), path: '/author/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  React.useEffect(() => {
    const syncProfile = () => {
      const raw = window.localStorage.getItem(AUTHOR_PROFILE_KEY);
      if (!raw) {
        setProfile(readAuthorProfileStorage());
        return;
      }
      try {
        setProfile(normalizeAuthorProfile(JSON.parse(raw)));
      } catch {
        setProfile(readAuthorProfileStorage());
      }
    };

    window.addEventListener(AUTHOR_PROFILE_UPDATED_EVENT, syncProfile);
    window.addEventListener('storage', syncProfile);
    return () => {
      window.removeEventListener(AUTHOR_PROFILE_UPDATED_EVENT, syncProfile);
      window.removeEventListener('storage', syncProfile);
    };
  }, []);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-card-dark flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div>
          <h1 className="text-lg font-bold leading-none">{t('Author Portal')}</h1>
        </div>
      </div>

      <div className="px-4 py-2">
        <NavLink
          to="/author/profile"
          className={({ isActive }) => {
            const baseClasses = "flex items-center gap-3 p-2 mb-6 rounded-lg transition-all cursor-pointer";
            const activeClasses = "bg-primary/20";
            const inactiveClasses = "hover:bg-primary/10";
            return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
          }}
        >
          <img 
            src={profile.avatarUrl}
            alt={profile.name}
            className="size-10 rounded-full ring-2 ring-primary/20 object-cover"
          />
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">{profile.name}</h2>
            <p className="text-[10px] text-slate-500">{profile.tier}</p>
          </div>
        </NavLink>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/author'}
            className={({ isActive }) => {
              const baseClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer";
              const activeClasses = "bg-primary text-on-primary shadow-glow";
              const inactiveClasses = "text-slate-400 hover:bg-primary/10 hover:text-white";
              return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
            }}
          >
            <item.icon className="size-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full rounded-lg h-10 px-4 bg-primary/10 text-slate-400 text-sm font-bold hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
        >
          <LogOut className="size-4" />
          <span>{t('Logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
