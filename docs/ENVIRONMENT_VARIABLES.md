# Environment Variables Reference

This file documents all available environment variables for the e-Library Admin project.

## System Requirements Variables

### Database Configuration

```env
# PostgreSQL connection (used by Python backend if needed)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=elibrary_db
```

### API Configuration

```env
# Main API base URL (for admin panel, auth, etc.)
VITE_API_BASE_URL=https://elibrary.pncproject.site

# API request timeouts (milliseconds)
VITE_API_TIMEOUT_MS=8000
VITE_API_LONG_TIMEOUT_MS=120000

# Authentication endpoints
VITE_AUTH_API_BASE=https://elibrary.pncproject.site/api/auth
```

### System Monitor Configuration (NEW)

```env
# Python FastAPI backend for system monitoring
# Format: http://localhost:8000 (local) or https://hostname.com:8000 (remote)
# Default: http://localhost:8000
VITE_SYSMON_API_BASE=http://localhost:8000

# IMPORTANT: The hook automatically converts this to WebSocket URL:
# http://localhost:8000 → ws://localhost:8000/ws
# https://hostname.com:8000 → wss://hostname.com:8000/ws
```

### Frontend Configuration

```env
# Development variables
VITE_DEBUG=false
VITE_LOG_LEVEL=info

# Feature flags
VITE_ENABLE_SYSTEM_MONITOR=true
VITE_ENABLE_BOOK_UPLOAD=true
VITE_ENABLE_AUTHOR_MANAGEMENT=true
```

### Python Backend Variables

```env
# Backend AI/ML features (if using)
PYTHON_AI_MODEL_PATH=./models
PYTHON_GPU_ENABLED=false

# Logging
PYTHON_LOG_LEVEL=INFO
PYTHON_LOG_FILE=./logs/system_monitor.log
```

## Setup Instructions

### 1. Create .env File

In the project root directory, create a `.env` file:

```bash
# Project root directory
touch .env
```

### 2. Add Variables

Copy the variables for your environment and update the values:

**Local Development:**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT_MS=8000
VITE_API_LONG_TIMEOUT_MS=120000
VITE_SYSMON_API_BASE=http://localhost:8000
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

**Production:**
```env
VITE_API_BASE_URL=https://elibrary.pncproject.site
VITE_API_TIMEOUT_MS=20000
VITE_API_LONG_TIMEOUT_MS=180000
VITE_SYSMON_API_BASE=https://your-domain.com:8000
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

### 3. Using Environment Variables in Code

**In Vite-based projects:**
```javascript
// These are loaded automatically
const apiBase = import.meta.env.VITE_API_BASE_URL;
const sysmonBase = import.meta.env.VITE_SYSMON_API_BASE || "http://localhost:8000";
```

**In Node/Express backends:**
```javascript
const apiBase = process.env.VITE_API_BASE_URL;
```

## Variable Types and Defaults

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| VITE_API_BASE_URL | String | `https://elibrary.pncproject.site` | Yes | Main API server URL |
| VITE_API_TIMEOUT_MS | Number | `8000` | No | Request timeout in milliseconds |
| VITE_API_LONG_TIMEOUT_MS | Number | `120000` | No | Long operation timeout (file upload, etc) |
| VITE_SYSMON_API_BASE | String | `http://localhost:8000` | No | System monitor backend URL |
| VITE_DEBUG | Boolean | `false` | No | Enable debugging output |
| VITE_LOG_LEVEL | String | `info` | No | Log level (debug, info, warn, error) |
| VITE_ENABLE_SYSTEM_MONITOR | Boolean | `true` | No | Enable system monitoring feature |
| VITE_ENABLE_BOOK_UPLOAD | Boolean | `true` | No | Enable book upload feature |
| VITE_ENABLE_AUTHOR_MANAGEMENT | Boolean | `true` | No | Enable author management feature |

## Common Configuration Scenarios

### Scenario 1: Local Development (Standalone)

```env
# Run everything on localhost
VITE_API_BASE_URL=http://localhost:3000
VITE_SYSMON_API_BASE=http://localhost:8000
VITE_DEBUG=true
```

**What you need running:**
- Frontend dev server: `npm run dev` (port 5173 or 5174)
- Main API: Running on port 3000
- System monitor: `python main.py` (port 8000)

### Scenario 2: Local Development + Remote API

```env
# Frontend on localhost, API on remote server
VITE_API_BASE_URL=https://api.production.com
VITE_SYSMON_API_BASE=http://localhost:8000
VITE_DEBUG=true
```

**What you need running:**
- Frontend dev server: `npm run dev`
- System monitor: `python main.py` (optional, for local testing)

### Scenario 3: Production Deployment

```env
# Everything on production domain
VITE_API_BASE_URL=https://elibrary.pncproject.site
VITE_SYSMON_API_BASE=https://elibrary.pncproject.site:8000
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

**Architecture:**
- Single domain with reverse proxy (nginx)
- All APIs on same domain (better CORS behavior)
- System monitor on port 8000 (proxied through nginx)

### Scenario 4: Microservices Architecture

```env
# Separate domains for each service
VITE_API_BASE_URL=https://api.elibrary.com
VITE_SYSMON_API_BASE=https://monitor.elibrary.com
VITE_DEBUG=false
```

**Architecture:**
- Auth/Books/Authors: api.elibrary.com
- System Monitor: monitor.elibrary.com
- Requires CORS headers in each backend

## Troubleshooting

### API Connection Issues

**Problem**: "Failed to fetch from VITE_API_BASE_URL"

**Solutions:**
1. Check the URL is correct: `echo $VITE_API_BASE_URL`
2. Verify API server is running
3. Check network connectivity: `curl $VITE_API_BASE_URL/api/health`
4. Check CORS headers in API response

### System Monitor Not Connecting

**Problem**: "WebSocket connection refused"

**Solutions:**
1. Verify Python backend is running: `curl http://localhost:8000/api/health`
2. Check VITE_SYSMON_API_BASE is set correctly
3. Verify firewall allows port 8000
4. Check browser console for exact error message

### Environment Variables Not Loading

**Problem**: "undefined" when accessing `import.meta.env.VITE_*`

**Solutions:**
1. Restart dev server after editing .env
2. Ensure variable name starts with `VITE_`
3. Check .env file is in project root
4. Verify no spaces around `=` sign in .env

### Mixed Content Error (HTTPS/HTTP)

**Problem**: "Mixed content error" in browser console

**Solutions:**
1. All URLs should use same protocol (all http or all https)
2. For production, use https for all services
3. Configure CORS properly if using different domains

## Security Considerations

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### 2. Use Environment-Specific Files

```bash
# Create separate env files
.env.local          # Your local development (git-ignored)
.env.production     # Production config (example, no secrets)
.env.staging        # Staging config (example, no secrets)
```

### 3. Sensitive Variables

Never put these in .env:
- API keys
- Database passwords
- JWT secrets
- OAuth credentials
- SSH keys

Instead, use:
- CI/CD secrets management
- Server environment variables
- Secret management tools (vault, etc.)

### 4. CORS and API Security

The frontend can only access:
- Same domain as served from
- Domains with proper CORS headers
- APIs configured to accept your origin

## Documentation Files

For more detailed setup instructions, see:
- [System Monitor Integration Guide](./SYSTEM_MONITOR_INTEGRATION.md)
- [Python Backend Setup](./PYTHON_BACKEND_SETUP.md)
- [Backend Implementation Checklist](./BACKEND_IMPLEMENTATION_CHECKLIST.md)
- [API Integration Status](./API_INTEGRATION_STATUS.md)

## Quick Reference

```bash
# View current environment variables (Linux/Mac)
env | grep VITE

# View without grep
env

# Set a variable for current session
export VITE_SYSMON_API_BASE=http://localhost:8000

# Run with inline variable
VITE_DEBUG=true npm run dev
```
