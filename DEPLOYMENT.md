# Production Deployment Guide

## Quick Start

### 1. Prepare Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output: dist/ folder ready for deployment
```

### 2. Configure Production Environment

**File: `.env.production`** (already created)
```env
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=8000
VITE_USER_PORTAL_URL=/user/dashboard
```

### 3. Deploy to Server

Upload the `dist/` folder to your production server:
```bash
# Option A: Direct copy (if SSH access)
scp -r dist/ user@e-library-portal.app:/var/www/e-library-admin-author/

# Option B: Use deployment tool (Vercel, Netlify, etc.)
# Most tools auto-detect Vite and handle build/deploy

# Option C: Manual via FTP/SFTP
# Upload dist/ contents to web root
```

### 4. Configure Web Server

#### NGINX (Recommended)
```bash
sudo cp nginx.conf /etc/nginx/sites-available/e-library-portal.app
sudo ln -s /etc/nginx/sites-available/e-library-portal.app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Apache (Alternative)
Create `.htaccess` in `dist/`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
  
  # Proxy /api to backend
  RewriteRule ^api/(.*)$ https://elibrary.pncproject.site/api/$1 [P,L]
</IfModule>
```

### 5. Verify SSL/TLS

Ensure HTTPS is working:
```bash
# Test HTTPS connection
curl -I https://e-library-portal.app

# Check certificate expiration
openssl s_client -connect e-library-portal.app:443 | grep -A5 "Validity"
```

---

## Network Error Fixes

### If users see "Network Error" pages:

#### Step 1: Check Backend Status
```bash
curl -I https://elibrary.pncproject.site/api/admin/dashboard
# Should return any 2xx/3xx/4xx, not connection error
```

#### Step 2: Check NGINX Proxy
```bash
sudo systemctl status nginx
# Should show "active (running)"

# Check NGINX logs for errors
sudo tail -f /var/log/nginx/error.log
```

#### Step 3: Verify CORS Headers (if not using NGINX)
```bash
curl -I -X OPTIONS \
  -H "Origin: https://e-library-portal.app" \
  -H "Access-Control-Request-Method: GET" \
  https://elibrary.pncproject.site/api/admin/dashboard

# Look for: Access-Control-Allow-Origin header
```

#### Step 4: Check Browser Console
1. Open DevTools (F12)
2. Check Console tab for detailed errors
3. Check Network tab for failed requests
4. Screenshot error and share with backend team

---

## Performance Optimization

### Caching Strategy
- Static assets (JS, CSS, images): 1 year cache
- HTML (index.html): no cache (always fresh)
- API responses: set by backend or NGINX

### Compression
NGINX automatically gzips responses. Verify:
```bash
curl -I -H "Accept-Encoding: gzip" https://e-library-portal.app/

# Should show: Content-Encoding: gzip
```

### CDN Integration (Optional)
For faster global delivery, use a CDN like Cloudflare:
1. Point DNS to CDN
2. CDN origin = your NGINX server
3. CDN caches static assets globally

---

## Monitoring & Logging

### NGINX Logs
```bash
# Access log (all requests)
tail -f /var/log/nginx/access.log

# Error log (issues like backend down)
tail -f /var/log/nginx/error.log
```

### Frontend Error Tracking
Install Sentry or LogRocket for client-side error monitoring:
```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

---

## Troubleshooting Matrix

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Network Error" on all pages | Backend unreachable | Check `elibrary.pncproject.site` status |
| CORS error on login | No CORS headers | Use NGINX proxy or enable backend CORS |
| 404 on page refresh | SPA routing not configured | Ensure NGINX `try_files` in location / block |
| Very slow pages | Large assets or slow backend | Check Network tab, enable gzip, optimize backend |
| SSL certificate error | Expired cert or wrong domain | Renew certificate, verify domain in nginx.conf |

---

## Rollback Plan

If something breaks:

```bash
# Backup current version
mv /var/www/e-library-admin-author /var/www/e-library-admin-author.backup

# Restore previous version
cp -r /var/www/e-library-admin-author.backup.v1 /var/www/e-library-admin-author

# Reload NGINX
sudo systemctl reload nginx
```

---

## Security Checklist

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers set in NGINX:
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] API tokens only sent over HTTPS
- [ ] Backend auth validates token in Authorization header
- [ ] CORS only allows `https://e-library-portal.app` (not *)
- [ ] Environment variables not exposed in frontend
- [ ] Sensitive files (.env, etc.) blocked: ✅ Done in NGINX

---

## Success Indicators

✅ All pages load without errors  
✅ Login works and stores token  
✅ Admin dashboard shows data  
✅ All API calls succeed (check Network in DevTools)  
✅ No CORS errors in Console  
✅ Pages load in <2 seconds  
✅ Mobile responsive  

You're ready for production! 🎉
