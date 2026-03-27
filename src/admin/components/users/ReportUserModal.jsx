import React from "react";
import { UserRound, X } from "lucide-react";
import { accessLabel, roleStyle } from "./helpers";

const ReportUserModal = ({
  t,
  reportUser,
  getAvatar,
  actionLoadingId,
  onClose,
  onConfirmReport,
  styles,
}) => {
  if (!reportUser) return null;

  const avatar = getAvatar(reportUser);
  const rc = roleStyle(reportUser.role);
  const fullName = `${reportUser.first_name} ${reportUser.last_name}`.trim();
  const joinDate = reportUser.created_at
    ? new Date(reportUser.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={styles.modalOverlayStyle} onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden" style={styles.reportModalShellStyle} onClick={(e) => e.stopPropagation()}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#7f1d1d,#dc2626,#ef4444,#dc2626,#7f1d1d)" }} />

        <button onClick={onClose} className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-110">
          <X size={15} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
          <div className="p-7" style={styles.panelDividerStyle}>
            <div className="flex items-start gap-5 mb-7">
              <div className="relative flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="h-20 w-20 rounded-2xl object-cover" style={{ border: "2px solid rgba(239,68,68,0.45)", boxShadow: "0 0 0 4px rgba(239,68,68,0.1), 0 8px 24px rgba(0,0,0,0.5)" }} />
                ) : (
                  <div className="h-20 w-20 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7f1d1d,#dc2626)", border: "2px solid rgba(239,68,68,0.45)", boxShadow: "0 0 0 4px rgba(239,68,68,0.1)" }}>
                    <UserRound size={34} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">{fullName || t("Unknown User")}</h2>
                  <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase" style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                    {reportUser.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{reportUser.email || "—"}</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.28)" }}>
              <p className="text-sm font-semibold text-red-300 mb-1">{t("Confirm report action")}</p>
              <p className="text-sm text-slate-300">
                {t('Are you sure you want to report "{name}"? This will remove their account.', { name: fullName || reportUser.email || t("this user") })}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={styles.softCardStyle}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Created At")}</span>
                <p className="text-sm font-semibold text-slate-200 mt-1">{joinDate}</p>
              </div>
              <div className="rounded-xl p-4" style={styles.softCardStyle}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Access Level")}</span>
                <p className="text-sm font-semibold text-slate-200 mt-1">{accessLabel(reportUser.role)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between gap-5">
            <div className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.24)" }}>
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
                onClick={() => onConfirmReport(reportUser)}
                disabled={actionLoadingId === reportUser.id}
                className="w-full rounded-xl px-5 py-2 text-sm font-semibold text-red-200 transition-all duration-200 hover:bg-red-500/25 hover:scale-[1.01] disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.16)", border: "1px solid rgba(239,68,68,0.4)" }}
              >
                {actionLoadingId === reportUser.id ? t("Reporting...") : t("Confirm Report")}
              </button>
              <button
                type="button"
                onClick={onClose}
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
};

export default ReportUserModal;
