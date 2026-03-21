# E-Library Admin & Author Dashboard

A modern React + Vite application for managing books, approvals, users, and reading analytics in the E-Library platform.

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Output: dist/ folder ready for deployment
```

## 📋 Project Structure

- **Admin Dashboard** (`src/admin/`) - Admin controls for books, users, approvals
- **Author Dashboard** (`src/author/`) - Author tools for managing books
- **Authentication** (`src/auth/`) - Login, registration, protected routes
- **API Integration** (`src/lib/apiClient.js`) - Centralized API client with auth

## 🔧 Configuration

### Environment Variables

**Development** (`.env` or `.env.local`):
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT_MS=8000
```

**Production** (`.env.production`):
```env
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=8000
```

📌 **Important**: Use relative `/api` in production with NGINX proxy to avoid CORS issues.

## 📑 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide for production
- **[CORS_FIX_GUIDE.md](docs/CORS_FIX_GUIDE.md)** - Fix CORS & network errors on production
- **[NGINX_PROXY_SETUP.md](docs/NGINX_PROXY_SETUP.md)** - NGINX configuration examples

## 🐞 Fixed Issues

✅ **Routing errors** - `/admin/dashboard` now matches correctly  
✅ **Chart rendering errors** - Fixed ResponsiveContainer width/height dimension issues  
✅ **401 Unauthorized** - Improved token handling and 401 error response interceptor  
✅ **Token errors** - Centralized API client with automatic Bearer token injection  
✅ **CORS errors** - NGINX reverse proxy configuration provided  

## 🔐 API Integration

All API requests go through the centralized `apiClient` (`src/lib/apiClient.js`):
- ✅ Automatically injects Bearer token from localStorage/sessionStorage
- ✅ Normalizes API URLs (handles both `/api/path` and absolute URLs)
- ✅ Detects and handles CORS errors with better error messages
- ✅ Redirects to login on 401 Unauthorized
- ✅ Timeout protection (default 8s)

### Example API Call
```javascript
import { apiClient } from "src/lib/apiClient";

const data = await apiClient.get("/api/admin/dashboard");
// Automatically includes: Authorization: Bearer <token>
// Automatically handles CORS if using NGINX proxy
```

## 📱 Features

- **Admin Dashboard** - System health, stats, activity charts
- **Books Management** - View, approve, reject books
- **User Management** - Search users by role
- **Leaderboard** - Top readers by time range (all/month/week)
- **Approvals** - Handle pending book submissions
- **Categories** - Manage book categories
- **Multi-language** - i18n support (LanguageContext)
- **Dark Theme** - Modern dark UI with Tailwind CSS

## ⚠️ Network Errors on Production?

See **[CORS_FIX_GUIDE.md](docs/CORS_FIX_GUIDE.md)** for troubleshooting:
- CORS headers not set
- NGINX proxy not configured
- Backend unreachable
- SSL certificate issues

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide Icons** - Icon library

## 📦 Key Dependencies

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "recharts": "^2.x",
  "tailwindcss": "^3.x"
}
```
