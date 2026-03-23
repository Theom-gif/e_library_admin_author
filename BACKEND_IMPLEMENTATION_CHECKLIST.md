# Backend Implementation Checklist

**Purpose:** Quick reference for backend developers on all endpoints that must be implemented for the frontend to work.

**Status:** 30 endpoints total that need implementation

---

## ✅ Books Management - 8 Endpoints

### Admin Book Operations
```
✅ GET /admin/books
   Query: status (Approved|Pending|Rejected|All), search, page, per_page
   Response: { data: Book[], meta: { total, page, perPage, lastPage } }

✅ POST /admin/books/{id}/approve
   Body: {}
   Response: { data: BookRecord, message: "Book approved" }

✅ POST /admin/books/{id}/reject
   Body: { reason? }
   Response: { data: BookRecord, message: "Book rejected" }
```

### Author Book Operations
```
✅ GET /api/auth/books
   Query: status?, search?
   Response: { data: Book[] }

✅ GET /api/auth/books/{id}
   Response: { data: BookWithDetails }

✅ POST /api/auth/book
   Content-Type: multipart/form-data
   Fields: title, author, category, description, cover_image (file), book_file (file)
   Response: { data: Book, message: "Book created" }

✅ PATCH /api/auth/books/{id}
   Accept POST with _method=PATCH
   Content-Type: multipart/form-data
   Fields: title?, author?, category?, description?, cover_image?, book_file?
   Response: { data: Book, message: "Book updated" }

✅ DELETE /api/auth/books/{id}
   Response: { success: true } or 204 No Content
```

---

## ✅ Admin Dashboard - 4 Endpoints

```
✅ GET /admin/dashboard
   Response: {
     stats: {
       totalUsers: number,
       totalBooks: number,
       pendingApprovals: number,
       authors: number
     },
     trends: {
       totalUsers: number,
       totalBooks: number,
       pendingApprovals: number,
       authors: number
     },
     activity: [
       { label: "Mon", users: number, books: number, downloads: number }
     ],
     health: {
       uptimePercent: number,
       apiServer: { status: string, latencyMs: number },
       database: { status: string, queryTimeMs: number },
       fileStorage: { status: string, usedPercent: number },
       emailService: { status: string, responseMs: number }
     }
   }

✅ GET /admin/dashboard/stats (optional, if unified endpoint used)
   Response: { stats, trends }

✅ GET /admin/dashboard/activity?range=7d|30d|all (optional)
   Response: Array of activity objects

✅ GET /admin/dashboard/health (optional)
   Response: Health status object
```

---

## ✅ Categories - 2 Endpoints

```
✅ GET /admin/categories
   Response: {
     data: [
       { id: number, name: string, bookCount: number }
     ]
   }

✅ POST /admin/categories
   Body: { name: string }
   Response: { data: { id, name, bookCount } }
```

---

## ✅ User Reading Activity - 4 Endpoints

```
✅ POST /user/books/read
   Body: { bookId: number, readAt?: datetime }
   Response: { data: { id, bookId, userId, readAt, createdAt } }

✅ PATCH /user/books/read/{readId}
   Body: { currentPage?: number, progress?: number, status?: string }
   Response: { data: ReadRecord }

✅ GET /user/books/read
   Query: limit=50, page=1, status=all|reading|completed
   Response: { data: ReadRecord[] }

✅ GET /user/books/currently-reading
   Response: { data: ReadRecord[] }
```

---

## ✅ User Statistics - 3 Endpoints

```
✅ GET /user/reading-stats
   Response: {
     data: {
       totalBooksRead: number,
       totalReadingHours: number,
       currentReadingStreak: number,
       favoriteCategory: string,
       averageReadingPerDay: number,
       thisMonthCount: number,
       thisYearCount: number
     }
   }

✅ GET /users/{userId}
   Response: {
     data: {
       id: number,
       name: string,
       email: string,
       avatar: string,
       joinedAt: date,
       stats: { totalBooksRead, totalReadingHours, currentStreak }
     }
   }

✅ GET /users/{userId}/reading-activity
   Query: limit=20, range=7d|30d|all
   Response: {
     data: [
       { date, booksRead, hoursSpent, pagesRead }
     ]
   }
```

---

## ✅ Top Readers Leaderboard - 2 Endpoints

```
✅ GET /admin/leaderboard/readers
   Query: limit=10, range=week|month|all, sortBy=reads|hours|streak
   Response: {
     data: [
       {
         rank: number,
         userId: number,
         name: string,
         booksRead: number,
         readingHours: number,
         currentStreak: number,
         avatar: string
       }
     ],
     meta: { total: number }
   }

✅ GET /admin/leaderboard/readers/rank/{userId}
   Response: {
     data: {
       userId, rank, name, booksRead, readingHours, currentStreak
     }
   }
```

---

## ✅ Book Analytics - 2 Endpoints

```
✅ GET /books/trending
   Query: limit=10, range=7d|30d|all
   Response: {
     data: [
       {
         id: number,
         title: string,
         author: string,
         cover_image_path: string,
         recentReads: number,
         totalReads: number,
         rating: number,
         trend: "up"|"down"|"stable"
       }
     ]
   }

✅ GET /books/{bookId}/read-analytics
   Response: {
     data: {
       id, title, totalReads, uniqueReaders, averageProgress,
       completionRate, readingTrend: [{ date, reads }]
     }
   }
```

---

## ✅ Author Dashboard - 4 Endpoints

```
✅ GET /author/dashboard/stats
   Response: {
     data: {
       totalSales: number,
       totalReaders: number,
       totalReads: number,
       averageRating: number,
       thisMonthSales: number,
       thisMonthReads: number
     }
   }

✅ GET /author/dashboard/performance
   Query: range=30d|90d|all, groupBy=daily|weekly|monthly
   Response: {
     data: [
       { date, sales, reads, newReaders }
     ]
   }

✅ GET /author/dashboard/top-books
   Response: {
     data: [
       { id, title, sales, reads, rating, recentReads }
     ]
   }

✅ GET /author/dashboard/feedback
   Query: limit=10, filter=all|positive|negative
   Response: {
     data: [
       { id, bookId, bookTitle, readerName, rating, comment, createdAt }
     ]
   }

✅ GET /author/dashboard/demographics (optional)
   Response: {
     data: {
       byAge: { "13-18": number, ... },
       byCountry: { "US": number, ... },
       maleToFemaleRatio: string
     }
   }
```

---

## ✅ System Monitoring - 3 Endpoints

```
✅ GET /admin/monitor/dashboard
   Response: {
     summary: { totalUsers, totalBooks, platformActivity },
     activity: [{ date, activeUsers, newBooks, reads }],
     health: { apiServer, database, fileStorage },
     topBooks: [{ title, reads, sales }]
   }

✅ GET /admin/monitor/activity
   Query: range=7d|30d
   Response: Array of activity data

✅ GET /admin/monitor/health
   Response: Health status object
```

---

## 📋 Data Type Specifications

### Book Object
```javascript
{
  id: number,
  title: string,
  author: string (or authorName),
  category: string,
  status: "Approved" | "Pending" | "Rejected",
  downloads: number,
  cover_image_path: string (relative path),
  book_file_path: string (relative path),
  description: string,
  first_publish_year?: number,
  manuscript_type?: string (MIME type),
  manuscript_size_bytes?: number,
  date: string (e.g., "Feb 2026")
}
```

### ReadActivity Object
```javascript
{
  id: number,
  bookId: number,
  userId: number,
  title: string,
  author: string,
  cover_image_path: string,
  progress: number (0-100),
  status: "reading" | "completed",
  readAt: datetime,
  lastReadAt: datetime
}
```

### HealthStatus Object
```javascript
{
  status: "online" | "offline" | "warning",
  latencyMs?: number,
  queryTimeMs?: number,
  usedPercent?: number,
  responseMs?: number
}
```

---

## 🔐 Authentication Requirements

**All endpoints require:**
```
Authorization: Bearer {jwt_token}
```

**Exceptions:**
- POST /api/auth/login (login endpoint)
- POST /api/auth/register (registration endpoint)

---

## 🚀 Performance Requirements

| Endpoint Type | Target Response Time | With Cache |
|---------------|----------------------|------------|
| Single resource | < 200ms | < 50ms |
| List endpoints | < 300ms | < 100ms |
| Aggregated stats | < 500ms | < 100ms |
| Charts/analytics | < 800ms | < 150ms |
| Complex dashboard | < 1000ms | < 200ms |

---

## 💾 Recommended Database Indexes

```sql
-- Users & Auth
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Books
CREATE INDEX idx_books_author_id ON books(author_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_category_id ON books(category_id);

-- Activity & Analytics
CREATE INDEX idx_book_reads_author_date ON book_reads(author_id, created_at);
CREATE INDEX idx_book_reads_user_date ON book_reads(user_id, created_at);
CREATE INDEX idx_reviews_book_id ON reviews(book_id);
CREATE INDEX idx_sales_author_date ON sales(author_id, created_at);
```

---

## 📝 Implementation Priority

### Phase 1 (Critical - Week 1-2)
- [ ] Authentication (login, logout, token refresh)
- [ ] Book CRUD operations (create, read, update, delete)
- [ ] Book approval/rejection
- [ ] Admin dashboard stats

### Phase 2 (Important - Week 3)
- [ ] User reading activity tracking
- [ ] Categories management
- [ ] Author dashboard stats

### Phase 3 (Standard - Week 4)
- [ ] User statistics and leaderboard
- [ ] Book analytics and trending
- [ ] System monitoring

### Phase 4 (Optional - Week 5+)
- [ ] Demographics endpoint
- [ ] Advanced filtering and search
- [ ] Caching and optimization

---

## ✔️ Verification Checklist

For each endpoint, verify:
- [ ] Endpoint path matches spec exactly
- [ ] HTTP method is correct (GET, POST, PATCH, DELETE)
- [ ] Query parameters work as expected
- [ ] Request body format is correct
- [ ] Response format matches spec
- [ ] All required fields are present
- [ ] Data types are correct
- [ ] Proper HTTP status codes returned
- [ ] Authorization is enforced
- [ ] Error responses are formatted correctly
- [ ] Performance targets are met

---

**Last Updated:** March 23, 2026  
**Reference:** See `BACKEND_ENDPOINTS.md` for complete specifications
