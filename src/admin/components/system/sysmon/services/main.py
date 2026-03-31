from __future__ import annotations

import asyncio
import math
import os
import random
import socket
import time
from collections import deque
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Literal

import psutil
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing_extensions import TypedDict

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

# ── Buffers ────────────────────────────────────────────────────────────────────
_history_ring: deque["HistoryPoint"] = deque(maxlen=120)
_previous_network: tuple[int, int] | None = None
_previous_network_at: float | None = None

# ── WebSocket manager ─────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


ws_manager = ConnectionManager()

# ── TypedDicts ────────────────────────────────────────────────────────────────
class HistoryPoint(TypedDict):
    timestamp: str
    cpu: float
    memory: float
    disk: float
    networkIn: float
    networkOut: float


# ── Helpers ───────────────────────────────────────────────────────────────────
def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def get_network_rate():
    global _previous_network, _previous_network_at
    current = psutil.net_io_counters()
    now = time.monotonic()

    if _previous_network is None:
        _previous_network = (current.bytes_recv, current.bytes_sent)
        _previous_network_at = now
        return 0, 0, 0, 0

    elapsed = now - _previous_network_at
    in_rate = (current.bytes_recv - _previous_network[0]) / elapsed / 1024 / 1024
    out_rate = (current.bytes_sent - _previous_network[1]) / elapsed / 1024 / 1024

    _previous_network = (current.bytes_recv, current.bytes_sent)
    _previous_network_at = now

    return in_rate, out_rate, current.bytes_recv / 1024**2, current.bytes_sent / 1024**2


def health_payload():
    cpu = psutil.cpu_percent()
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(ROOT_PATH)
    net_in, net_out, total_in, total_out = get_network_rate()

    return {
        "cpu": cpu,
        "memory": mem.percent,
        "disk": disk.percent,
        "networkIn": round(net_in, 3),
        "networkOut": round(net_out, 3),
        "updatedAt": datetime.now(UTC).isoformat(),
    }


# ── Background Task ───────────────────────────────────────────────────────────
async def collector_loop():
    while True:
        try:
            h = health_payload()
            _history_ring.append({
                "timestamp": h["updatedAt"],
                "cpu": h["cpu"],
                "memory": h["memory"],
                "disk": h["disk"],
                "networkIn": h["networkIn"],
                "networkOut": h["networkOut"],
            })
            await ws_manager.broadcast({"type": "health", "data": h})
        except Exception:
            pass

        await asyncio.sleep(5)


# ── ✅ Lifespan (REPLACEMENT FOR on_event) ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting system monitor...")
    task = asyncio.create_task(collector_loop())

    yield  # app is running

    print("🛑 Shutting down...")
    task.cancel()


# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="System Monitoring API",
    version="2.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routes ────────────────────────────────────────────────────────────────
@app.get("/api/health")
def get_health():
    return health_payload()


@app.get("/api/history")
def get_history():
    return {"history": list(_history_ring)}


# ── WebSocket ────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await websocket.send_json({"type": "health", "data": health_payload()})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)