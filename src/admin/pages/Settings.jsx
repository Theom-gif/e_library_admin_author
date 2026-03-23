import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiClient } from "../../lib/apiClient";

const defaultNotifications = [
  { key: "new_reader", label: "New Reader", desc: "When someone starts reading your book", active: true },
  { key: "book_approved", label: "Book Approved", desc: "When admin approves your submission", active: true },
  { key: "weekly_report", label: "Weekly Report", desc: "Weekly analytics summary email", active: false },
  { key: "new_comment", label: "New Comment", desc: "When someone comments on your book", active: true },
];

const ADMIN_THEME_KEY = "admin-theme";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "km", label: "Khmer" },
  { value: "zh", label: "Chinese (China)" },
];

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const savedTheme = window.localStorage.getItem(ADMIN_THEME_KEY);
    return savedTheme === "light" ? "light" : "dark";
  });
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotifications);
  const { language, setLanguage, t } = useLanguage();
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ADMIN_THEME_KEY, theme);
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      return;
    }
    document.documentElement.removeAttribute("data-theme");
  }, [theme]);

  const themeOptions = useMemo(
    () => [
      { value: "dark", label: t("Dark"), helper: t("High contrast, reduced glare.") },
      { value: "light", label: t("Light"), helper: t("Bright, document-like surfaces.") },
    ],
    [t]
  );

  const handleToggleNotification = (key) => {
    setNotificationPrefs((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, active: !item.active } : item
      )
    );
  };

  const saveNotifications = async () => {
    setSavingPrefs(true);
    setMsg({ type: "", text: "" });
    try {
      await apiClient.post("/admin/settings/notifications", {
        notifications: notificationPrefs.reduce(
          (acc, item) => ({ ...acc, [item.key]: item.active }),
          {}
        ),
      });
      setMsg({ type: "success", text: t("Notification preferences saved.") });
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          t("Failed to save preferences."),
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setSavingPassword(true);

    try {
      const { data } = await apiClient.post("/admin/settings/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!data?.success) {
        setMsg({
          type: "error",
          text: data?.message || t("Password update failed."),
        });
        setSavingPassword(false);
        return;
      }

      setMsg({
        type: "success",
        text: data?.message || t("Password updated successfully."),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.message || t("Network error. Please try again."),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t("Control Center")}</p>
            <h2 className="text-2xl font-bold">{t("Settings & Preferences")}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {t("Tune notifications, appearance, and security for your admin workspace.")}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("Live")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Notifications */}
          <div className="glass-card p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">{t("Notifications")}</h3>
                <p className="text-sm text-slate-500">
                  {t("Choose what you want to hear about and where.")}
                </p>
              </div>
              <button
                onClick={saveNotifications}
                disabled={savingPrefs}
                className="px-4 py-2 rounded-lg bg-primary text-white font-semibold border border-primary/60 hover:bg-primary/90 disabled:opacity-60"
              >
                {savingPrefs ? t("Saving...") : t("Save")}
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {notificationPrefs.map((item) => (
                <label
                  key={item.key}
                  className="py-4 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <p className="font-semibold">{t(item.label)}</p>
                    <p className="text-sm text-slate-500">{t(item.desc)}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={() => handleToggleNotification(item.key)}
                    className="peer sr-only"
                  />
                  <div
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors",
                      item.active ? "bg-primary" : "bg-white/10"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        item.active ? "right-1" : "left-1"
                      )}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="glass-card p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-6">{t("Change Password")}</h3>
            <form className="space-y-4" onSubmit={onSubmit}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("Current password")}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("New password")}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                required
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
        </div>

        <div className="space-y-8">
          {/* Preferences */}
          <div className="glass-card p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-6">{t("Preferences")}</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t("Preferred Language")}
                </label>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-400">
                  {t("Theme")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "p-3 text-left rounded-xl border transition-all",
                        theme === option.value
                          ? "border-primary bg-primary/10 text-white shadow-lg shadow-primary/20"
                          : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                      )}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.helper}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
