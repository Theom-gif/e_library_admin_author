import {
  BookOpen,
  CheckSquare,
  Grid,
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
  Activity,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/admin/categories", label: "Categories", icon: Grid },
  { to: "/admin/books", label: "Books", icon: BookOpen },
  { to: "/admin/readers", label: "Top Readers", icon: Trophy },
  { to: "/admin/monitor", label: "System Monitor", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-white/5 bg-bg-sidebar p-5">
      <div className="mb-6 text-lg font-bold">Admin Portal </div>
      <nav className="space-y-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-purple-500/15 text-white border border-purple-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
