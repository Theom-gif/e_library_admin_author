import React from "react";
import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ActivityChartCard = ({ t, range, onRangeChange, activity, isLoading }) => (
  <div className="lg:col-span-2 glass-card p-6">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        <Activity size={20} className="text-purple-500" />
        <h3 className="text-xl font-bold">{t("Platform Activity")}</h3>
      </div>
      <select
        value={range}
        onChange={(e) => onRangeChange(e.target.value)}
        className="bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
      >
        <option value="7d">{t("Last 7 days")}</option>
        <option value="30d">{t("Last 30 days")}</option>
      </select>
    </div>

    <div className="h-[300px] w-full min-w-0 overflow-hidden">
      {activity && activity.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activity}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1d26",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
              itemStyle={{ color: "#fff" }}
            />
            <Area type="monotone" dataKey="users" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-slate-400">
          {isLoading ? <span>{t("Loading activity data...")}</span> : <span>{t("No activity data available")}</span>}
        </div>
      )}
    </div>
  </div>
);

export default ActivityChartCard;
