# Author Management Backend Example

This folder contains a standalone Node.js + Express + MySQL implementation for the admin author management feature.

## Folder Structure

```text
backend-examples/author-management-express
|-- database/
|   `-- schema.sql
|-- src/
|   |-- controllers/
|   |   `-- authors.controller.js
|   |-- db/
|   |   `-- pool.js
|   |-- middleware/
|   |   `-- upload.js
|   |-- routes/
|   |   `-- authors.routes.js
|   `-- server.js
|-- .env.example
`-- package.json
```

## Step-by-Step Setup

1. Copy `.env.example` to `.env` and update the MySQL credentials.
2. Run the SQL in `database/schema.sql`.
3. Install dependencies with `npm install`.
4. Start the API with `npm run dev`.
5. Point the React app at this API by setting `VITE_API_BASE_URL=http://localhost:4000`.
6. Optionally set `VITE_AUTHOR_API_PREFIX=/authors` in the frontend `.env`.

## API Endpoints

- `GET /authors` returns all authors as JSON.
- `POST /authors` creates an author and accepts `multipart/form-data`.

### POST /authors form fields

- `name` required
- `email` required and unique
- `password` required and minimum 8 characters
- `bio` optional
- `profile_image` optional image file

## Sample Success Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "bio": "Science author",
    "profile_image": "uploads/authors/1710000000-jane.png",
    "profile_image_url": "http://localhost:4000/uploads/authors/1710000000-jane.png",
    "is_active": true,
    "created_at": "2026-03-31T10:00:00.000Z"
  },
  "message": "Author created successfully."
}
```
