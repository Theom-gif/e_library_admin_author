import {
  Activity,
  BookOpen,
  CheckSquare,
  Database,
  Grid,
  HardDrive,
  Mail,
  Server,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import HealthItem from "../components/HealthItem";
import StatCard from "../components/StatCard";
import { ACTIVITY_DATA } from "../data/mockData";

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Users" value="12,483" trend="+342" icon={Users} color="bg-purple-500" />
        <StatCard label="Total Books" value="2,847" trend="+127" icon={BookOpen} color="bg-pink-500" />
        <StatCard label="Pending Approvals" value="24" trend="-4" icon={CheckSquare} color="bg-orange-500" />
        <StatCard label="Authors" value="1,234" trend="+89" icon={Grid} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-purple-500" />
              <h3 className="text-xl font-bold">Platform Activity</h3>
            </div>
            <select className="bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-smfocus:outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_DATA}>
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
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">System Health</h3>
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              99.98% uptime
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <HealthItem label="API Server" value="12ms latency" status="online" icon={Server} />
            <HealthItem label="Database" value="4ms query time" status="online" icon={Database} />
            <HealthItem label="File Storage" value="78% used" status="warning" icon={HardDrive} />
            <HealthItem label="Email Service" value="67ms response" status="online" icon={Mail} />
          </div>

          <div className="mt-auto p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-purple-400">+23%</p>
              <TrendingUp size={16} className="text-purple-400" />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Platform engagement is at an all-time high. Keep up the good work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
