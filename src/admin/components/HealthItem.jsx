import { cn } from "../../lib/utils";

const HealthItem = ({ label, value, status, icon: Icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/5 rounded-lg text-slate-400">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-500">{value}</p>
      </div>
    </div>
    <span
      className={cn(
        "text-xs font-bold px-2 py-1 rounded-full",
        status === "online"
          ? "text-green-400 bg-green-400/10"
          : status === "warning"
            ? "text-orange-400 bg-orange-400/10"
            : "text-red-400 bg-red-400/10",
      )}
    >
      {status === "online" ? "Online" : status === "warning" ? "Warning" : "Error"}
    </span>
  </div>
);

export default HealthItem;
