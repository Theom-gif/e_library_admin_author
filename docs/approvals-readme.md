# Approvals Page – Backend Endpoint Guide

This page documents what the admin **Approvals** screen needs from the backend so engineers can build/align APIs quickly.

## What the UI shows
- Badges with counts for `Pending`, `Approved`, and `Rejected` submissions.
- Filter bar: free-text search, status filter (`Pending | Approved | Rejected | All`), category filter (`All` + category list from server).
- Pending submissions table with columns: Title (with cover thumbnail + `id`), Author, Category, Submitted date label, Status pill, Actions (Preview, Approve, Reject).
- Action buttons are only enabled when `status === "Pending"`.

## Data shape expected for each book
| field | type | notes |
| --- | --- | --- |
| id | number | unique book id |
| title | string | |
| author | string | |
| category | string | matches category filter labels |
| status | "Pending" \| "Approved" \| "Rejected" | drives pills and button enabled state |
| date | string | short label shown in table (e.g., `"Feb 2026"` or `"2026-02-10"`) |
| cover_image_path \| cover | string | relative path under `/storage/` or full URL; front-end will map to `cover` |
| description | string | for Preview/detail (future) |
| book_file_path | string | for Preview/download (future) |

## Required endpoints
Use base URL from `VITE_API_BASE_URL` and `Authorization: Bearer <token>` when available.

1) **List submissions**
   - `GET /admin/books`
   - Query params:
     - `status` → `Pending | Approved | Rejected | All` (default: `Pending`).
     - `category` → exact match to category name; `"All"` returns all categories.
     - `search` → free text across title/author/category.
   - Response: `{ data: Book[] }` where `Book` matches the schema above.

2) **Approve a submission**
   - `POST /admin/books/{id}/approve`
   - Body: none.
   - Response: updated `Book` object with `status: "Approved"` and updated `date` if backend records action time.

3) **Reject a submission**
   - `POST /admin/books/{id}/reject`
   - Body: optional `{ reason: string }` (frontend can add later).
   - Response: updated `Book` with `status: "Rejected"`.

4) **Lookup counts (optional)**
   - To keep top badges in sync without fetching the full table, backend may expose:
     - `GET /admin/books/counts` → `{ pending: number, approved: number, rejected: number }`
   - If not provided, counts can be derived from the list response—just ensure the list endpoint supports pagination-free mode or returns totals.

## Category source
- UI builds category filter from `["All", ...categories]`.
- Provide categories via one of:
  - `GET /admin/categories` → `{ data: [{ name: "History" }, ...] }`, or
  - Embed categories in a config endpoint already used elsewhere.

## Status & transition rules
- Only `Pending` items are actionable; backend should enforce the same rule (reject repeat approvals).
- Consider idempotency: approving an already approved item returns 200 with unchanged book or 409 conflict; document chosen behavior.

## Error handling expectations
- Return structured errors `{ message: string, errors?: Record<string,string[]> }`.
- Typical codes: 400 invalid params, 401/403 auth, 404 not found, 409 invalid transition, 500 server error.

## Sample payloads
```json
GET /admin/books?status=Pending&category=History&search=egypt
200 OK
{
  "data": [
    {
      "id": 42,
      "title": "Ancient Egypt",
      "author": "Jane Smith",
      "category": "History",
      "status": "Pending",
      "date": "Feb 2026",
      "cover_image_path": "covers/egypt.jpg"
    }
  ]
}
```

```json
POST /admin/books/42/approve
200 OK
{
  "id": 42,
  "status": "Approved",
  "date": "2026-03-13T10:05:00Z"
}
```

## Frontend integration notes
- Frontend currently uses mock data; replace with real API calls wired to endpoints above.
- Cover URLs: if a relative path is returned, client will prepend `${API_BASE_URL}/storage/`.
- Internationalization: all labels use the `t()` function; payload values (`status`, `category`) should remain English keys.
- Buttons disable state should be derivable from `status`; avoid side effects that leave stale status.

## Backend to-do checklist
- [ ] Implement/confirm `GET /admin/books` with `status`, `category`, and `search` filters.
- [ ] Implement/confirm `POST /admin/books/{id}/approve`.
- [ ] Implement/confirm `POST /admin/books/{id}/reject`.
- [ ] Optional: `GET /admin/books/counts`.
- [ ] Optional: `GET /admin/categories`.
- [ ] Return Book objects with fields listed above and consistent status strings.
