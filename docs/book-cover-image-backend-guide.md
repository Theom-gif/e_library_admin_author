# Uploaded Book Cover Image Backend Guide

This guide explains what the backend must return so uploaded book cover images display correctly in:

- Author `My Books`
- Admin `Books`
- Admin `Approvals`

The current frontend already supports several cover field names. The backend does not need a new endpoint. It only needs to return a correct public image URL or a correct storage path.

## Problem Summary

Broken cover images usually happen when the backend stores or returns one of these invalid values:

- local filesystem paths such as `C:\...`
- internal Laravel paths such as `storage/app/public/covers/book.jpg`
- private paths such as `public/covers/book.jpg` without a public URL
- URLs pointing to the wrong host or wrong `/api` prefix

The frontend expects a public asset URL, not an internal server path.

## Endpoints Involved

### Upload endpoint

```http
POST /api/auth/book
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Expected uploaded cover file field:

```txt
cover_image
```

Optional alternative field already supported by frontend:

```txt
cover_image_url
```

### Author list endpoint

```http
GET /api/auth/books
Authorization: Bearer <token>
```

### Admin list endpoints

```http
GET /api/admin/books
Authorization: Bearer <token>

GET /api/admin/books/pending
Authorization: Bearer <token>
```

## Recommended Response Contract

The safest backend response is:

```json
{
  "id": 101,
  "title": "Clean Architecture",
  "author": "Robert C. Martin",
  "status": "Pending",
  "category": "Technology",
  "cover_image_url": "https://your-domain.com/storage/covers/clean-architecture.jpg"
}
```

This is also acceptable:

```json
{
  "id": 101,
  "title": "Clean Architecture",
  "author": "Robert C. Martin",
  "status": "Pending",
  "category": "Technology",
  "cover_image_url": "/storage/covers/clean-architecture.jpg"
}
```

This is also acceptable:

```json
{
  "id": 101,
  "title": "Clean Architecture",
  "author": "Robert C. Martin",
  "status": "Pending",
  "category": "Technology",
  "cover_image_path": "covers/clean-architecture.jpg"
}
```

## Cover Fields the Frontend Reads

The frontend already checks these fields in this order:

- `cover_view_url`
- `cover_api_url`
- `cover_image_url`
- `cover_image_path`
- `cover`
- `image`
- `thumbnail`

If possible, standardize on only one field:

```txt
cover_image_url
```

That will keep the backend cleaner.

## What the Backend Should Return

### Best option

Return a fully qualified public URL:

```txt
https://your-domain.com/storage/covers/book.jpg
```

### Good option

Return a root-relative public URL:

```txt
/storage/covers/book.jpg
```

### Also supported

Return only the storage-relative path:

```txt
covers/book.jpg
```

## What the Backend Should Not Return

Do not return these as the main image value:

```txt
storage/app/public/covers/book.jpg
public/covers/book.jpg
C:\xampp\htdocs\project\storage\app\public\covers\book.jpg
/var/www/project/storage/app/public/covers/book.jpg
```

Those are internal server paths, not browser image URLs.

## Laravel Example

### Store uploaded file

```php
$path = $request->file('cover_image')->store('covers', 'public');
```

This produces a value like:

```txt
covers/book.jpg
```

### Save to database

Recommended:

```php
$book->cover_image_path = $path;
```

Optional:

```php
$book->cover_image_url = asset('storage/' . $path);
```

### Return in API resource

Recommended API resource output:

```php
return [
    'id' => $book->id,
    'title' => $book->title,
    'author' => $book->author,
    'status' => $book->status,
    'category' => $book->category,
    'cover_image_path' => $book->cover_image_path,
    'cover_image_url' => $book->cover_image_path
        ? asset('storage/' . ltrim($book->cover_image_path, '/'))
        : null,
];
```

## Required Public Storage Setup

For Laravel, make sure uploaded covers are publicly accessible:

```bash
php artisan storage:link
```

The web server must serve:

```txt
<domain>/storage/...
```

If `https://your-domain.com/storage/covers/book.jpg` does not open directly in the browser, the frontend will show a broken image.

## Nginx / Apache Requirement

The `/storage/` folder must be publicly reachable.

Examples:

- `https://your-domain.com/storage/covers/book.jpg` must return `200 OK`
- content type should be a valid image type such as `image/jpeg`, `image/png`, or `image/webp`

## Upload Success Response Example

After `POST /api/auth/book`, the backend should ideally return the new book with a working cover field:

```json
{
  "message": "Book uploaded successfully",
  "data": {
    "id": 101,
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "status": "Pending",
    "category": "Technology",
    "cover_image_path": "covers/clean-architecture.jpg",
    "cover_image_url": "https://your-domain.com/storage/covers/clean-architecture.jpg"
  }
}
```

## List Response Example

### `GET /api/auth/books`

```json
{
  "data": [
    {
      "id": 101,
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "status": "Approved",
      "category": "Technology",
      "cover_image_url": "https://your-domain.com/storage/covers/clean-architecture.jpg"
    }
  ]
}
```

### `GET /api/admin/books`

```json
{
  "data": [
    {
      "id": 101,
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "status": "Pending",
      "category": "Technology",
      "cover_image_url": "https://your-domain.com/storage/covers/clean-architecture.jpg"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 1
  }
}
```

## Backend Checklist

- [ ] Save uploaded cover files to public storage
- [ ] Expose the `/storage/...` URL publicly
- [ ] Return `cover_image_url` or `cover_image_path` in book responses
- [ ] Do not return internal filesystem paths as image URLs
- [ ] Ensure uploaded image URL opens directly in browser
- [ ] Ensure Author and Admin book-list endpoints both include the cover field
- [ ] Ensure newly uploaded books return the same cover field shape as fetched books

## Quick Test

After uploading a book with a cover image:

1. Read the API response from `POST /api/auth/book`
2. Copy the returned `cover_image_url`
3. Open it directly in a browser
4. Confirm it shows the image
5. Call `GET /api/auth/books`
6. Confirm the same book includes a valid cover field
7. Call `GET /api/admin/books`
8. Confirm the same book includes a valid cover field there too

If step 3 fails, the issue is backend storage or web-server exposure, not the dashboard UI.
