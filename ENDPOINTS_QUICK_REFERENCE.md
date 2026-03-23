# Frontend API Endpoints - Quick Reference

**All endpoints require:** `Authorization: Bearer {token}` (except login/register)

---

## 🔐 Authentication Endpoints

```
POST /api/auth/login
  Request: { email, password }
  Response: { token, user: { id, name, role } }

POST /api/auth/register
  Request: { email, password, name, role }
  Response: { token, user: { ... } }

POST /api/auth/refresh (optional)
  Request: {}
  Response: { token }

POST /api/auth/logout
  Request: {}
  Response: { success: true }
```

---

## 📚 Books Management

### Admin View
```
GET /admin/books?status=X&search=X&page=1&per_page=50
  Response: { data: Book[], meta: { total, page, perPage, lastPage } }

POST /admin/books/{id}/approve
  Request: {}
  Response: { data: Book }

POST /admin/books/{id}/reject
  Request: { reason? }
  Response: { data: Book }
```

### Author View
```
GET /api/auth/books?status=X&search=X
  Response: { data: Book[] }

GET /api/auth/books/{id}
  Response: { data: Book }

POST /api/auth/book
  Content-Type: multipart/form-data
  Fields: title, author, category, description, cover_image (file), book_file (file)
  Response: { data: Book, message: "Created" }

PATCH /api/auth/books/{id}
  Use: POST with _method=PATCH
  Content-Type: multipart/form-data
  Response: { data: Book, message: "Updated" }

DELETE /api/auth/books/{id}
  Response: 204 or { success: true }
```

---

## 📊 Admin Dashboard

```
GET /admin/dashboard (unified)
  Response: {
    stats: { totalUsers, totalBooks, pendingApprovals, authors },
    trends: { totalUsers, totalBooks, pendingApprovals, authors },
    activity: [{ label, users, books, downloads }],
    health: { ... }
  }

GET /admin/dashboard/stats
  Response: { stats, trends }

GET /admin/dashboard/activity?range=7d|30d|all
  Response: [{ label, users, books, downloads }]

GET /admin/dashboard/health
  Response: { uptimePercent, apiServer, database, fileStorage, emailService }
```

---

## 📁 Categories

```
GET /admin/categories
  Response: { data: [{ id, name, bookCount }] }

POST /admin/categories
  Request: { name }
  Response: { data: { id, name, bookCount } }
```

---

## 👤 Author Dashboard

```
GET /author/dashboard/stats
  Response: {
    totalSales, totalReaders, totalReads, averageRating,
    thisMonthSales, thisMonthReads, salesTrend, readersTrend
  }

GET /author/dashboard/performance?range=30d|90d|all&groupBy=daily|weekly|monthly
  Response: [{ date, sales, reads, newReaders }]

GET /author/dashboard/top-books
  Response: [{ id, title, sales, reads, rating, recentReads }]

GET /author/dashboard/feedback?limit=10&filter=all|positive|negative
  Response: [{ id, bookId, bookTitle, readerName, rating, comment, createdAt }]

GET /author/dashboard/demographics
  Response: {
    byAge: { "18-25": number, ... },
    byCountry: { "US": number, ... },
    maleToFemaleRatio: "string"
  }
```

---

## 📖 User Reading Activity

```
POST /user/books/read
  Request: { bookId, readAt? }
  Response: { data: ReadRecord }

PATCH /user/books/read/{readId}
  Request: { progress?, status?, currentPage? }
  Response: { data: ReadRecord }

GET /user/books/read?status=all|reading|completed&limit=50&page=1
  Response: { data: ReadRecord[], meta: { total, page, perPage } }

GET /user/books/currently-reading?limit=10
  Response: [ReadRecord]
```

---

## 📈 User Statistics

```
GET /user/reading-stats
  Response: {
    totalBooksRead, totalReadingHours, currentReadingStreak,
    favoriteCategory, averageReadingPerDay, thisMonthCount
  }

GET /users/{userId}
  Response: {
    id, name, email, avatar, joinedAt,
    stats: { totalBooksRead, totalReadingHours, currentStreak }
  }

GET /users/{userId}/reading-activity?timeRange=7d|30d|all&limit=20
  Response: [{ date, booksRead, hoursSpent, pagesRead }]
```

---

## 🏆 Leaderboard

```
GET /admin/leaderboard/readers?limit=10&range=week|month|all&sortBy=reads|hours|streak
  Response: {
    data: [{
      rank, userId, name, booksRead, readingHours,
      currentStreak, avatar
    }],
    meta: { total }
  }

GET /admin/leaderboard/readers/rank/{userId}
  Response: { userId, rank, booksRead, readingHours, currentStreak }
```

---

## 📚 Book Analytics

```
GET /books/trending?limit=10&range=7d|30d|all
  Response: [{
    id, title, author, cover_image_path,
    recentReads, totalReads, rating, trend
  }]

GET /books/{bookId}/read-analytics
  Response: {
    id, title, totalReads, uniqueReaders, averageProgress,
    completionRate, readingTrend: [{ date, reads }]
  }
```

---

## 🖥️ System Monitoring

```
GET /admin/monitor/dashboard
  Response: {
    summary: { totalUsers, totalBooks, platformActivity },
    activity: [{ date, activeUsers, newBooks, reads }],
    health: { ... },
    topBooks: [{ title, reads, sales }]
  }

GET /admin/monitor/activity?range=7d|30d
  Response: [{ date, activeUsers, newBooks, reads }]

GET /admin/monitor/health
  Response: {
    apiServer: { status, latencyMs },
    database: { status, queryTimeMs },
    fileStorage: { status, usedPercent }
  }
```

---

## 📝 Response Data Types

### Book Object
```javascript
{
  id: number,
  title: string,
  author: string,
  category: string,
  status: "Approved" | "Pending" | "Rejected",
  downloads: number,
  cover_image_path: string,          // Path, not full URL
  book_file_path: string,            // Path, not full URL
  description: string,
  date: string,
  first_publish_year?: number,
  manuscript_type?: string,
  manuscript_size_bytes?: number
}
```

### ReadRecord Object
```javascript
{
  id: number,
  bookId: number,
  userId: number,
  title: string,
  author: string,
  progress: number,                  // 0-100
  status: "reading" | "completed",
  readAt: datetime,
  lastReadAt: datetime
}
```

### User Object
```javascript
{
  id: number,
  name: string,
  email: string,
  avatar: string,
  joinedAt: date,
  stats: {
    totalBooksRead: number,
    totalReadingHours: number,
    currentStreak: number
  }
}
```

---

## 🔄 Query Parameters

### Pagination
- `page=1` (default: 1)
- `limit=50` (default: 50)
- `per_page=50` (alternative to limit)

### Filters
- `status=Approved|Pending|Rejected|All`
- `search=text` (searches in title, author, category)
- `range=7d|30d|all|week|month`
- `timeRange=week|month|all`
- `sortBy=reads|hours|streak|created_at`

### Response Formats
```javascript
// Single resource
{ data: Resource }

// Multiple resources
{ data: [Resource], meta: { total, page, perPage } }

// Array response
[Resource, Resource, ...]

// Simple success
{ success: true, message: "Description" }
```

---

## 🛠️ Error Responses

```javascript
// 4xx - Client Error
{
  status: 400|401|403|404|422,
  message: "Error description",
  errors: { fieldName: ["Error 1", "Error 2"] }  // For 422
}

// 5xx - Server Error  
{
  status: 500,
  message: "Internal server error"
}
```

---

## ⚙️ HTTP Methods Used

- `GET` - Retrieve data
- `POST` - Create data / Approve / Reject / Upload
- `PATCH` - Update data (sent as POST with `_method=PATCH`)
- `DELETE` - Delete data

---

## 🔑 Authentication

### Token Storage
```javascript
// Stored in localStorage
localStorage.setItem('bookhub_token', token);
localStorage.getItem('bookhub_token');
```

### Token Header
```
Authorization: Bearer eyJhbGc...
```

### Token Lifecycle
1. Get token from login endpoint
2. Store in localStorage
3. Auto-injected in all requests (via apiClient)
4. Refresh when expired (optional)
5. Remove on logout

---

## 📋 Common Usage Examples

### Login and Store Token
```javascript
const response = await authService.login(email, password);
const { token } = response.data;
localStorage.setItem('bookhub_token', token);
```

### Fetch Dashboard Data
```javascript
const adminService = require('./admin/services/adminService').default;

const dashboard = await adminService.fetchDashboard();
const stats = dashboard.stats;  // { totalUsers, totalBooks, ... }
const activity = dashboard.activity;  // [{ label, users, ... }]
```

### Upload Book
```javascript
const formData = new FormData();
formData.append('title', 'My Book');
formData.append('author', 'Me');
formData.append('category', 'Fiction');
formData.append('book_file', fileInput.files[0]);
formData.append('cover_image', fileInput.files[1]);

const result = await bookService.uploadBookRequest(formData);
```

### Get User Reading Stats
```javascript
const stats = await userActivityService.getUserReadingStats();
console.log(stats.totalBooksRead);  // 45
console.log(stats.currentReadingStreak);  // 12
```

---

## 🚨 Important Notes

1. **File URLs:** Backend returns relative paths like `covers/book.jpg`
   - Frontend constructs: `https://elibrary.pncproject.site/storage/covers/book.jpg`
   - Use `buildStorageUrl()` helper from bookService

2. **Multipart Requests:** Use FormData for file uploads
   - Headers set automatically: `Content-Type: multipart/form-data`

3. **PATCH Requests:** Sent as POST with `_method=PATCH`
   - Backend should respect this for compatibility

4. **Pagination:** Use `limit` or `per_page` (not both)
   - Default limit: 50
   - Default page: 1

5. **Search:** Full-text search across multiple fields
   - Books: title, author, category
   - Users: name, email

6. **Timestamps:** All dates in ISO 8601 format
   - Example: `2026-03-23T10:30:00Z`

7. **Numbers:** All numbers returned as numbers, not strings
   - stats: integer
   - prices: float
   - percentages: 0-100

8. **Status Values:** Case-sensitive
   - Books: "Approved", "Pending", "Rejected"
   - Reading: "reading", "completed", "paused"

---

**Generated:** March 23, 2026  
**Version:** 1.0  
**Frontend Status:** ✅ Ready  
**Backend Status:** Pending Implementation
