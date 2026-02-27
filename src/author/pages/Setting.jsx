import React from 'react';
import { useState } from 'react';
import { 
  Bell, 
  Lock, 
  User, 
  Globe, 
  CreditCard, 
  Shield, 
  HelpCircle,
  ChevronRight,
  Moon,
  Smartphone
} from 'lucide-react';

const Settings = () => {
  const [activeSetting, setActiveSetting] = useState(null);
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
        { icon: CreditCard, label: "Plan & Billing", desc: "Pro Plan • Next billing Apr 12, 2024" },
        { icon: Shield, label: "Privacy Settings", desc: "Control who sees your profile and works" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", desc: "Email, push and in-app alerts" },
        { icon: Moon, label: "Appearance", desc: "Dark mode, custom themes" },
        { icon: Smartphone, label: "Connected Apps", desc: "Manage third-party integrations" },
      ]
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account preferences and studio configuration.</p>
      </div>

      <div className="space-y-10">
        {sections.map((section, i) => (
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

        {activeSetting && (
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6 card-shadow">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selected Setting</p>
            <h3 className="text-lg font-bold">{activeSetting.label}</h3>
            <p className="text-sm text-slate-400 mt-1">{activeSetting.desc}</p>
          </div>
        )}

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
            onClick={() => {
              window.location.href = 'mailto:support@inkwell.com?subject=Inkwell%20Support';
            }}
            className="px-6 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
