import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, ChartCard, SLabel } from "./primitives";

const STATUS_COLORS = { success: CHART_COLORS.green, warning: CHART_COLORS.amber, error: CHART_COLORS.red };
const SVC_COLORS    = [CHART_COLORS.accent, CHART_COLORS.purple, CHART_COLORS.cyan, CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.orange, CHART_COLORS.red, "#7d8fa3"];

export default function StatsPage({ stats, isDark }) {
  if (!stats) return <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--sm-text-3)", padding: 20 }}>loading statistics…</div>;

  const { logStats } = stats;
  const byStatus  = logStats?.byStatus  ?? {};
  const byService = logStats?.byService ?? {};
  const total     = logStats?.total     ?? 1;

  const statusData  = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  const serviceData = Object.entries(byService).slice(0, 8).map(([name, value]) => ({ name, value }));
  const svcTotal    = serviceData.reduce((s, d) => s + d.value, 0) || 1;

  const tickColor = isDark ? "#3d4f63" : "#8fa0b3";
  const tooltipStyle = {
    backgroundColor: isDark ? "#1f2838" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"}`,
    borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10,
    color: isDark ? "#e8edf4" : "#0f1923",
  };

  return (
    <div className="flex flex-col gap-4">
      <SLabel>statistics</SLabel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Donut — log status */}
        <ChartCard title="Log status distribution">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="40%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {statusData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? CHART_COLORS.accent} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 4 }}>
            {statusData.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[d.name] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Bar — events by service */}
        <ChartCard title="Events by service">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {serviceData.map((_, i) => <Cell key={i} fill={SVC_COLORS[i % SVC_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Status bar rows */}
        <ChartCard title="Log events by status">
          <div style={{ padding: "8px 0" }}>
            {statusData.map(({ name, value }) => (
              <StatBarRow key={name} label={name} value={value} pct={Math.round(value / total * 100)} color={STATUS_COLORS[name] ?? CHART_COLORS.accent} />
            ))}
          </div>
        </ChartCard>

        {/* Service bar rows */}
        <ChartCard title="Events by service">
          <div style={{ padding: "8px 0" }}>
            {serviceData.map(({ name, value }, i) => (
              <StatBarRow key={name} label={name} value={value} pct={Math.round(value / svcTotal * 100)} color={SVC_COLORS[i % SVC_COLORS.length]} />
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function StatBarRow({ label, value, pct, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--sm-text-2)", width: 80, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: "var(--sm-bg-raised)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: color, transition: "width .5s" }} />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--sm-text-3)", width: 40, textAlign: "right" }}>{value}</div>
    </div>
  );
}
