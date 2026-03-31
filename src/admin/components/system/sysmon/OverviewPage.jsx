import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, ChartCard, MetricCard, SLabel, TriangleIcon, fmtTS } from "./primitives";

export default function OverviewPage({ health: h, history, isDark }) {
  const tooltipStyle = {
    backgroundColor: isDark ? "#1f2838" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"}`,
    borderRadius: 6,
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 10,
    color: isDark ? "#e8edf4" : "#0f1923",
  };
  const tickColor = isDark ? "#3d4f63" : "#8fa0b3";

  const ni = h?.networkIn ?? 0;
  const no = h?.networkOut ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Metric cards */}
      <div>
        <SLabel>system health</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
          <MetricCard label="CPU"       value={h ? `${h.cpu}%`    : "—"} sub={h ? `${h.cpuCores} cores · ${h.cpuFreqMhz}MHz` : "—"} barPct={h?.cpu}    accentVar="var(--sm-accent)" />
          <MetricCard label="Memory"    value={h ? `${h.memory}%` : "—"} sub={h ? `${h.memoryUsedGb}GB / ${h.memoryTotalGb}GB` : "—"} barPct={h?.memory} accentVar="var(--sm-purple)" colorClass="var(--sm-purple)" />
          <MetricCard label="Swap"      value={h ? `${h.swap}%`   : "—"} sub={h ? `${h.swapTotalGb}GB total` : "—"} barPct={h?.swap}   accentVar="var(--sm-orange)" colorClass="var(--sm-orange)" />
          <MetricCard label="Disk"      value={h ? `${h.disk}%`   : "—"} sub="root partition" barPct={h?.disk}   accentVar="var(--sm-cyan)"   colorClass="var(--sm-cyan)" />
          <MetricCard label="Net In"    value={h ? (ni < 1 ? `${(ni * 1024).toFixed(0)}K` : `${ni.toFixed(2)}M`) : "—"} sub="MB/s inbound"  accentVar="var(--sm-green)" colorClass="var(--sm-green)" />
          <MetricCard label="Net Out"   value={h ? (no < 1 ? `${(no * 1024).toFixed(0)}K` : `${no.toFixed(2)}M`) : "—"} sub="MB/s outbound" accentVar="var(--sm-green)" colorClass="var(--sm-green)" />
          <MetricCard label="Processes" value={h?.processCount ?? "—"} sub={h ? `${h.threadCount} threads · ${h.activeSessions} sessions` : "—"} accentVar="var(--sm-accent)" colorClass="var(--sm-accent)" />
          <MetricCard label="Load Avg"  value={h?.loadAverage?.[0] ?? "—"} sub={h?.loadAverage?.map((v) => v.toFixed(2)).join(" / ") ?? "1m / 5m / 15m"} accentVar="var(--sm-cyan)" colorClass="var(--sm-cyan)" />
        </div>
      </div>

      {/* Alerts */}
      <div>
        <SLabel>active alerts</SLabel>
        <AlertsPanel alerts={h?.alerts ?? []} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ChartCard title="CPU, Memory & Disk" legend={[{ color: CHART_COLORS.accent, label: "CPU" }, { color: CHART_COLORS.purple, label: "MEM" }, { color: CHART_COLORS.orange, label: "DISK" }]}>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  {[["cpu", CHART_COLORS.accent], ["mem", CHART_COLORS.purple], ["swap", CHART_COLORS.orange]].map(([k, c]) => (
                    <linearGradient key={k} id={`ov-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="timestamp" tickFormatter={fmtTS} tick={{ fontSize: 8, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={32} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v}%`, n.toUpperCase()]} labelFormatter={fmtTS} />
                <Area type="monotone" dataKey="cpu"    stroke={CHART_COLORS.accent} strokeWidth={1.5} fill={`url(#ov-cpu)`}  dot={false} />
                <Area type="monotone" dataKey="memory" stroke={CHART_COLORS.purple} strokeWidth={1.5} fill={`url(#ov-mem)`}  dot={false} />
                <Area type="monotone" dataKey="disk"   stroke={CHART_COLORS.orange} strokeWidth={1.5} fill={`url(#ov-swap)`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Network throughput" legend={[{ color: CHART_COLORS.green, label: "IN" }, { color: CHART_COLORS.cyan, label: "OUT" }]}>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  {[["nin", CHART_COLORS.green], ["nout", CHART_COLORS.cyan]].map(([k, c]) => (
                    <linearGradient key={k} id={`ov-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="timestamp" tickFormatter={fmtTS} tick={{ fontSize: 8, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 8, fill: tickColor, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(2)} width={36} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v.toFixed(3)} MB/s`, n === "networkIn" ? "IN" : "OUT"]} labelFormatter={fmtTS} />
                <Area type="monotone" dataKey="networkIn"  stroke={CHART_COLORS.green} strokeWidth={1.5} fill="url(#ov-nin)"  dot={false} />
                <Area type="monotone" dataKey="networkOut" stroke={CHART_COLORS.cyan}  strokeWidth={1.5} fill="url(#ov-nout)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function AlertsPanel({ alerts }) {
  if (!alerts.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--sm-text-3)", padding: "4px 0" }}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/><line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="7" cy="10" r=".7" fill="currentColor"/></svg>
        no active alerts
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {alerts.map((a) => (
        <div key={a.id} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          border: `1px solid ${a.level === "critical" ? "rgba(232,65,74,.25)" : "rgba(240,165,0,.25)"}`,
          borderRadius: 6, padding: "9px 13px",
          background: a.level === "critical" ? "var(--sm-red-dim)" : "var(--sm-amber-dim)",
          fontFamily: "'IBM Plex Mono',monospace", fontSize: 11,
          color: a.level === "critical" ? "#fca5a5" : "#fcd34d",
          animation: "slideIn .25s ease",
        }}>
          <TriangleIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>[{a.level.toUpperCase()}] {a.metric}</div>
            <div style={{ fontSize: 10, opacity: .8 }}>{a.message}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 9, color: "var(--sm-text-3)" }}>
            {new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      ))}
    </div>
  );
}
