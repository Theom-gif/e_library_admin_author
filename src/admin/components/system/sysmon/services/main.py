from __future__ import annotations

import asyncio
import math
import os
import random
import socket
import time
from collections import deque
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Literal

import psutil
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing_extensions import TypedDict

# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(title="System Monitoring API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Constants ──────────────────────────────────────────────────────────────────
ROOT_PATH = os.path.abspath(os.sep)
HOSTNAME = socket.gethostname()
AUTH_LOG_CANDIDATES = (Path("/var/log/auth.log"), Path("/var/log/secure"))
REGIONS = ("phnom-penh", "singapore", "tokyo", "frankfurt")
SERVICES = ("ssh", "sudo", "nginx", "postgres", "systemd")
ACTIONS = (
    "SSH login",
    "Sudo elevation",
    "API token refresh",
    "Config deployment",
    "Session timeout",
    "Permission denied",
)
LogStatus = Literal["success", "warning", "error"]

# In-memory ring buffer for history (last 120 points = 10 min at 5s interval)
_history_ring: deque[HistoryPoint] = deque(maxlen=120)
_previous_network: tuple[int, int] | None = None
_previous_network_at: float | None = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)

ws_manager = ConnectionManager()


# ── TypedDicts ─────────────────────────────────────────────────────────────────
class LogEntry(TypedDict):
    id: str
    user: str
    action: str
    sourceIp: str
    status: LogStatus
    service: str
    region: str
    at: str


class Alert(TypedDict):
    id: str
    level: Literal["warning", "critical"]
    metric: str
    message: str
    value: float
    threshold: float
    at: str


class HealthSnapshot(TypedDict):
    hostname: str
    platform: str
    cpu: float
    cpuCores: int
    cpuFreqMhz: float
    memory: float
    memoryTotalGb: float
    memoryUsedGb: float
    swap: float
    swapTotalGb: float
    disk: float
    uptime: str
    uptimeSeconds: int
    networkIn: float
    networkOut: float
    networkTotalInMb: float
    networkTotalOutMb: float
    activeSessions: int
    processCount: int
    threadCount: int
    loadAverage: list[float]
    alerts: list[Alert]
    updatedAt: str


class ProcessEntry(TypedDict):
    pid: int
    name: str
    status: str
    cpu: float
    memoryMb: float
    memoryPercent: float
    threads: int
    user: str
    created: str


class DiskPartition(TypedDict):
    device: str
    mountpoint: str
    fstype: str
    total_gb: float
    used_gb: float
    free_gb: float
    percent: float


class NetworkInterface(TypedDict):
    name: str
    isUp: bool
    speedMbps: int
    bytesSentMb: float
    bytesRecvMb: float
    packetsSent: int
    packetsRecv: int
    errIn: int
    errOut: int
    addresses: list[str]


class HistoryPoint(TypedDict):
    timestamp: str
    cpu: float
    memory: float
    disk: float
    networkIn: float
    networkOut: float


class HistoryResponse(TypedDict):
    history: list[HistoryPoint]


class LogsResponse(TypedDict):
    logs: list[LogEntry]
    total: int


class ProcessesResponse(TypedDict):
    processes: list[ProcessEntry]
    total: int
    sortBy: str


class DisksResponse(TypedDict):
    partitions: list[DiskPartition]


class NetworkResponse(TypedDict):
    interfaces: list[NetworkInterface]


class StatsResponse(TypedDict):
    logStats: dict
    alertStats: dict


# ── Helpers ────────────────────────────────────────────────────────────────────
def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def format_uptime(total_seconds: int) -> str:
    days, remainder = divmod(total_seconds, 86_400)
    hours, remainder = divmod(remainder, 3_600)
    minutes, _seconds = divmod(remainder, 60)
    if days:
        return f"{days}d {hours}h {minutes}m"
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def get_load_average(cpu_percent: float) -> list[float]:
    try:
        values = psutil.getloadavg()
        return [round(v, 2) for v in values]
    except (AttributeError, OSError):
        scaled = max(cpu_percent / 100, 0.1) * max(psutil.cpu_count() or 1, 1)
        return [round(clamp(scaled * f, 0.1, scaled * 1.5), 2) for f in (0.8, 1.0, 1.1)]


def get_network_rate() -> tuple[float, float, float, float]:
    global _previous_network, _previous_network_at
    current = psutil.net_io_counters()
    current_totals = (current.bytes_recv, current.bytes_sent)
    now = time.monotonic()
    total_in_mb = round(current.bytes_recv / 1024 / 1024, 2)
    total_out_mb = round(current.bytes_sent / 1024 / 1024, 2)

    if _previous_network is None or _previous_network_at is None:
        _previous_network = current_totals
        _previous_network_at = now
        return 0.0, 0.0, total_in_mb, total_out_mb

    elapsed = max(now - _previous_network_at, 0.001)
    incoming = max(current_totals[0] - _previous_network[0], 0)
    outgoing = max(current_totals[1] - _previous_network[1], 0)
    _previous_network = current_totals
    _previous_network_at = now
    rate_in = incoming / elapsed / 1024 / 1024
    rate_out = outgoing / elapsed / 1024 / 1024
    return rate_in, rate_out, total_in_mb, total_out_mb


def build_alerts(cpu: float, memory: float, disk: float, swap: float) -> list[Alert]:
    alerts: list[Alert] = []
    now = datetime.now(UTC).isoformat()
    thresholds = [
        ("cpu",    cpu,    85.0, 95.0, "CPU"),
        ("memory", memory, 88.0, 96.0, "Memory"),
        ("disk",   disk,   90.0, 97.0, "Disk"),
        ("swap",   swap,   70.0, 90.0, "Swap"),
    ]
    for metric_id, value, warn_t, crit_t, label in thresholds:
        if value >= crit_t:
            alerts.append({
                "id": f"{metric_id}-crit",
                "level": "critical",
                "metric": metric_id,
                "message": f"{label} critical: {value}% (threshold {crit_t}%)",
                "value": value,
                "threshold": crit_t,
                "at": now,
            })
        elif value >= warn_t:
            alerts.append({
                "id": f"{metric_id}-warn",
                "level": "warning",
                "metric": metric_id,
                "message": f"{label} elevated: {value}% (threshold {warn_t}%)",
                "value": value,
                "threshold": warn_t,
                "at": now,
            })
    return alerts


def get_platform() -> str:
    import platform
    return platform.system()  # Windows / Linux / Darwin


def infer_user(message: str) -> str:
    parts = message.replace("=", " ").split()
    for i, part in enumerate(parts[:-1]):
        if part.lower() in {"for", "user"}:
            return parts[i + 1]
    return "root"


def infer_ip(message: str) -> str:
    for token in message.replace(",", " ").split():
        if token.count(".") == 3:
            return token
    return "10.0.0.1"


def infer_service(message: str) -> str:
    lowered = message.lower()
    if "sshd" in lowered: return "ssh"
    if "sudo" in lowered: return "sudo"
    if "nginx" in lowered: return "nginx"
    return "systemd"


def random_log_status() -> LogStatus:
    roll = random.random()
    if roll < 0.12: return "error"
    if roll < 0.30: return "warning"
    return "success"


def synthetic_logs(limit: int) -> list[LogEntry]:
    now = datetime.now(UTC)
    entries: list[LogEntry] = []
    for i in range(limit):
        status = random_log_status()
        entries.append({
            "id": f"demo-{i}",
            "user": random.choice(("root", "deploy", "monitor", "ubuntu", "ops", "admin")),
            "action": random.choice(ACTIONS),
            "sourceIp": f"10.21.{i % 8}.{20 + i}",
            "status": status,
            "service": random.choice(SERVICES),
            "region": random.choice(REGIONS),
            "at": (now - timedelta(minutes=i * 3)).isoformat(),
        })
    return entries


def read_access_logs(limit: int) -> list[LogEntry]:
    for candidate in AUTH_LOG_CANDIDATES:
        if not candidate.exists():
            continue
        lines = candidate.read_text(encoding="utf-8", errors="ignore").splitlines()
        entries: list[LogEntry] = []
        for offset, line in enumerate(reversed(lines[-limit * 8:]), start=1):
            lowered = line.lower()
            if "accepted" in lowered:
                status: LogStatus = "success"
                action = "SSH login"
            elif "failed" in lowered or "invalid" in lowered:
                status = "error"
                action = "Authentication failure"
            elif "sudo" in lowered:
                status = "warning"
                action = "Sudo elevation"
            else:
                continue
            entries.append({
                "id": f"log-{offset}",
                "user": infer_user(line),
                "action": action,
                "sourceIp": infer_ip(line),
                "status": status,
                "service": infer_service(line),
                "region": random.choice(REGIONS),
                "at": (datetime.now(UTC) - timedelta(minutes=offset)).isoformat(),
            })
            if len(entries) >= limit:
                return entries
    return synthetic_logs(limit)


# ── Payload builders ───────────────────────────────────────────────────────────
def health_payload() -> HealthSnapshot:
    cpu = round(psutil.cpu_percent(interval=0.15), 1)
    mem = psutil.virtual_memory()
    swap_info = psutil.swap_memory()
    disk_info = psutil.disk_usage(ROOT_PATH)
    swap_pct = round(swap_info.percent, 1)
    memory = round(mem.percent, 1)
    disk = round(disk_info.percent, 1)
    net_in, net_out, total_in, total_out = get_network_rate()

    freq = psutil.cpu_freq()
    freq_mhz = round(freq.current, 0) if freq else 0.0

    return {
        "hostname": HOSTNAME,
        "platform": get_platform(),
        "cpu": cpu,
        "cpuCores": psutil.cpu_count(logical=True) or 1,
        "cpuFreqMhz": freq_mhz,
        "memory": memory,
        "memoryTotalGb": round(mem.total / 1024**3, 2),
        "memoryUsedGb": round(mem.used / 1024**3, 2),
        "swap": swap_pct,
        "swapTotalGb": round(swap_info.total / 1024**3, 2),
        "disk": disk,
        "uptime": format_uptime(int(time.time() - psutil.boot_time())),
        "uptimeSeconds": int(time.time() - psutil.boot_time()),
        "networkIn": round(net_in, 3),
        "networkOut": round(net_out, 3),
        "networkTotalInMb": total_in,
        "networkTotalOutMb": total_out,
        "activeSessions": len(psutil.users()),
        "processCount": len(psutil.pids()),
        "threadCount": sum(p.num_threads() for p in psutil.process_iter(["num_threads"]) if p.info.get("num_threads")),
        "loadAverage": get_load_average(cpu),
        "alerts": build_alerts(cpu, memory, disk, swap_pct),
        "updatedAt": datetime.now(UTC).isoformat(),
    }


def history_payload(points: int) -> list[HistoryPoint]:
    # Return from live ring buffer if we have enough points
    ring = list(_history_ring)
    if len(ring) >= points:
        return ring[-points:]

    # Pad with synthetic data before the ring starts
    baseline = health_payload()
    cpu, memory, disk = baseline["cpu"], baseline["memory"], baseline["disk"]
    now = datetime.now(UTC)
    history: list[HistoryPoint] = []
    needed = points - len(ring)
    for i in range(needed):
        phase = (needed - i) / 3.2
        history.append({
            "timestamp": (now - timedelta(seconds=(points - i - 1) * 5)).isoformat(),
            "cpu": round(clamp(cpu + math.sin(phase) * 9 + random.uniform(-3, 3), 2, 99), 1),
            "memory": round(clamp(memory + math.cos(phase / 1.7) * 6 + random.uniform(-2, 2), 5, 99), 1),
            "disk": round(clamp(disk + math.sin(phase / 2.4) * 2 + random.uniform(-0.8, 0.8), 10, 99), 1),
            "networkIn": round(random.uniform(0, 2), 3),
            "networkOut": round(random.uniform(0, 1), 3),
        })
    return history + ring


def processes_payload(limit: int = 30, sort_by: str = "cpu") -> list[ProcessEntry]:
    procs: list[ProcessEntry] = []
    attrs = ["pid", "name", "status", "cpu_percent", "memory_info", "memory_percent",
             "num_threads", "username", "create_time"]
    for p in psutil.process_iter(attrs):
        try:
            info = p.info
            mem_mb = round((info.get("memory_info") or psutil._common.pmem(0, 0)).rss / 1024**2, 2)
            created = datetime.fromtimestamp(info.get("create_time") or 0, UTC).isoformat()
            procs.append({
                "pid": info["pid"],
                "name": info.get("name") or "unknown",
                "status": info.get("status") or "unknown",
                "cpu": round(info.get("cpu_percent") or 0.0, 1),
                "memoryMb": mem_mb,
                "memoryPercent": round(info.get("memory_percent") or 0.0, 2),
                "threads": info.get("num_threads") or 1,
                "user": info.get("username") or "?",
                "created": created,
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    key_map = {"cpu": "cpu", "memory": "memoryMb", "name": "name", "pid": "pid", "threads": "threads"}
    sort_key = key_map.get(sort_by, "cpu")
    reverse = sort_key not in ("name",)
    procs.sort(key=lambda x: x[sort_key], reverse=reverse)
    return procs[:limit]


def disks_payload() -> list[DiskPartition]:
    parts: list[DiskPartition] = []
    for part in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(part.mountpoint)
            parts.append({
                "device": part.device,
                "mountpoint": part.mountpoint,
                "fstype": part.fstype,
                "total_gb": round(usage.total / 1024**3, 2),
                "used_gb": round(usage.used / 1024**3, 2),
                "free_gb": round(usage.free / 1024**3, 2),
                "percent": round(usage.percent, 1),
            })
        except (PermissionError, OSError):
            continue
    return parts


def network_interfaces_payload() -> list[NetworkInterface]:
    stats = psutil.net_if_stats()
    io = psutil.net_io_counters(pernic=True)
    addrs = psutil.net_if_addrs()
    ifaces: list[NetworkInterface] = []
    for name, stat in stats.items():
        nic_io = io.get(name)
        nic_addrs = addrs.get(name, [])
        addr_list = [a.address for a in nic_addrs if a.address and "%" not in a.address]
        ifaces.append({
            "name": name,
            "isUp": stat.isup,
            "speedMbps": stat.speed,
            "bytesSentMb": round(nic_io.bytes_sent / 1024**2, 2) if nic_io else 0.0,
            "bytesRecvMb": round(nic_io.bytes_recv / 1024**2, 2) if nic_io else 0.0,
            "packetsSent": nic_io.packets_sent if nic_io else 0,
            "packetsRecv": nic_io.packets_recv if nic_io else 0,
            "errIn": nic_io.errin if nic_io else 0,
            "errOut": nic_io.errout if nic_io else 0,
            "addresses": addr_list,
        })
    ifaces.sort(key=lambda x: (not x["isUp"], x["name"]))
    return ifaces


# ── Background task: push to ring buffer and WS clients ───────────────────────
async def collector_loop():
    while True:
        try:
            h = health_payload()
            point: HistoryPoint = {
                "timestamp": h["updatedAt"],
                "cpu": h["cpu"],
                "memory": h["memory"],
                "disk": h["disk"],
                "networkIn": h["networkIn"],
                "networkOut": h["networkOut"],
            }
            _history_ring.append(point)
            await ws_manager.broadcast({"type": "health", "data": h})
        except Exception:
            pass
        await asyncio.sleep(5)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(collector_loop())


# ── REST Endpoints ─────────────────────────────────────────────────────────────
@app.get("/api/health")
def get_health() -> HealthSnapshot:
    return health_payload()


@app.get("/api/history")
def get_history(points: int = Query(48, ge=8, le=120)) -> HistoryResponse:
    return {"history": history_payload(points)}


@app.get("/api/logs")
def get_logs(
    limit: int = Query(60, ge=10, le=200),
    status: str | None = Query(None),
    service: str | None = Query(None),
) -> LogsResponse:
    logs = read_access_logs(limit * 2)
    if status:
        logs = [l for l in logs if l["status"] == status]
    if service:
        logs = [l for l in logs if l["service"] == service]
    return {"logs": logs[:limit], "total": len(logs)}


@app.get("/api/processes")
def get_processes(
    limit: int = Query(30, ge=5, le=100),
    sort_by: str = Query("cpu", regex="^(cpu|memory|name|pid|threads)$"),
) -> ProcessesResponse:
    procs = processes_payload(limit, sort_by)
    return {"processes": procs, "total": len(psutil.pids()), "sortBy": sort_by}


@app.get("/api/disks")
def get_disks() -> DisksResponse:
    return {"partitions": disks_payload()}


@app.get("/api/network/interfaces")
def get_network_interfaces() -> NetworkResponse:
    return {"interfaces": network_interfaces_payload()}


@app.get("/api/stats")
def get_stats() -> StatsResponse:
    logs = read_access_logs(200)
    log_counts: dict[str, int] = {"success": 0, "warning": 0, "error": 0}
    service_counts: dict[str, int] = {}
    for l in logs:
        log_counts[l["status"]] = log_counts.get(l["status"], 0) + 1
        service_counts[l["service"]] = service_counts.get(l["service"], 0) + 1

    h = health_payload()
    alert_by_level: dict[str, int] = {"warning": 0, "critical": 0}
    for a in h["alerts"]:
        alert_by_level[a["level"]] = alert_by_level.get(a["level"], 0) + 1

    return {
        "logStats": {
            "byStatus": log_counts,
            "byService": service_counts,
            "total": len(logs),
        },
        "alertStats": {
            "byLevel": alert_by_level,
            "total": len(h["alerts"]),
            "active": [a["metric"] for a in h["alerts"]],
        },
    }


# ── WebSocket endpoint ─────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial snapshot immediately
        await websocket.send_json({"type": "health", "data": health_payload()})
        while True:
            # Keep alive — client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)