import React from "react";
import { Search } from "lucide-react";

const UsersToolbar = ({ t, searchQuery, onSearchQueryChange, roleFilter, onRoleFilterChange }) => (
  <div className="p-6 flex gap-4">
    <div className="relative">
      <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
      <input
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={t("Search users...")}
        className="pl-8 pr-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm focus:outline-none focus:border-indigo-500"
      />
    </div>
    <select
      value={roleFilter}
      onChange={(e) => onRoleFilterChange(e.target.value)}
      className="bg-gray-800 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none"
    >
      <option>All</option>
      <option>Admin</option>
      <option>Author</option>
      <option>User</option>
    </select>
  </div>
);

export default UsersToolbar;
