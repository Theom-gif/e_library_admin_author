import { useEffect, useRef, useState } from "react";

const SYSMON_API_BASE = import.meta.env.VITE_SYSMON_API_BASE || "http://localhost:8000";
const SYSMON_WS_URL = SYSMON_API_BASE.replace(/^http/, "ws");

/**
 * Custom hook for real-time system monitoring via WebSocket
 * Connects to Python FastAPI backend and streams system metrics
 * 
 * @returns {{
 *   health: object|null, 
 *   history: array,
 *   logs: array,
 *   processes: array,
 *   disks: array,
 *   interfaces: array,
 *   stats: object|null,
 *   connected: boolean,
 *   error: string|null,
 *   refetch: function
 * }}
 */
export function useSystemMonitor() {
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [disks, setDisks] = useState([]);
  const [interfaces, setInterfaces] = useState([]);
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isUnmountingRef = useRef(false);

  /**
   * Fetch initial data from REST endpoints
   */
  const fetchInitialData = async () => {
    try {
      setError(null);
      
      // Fetch history in parallel with other data
      const [historyRes, logsRes, processesRes, disksRes, interfacesRes] = await Promise.all([
        fetch(`${SYSMON_API_BASE}/api/history?points=120`),
        fetch(`${SYSMON_API_BASE}/api/logs?limit=80`),
        fetch(`${SYSMON_API_BASE}/api/processes?limit=50&sort_by=cpu`),
        fetch(`${SYSMON_API_BASE}/api/disks`),
        fetch(`${SYSMON_API_BASE}/api/network/interfaces`),
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.history || data.data || []);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || data.data || []);
      }

      if (processesRes.ok) {
        const data = await processesRes.json();
        setProcesses(data.processes || data.data || []);
      }

      if (disksRes.ok) {
        const data = await disksRes.json();
        setDisks(data.disks || data.data || []);
      }

      if (interfacesRes.ok) {
        const data = await interfacesRes.json();
        setInterfaces(data.interfaces || data.data || []);
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError(`Failed to fetch initial data: ${err.message}`);
    }
  };

  /**
   * Connect to WebSocket and listen for real-time updates
   */
  const connectWebSocket = () => {
    if (isUnmountingRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${SYSMON_WS_URL}/ws`);

      ws.onopen = () => {
        console.log("System Monitor WebSocket connected");
        setConnected(true);
        setError(null);
        
        // Fetch initial data once connected
        fetchInitialData();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Update health snapshot
          if (data.health) {
            setHealth(data.health);
            
            // Add to history ring buffer (keep last 120 points)
            setHistory((prev) => {
              const updated = [
                ...prev,
                {
                  timestamp: data.health.timestamp,
                  cpu: data.health.cpu,
                  memory: data.health.memory,
                  disk: data.health.disk,
                  swap: data.health.swap,
                  networkIn: data.health.networkIn,
                  networkOut: data.health.networkOut,
                },
              ];
              
              // Keep only the last 120 points (10 minutes @ 5s interval)
              if (updated.length > 120) {
                return updated.slice(-120);
              }
              return updated;
            });
          }

          // Update other data if included
          if (data.logs) setLogs(data.logs);
          if (data.processes) setProcesses(data.processes);
          if (data.disks) setDisks(data.disks);
          if (data.interfaces) setInterfaces(data.interfaces);
          if (data.stats) setStats(data.stats);
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("WebSocket connection error");
        setConnected(false);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);

        // Attempt to reconnect after 3 seconds (unless unmounting)
        if (!isUnmountingRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Error connecting WebSocket:", err);
      setError(`Failed to connect: ${err.message}`);
      setConnected(false);

      // Retry after 3 seconds
      if (!isUnmountingRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    }
  };

  /**
   * Refetch all data manually
   */
  const refetch = async () => {
    await fetchInitialData();
  };

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    isUnmountingRef.current = false;
    connectWebSocket();

    return () => {
      isUnmountingRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    health,
    history,
    logs,
    processes,
    disks,
    interfaces,
    stats,
    connected,
    error,
    refetch,
  };
}
