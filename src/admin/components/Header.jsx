import { Bell, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

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
  const title = TITLES[location.pathname] || "Admin";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-slate-400">
          Admin control center
          {user ? ` - ${user.name} (${user.role})` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-xl bg-white/5 p-2.5 text-slate-300 hover:bg-white/10">
          <Bell size={18} />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
