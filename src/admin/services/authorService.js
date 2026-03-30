import { apiClient } from "../../lib/apiClient";

/**
 * Author Management API Service
 * 
 * Provides methods for all author-related API calls:
 * - Fetch authors list
 * - Create new author
 * - Get author details
 * - Update author
 * - Delete author
 * - Resend invitation email
 */

/**
 * Normalize author response from API
 */
export const normalizeAuthor = (author = {}) => ({
  id: author?.id ?? "",
  name: author?.name ?? "",
  email: author?.email ?? "",
  bio: author?.bio ?? "",
  profile_image: author?.profile_image ?? null,
  profile_image_url: author?.profile_image_url ?? null,
  is_active: author?.is_active ?? false,
  invitation_sent_at: author?.invitation_sent_at ?? null,
  invitation_accepted_at: author?.invitation_accepted_at ?? null,
  created_at: author?.created_at ?? null,
  updated_at: author?.updated_at ?? null,
});

/**
 * Fetch all authors with optional search and filtering
 * GET /api/admin/authors
 * 
 * @param {Object} filters - Filter options
 * @param {string} filters.search - Search by name or email
 * @param {string} filters.status - Filter by 'active' or 'pending'
 * @param {number} filters.page - Page number for pagination
 * @param {number} filters.per_page - Items per page
 * @param {Object} config - Additional axios config
 * @returns {Promise<{data: Array, meta: Object}>} Authors list with pagination
 */
export const fetchAuthors = async (filters = {}, config = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.page) {
      params.set("page", filters.page);
    }

    if (filters.per_page) {
      params.set("per_page", filters.per_page);
    }

    const query = params.toString();
    const url = `/api/admin/authors${query ? `?${query}` : ""}`;

    console.log(`[AuthorService] Fetching from: ${url}`);
    const response = await apiClient.get(url, config);
    const payload = response?.data;

    console.log("[AuthorService] fetchAuthors response:", payload);

    // Extract authors array from response
    const authors = (Array.isArray(payload?.data) && payload.data) ||
                    (Array.isArray(payload) && payload) ||
                    [];

    // Extract pagination metadata
    const paginationSource = payload?.meta || payload?.pagination || {};
    const meta = {
      page: paginationSource?.current_page ?? paginationSource?.page ?? 1,
      per_page: paginationSource?.per_page ?? paginationSource?.pageSize ?? 15,
      total: paginationSource?.total ?? authors.length,
      last_page: paginationSource?.last_page ?? 1,
    };

    return {
      data: authors.map(normalizeAuthor),
      meta,
      success: payload?.success ?? true,
    };
  } catch (error) {
    console.error("[AuthorService] fetchAuthors error:", {
      message: error?.message,
      status: error?.response?.status,
      url: error?.config?.url,
      data: error?.response?.data,
    });

    throw {
      message: error?.response?.data?.message || error?.message || "Failed to fetch authors",
      status: error?.response?.status,
      data: error?.response?.data,
    };
  }
};

/**
 * Get author by ID
 * GET /api/admin/authors/{id}
 * 
 * @param {string|number} id - Author ID
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} Author details
 */
export const getAuthor = async (id, config = {}) => {
  try {
    const url = `/api/admin/authors/${id}`;
    console.log(`[AuthorService] Fetching author from: ${url}`);
    const response = await apiClient.get(url, config);
    const author = response?.data?.data || response?.data;

    return {
      data: normalizeAuthor(author),
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("[AuthorService] getAuthor error:", error);
    throw {
      message: error?.response?.data?.message || "Failed to fetch author",
      status: error?.response?.status,
      data: error?.response?.data,
    };
  }
};

/**
 * Create new author
 * POST /api/admin/authors
 * 
 * @param {Object} authorData - Author data
 * @param {string} authorData.name - Author name (required)
 * @param {string} authorData.email - Author email (required)
 * @param {string} authorData.bio - Author bio (optional)
 * @param {File} authorData.profile_image - Profile image file (optional)
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} Created author
 */
export const createAuthor = async (authorData = {}, config = {}) => {
  try {
    // Use FormData for multipart request (file upload)
    const formData = new FormData();
    formData.append("name", authorData.name);
    formData.append("email", authorData.email);
    
    if (authorData.bio) {
      formData.append("bio", authorData.bio);
    }

    if (authorData.profile_image instanceof File) {
      formData.append("profile_image", authorData.profile_image);
    }

    const url = "/api/admin/authors";
    console.log(`[AuthorService] Creating author at: ${url}`);
    const response = await apiClient.post(url, formData, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
        ...config.headers,
      },
    });

    const author = response?.data?.data || response?.data;

    return {
      data: normalizeAuthor(author),
      message: response?.data?.message || "Author created successfully",
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("[AuthorService] createAuthor error:", error);
    throw {
      message: error?.response?.data?.message || "Failed to create author",
      status: error?.response?.status,
      errors: error?.response?.data?.errors,
      data: error?.response?.data,
    };
  }
};

/**
 * Update author
 * PUT /api/admin/authors/{id}
 * 
 * @param {string|number} id - Author ID
 * @param {Object} authorData - Fields to update
 * @param {string} authorData.name - Author name
 * @param {string} authorData.email - Author email
 * @param {string} authorData.bio - Author bio
 * @param {File} authorData.profile_image - Profile image file
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} Updated author
 */
export const updateAuthor = async (id, authorData = {}, config = {}) => {
  try {
    // Use FormData for multipart request (file upload)
    const formData = new FormData();

    if (authorData.name) {
      formData.append("name", authorData.name);
    }

    if (authorData.email) {
      formData.append("email", authorData.email);
    }

    if (authorData.bio) {
      formData.append("bio", authorData.bio);
    }

    if (authorData.profile_image instanceof File) {
      formData.append("profile_image", authorData.profile_image);
    }

    const url = `/api/admin/authors/${id}`;
    console.log(`[AuthorService] Updating author at: ${url}`);
    const response = await apiClient.put(url, formData, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
        ...config.headers,
      },
    });

    const author = response?.data?.data || response?.data;

    return {
      data: normalizeAuthor(author),
      message: response?.data?.message || "Author updated successfully",
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("[AuthorService] updateAuthor error:", error);
    throw {
      message: error?.response?.data?.message || "Failed to update author",
      status: error?.response?.status,
      errors: error?.response?.data?.errors,
      data: error?.response?.data,
    };
  }
};

/**
 * Delete author
 * DELETE /api/admin/authors/{id}
 * 
 * @param {string|number} id - Author ID
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} Delete response
 */
export const deleteAuthor = async (id, config = {}) => {
  try {
    const url = `/api/admin/authors/${id}`;
    console.log(`[AuthorService] Deleting author at: ${url}`);
    const response = await apiClient.delete(url, config);

    return {
      message: response?.data?.message || "Author deleted successfully",
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("[AuthorService] deleteAuthor error:", error);
    throw {
      message: error?.response?.data?.message || "Failed to delete author",
      status: error?.response?.status,
      data: error?.response?.data,
    };
  }
};

/**
 * Resend invitation email to author
 * POST /api/admin/authors/{id}/resend-invitation
 * 
 * @param {string|number} id - Author ID
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} Response
 */
export const resendAuthorInvitation = async (id, config = {}) => {
  try {
    const url = `/api/admin/authors/${id}/resend-invitation`;
    console.log(`[AuthorService] Resending invitation at: ${url}`);
    const response = await apiClient.post(
      url,
      null,
      config
    );

    return {
      message: response?.data?.message || "Invitation email sent successfully",
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("[AuthorService] resendAuthorInvitation error:", error);
    throw {
      message: error?.response?.data?.message || "Failed to resend invitation",
      status: error?.response?.status,
      data: error?.response?.data,
    };
  }
};

/**
 * Fetch users with Author role only
 * GET /api/admin/users?role=Author
 * 
 * @param {Object} filters - Filter options
 * @param {string} filters.search - Search by name or email
 * @param {number} filters.page - Page number for pagination
 * @param {number} filters.per_page - Items per page
 * @param {Object} config - Additional axios config
 * @returns {Promise<{data: Array, meta: Object}>} Author users list
 */
export const fetchAuthorUsers = async (filters = {}, config = {}) => {
  try {
    const params = new URLSearchParams();

    // Always filter by Author role
    params.set("role", "Author");

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.page) {
      params.set("page", filters.page);
    }

    if (filters.per_page) {
      params.set("per_page", filters.per_page);
    }

    const query = params.toString();
    const url = `/api/admin/users${query ? `?${query}` : ""}`;

    console.log(`[AuthorService] Fetching author users from: ${url}`);
    const response = await apiClient.get(url, config);
    const payload = response?.data;

    console.log("[AuthorService] fetchAuthorUsers response:", payload);

    // Extract users array from response
    const users = (Array.isArray(payload?.data) && payload.data) ||
                  (Array.isArray(payload) && payload) ||
                  [];

    // Extract pagination metadata
    const paginationSource = payload?.meta || payload?.pagination || {};
    const meta = {
      page: paginationSource?.current_page ?? paginationSource?.page ?? 1,
      per_page: paginationSource?.per_page ?? paginationSource?.pageSize ?? 15,
      total: paginationSource?.total ?? users.length,
      last_page: paginationSource?.last_page ?? 1,
    };

    return {
      data: users.map(normalizeAuthor),
      meta,
      success: payload?.success ?? true,
    };
  } catch (error) {
    console.error("[AuthorService] fetchAuthorUsers error:", {
      message: error?.message,
      status: error?.response?.status,
      url: error?.config?.url,
      data: error?.response?.data,
    });

    throw {
      message: error?.response?.data?.message || error?.message || "Failed to fetch author users",
      status: error?.response?.status,
      data: error?.response?.data,
    };
  }
};

/**
 * Export all author API services
 */
export default {
  fetchAuthors,
  fetchAuthorUsers,
  getAuthor,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  resendAuthorInvitation,
  normalizeAuthor,
};
