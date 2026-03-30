import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../theme/ThemeContext";
import { generateStats } from "../components/system/helpers";
import { useSystemMonitor } from "../hooks/useSystemMonitor";
import SysmonSidebar   from "../components/system/sysmon/SysmonSidebar";
import OverviewPage    from "../components/system/sysmon/OverviewPage";
import PerformancePage from "../components/system/sysmon/PerformancePage";
import ProcessesPage   from "../components/system/sysmon/ProcessesPage";
import DisksPage       from "../components/system/sysmon/DisksPage";
import NetworkPage     from "../components/system/sysmon/NetworkPage";
import LogsPage        from "../components/system/sysmon/LogsPage";
import StatsPage       from "../components/system/sysmon/StatsPage";

const PAGES = ["overview", "performance", "processes", "disks", "network", "logs", "stats"];

export default function SystemMonitor() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [page, setPage]         = useState("overview");
  const [procSort, setProcSort] = useState("cpu");
  const [toasts, setToasts]     = useState([]);
  const prevAlertIds            = useRef(new Set());

  // Get real-time system monitoring data from WebSocket
  const { health, history, logs, processes: allProcesses, disks, interfaces: network, stats, connected, error } = useSystemMonitor();

  // Filter processes by sort order
  const processes = allProcesses.length > 0 
    ? allProcesses.sort((a, b) => {
        if (procSort === "cpu") return (b.cpu || 0) - (a.cpu || 0);
        if (procSort === "memory") return (b.memory || 0) - (a.memory || 0);
        if (procSort === "name") return (a.name || "").localeCompare(b.name || "");
        return 0;
      }).slice(0, 50)
    : [];

  const addToast = useCallback((level, title, msg) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, level, title, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // Toast new alerts from real-time data
  useEffect(() => {
    if (!health?.alerts) return;

    const newIds = new Set(health.alerts.map((a) => a.id));
    health.alerts.forEach((a) => {
      if (!prevAlertIds.current.has(a.id)) {
        addToast(a.level, a.metric.toUpperCase(), a.message);
      }
    });
    prevAlertIds.current = newIds;
  }, [health?.alerts, addToast]);

  // Compute stats when data changes
  const [computedStats, setComputedStats] = useState(null);
  useEffect(() => {
    if (page === "stats" && health) {
      setComputedStats(generateStats(logs, health));
    }
  }, [page, logs, health]);

  const theme = isDark ? "dark" : "light";

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden"
      style={{ fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', monospace", background: "var(--sm-bg-base)", color: "var(--sm-text-1)" }}
      data-sysmon={theme}
    >
      {/* Toast stack */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs shadow-xl"
            style={{
              background: t.level === "critical" ? "var(--sm-red-dim)" : "var(--sm-amber-dim)",
              borderColor: t.level === "critical" ? "rgba(232,65,74,.3)" : "rgba(240,165,0,.3)",
              color: "var(--sm-text-1)",
              maxWidth: 300,
            }}
          >
            <TriangleIcon size={13} style={{ color: t.level === "critical" ? "var(--sm-red)" : "var(--sm-amber)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
              <div style={{ color: "var(--sm-text-2)", fontSize: 10 }}>{t.msg}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div className="flex h-[50px] shrink-0 items-center gap-3 border-b px-4" style={{ background: "var(--sm-bg-surface)", borderColor: "var(--sm-border)" }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors"
          style={{ background: "var(--sm-bg-hover)", border: "1px solid var(--sm-border)" }}
          title="Go back"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <LogoMark />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, letterSpacing: -0.3 }}>sysmon</span>
        <HostBadge health={health} />
        <div className="flex-1" />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)" }}>
          poll: 5s health · 10s history · 15s logs
        </span>
        <WsBadge connected={connected} error={error} />
      </div>

      {/* Shell */}
      <div className="flex flex-1 overflow-hidden">
        <SysmonSidebar
          page={page}
          onPage={setPage}
          health={health}
          logs={logs}
        />

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5 gap-4" style={{ background: "var(--sm-bg-base)" }}>
          {page === "overview"     && <OverviewPage    health={health} history={history} isDark={isDark} />}
          {page === "performance"  && <PerformancePage history={history} isDark={isDark} />}
          {page === "processes"    && <ProcessesPage   processes={processes} sortBy={procSort} onSort={setProcSort} onRefresh={() => setProcesses(generateProcesses(50, procSort))} />}
          {page === "disks"        && <DisksPage       disks={disks} />}
          {page === "network"      && <NetworkPage     interfaces={network} />}
          {page === "logs"         && <LogsPage        logs={logs} />}
          {page === "stats"        && <StatsPage       stats={computedStats} isDark={isDark} />}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t px-4 py-1.5" style={{ background: "var(--sm-bg-surface)", borderColor: "var(--sm-border)", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)" }}>
        <div className="flex gap-4">
          <span>logs: <span style={{ color: "var(--sm-text-2)" }}>{logs.length}</span></span>
          <span>processes: <span style={{ color: "var(--sm-text-2)" }}>{health?.processCount ?? "—"}</span></span>
          <span>uptime: <span style={{ color: "var(--sm-cyan)" }}>{health?.uptime ?? "—"}</span></span>
        </div>
        <span>sysmon v2.0</span>
      </div>

      <SysmonCssVars isDark={isDark} />
    </div>
  );
}

// ── Inline CSS variables scoped to sysmon ──────────────────────────────────────
function SysmonCssVars({ isDark }) {
  const dark = `
    --sm-bg-base:#080b10; --sm-bg-surface:#0e1219; --sm-bg-raised:#141a24;
    --sm-bg-hover:#1a2130; --sm-border:rgba(255,255,255,0.065);
    --sm-border-md:rgba(255,255,255,0.11);
    --sm-text-1:#e8edf4; --sm-text-2:#7d8fa3; --sm-text-3:#3d4f63;
    --sm-accent:#2f80ed; --sm-accent-dim:rgba(47,128,237,0.12);
    --sm-green:#27c98f; --sm-green-dim:rgba(39,201,143,0.10);
    --sm-amber:#f0a500; --sm-amber-dim:rgba(240,165,0,0.10);
    --sm-red:#e8414a;   --sm-red-dim:rgba(232,65,74,0.10);
    --sm-purple:#9b6dff; --sm-purple-dim:rgba(155,109,255,0.10);
    --sm-cyan:#0cbfcf;  --sm-cyan-dim:rgba(12,191,207,0.10);
    --sm-orange:#f97316; --sm-orange-dim:rgba(249,115,22,0.10);
    --sm-chart-grid:rgba(255,255,255,0.04);
  `;
  const light = `
    --sm-bg-base:#f0f2f5; --sm-bg-surface:#ffffff; --sm-bg-raised:#f7f9fc;
    --sm-bg-hover:#eef1f6; --sm-border:rgba(0,0,0,0.07);
    --sm-border-md:rgba(0,0,0,0.11);
    --sm-text-1:#0f1923; --sm-text-2:#4a5a6e; --sm-text-3:#8fa0b3;
    --sm-accent:#1a6fd4; --sm-accent-dim:rgba(26,111,212,0.09);
    --sm-green:#1a9e6e; --sm-green-dim:rgba(26,158,110,0.09);
    --sm-amber:#c27f00; --sm-amber-dim:rgba(194,127,0,0.09);
    --sm-red:#d02b33;   --sm-red-dim:rgba(208,43,51,0.09);
    --sm-purple:#7048e8; --sm-purple-dim:rgba(112,72,232,0.09);
    --sm-cyan:#0899a8;  --sm-cyan-dim:rgba(8,153,168,0.09);
    --sm-orange:#e05c00; --sm-orange-dim:rgba(224,92,0,0.09);
    --sm-chart-grid:rgba(0,0,0,0.05);
  `;
  return <style>{`:root { ${isDark ? dark : light} }`}</style>;
}

// ── Small shared atoms ─────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div style={{ width: 26, height: 26, background: "var(--sm-accent)", borderRadius: 5, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 14 14" width={14} height={14} fill="none">
        <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity=".9" />
        <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".6" />
        <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".6" />
        <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".9" />
      </svg>
    </div>
  );
}

function HostBadge({ health }) {
  return (
    <div className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px]" style={{ background: "var(--sm-bg-raised)", border: "1px solid var(--sm-border)", fontFamily: "'IBM Plex Mono',monospace" }}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: health ? "var(--sm-green)" : "var(--sm-text-3)", animation: health ? "pulse 2.4s ease infinite" : "none" }} />
      <span style={{ color: "var(--sm-text-2)" }}>{health?.hostname ?? "—"}</span>
      {health?.platform && <span style={{ color: "var(--sm-text-3)", fontSize: 9 }}>[{health.platform}]</span>}
    </div>
  );
}

function WsBadge({ connected, error }) {
  if (error) {
    return (
      <div 
        className="rounded px-2 py-1 text-[10px] flex items-center gap-1.5" 
        style={{ fontFamily: "'IBM Plex Mono',monospace", background: "var(--sm-red-dim)", border: "1px solid rgba(232,65,74,.3)", color: "var(--sm-red)" }}
        title={error}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
        error
      </div>
    );
  }

  return (
    <div 
      className="rounded px-2 py-1 text-[10px] flex items-center gap-1.5" 
      style={{ 
        fontFamily: "'IBM Plex Mono',monospace", 
        background: connected ? "var(--sm-green-dim)" : "var(--sm-amber-dim)", 
        border: connected ? "1px solid rgba(39,201,143,.3)" : "1px solid rgba(240,165,0,.3)", 
        color: connected ? "var(--sm-green)" : "var(--sm-amber)" 
      }}
      title={connected ? "Connected to system monitor" : "Connecting..."}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" style={{ animation: connected ? "none" : "pulse 2s ease-in-out infinite" }} />
      {connected ? "live" : "connecting"}
    </div>
  );
}

export function TriangleIcon({ size = 14, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={style}>
      <path d="M7 1L13 13H1L7 1Z" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7" y1="5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="10.5" r=".7" fill="currentColor" />
    </svg>
  );
}
