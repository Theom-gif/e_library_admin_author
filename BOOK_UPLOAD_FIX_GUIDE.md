# Book Upload Database-Interface Sync Fix Guide

## Problem Summary
When you upload books, they store in the database but the interface can't retrieve them. Error message:
```
Column not found: 1054 Unknown column 'author_id' in 'where clause'
```

Your database uses `author_name` and `user_id`, but the backend code is querying for `author_id` which doesn't exist.

---

## ✅ Frontend Fixes Applied

All frontend code fixes have been completed:

### 1. **bookService.js** - Fixed field mapping
- Updated `mapApiBookToUiBook()` to correctly map database columns:
  - `author_name` → UI author field (primary, with fallback to `author`)
  - `pdf_path` → Manuscript URL
  - `pdf_mime_type` → Manuscript type detection
  - `cover_image` → Cover resolution

### 2. **Upload Payload** - Already Correct ✅
Your upload form already sends the right data:
```javascript
FormData {
  title: string,
  author: string,          // Backend stores as author_name
  category: string,        // Stored as category_id relationship
  description: string,
  cover_image: file,       // Optional image upload
  book_file: file          // Required PDF
}
```

### 3. **Local Storage** - Already Correct ✅
Drafts are saved locally and display while backend is offline.

---

## ❌ Backend Fixes Needed (CRITICAL)

### Issue: BookController.php Query Bug

**File**: `app/Http/Controllers/BookController.php` (or similar)
**Method**: `index()` or `list()` for GET /api/auth/books

**Current broken code** (APPROXIMATELY):
```php
// ❌ WRONG - author_id doesn't exist
public function index(Request $request)
{
    $userId = auth()->id();
    $books = Book::where('author_id', $userId)
        ->orWhere('user_id', $userId)
        ->get();
    return $books;
}
```

**Fixed code** should be:
```php
// ✅ CORRECT
public function index(Request $request)
{
    $userId = auth()->id();
    $books = Book::where('user_id', $userId)
        ->where('deleted_at', null)
        ->orderBy('id', 'desc')
        ->get();
    
    return response()->json(['data' => $books]);
}
```

### Database Schema Confirmation
Your **books** table has these columns:
```
id                  | int
user_id             | int (author who created)
category_id         | int
title               | string
slug                | string
description         | text
author_name         | string (the book's listed author, NOT user_id)
pdf_path            | string
original_pdf_name   | string
pdf_mime_type       | string
cover_image         | string (path or filename)
status              | string (Pending/Approved/Rejected)
approved_by         | int (admin who approved)
```

**Remove these incorrect queries/references**:
- ❌ `where('author_id', ...)`
- ❌ `where('authorId', ...)`
- Any query field that doesn't match the table schema above

### Response Format

Ensure GET /api/auth/books returns this structure:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Book Title",
      "author_name": "Author Name",
      "category": "Technology",
      "description": "...",
      "pdf_path": "storage/books/file.pdf",
      "pdf_mime_type": "application/pdf",
      "cover_image": "storage/covers/book.jpg",
      "status": "Pending",
      "user_id": 7,
      "created_at": "2026-03-29T10:00:00Z"
    }
  ]
}
```

---

## 🔍 How to Find & Fix the Backend

### Step 1: Locate the file
```bash
# In your Laravel backend project
find app/Http/Controllers -name "*Book*"
find app -name "*.php" -type f -exec grep -l "author_id.*where" {} \;
```

### Step 2: Search for the bug
Look for these patterns and DELETE/FIX them:
```php
// ❌ WRONG - remove this
->where('author_id', ...)
->where('authorId', ...)
->where('Author.id', ...)

// ✅ CORRECT - use this
->where('user_id', auth()->id())
```

### Step 3: Check your model
File: `app/Models/Book.php`
```php
class Book extends Model
{
    // Make sure these relationships exist:
    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    public function category() {
        return $this->belongsTo(Category::class, 'category_id');
    }
    
    // These columns should be queryable:
    protected $fillable = [
        'title',
        'author_name',  // NOT author_id
        'description',
        'category_id',
        'user_id',
        'pdf_path',
        'cover_image',
        'status',
        'slug'
    ];
}
```

---

## ✅ Testing Checklist

Once you fix the backend, test this flow:

### 1. Upload a book
- [ ] Go to Author → Upload New Book
- [ ] Fill in: Title, Author Name, Category, Description
- [ ] Upload: Cover image (JPG/PNG), PDF file
- [ ] Click "Submit"
- [ ] Should succeed and redirect to My Books

### 2. Verify database
Open MySQL/database client:
```sql
SELECT id, title, author_name, pdf_path, cover_image, status 
FROM books 
WHERE user_id = 7 
ORDER BY id DESC LIMIT 1;
```
Should show all fields populated correctly.

### 3. Check API response
Browser DevTools → Network → GET `/api/auth/books`
Response should show your uploaded book with all fields.

### 4. Verify UI display
- [ ] Book appears in "My Books" page
- [ ] Cover image displays (not placeholder)
- [ ] Title matches what you entered
- [ ] Author name matches what you entered
- [ ] Category/Genre shows correctly
- [ ] Can click to view details
- [ ] Can edit or delete

### 5. Verify same data everywhere
Compare what you see:
- **Upload form**: What you typed
- **Database**: Direct SQL query result
- **API response**: GET /api/auth/books JSON
- **My Books page**: Displayed in interface

All 4 should match exactly.

---

## 📞 Need Help?

If the fix doesn't work:

1. **Check Laravel logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Enable query logging** (temporary, in .env or code):
   ```php
   DB::enableQueryLog();
   // ... run query ...
   dd(DB::getQueryLog());
   ```

3. **Verify migrations**
   ```bash
   php artisan migrate:status
   ```

4. **Reset if needed**
   ```bash
   php artisan migrate:refresh
   php artisan db:seed
   ```

---

**Frontend code is now fixed. Once you fix the backend, everything should sync perfectly!** ✨
