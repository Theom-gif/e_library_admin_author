# CORS & Network Error Fix Guide

## Problem
When running the frontend on `https://e-library-portal.app/login`, requests to the backend at `https://elibrary.pncproject.site` are blocked by browser CORS policy:

```
Network Error: No 'Access-Control-Allow-Origin' header
```

## Root Cause
Browser security blocks cross-origin API requests unless the server explicitly allows them with CORS headers.

---

## Solution: NGINX Reverse Proxy (RECOMMENDED)

### Why This Works
- Frontend and backend on **same domain** = no CORS needed
- Frontend requests `/api/admin/dashboard`
- NGINX transparently proxies to `https://elibrary.pncproject.site/api/admin/dashboard`
- Browser sees same-origin → no CORS check

### Setup Steps

#### 1. Use the Production Environment File
```bash
# Copy or ensure .env.production exists in project root
VITE_API_BASE_URL=/api
```

Build for production:
```bash
npm run build
# Creates dist/ folder with all static files
```

#### 2. Deploy NGINX Configuration
Copy the provided `nginx.conf` to your server:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/e-library-portal.app
sudo ln -s /etc/nginx/sites-available/e-library-portal.app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. Deploy Frontend Files
```bash
# Copy built files to NGINX root
sudo cp -r dist/ /var/www/e-library-admin-author/
```

#### 4. Verify SSL Certificates
Update paths in `nginx.conf`:
```nginx
ssl_certificate /path/to/your/certificate.crt;
ssl_certificate_key /path/to/your/private.key;
```

---

## Alternative: Backend CORS Headers (If No NGINX)

If you can't use NGINX, configure the backend to allow CORS:

### For Node.js / Express
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://e-library-portal.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

// Important: Handle preflight OPTIONS requests
app.options('*', cors());
```

### For PHP / Laravel
```php
// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://e-library-portal.app'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => true,
];
```

### For .NET / C#
```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://e-library-portal.app")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

---

## Testing the Fix

### Check CORS Headers (via curl)
```bash
curl -i -X OPTIONS https://elibrary.pncproject.site/api/admin/dashboard \
  -H "Origin: https://e-library-portal.app" \
  -H "Access-Control-Request-Method: GET"
```

Expected response headers:
```
HTTP/1.1 200 OK  (or 204)
Access-Control-Allow-Origin: https://e-library-portal.app
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Authorization,Content-Type
```

### Check Frontend in Browser DevTools
1. Open `https://e-library-portal.app/login`
2. Open DevTools → Network tab
3. Make a request (try logging in)
4. Look for API call in Network tab
5. Check Response Headers → should include `access-control-allow-origin`

---

## Frontend Error Handling

The frontend now detects and logs CORS errors clearly:

```javascript
// If CORS error occurs, you'll see:
❌ CORS ERROR - Request blocked by browser
url: /api/admin/dashboard
message: No 'Access-Control-Allow-Origin' header received
solution: Use NGINX proxy or configure backend CORS headers
```

---

## Checklist for Production Deployment

- [ ] `npm run build` completes successfully
- [ ] `.env.production` has `VITE_API_BASE_URL=/api`
- [ ] NGINX is installed and running
- [ ] NGINX config includes proxy for `/api/`
- [ ] SSL certificates are valid and paths are correct
- [ ] `dist/` folder is deployed to `/var/www/e-library-admin-author/`
- [ ] NGINX is reloaded: `sudo systemctl reload nginx`
- [ ] Test login on `https://e-library-portal.app/login`
- [ ] DevTools Network tab shows no CORS errors
- [ ] All admin pages load without errors

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Network Error" on all API calls | Check NGINX proxy is running: `sudo systemctl status nginx` |
| CORS preflight fails (429 error) | Ensure NGINX doesn't rate-limit OPTIONS requests |
| 502 Bad Gateway | Backend server is unreachable or down |
| SSL certificate error | Update certificate paths in nginx.conf and reload |
| Pages still say "Network Error" | Check DevTools Console for specific error, clear cache |

---

## Performance Tips

- NGINX caches responses for 1 year: `Cache-Control: public, immutable`
- API responses buffered: faster delivery to frontend
- Gzip compression enabled: smaller payloads
- Keep-alive connections: fewer reconnects

All pages should now work without CORS errors! ✅
