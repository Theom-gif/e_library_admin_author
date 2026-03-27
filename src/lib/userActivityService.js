import { apiClient } from "./apiClient";

/**
 * User Activity & Reading Statistics Service
 * Handles tracking and retrieving user reading activity and statistics
 */

// ============================================================================
// User Reading Activity Tracking
// ============================================================================

/**
 * Record when a user starts/finishes reading a book
 * @param {number} bookId - Book ID
 * @param {object} options - Additional options
 * @param {string} options.status - 'started' | 'completed' | 'paused'
 * @param {number} options.progress - Progress percentage (0-100)
 * @param {object} config - Axios config (signal, etc)
 * @returns {Promise<object>} Created book read record
 */
export const recordBookRead = async (bookId, options = {}, config = {}) => {
  const payload = {
    book_id: bookId,
    status: options.status || "completed",
    progress: Number(options.progress) || 100,
  };

  const response = await apiClient.post("/user/books/read", payload, config);
  return response?.data || {};
};

/**
 * Update a book read record progress
 * @param {number} readId - Book read record ID
 * @param {number} progress - Progress percentage (0-100)
 * @param {object} config - Axios config
 * @returns {Promise<object>} Updated book read record
 */
export const updateBookReadProgress = async (readId, progress = 100, config = {}) => {
  const payload = { progress: Math.min(100, Math.max(0, Number(progress))) };
  const response = await apiClient.patch(`/user/books/read/${readId}`, payload, config);
  return response?.data || {};
};

/**
 * Mark a book as read
 * @param {number} bookId - Book ID
 * @param {object} config - Axios config
 * @returns {Promise<object>} Book read record
 */
export const markBookAsRead = async (bookId, config = {}) => {
  return recordBookRead(bookId, { status: "completed", progress: 100 }, config);
};

/**
 * Mark a book as paused
 * @param {number} bookId - Book ID
 * @param {number} progress - Progress percentage
 * @param {object} config - Axios config
 * @returns {Promise<object>} Book read record
 */
export const pauseBook = async (bookId, progress = 50, config = {}) => {
  return recordBookRead(bookId, { status: "paused", progress }, config);
};

/**
 * Start a reading session.
 * Maps to POST /api/reading/start
 * @param {object} payload - Backend-defined reading start payload
 * @param {object} config - Axios config
 * @returns {Promise<object>} API response payload
 */
export const startReading = async (payload = {}, config = {}) => {
  const response = await apiClient.post("/reading/start", payload, config);
  return response?.data || {};
};

/**
 * Finish a reading session.
 * Maps to POST /api/reading/finish
 * @param {object} payload - Backend-defined reading finish payload
 * @param {object} config - Axios config
 * @returns {Promise<object>} API response payload
 */
export const finishReading = async (payload = {}, config = {}) => {
  const response = await apiClient.post("/reading/finish", payload, config);
  return response?.data || {};
};

/**
 * Get current user's notifications.
 * Maps to GET /api/user/notifications
 * @param {object} config - Axios config
 * @returns {Promise<array|object>} Notification payload
 */
export const getUserNotifications = async (config = {}) => {
  const response = await apiClient.get("/user/notifications", config);
  const payload = response?.data;

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return payload || {};
};

/**
 * Mark a user notification as read.
 * Maps to POST /api/user/notifications/{id}/read
 * @param {string|number} id - Notification ID
 * @param {object} payload - Optional backend-defined payload
 * @param {object} config - Axios config
 * @returns {Promise<object>} API response payload
 */
export const markUserNotificationAsRead = async (id, payload = {}, config = {}) => {
  const response = await apiClient.post(`/user/notifications/${id}/read`, payload, config);
  return response?.data || {};
};

// ============================================================================
// User Reading Statistics
// ============================================================================

/**
 * Get current user's reading statistics
 * @param {object} config - Axios config
 * @returns {Promise<object>} User statistics with reading counts and trends
 *
 * Expected response:
 * {
 *   "totalBooksRead": 45,
 *   "booksReadThisMonth": 8,
 *   "booksReadThisWeek": 2,
 *   "currentlyReading": 3,
 *   "trend": 5,
 *   "averageReadingTime": "2.5 hours",
 *   "longestStreak": 15
 * }
 */
export const getUserReadingStats = async (config = {}) => {
  const response = await apiClient.get("/user/reading-stats", config);
  return response?.data || {};
};

/**
 * Get current user's list of books they've read
 * @param {object} filters - Filter options
 * @param {string} filters.status - 'completed' | 'reading' | 'paused' | 'all'
 * @param {number} filters.limit - Number of results (default: 50)
 * @param {number} filters.page - Page number (default: 1)
 * @param {object} config - Axios config
 * @returns {Promise<object>} List of books read with metadata
 *
 * Expected response:
 * {
 *   "data": [
 *     {
 *       "id": 123,
 *       "book": { "id": 1, "title": "...", "author": "..." },
 *       "status": "completed",
 *       "progress": 100,
 *       "startedAt": "2026-03-01T10:00:00Z",
 *       "completedAt": "2026-03-15T15:30:00Z",
 *       "readingTime": "12.5 hours"
 *     }
 *   ],
 *   "meta": { "total": 45, "page": 1, "perPage": 50 }
 * }
 */
export const getUserBooksRead = async (filters = {}, config = {}) => {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (Number.isFinite(filters.limit) && filters.limit > 0) {
    params.set("limit", String(filters.limit));
  }

  if (Number.isFinite(filters.page) && filters.page > 0) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();
  const response = await apiClient.get(
    `/user/books/read${query ? `?${query}` : ""}`,
    config
  );

  const payload = response?.data;
  return {
    data: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
    meta: payload?.meta || { total: 0, page: 1, perPage: 50 },
  };
};

/**
 * Get current user's currently reading list
 * @param {object} filters - Filter options
 * @param {number} filters.limit - Number of results (default: 10)
 * @param {object} config - Axios config
 * @returns {Promise<array>} List of books currently being read
 */
export const getUserCurrentlyReading = async (filters = {}, config = {}) => {
  const params = new URLSearchParams();

  if (Number.isFinite(filters.limit) && filters.limit > 0) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();
  const response = await apiClient.get(
    `/user/books/currently-reading${query ? `?${query}` : ""}`,
    config
  );

  return Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];
};

// ============================================================================
// User Profile & Reading Activity
// ============================================================================

/**
 * Get a specific user's public reading profile
 * @param {number} userId - User ID
 * @param {object} config - Axios config
 * @returns {Promise<object>} User profile with reading stats
 *
 * Expected response:
 * {
 *   "id": 123,
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john@example.com",
 *   "avatarUrl": "...",
 *   "totalBooksRead": 45,
 *   "booksReadThisMonth": 8,
 *   "booksReadThisWeek": 2,
 *   "joinedAt": "2025-01-15"
 * }
 */
export const getUserProfile = async (userId, config = {}) => {
  const response = await apiClient.get(`/users/${userId}`, config);
  return response?.data || {};
};

/**
 * Get a user's reading activity timeline
 * @param {number} userId - User ID
 * @param {object} filters - Filter options
 * @param {string} filters.timeRange - 'week' | 'month' | 'all' (default: 'month')
 * @param {number} filters.limit - Number of records (default: 20)
 * @param {object} config - Axios config
 * @returns {Promise<array>} User's reading activity events
 *
 * Expected response:
 * [
 *   {
 *     "id": 456,
 *     "book": { "id": 1, "title": "...", "author": "..." },
 *     "action": "completed" | "started" | "paused",
 *     "timestamp": "2026-03-20T14:30:00Z",
 *     "readingTime": "2.5 hours"
 *   }
 * ]
 */
export const getUserActivityTimeline = async (userId, filters = {}, config = {}) => {
  const params = new URLSearchParams();

  if (filters.timeRange) {
    params.set("timeRange", filters.timeRange);
  }

  if (Number.isFinite(filters.limit) && filters.limit > 0) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();
  const response = await apiClient.get(
    `/users/${userId}/reading-activity${query ? `?${query}` : ""}`,
    config
  );

  return Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];
};

// ============================================================================
// Top Readers & Leaderboard (Admin)
// ============================================================================

/**
 * Get top readers leaderboard (admin endpoint)
 * @param {object} filters - Filter options
 * @param {string} filters.range - 'all' | 'month' | 'week' (default: 'all')
 * @param {number} filters.limit - Number of results (default: 50)
 * @param {object} config - Axios config
 * @returns {Promise<object>} Top readers list with user data and book counts
 *
 * Expected response:
 * {
 *   "data": [
 *     {
 *       "user": {
 *         "id": 1,
 *         "first_name": "Olivia",
 *         "last_name": "Martinez",
 *         "email": "olivia@example.com",
 *         "avatar_url": "...",
 *         "created_at": "2025-03-01"
 *       },
 *       "booksRead": 187,
 *       "trend": 12
 *     }
 *   ],
 *   "meta": { "range": "all", "generated_at": "2026-03-20T10:15:00Z" }
 * }
 */
export const getTopReaders = async (filters = {}, config = {}) => {
  const params = new URLSearchParams();

  if (filters.range) {
    params.set("range", filters.range);
  }

  if (Number.isFinite(filters.limit) && filters.limit > 0) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();
  const response = await apiClient.get(
    `/admin/leaderboard/readers${query ? `?${query}` : ""}`,
    config
  );

  const payload = response?.data;
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta || { range: "all", generated_at: new Date().toISOString() },
  };
};

/**
 * Get user's rank in the leaderboard
 * @param {number} userId - User ID
 * @param {string} range - 'all' | 'month' | 'week' (default: 'all')
 * @param {object} config - Axios config
 * @returns {Promise<object>} User's rank and position in leaderboard
 *
 * Expected response:
 * {
 *   "userId": 123,
 *   "rank": 5,
 *   "booksRead": 187,
 *   "trend": 12,
 *   "percentile": 95
 * }
 */
export const getUserRank = async (userId, range = "all", config = {}) => {
  const params = new URLSearchParams();
  params.set("range", range);

  const response = await apiClient.get(
    `/admin/leaderboard/readers/rank/${userId}?${params.toString()}`,
    config
  );

  return response?.data || {};
};

// ============================================================================
// Books Read Analytics
// ============================================================================

/**
 * Get analytics for a specific book (how many users read it)
 * @param {number} bookId - Book ID
 * @param {object} config - Axios config
 * @returns {Promise<object>} Book reading analytics
 *
 * Expected response:
 * {
 *   "bookId": 1,
 *   "title": "...",
 *   "totalReaders": 124,
 *   "completionRate": 78,
 *   "averageReadingTime": "3.5 hours",
 *   "weeklyReads": 12,
 *   "monthlyReads": 45
 * }
 */
export const getBookReadAnalytics = async (bookId, config = {}) => {
  const response = await apiClient.get(
    `/books/${bookId}/read-analytics`,
    config
  );

  return response?.data || {};
};

/**
 * Get trending books based on reads
 * @param {object} filters - Filter options
 * @param {string} filters.timeRange - 'week' | 'month' | 'all' (default: 'week')
 * @param {number} filters.limit - Number of results (default: 10)
 * @param {object} config - Axios config
 * @returns {Promise<array>} List of trending books
 *
 * Expected response:
 * [
 *   {
 *     "bookId": 1,
 *     "title": "...",
 *     "author": "...",
 *     "totalReads": 156,
 *     "weeklyReads": 45,
 *     "trend": "up"
 *   }
 * ]
 */
export const getTrendingBooks = async (filters = {}, config = {}) => {
  const params = new URLSearchParams();

  if (filters.timeRange) {
    params.set("timeRange", filters.timeRange);
  }

  if (Number.isFinite(filters.limit) && filters.limit > 0) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();
  const response = await apiClient.get(
    `/books/trending${query ? `?${query}` : ""}`,
    config
  );

  return Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];
};
