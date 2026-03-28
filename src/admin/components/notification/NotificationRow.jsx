import { CheckCircle, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { getMeta, timeAgo } from "./constants";

const NotificationRow = ({ notif, onMarkRead, onDelete }) => {
  const meta = getMeta(notif.type);
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "group flex items-start gap-4 rounded-xl border px-5 py-4 transition-all duration-200",
        notif.read ? "border-slate-100 bg-white" : "border-indigo-100 bg-indigo-50/40",
      )}
    >
      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.color)}>
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {meta.label}
            </span>
            <p className={cn("mt-0.5 text-sm font-medium", notif.read ? "text-slate-600" : "text-slate-800")}>
              {notif.message || notif.title}
            </p>
            {notif.description && (
              <p className="mt-0.5 text-xs text-slate-400">{notif.description}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-slate-400">{timeAgo(notif.created_at)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notif.read && (
          <button
            type="button"
            onClick={() => onMarkRead(notif.id)}
            title="Mark as read"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <CheckCircle size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notif.id)}
          title="Delete"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotificationRow;
