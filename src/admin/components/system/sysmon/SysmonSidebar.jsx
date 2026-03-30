const NAV = [
  {
    section: "monitor",
    items: [
      { id: "overview",    label: "Overview",    icon: <GridIcon /> },
      { id: "performance", label: "Performance", icon: <LineIcon /> },
      { id: "processes",   label: "Processes",   icon: <ListIcon />, badge: "proc" },
    ],
  },
  {
    section: "system",
    items: [
      { id: "disks",   label: "Disks",   icon: <DiskIcon /> },
      { id: "network", label: "Network", icon: <GlobeIcon /> },
    ],
  },
  {
    section: "events",
    items: [
      { id: "logs",  label: "Access Logs", icon: <DocIcon />,  badge: "logErr" },
      { id: "stats", label: "Statistics",  icon: <BarIcon /> },
    ],
  },
];

export default function SysmonSidebar({ page, onPage, health, logs }) {
  const alertCount = health?.alerts?.length ?? 0;
  const critCount  = health?.alerts?.filter((a) => a.level === "critical").length ?? 0;
  const errCount   = logs.filter((l) => l.status === "error").length;

  return (
    <nav style={{ width: 220, minWidth: 220, background: "var(--sm-bg-surface)", borderRight: "1px solid var(--sm-border)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {NAV.map(({ section, items }) => (
        <div key={section}>
          <SectionLabel>{section}</SectionLabel>
          {items.map((item) => {
            const isActive = page === item.id;
            let badge = null;
            if (item.id === "overview" && alertCount > 0)
              badge = <NavBadge color={critCount > 0 ? "red" : "amber"}>{alertCount}</NavBadge>;
            if (item.id === "processes" && health?.processCount)
              badge = <NavBadge color="muted">{health.processCount}</NavBadge>;
            if (item.id === "logs" && errCount > 0)
              badge = <NavBadge color="red">!</NavBadge>;

            return (
              <NavItem key={item.id} active={isActive} onClick={() => onPage(item.id)}>
                {item.icon}
                {item.label}
                {badge}
              </NavItem>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: "auto", padding: "12px 14px", borderTop: "1px solid var(--sm-border)" }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)", marginBottom: 3 }}>system uptime</div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--sm-cyan)" }}>{health?.uptime ?? "—"}</div>
      </div>
    </nav>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ padding: "14px 12px 4px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 600, color: "var(--sm-text-3)", letterSpacing: "1.4px", textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

function NavItem({ active, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9, padding: "8px 14px",
        cursor: "pointer", fontSize: 12, color: active ? "var(--sm-accent)" : "var(--sm-text-2)",
        background: active ? "var(--sm-accent-dim)" : "transparent",
        borderLeft: active ? "2px solid var(--sm-accent)" : "2px solid transparent",
        transition: "background .1s, color .1s", userSelect: "none",
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--sm-bg-hover)"; e.currentTarget.style.color = "var(--sm-text-1)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sm-text-2)"; } }}
    >
      {children}
    </div>
  );
}

function NavBadge({ color, children }) {
  const styles = {
    red:   { background: "var(--sm-red-dim)",   color: "var(--sm-red)" },
    amber: { background: "var(--sm-amber-dim)", color: "var(--sm-amber)" },
    muted: { background: "var(--sm-bg-raised)", color: "var(--sm-text-3)" },
  };
  const s = styles[color] ?? styles.muted;
  return (
    <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3, minWidth: 18, textAlign: "center", ...s }}>
      {children}
    </span>
  );
}

// ── Inline SVG icons ───────────────────────────────────────────────────────────
function GridIcon()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ flexShrink: 0, opacity: .8 }}><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>; }
function LineIcon()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ flexShrink: 0, opacity: .8 }}><polyline points="1,12 5,7 8,9 11,4 15,4"/></svg>; }
function ListIcon()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ flexShrink: 0, opacity: .8 }}><rect x="1" y="3" width="14" height="2" rx=".5"/><rect x="1" y="7" width="10" height="2" rx=".5"/><rect x="1" y="11" width="12" height="2" rx=".5"/></svg>; }
function DiskIcon()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ flexShrink: 0, opacity: .8 }}><ellipse cx="8" cy="5" rx="7" ry="3"/><path d="M1 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5"/></svg>; }
function GlobeIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ flexShrink: 0, opacity: .8 }}><circle cx="8" cy="8" r="6"/><line x1="8" y1="2" x2="8" y2="14"/><path d="M2 8c1.5 2 4 3.5 6 3.5s4.5-1.5 6-3.5"/><path d="M2 8c1.5-2 4-3.5 6-3.5s4.5 1.5 6 3.5"/></svg>; }
function DocIcon()   { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ flexShrink: 0, opacity: .8 }}><path d="M2 2h12v12H2z"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="9" y2="9"/></svg>; }
function BarIcon()   { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ flexShrink: 0, opacity: .8 }}><rect x="2" y="9" width="3" height="5"/><rect x="6.5" y="5" width="3" height="9"/><rect x="11" y="1" width="3" height="13"/></svg>; }
