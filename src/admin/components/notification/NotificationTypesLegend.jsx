import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { TYPE_META } from "./constants";

const NotificationTypesLegend = ({ t }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <h4 className="mb-4 text-sm font-bold text-slate-700">{t("Notification Types")}</h4>
    <div className="space-y-2">
      {Object.entries(TYPE_META).map(([key, meta]) => {
        const Icon = meta.icon;
        return (
          <div key={key} className="flex items-center gap-3">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", meta.color)}>
              <Icon size={12} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700">{meta.label}</p>
              <p className="text-[10px] capitalize text-slate-400">{meta.category}</p>
            </div>
            <ChevronRight size={12} className="text-slate-300" />
          </div>
        );
      })}
    </div>
  </div>
);

export default NotificationTypesLegend;
