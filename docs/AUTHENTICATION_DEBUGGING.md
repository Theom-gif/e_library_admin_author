# Authentication & API Error Debugging Guide

**Error: "Unauthenticated. Network Error"**

This guide helps diagnose and fix authentication issues when calling protected API endpoints.

---

## Quick Diagnostic Checklist

### Step 1: Verify Token Exists
Open browser DevTools (F12) → Console and run:
```javascript
// Check if token is stored
console.log("Token in localStorage:", localStorage.getItem("bookhub_token"));
console.log("Token in sessionStorage:", sessionStorage.getItem("bookhub_token"));
```

**Expected Result:** Should see your JWT token (starts with `eyJ...`)

**If empty/null:** Token was not saved during login. Log in again.

---

### Step 2: Check Console for Debug Logs
After the error occurs, check the browser console for our debug messages:

```
[apiClient] No token found in storage. Request may be unauthenticated.
[TopReaders] API Error: { status: 401, message: "..." }
```

**If you see "[apiClient] No token found in storage":**
- Token is not in localStorage or sessionStorage
- User needs to log in again

**If you see status: 401:**
- Token exists but backend rejected it
- Could be expired, invalid format, or endpoint auth issue

---

### Step 3: Check Network Tab
In DevTools → Network tab:

1. Make a request to the TopReaders page
2. Look for request to `/api/admin/leaderboard/readers`
3. Click on the request and check:
   - **Request Headers** → `Authorization: Bearer eyJ...` should be present
   - **Response Status** → Should be 200 (success) or 401 (token error)
   - **Response Body** → Check error message from backend

**Common Issues:**
- Status: 404 → Endpoint doesn't exist on backend
- Status: 401 → Token invalid/expired or wrong auth header format
- Status: 503 → Backend server not running
- Network error → Can't reach backend at configured URL

---

### Step 4: Verify API Base URL
Check DevTools Console:
```javascript
// Check API base URL
console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
```

**Expected Values:**
- Local development: `http://localhost:8000` or `/api`
- Production: `/api` (Nginx proxy) or `https://your-backend.com/api`

**If wrong:**
1. Update `.env` file with correct `VITE_API_BASE_URL`
2. Rebuild: `npm run build`
3. Restart development server: `npm run dev`

---

## Common Causes & Solutions

### Cause 1: User Not Logged In
**Symptoms:** No token in localStorage/sessionStorage

**Solution:**
1. Log in with valid credentials
2. Verify login was successful (redirected to dashboard)
3. Check localStorage for `bookhub_token`

---

### Cause 2: Token Expired
**Symptoms:** Token exists but backend returns 401

**Solution:**
1. Log out: `localStorage.removeItem("bookhub_token")`
2. Refresh page (F5)
3. Log in again with fresh token

---

### Cause 3: Wrong API Base URL
**Symptoms:** Network error or 404 response

**Solution:**
1. Check `.env` file:
   ```env
   # Development
   VITE_API_BASE_URL=http://localhost:8000

   # Production with Nginx proxy
   VITE_API_BASE_URL=/api

   # Production direct
   VITE_API_BASE_URL=https://api.example.com
   ```
2. Rebuild: `npm run build`
3. Verify in console: `import.meta.env.VITE_API_BASE_URL`

---

### Cause 4: Endpoint Doesn't Exist
**Symptoms:** 404 Not Found on `/api/admin/leaderboard/readers`

**Solution:**
1. Verify backend has implemented the endpoint
2. Check `docs/top-readers-backend.md` for expected endpoint spec
3. Confirm endpoint path matches exactly:
   - Wrong: `/api/admin/top-readers`
   - Right: `/api/admin/leaderboard/readers`

---

### Cause 5: Backend Server Not Running
**Symptoms:** Network error, can't reach server

**Solution:**
1. Check backend is running:
   ```bash
   # For PHP/Laravel
   php artisan serve --host 0.0.0.0 --port 8000

   # For Node.js
   npm start  # or node server.js
   ```
2. Verify it responds: `curl http://localhost:8000/api/health`
3. Check firewall isn't blocking port 8000

---

### Cause 6: CORS or Header Issues
**Symptoms:** Browser shows CORS error, or token not sent

**Solution:**
1. Backend must allow frontend origin:
   ```php
   // Laravel CORS config
   'allowed_origins' => ['http://localhost:3000', 'https://elibrary.pncproject.site'],
   'allowed_methods' => ['*'],
   'allowed_headers' => ['*'],
   'exposed_headers' => ['X-Total-Count'],
   ```

2. Backend must accept Authorization header in CORS:
   ```php
   header('Access-Control-Allow-Headers: Authorization, Content-Type');
   header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
   ```

3. Nginx must pass Authorization header to backend:
   ```nginx
   location /api/ {
       proxy_set_header Authorization $http_authorization;
       proxy_pass https://backend.com;
   }
   ```

---

## Manual Testing

### Test 1: Get Token from Browser
```javascript
// In DevTools Console
const token = localStorage.getItem("bookhub_token") || sessionStorage.getItem("bookhub_token");
console.log(token);
```

Copy the token and use it for manual API tests below.

---

### Test 2: Manual API Call with curl
```bash
# Replace TOKEN with actual token
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

# Local development
curl -X GET "http://localhost:8000/api/admin/leaderboard/readers?range=week&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Production with Nginx proxy
curl -X GET "https://elibrary.pncproject.site/api/admin/leaderboard/readers?range=week&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "user": { "id": 1, "first_name": "...", "last_name": "..." },
      "booksRead": 50,
      "trend": 5
    }
  ],
  "meta": { "range": "week", "generated_at": "2026-03-21T10:00:00Z" }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Unauthenticated",
  "error": "Token invalid or expired"
}
```

---

### Test 3: Check Backend Health
```bash
# Check if backend is responding
curl http://localhost:8000/api/health

# Expected: 200 OK with {"status":"ok"}
```

---

## Frontend Debug Features

### Enable Detailed Logging
Already added to `apiClient.js` and `TopReaders.jsx`. Check console for:
- `[apiClient]` messages: Token attachment and 401 errors
- `[TopReaders]` messages: Full error details with status, message, and URL

---

## Development Workflow

### Local Development
1. **Start backend:**
   ```bash
   php artisan serve  # or your backend command
   ```

2. **Set environment:**
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

4. **Test API calls:**
   - Log in with demo/test credentials
   - Check DevTools Console for `[apiClient]` and `[TopReaders]` logs
   - Check Network tab for `/api/admin/leaderboard/readers` request

---

### Production (Nginx Proxy)
1. **Build frontend:**
   ```bash
   npm run build
   ```

2. **Set environment:**
   ```env
   VITE_API_BASE_URL=/api
   ```

3. **Configure Nginx:**
   ```nginx
   location /api/ {
       proxy_pass https://backend.elibrary.pncproject.site;
       proxy_set_header Authorization $http_authorization;
       proxy_pass_header Authorization;
   }
   ```

4. **Verify:**
   - Check Network tab sees `/api/admin/leaderboard/readers` requests
   - Check Authorization header is included
   - Backend returns 200 with reader data

---

## Full Error Message Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Unauthenticated. Network Error" | 401 status, no token | Log in again, check token in storage |
| "Network error. Check if backend is running..." | ERR_NETWORK | Start backend server, check URL |
| "Failed to load leaderboard." | Generic error | Check console logs for details |
| "Session expired. Redirecting..." | 401 with token | Token is invalid, log in again |

---

## Advanced: Token Inspection

Decode your JWT to check claims:
```javascript
// In DevTools Console
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  return JSON.parse(jsonPayload);
}

const token = localStorage.getItem("bookhub_token");
console.log(parseJwt(token));
```

Check:
- `exp`: Token expiration (is it in the past?)
- `user_id` or `sub`: User ID (valid?)
- `role`: User role (matches login role?)

---

## Getting Help

When reporting an issue, provide:
1. Console logs (copy `[apiClient]` and `[TopReaders]` messages)
2. Network request details (status, headers, response)
3. Token (decoded to see claims)
4. `.env` file settings (API base URL)
5. Backend version and endpoint implementation status

---

**Last Updated:** March 21, 2026
**Version:** 1.0
