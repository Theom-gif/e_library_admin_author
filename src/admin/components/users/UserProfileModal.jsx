import React from "react";
import { BarChart2, BookOpen, Calendar, Lock, Mail, Shield, TrendingUp, UserRound, X, Zap } from "lucide-react";
import CircleProgress from "./CircleProgress";
import { accessLabel, roleStyle } from "./helpers";

const UserProfileModal = ({
  t,
  isDark,
  selectedUser,
  actionLoadingId,
  getAvatar,
  onClose,
  onOpenReportModal,
  styles,
}) => {
  if (!selectedUser) return null;

  const avatar = getAvatar(selectedUser);
  const rc = roleStyle(selectedUser.role);
  const joinDate = selectedUser.created_at
    ? new Date(selectedUser.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const joinTime = selectedUser.created_at
    ? new Date(selectedUser.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={styles.modalOverlayStyle} onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden" style={styles.profileModalShellStyle} onClick={(e) => e.stopPropagation()}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#4338ca,#6366f1,#818cf8,#6366f1,#4338ca)" }} />
        <button onClick={onClose} className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-110">
          <X size={15} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
          <div className="p-7" style={styles.panelDividerStyle}>
            <div className="flex items-start gap-5 mb-7">
              <div className="relative flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="h-20 w-20 rounded-2xl object-cover" style={{ border: "2px solid rgba(99,102,241,0.5)", boxShadow: "0 0 0 4px rgba(99,102,241,0.1), 0 8px 24px rgba(0,0,0,0.5)" }} />
                ) : (
                  <div className="h-20 w-20 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3730a3,#6366f1)", border: "2px solid rgba(99,102,241,0.5)", boxShadow: "0 0 0 4px rgba(99,102,241,0.1)" }}>
                    <UserRound size={34} className="text-white" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full" style={{ background: "#22c55e", border: `2px solid ${isDark ? "#080d1a" : "#ffffff"}`, boxShadow: "0 0 8px rgba(34,197,94,0.7)" }} />
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">{selectedUser.first_name} {selectedUser.last_name}</h2>
                  <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase" style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                    {selectedUser.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>

                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={onClose} className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-200 transition-all duration-200 hover:text-white hover:scale-[1.02]" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                    {t("Close")}
                  </button>
                  <button type="button" onClick={() => { onClose(); onOpenReportModal(selectedUser); }} disabled={actionLoadingId === selectedUser.id} className="rounded-xl px-5 py-2 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20 hover:scale-[1.02] disabled:opacity-50" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    {t("Report")}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
              <div className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg" style={styles.softCardStyle}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.18)" }}><Calendar size={13} className="text-indigo-400" /></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Created At")}</span>
                </div>
                <p className="text-sm font-semibold text-slate-200 leading-tight">{joinDate}</p>
                {joinTime && <p className="text-xs text-slate-600 mt-0.5">{joinTime}</p>}
              </div>

              <div className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg" style={styles.softCardStyle}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.18)" }}><Shield size={13} className="text-indigo-400" /></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Access Level")}</span>
                </div>
                <p className="text-sm font-semibold text-slate-200 leading-tight">{accessLabel(selectedUser.role)}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedUser.role}</p>
              </div>

              <div className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg" style={styles.softCardStyle}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}><Zap size={13} className="text-emerald-400" /></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t("Status")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                  <p className="text-sm font-semibold text-emerald-400">Active</p>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">Online Now</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("Recent Publications")}</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { cat: "Fiction", title: "The Silent Horizon", desc: "A gripping tale of mystery and discovery." },
                  { cat: "Technology", title: "Code & Consciousness", desc: "Exploring AI through a human lens." },
                  { cat: "Self-Help", title: "Mindful Productivity", desc: "Strategies for deep focus and clarity." },
                ].map((pub, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:scale-[1.01] cursor-default" style={styles.softCardStyle}>
                    <div className="h-12 w-9 flex-shrink-0 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg,${["#4338ca", "#0e7490", "#065f46"][i]},${["#6366f1", "#22d3ee", "#34d399"][i]})` }}>
                      <BookOpen size={14} className="text-white/80" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: ["#818cf8", "#22d3ee", "#34d399"][i] }}>{pub.cat}</span>
                      <p className="text-sm font-bold text-white leading-tight truncate">{pub.title}</p>
                      <p className="text-xs text-slate-600 truncate">{pub.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <div className="rounded-2xl p-5" style={styles.softCardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={14} className="text-indigo-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("Activity Overview")}</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Total Posts", value: "142", icon: BookOpen, color: "#818cf8", pct: 71 },
                  { label: "Average Reach", value: "8.4K", icon: TrendingUp, color: "#34d399", pct: 84 },
                  { label: "Engagement", value: "6.2%", icon: Mail, color: "#f472b6", pct: 62 },
                ].map(({ label, value, icon: Icon, color, pct }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} style={{ color }} />
                        <span className="text-xs text-slate-500">{label}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{value}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full" style={styles.progressTrackStyle}>
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}99,${color})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5 flex flex-col items-center text-center" style={styles.softCardStyle}>
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
};

export default UserProfileModal;
