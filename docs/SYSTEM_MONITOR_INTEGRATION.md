# System Monitor Integration Guide

## Overview

The system monitoring dashboard is now integrated with a real-time WebSocket connection to the Python FastAPI backend. All synthetic data generation has been replaced with real system metrics from your server.

## Architecture

### Frontend (React)

**WebSocket Hook**: `src/admin/hooks/useSystemMonitor.js`
- Establishes WebSocket connection to Python backend at `ws://localhost:8000/ws`
- Automatically reconnects on disconnect (with 3-second delay)
- Fetches initial data via REST API on first connection
- Maintains real-time ring buffer of 120 historical data points (10 minutes @ 5s interval)
- Returns: `health`, `history`, `logs`, `processes`, `disks`, `interfaces`, `stats`, `connected`, `error`

**System Monitor Page**: `src/admin/pages/SystemMonitor.jsx`
- Uses `useSystemMonitor()` hook for all real-time data
- Displays connection status in top-right corner (live/connecting/error)
- Shows alerts automatically as they occur
- Updates all dashboard pages with real data:
  - Overview: CPU, Memory, Disk, Network metrics with charts
  - Performance: Performance trends over time
  - Processes: Real-time process list with sorting
  - Disks: Disk partition information
  - Network: Network interface statistics
  - Logs: System and application logs
  - Stats: Aggregated statistics

### Backend (Python)

**FastAPI Application**: Python service providing system metrics
- `GET /api/health` - Current system snapshot
- `GET /api/history` - Historical data points
- `GET /api/logs` - System logs
- `GET /api/processes` - Process list
- `GET /api/disks` - Disk info
- `GET /api/network/interfaces` - Network interfaces
- `GET /api/stats` - Aggregated stats
- `WS /ws` - WebSocket for real-time health broadcasts (every 5 seconds)

## Configuration

### Environment Variables

Add to `.env` file or `vite.config.js`:

```env
# System Monitor API Base URL (default: http://localhost:8000)
VITE_SYSMON_API_BASE=http://localhost:8000

# Or for production:
VITE_SYSMON_API_BASE=https://your-server.com:8000
```

### WebSocket URL

The hook automatically converts the HTTP base URL to WebSocket:
- `http://localhost:8000` → `ws://localhost:8000/ws`
- `https://your-server.com:8000` → `wss://your-server.com:8000/ws`

## Setup Instructions

### 1. Start the Python Backend

```bash
cd src/admin/components/system/sysmon/services
python main.py
```

The Python service will start on `http://localhost:8000`

### 2. Configure Frontend (if using remote server)

Edit `.env`:
```env
VITE_SYSMON_API_BASE=https://your-remote-server.com:8000
```

### 3. Access the Dashboard

Navigate to the System Monitor page in the admin dashboard. You should see:
- **Top-right badge**: Shows "live" when connected, "connecting" while reconnecting, "error" if connection fails
- **Real-time updates**: Health metrics update every 5 seconds
- **Automatic reconnection**: If connection drops, automatically retries every 3 seconds
- **Alerts**: New alerts appear as toasts in the bottom-right corner

## Data Flow

```
Python Backend (main.py)
    ↓ Collects system metrics every 5 seconds
    ├→ WebSocket /ws (broadcasts to all connected clients)
    └→ REST APIs (fetchInitialData, on-demand)
         ↓
React Frontend (useSystemMonitor hook)
    ├→ Connects to WebSocket on mount
    ├→ Fetches initial data (history, logs, processes, disks, interfaces)
    └→ Updates state on each WebSocket broadcast
         ↓
Dashboard Components
    ├→ OverviewPage (metrics + charts)
    ├→ PerformancePage (trend charts)
    ├→ ProcessesPage (filterable list)
    ├→ DisksPage (partition info)
    ├→ NetworkPage (interface stats)
    ├→ LogsPage (system logs)
    └→ StatsPage (aggregated data)
```

## Real-Time Update Frequency

- **Health snapshots**: Every 5 seconds (via WebSocket)
- **History buffer**: Maintains 120 points (10 minutes of data @ 5s interval)
- **Initial fetch**: On mount and when refetch() is called
- **Data retention**: Last 120 historical points, configurable log limit

## Alert Thresholds (from Python backend)

The Python service automatically generates alerts when metrics exceed:
- **CPU**: > 85% (warning at >75%)
- **Memory**: > 88% (warning at >75%)
- **Swap**: > 70%
- **Disk**: > 90%

Alerts appear as toasts in the bottom-right corner with:
- Red color for critical alerts
- Amber color for warnings
- Metric name (e.g., "CPU")
- Alert message (e.g., "CPU usage above 85%")

## Debugging

### Check WebSocket Connection

Open browser DevTools → Network tab → filter by "WS":
- Should see WebSocket connection to `/ws`
- Look for frames showing JSON data every ~5 seconds

### Check REST API Responses

In `useSystemMonitor.js`, all fetch calls are logged to console:
```javascript
// In browser console:
// Should see successful responses for:
// - /api/history
// - /api/logs
// - /api/processes
// - /api/disks
// - /api/network/interfaces
```

### Verify Backend Connection

```bash
curl http://localhost:8000/api/health
```

Should return JSON with current system metrics.

### Common Issues

**1. WebSocket Connection Refused**
- Ensure Python backend is running
- Check firewall rules allow port 8000
- Verify `VITE_SYSMON_API_BASE` environment variable is correct

**2. CORS Errors**
- Python backend has CORS enabled for all origins
- Check browser console for specific CORS error message

**3. Data Not Updating**
- Open DevTools → Network tab → WS
- Verify WebSocket connection shows frames every 5 seconds
- Check Python backend logs for errors

**4. Connection drops frequently**
- Increase reconnect delay in `useSystemMonitor.js` (currently 3s)
- Check network stability
- Monitor Python backend for crashes

## Customization

### Change Reconnect Delay

In `useSystemMonitor.js`, line 147:
```javascript
reconnectTimeoutRef.current = setTimeout(() => {
  connectWebSocket();
}, 3000);  // Change 3000 to desired milliseconds
```

### Change History Buffer Size

In `useSystemMonitor.js`, line 124:
```javascript
if (updated.length > 120) {  // Change 120 to desired number of points
  return updated.slice(-120);
}
```

### Change Initial Data Limits

In `useSystemMonitor.js`, line 58:
```javascript
fetch(`${SYSMON_API_BASE}/api/history?points=120`),   // 120 points
fetch(`${SYSMON_API_BASE}/api/logs?limit=80`),        // 80 logs
fetch(`${SYSMON_API_BASE}/api/processes?limit=50`),   // 50 processes
```

### Add Custom Data to WebSocket

1. Modify Python `main.py` to include custom data in the WebSocket broadcast
2. Update `useSystemMonitor.js` to parse the new data
3. Use the new data in components

## Performance

- **WebSocket**: Low-latency, bidirectional communication
- **History buffer**: Ring buffer prevents unlimited memory growth
- **Reconnection**: Exponential backoff available (can be configured)
- **Initial fetch**: Parallel requests for faster data load

## Next Steps

1. ✅ WebSocket hook created
2. ✅ SystemMonitor.jsx updated
3. ✅ WsBadge connection indicator added
4. 📋 Start Python backend service
5. 📋 Verify real-time data streaming works
6. 📋 Customize alert thresholds (edit Python backend)
7. 📋 Add custom metrics (extend Python service)

## Files Modified

- **Created**: `src/admin/hooks/useSystemMonitor.js` - WebSocket hook
- **Modified**: `src/admin/pages/SystemMonitor.jsx` - Uses real-time data
- **Status**: All synthetic data generation removed

## Support

For issues or enhancements:
1. Check the Python backend logs
2. Verify browser console for JavaScript errors
3. Check Network tab in DevTools for WebSocket frames
4. Refer to the Python `main.py` for available endpoints
