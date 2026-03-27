import React from "react";

const PasswordCard = ({
  t,
  onSubmit,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  msg,
  savingPassword,
}) => (
  <div className="glass-card p-6 border border-white/10">
    <h3 className="text-xl font-bold mb-6">{t("Change Password")}</h3>
    <form className="space-y-4" onSubmit={onSubmit}>
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => onCurrentPasswordChange(e.target.value)}
        placeholder={t("Current password")}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
        required
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => onNewPasswordChange(e.target.value)}
        placeholder={t("New password")}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
        required
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        placeholder={t("Confirm new password")}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
        required
      />

      {msg.text && (
        <p className={msg.type === "success" ? "text-emerald-400" : "text-rose-400"}>
          {msg.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={savingPassword}
          className="px-5 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl border border-primary/60 disabled:opacity-60"
        >
          {savingPassword ? t("Updating...") : t("Update Password")}
        </button>
      </div>
    </form>
  </div>
);

export default PasswordCard;
