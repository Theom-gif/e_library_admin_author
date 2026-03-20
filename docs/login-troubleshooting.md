Login Troubleshooting

Observed errors when hosted:
- "No routes matched location \"/login\""
- POST https://e-library-portal.app/api/auth/login 404 (Not Found)

Summary
- The site is attempting a same-origin POST to `/api/auth/login` on the host `e-library-portal.app` and getting a 404. At the same time the client router reports no route for `/login` (SPA routing fallback issue).

Probable causes and solutions

1) SPA route fallback not configured ("No routes matched location \"/login\"")
- Cause: The server is serving static files but does not return `index.html` for unknown paths. Browser navigates to `/login` and the server returns 404 (or blank), so React Router cannot match the route.
- Fixes:
  - Configure your host to serve `index.html` for all unknown paths (single-page app fallback).
  - Netlify: add `/_redirects` entry:
    /*    /index.html   200
  - Nginx example:
    location / {
      try_files $uri $uri/ /index.html;
    }
  - Vercel: ensure you're using a client-side router and not blocking routes at platform level.
  - Alternative: use `HashRouter` instead of `BrowserRouter` if you cannot configure server rewrites.

2) API 404 because the frontend tries same-origin `/api` first
- Cause: The client code attempts a path-only request first ("/api/auth/login"). When deployed, that request goes to the hosting origin (`https://e-library-portal.app`) which likely doesn't host the backend, so it returns 404. The client code treats any response (including 404) as a backend response and stops fallback attempts.
- Why this happens in this repo: `postWithFallback` tries an empty base `""` first (path-only). If that path returns an HTTP response (like 404), the code throws and does not try the fallback base (the configured or default backend URL).
- Fixes (pick one or more):
  - Preferred: Set `VITE_API_BASE_URL` (or the environment var your build expects) in the production build so the client uses the correct backend URL first. For Vite, set `VITE_API_BASE_URL=https://your-backend.example.com` at build time.
  - Quick server-side proxy: configure the host to proxy `/api` requests to your backend server (Nginx, Apache, Vercel rewrites).
  - Update client fallback order: change `getBaseCandidates()` to prefer configured/default base before the empty path, or move empty `""` to the end so the code won't try same-origin first.
  - Example code change (in `src/auth/services/authService.js` or `src/lib/apiClient.js` helper):

    // Current (problematic) ordering
    const candidates = [""];
    if (configured) candidates.push(configured);
    if (defaultBase && defaultBase !== configured) candidates.push(defaultBase);

    // Safer ordering — prefer configured and default, try path last
    const candidates = [];
    if (configured) candidates.push(configured);
    if (defaultBase && defaultBase !== configured) candidates.push(defaultBase);
    candidates.push("");

  - Or change `postWithFallback` to treat HTTP status >=500 as retriable but not 4xx.

3) Missing or incorrectly set environment variables
- Cause: `import.meta.env.VITE_API_BASE_URL` may be empty in production, causing the client to try same-origin first.
- Fixes:
  - Ensure your CI/build sets `VITE_API_BASE_URL` before running `npm run build`.
  - For Netlify: set the variable in Site settings > Build & deploy > Environment.
  - For Vercel: set `VITE_API_BASE_URL` in Project Settings > Environment Variables for Production.
  - Verify that the built JS includes the expected URL by inspecting the built bundle or by checking the console logs we added.

4) Hosting platform intercepts `/api` (serverless functions) or no backend deployed at that host
- Cause: On platforms like Netlify/Vercel, `/api` may be reserved for serverless functions or require special configuration. If no function exists, you'll get a 404.
- Fixes:
  - Deploy backend or create proper serverless endpoints.
  - Configure rewrites so `/api/*` is forwarded to your backend URL.
  - Example `vercel.json` rewrite:
    {
      "rewrites": [
        { "source": "/api/:path*", "destination": "https://your-backend.example.com/api/:path*" },
        { "source": "/(.*)", "destination": "/index.html" }
      ]
    }

5) CORS or preflight issues
- Cause: If backend exists but rejects the request due to CORS, the browser may fail the request. CORS issues often present as network or console errors rather than 404, but verify.
- Fix: Enable `Access-Control-Allow-Origin` on backend or proxy requests through same-origin server.

6) Path mismatch on backend (different API route)
- Cause: Backend uses a different path (e.g., `/auth/login` vs `/api/auth/login`). 
- Fix: Confirm backend path and update `loginRequest` call or proxy appropriately.

Debug & verification steps (quick)
- Check the console logs we added in `src/auth/services/authService.js` — they print the final POST URL, request body and response. Open DevTools Console and Network tab.
- Curl the target endpoint directly from your machine:

  curl -v -X POST https://e-library-portal.app/api/auth/login -d '{"username":"u","password":"p"}' -H "Content-Type: application/json"

  and test the backend URL directly:

  curl -v -X POST https://elibrary.pncproject.site/api/auth/login -d '{"username":"u","password":"p"}' -H "Content-Type: application/json"

- Check the built bundle to confirm `VITE_API_BASE_URL` was embedded. If you used Vite, `import.meta.env.VITE_API_BASE_URL` is read at build-time — setting it after build will not affect the already-built files.
- Inspect server logs for requests to `/api/auth/login` on `e-library-portal.app`.

Recommended immediate action plan
1. Add/confirm `VITE_API_BASE_URL` in your production build environment (point to your real backend). Rebuild and redeploy.
2. If you cannot set env vars, change candidate ordering so the client tries the configured/default base first (see code snippet above).
3. Configure server rewrites so `index.html` is returned for SPA routes (fixes `/login` route problem).
4. Confirm backend is deployed and accessible, then test with `curl`.

Where we added logs
- `src/auth/services/authService.js` now logs POST URL, request body and response (and response errors). Use the browser console to inspect what URL and body were used.

If you want, I can:
- Patch `getBaseCandidates()` to prefer configured/default base before path-only.
- Provide platform-specific rewrite/proxy snippets for your hosting provider.

