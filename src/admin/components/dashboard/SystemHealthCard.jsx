import React from "react";
import { Database, HardDrive, Mail, Server, TrendingUp } from "lucide-react";
import HealthItem from "../HealthItem";

const SystemHealthCard = ({ t, uptimeText, health, trends }) => (
  <div className="glass-card p-6 flex flex-col">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-xl font-bold">{t("System Health")}</h3>
      <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded-full">
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
        {uptimeText}
      </div>
    </div>

    <div className="space-y-1 mb-8">
      <HealthItem label="API Server" value={`${health.apiServer?.latencyMs ?? 0}ms latency`} status={health.apiServer?.status || "online"} icon={Server} />
      <HealthItem label="Database" value={`${health.database?.queryTimeMs ?? 0}ms query time`} status={health.database?.status || "online"} icon={Database} />
      <HealthItem label="File Storage" value={`${health.fileStorage?.usedPercent ?? 0}% used`} status={health.fileStorage?.status || "online"} icon={HardDrive} />
      <HealthItem label="Email Service" value={`${health.emailService?.responseMs ?? 0}ms response`} status={health.emailService?.status || "online"} icon={Mail} />
    </div>

    <div className="mt-auto p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-purple-400">
          {trends.totalUsers >= 0 ? `+${trends.totalUsers}` : trends.totalUsers}
        </p>
        <TrendingUp size={16} className="text-purple-400" />
      </div>
      <p className="text-xs text-slate-400 font-medium">
        {t("Platform engagement is at an all-time high. Keep up the good work.")}
      </p>
    </div>
  </div>
);

export default SystemHealthCard;
