import { useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiClient } from "../../lib/apiClient";
import NotificationsCard from "../components/setting/NotificationsCard";
import PasswordCard from "../components/setting/PasswordCard";
import PreferencesCard from "../components/setting/PreferencesCard";
import SettingsHeader from "../components/setting/SettingsHeader";
import { defaultNotifications, LANGUAGE_OPTIONS } from "../components/setting/constants";

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotifications);
  const { language, setLanguage, t } = useLanguage();
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
      <SettingsHeader t={t} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <NotificationsCard
            t={t}
            savingPrefs={savingPrefs}
            onSaveNotifications={saveNotifications}
            notificationPrefs={notificationPrefs}
            onToggleNotification={handleToggleNotification}
          />
          <PasswordCard
            t={t}
            onSubmit={onSubmit}
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            msg={msg}
            savingPassword={savingPassword}
          />
        </div>

        <div className="space-y-8">
          <PreferencesCard
            t={t}
            language={language}
            onLanguageChange={setLanguage}
            languageOptions={LANGUAGE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
