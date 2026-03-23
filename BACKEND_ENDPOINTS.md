Backend API contract for books used by the admin and author UIs. Base URL defaults to `https://elibrary.pncproject.site` but can be overridden with `VITE_API_BASE_URL`. All requests include `Authorization: Bearer <token>` when a token is available.

Data fields expected on book objects:
- `id` number
- `title` string
- `author` string (or `authorName`)
- `category` string (shown as Genre)
- `status` string: Approved | Pending | Rejected
- `downloads` number
- `cover_image_url` or `cover_image_path` (joined as `${API_BASE_URL}/storage/${cover_image_path}`)
- `book_file_url` or `book_file_path` (joined as `${API_BASE_URL}/storage/${book_file_path}`)
- `description` string
- `first_publish_year` number (optional)
- `manuscript_type` string MIME (optional)
- `manuscript_size_bytes` number (optional)
- `date` string label shown in admin table

List books (admin dashboard table):
- Method: GET `/admin/books`
- Query params: `status` in Approved|Pending|Rejected|All, `search` free text across title|author|category
- Response: `{ data: Book[] }` where each Book includes fields above plus `downloads`

Approve or reject a book:
- Method: POST `/admin/books/{id}/approve`
- Method: POST `/admin/books/{id}/reject`
- Response: updated Book

List author’s own books (My Books):
- Method: GET `/api/auth/books`
- Response: `{ data: Book[] }` with file URLs/paths so the detail page can display cover and manuscript

Get single book (author detail view):
- Method: GET `/api/auth/books/{id}`
- Response: Book with `description`, `genre/category`, `manuscript` URLs, and optional `manuscript_type`, `manuscript_size_bytes`

Create a book (author upload):
- Method: POST `/api/auth/book`
- Content-Type: `multipart/form-data`
- Body fields: `title`, `author`, `category`, `description`, optional `cover_image` file, required `book_file` file (PDF preferred), optional `genre`, optional `first_publish_year`
- Response: created Book

Update a book:
- Method: PATCH `/api/auth/books/{id}` (accept `POST` + `_method=PATCH` for compatibility with current frontend)
- Content-Type: `multipart/form-data`
- Body fields: same as create; files are optional but, if provided, replace previous files
- Response: updated Book

Delete a book:
- Method: DELETE `/api/auth/books/{id}`
- Response: 204 No Content or `{ success: true }`

File access expectations:
- Frontend builds file URLs as `${API_BASE_URL}/storage/{relativePath}`; ensure storage is publicly readable or returns the file with proper CORS headers.
- Direct absolute URLs (already hosted) should be returned untouched to allow external assets.

Examples:
```
GET /admin/books?status=Pending&search=history
200 OK
{
  "data": [
    {
      "id": 42,
      "title": "World History",
      "author": "Jane Smith",
      "category": "History",
      "status": "Pending",
      "downloads": 1280,
      "cover_image_path": "covers/world-history.jpg",
      "date": "Feb 2026"
    }
  ]
}
```

```
POST /api/auth/book
Content-Type: multipart/form-data
Fields: title, author, category, description, cover_image (file), book_file (file)
```

Dashboard metrics (admin home):
- Method: GET `/admin/dashboard` (single payload to reduce round-trips)
- Response: JSON with `stats`, `trends`, `activity`, `health`
- `stats`: totals shown on cards: `totalUsers`, `totalBooks`, `pendingApprovals`, `authors`
- `trends`: delta numbers for the badges beside stats (front-end shows `+` or `-`), keys mirror `stats`
- `activity`: array of points for the line/area chart; fields: `label` (e.g., Mon/Tue or date), `users`, `books`, `downloads`
- `health`: status for services; recommended shape:

```
{
  "stats": {
    "totalUsers": 12483,
    "totalBooks": 2847,
    "pendingApprovals": 24,
    "authors": 1234
  },
  "trends": {
    "totalUsers": 342,
    "totalBooks": 127,
    "pendingApprovals": -4,
    "authors": 89
  },
  "activity": [
    { "label": "Mon", "users": 2100, "books": 800, "downloads": 12000 },
    { "label": "Tue", "users": 2400, "books": 950, "downloads": 15000 }
  ],
  "health": {
    "uptimePercent": 99.98,
    "apiServer": { "status": "online", "latencyMs": 12 },
    "database": { "status": "online", "queryTimeMs": 4 },
    "fileStorage": { "status": "warning", "usedPercent": 78 },
    "emailService": { "status": "online", "responseMs": 67 }
  }
}
```

Optional supporting endpoints if backend prefers separation:
- GET `/admin/dashboard/activity?range=7d` returns only the `activity` array
- GET `/admin/dashboard/health` returns only the `health` object
- GET `/admin/dashboard/stats` returns `{ stats, trends }`

---

## Categories Management

List all categories:
- Method: GET `/admin/categories`
- Response: `{ data: [{ id, name, bookCount }, ...] }`

Create a category:
- Method: POST `/admin/categories`
- Body: `{ name: string }`
- Response: `{ data: { id, name, bookCount } }`

Example response:
```json
{
  "data": [
    { "id": 1, "name": "Fiction", "bookCount": 45 },
    { "id": 2, "name": "Science", "bookCount": 38 },
    { "id": 3, "name": "History", "bookCount": 52 }
  ]
}
```

---

## User Reading Activity Tracking

Record when user reads a book:
- Method: POST `/user/books/read`
- Body: `{ bookId, readAt? }`
- Response: `{ data: { id, bookId, userId, readAt, createdAt } }`

Update reading progress:
- Method: PATCH `/user/books/read/{readId}`
- Body: `{ currentPage?, progress?, status? }` (status: 'reading' | 'completed')
- Response: `{ data: { id, bookId, userId, progress, status, updatedAt } }`

Get user's reading history:
- Method: GET `/user/books/read`
- Query params: `limit=50`, `page=1`, `status=all|reading|completed`
- Response: `{ data: [{ id, bookId, title, author, cover_image_path, readAt, progress }, ...] }`

Get currently reading books:
- Method: GET `/user/books/currently-reading`
- Response: `{ data: [{ id, bookId, title, author, progress, lastReadAt }, ...] }`

Example reading record:
```json
{
  "id": 1,
  "bookId": 42,
  "userId": 15,
  "title": "The Great Book",
  "author": "Author Name",
  "cover_image_path": "covers/book.jpg",
  "progress": 65,
  "status": "reading",
  "readAt": "2026-02-20T14:30:00Z",
  "lastReadAt": "2026-02-23T10:15:00Z"
}
```

---

## User Statistics & Analytics

Get user's reading statistics:
- Method: GET `/user/reading-stats`
- Response: 
```json
{
  "data": {
    "totalBooksRead": 45,
    "totalReadingHours": 123.5,
    "currentReadingStreak": 12,
    "favoriteCategory": "Fiction",
    "averageReadingPerDay": 2.3,
    "thisMonthCount": 8,
    "thisYearCount": 38
  }
}
```

Get user profile (including stats):
- Method: GET `/users/{userId}`
- Response:
```json
{
  "data": {
    "id": 15,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "avatars/user.jpg",
    "joinedAt": "2025-06-15",
    "stats": {
      "totalBooksRead": 45,
      "totalReadingHours": 123.5,
      "currentStreak": 12
    }
  }
}
```

Get user's reading activity timeline:
- Method: GET `/users/{userId}/reading-activity`
- Query params: `limit=20`, `range=7d|30d|all`
- Response:
```json
{
  "data": [
    { "date": "2026-02-23", "booksRead": 1, "hoursSpent": 2.5, "pagesRead": 87 },
    { "date": "2026-02-22", "booksRead": 0, "hoursSpent": 0, "pagesRead": 0 }
  ]
}
```

---

## Top Readers Leaderboard

Get top readers global leaderboard:
- Method: GET `/admin/leaderboard/readers`
- Query params: `limit=10`, `range=week|month|all`, `sortBy=reads|hours|streak`
- Response:
```json
{
  "data": [
    {
      "rank": 1,
      "userId": 5,
      "name": "Alice Reader",
      "booksRead": 127,
      "readingHours": 890,
      "currentStreak": 45,
      "avatar": "avatars/alice.jpg"
    },
    {
      "rank": 2,
      "userId": 8,
      "name": "Bob Bookworm",
      "booksRead": 112,
      "readingHours": 756,
      "currentStreak": 23,
      "avatar": "avatars/bob.jpg"
    }
  ],
  "meta": { "total": 1250 }
}
```

Get specific user's rank:
- Method: GET `/admin/leaderboard/readers/rank/{userId}`
- Response:
```json
{
  "data": {
    "userId": 15,
    "rank": 87,
    "name": "John Doe",
    "booksRead": 45,
    "readingHours": 123.5,
    "currentStreak": 12
  }
}
```

---

## Book Analytics

Get trending books (most read recently):
- Method: GET `/books/trending`
- Query params: `limit=10`, `range=7d|30d|all`
- Response:
```json
{
  "data": [
    {
      "id": 42,
      "title": "The Great Novel",
      "author": "Jane Author",
      "cover_image_path": "covers/great-novel.jpg",
      "recentReads": 234,
      "totalReads": 1890,
      "rating": 4.7,
      "trend": "up"
    }
  ]
}
```

Get book read analytics:
- Method: GET `/books/{bookId}/read-analytics`
- Response:
```json
{
  "data": {
    "id": 42,
    "title": "The Great Novel",
    "totalReads": 1890,
    "uniqueReaders": 1245,
    "averageProgress": 78.5,
    "completionRate": 65,
    "readingTrend": [
      { "date": "2026-02-20", "reads": 12 },
      { "date": "2026-02-21", "reads": 18 }
    ]
  }
}
```

---

## Author Dashboard Analytics

Get author's dashboard statistics:
- Method: GET `/author/dashboard/stats`
- Response:
```json
{
  "data": {
    "totalSales": 4850.50,
    "totalReaders": 234,
    "totalReads": 1890,
    "averageRating": 4.6,
    "thisMonthSales": 450.25,
    "thisMonthReads": 145
  }
}
```

Get author's book performance chart data:
- Method: GET `/author/dashboard/performance`
- Query params: `range=30d|90d|all`, `groupBy=daily|weekly|monthly`
- Response:
```json
{
  "data": [
    { "date": "2026-02-01", "sales": 150, "reads": 45, "newReaders": 12 },
    { "date": "2026-02-02", "sales": 180, "reads": 58, "newReaders": 15 }
  ]
}
```

Get author's top performing books:
- Method: GET `/author/dashboard/top-books`
- Response:
```json
{
  "data": [
    {
      "id": 42,
      "title": "The Great Novel",
      "sales": 1200,
      "reads": 890,
      "rating": 4.8,
      "recentReads": 45
    }
  ]
}
```

Get recent reader feedback for author's books:
- Method: GET `/author/dashboard/feedback`
- Query params: `limit=10`, `filter=all|positive|negative`
- Response:
```json
{
  "data": [
    {
      "id": 1,
      "bookId": 42,
      "bookTitle": "The Great Novel",
      "readerName": "Reader Name",
      "rating": 5,
      "comment": "Amazing book!",
      "createdAt": "2026-02-23"
    }
  ]
}
```

Get author's reader demographics:
- Method: GET `/author/dashboard/demographics`
- Response:
```json
{
  "data": {
    "byAge": {
      "13-18": 45,
      "19-26": 120,
      "27-35": 98,
      "36+": 67
    },
    "byCountry": {
      "US": 180,
      "GB": 45,
      "CA": 38,
      "Other": 67
    },
    "maleToFemaleRatio": "40:60"
  }
}
```

---

## System Monitoring

Get complete system monitor dashboard:
- Method: GET `/admin/monitor/dashboard`
- Response: JSON with `summary`, `activity`, `health`, `topBooks`
```json
{
  "summary": {
    "totalUsers": 12483,
    "totalBooks": 2847,
    "platformActivity": "High"
  },
  "activity": [
    { "date": "2026-02-23", "activeUsers": 450, "newBooks": 12, "reads": 1230 }
  ],
  "health": {
    "apiServer": { "status": "online", "latencyMs": 12 },
    "database": { "status": "online", "queryTimeMs": 4 },
    "fileStorage": { "status": "warning", "usedPercent": 78 }
  },
  "topBooks": [
    { "title": "Popular Book", "reads": 456, "sales": 890 }
  ]
}
```

Get system monitoring summary:
- Method: GET `/admin/monitor/summary`
- Response: Only the `summary` object

Get system activity data:
- Method: GET `/admin/monitor/activity`
- Query params: `range=7d|30d`
- Response: Only the `activity` array

Get system health status:
- Method: GET `/admin/monitor/health`
- Response: Only the `health` object with service statuses
