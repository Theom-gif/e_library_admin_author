import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Moon, Search, Sun } from 'lucide-react';

const Layout = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-background-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 bg-background-dark/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Search your library..." 
                className="w-full bg-card-dark border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
              className="p-2 text-slate-400 hover:bg-primary/20 rounded-full transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <button className="relative p-2 text-slate-400 hover:bg-primary/20 rounded-full transition-colors">
              <Bell className="size-5" />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-background-dark"></span>
            </button>
            <div className="h-8 w-px bg-white/5 mx-2"></div>
            <button className="flex items-center gap-2 p-1 pr-3 hover:bg-primary/20 rounded-full transition-colors">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0RzSHvwusKJJ8Uiy4xND7QQ2yipdArKFQnDJweU3WQEfiV8wKgjgMQMMKMQzGmhFoUMyTzP7rgAEHvXhz8Z_VAPF-PZzgIcOS18irbz_LadisSfRTbiWe_om5i0YbNT5ECtkLNqj5mfpNwATDHm5gJ5rI0XefWhIBqf6q9FklhYTezjW4hQyJBHuimt6X0_I5Xs2t8xYBY87IGSO2uFquxTxR_EY4_kB1CCGA_3xvqlNXpDXRoNsHHm6IFSjqc3WrkgnCqZG4zg" 
                alt="User" 
                className="size-8 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-slate-300">Alex Rivera</span>
            </button>
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
