import { MoreVertical, Plus, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { USERS } from "../data/mockData";

const Users = () => {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-64"
            />
          </div>
          <select className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option>All Roles</option>
            <option>Admin</option>
            <option>Author</option>
            <option>Reader</option>
          </select>
        </div>
        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          <Plus size={18} />
          Add User
        </button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Joined</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {USERS.map((user) => (
            <tr key={user.id} className="hover:bg-white/2 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-bold">{user.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-400 text-sm">{user.email}</td>
              <td className="px-6 py-4">
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-1 rounded-lg",
                    user.role === "Admin"
                      ? "text-purple-400 bg-purple-400/10"
                      : user.role === "Author"
                        ? "text-pink-400 bg-pink-400/10"
                        : "text-blue-400 bg-blue-400/10",
                  )}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", user.status === "Active" ? "bg-green-500" : "bg-slate-500")} />
                  <span className="text-sm font-medium">{user.status}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-400 text-sm">{user.joined}</td>
              <td className="px-6 py-4 text-right">
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
