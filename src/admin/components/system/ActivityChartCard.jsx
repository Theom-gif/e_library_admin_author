import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const ActivityChartCard = ({ range, onRangeChange, activityData }) => (
  <div className="bg-white/5 p-6 rounded-xl border border-white/5 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <h4 className="font-bold">User Activity ({range === "24h" ? "24h" : "7 Days"})</h4>
      <select
        value={range}
        onChange={(e) => onRangeChange(e.target.value)}
        className="text-xs bg-white/5 border border-white/10 rounded-lg focus:ring-0 outline-none p-1 px-2 text-slate-400 cursor-pointer"
      >
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
      </select>
    </div>
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={activityData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00bcd4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0a2529", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
            itemStyle={{ color: "#00bcd4" }}
          />
          <Area type="monotone" dataKey="value" stroke="#00bcd4" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default ActivityChartCard;
