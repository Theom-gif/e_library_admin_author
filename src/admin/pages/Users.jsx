


import { useCallback, useEffect, useState } from "react";
import { Eye, Search, UserRound, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { apiClient, API_BASE_URL } from "../../lib/apiClient";
import { useLanguage } from "../../i18n/LanguageContext";

/* ---------------- NORMALIZE ---------------- */
const normalizeUser = (u) => ({
  id: u?.id ?? "",
  role: u?.role ?? "User",
  first_name: u?.first_name ?? "",
  last_name: u?.last_name ?? "",
  email: u?.email ?? "",
  avatar_url:
    u?.avatar_url ||
    u?.profile_image ||
    u?.avatar ||
    "",
  created_at: u?.created_at ?? "",
});

/* ---------------- COMPONENT ---------------- */
const Users = () => {
  const { t } = useLanguage();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- FETCH USING CENTRALIZED API CLIENT ---------------- */
  const request = useCallback(async (path, { method = "GET", body } = {}) => {
    try {
      const config = { method };
      let response;

      if (method === "GET") {
        response = await apiClient.get(path, config);
      } else if (method === "DELETE") {
        response = await apiClient.delete(path, config);
      } else if (method === "POST") {
        response = await apiClient.post(path, body, config);
      } else {
        response = await apiClient.request({ ...config, url: path, data: body });
      }

      return response?.data || {};
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Request failed";
      throw new Error(message);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const role = roleFilter === "All" ? "" : roleFilter;
      const data = await request(
        `/admin/users?search=${searchQuery}&role=${role}`
      );

      setUsers((data?.data || []).map(normalizeUser));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [request, searchQuery, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setActionError("");
    setActionSuccess("");
  };

  const handleReport = async (user) => {
    const confirmed = window.confirm(
      t("Report user \"{name}\"? This will remove their account.", {
        name: `${user.first_name} ${user.last_name}`,
      }),
    );

    if (!confirmed) return;

    setActionLoadingId(user.id);
    setActionError("");
    setActionSuccess("");

    try {
      await request(`/admin/users/${user.id}`, { method: "DELETE" });

      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }

      setActionSuccess(t("User reported successfully."));
      await fetchUsers();
    } catch (err) {
      setActionError(err?.message || t("Failed to report user."));
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ---------------- AVATAR ---------------- */
  const getAvatar = (user) => {
    // DB image
    if (user.avatar_url) {
      if (user.avatar_url.startsWith("http")) {
        return user.avatar_url;
      }
      return `${API_BASE_URL}/storage/${user.avatar_url}`;
    }

    // fallback (email avatar)
    if (user.email) {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`;
    }

    return null;
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="glass-card overflow-hidden">
      {/* HEADER */}
      <div className="p-6 flex gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search users...")}
            className="pl-8 pr-4 py-2 bg-white/5 rounded-lg"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded-lg"
        >
          <option>All</option>
          <option>Admin</option>
          <option>Author</option>
          <option>User</option>
        </select>
      </div>

      {/* TABLE */}
      <div className={cn("transition duration-200", selectedUser ? "blur-[1px] pointer-events-none select-none" : "") }>
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs text-slate-400">
            <th className="px-6 py-4">Profile</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          {(actionError || actionSuccess) && (
            <tr>
              <td colSpan="5" className={cn("px-6 py-3 text-sm", actionError ? "text-red-400" : "text-emerald-400") }>
                {actionError || actionSuccess}
              </td>
            </tr>
          )}
          {loading && (
            <tr>
              <td colSpan="5" className="text-center py-6">
                Loading...
              </td>
            </tr>
          )}

          {error && (
            <tr>
              <td colSpan="5" className="text-center text-red-400">
                {error}
              </td>
            </tr>
          )}

          {users.map((user) => {
            const avatar = getAvatar(user);

            return (
              <tr key={user.id} className="hover:bg-white/5">
                {/* PROFILE */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img
                        src={avatar}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <UserRound />
                    )}

                    <div>
                      <div className="text-white font-semibold">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* ROLE */}
                <td className="px-6">{user.role}</td>

                {/* EMAIL */}
                <td className="px-6">{user.email}</td>

                {/* ACTION */}
                <td className="px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewDetail(user)}
                      disabled={actionLoadingId === user.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      <Eye size={14} />
                      {t("View")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReport(user)}
                      disabled={actionLoadingId === user.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {/* <Trash2 size={14} /> */}
                      {t("Report")}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-20 px-4">
          <div className="bg-slate-900/90 p-6 rounded-xl w-full max-w-lg relative border border-white/10 shadow-2xl">
            <button
              className="absolute top-3 right-3 rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
              onClick={() => setSelectedUser(null)}
            >
              <X />
            </button>

            <div className="flex items-center gap-4 mb-4">
              {getAvatar(selectedUser) ? (
                <img
                  src={getAvatar(selectedUser)}
                  className="w-12 h-12 rounded-full border border-white/10"
                />
              ) : (
                <UserRound />
              )}

              <div>
                <div className="text-xl text-white">
                  {selectedUser.first_name} {selectedUser.last_name}
                </div>
                <div className="text-sm text-slate-400">
                  {selectedUser.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="text-xs text-slate-500">{t("Email")}</div>
                <div className="font-medium break-all">{selectedUser.email}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="text-xs text-slate-500">{t("Role")}</div>
                <span className="mt-1 inline-flex items-center gap-2 text-xs font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-200">
                  {t(selectedUser.role)}
                </span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="text-xs text-slate-500">{t("Created At")}</div>
                <div className="font-medium">{selectedUser.created_at}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                {t("Close")}
              </button>
              <button
                type="button"
                onClick={() => handleReport(selectedUser)}
                disabled={actionLoadingId === selectedUser.id}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {/* <Trash2 size={14} /> */}
                {t("Report")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
