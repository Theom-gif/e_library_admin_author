import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusSquare, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const PROFILE_STORAGE_KEY = 'author_studio_profile';
const PROFILE_UPDATED_EVENT = 'author-profile-updated';

const defaultProfile = {
  name: 'Alex Rivera',
  tier: 'Pro Author',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAlEVr580N1MAJKB6IPshOgAds-VzQi3M2D3hifRUqDV9JCX-_nULM_zGDb8dVGBYdz4V2CWOYIDkgMI50DEppkE9po92vlp4lfaOQBhpFnndWtWiBrNG2jHQEjunra1G4Svlwf1l2aVjKI9saVSU3euiXQES0MBV-vqptGLQsJ6Y2WNNR3w4DKAGSLfRf_mU_mG2Yh5-_Yxf-cTJN17JAE-4nfmHaWUXvfDosDc3doTApg4pT9ebRdhc885FOqbg9HS_UjNGNPGg',
};

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState(() => {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    try {
      return { ...defaultProfile, ...JSON.parse(raw) };
    } catch {
      return defaultProfile;
    }
  });

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/author/dashboard' },
    { icon: BookOpen, label: 'My Books', path: '/author/my-books' },
    { icon: PlusSquare, label: 'Upload New', path: '/author/upload' },
    { icon: BarChart3, label: 'Analytics', path: '/author/analytics' },
    { icon: MessageSquare, label: 'Feedback', path: '/author/feedback' },
    { icon: Settings, label: 'Settings', path: '/author/settings' },
    { icon: User, label: 'Profile', path: '/author/profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  React.useEffect(() => {
    const syncProfile = () => {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) {
        setProfile(defaultProfile);
        return;
      }
      try {
        setProfile({ ...defaultProfile, ...JSON.parse(raw) });
      } catch {
        setProfile(defaultProfile);
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, syncProfile);
    window.addEventListener('storage', syncProfile);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncProfile);
      window.removeEventListener('storage', syncProfile);
    };
  }, []);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-card-dark flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div>
          <h1 className="text-lg font-bold leading-none">Author Portal</h1>
        </div>
      </div>

      <div className="px-4 py-2">
        <NavLink
          to="/author/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 mb-6 rounded-lg transition-all ${
              isActive
                ? 'bg-primary/20'
                : 'hover:bg-primary/10'
            }`
          }
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
            end={item.path === '/author/dashboard'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-primary text-on-primary shadow-glow' 
                : 'text-slate-400 hover:bg-primary/10 hover:text-[color:var(--text)]'}
            `}
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
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
