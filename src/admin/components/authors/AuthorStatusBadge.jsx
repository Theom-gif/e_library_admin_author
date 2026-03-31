import { CheckCircle2, Clock3 } from "lucide-react";

export default function AuthorStatusBadge({ isActive, isDark, labelActive = "Active", labelPending = "Pending" }) {
  const Icon = isActive ? CheckCircle2 : Clock3;
  const className = isActive
    ? isDark
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-emerald-100 text-emerald-700"
    : isDark
      ? "bg-amber-500/15 text-amber-300"
      : "bg-amber-100 text-amber-700";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      <Icon size={14} />
      {isActive ? labelActive : labelPending}
    </span>
  );
}
