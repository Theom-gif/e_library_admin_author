import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";

const StatCard = ({ label, value, trend, icon: Icon, color }) => (
  <div className="glass-card p-6 flex items-center justify-between">
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-3xl font-bold mb-2">{value}</h3>
      <div className="flex items-center gap-1 text-xs font-semibold">
        <span className={cn("flex items-center", trend.startsWith("+") ? "text-green-400" : "text-red-400")}>
          {trend.startsWith("+") ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </span>
        <span className="text-slate-500">this month</span>
      </div>
    </div>
    <div className={cn("p-4 rounded-2xl", color)}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

export default StatCard;
