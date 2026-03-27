import React from "react";
import { cn } from "../../../lib/utils";

const NotificationsCard = ({
  t,
  savingPrefs,
  onSaveNotifications,
  notificationPrefs,
  onToggleNotification,
}) => (
  <div className="glass-card p-6 border border-white/10">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-xl font-bold">{t("Notifications")}</h3>
        <p className="text-sm text-slate-500">
          {t("Choose what you want to hear about and where.")}
        </p>
      </div>
      <button
        onClick={onSaveNotifications}
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
            onChange={() => onToggleNotification(item.key)}
            className="peer sr-only"
          />
          <div
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              item.active ? "bg-primary" : "bg-white/10",
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                item.active ? "right-1" : "left-1",
              )}
            />
          </div>
        </label>
      ))}
    </div>
  </div>
);

export default NotificationsCard;
