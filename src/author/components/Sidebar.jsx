import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusSquare, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  User,
  LogOut,
  Book
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/author/dashboard' },
    { icon: BookOpen, label: 'My Books', path: '/author/my-books' },
    { icon: PlusSquare, label: 'Upload New', path: '/author/upload' },
    { icon: BarChart3, label: 'Analytics', path: '/author/analytics' },
    { icon: MessageSquare, label: 'Feedback', path: '/author/feedback' },
    { icon: Settings, label: 'Settings', path: '/author/settings' },
    { icon: User, label: 'Profile', path: '/author/profile' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0D181A] flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary rounded-lg p-2 text-slate-100">
          <Book className="size-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none">Inkwell</h1>
          <p className="text-[10px] text-accent font-medium uppercase tracking-wider mt-1">Author Studio</p>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="flex items-center gap-3 p-2 mb-6">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlEVr580N1MAJKB6IPshOgAds-VzQi3M2D3hifRUqDV9JCX-_nULM_zGDb8dVGBYdz4V2CWOYIDkgMI50DEppkE9po92vlp4lfaOQBhpFnndWtWiBrNG2jHQEjunra1G4Svlwf1l2aVjKI9saVSU3euiXQES0MBV-vqptGLQsJ6Y2WNNR3w4DKAGSLfRf_mU_mG2Yh5-_Yxf-cTJN17JAE-4nfmHaWUXvfDosDc3doTApg4pT9ebRdhc885FOqbg9HS_UjNGNPGg" 
            alt="Alex Rivera"
            className="size-10 rounded-full ring-2 ring-primary/20 object-cover"
          />
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">Alex Rivera</h2>
            <p className="text-[10px] text-slate-500">Pro Account</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-primary text-white shadow-glow' 
                : 'text-slate-400 hover:bg-primary/10 hover:text-slate-200'}
            `}
          >
            <item.icon className="size-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button className="flex items-center justify-center gap-2 w-full rounded-lg h-10 px-4 bg-primary/10 text-slate-400 text-sm font-bold hover:bg-red-500/10 hover:text-red-500 transition-all duration-200">
          <LogOut className="size-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
