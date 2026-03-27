import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Lock,
  User,
  Globe,
  Shield,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useLanguage } from '../../i18n/LanguageContext';

const PROFILE_STORAGE_KEY = 'author_studio_profile';
const PROFILE_UPDATED_EVENT = 'author-profile-updated';
const SETTINGS_STORAGE_KEY = 'author_studio_settings';
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'km', label: 'Khmer' },
  { value: 'zh', label: 'Chinese (China)' },
];

const readProfileFromStorage = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const readSettingsFromStorage = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeSettingsToStorage = (payload) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (private browsing, full quota, etc.)
  }
};

const Settings = () => {
  const { language, setLanguage, t } = useLanguage();
  const [activeSettingId, setActiveSettingId] = useState(null);
  const personalInfoRef = useRef(null);
  const storedSettings = readSettingsFromStorage();
  const [profile, setProfile] = useState(() => {
    const stored = readProfileFromStorage();
    return {
      name: stored?.fullName || stored?.name || '',
      email: stored?.email || '',
      bio: stored?.bio || '',
    };
  });
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    storedSettings?.security?.twoFactorEnabled ?? storedSettings?.twoFactorEnabled ?? false
  );
  const [profileVisible, setProfileVisible] = useState(
    storedSettings?.privacy?.profileVisible ?? true
  );
  const [showEmailToReaders, setShowEmailToReaders] = useState(
    storedSettings?.privacy?.showEmailToReaders ?? false
  );
  const [showReadingStats, setShowReadingStats] = useState(
    storedSettings?.privacy?.showReadingStats ?? true
  );
  const [emailNotifications, setEmailNotifications] = useState(
    storedSettings?.notifications?.email ?? true
  );
  const [pushNotifications, setPushNotifications] = useState(
    storedSettings?.notifications?.push ?? false
  );
  const [inAppNotifications, setInAppNotifications] = useState(
    storedSettings?.notifications?.inApp ?? true
  );
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });
  const [regionMessage, setRegionMessage] = useState({ type: '', text: '' });
  const [privacyMessage, setPrivacyMessage] = useState({ type: '', text: '' });
  const [notificationMessage, setNotificationMessage] = useState({ type: '', text: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const languageLabel = t(
    LANGUAGE_OPTIONS.find((option) => option.value === language)?.label || 'English'
  );

  const sections = [
    {
      title: t("Account"),
      items: [
        { id: "personal", icon: User, label: t("Personal Information"), desc: t("Update your name, email and bio") },
        { id: "security", icon: Lock, label: t("Password & Security"), desc: t("Manage your password and 2FA") },
        { id: "language", icon: Globe, label: t("Language"), desc: languageLabel },
      ]
    },
    {
      title: t("Subscription"),
      items: [
        { id: "privacy", icon: Shield, label: t("Privacy Settings"), desc: t("Control who sees your profile and works") },
      ]
    },
    {
      title: t("Preferences"),
      items: [
        { id: "notifications", icon: Bell, label: t("Notifications"), desc: t("Email, push and in-app alerts") },
      ]
    }
  ];
  const selectedItem = sections
    .flatMap((section) => section.items)
    .find((item) => item.id === activeSettingId);

  const persistSettings = () => {
    writeSettingsToStorage({
      security: { twoFactorEnabled },
      privacy: { profileVisible, showEmailToReaders, showReadingStats },
      notifications: {
        email: emailNotifications,
        push: pushNotifications,
        inApp: inAppNotifications,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleProfileChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setProfileMessage({ type: '', text: '' });
  };

  const handleSaveProfile = () => {
    const trimmedName = profile.name.trim();
    const trimmedEmail = profile.email.trim();
    const trimmedBio = profile.bio.trim();

    if (!trimmedName) {
      setProfileMessage({ type: 'error', text: t('Please enter your name.') });
      return;
    }

    const nameParts = trimmedName.split(/\s+/);
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';

    setIsSaving(true);
    setProfileMessage({ type: '', text: '' });

    apiClient
      .put('/me/profile', {
        firstname,
        lastname,
        bio: trimmedBio,
        email: trimmedEmail || undefined,
      })
      .then((response) => {
        const payload = response?.data?.data || response?.data || {};
        const resolvedName = payload.fullName || payload.name || trimmedName;
        const resolvedEmail = payload.email || trimmedEmail;
        const resolvedBio = payload.bio || trimmedBio;

        const stored = readProfileFromStorage();
        const updated = {
          ...stored,
          name: resolvedName,
          fullName: resolvedName,
          email: resolvedEmail,
          bio: resolvedBio,
        };

        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
        setProfile({
          name: resolvedName,
          email: resolvedEmail,
          bio: resolvedBio,
        });
        setProfileMessage({ type: 'success', text: t('Personal information updated successfully.') });
      })
      .catch((error) => {
        const apiMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        setProfileMessage({
          type: 'error',
          text: apiMessage || t('Unable to save profile. Please try again.'),
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleSaveSecurity = () => {
    persistSettings();
    setSecurityMessage({ type: 'success', text: t('Security preferences saved successfully.') });
  };

  const handleSaveRegion = () => {
    persistSettings();
    setRegionMessage({ type: 'success', text: t('Language updated successfully.') });
  };

  const handleSavePrivacy = () => {
    persistSettings();
    setPrivacyMessage({ type: 'success', text: t('Privacy settings updated successfully.') });
  };

  const handleSaveNotifications = () => {
    persistSettings();
    setNotificationMessage({ type: 'success', text: t('Notification preferences saved successfully.') });
  };

  const handleChangePassword = (event) => {
    event.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('Please fill in all password fields.') });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('New password and confirmation do not match.') });
      return;
    }

    setChangingPassword(true);

    apiClient
      .post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      .then((response) => {
        const payload = response?.data || {};
        if (payload?.success === false) {
          setPasswordMessage({
            type: 'error',
            text: payload?.message || t('Password update failed.'),
          });
          return;
        }

        setPasswordMessage({
          type: 'success',
          text: payload?.message || t('Password updated successfully.'),
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((error) => {
        const apiMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        setPasswordMessage({
          type: 'error',
          text: apiMessage || t('Unable to update password. Please try again.'),
        });
      })
      .finally(() => {
        setChangingPassword(false);
      });
  };

  useEffect(() => {
    if (activeSettingId !== 'personal') return;
    if (!personalInfoRef.current) return;
    window.setTimeout(() => {
      personalInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [activeSettingId]);

  return (

    <div className="p-8 max-w-4xl mx-auto">

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">{t("Settings")}</h1>
        <p className="text-slate-400 mt-1">{t("Manage your account preferences and studio configuration.")}</p>
      </div>

      <div className="space-y-10">

        {!activeSettingId && sections.map((section, i) => (
          <div key={i}>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4">{section.title}</h2>
            <div className="bg-card-dark border border-white/5 rounded-2xl overflow-hidden card-shadow">
              {section.items.map((item, j) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSettingId(item.id)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors group ${j !== section.items.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/20 rounded-lg text-accent group-hover:scale-110 transition-transform">
                      <item.icon className="size-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-600 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {activeSettingId === 'personal' && (

          <div ref={personalInfoRef} className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Personal Information")}</p>
              <button
                type="button"
                onClick={() => setActiveSettingId(null)}
                className="text-xs font-semibold text-accent hover:text-[color:var(--text)] transition-colors"
              >
                {t("Back to Settings")}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("Name")}
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  placeholder={t("Your name")}
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("Email")}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("Bio")}
                </label>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  placeholder={t("Tell readers about yourself...")}
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs ${profileMessage.type === 'error'
                      ? 'text-rose-400'
                      : profileMessage.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                >
                  {profileMessage.text}
                </p>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? t('Saving...') : t('Save Changes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSettingId === 'security' && (
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Password & Security")}</p>
              <button
                type="button"
                onClick={() => setActiveSettingId(null)}
                className="text-xs font-semibold text-accent hover:text-[color:var(--text)] transition-colors"
              >
                {t("Back to Settings")}
              </button>
            </div>
            <div className="space-y-4">
              <form
                onSubmit={handleChangePassword}
                className="p-4 bg-primary/5 border border-white/5 rounded-xl space-y-3"
              >
                <div>
                  <p className="text-sm font-bold">{t("Password")}</p>
                  <p className="text-xs text-slate-500">{t("Change your password and keep your account secure.")}</p>
                </div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordMessage({ type: '', text: '' });
                  }}
                  placeholder={t("Current password")}
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordMessage({ type: '', text: '' });
                  }}
                  placeholder={t("New password")}
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordMessage({ type: '', text: '' });
                  }}
                  placeholder={t("Confirm new password")}
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                {passwordMessage.text && (
                  <p
                    className={`text-xs ${passwordMessage.type === 'error'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                      }`}
                  >
                    {passwordMessage.text}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? t('Updating...') : t('Update Password')}
                  </button>
                </div>
              </form>
              <label className="flex items-center justify-between p-4 bg-primary/5 border border-white/5 rounded-xl cursor-pointer">
                <div>
                  <p className="text-sm font-bold">{t("Two-factor authentication")}</p>
                  <p className="text-xs text-slate-500">{t("Add an extra layer of security to your account.")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => {
                    setTwoFactorEnabled(e.target.checked);
                    setSecurityMessage({ type: '', text: '' });
                  }}
                  className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#56aeb9]"
                />
              </label>
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs ${securityMessage.type === 'error'
                      ? 'text-rose-400'
                      : securityMessage.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                >
                  {securityMessage.text}
                </p>
                <button
                  type="button"
                  onClick={handleSaveSecurity}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all"
                >
                  {t("Save Security")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSettingId === 'language' && (
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Language")}</p>
              <button
                type="button"
                onClick={() => setActiveSettingId(null)}
                className="text-xs font-semibold text-accent hover:text-[color:var(--text)] transition-colors"
              >
                {t("Back to Settings")}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("Language")}
                </label>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setRegionMessage({ type: '', text: '' });
                  }}
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.label)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs ${regionMessage.type === 'error'
                      ? 'text-rose-400'
                      : regionMessage.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                >
                  {regionMessage.text}
                </p>
                <button
                  type="button"
                  onClick={handleSaveRegion}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all"
                >
                  {t("Save Changes")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSettingId === 'privacy' && (
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Privacy Settings")}</p>
              <button
                type="button"
                onClick={() => setActiveSettingId(null)}
                className="text-xs font-semibold text-accent hover:text-[color:var(--text)] transition-colors"
              >
                {t("Back to Settings")}
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-primary/5 border border-white/5 rounded-xl cursor-pointer">
                <div>
                  <p className="text-sm font-bold">{t("Public profile")}</p>
                  <p className="text-xs text-slate-500">{t("Allow readers to see your author profile.")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileVisible}
                  onChange={(e) => {
                    setProfileVisible(e.target.checked);
                    setPrivacyMessage({ type: '', text: '' });
                  }}
                  className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#56aeb9]"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-primary/5 border border-white/5 rounded-xl cursor-pointer">
                <div>
                  <p className="text-sm font-bold">{t("Show email to readers")}</p>
                  <p className="text-xs text-slate-500">{t("Display your email on your public profile.")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={showEmailToReaders}
                  onChange={(e) => {
                    setShowEmailToReaders(e.target.checked);
                    setPrivacyMessage({ type: '', text: '' });
                  }}
                  className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#56aeb9]"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-primary/5 border border-white/5 rounded-xl cursor-pointer">
                <div>
                  <p className="text-sm font-bold">{t("Show reading stats")}</p>
                  <p className="text-xs text-slate-500">{t("Share book performance with readers.")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={showReadingStats}
                  onChange={(e) => {
                    setShowReadingStats(e.target.checked);
                    setPrivacyMessage({ type: '', text: '' });
                  }}
                  className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#56aeb9]"
                />
              </label>
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs ${privacyMessage.type === 'error'
                      ? 'text-rose-400'
                      : privacyMessage.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                >
                  {privacyMessage.text}
                </p>
                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all"
                >
                  {t("Save Privacy")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSettingId === 'notifications' && (
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Notifications")}</p>
              <button
                type="button"
                onClick={() => setActiveSettingId(null)}
                className="text-xs font-semibold text-accent hover:text-[color:var(--text)] transition-colors"
              >
                {t("Back to Settings")}
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-primary/5 border border-white/5 rounded-xl cursor-pointer">
                <div>
                  <p className="text-sm font-bold">{t("Email alerts")}</p>
                  <p className="text-xs text-slate-500">{t("Receive updates and approvals by email.")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => {
                    setEmailNotifications(e.target.checked);
                    setNotificationMessage({ type: '', text: '' });
                  }}
                  className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#56aeb9]"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-primary/5 border border-white/5 rounded-xl cursor-pointer">
                <div>
                  <p className="text-sm font-bold">{t("Push notifications")}</p>
                  <p className="text-xs text-slate-500">{t("Get instant alerts on your device.")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => {
                    setPushNotifications(e.target.checked);
                    setNotificationMessage({ type: '', text: '' });
                  }}
                  className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#56aeb9]"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-primary/5 border border-white/5 rounded-xl cursor-pointer">
                <div>
                  <p className="text-sm font-bold">{t("In-app notifications")}</p>
                  <p className="text-xs text-slate-500">{t("Show alerts inside the portal.")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={inAppNotifications}
                  onChange={(e) => {
                    setInAppNotifications(e.target.checked);
                    setNotificationMessage({ type: '', text: '' });
                  }}
                  className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#56aeb9]"
                />
              </label>
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs ${notificationMessage.type === 'error'
                      ? 'text-rose-400'
                      : notificationMessage.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                >
                  {notificationMessage.text}
                </p>
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all"
                >
                  {t("Save Notifications")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSettingId &&
          !['personal', 'security', 'language', 'privacy', 'notifications'].includes(activeSettingId) && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Selected Setting")}</p>
                <button
                  type="button"
                  onClick={() => setActiveSettingId(null)}
                  className="text-xs font-semibold text-accent hover:text-[color:var(--text)] transition-colors"
                >
                  {t("Back to Settings")}
                </button>
              </div>
              <h3 className="text-lg font-bold">{selectedItem?.label}</h3>
              <p className="text-sm text-slate-400 mt-1">{selectedItem?.desc}</p>
            </div>
          )}

        {!activeSettingId && (
          <div className="bg-primary/5 rounded-2xl p-6 border border-white/5 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-accent/20 rounded-xl text-accent">
                <HelpCircle className="size-6" />
              </div>
              <div>
                <h3 className="font-bold">{t("Need help?")}</h3>
                <p className="text-sm text-slate-400">{t("Check our documentation or contact support for assistance.")}</p>
              </div>
            </div>
            <button
              onClick={() =>
                window.alert(
                  t('Contact Admin\n\nBenefits of contacting the admin:\n- Fast help with account issues\n- Approval and publishing support\n- Access to system settings\n- Reliable updates and announcements\n\nReach the admin via the official support channel.'),
                )
              }
              className="px-6 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              {t("Contact Support")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

