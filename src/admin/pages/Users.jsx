import { useCallback, useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { apiClient, API_BASE_URL } from "../../lib/apiClient";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";
import ReportUserModal from "../components/users/ReportUserModal";
import UserProfileModal from "../components/users/UserProfileModal";
import UsersTable from "../components/users/UsersTable";
import UsersToolbar from "../components/users/UsersToolbar";
import { normalizeUser } from "../components/users/helpers";

const Users = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportUser, setReportUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(async (path, { method = "GET", body } = {}) => {
    try {
      let res;
      if (method === "GET") res = await apiClient.get(path);
      else if (method === "DELETE") res = await apiClient.delete(path);
      else if (method === "POST") res = await apiClient.post(path, body);
      else res = await apiClient.request({ method, url: path, data: body });
      return res?.data || {};
    } catch (err) {
      throw new Error(err?.response?.data?.message || err?.message || "Request failed");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const role = roleFilter === "All" ? "" : roleFilter;
      const data = await request(`/admin/users?search=${searchQuery}&role=${role}`);
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

  const handleOpenReportModal = (user) => {
    setReportUser(user);
    setActionError("");
    setActionSuccess("");
  };

  const handleReport = async (user) => {
    setActionLoadingId(user.id);
    setActionError("");
    setActionSuccess("");
    try {
      await request(`/admin/users/${user.id}`, { method: "DELETE" });
      if (selectedUser?.id === user.id) setSelectedUser(null);
      if (reportUser?.id === user.id) setReportUser(null);
      setActionSuccess(t("User reported successfully."));
      await fetchUsers();
    } catch (err) {
      setActionError(err?.message || t("Failed to report user."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const getAvatar = (user) => {
    if (user.avatar_url)
      return user.avatar_url.startsWith("http")
        ? user.avatar_url
        : `${API_BASE_URL}/storage/${user.avatar_url}`;
    if (user.email)
      return `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`;
    return null;
  };

  const styles = {
    modalOverlayStyle: {
      background: isDark ? "rgba(4,6,16,0.85)" : "rgba(148,163,184,0.38)",
      backdropFilter: "blur(10px)",
    },
    profileModalShellStyle: {
      background: isDark
        ? "linear-gradient(145deg,#080d1a 0%,#0c1222 50%,#080d1a 100%)"
        : "linear-gradient(145deg,#ffffff 0%,#f5f8ff 50%,#edf3ff 100%)",
      border: isDark ? "1px solid rgba(99,102,241,0.22)" : "1px solid rgba(99,102,241,0.3)",
      boxShadow: isDark
        ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)"
        : "0 22px 56px rgba(15,23,42,0.2), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.7)",
    },
    reportModalShellStyle: {
      background: isDark
        ? "linear-gradient(145deg,#080d1a 0%,#0c1222 50%,#080d1a 100%)"
        : "linear-gradient(145deg,#ffffff 0%,#fff7f7 55%,#fff1f1 100%)",
      border: isDark ? "1px solid rgba(239,68,68,0.24)" : "1px solid rgba(239,68,68,0.34)",
      boxShadow: isDark
        ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.09), inset 0 1px 0 rgba(255,255,255,0.04)"
        : "0 22px 56px rgba(15,23,42,0.2), 0 0 0 1px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.75)",
    },
    softCardStyle: {
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.04)",
      border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(15,23,42,0.1)",
    },
    panelDividerStyle: {
      borderRight: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(15,23,42,0.08)",
    },
    progressTrackStyle: {
      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.12)",
    },
  };

  return (
    <div className="glass-card overflow-hidden">
      <UsersToolbar
        t={t}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      <div className={cn("transition duration-200", selectedUser || reportUser ? "blur-[1px] pointer-events-none select-none" : "")}>
        <UsersTable
          t={t}
          isDark={isDark}
          users={users}
          loading={loading}
          error={error}
          actionError={actionError}
          actionSuccess={actionSuccess}
          actionLoadingId={actionLoadingId}
          getAvatar={getAvatar}
          onViewDetail={handleViewDetail}
          onOpenReportModal={handleOpenReportModal}
        />
      </div>

      <UserProfileModal
        t={t}
        isDark={isDark}
        selectedUser={selectedUser}
        actionLoadingId={actionLoadingId}
        getAvatar={getAvatar}
        onClose={() => setSelectedUser(null)}
        onOpenReportModal={handleOpenReportModal}
        styles={styles}
      />

      <ReportUserModal
        t={t}
        reportUser={reportUser}
        getAvatar={getAvatar}
        actionLoadingId={actionLoadingId}
        onClose={() => setReportUser(null)}
        onConfirmReport={handleReport}
        styles={styles}
      />
    </div>
  );
};

export default Users;
