# Book Cover Images - Backend README

## Purpose
This document defines how the backend should store and return book cover images so the frontend can render them reliably.

## Summary (What the Frontend Needs)
The frontend expects a **public image URL** or a **storage-relative path** that can be converted to a public URL.

Return **one** of these:
- `cover_image_url`: full or root-relative public URL
- `cover_image_path`: storage-relative path (e.g. `covers/book.jpg`)

Do **not** return internal filesystem paths.

## Upload Endpoint (Author)
```
POST /api/auth/book
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Fields:
- `cover_image` (file) - image file (png/jpg), recommended max 5MB
- `title`, `author`, `category`, `description`, `book_file`, etc.

## List Endpoint (Author)
```
GET /api/auth/books
Authorization: Bearer <token>
```

Each item should include either:
- `cover_image_url` (recommended), or
- `cover_image_path`

## Recommended Storage (Laravel Example)
```php
$path = $request->file('cover_image')->store('covers', 'public');
$book->cover_image_path = $path;
$book->cover_image_url = asset('storage/' . ltrim($path, '/'));
```

## Valid Response Formats
Best (full URL):
```
cover_image_url: "https://your-domain.com/storage/covers/clean-architecture.jpg"
```

Also valid (root-relative):
```
cover_image_url: "/storage/covers/clean-architecture.jpg"
```

Also valid (path only):
```
cover_image_path: "covers/clean-architecture.jpg"
```

## Invalid Values (Do Not Return)
These **will not render** in the browser:
```
storage/app/public/covers/book.jpg
public/covers/book.jpg
C:\xampp\htdocs\project\storage\app\public\covers\book.jpg
/var/www/project/storage/app/public/covers/book.jpg
```

## Frontend Field Mapping (Supported Keys)
The frontend checks cover fields in this order:
- `cover_view_url`
- `cover_api_url`
- `cover_image_url`
- `cover_image_path`
- `cover_image`
- `coverImage`
- `cover_url`
- `coverUrl`
- `image_url`
- `imageUrl`
- `image_path`
- `imagePath`
- `cover`
- `image`
- `thumbnail`

To avoid ambiguity, standardize on:
```
cover_image_url
```

## Common Causes of Missing Covers
1. Storage link not created (`php artisan storage:link`)
2. Backend returns internal paths instead of public URLs
3. Domain mismatch (wrong host in `APP_URL` or `VITE_API_BASE_URL`)
4. File saved, but cover field not returned in API response

## Checklist
- [ ] Store cover file under `storage/app/public/covers`
- [ ] Ensure `storage:link` is enabled
- [ ] Return `cover_image_url` or `cover_image_path` on all book list endpoints
- [ ] Ensure the public URL is accessible in the browser

