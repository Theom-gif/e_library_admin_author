import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, ChartCard, SLabel, fmtTS } from "./primitives";

export default function PerformancePage({ history, isDark }) {
  const tooltipStyle = {
    backgroundColor: isDark ? "#1f2838" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"}`,
    borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10,
    color: isDark ? "#e8edf4" : "#0f1923",
  };
  const tickColor = isDark ? "#3d4f63" : "#8fa0b3";

  const gradients = [
    ["ph-cpu",  CHART_COLORS.accent],
    ["ph-mem",  CHART_COLORS.purple],
    ["ph-swap", CHART_COLORS.orange],
    ["ph-disk", CHART_COLORS.cyan],
    ["ph-nin",  CHART_COLORS.green],
    ["ph-nout", CHART_COLORS.amber],
  ];

  const defs = (
    <defs>
      {gradients.map(([id, c]) => (
        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={c} stopOpacity={0.15} />
          <stop offset="95%" stopColor={c} stopOpacity={0} />
        </linearGradient>
      ))}
    </defs>
  );

  const xAxis = <XAxis dataKey="timestamp" tickFormatter={fmtTS} tick={{ fontSize: 8, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />;
  const yAxisPct = <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={32} />;

  return (
    <div className="flex flex-col gap-4">
      <SLabel>historical performance (last 48 points)</SLabel>

      {/* Full-width CPU chart */}
      <ChartCard title="CPU utilisation" legend={[{ color: CHART_COLORS.accent, label: "CPU %" }]}>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              {defs}
              {xAxis}
              {yAxisPct}
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "CPU"]} labelFormatter={fmtTS} />
              <Area type="monotone" dataKey="cpu" stroke={CHART_COLORS.accent} strokeWidth={1.5} fill="url(#ph-cpu)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Memory & Disk */}
        <ChartCard title="Memory & Disk" legend={[{ color: CHART_COLORS.purple, label: "MEM" }, { color: CHART_COLORS.orange, label: "DISK" }]}>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                {defs}
                {xAxis}
                {yAxisPct}
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v}%`, n === "memory" ? "MEM" : "DISK"]} labelFormatter={fmtTS} />
                <Area type="monotone" dataKey="memory" stroke={CHART_COLORS.purple} strokeWidth={1.5} fill="url(#ph-mem)"  dot={false} />
                <Area type="monotone" dataKey="disk"   stroke={CHART_COLORS.orange} strokeWidth={1.5} fill="url(#ph-swap)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Disk & Network */}
        <ChartCard title="Disk & Network" legend={[{ color: CHART_COLORS.cyan, label: "DISK" }, { color: CHART_COLORS.green, label: "NET IN" }, { color: CHART_COLORS.amber, label: "NET OUT" }]}>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                {defs}
                {xAxis}
                <YAxis tick={{ fontSize: 8, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(1)} width={36} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [typeof v === "number" && n !== "disk" ? `${v.toFixed(3)} MB/s` : `${v}%`, n.toUpperCase()]} labelFormatter={fmtTS} />
                <Area type="monotone" dataKey="disk"       stroke={CHART_COLORS.cyan}  strokeWidth={1.5} fill="url(#ph-disk)" dot={false} />
                <Area type="monotone" dataKey="networkIn"  stroke={CHART_COLORS.green} strokeWidth={1.5} fill="url(#ph-nin)"  dot={false} />
                <Area type="monotone" dataKey="networkOut" stroke={CHART_COLORS.amber} strokeWidth={1.5} fill="url(#ph-nout)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
