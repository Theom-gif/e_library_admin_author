import React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const HealthChartCard = ({ healthData }) => (
  <div className="bg-white/5 p-6 rounded-xl border border-white/5 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <h4 className="font-bold">Server Health</h4>
      <div className="flex gap-4">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-primary"></span>
          <span className="text-xs text-slate-500">CPU</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-primary/30"></span>
          <span className="text-xs text-slate-500">RAM</span>
        </div>
      </div>
    </div>
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={healthData}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
          <Tooltip
            cursor={{ fill: "rgba(0, 188, 212, 0.05)" }}
            contentStyle={{ backgroundColor: "#0a2529", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
          />
          <Bar dataKey="cpu" fill="#00bcd4" radius={[4, 4, 0, 0]} barSize={40} />
          <Bar dataKey="ram" fill="rgba(0, 188, 212, 0.3)" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default HealthChartCard;
