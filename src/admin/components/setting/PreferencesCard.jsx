import React from "react";
import { cn } from "../../../lib/utils";

const PreferencesCard = ({
  t,
  language,
  onLanguageChange,
  languageOptions,
}) => (
  <div className="glass-card p-6 border border-white/10">
    <h3 className="text-xl font-bold mb-6">{t("Preferences")}</h3>
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          {t("Preferred Language")}
        </label>
        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
      </div>

      {/* <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-400">
          {t("Theme")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onThemeChange(option.value)}
              className={cn(
                "p-3 text-left rounded-xl border transition-all",
                theme === option.value
                  ? "border-primary bg-primary/10 text-white shadow-lg shadow-primary/20"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20",
              )}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-slate-500">{option.helper}</p>
            </button>
          ))}
        </div>
      </div> */}
    </div>
  </div>
);

export default PreferencesCard;
