# System Monitor Integration - Testing & Verification Guide

## Pre-Flight Checklist

Before starting the system, verify all components are ready:

- [ ] Python 3.8+ installed
- [ ] pip dependencies installed: `fastapi`, `uvicorn`, `psutil`
- [ ] Node.js and npm installed
- [ ] Project dependencies installed: `npm install`
- [ ] `.env` file configured with `VITE_SYSMON_API_BASE`
- [ ] Ports 5173 (React), 8000 (Python backend) are not in use

## Step 1: Start Backend Services

### Start Python System Monitor

```bash
cd src/admin/components/system/sysmon/services
python main.py
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Verify Python Backend is Running

```bash
curl http://localhost:8000/api/health
```

**Expected Response:** JSON object with metrics like:
```json
{
  "cpu": 15.2,
  "memory": 45.3,
  "disk": 62.1,
  "swap": 12.0,
  "networkIn": 0.5,
  "networkOut": 0.2,
  "uptime": "2 days, 3:45:21",
  "hostname": "MyComputer",
  "platform": "linux",
  "alerts": []
}
```

## Step 2: Start Frontend Development Server

In a new terminal, from the project root:

```bash
npm run dev
```

**Expected Output:**
```
VITE v... dev server running at:

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Note:** Port may be different if 5173 is in use (check console output)

## Step 3: Verify Environment Variables

### Check Frontend Config

Open browser DevTools → Console and run:

```javascript
// Check if SYSMON base URL is loaded
console.log('API Base:', import.meta.env.VITE_API_BASE_URL);
console.log('Sysmon Base:', import.meta.env.VITE_SYSMON_API_BASE);
```

**Expected Output:**
```
API Base: https://elibrary.pncproject.site
Sysmon Base: http://localhost:8000  (or your configured value)
```

## Step 4: Navigate to System Monitor Page

1. Open admin dashboard: `http://localhost:5173`
2. Log in with admin credentials
3. Navigate to **Dashboard → System Monitor**

## Step 5: Verify Real-Time Connection

### Check Top-Right Connection Badge

Look at the top-right corner of the System Monitor page:

```
┌─────────────┐
│  ● live     │  ← Should show this (green with pulse animation)
└─────────────┘
```

**States you might see:**
- **● live** (green) - Connected and receiving data
- **◐ connecting** (amber) - Trying to connect, shows pulsing indicator
- **✕ error** (red) - Connection failed, hover for error details

### Monitor Console for Connection Logs

In browser DevTools → Console, you should see:

```
System Monitor WebSocket connected
Error parsing WebSocket message: ...  (if any message parsing issues)
WebSocket disconnected  (if connection drops)
```

## Step 6: Verify Data Updates

### Check Metric Cards

On the Overview page, you should see:

```
system health
┌──────────┬──────────┬──────────┐
│   CPU    │  Memory  │   Disk   │
│  25.3%   │  48.7%   │  62.1%   │
│ cores... │  GB / GB │ root...  │
└──────────┴──────────┴──────────┘
```

All values should show real data (not "—" which indicates no data).

### Watch Data Update

After the dashboard loads:
1. **Wait 5 seconds** - Data should update (values change)
2. **Check timestamp**: Each update should have a new timestamp
3. **Verify charts animate**: Charts should show trend lines updating

### Check Network Tab

In DevTools → Network tab:

1. Filter by "WS" (WebSocket)
2. Find the `/ws` connection
3. Click on "Messages" tab
4. You should see JSON frames coming in every 5 seconds
5. Each frame contains a HealthSnapshot object

**Example WebSocket Message:**
```json
{
  "cpu": 18.5,
  "memory": 52.1,
  "disk": 63.2,
  "swap": 8.5,
  "networkIn": 0.3,
  "networkOut": 0.15,
  "timestamp": "2024-01-15T10:30:45.123456",
  "hostname": "server-name",
  "platform": "linux",
  "alerts": []
}
```

## Step 7: Test Per-Page Functionality

### Overview Page
- [ ] All metric cards display real data
- [ ] Charts update smoothly
- [ ] Alerts display when thresholds exceeded
- [ ] Network metric shows in/out speeds

### Performance Page
- [ ] Historical chart shows 48-120 data points
- [ ] Trend lines smooth and continuous
- [ ] X-axis timestamp formatting correct

### Processes Page
- [ ] Process list populates with running processes
- [ ] Sort by CPU, Memory, or Name works
- [ ] Process name, PID, CPU%, Memory% display
- [ ] Refresh button updates the list

### Disks Page
- [ ] Disk partition list shows
- [ ] Capacity and used space display
- [ ] Mount points listed correctly

### Network Page
- [ ] Network interfaces listed
- [ ] RX/TX (in/out) speeds show
- [ ] Interface status (UP/DOWN) shows

### Logs Page
- [ ] Logs populate with system/auth logs
- [ ] Timestamp shows when each log entry created
- [ ] Latest logs appear at bottom

### Stats Page
- [ ] Statistics load and display
- [ ] Aggregated data computed correctly
- [ ] All stats update with latest data

## Step 8: Test Error Handling

### Simulate Backend Disconnect

1. Stop the Python backend: `Ctrl+C`
2. Observe badge changes to **◐ connecting** (amber)
3. Check console for "WebSocket disconnected"
4. After 3 seconds, should see "WebSocket disconnected" log
5. Badge attempts to reconnect (shows pulsing indicator)

### Restart Backend

1. Run Python backend again: `python main.py`
2. Badge should change to **● live** within a few seconds
3. Data should resume updating

### Test Unsupported Origin (CORS)

If backend doesn't have CORS enabled:

1. Check browser console for CORS error
2. Verify Python backend has `allow_origins=["*"]`
3. Restart Python backend

## Step 9: Verify Alert System

### Trigger CPU Alert (simulate high load)

**On Linux/Mac:**
```bash
# Increase CPU load
for i in {1..8}; do yes > /dev/null & done

# Kill processes when done
kill %1 %2 %3 %4 %5 %6 %7 %8
```

**Expected behavior:**
1. CPU metric increases (> 75% for warning, > 85% for critical)
2. Alert appears in "active alerts" section
3. Toast notification appears (bottom-right corner)
4. Orange color for warning (CPU > 75%)
5. Red color for critical (CPU > 85%)

### Check Alert Toast

When an alert triggers, you should see in bottom-right:

```
┌─────────────────────────────┐
│ ⚠  CPU                      │
│ CPU usage above 75%         │
└─────────────────────────────┘
```

Toast disappears after 5 seconds automatically.

## Step 10: Performance & Load Test

### Monitor Resource Usage

While dashboard is running:

1. Open **Task Manager** (Windows) or **Activity Monitor** (Mac)
2. Find your browser process
3. Monitor memory and CPU usage over 5 minutes

**Expected:**
- React WebSocket consumer: < 100MB RAM
- Python backend: < 200MB RAM
- CPU usage minimal (< 5% per process)

### Rapid Page Navigation

1. Switch between pages repeatedly (every 1-2 seconds)
2. No crashes or memory leaks
3. Data continues updating
4. Component render time < 200ms

### Extended Connection Test

1. Leave dashboard open for 30+ minutes
2. Verify data continues updating
3. Check console has no repeated error messages
4. Memory usage remains stable

## Step 11: Cross-Browser Testing

Test WebSocket connection works in:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

For each browser:
1. Navigate to System Monitor
2. Verify connection badge shows "live"
3. Check WebSocket in DevTools Network tab
4. Verify data updates every 5 seconds

## Step 12: Mobile Testing

### Test on Mobile Browser

1. Find your machine's IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
2. Access dashboard from mobile: `http://<YOUR_IP>:5173`
3. Verify WebSocket connection works
4. Check layout is responsive
5. Verify touch interactions work

**Note:** WebSocket may not work on mobile hotspot due to restrictions.

## Troubleshooting Guide

### Issue: WebSocket Connection Refused

```
Error connecting WebSocket: Failed to connect
```

**Diagnosis:**
1. Check Python backend is running: `curl http://localhost:8000/api/health`
2. Check VITE_SYSMON_API_BASE is correct in .env
3. Check firewall allows port 8000
4. Check browser console for exact URL being attempted

**Solution:**
1. Ensure Python backend is started
2. Restart frontend dev server after changing .env
3. Check firewall rules: `sudo ufw allow 8000` (Linux)
4. Use `wss://` for HTTPS (configure Python backend with SSL)

### Issue: WebSocket Connected but No Data

```
Badge shows "live" but metrics show "—"
```

**Diagnosis:**
1. Check Network tab → Messages - should show updates every 5s
2. Check Python backend logs for errors
3. Verify REST API endpoints respond with data

**Solution:**
1. Check Python backend logs: Look for error messages
2. Restart Python backend: `python main.py`
3. Clear browser cache: `Ctrl+Shift+Delete` → Clear All

### Issue: Browser console shows CORS errors

```
Access to XMLHttpRequest blocked by CORS policy
```

**Diagnosis:**
1. Python backend missing CORS headers
2. Incorrect origin configuration

**Solution:**
Edit Python `main.py` and ensure:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: High CPU/Memory Usage

**Diagnosis:**
1. Check if Python backend is collecting too much data
2. Check if WebSocket messages are too large
3. Check for memory leaks in React

**Solution:**
1. Reduce history buffer size in Python: `max_size=120`
2. Reduce process list limit: `limit=30`
3. Reduce log entries: `limit=60`

### Issue: Data Updates Stop After Several Minutes

```
Data freezes, no new updates, badge still shows "live"
```

**Diagnosis:**
1. WebSocket connection is stale (connection kept alive but no data)
2. Python backend crashed silently
3. Network timeout

**Solution:**
1. Add ping/pong mechanism (advanced)
2. Monitor Python backend logs
3. Implement automatic page reload on stale connection

## Success Checklist

- [ ] Python backend starts without errors
- [ ] React frontend connects to backend
- [ ] WebSocket connection badge shows "live"
- [ ] Metrics update every 5 seconds
- [ ] All pages display real data
- [ ] Alerts trigger when thresholds exceeded
- [ ] Browser console has no error messages
- [ ] No memory leaks after extended use
- [ ] Mobile browser works (if testing)
- [ ] Backend reconnects after temporary disconnect

## Next Steps After Verification

1. **Configure for Production:**
   - Update VITE_SYSMON_API_BASE to production URL
   - Set up HTTPS/wss for secure connections
   - Configure firewall and reverse proxy

2. **Customize Alert Thresholds:**
   - Edit Python `main.py` alert configuration
   - Adjust values for your infrastructure

3. **Monitor Logs:**
   - Set up application logging
   - Archive old logs
   - Monitor critical alerts

4. **Performance Optimization:**
   - Profile baseline resource usage
   - Identify slow queries
   - Optimize data collection intervals

## Support & Debugging

### Enable Debug Logging

```javascript
// In browser console:
localStorage.setItem('debug', '*');
location.reload();
```

### Check Python Backend Logs

```bash
# In Python terminal, look for:
# - INFO: messages (normal operations)
# - ERROR: messages (problems)
# - WARNING: messages (potential issues)
```

### Test Individual Endpoints

```bash
# Test each endpoint manually
curl http://localhost:8000/api/health
curl http://localhost:8000/api/history
curl http://localhost:8000/api/processes
curl http://localhost:8000/api/disks
curl http://localhost:8000/api/network/interfaces
curl http://localhost:8000/api/logs
curl http://localhost:8000/api/stats
```

Each should return valid JSON data.

### Monitor Network Activity

Open DevTools → Network tab and look for:
- Regular WebSocket messages (every 5s)
- No failed requests (red color)
- Response times < 1 second

## Documentation Links

- [System Monitor Integration](./SYSTEM_MONITOR_INTEGRATION.md)
- [Python Backend Setup](./PYTHON_BACKEND_SETUP.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Backend Implementation](./BACKEND_IMPLEMENTATION_CHECKLIST.md)
