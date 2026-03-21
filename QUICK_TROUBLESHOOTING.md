# Quick Troubleshooting - Network Error on Production

## 🆘 When Users See "Network Error"

### Step 1: Check if it's CORS or Backend Down (2 minutes)

```bash
# Test 1: Can you reach the backend?
curl -I https://elibrary.pncproject.site/api/admin/dashboard

# Expected: HTTP 401 or HTTP 200 (any response = backend works)
# Got timeout/connection refused = BACKEND IS DOWN, contact backend team
```

### Step 2: Check NGINX is Running (1 minute)

```bash
# Is NGINX running?
sudo systemctl status nginx

# Expected output: active (running)
# If not running:
sudo systemctl start nginx

# Check NGINX config is valid:
sudo nginx -t
# Expected: "successful" message
```

### Step 3: Reload NGINX Config (1 minute)

```bash
sudo systemctl reload nginx

# Check for errors:
sudo tail -f /var/log/nginx/error.log
```

### Step 4: Open Browser and Test (1 minute)

1. Open `https://e-library-portal.app/login`
2. Open DevTools: Press `F12`
3. Go to **Network** tab
4. Try to login
5. Look for API request (should be to `/api/auth/login`)
6. **Check Response Headers:**
   - `access-control-allow-origin` should be present (if proxied)
   - Or just `200 OK` status (if NGINX working)

### Step 5: Check Console for Errors (1 minute)

1. In DevTools, go to **Console** tab
2. Look for red error messages
3. Share the exact error message with the team

---

## 🔍 Common Error Messages & Fixes

### Error: "CORS policy blocked this request"
**Cause:** NGINX proxy not configured correctly
**Fix:** 
```bash
# Verify NGINX is proxying /api
sudo nginx -T | grep -A5 "location /api"

# Should show something like:
# location /api/ {
#     proxy_pass https://elibrary.pncproject.site;
# }

# If missing, copy nginx.conf again:
sudo cp nginx.conf /etc/nginx/sites-available/e-library-portal.app
sudo systemctl reload nginx
```

### Error: "Connection refused" or "Cannot reach backend"
**Cause:** Backend server is down
**Fix:**
```bash
# Check backend status
curl -v https://elibrary.pncproject.site/health

# If that fails, backend team needs to fix it
# Restart their service or check server logs
```

### Error: "SSL certificate problem"
**Cause:** Expired or invalid SSL cert
**Fix:**
```bash
# Check certificate expiration
openssl s_client -connect e-library-portal.app:443 | grep -A2 Validity

# Renew with Let's Encrypt:
sudo certbot renew --force-renewal -d e-library-portal.app
sudo systemctl reload nginx
```

### Error: "502 Bad Gateway"
**Cause:** NGINX can't reach backend or timeout
**Fix:**
```bash
# Increase timeouts in nginx.conf:
proxy_connect_timeout 15s;
proxy_send_timeout 15s;
proxy_read_timeout 15s;

# Reload:
sudo systemctl reload nginx
```

---

## ✅ Success Signs

When it's working, you should see:

✅ Page loads without error  
✅ In Network tab: API calls show `200` or `3xx` status  
✅ Login succeeds and redirects to `/admin/dashboard`  
✅ Dashboard loads with data  
✅ No red errors in Console tab  

---

## 📋 Deployment Checklist

Before going live, verify:

- [ ] `.env.production` has `VITE_API_BASE_URL=/api`
- [ ] `npm run build` completes without errors
- [ ] `dist/` folder deployed to server
- [ ] NGINX installed: `sudo which nginx`
- [ ] NGINX config copied: `sudo test -f /etc/nginx/sites-available/e-library-portal.app && echo OK`
- [ ] NGINX test passes: `sudo nginx -t`
- [ ] NGINX running: `sudo systemctl status nginx`
- [ ] SSL certs updated in nginx.conf
- [ ] Backend URL correct in nginx.conf
- [ ] Test URL in browser: `https://e-library-portal.app`
- [ ] DevTools Console has no errors

---

## 🔧 One-Minute Emergency Fix Script

If something breaks and you need to fix fast:

```bash
#!/bin/bash
echo "🔧 Emergency fix..."

# 1. Rebuild frontend
cd /var/www/e-library-admin-author
npm run build

# 2. Test NGINX config
sudo nginx -t || { echo "❌ NGINX config broken!"; exit 1; }

# 3. Reload NGINX
sudo systemctl reload nginx

# 4. Check if running
sudo systemctl status nginx | grep active && echo "✅ NGINX running"

echo "✅ Fix complete. Test at https://e-library-portal.app"
```

Save as `fix.sh`, chmod +x, run: `./fix.sh`

---

## 📞 When to Contact Backend Team

Contact backend team if:
- ❌ `curl https://elibrary.pncproject.site/api/admin/dashboard` times out
- ❌ Backend returns `500` errors
- ❌ Backend returns `404` for expected endpoints
- ❌ Token validation fails (`403` forbidden)
- ❌ Database queries are slow

**Provide them:**
- Exact endpoint that fails
- Error response body
- Request headers (Authorization, Content-Type)
- Timestamp of error
- Browser console screenshot

---

## 📞 When to Contact Frontend Team

Contact frontend team if:
- ✅ Backend working (curl succeeds)
- ✅ NGINX running and proxying
- ❌ Page still shows "Network Error"
- ❌ DevTools Console has JavaScript errors
- ❌ UI doesn't respond to clicks

**Provide them:**
- Screenshot of the error
- DevTools Console log (red errors)
- DevTools Network tab (failed requests)
- Timestamp of issue
- Steps to reproduce

---

🚀 Most issues are fixed with: `sudo systemctl reload nginx`

Good luck! 💪
