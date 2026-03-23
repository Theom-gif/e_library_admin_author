# Backend API Testing Guide

**Purpose:** Quick reference with curl examples to test all backend endpoints

**Base URL:** `https://elibrary.pncproject.site` (can be overridden with `VITE_API_BASE_URL`)

---

## 🔑 Authentication

### Get Auth Token (Login)
```bash
curl -X POST "https://elibrary.pncproject.site/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }' | jq

# Response:
# {
#   "data": {
#     "token": "eyJhbGc...",
#     "user": { "id": 1, "name": "Admin", "role": "admin" }
#   }
# }
```

### Set Bearer Token for Subsequent Requests
```bash
TOKEN="eyJhbGc..."
```

---

## 📚 Books Management

### List Books (Admin)
```bash
# Get all books
curl -X GET "https://elibrary.pncproject.site/api/admin/books" \
  -H "Authorization: Bearer $TOKEN"

# With filters
curl -X GET "https://elibrary.pncproject.site/api/admin/books?status=Pending&search=history&page=1&per_page=50" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "data": [
#     {
#       "id": 42,
#       "title": "World History",
#       "author": "Jane Smith",
#       "category": "History",
#       "status": "Pending",
#       "downloads": 1280,
#       "cover_image_path": "covers/world-history.jpg",
#       "date": "Feb 2026"
#     }
#   ],
#   "meta": {
#     "total": 150,
#     "page": 1,
#     "perPage": 50,
#     "lastPage": 3
#   }
# }
```

### Approve a Book
```bash
BOOK_ID=42

curl -X POST "https://elibrary.pncproject.site/api/admin/books/$BOOK_ID/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# { "data": {...book data...}, "message": "Book approved" }
```

### Reject a Book
```bash
BOOK_ID=42

curl -X POST "https://elibrary.pncproject.site/api/admin/books/$BOOK_ID/reject" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Contains inappropriate content" }'
```

### Get Author's Books
```bash
curl -X GET "https://elibrary.pncproject.site/api/auth/books" \
  -H "Authorization: Bearer $TOKEN"

# Optional filters
curl -X GET "https://elibrary.pncproject.site/api/auth/books?status=Approved&search=novel" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Book Details
```bash
BOOK_ID=42

curl -X GET "https://elibrary.pncproject.site/api/auth/books/$BOOK_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected response includes description, full paths, etc.
```

### Create a Book (Upload)
```bash
curl -X POST "https://elibrary.pncproject.site/api/auth/book" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=My Novel" \
  -F "author=John Author" \
  -F "category=Fiction" \
  -F "description=A great novel" \
  -F "cover_image=@/path/to/cover.jpg" \
  -F "book_file=@/path/to/book.pdf"
```

### Update a Book
```bash
BOOK_ID=42

curl -X POST "https://elibrary.pncproject.site/api/auth/books/$BOOK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "_method=PATCH" \
  -F "title=Updated Title" \
  -F "description=Updated description" \
  -F "cover_image=@/path/to/new-cover.jpg"
```

### Delete a Book
```bash
BOOK_ID=42

curl -X DELETE "https://elibrary.pncproject.site/api/auth/books/$BOOK_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected response: 204 No Content or { "success": true }
```

---

## 📊 Admin Dashboard

### Get Complete Dashboard
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected response:
# {
#   "stats": {
#     "totalUsers": 12483,
#     "totalBooks": 2847,
#     "pendingApprovals": 24,
#     "authors": 1234
#   },
#   "trends": {
#     "totalUsers": 342,
#     "totalBooks": 127,
#     "pendingApprovals": -4,
#     "authors": 89
#   },
#   "activity": [
#     { "label": "Mon", "users": 2100, "books": 800, "downloads": 12000 },
#     { "label": "Tue", "users": 2400, "books": 950, "downloads": 15000 }
#   ],
#   "health": {
#     "apiServer": { "status": "online", "latencyMs": 12 },
#     ...
#   }
# }
```

### Get Dashboard Stats Only
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Activity Chart Data
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/dashboard/activity?range=7d" \
  -H "Authorization: Bearer $TOKEN"

# Query options: range=7d|30d|all
```

### Get Health Status
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/dashboard/health" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Categories

### List All Categories
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/categories" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "data": [
#     { "id": 1, "name": "Fiction", "bookCount": 45 },
#     { "id": 2, "name": "Science", "bookCount": 38 },
#     { "id": 3, "name": "History", "bookCount": 52 }
#   ]
# }
```

### Create Category
```bash
curl -X POST "https://elibrary.pncproject.site/api/admin/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Mystery" }'
```

---

## 📖 User Reading Activity

### Record a Book Read
```bash
curl -X POST "https://elibrary.pncproject.site/api/user/books/read" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "bookId": 42, "readAt": "2026-02-23T10:30:00Z" }'
```

### Update Reading Progress
```bash
READ_ID=1

curl -X PATCH "https://elibrary.pncproject.site/api/user/books/read/$READ_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progress": 75,
    "status": "reading",
    "currentPage": 234
  }'
```

### Get Reading History
```bash
curl -X GET "https://elibrary.pncproject.site/api/user/books/read?limit=50&page=1&status=all" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Currently Reading
```bash
curl -X GET "https://elibrary.pncproject.site/api/user/books/currently-reading" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📈 User Statistics

### Get Reading Stats
```bash
curl -X GET "https://elibrary.pncproject.site/api/user/reading-stats" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "data": {
#     "totalBooksRead": 45,
#     "totalReadingHours": 123.5,
#     "currentReadingStreak": 12,
#     "favoriteCategory": "Fiction",
#     "averageReadingPerDay": 2.3,
#     "thisMonthCount": 8,
#     "thisYearCount": 38
#   }
# }
```

### Get User Profile
```bash
USER_ID=15

curl -X GET "https://elibrary.pncproject.site/api/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Get User Activity Timeline
```bash
USER_ID=15

curl -X GET "https://elibrary.pncproject.site/api/users/$USER_ID/reading-activity?limit=20&range=7d" \
  -H "Authorization: Bearer $TOKEN"

# Query options: range=7d|30d|all
```

---

## 🏆 Leaderboard

### Get Top Readers
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/leaderboard/readers?limit=10&range=month&sortBy=reads" \
  -H "Authorization: Bearer $TOKEN"

# Query options:
#   limit=10
#   range=week|month|all
#   sortBy=reads|hours|streak

# Expected response:
# {
#   "data": [
#     {
#       "rank": 1,
#       "userId": 5,
#       "name": "Alice Reader",
#       "booksRead": 127,
#       "readingHours": 890,
#       "currentStreak": 45,
#       "avatar": "avatars/alice.jpg"
#     }
#   ],
#   "meta": { "total": 1250 }
# }
```

### Get Specific User Rank
```bash
USER_ID=15

curl -X GET "https://elibrary.pncproject.site/api/admin/leaderboard/readers/rank/$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Book Analytics

### Get Trending Books
```bash
curl -X GET "https://elibrary.pncproject.site/api/books/trending?limit=10&range=30d" \
  -H "Authorization: Bearer $TOKEN"

# Query options: range=7d|30d|all

# Expected response:
# {
#   "data": [
#     {
#       "id": 42,
#       "title": "The Great Novel",
#       "author": "Jane Author",
#       "cover_image_path": "covers/great-novel.jpg",
#       "recentReads": 234,
#       "totalReads": 1890,
#       "rating": 4.7,
#       "trend": "up"
#     }
#   ]
# }
```

### Get Book Analytics
```bash
BOOK_ID=42

curl -X GET "https://elibrary.pncproject.site/api/books/$BOOK_ID/read-analytics" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "data": {
#     "id": 42,
#     "title": "The Great Novel",
#     "totalReads": 1890,
#     "uniqueReaders": 1245,
#     "averageProgress": 78.5,
#     "completionRate": 65,
#     "readingTrend": [
#       { "date": "2026-02-20", "reads": 12 },
#       { "date": "2026-02-21", "reads": 18 }
#     ]
#   }
# }
```

---

## 👤 Author Dashboard

### Get Author Stats
```bash
curl -X GET "https://elibrary.pncproject.site/api/author/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "data": {
#     "totalSales": 4850.50,
#     "totalReaders": 234,
#     "totalReads": 1890,
#     "averageRating": 4.6,
#     "thisMonthSales": 450.25,
#     "thisMonthReads": 145
#   }
# }
```

### Get Performance Chart Data
```bash
curl -X GET "https://elibrary.pncproject.site/api/author/dashboard/performance?range=30d&groupBy=daily" \
  -H "Authorization: Bearer $TOKEN"

# Query options:
#   range=30d|90d|all
#   groupBy=daily|weekly|monthly
```

### Get Top Books
```bash
curl -X GET "https://elibrary.pncproject.site/api/author/dashboard/top-books" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Reader Feedback
```bash
curl -X GET "https://elibrary.pncproject.site/api/author/dashboard/feedback?limit=10&filter=all" \
  -H "Authorization: Bearer $TOKEN"

# Query options: filter=all|positive|negative
```

### Get Demographics (Optional)
```bash
curl -X GET "https://elibrary.pncproject.site/api/author/dashboard/demographics" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🖥️ System Monitoring

### Get Full Monitoring Dashboard
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/monitor/dashboard" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "summary": {
#     "totalUsers": 12483,
#     "totalBooks": 2847,
#     "platformActivity": "High"
#   },
#   "activity": [...],
#   "health": {...},
#   "topBooks": [...]
# }
```

### Get Activity Data Only
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/monitor/activity?range=7d" \
  -H "Authorization: Bearer $TOKEN"

# Query options: range=7d|30d
```

### Get Health Status Only
```bash
curl -X GET "https://elibrary.pncproject.site/api/admin/monitor/health" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Automated Testing Script

Save as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="https://elibrary.pncproject.site"
EMAIL="admin@example.com"
PASSWORD="password123"

echo "=== E-Library API Testing ==="

# 1. Login
echo "1. Testing login..."
LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:20}..."

# 2. Get Dashboard
echo "2. Testing dashboard..."
curl -s -X GET "$BASE_URL/api/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq '.stats'

# 3. List Books
echo "3. Testing book list..."
curl -s -X GET "$BASE_URL/api/admin/books" \
  -H "Authorization: Bearer $TOKEN" | jq '.meta'

# 4. Get Top Readers
echo "4. Testing leaderboard..."
curl -s -X GET "$BASE_URL/api/admin/leaderboard/readers" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0]'

# 5. Get Trending Books
echo "5. Testing trending books..."
curl -s -X GET "$BASE_URL/api/books/trending" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0]'

echo "✅ All tests completed!"
```

Run it:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🐛 Debugging Tips

### Check Response Format
```bash
# Pretty print JSON response
curl -X GET "..." -H "Authorization: Bearer $TOKEN" | jq

# Check just the status code
curl -s -o /dev/null -w "%{http_code}" -X GET "..." -H "Authorization: Bearer $TOKEN"

# See response headers
curl -i "..."
```

### Common Issues

#### 401 Unauthorized
- Token is missing or invalid
- Token has expired
- User account is inactive

Solution:
```bash
# Get new token
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"..."}'
```

#### 404 Not Found
- Wrong endpoint path
- Resource doesn't exist
- Typo in URL

Solution: Double-check endpoint in `BACKEND_ENDPOINTS.md`

#### 422 Unprocessable Entity
- Validation error in request body
- Missing required fields

Solution: Check error response:
```bash
curl -X POST "..." | jq '.errors'
```

#### 500 Server Error
- Backend error
- Database issue
- Configuration problem

Solution: Check backend logs and error messages

---

**Last Updated:** March 23, 2026  
**Note:** Replace placeholders like `$TOKEN`, `$BOOK_ID`, etc. with actual values when running commands
