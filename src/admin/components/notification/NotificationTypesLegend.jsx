import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { TYPE_META } from "./constants";

const NotificationTypesLegend = ({ t }) => (
  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
    <h4 className="mb-4 text-sm font-bold text-[var(--text)]">{t("Notification Types")}</h4>
    <div className="space-y-2">
      {Object.entries(TYPE_META).map(([key, meta]) => {
        const Icon = meta.icon;
        return (
          <div key={key} className="flex items-center gap-3">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", meta.color)}>
              <Icon size={12} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text)]">{meta.label}</p>
              <p className="text-[10px] capitalize text-[var(--muted)]">{meta.category}</p>
            </div>
            <ChevronRight size={12} className="text-[var(--muted)] opacity-40" />
          </div>
        );
      })}
    </div>
  </div>
);

export default NotificationTypesLegend;
