// Shared primitives for the sysmon UI

export function SLabel({ children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 600, color: "var(--sm-text-3)", letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: 10 }}>
      {children}
    </div>
  );
}

export function ChartCard({ title, legend, children, style }) {
  return (
    <div style={{ background: "var(--sm-bg-surface)", border: "1px solid var(--sm-border)", borderRadius: 8, padding: 15, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600, color: "var(--sm-text-2)", letterSpacing: ".4px" }}>{title}</span>
        {legend && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {legend.map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export function MetricCard({ label, value, sub, barPct, accentVar, colorClass }) {
  const pct = Math.min(barPct ?? 0, 100);
  const barColor = pct >= 85 ? "var(--sm-red)" : pct >= 65 ? "var(--sm-amber)" : "var(--sm-green)";
  const valColor = colorClass ?? (pct >= 85 ? "var(--sm-red)" : pct >= 65 ? "var(--sm-amber)" : "var(--sm-green)");
  return (
    <div style={{ background: "var(--sm-bg-surface)", border: "1px solid var(--sm-border)", borderRadius: 8, padding: "14px 15px 12px", position: "relative", overflow: "hidden", transition: "border-color .2s, transform .15s", cursor: "default" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--sm-border-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--sm-border)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "8px 8px 0 0", background: accentVar ?? "var(--sm-accent)" }} />
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 600, color: "var(--sm-text-3)", letterSpacing: ".9px", textTransform: "uppercase", marginBottom: 9 }}>{label}</div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 24, fontWeight: 600, lineHeight: 1, marginBottom: 4, color: valColor, transition: "color .3s" }}>{value ?? "—"}</div>
      {sub && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)" }}>{sub}</div>}
      {barPct !== undefined && (
        <div style={{ height: 3, background: "var(--sm-bg-raised)", borderRadius: 2, marginTop: 9, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: barColor, transition: "width .6s ease, background .4s" }} />
        </div>
      )}
    </div>
  );
}

export function TableWrap({ children, maxHeight = 340 }) {
  return (
    <div style={{ overflowX: "auto", maxHeight, overflowY: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, onClick, sortDir }) {
  return (
    <th
      onClick={onClick}
      style={{ textAlign: "left", padding: "7px 12px", fontSize: 9, fontWeight: 600, color: "var(--sm-text-3)", letterSpacing: ".9px", textTransform: "uppercase", borderBottom: "1px solid var(--sm-border)", position: "sticky", top: 0, background: "var(--sm-bg-raised)", whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default", userSelect: "none" }}
    >
      {children}{sortDir === 1 ? " ↑" : sortDir === -1 ? " ↓" : ""}
    </th>
  );
}

export function Td({ children, style }) {
  return <td style={{ padding: "6px 12px", color: "var(--sm-text-2)", whiteSpace: "nowrap", ...style }}>{children}</td>;
}

export function StatusBadge({ status }) {
  const colors = {
    success: { bg: "var(--sm-green-dim)", color: "var(--sm-green)", border: "rgba(39,201,143,.2)" },
    warning: { bg: "var(--sm-amber-dim)", color: "var(--sm-amber)", border: "rgba(240,165,0,.2)" },
    error:   { bg: "var(--sm-red-dim)",   color: "var(--sm-red)",   border: "rgba(232,65,74,.2)" },
  };
  const c = colors[status] ?? colors.success;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 3, fontSize: 9, fontWeight: 600, border: `1px solid ${c.border}`, background: c.bg, color: c.color }}>
      {status}
    </span>
  );
}

export function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  catch { return "—"; }
}

export function fmtTS(iso) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export const CHART_COLORS = {
  accent: "#2f80ed", purple: "#9b6dff", cyan: "#0cbfcf",
  green: "#27c98f", amber: "#f0a500", orange: "#f97316", red: "#e8414a",
};
