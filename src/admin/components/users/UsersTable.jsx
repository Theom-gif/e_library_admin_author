import React from "react";
import { Eye, UserRound } from "lucide-react";
import { cn } from "../../../lib/utils";
import { roleStyle } from "./helpers";

const UsersTable = ({
  t,
  isDark,
  users,
  loading,
  error,
  actionError,
  actionSuccess,
  actionLoadingId,
  getAvatar,
  onViewDetail,
  onOpenReportModal,
}) => (
  <table className="w-full text-left">
    <thead>
      <tr className={cn("text-xs border-t", isDark ? "text-slate-400 border-white/5" : "text-slate-600 border-slate-200")}>
        <th className="px-6 py-4">Profile</th>
        <th className="px-6 py-4">Role</th>
        <th className="px-6 py-4">Email</th>
        <th className="px-6 py-4 text-right">Action</th>
      </tr>
    </thead>
    <tbody className={cn("divide-y", isDark ? "divide-white/5" : "divide-slate-200")}>
      {(actionError || actionSuccess) && (
        <tr>
          <td colSpan="4" className={cn("px-6 py-3 text-sm", actionError ? "text-red-400" : "text-emerald-400")}>
            {actionError || actionSuccess}
          </td>
        </tr>
      )}
      {loading && (
        <tr>
          <td colSpan="4" className={cn("text-center py-8 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Loading...</td>
        </tr>
      )}
      {error && (
        <tr>
          <td colSpan="4" className="text-center py-4 text-red-400 text-sm">{error}</td>
        </tr>
      )}
      {users.map((user) => {
        const avatar = getAvatar(user);
        const rc = roleStyle(user.role);

        return (
          <tr key={user.id} className={cn("transition", isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img src={avatar} className={cn("w-10 h-10 rounded-full object-cover border", isDark ? "border-white/10" : "border-slate-200")} onError={(e) => (e.target.style.display = "none")} />
                ) : (
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-indigo-500/20" : "bg-indigo-100")}>
                    <UserRound size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
                  </div>
                )}
                <div>
                  <div className={cn("font-semibold text-sm", isDark ? "text-white" : "text-slate-900")}>{user.first_name} {user.last_name}</div>
                  <div className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-500")}>{user.email}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                {user.role}
              </span>
            </td>
            <td className={cn("px-6 py-4 text-sm", isDark ? "text-slate-400" : "text-slate-600")}>{user.email}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetail(user)}
                  disabled={actionLoadingId === user.id}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
                  style={{ border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)" }}
                >
                  <Eye size={13} />{t("View")}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenReportModal(user)}
                  disabled={actionLoadingId === user.id}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  style={{ border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)" }}
                >
                  {t("Report")}
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

export default UsersTable;
