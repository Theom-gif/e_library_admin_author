import { CheckCircle, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { getMeta, timeAgo } from "./constants";

const NotificationRow = ({ notif, onMarkRead, onDelete, onOpen }) => {
  const meta = getMeta(notif.type);
  const Icon = meta.icon;
  const hasActions = Boolean((!notif.read && onMarkRead) || onDelete);
  const isClickable = typeof onOpen === "function";

  const handleOpen = () => {
    if (typeof onOpen === "function") {
      onOpen(notif);
    }
  };

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleOpen : undefined}
      onKeyDown={isClickable ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      } : undefined}
      className={cn(
        "group flex items-start gap-4 rounded-xl border px-5 py-4 transition-all duration-200",
        isClickable && "cursor-pointer hover:border-accent/30",
        notif.read
          ? "border-[var(--border)] bg-[var(--surface)]"
          : "border-accent/20 bg-[color:var(--surface-overlay-15)] shadow-[0_14px_34px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.color)}>
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {meta.label}
            </span>
            <p className={cn("mt-0.5 text-sm font-medium", notif.read ? "text-[var(--muted)]" : "text-[var(--text)]")}>
              {notif.message || notif.title}
            </p>
            {notif.description && (
              <p className="mt-0.5 text-xs text-[var(--muted)]">{notif.description}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-[var(--muted)]">{timeAgo(notif.created_at)}</span>
        </div>
      </div>

      {hasActions && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!notif.read && onMarkRead && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMarkRead(notif.id);
              }}
              title="Mark as read"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[color:var(--surface-overlay-15)] hover:text-accent"
            >
              <CheckCircle size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(notif.id);
              }}
              title="Delete"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationRow;
