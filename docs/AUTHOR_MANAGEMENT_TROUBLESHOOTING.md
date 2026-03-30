# "Failed to Fetch Authors" - Troubleshooting Guide

If you're seeing the "Failed to fetch authors" error, this guide will help you diagnose and fix it.

---

## 🔍 Step 1: Check Browser Console

1. Open **Developer Tools** (F12 or Ctrl+Shift+I)
2. Go to the **Console** tab
3. Look for log messages starting with `[AuthorService]`

**Example output you should see:**
```
[AuthorService] Fetching from: /api/admin/authors
```

**What this tells you:**
- ✅ Service is attempting to fetch from the correct endpoint
- ✅ The request is being made

---

## 🔗 Step 2: Check Network Tab

1. Open **Developer Tools** (F12)
2. Go to the **Network** tab
3. Refresh the page
4. Look for a request to `/api/admin/authors`

### What to Check:

**Status Code:**
- ✅ **200-201**: Success - Backend implemented correctly
- ❌ **404**: Not Found - Endpoint doesn't exist on backend
- ❌ **401**: Unauthorized - Authentication token missing/invalid
- ❌ **403**: Forbidden - User doesn't have permission
- ❌ **500**: Server Error - Backend implementation error
- ❌ **CORS Error**: Cross-origin issue

**Response Data:**
Click the request and check the **Response** tab to see the actual error message.

---

## 🔧 Common Issues & Solutions

### Issue 1: 404 - Endpoint Not Found

**Symptoms:**
```
Network Status: 404 Not Found
```

**Cause:**
The backend doesn't have the `/api/admin/authors` endpoint implemented yet.

**Solution:**
✅ **Implement the Laravel backend** following the [Backend Implementation Guide](./docs/AUTHOR_MANAGEMENT_BACKEND_GUIDE.md)

Steps:
1. Create Author model
2. Create AuthorController
3. Add routes to `routes/api.php`
4. Run migrations
5. Restart Laravel server

---

### Issue 2: 401 - Unauthorized

**Symptoms:**
```
Network Status: 401 Unauthorized
Response: { "message": "Unauthenticated" }
```

**Cause:**
Authentication token is missing or invalid.

**Solution:**
1. **Check if logged in**: Verify you're logged in as an admin user
2. **Check token**: Open console and run:
   ```javascript
   localStorage.getItem('bookhub_token')
   ```
3. **Token exists**: Should return a token string
4. **Token missing**: Log out and log back in

**If token exists but still 401:**
- Token may be expired
- Token may be invalid
- Backend may not recognize token format

---

### Issue 3: CORS Error

**Symptoms:**
```
Access to XMLHttpRequest at 'https://...' from origin 'http://localhost:...' 
has been blocked by CORS policy
```

**Cause:**
Backend CORS headers not configured correctly.

**Solution:**
In **Laravel** (to fix CORS):

1. Install CORS package:
   ```bash
   composer require fruitcake/laravel-cors
   ```

2. Configure in `config/cors.php`:
   ```php
   'allowed_origins' => ['*'], // or specific domain
   'allowed_methods' => ['*'],
   'allowed_headers' => ['*'],
   'exposed_headers' => [],
   'max_age' => 0,
   'supports_credentials' => true,
   ```

3. Add to `app/Http/Middleware/VerifyCsrfToken.php`:
   ```php
   protected $except = [
       'api/*',
   ];
   ```

---

### Issue 4: Backend Server Not Running

**Symptoms:**
```
Network Error or Connection Refused
```

**Cause:**
Laravel backend server is not running.

**Solution:**
1. **Start Laravel server:**
   ```bash
   cd your-laravel-project
   php artisan serve
   ```

2. **Check it's running:**
   - Visit `http://127.0.0.1:8000` in browser
   - Should load Laravel welcome page

3. **Check front-end API URL:**
   In `.env` file:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```

---

## 📋 Complete Debugging Checklist

### Frontend Checks
- [ ] Logged in as Admin user
- [ ] Navigated to `/admin/authors` page
- [ ] Can see "Create Author" button
- [ ] Error message appears when loading authors

### Network Checks
- [ ] Open Network tab
- [ ] See `/api/admin/authors` request
- [ ] Note the HTTP status code
- [ ] Check the response data
- [ ] Check request headers (includes `Authorization: Bearer <token>`)

### Backend Checks
- [ ] Laravel server running (`php artisan serve`)
- [ ] Database migrated (`php artisan migrate`)
- [ ] Author model created (`app/Models/Author.php`)
- [ ] AuthorController created (`app/Http/Controllers/AuthorController.php`)
- [ ] Routes configured (`routes/api.php`)
- [ ] CORS configured correctly

### Authentication Checks
- [ ] Admin token in localStorage
- [ ] Token hasn't expired
- [ ] Backend recognizes token format
- [ ] User has 'Admin' role

---

## 🛠️ Testing the Endpoint Manually

### Using cURL

```bash
# Replace YOUR_TOKEN with actual token
curl -X GET http://127.0.0.1:8000/api/admin/authors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Using Postman

1. **Create request:**
   - Method: `GET`
   - URL: `http://127.0.0.1:8000/api/admin/authors`

2. **Add headers:**
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN` (from localStorage)

3. **Send request**
4. **Check response status and data**

### Using Browser Console

```javascript
// Get your token
const token = localStorage.getItem('bookhub_token');

// Make request
fetch('http://127.0.0.1:8000/api/admin/authors', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log(data))
.catch(e => console.error(e));
```

---

## 🔄 Quick Fix Steps (In Order)

**Try these in order:**

1. **Refresh page**
   ```
   F5 or Ctrl+R
   ```

2. **Log out and log back in**
   - Log out
   - Clear localStorage: `localStorage.clear()`
   - Log back in

3. **Check backend is running**
   ```bash
   php artisan serve
   ```

4. **Run migrations**
   ```bash
   php artisan migrate
   ```

5. **Clear caches**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   ```

6. **Check API response manually** (use cURL or Postman)

7. **Check logs:**
   - Frontend: Browser console (F12)
   - Backend: `storage/logs/laravel.log`

---

## 📊 Expected API Response

When everything works, you should see:

**Successful response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "bio": "Author bio",
      "profile_image_url": "http://...",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

**Or empty list (200):**
```json
{
  "success": true,
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 0
  }
}
```

---

## 🎯 Most Common Cause

**95% of the time:** The backend endpoint isn't implemented yet.

**Solution:** 
Follow the [Backend Implementation Guide](./docs/AUTHOR_MANAGEMENT_BACKEND_GUIDE.md) step-by-step to:
1. Create the Author model
2. Create the AuthorController
3. Add routes
4. Run migrations

---

## 💡 Debug Logging

The `authorService.js` now includes detailed logging. Check console for messages like:

```javascript
[AuthorService] Fetching from: /api/admin/authors
[AuthorService] fetchAuthors response: {...}
[AuthorService] fetchAuthors error: {...}
```

These logs will help you understand:
- What URL is being called
- What response you got back
- What error occurred

---

## 📞 Still Stuck?

Check these files:
1. **Frontend logs**: Browser Console (F12)
2. **Network request**: DevTools → Network tab → `/api/admin/authors` request
3. **Backend logs**: `storage/logs/laravel.log`
4. **Backend status**: Is `php artisan serve` running?
5. **Database**: Is database migrated? `php artisan migrate`

---

## ✅ Success Indicators

You know it's working when:

✅ No error messages in console
✅ Network request returns 200 status
✅ Authors list displays (even if empty)
✅ Can create new authors
✅ Can delete authors
✅ Can resend invitations

---

**Still having issues?** 

1. Check the [Backend Implementation Guide](./docs/AUTHOR_MANAGEMENT_BACKEND_GUIDE.md)
2. Verify all backend setup steps are complete
3. Check browser console for detailed error messages
4. Review backend logs in `storage/logs/laravel.log`

