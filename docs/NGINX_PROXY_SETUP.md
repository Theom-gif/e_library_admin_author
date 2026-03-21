# Frontend API Configuration Guide - Nginx Proxy Setup

This document explains how to configure the React frontend to work with an Nginx reverse proxy that routes `/api/` requests to your backend server.

## Problem

When deploying the frontend through an Nginx server configured with:

```nginx
location /api/ {
    proxy_pass https://elibrary.pncproject.site;
}
```

The frontend might not work correctly if the API base URL is misconfigured, resulting in "Network Error" messages or failed API calls.

**Symptoms:**
- Network errors on production server
- Works fine on localhost
- API calls fail with connection errors
- CORS errors in console
- 504 Gateway Timeout errors

## Solution

The frontend uses **relative API paths** by default, which work seamlessly with Nginx proxies.

### Configuration

#### 1. **Update `.env` File**

For production with Nginx proxy, set:

```env
# Production - Using Nginx proxy
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=8000
```

#### 2. **For Local Development**

If testing locally with a backend on port 8000:

```env
# Local development
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT_MS=8000
```

#### 3. **Default Fallback**

If `VITE_API_BASE_URL` is not set, the frontend defaults to `/api`, which works with Nginx proxies automatically.

## How It Works

### Setup 1: Nginx Proxy (Recommended for Production)

```nginx
# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    # Serve static React files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to backend
    location /api/ {
        proxy_pass https://elibrary.pncproject.site;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
        
        # Important: Handle trailing slashes
        rewrite ^/api/(.*) /$1 break;
    }
}
```

**Frontend API calls:**
```
GET /api/admin/dashboard
       ↓ (Nginx intercepts)
GET https://elibrary.pncproject.site/admin/dashboard
       ↓ (Backend responds)
Response back to frontend
```

**Frontend Configuration:**
```env
VITE_API_BASE_URL=/api
```

### Setup 2: Direct Backend URL (Without Proxy)

If not using Nginx proxy:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

**Frontend API calls:**
```
GET https://your-backend-domain.com/api/admin/dashboard
```

### Setup 3: Local Development

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Frontend API Client Configuration

The API client is configured in `src/lib/apiClient.js`:

```javascript
import axios from "axios";

// Default: relative /api path (works with Nginx proxy)
const DEFAULT_API_BASE_URL = "/api";

// Read from environment variable
const apiBaseFromEnv = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
export const API_BASE_URL = apiBaseFromEnv || DEFAULT_API_BASE_URL;

// Create axios instance with base URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL,  // e.g., "/api" or "http://localhost:8000"
  headers: { Accept: "application/json" },
  timeout: 8000,
});
```

## Testing the Configuration

### 1. **Check Network Tab in Browser**

Open DevTools (F12) → Network tab → Make an API call

**What you should see:**
- Request URL: `/api/admin/dashboard` (relative path)
- Status: 200 OK (success)
- Response: Valid JSON data

**If you see errors:**
- Status: 504 Gateway Timeout → Backend not responding
- Status: 403 Forbidden → Nginx permission issue
- Network Error → API base URL is wrong

### 2. **Test with curl**

```bash
# Test from your local machine
curl -X GET "http://your-domain.com/api/admin/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return JSON response, not HTML error page
```

### 3. **Check Console for Errors**

```javascript
// In browser console, check the API base URL
console.log(import.meta.env.VITE_API_BASE_URL)  // Should output "/api" or "http://localhost:8000"
```

## Common Issues & Solutions

### Issue 1: "Network Error" on Production, Works Locally

**Problem:** `.env.example` has `http://localhost:8000`, which doesn't work on production.

**Solution:** 
```diff
# .env (production)
- VITE_API_BASE_URL=http://localhost:8000
+ VITE_API_BASE_URL=/api
```

Then rebuild:
```bash
npm run build
```

### Issue 2: 504 Gateway Timeout

**Problem:** Nginx can't reach the backend server.

**Check:**
1. Backend server is running: `curl https://elibrary.pncproject.site/api/admin/dashboard`
2. Backend domain is correct in Nginx config
3. SSL certificate is valid for backend domain

**Solution:**
```nginx
# Add timeout settings to Nginx
location /api/ {
    proxy_pass https://elibrary.pncproject.site;
    
    # Increase timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### Issue 3: CORS Errors

**Problem:** Backend returns CORS error.

**Solution:** Backend must include proper CORS headers:
```php
// Laravel
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH');
header('Access-Control-Allow-Headers: *');
```

**Or configure Nginx to add headers:**
```nginx
location /api/ {
    proxy_pass https://elibrary.pncproject.site;
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    add_header 'Access-Control-Allow-Headers' '*';
}
```

### Issue 4: 403 Forbidden / 401 Unauthorized

**Problem:** Authorization header not passed to backend.

**Solution:** Ensure Nginx passes the Authorization header:
```nginx
location /api/ {
    proxy_pass https://elibrary.pncproject.site;
    
    # Pass authorization header to backend
    proxy_set_header Authorization $http_authorization;
    proxy_pass_header Authorization;
}
```

### Issue 5: Trailing Slash Issues

**Problem:** Requests to `/api/admin/dashboard/` might fail.

**Solution:** Configure Nginx to handle trailing slashes:
```nginx
location /api/ {
    proxy_pass https://elibrary.pncproject.site;
    
    # Remove /api prefix before sending to backend
    rewrite ^/api/(.*) /$1 break;
}
```

## Environment Variables Quick Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `/api` | Relative path (Nginx proxy) |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Local backend |
| `VITE_API_BASE_URL` | `https://api.example.com` | Direct backend URL |
| `VITE_API_TIMEOUT_MS` | `8000` | Request timeout in milliseconds |

## Deployment Steps

### Step 1: Update Environment Variables

```bash
# SSH into server
ssh user@your-domain.com

# Navigate to frontend directory
cd /var/www/html

# Update .env file
nano .env
```

Set:
```env
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=8000
```

### Step 2: Rebuild Frontend

```bash
npm install
npm run build
```

This creates optimized production build in `dist/` folder.

### Step 3: Configure Nginx

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/your-domain

# Add configuration from Setup 1 above

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 4: Test

```bash
# Test API endpoint through Nginx
curl -X GET "https://your-domain.com/api/admin/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: {"data": {...}, "meta": {...}}
```

## Nginx Configuration Template

Here's a complete Nginx configuration for serving React frontend with API proxy:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;

    # Root directory for React static files
    root /var/www/html;

    # Serve static React files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy to backend
    location /api/ {
        # Proxy to backend server
        proxy_pass https://elibrary.pncproject.site;
        
        # Headers to preserve request context
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Pass Authorization header
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
        
        # Remove /api prefix when proxying
        rewrite ^/api/(.*) /$1 break;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # Handle errors
        error_page 502 503 504 /50x.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

## Verification Checklist

Before deploying, verify:

- [ ] `.env` file has correct `VITE_API_BASE_URL`
- [ ] Frontend is rebuilt with `npm run build`
- [ ] Nginx configuration is valid with `nginx -t`
- [ ] Nginx is restarted with `systemctl restart nginx`
- [ ] Backend server is running and accessible
- [ ] SSL certificates are valid
- [ ] API calls in browser Network tab show `/api/` paths
- [ ] Responses have HTTP 200 status
- [ ] Response data is valid JSON
- [ ] Authorization headers are preserved

## Additional Resources

- [Nginx Proxy Configuration Docs](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Axios Configuration](https://axios-http.com/docs/instance)
- [React Environment Variables](https://vitejs.dev/guide/env-and-modes.html)
- [Backend API Documentation](./README_BACKEND.md)

## Support

If API calls still fail after following this guide:

1. Check browser console for specific errors
2. Review Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Check backend server logs
4. Verify network connectivity: `curl https://elibrary.pncproject.site/api/health`
5. Test with explicit token: `curl ... -H "Authorization: Bearer YOUR_TOKEN"`

---

**Last Updated:** 2026-03-21
**Version:** 1.0
