import { useCallback, useEffect, useState } from "react";
import {
  BarChart2, BookOpen, Calendar, Eye, Lock, Mail,
  Search, Shield, TrendingUp, UserRound, X, Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { apiClient, API_BASE_URL } from "../../lib/apiClient";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";

/* ─── helpers ─────────────────────────────────────────────── */
const normalizeUser = (u) => ({
  id: u?.id ?? "",
  role: u?.role ?? "User",
  first_name: u?.first_name ?? "",
  last_name: u?.last_name ?? "",
  email: u?.email ?? "",
  avatar_url: u?.avatar_url || u?.profile_image || u?.avatar || "",
  created_at: u?.created_at ?? "",
});

const roleStyle = (role) => {
  if (role === "Admin")  return { bg: "rgba(239,68,68,0.14)",  border: "rgba(239,68,68,0.35)",  text: "#fca5a5" };
  if (role === "Author") return { bg: "rgba(234,179,8,0.14)",  border: "rgba(234,179,8,0.35)",  text: "#fde047" };
  return                        { bg: "rgba(99,102,241,0.14)", border: "rgba(99,102,241,0.35)", text: "#a5b4fc" };
};

const accessLabel = (role) => {
  if (role === "Admin")  return "System Administrator";
  if (role === "Author") return "Content Creator";
  return "Standard Reader";
};

/* circular SVG progress */
const CircleProgress = ({ value = 85, size = 88, stroke = 7 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#prog)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <defs>
        <linearGradient id="prog" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* ─── main component ──────────────────────────────────────── */
const Users = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const [users, setUsers]               = useState([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [roleFilter, setRoleFilter]     = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportUser, setReportUser]     = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError]   = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const request = useCallback(async (path, { method = "GET", body } = {}) => {
    try {
      let res;
      if (method === "GET")    res = await apiClient.get(path);
      else if (method === "DELETE") res = await apiClient.delete(path);
      else if (method === "POST")   res = await apiClient.post(path, body);
      else res = await apiClient.request({ method, url: path, data: body });
      return res?.data || {};
    } catch (err) {
      throw new Error(err?.response?.data?.message || err?.message || "Request failed");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const role = roleFilter === "All" ? "" : roleFilter;
      const data = await request(`/admin/users?search=${searchQuery}&role=${role}`);
      setUsers((data?.data || []).map(normalizeUser));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [request, searchQuery, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleViewDetail = (user) => {
    setSelectedUser(user); setActionError(""); setActionSuccess("");
  };

  const handleOpenReportModal = (user) => {
    setReportUser(user); setActionError(""); setActionSuccess("");
  };

  const handleReport = async (user) => {
    setActionLoadingId(user.id); setActionError(""); setActionSuccess("");
    try {
      await request(`/admin/users/${user.id}`, { method: "DELETE" });
      if (selectedUser?.id === user.id) setSelectedUser(null);
      if (reportUser?.id === user.id) setReportUser(null);
      setActionSuccess(t("User reported successfully."));
      await fetchUsers();
    } catch (err) { setActionError(err?.message || t("Failed to report user.")); }
    finally { setActionLoadingId(null); }
  };

  const getAvatar = (user) => {
    if (user.avatar_url)
      return user.avatar_url.startsWith("http") ? user.avatar_url : `${API_BASE_URL}/storage/${user.avatar_url}`;
    if (user.email) return `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`;
    return null;
  };

  const modalOverlayStyle = {
    background: isDark ? "rgba(4,6,16,0.85)" : "rgba(148,163,184,0.38)",
    backdropFilter: "blur(10px)",
  };
  const profileModalShellStyle = {
    background: isDark
      ? "linear-gradient(145deg,#080d1a 0%,#0c1222 50%,#080d1a 100%)"
      : "linear-gradient(145deg,#ffffff 0%,#f5f8ff 50%,#edf3ff 100%)",
    border: isDark ? "1px solid rgba(99,102,241,0.22)" : "1px solid rgba(99,102,241,0.3)",
    boxShadow: isDark
      ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 22px 56px rgba(15,23,42,0.2), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.7)",
  };
  const reportModalShellStyle = {
    background: isDark
      ? "linear-gradient(145deg,#080d1a 0%,#0c1222 50%,#080d1a 100%)"
      : "linear-gradient(145deg,#ffffff 0%,#fff7f7 55%,#fff1f1 100%)",
    border: isDark ? "1px solid rgba(239,68,68,0.24)" : "1px solid rgba(239,68,68,0.34)",
    boxShadow: isDark
      ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.09), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 22px 56px rgba(15,23,42,0.2), 0 0 0 1px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.75)",
  };
  const softCardStyle = {
    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(15,23,42,0.1)",
  };
  const panelDividerStyle = { borderRight: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(15,23,42,0.08)" };
  const progressTrackStyle = { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.12)" };

  /* ── table ── */
  return (
    <div className="glass-card overflow-hidden">
      {/* header */}
      <div className="p-6 flex gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search users...")}
            className="pl-8 pr-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-gray-800 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none">
          <option>All</option><option>Admin</option><option>Author</option><option>User</option>
        </select>
      </div>

      <div className={cn("transition duration-200", (selectedUser || reportUser) ? "blur-[1px] pointer-events-none select-none" : "")}>
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-slate-400 border-t border-white/5">
              <th className="px-6 py-4">Profile</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(actionError || actionSuccess) && (
              <tr><td colSpan="4" className={cn("px-6 py-3 text-sm", actionError ? "text-red-400" : "text-emerald-400")}>{actionError || actionSuccess}</td></tr>
            )}
            {loading && <tr><td colSpan="4" className="text-center py-8 text-slate-400 text-sm">Loading...</td></tr>}
            {error   && <tr><td colSpan="4" className="text-center py-4 text-red-400 text-sm">{error}</td></tr>}
            {users.map((user) => {
              const avatar = getAvatar(user);
              const rc = roleStyle(user.role);
              return (
                <tr key={user.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {avatar
                        ? <img src={avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" onError={(e) => (e.target.style.display = "none")} />
                        : <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center"><UserRound size={18} className="text-indigo-400" /></div>
                      }
                      <div>
                        <div className="text-white font-semibold text-sm">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>{user.role}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => handleViewDetail(user)} disabled={actionLoadingId === user.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
                        style={{ border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)" }}>
                        <Eye size={13} />{t("View")}
                      </button>
                      <button type="button" onClick={() => handleOpenReportModal(user)} disabled={actionLoadingId === user.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                        style={{ border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)" }}>
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

      {/* ── PREMIUM PROFILE MODAL ── */}
      {selectedUser && (() => {
        const avatar  = getAvatar(selectedUser);
        const rc      = roleStyle(selectedUser.role);
        const joinDate = selectedUser.created_at
          ? new Date(selectedUser.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
          : "—";
        const joinTime = selectedUser.created_at
          ? new Date(selectedUser.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
          : "";

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={modalOverlayStyle}
            onClick={() => setSelectedUser(null)}
          >
            {/* modal shell */}
            <div
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
              style={profileModalShellStyle}
              onClick={(e) => e.stopPropagation()}
            >
              {/* top gradient bar */}
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#4338ca,#6366f1,#818cf8,#6366f1,#4338ca)" }} />

              {/* close */}
              <button onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-110">
                <X size={15} />
              </button>

              {/* ── two-column body ── */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">

                {/* ── LEFT: main profile card ── */}
                <div className="p-7" style={panelDividerStyle}>

                  {/* avatar + name */}
                  <div className="flex items-start gap-5 mb-7">
                    <div className="relative flex-shrink-0">
                      {avatar
                        ? <img src={avatar} alt="avatar" className="h-20 w-20 rounded-2xl object-cover"
                            style={{ border: "2px solid rgba(99,102,241,0.5)", boxShadow: "0 0 0 4px rgba(99,102,241,0.1), 0 8px 24px rgba(0,0,0,0.5)" }} />
                        : <div className="h-20 w-20 rounded-2xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#3730a3,#6366f1)", border: "2px solid rgba(99,102,241,0.5)", boxShadow: "0 0 0 4px rgba(99,102,241,0.1)" }}>
                            <UserRound size={34} className="text-white" />
                          </div>
                      }
                      {/* online dot */}
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full"
                        style={{ background: "#22c55e", border: `2px solid ${isDark ? "#080d1a" : "#ffffff"}`, boxShadow: "0 0 8px rgba(34,197,94,0.7)" }} />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </h2>
                        <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase"
                          style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                          {selectedUser.role}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>

                      {/* action buttons */}
                      <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => setSelectedUser(null)}
                          className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-200 transition-all duration-200 hover:text-white hover:scale-[1.02]"
                          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                          {t("Close")}
                        </button>
                        <button type="button" onClick={() => { setSelectedUser(null); handleOpenReportModal(selectedUser); }} disabled={actionLoadingId === selectedUser.id}
                          className="rounded-xl px-5 py-2 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20 hover:scale-[1.02] disabled:opacity-50"
                          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                          {t("Report")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3 info cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
                    {/* Created At */}
                    <div className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      style={softCardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.18)" }}>
                          <Calendar size={13} className="text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Created At")}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200 leading-tight">{joinDate}</p>
                      {joinTime && <p className="text-xs text-slate-600 mt-0.5">{joinTime}</p>}
                    </div>

                    {/* Access Level */}
                    <div className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      style={softCardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.18)" }}>
                          <Shield size={13} className="text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Access Level")}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200 leading-tight">{accessLabel(selectedUser.role)}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{selectedUser.role}</p>
                    </div>

                    {/* Status */}
                    <div className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      style={softCardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
                          <Zap size={13} className="text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Status")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                        <p className="text-sm font-semibold text-emerald-400">Active</p>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">Online Now</p>
                    </div>
                  </div>

                  {/* Recent Publications */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={14} className="text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("Recent Publications")}</h3>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { cat: "Fiction",     title: "The Silent Horizon",    desc: "A gripping tale of mystery and discovery." },
                        { cat: "Technology",  title: "Code & Consciousness",  desc: "Exploring AI through a human lens." },
                        { cat: "Self-Help",   title: "Mindful Productivity",  desc: "Strategies for deep focus and clarity." },
                      ].map((pub, i) => (
                        <div key={i}
                          className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:scale-[1.01] cursor-default"
                          style={softCardStyle}>
                          {/* thumbnail placeholder */}
                          <div className="h-12 w-9 flex-shrink-0 rounded-lg flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg,${["#4338ca","#0e7490","#065f46"][i]},${["#6366f1","#22d3ee","#34d399"][i]})` }}>
                            <BookOpen size={14} className="text-white/80" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: ["#818cf8","#22d3ee","#34d399"][i] }}>{pub.cat}</span>
                            <p className="text-sm font-bold text-white leading-tight truncate">{pub.title}</p>
                            <p className="text-xs text-slate-600 truncate">{pub.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: stats + security ── */}
                <div className="p-6 flex flex-col gap-5">

                  {/* Activity Overview */}
                  <div className="rounded-2xl p-5"
                    style={softCardStyle}>
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart2 size={14} className="text-indigo-400" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("Activity Overview")}</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Total Posts",   value: "142",  icon: BookOpen,   color: "#818cf8", pct: 71 },
                        { label: "Average Reach", value: "8.4K", icon: TrendingUp,  color: "#34d399", pct: 84 },
                        { label: "Engagement",    value: "6.2%", icon: Mail,        color: "#f472b6", pct: 62 },
                      ].map(({ label, value, icon: Icon, color, pct }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Icon size={12} style={{ color }} />
                              <span className="text-xs text-slate-500">{label}</span>
                            </div>
                            <span className="text-sm font-bold text-white">{value}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full" style={progressTrackStyle}>
                            <div className="h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}99,${color})` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security Score */}
                  <div className="rounded-2xl p-5 flex flex-col items-center text-center"
                    style={softCardStyle}>
                    <div className="flex items-center gap-2 mb-4 self-start">
                      <Lock size={14} className="text-indigo-400" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("Security Score")}</h3>
                    </div>
                    <div className="relative flex items-center justify-center mb-3">
                      <CircleProgress value={85} />
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-white">85</span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">/ 100</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-indigo-300">Profile Security: Excellent</p>
                    <p className="text-xs text-slate-600 mt-1">All checks passed</p>

                    {/* mini checks */}
                    <div className="mt-4 w-full space-y-2">
                      {["Email Verified", "2FA Enabled", "Strong Password"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {reportUser && (() => {
        const avatar = getAvatar(reportUser);
        const rc = roleStyle(reportUser.role);
        const fullName = `${reportUser.first_name} ${reportUser.last_name}`.trim();
        const joinDate = reportUser.created_at
          ? new Date(reportUser.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
          : "—";

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={modalOverlayStyle}
            onClick={() => setReportUser(null)}
          >
            <div
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
              style={reportModalShellStyle}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#7f1d1d,#dc2626,#ef4444,#dc2626,#7f1d1d)" }} />

              <button onClick={() => setReportUser(null)}
                className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-110">
                <X size={15} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
                <div className="p-7" style={panelDividerStyle}>
                  <div className="flex items-start gap-5 mb-7">
                    <div className="relative flex-shrink-0">
                      {avatar
                        ? <img src={avatar} alt="avatar" className="h-20 w-20 rounded-2xl object-cover"
                            style={{ border: "2px solid rgba(239,68,68,0.45)", boxShadow: "0 0 0 4px rgba(239,68,68,0.1), 0 8px 24px rgba(0,0,0,0.5)" }} />
                        : <div className="h-20 w-20 rounded-2xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#7f1d1d,#dc2626)", border: "2px solid rgba(239,68,68,0.45)", boxShadow: "0 0 0 4px rgba(239,68,68,0.1)" }}>
                            <UserRound size={34} className="text-white" />
                          </div>
                      }
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">{fullName || t("Unknown User")}</h2>
                        <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase"
                          style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                          {reportUser.role}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{reportUser.email || "—"}</p>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 mb-4"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.28)" }}>
                    <p className="text-sm font-semibold text-red-300 mb-1">{t("Confirm report action")}</p>
                    <p className="text-sm text-slate-300">
                      {t('Are you sure you want to report "{name}"? This will remove their account.', { name: fullName || reportUser.email || t("this user") })}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl p-4"
                      style={softCardStyle}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Created At")}</span>
                      <p className="text-sm font-semibold text-slate-200 mt-1">{joinDate}</p>
                    </div>
                    <div className="rounded-xl p-4"
                      style={softCardStyle}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Access Level")}</span>
                      <p className="text-sm font-semibold text-slate-200 mt-1">{accessLabel(reportUser.role)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col justify-between gap-5">
                  <div className="rounded-2xl p-5"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.24)" }}>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-3">{t("Report Impact")}</h3>
                    <div className="space-y-2 text-xs text-slate-300">
                      <p>{t("This action removes the user account from the platform.")}</p>
                      <p>{t("User data access will be revoked immediately.")}</p>
                      <p>{t("Please confirm before continuing.")}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleReport(reportUser)}
                      disabled={actionLoadingId === reportUser.id}
                      className="w-full rounded-xl px-5 py-2 text-sm font-semibold text-red-200 transition-all duration-200 hover:bg-red-500/25 hover:scale-[1.01] disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.16)", border: "1px solid rgba(239,68,68,0.4)" }}
                    >
                      {actionLoadingId === reportUser.id ? t("Reporting...") : t("Confirm Report")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportUser(null)}
                      className="w-full rounded-xl px-5 py-2 text-sm font-semibold text-slate-200 transition-all duration-200 hover:text-white hover:scale-[1.01]"
                      style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)" }}
                    >
                      {t("Cancel")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Users;
