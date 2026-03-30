# Python System Monitor Backend - Setup Guide

## Installation

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Step 1: Navigate to the Services Directory

```bash
cd src/admin/components/system/sysmon/services
```

### Step 2: Install Dependencies

```bash
pip install fastapi uvicorn psutil python-multipart
```

Or using requirements.txt (if provided):
```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode

```bash
python main.py
```

The server will start on `http://localhost:8000`

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

For production with auto-reload disabled:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### With Different Port

```bash
python main.py  # Edit main.py to change port
```

Or directly with uvicorn:
```bash
uvicorn main:app --port 9000
```

## Verification

### Check if Server is Running

```bash
curl http://localhost:8000/api/health
```

Expected response: JSON object with system metrics

### Check Available Endpoints

```bash
# Get current system metrics
curl http://localhost:8000/api/health

# Get historical data
curl http://localhost:8000/api/history

# Get processes
curl http://localhost:8000/api/processes

# Get disk info
curl http://localhost:8000/api/disks

# Get network interfaces
curl http://localhost:8000/api/network/interfaces

# Get logs
curl http://localhost:8000/api/logs

# Get statistics
curl http://localhost:8000/api/stats
```

## Frontend Configuration

### Option 1: Local Backend (default)

No configuration needed. The frontend will connect to `http://localhost:8000`

### Option 2: Remote Backend

Create a `.env` file in the project root:

```env
VITE_SYSMON_API_BASE=https://your-server.com:8000
```

### Option 3: Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## API Documentation

### Endpoints

**GET /api/health**
- Returns current system health snapshot
- Response: HealthSnapshot object with CPU, Memory, Disk, Network metrics

**GET /api/history**
- Returns historical data points (last N samples)
- Query params: `points=120` (default)
- Response: List of historical data points

**GET /api/logs**
- Returns system and application logs
- Query params: `limit=60`, `status=`, `service=`
- Response: List of LogEntry objects

**GET /api/processes**
- Returns list of running processes
- Query params: `limit=30`, `sort_by=cpu|memory|name`
- Response: List of ProcessEntry objects

**GET /api/disks**
- Returns disk partition information
- Response: List of DiskPartition objects

**GET /api/network/interfaces**
- Returns network interface statistics
- Response: List of NetworkInterface objects

**GET /api/stats**
- Returns aggregated statistics
- Response: Stats object with aggregate data

**WS /ws**
- WebSocket endpoint for real-time updates
- Broadcasts HealthSnapshot every 5 seconds to all connected clients
- Connection: `ws://localhost:8000/ws`

## Troubleshooting

### "ModuleNotFoundError: No module named 'fastapi'"

Solution:
```bash
pip install fastapi uvicorn
```

### "Address already in use"

The port 8000 is already in use. Either:
1. Kill the process using port 8000
2. Use a different port: `uvicorn main:app --port 9000`

### "CORS Error"

The backend has CORS enabled. If you still get errors:
1. Check the error message for the specific issue
2. Add the origin to the CORS configuration in main.py (line with allow_origins)

### "WebSocket Connection Failed"

1. Ensure the backend is running
2. Check firewall allows port 8000 inbound/outbound
3. Verify the WebSocket URL in browser DevTools console
4. Check Python logs for errors

### Memory Issues

If the process uses too much memory:
1. Reduce the history buffer size in Python code
2. Reduce log retention
3. Limit the number of processes tracked

## Performance Tuning

### Reduce CPU Usage

In main.py, increase the interval:
```python
await asyncio.sleep(5)  # Change 5 to higher value (in seconds)
```

### Reduce Memory Usage

1. Reduce history buffer size (currently 120 points)
2. Reduce logged processes count
3. Reduce maximum logs retained

### Optimize for Production

1. Disable unnecessary metrics collection
2. Use `--workers 4` with uvicorn
3. Add a reverse proxy (nginx) for load balancing
4. Implement log rotation to prevent disk fill

## With NGINX Reverse Proxy

### nginx config

```nginx
upstream sysmon {
  server localhost:8000;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;
  
  ssl_certificate /path/to/cert;
  ssl_certificate_key /path/to/key;

  location /api/sysmon {
    proxy_pass http://sysmon;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /ws {
    proxy_pass http://sysmon;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
  }
}
```

Then in frontend .env:
```env
VITE_SYSMON_API_BASE=https://your-domain.com
```

## Monitoring the Backend

### View Real-time Output

The server logs updates as they happen:
```
INFO:     Started server process [1234]
INFO:     Waiting for application startup.
INFO:     Application startup complete
INFO:     WS "/ws" [ACCEPTED]
INFO:     WS "/ws" [DISCONNECTED]
```

### Common Log Messages

- `[ACCEPTED]` - Client connected to WebSocket
- `[DISCONNECTED]` - Client disconnected from WebSocket
- GET requests show endpoint access
- Errors are prefixed with ERROR

## Stopping the Server

### Graceful Shutdown

Press `Ctrl+C` in the terminal running the server

### Force Kill (Unix/Linux/Mac)

```bash
lsof -i :8000
kill -9 <PID>
```

### Force Kill (Windows)

```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Next Steps

1. ✅ Install Python and dependencies
2. ✅ Start the backend server
3. ✅ Run frontend development server
4. ✅ Navigate to System Monitor page
5. ✅ Verify real-time data streaming
6. 📋 Customize metrics collection (edit main.py)
7. 📋 Set up alert thresholds (edit main.py alert configuration)
8. 📋 Configure for production deployment

## Questions?

Refer to:
- FastAPI docs: https://fastapi.tiangolo.com/
- Uvicorn docs: https://www.uvicorn.org/
- Python psutil docs: https://psutil.readthedocs.io/
