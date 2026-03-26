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

const PROFILE_STORAGE_KEY = 'author_studio_profile';
const PROFILE_UPDATED_EVENT = 'author-profile-updated';

const readProfileFromStorage = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const Settings = () => {
  const [activeSetting, setActiveSetting] = useState(null);
  const personalInfoRef = useRef(null);
  const [profile, setProfile] = useState(() => {
    const stored = readProfileFromStorage();
    return {
      name: stored?.fullName || stored?.name || '',
      email: stored?.email || '',
      bio: stored?.bio || '',
    };
  });
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal Information", desc: "Update your name, email and bio" },
        { icon: Lock, label: "Password & Security", desc: "Manage your password and 2FA" },
        { icon: Globe, label: "Language & Region", desc: "English (US), UTC-8" },
      ]
    },
    {
      title: "Subscription",
      items: [
        { icon: Shield, label: "Privacy Settings", desc: "Control who sees your profile and works" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", desc: "Email, push and in-app alerts" },
      ]
    }
  ];

  const handleProfileChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaveMessage('');
  };

  const handleSaveProfile = () => {
    const trimmedName = profile.name.trim();
    const trimmedEmail = profile.email.trim();
    const trimmedBio = profile.bio.trim();

    if (!trimmedName) {
      setSaveMessage('Please enter your name.');
      return;
    }

    const nameParts = trimmedName.split(/\s+/);
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';

    setIsSaving(true);
    setSaveMessage('');

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
        setSaveMessage('Personal information updated.');
      })
      .catch((error) => {
        const apiMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        setSaveMessage(apiMessage || 'Unable to save profile. Please try again.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  useEffect(() => {
    if (activeSetting?.label !== 'Personal Information') return;
    if (!personalInfoRef.current) return;
    window.setTimeout(() => {
      personalInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [activeSetting]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account preferences and studio configuration.</p>
      </div>

      <div className="space-y-10">
        {!activeSetting && sections.map((section, i) => (
          <div key={i}>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4">{section.title}</h2>
            <div className="bg-card-dark border border-white/5 rounded-2xl overflow-hidden card-shadow">
              {section.items.map((item, j) => (
                <button 
                  key={j}
                  onClick={() => setActiveSetting({ label: item.label, desc: item.desc })}
                  className={`w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors group ${
                    j !== section.items.length - 1 ? 'border-b border-white/5' : ''
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

        {activeSetting && activeSetting.label === 'Personal Information' && (
          <div ref={personalInfoRef} className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Information</p>
              <button
                type="button"
                onClick={() => setActiveSetting(null)}
                className="text-xs font-semibold text-accent hover:text-[color:var(--text)] transition-colors"
              >
                Back to Settings
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Email
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
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  placeholder="Tell readers about yourself..."
                  className="w-full bg-primary/10 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">{saveMessage}</p>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSetting && activeSetting.label !== 'Personal Information' && (
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Setting</p>
              <button
                type="button"
                onClick={() => setActiveSetting(null)}
                className="text-xs font-semibold text-accent hover:text-[color:var(--text)] transition-colors"
              >
                Back to Settings
              </button>
            </div>
            <h3 className="text-lg font-bold">{activeSetting.label}</h3>
            <p className="text-sm text-slate-400 mt-1">{activeSetting.desc}</p>
          </div>
        )}

        {!activeSetting && (
          <div className="bg-primary/5 rounded-2xl p-6 border border-white/5 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-accent/20 rounded-xl text-accent">
                <HelpCircle className="size-6" />
              </div>
              <div>
                <h3 className="font-bold">Need help?</h3>
                <p className="text-sm text-slate-400">Check our documentation or contact support for assistance.</p>
              </div>
            </div>
            <button
              onClick={() =>
                window.alert(
                  'Contact Admin\n\nBenefits of contacting the admin:\n- Fast help with account issues\n- Approval and publishing support\n- Access to system settings\n- Reliable updates and announcements\n\nReach the admin via the official support channel.',
                )
              }
              className="px-6 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Contact Support
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

