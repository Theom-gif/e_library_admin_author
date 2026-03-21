# Author Dashboard Backend Integration Guide

This document provides comprehensive API specifications for integrating backend services with the Author Dashboard frontend (`src/author/pages/Dashboard.jsx`).

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Response Examples](#response-examples)
7. [Performance & Caching](#performance--caching)
8. [Implementation Guide](#implementation-guide)

---

## Overview

The Author Dashboard displays key metrics and insights for authors/publishers, including:
- **Summary Statistics** - Total sales, active readers, total reads, average rating
- **Performance Charts** - Sales and reads trends over time
- **Top Books** - List of best-performing books
- **Reader Feedback** - Recent comments and ratings from readers
- **Reader Demographics** - Age distribution and geographic breakdown

All data displayed must be fetched from the backend API in real-time or cached appropriately.

---

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <token>
```

The token is obtained through the login/auth flow and stored in:
- `localStorage.bookhub_token` or
- `sessionStorage.bookhub_token`

**Error Response (401):**
```json
{
  "status": 401,
  "message": "Unauthenticated",
  "errors": {
    "auth": ["Invalid or expired token"]
  }
}
```

---

## API Endpoints

### Dashboard Summary Statistics

#### Get Author Dashboard Stats
```
GET /api/author/dashboard/stats
Authorization: Bearer <token>
```

**Description:** Retrieve summary statistics for the authenticated author's dashboard.

**Query Parameters:**
- `timeRange` (optional): `'30d'` | `'90d'` | `'1y'` (default: `'30d'`)

**Response: 200 OK**
```json
{
  "data": {
    "totalSales": {
      "value": 12840.50,
      "currency": "USD",
      "change": 12.5,
      "changeType": "positive"
    },
    "activeReaders": {
      "value": 45210,
      "change": 8.2,
      "changeType": "positive"
    },
    "totalReads": {
      "value": 1200000,
      "change": -2.4,
      "changeType": "negative"
    },
    "averageRating": {
      "value": 4.8,
      "maxValue": 5,
      "change": 0.1,
      "changeType": "positive"
    }
  },
  "period": "30d",
  "generatedAt": "2026-03-21T10:30:00Z"
}
```

**Field Definitions:**
- `value` - The main numeric value to display
- `currency` - For monetary values (e.g., "USD", "EUR")
- `change` - Percentage or absolute change from previous period
- `changeType` - `"positive"` | `"negative"` for determining arrow icon
- `maxValue` - For rating systems (optional)

---

### Performance Chart Data

#### Get Performance Overview Data
```
GET /api/author/dashboard/performance
Authorization: Bearer <token>
```

**Description:** Retrieve monthly performance data for the performance chart (sales and reads).

**Query Parameters:**
- `months` (optional): Number of months to return (default: `7`)
- `startDate` (optional): Start date in YYYY-MM-DD format

**Response: 200 OK**
```json
{
  "data": [
    {
      "name": "Jan",
      "month": "2026-01",
      "sales": 4000,
      "reads": 2400,
      "revenue": 4000.00,
      "currency": "USD"
    },
    {
      "name": "Feb",
      "month": "2026-02",
      "sales": 3000,
      "reads": 1398,
      "revenue": 3000.00,
      "currency": "USD"
    },
    {
      "name": "Mar",
      "month": "2026-03",
      "sales": 2000,
      "reads": 9800,
      "revenue": 2000.00,
      "currency": "USD"
    }
  ],
  "metrics": {
    "totalSales": 9000,
    "totalReads": 13598,
    "averageRevenuePerMonth": 3000.00,
    "peakMonth": "2026-03"
  }
}
```

**Data Requirements:**
- Include at least 7 data points for chart visualization
- `name` field should be short (Jan, Feb, Mar, etc.)
- Both `sales` (number of sales) and `reads` (number of times read) required
- `revenue` should be numeric value in specified currency

---

### Top Books

#### Get Author's Top Books
```
GET /api/author/dashboard/top-books
Authorization: Bearer <token>
```

**Description:** Retrieve the author's best-performing books.

**Query Parameters:**
- `limit` (optional): Number of books to return (default: `4`)
- `orderBy` (optional): `'sales'` | `'reads'` | `'rating'` (default: `'sales'`)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": 1,
      "title": "The Midnight Library",
      "author": "Matt Haig",
      "coverImage": "https://cdn.example.com/covers/midnight-library.jpg",
      "sales": 4200,
      "revenue": 4200.00,
      "currency": "USD",
      "growth": 15.0,
      "growthType": "positive",
      "rating": 4.8,
      "readers": 12450
    },
    {
      "id": 2,
      "title": "Project Hail Mary",
      "author": "Andy Weir",
      "coverImage": "https://cdn.example.com/covers/project-hail.jpg",
      "sales": 3850,
      "revenue": 3850.00,
      "currency": "USD",
      "growth": 12.0,
      "growthType": "positive",
      "rating": 4.7,
      "readers": 9820
    },
    {
      "id": 3,
      "title": "Klara and the Sun",
      "author": "Kazuo Ishiguro",
      "coverImage": "https://cdn.example.com/covers/klara-sun.jpg",
      "sales": 2900,
      "revenue": 2900.00,
      "currency": "USD",
      "growth": -5.0,
      "growthType": "negative",
      "rating": 4.6,
      "readers": 7230
    },
    {
      "id": 4,
      "title": "The Silent Patient",
      "author": "Alex Michaelides",
      "coverImage": "https://cdn.example.com/covers/silent-patient.jpg",
      "sales": 2100,
      "revenue": 2100.00,
      "currency": "USD",
      "growth": 8.0,
      "growthType": "positive",
      "rating": 4.5,
      "readers": 5620
    }
  ],
  "pagination": {
    "total": 12,
    "returned": 4,
    "limit": 4
  }
}
```

---

### Reader Feedback

#### Get Recent Feedback
```
GET /api/author/dashboard/feedback
Authorization: Bearer <token>
```

**Description:** Retrieve recent reviews and feedback from readers.

**Query Parameters:**
- `limit` (optional): Number of feedback items (default: `3`)
- `status` (optional): `'all'` | `'pending'` | `'published'` (default: `'all'`)
- `sortBy` (optional): `'recent'` | `'rating'` (default: `'recent'`)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": 456,
      "userId": 123,
      "userName": "Sarah J.",
      "userInitial": "S",
      "userAvatar": "https://ui-avatars.com/api/?name=Sarah+J",
      "bookId": 1,
      "bookTitle": "The Midnight Library",
      "comment": "Absolutely loved the character development in Chapter 4!",
      "rating": 5,
      "createdAt": "2026-03-21T08:30:00Z",
      "timeAgo": "2h ago",
      "helpful": 24,
      "status": "published"
    },
    {
      "id": 457,
      "userId": 124,
      "userName": "Michael R.",
      "userInitial": "M",
      "userAvatar": "https://ui-avatars.com/api/?name=Michael+R",
      "bookId": 1,
      "bookTitle": "The Midnight Library",
      "comment": "The plot twist at the end was completely unexpected. Brilliant!",
      "rating": 5,
      "createdAt": "2026-03-21T05:15:00Z",
      "timeAgo": "5h ago",
      "helpful": 18,
      "status": "published"
    },
    {
      "id": 458,
      "userId": 125,
      "userName": "Emma W.",
      "userInitial": "E",
      "userAvatar": "https://ui-avatars.com/api/?name=Emma+W",
      "bookId": 2,
      "bookTitle": "Project Hail Mary",
      "comment": "Could use more descriptive language in the opening scene.",
      "rating": 4,
      "createdAt": "2026-03-20T14:45:00Z",
      "timeAgo": "1d ago",
      "helpful": 12,
      "status": "published"
    }
  ],
  "summary": {
    "totalFeedback": 1240,
    "averageRating": 4.7,
    "newFeedbackCount": 23
  }
}
```

**Field Definitions:**
- `userInitial` - First letter of user's first name (for avatar display)
- `timeAgo` - Human-readable relative time (e.g., "2h ago", "1d ago")
- `status` - `"published"` | `"pending"` | `"rejected"`
- `helpful` - Number of users who found the feedback helpful

---

### Reader Demographics

#### Get Reader Demographics
```
GET /api/author/dashboard/demographics
Authorization: Bearer <token>
```

**Description:** Retrieve reader demographic data (age distribution and geographic distribution).

**Response: 200 OK**
```json
{
  "data": {
    "ageDistribution": [
      {
        "age": "18-24",
        "count": 400,
        "percentage": 20.5
      },
      {
        "age": "25-34",
        "count": 700,
        "percentage": 35.9
      },
      {
        "age": "35-44",
        "count": 550,
        "percentage": 28.2
      },
      {
        "age": "45-54",
        "count": 300,
        "percentage": 15.4
      },
      {
        "age": "55+",
        "count": 200,
        "percentage": 10.3
      }
    ],
    "topRegions": [
      {
        "country": "United States",
        "code": "US",
        "count": 45000,
        "percentage": 45.0,
        "color": "bg-accent"
      },
      {
        "country": "United Kingdom",
        "code": "GB",
        "count": 22000,
        "percentage": 22.0,
        "color": "bg-primary"
      },
      {
        "country": "Canada",
        "code": "CA",
        "count": 15000,
        "percentage": 15.0,
        "color": "bg-slate-600"
      },
      {
        "country": "Australia",
        "code": "AU",
        "count": 10000,
        "percentage": 10.0,
        "color": "bg-slate-700"
      }
    ]
  },
  "summary": {
    "totalReaders": 100000,
    "topCountries": 4,
    "topAgeGroup": "25-34"
  }
}
```

**Visualization Notes:**
- `age` field format: "{min}-{max}" or "{min}+"
- `percentage` should sum to 100%
- `color` is optional (frontend can assign its own)
- Include top 4-5 regions only; others can be grouped as "Other"

---

## Data Models

### Author User Profile
```json
{
  "id": number,
  "firstName": string,
  "lastName": string,
  "email": string,
  "avatarUrl": string (nullable),
  "bio": string,
  "totalBooks": number,
  "totalReaders": number,
  "joinedAt": datetime,
  "verificationStatus": "verified" | "pending" | "unverified"
}
```

### Book
```json
{
  "id": number,
  "title": string,
  "author": string,
  "coverImage": string (URL),
  "description": string,
  "category": string,
  "status": "approved" | "pending" | "rejected",
  "sales": number,
  "revenue": number,
  "reads": number,
  "rating": number (0-5),
  "readers": number,
  "publishedDate": datetime,
  "createdAt": datetime,
  "updatedAt": datetime
}
```

### Feedback/Review
```json
{
  "id": number,
  "userId": number,
  "userName": string,
  "userEmail": string,
  "bookId": number,
  "bookTitle": string,
  "rating": number (1-5),
  "comment": string,
  "helpful": number,
  "status": "published" | "pending" | "rejected",
  "createdAt": datetime,
  "updatedAt": datetime
}
```

### Performance Metric
```json
{
  "period": string (e.g., "2026-01"),
  "month": string (e.g., "Jan"),
  "sales": number,
  "reads": number,
  "revenue": number,
  "currency": string
}
```

---

## Error Handling

All endpoints should follow this error response format:

### 400 Bad Request
```json
{
  "status": 400,
  "message": "Invalid request parameters",
  "errors": {
    "timeRange": ["Invalid time range. Must be one of: 30d, 90d, 1y"],
    "limit": ["Limit must be a positive integer"]
  }
}
```

### 401 Unauthorized
```json
{
  "status": 401,
  "message": "Unauthenticated",
  "errors": {
    "auth": ["Invalid or expired token"]
  }
}
```

### 403 Forbidden
```json
{
  "status": 403,
  "message": "Forbidden",
  "errors": {
    "permission": ["You do not have permission to access this resource"]
  }
}
```

### 404 Not Found
```json
{
  "status": 404,
  "message": "Resource not found",
  "errors": {
    "resource": ["The requested dashboard or book was not found"]
  }
}
```

### 500 Server Error
```json
{
  "status": 500,
  "message": "Internal server error",
  "errors": {
    "server": ["An unexpected error occurred. Please try again later."]
  }
}
```

---

## Response Examples

### Complete Dashboard Load Sequence

#### Step 1: Fetch Summary Stats
```bash
curl -X GET "https://api.example.com/api/author/dashboard/stats?timeRange=30d" \
  -H "Authorization: Bearer token123"
```

#### Step 2: Fetch Performance Data
```bash
curl -X GET "https://api.example.com/api/author/dashboard/performance?months=7" \
  -H "Authorization: Bearer token123"
```

#### Step 3: Fetch Top Books
```bash
curl -X GET "https://api.example.com/api/author/dashboard/top-books?limit=4&orderBy=sales" \
  -H "Authorization: Bearer token123"
```

#### Step 4: Fetch Recent Feedback
```bash
curl -X GET "https://api.example.com/api/author/dashboard/feedback?limit=3&status=published&sortBy=recent" \
  -H "Authorization: Bearer token123"
```

#### Step 5: Fetch Demographics
```bash
curl -X GET "https://api.example.com/api/author/dashboard/demographics" \
  -H "Authorization: Bearer token123"
```

---

## Performance & Caching

### Recommended Caching Strategy

| Endpoint | TTL | Rationale |
|----------|-----|-----------|
| `/dashboard/stats` | 5 minutes | Near real-time metrics |
| `/dashboard/performance` | 15 minutes | Historical data, less volatile |
| `/dashboard/top-books` | 10 minutes | Can change with new sales |
| `/dashboard/feedback` | 5 minutes | Should show recent feedback |
| `/dashboard/demographics` | 1 hour | Relatively stable data |

### Database Indexes

Ensure these indexes exist for optimal query performance:

```sql
-- For dashboard stats queries
CREATE INDEX idx_sales_author_date ON sales(author_id, created_at);
CREATE INDEX idx_reads_author_date ON book_reads(author_id, created_at);

-- For feedback queries
CREATE INDEX idx_reviews_author_date ON reviews(author_id, created_at);
CREATE INDEX idx_reviews_published ON reviews(author_id, status, created_at);

-- For demographics
CREATE INDEX idx_readers_country ON reader_profiles(country);
CREATE INDEX idx_readers_age ON reader_profiles(age_group);
```

### Query Optimization Tips

1. **Aggregate data during off-peak hours** - Use background jobs to pre-calculate monthly metrics
2. **Use database aggregations** - Calculate SUM, COUNT, AVG in database, not application code
3. **Limit result sets** - Default 3-4 books in "top books", 3 feedback items
4. **Implement pagination** - For larger datasets
5. **Cache API responses** - Use Redis or similar for calculated metrics

### Sample Query (Laravel/PHP)

```php
// Get dashboard stats
$stats = [
    'totalSales' => Sale::where('author_id', auth()->id())
        ->where('created_at', '>=', now()->subDays(30))
        ->sum('amount'),
    'activeReaders' => User::whereHas('bookReads', function($q) {
            $q->where('author_id', auth()->id())
              ->where('created_at', '>=', now()->subDays(30));
        })->distinct('id')->count(),
    'totalReads' => BookRead::where('author_id', auth()->id())
        ->where('created_at', '>=', now()->subDays(30))
        ->count(),
    'averageRating' => Review::where('author_id', auth()->id())
        ->avg('rating')
];
```

---

## Implementation Guide

### Step 1: Set Up Authentication

Verify the user is authenticated and owns the requested data:

```php
// Middleware to verify author
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/author/dashboard/*', 'DashboardController@*');
});
```

### Step 2: Implement Stats Endpoint

```php
public function getStats(Request $request)
{
    $timeRange = $request->get('timeRange', '30d');
    
    $window = match($timeRange) {
        '90d' => now()->subDays(90),
        '1y'  => now()->subYear(),
        default => now()->subDays(30),
    };
    
    $authorId = auth()->id();
    
    return response()->json([
        'data' => [
            'totalSales' => [
                'value' => Sale::where('author_id', $authorId)
                    ->where('created_at', '>=', $window)
                    ->sum('amount'),
                'currency' => 'USD',
                'change' => $this->calculateChange(...),
                'changeType' => 'positive'
            ],
            // ... other stats
        ],
        'period' => $timeRange,
        'generatedAt' => now()->toIso8601String()
    ]);
}
```

### Step 3: Implement Performance Chart Endpoint

```php
public function getPerformance(Request $request)
{
    $months = $request->get('months', 7);
    $authorId = auth()->id();
    
    $data = DB::table('sales')
        ->select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('DATE_FORMAT(created_at, "%b") as name'),
            DB::raw('COUNT(*) as sales'),
            DB::raw('SUM(amount) as revenue')
        )
        ->where('author_id', $authorId)
        ->where('created_at', '>=', now()->subMonths($months))
        ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
        ->orderBy('month')
        ->get();
    
    return response()->json(['data' => $data]);
}
```

### Step 4: Test All Endpoints

```bash
# Test stats
curl -X GET "http://localhost:8000/api/author/dashboard/stats" \
  -H "Authorization: Bearer your_token"

# Test response times
time curl -X GET "http://localhost:8000/api/author/dashboard/performance"
```

---

## Frontend Integration Notes

The frontend expects:
1. **Numeric values** - Send numbers not strings (e.g., `4000` not `"4000"`)
2. **Consistent naming** - Follow the exact field names in response examples
3. **Timezone-aware timestamps** - Use ISO 8601 format (e.g., `2026-03-21T10:30:00Z`)
4. **Sorted data** - Return data sorted (top books by sales, feedback by date)
5. **Growth indicators** - Include both `value` and `changeType` for trend arrows

---

## Testing Checklist

- [ ] All endpoints require authentication
- [ ] Stats calculate correctly for different time ranges
- [ ] Performance chart has at least 7 data points
- [ ] Top books returns only approved books
- [ ] Feedback displays published reviews only
- [ ] Demographics percentages sum to 100%
- [ ] Timestamps are ISO 8601 format
- [ ] Numeric values are numbers, not strings
- [ ] Error responses include proper HTTP status codes
- [ ] Response times < 500ms (with caching)
- [ ] Avatar URLs are valid and accessible
- [ ] All required fields populate in responses

---

## Deployment Checklist

- [ ] Set appropriate cache TTLs based on data volatility
- [ ] Create required database indexes
- [ ] Implement rate limiting on dashboard endpoints
- [ ] Set up monitoring/alerts for slow endpoints
- [ ] Document any environment-specific configurations
- [ ] Test with realistic data volumes
- [ ] Verify CORS headers if using separate domains
- [ ] Set up automated backups for analytics data
- [ ] Document any custom business logic
- [ ] Create admin endpoint for cache invalidation

---

## Support & Troubleshooting

### Common Issues

**Issue:** Dashboard shows cached data from yesterday
**Solution:** Reduce cache TTL or implement real-time cache invalidation when data changes

**Issue:** Performance chart has gaps in data
**Solution:** Ensure all months have results, even if count is 0

**Issue:** Average rating shows as null
**Solution:** Handle case where book has no reviews (return 0, N/A, or null explicitly)

**Issue:** Large numbers display incorrectly (e.g., 1200000 as 1.2M)
**Solution:** Format numbers in frontend using JavaScript localization or return pre-formatted strings

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-21 | Initial API specification |

---

## Contact & References

For questions or clarifications:
- Backend Team Lead: [contact info]
- Frontend Team Lead: [contact info]
- API Documentation: [link]

## Related Documentation

- [Admin Dashboard API Guide](./dashboard-backend-guide.md)
- [User Activity API Guide](./user-reading-activity-backend.md)
- [Books API Guide](./books-backend-guide.md)
- [Authentication Guide](./login-troubleshooting.md)
