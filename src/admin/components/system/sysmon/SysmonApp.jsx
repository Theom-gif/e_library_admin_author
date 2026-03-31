import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  generateDisks,
  generateHealth,
  generateLogs,
  generateNetworkInterfaces,
  generateProcesses,
  generateStats,
  getHistory,
  pushHistory,
} from "../helpers";
import DisksPage from "./DisksPage";
import LogsPage from "./LogsPage";
import NetworkPage from "./NetworkPage";
import OverviewPage from "./OverviewPage";
import PerformancePage from "./PerformancePage";
import ProcessesPage from "./ProcessesPage";
import StatsPage from "./StatsPage";
import SysmonSidebar from "./SysmonSidebar";
import { TriangleIcon } from "./primitives";
import { fetchSysmonJson, openSysmonWebSocket } from "./api";

const HISTORY_POINTS = 48;
const LOG_LIMIT = 80;
const PROCESS_LIMIT = 50;
const WS_RECONNECT_DELAY_MS = 3000;

const appendHistoryPoint = (history, health) => {
  if (!health?.updatedAt) {
    return history;
  }

  const point = {
    timestamp: health.updatedAt,
    cpu: health.cpu ?? 0,
    memory: health.memory ?? 0,
    disk: health.disk ?? 0,
    networkIn: health.networkIn ?? 0,
    networkOut: health.networkOut ?? 0,
  };

  const nextHistory =
    history.length && history[history.length - 1]?.timestamp === point.timestamp
      ? [...history.slice(0, -1), point]
      : [...history, point];

  return nextHistory.slice(-HISTORY_POINTS);
};

export default function SysmonApp({ onBack }) {
  const { isDark } = useTheme();
  const [page, setPage] = useState("overview");
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [procSort, setProcSort] = useState("cpu");
  const [disks, setDisks] = useState([]);
  const [network, setNetwork] = useState([]);
  const [stats, setStats] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [wsState, setWsState] = useState("connecting");
  const [dataMode, setDataMode] = useState("remote");
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const logsRef = useRef([]);
  const prevAlertIds = useRef(new Set());

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  const addToast = useCallback((level, title, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, level, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const applyFallbackSnapshot = useCallback(({ sort = "cpu", refreshLogs = true } = {}) => {
    const nextHealth = generateHealth();
    const nextLogs = refreshLogs ? generateLogs(LOG_LIMIT) : logsRef.current;

    pushHistory(nextHealth);
    setHealth(nextHealth);
    setHistory(getHistory(HISTORY_POINTS));
    if (refreshLogs) {
      setLogs(nextLogs);
    }
    setProcesses(generateProcesses(PROCESS_LIMIT, sort));
    setDisks(generateDisks());
    setNetwork(generateNetworkInterfaces());
    setStats(generateStats(nextLogs, nextHealth));
    setDataMode("fallback");
    setLoadError("");
    prevAlertIds.current = new Set((nextHealth.alerts || []).map((alert) => alert.id));
  }, []);

  const loadSection = useCallback(async (label, loader, { silent = false } = {}) => {
    try {
      const result = await loader();
      setLoadError("");
      return result;
    } catch (error) {
      console.error(`[sysmon] ${label} load failed`, error);
      if (!silent) {
        setLoadError(`Unable to load ${label}.`);
      }
      return null;
    }
  }, []);

  const fetchHealth = useCallback(
    async (options = {}) =>
      loadSection(
        "health",
        async () => {
          const data = await fetchSysmonJson("health");
          setHealth(data || null);
          setHistory((current) => appendHistoryPoint(current, data));
          setDataMode("remote");
          return data;
        },
        options,
      ),
    [loadSection],
  );

  const fetchHistory = useCallback(
    async (options = {}) =>
      loadSection(
        "history",
        async () => {
          const data = await fetchSysmonJson(`history?points=${HISTORY_POINTS}`);
          setHistory(Array.isArray(data?.history) ? data.history : []);
          setDataMode("remote");
          return data;
        },
        options,
      ),
    [loadSection],
  );

  const fetchLogs = useCallback(
    async (options = {}) =>
      loadSection(
        "logs",
        async () => {
          const data = await fetchSysmonJson(`logs?limit=${LOG_LIMIT}`);
          setLogs(Array.isArray(data?.logs) ? data.logs : []);
          setDataMode("remote");
          return data;
        },
        options,
      ),
    [loadSection],
  );

  const fetchProcesses = useCallback(
    async (sort = "cpu", options = {}) => {
      const result = await loadSection(
        "processes",
        async () => {
          const data = await fetchSysmonJson(
            `processes?limit=${PROCESS_LIMIT}&sort_by=${encodeURIComponent(sort)}`,
          );
          setProcesses(Array.isArray(data?.processes) ? data.processes : []);
          setDataMode("remote");
          return data;
        },
        options,
      );

      if (!result) {
        setProcesses(generateProcesses(PROCESS_LIMIT, sort));
        if (options?.silent !== false) {
          setLoadError("");
        }
      }

      return result;
    },
    [loadSection],
  );

  const fetchDisks = useCallback(
    async (options = {}) =>
      loadSection(
        "disks",
        async () => {
          const data = await fetchSysmonJson("disks");
          setDisks(Array.isArray(data?.partitions) ? data.partitions : []);
          setDataMode("remote");
          return data;
        },
        options,
      ),
    [loadSection],
  );

  const fetchNetwork = useCallback(
    async (options = {}) =>
      loadSection(
        "network interfaces",
        async () => {
          const data = await fetchSysmonJson("network/interfaces");
          setNetwork(Array.isArray(data?.interfaces) ? data.interfaces : []);
          setDataMode("remote");
          return data;
        },
        options,
      ),
    [loadSection],
  );

  const fetchStats = useCallback(
    async (options = {}) =>
      loadSection(
        "statistics",
        async () => {
          const data = await fetchSysmonJson("stats");
          setStats(data || null);
          setDataMode("remote");
          return data;
        },
        options,
      ),
    [loadSection],
  );

  const refreshAll = useCallback(async () => {
    const results = await Promise.all([
      fetchHealth(),
      fetchHistory(),
      fetchLogs(),
      fetchProcesses(procSort),
      fetchDisks(),
      fetchNetwork(),
      fetchStats(),
    ]);

    const hasRemoteHealth = Boolean(results[0]);
    const failedCount = results.filter((result) => result == null).length;

    if (!hasRemoteHealth && failedCount >= 3) {
      applyFallbackSnapshot({ sort: procSort, refreshLogs: true });
    }
  }, [
    applyFallbackSnapshot,
    fetchDisks,
    fetchHealth,
    fetchHistory,
    fetchLogs,
    fetchNetwork,
    fetchProcesses,
    fetchStats,
    procSort,
  ]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (dataMode === "fallback") {
      setProcesses(generateProcesses(PROCESS_LIMIT, procSort));
      return;
    }

    fetchProcesses(procSort, { silent: true });
  }, [dataMode, fetchProcesses, procSort]);

  useEffect(() => {
    if (dataMode === "fallback") {
      return undefined;
    }

    const historyId = window.setInterval(() => {
      fetchHistory({ silent: true });
    }, 10000);
    const logsId =
      page === "logs"
        ? null
        : window.setInterval(() => {
            fetchLogs({ silent: true });
          }, 15000);
    const statsId = window.setInterval(() => {
      fetchStats({ silent: true });
    }, 15000);

    return () => {
      window.clearInterval(historyId);
      if (logsId) {
        window.clearInterval(logsId);
      }
      window.clearInterval(statsId);
    };
  }, [dataMode, fetchHistory, fetchLogs, fetchStats, page]);

  useEffect(() => {
    if (dataMode === "fallback") {
      const fallbackHealthId = window.setInterval(() => {
        applyFallbackSnapshot({ sort: procSort, refreshLogs: page !== "logs" });
      }, 5000);

      return () => {
        window.clearInterval(fallbackHealthId);
      };
    }

    if (wsState === "live") {
      return undefined;
    }

    const fallbackHealthId = window.setInterval(() => {
      fetchHealth({ silent: true });
    }, 15000);

    return () => {
      window.clearInterval(fallbackHealthId);
    };
  }, [applyFallbackSnapshot, dataMode, fetchHealth, page, procSort, wsState]);

  useEffect(() => {
    if (dataMode === "fallback") {
      if (page === "disks") {
        setDisks(generateDisks());
      }
      if (page === "network") {
        setNetwork(generateNetworkInterfaces());
      }
      if (page === "stats" && health) {
        setStats(generateStats(logs, health));
      }
      return;
    }

    if (page === "disks") {
      fetchDisks({ silent: true });
    }
    if (page === "network") {
      fetchNetwork({ silent: true });
    }
    if (page === "logs") {
      fetchLogs({ silent: true });
    }
    if (page === "stats") {
      fetchStats({ silent: true });
    }
  }, [dataMode, fetchDisks, fetchLogs, fetchNetwork, fetchStats, health, logs, page]);

  const refreshLogsView = useCallback(() => {
    if (dataMode === "fallback") {
      const nextLogs = generateLogs(LOG_LIMIT);
      setLogs(nextLogs);
      if (health) {
        setStats(generateStats(nextLogs, health));
      }
      return;
    }

    fetchLogs();
  }, [dataMode, fetchLogs, health]);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) {
        return;
      }

      setWsState("connecting");

      try {
        const socket = openSysmonWebSocket();
        wsRef.current = socket;

        socket.onopen = () => {
          if (!cancelled) {
            setWsState("live");
          }
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message?.type !== "health" || !message.data) {
              return;
            }

            setDataMode("remote");
            setLoadError("");
            setHealth(message.data);
            setHistory((current) => appendHistoryPoint(current, message.data));

            const nextAlertIds = new Set((message.data.alerts || []).map((alert) => alert.id));
            (message.data.alerts || []).forEach((alert) => {
              if (!prevAlertIds.current.has(alert.id)) {
                addToast(alert.level, alert.metric.toUpperCase(), alert.message);
              }
            });
            prevAlertIds.current = nextAlertIds;
          } catch (error) {
            console.error("[sysmon] websocket payload error", error);
          }
        };

        socket.onerror = () => {
          if (!cancelled) {
            setWsState("offline");
          }
        };

        socket.onclose = () => {
          if (wsRef.current === socket) {
            wsRef.current = null;
          }
          if (cancelled) {
            return;
          }

          setWsState("offline");
          reconnectRef.current = window.setTimeout(connect, WS_RECONNECT_DELAY_MS);
        };
      } catch (error) {
        console.error("[sysmon] websocket connect failed", error);
        setWsState("offline");
        reconnectRef.current = window.setTimeout(connect, WS_RECONNECT_DELAY_MS);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [addToast]);

  const theme = isDark ? "dark" : "light";

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden"
      style={{
        fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', monospace",
        background: "var(--sm-bg-base)",
        color: "var(--sm-text-1)",
      }}
      data-sysmon={theme}
    >
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs shadow-xl"
            style={{
              background:
                toast.level === "critical" ? "var(--sm-red-dim)" : "var(--sm-amber-dim)",
              borderColor:
                toast.level === "critical"
                  ? "rgba(232,65,74,.3)"
                  : "rgba(240,165,0,.3)",
              color: "var(--sm-text-1)",
              maxWidth: 300,
            }}
          >
            <TriangleIcon
              size={13}
              style={{
                color: toast.level === "critical" ? "var(--sm-red)" : "var(--sm-amber)",
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{toast.title}</div>
              <div style={{ color: "var(--sm-text-2)", fontSize: 10 }}>{toast.message}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex h-[50px] shrink-0 items-center gap-3 border-b px-4"
        style={{ background: "var(--sm-bg-surface)", borderColor: "var(--sm-border)" }}
      >
        {typeof onBack === "function" && (
          <button
            onClick={onBack}
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 10,
              background: "transparent",
              border: "1px solid var(--sm-border)",
              borderRadius: 4,
              color: "var(--sm-text-3)",
              padding: "4px 9px",
              cursor: "pointer",
            }}
          >
            back
          </button>
        )}
        <LogoMark />
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: -0.3,
          }}
        >
          sysmon
        </span>
        <HostBadge health={health} />
        <div className="flex-1" />
        <button
          onClick={refreshAll}
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 10,
            background: "transparent",
            border: "1px solid var(--sm-border)",
            borderRadius: 4,
            color: "var(--sm-text-3)",
            padding: "4px 9px",
            cursor: "pointer",
          }}
        >
          refresh
        </button>
        <span
          style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)" }}
        >
          poll: 5s health | 10s history | 15s logs
        </span>
        <WsBadge state={wsState} dataMode={dataMode} />
      </div>

      {loadError && (
        <div
          className="flex items-center gap-2 border-b px-4 py-2"
          style={{
            background: "var(--sm-amber-dim)",
            borderColor: "rgba(240,165,0,.16)",
            color: "var(--sm-amber)",
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 10,
          }}
        >
          <TriangleIcon size={12} />
          <span>{loadError}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <SysmonSidebar page={page} onPage={setPage} health={health} logs={logs} />

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5" style={{ background: "var(--sm-bg-base)", minWidth: 0 }}>
          {page === "overview" && <OverviewPage health={health} history={history} isDark={isDark} />}
          {page === "performance" && <PerformancePage history={history} isDark={isDark} />}
          {page === "processes" && (
            <ProcessesPage
              processes={processes}
              sortBy={procSort}
              onSort={setProcSort}
              onRefresh={() => fetchProcesses(procSort)}
            />
          )}
          {page === "disks" && <DisksPage disks={disks} />}
          {page === "network" && <NetworkPage interfaces={network} />}
          {page === "logs" && <LogsPage logs={logs} onRefresh={refreshLogsView} />}
          {page === "stats" && <StatsPage stats={stats} isDark={isDark} />}
        </div>
      </div>

      <div
        className="flex shrink-0 items-center justify-between border-t px-4 py-1.5"
        style={{
          background: "var(--sm-bg-surface)",
          borderColor: "var(--sm-border)",
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 9,
          color: "var(--sm-text-3)",
        }}
      >
        <div className="flex gap-4">
          <span>
            logs: <span style={{ color: "var(--sm-text-2)" }}>{logs.length}</span>
          </span>
          <span>
            processes: <span style={{ color: "var(--sm-text-2)" }}>{health?.processCount ?? "-"}</span>
          </span>
          <span>
            uptime: <span style={{ color: "var(--sm-cyan)" }}>{health?.uptime ?? "-"}</span>
          </span>
        </div>
        <span>sysmon v2.1</span>
      </div>

      <SysmonCssVars isDark={isDark} />
    </div>
  );
}

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

function LogoMark() {
  return (
    <div
      style={{
        width: 26,
        height: 26,
        background: "var(--sm-accent)",
        borderRadius: 5,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
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
    <div
      className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px]"
      style={{
        background: "var(--sm-bg-raised)",
        border: "1px solid var(--sm-border)",
        fontFamily: "'IBM Plex Mono',monospace",
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: health ? "var(--sm-green)" : "var(--sm-text-3)",
          animation: health ? "pulse 2.4s ease infinite" : "none",
        }}
      />
      <span style={{ color: "var(--sm-text-2)" }}>{health?.hostname ?? "-"}</span>
      {health?.platform && (
        <span style={{ color: "var(--sm-text-3)", fontSize: 9 }}>[{health.platform}]</span>
      )}
    </div>
  );
}

function WsBadge({ state, dataMode }) {
  if (dataMode === "fallback") {
    return (
      <div
        className="rounded px-2 py-1 text-[10px]"
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          background: "var(--sm-amber-dim)",
          border: "1px solid rgba(240,165,0,.3)",
          color: "var(--sm-amber)",
        }}
      >
        local
      </div>
    );
  }

  const badge =
    state === "live"
      ? {
          label: "live",
          style: {
            background: "var(--sm-green-dim)",
            border: "1px solid rgba(39,201,143,.3)",
            color: "var(--sm-green)",
          },
        }
      : state === "connecting"
        ? {
            label: "connecting",
            style: {
              background: "var(--sm-accent-dim)",
              border: "1px solid rgba(47,128,237,.3)",
              color: "var(--sm-accent)",
            },
          }
        : {
            label: "offline",
            style: {
              background: "var(--sm-red-dim)",
              border: "1px solid rgba(232,65,74,.3)",
              color: "var(--sm-red)",
            },
          };

  return (
    <div
      className="rounded px-2 py-1 text-[10px]"
      style={{ fontFamily: "'IBM Plex Mono',monospace", ...badge.style }}
    >
      {badge.label}
    </div>
  );
}
