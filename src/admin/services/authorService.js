import { apiClient } from "../../lib/apiClient";

const AUTHOR_API_PREFIX = String(import.meta.env.VITE_AUTHOR_API_PREFIX || "/authors").replace(/\/+$/, "");
const buildAuthorUrl = (suffix = "") => `${AUTHOR_API_PREFIX}${suffix}`;
const AUTHOR_REGISTRATION_URL = String(import.meta.env.VITE_AUTHOR_REGISTRATION_URL || "/auth/author_registration");
const AUTHOR_APPROVAL_URL = String(import.meta.env.VITE_AUTHOR_APPROVAL_URL || "/admin/approve-authors").replace(/\/+$/, "");

const toCleanString = (value) => String(value ?? "").trim();
const toStatusKey = (value) => toCleanString(value).toLowerCase().replace(/\s+/g, "_");
const toTimestamp = (value) => {
  const parsed = new Date(value || "").getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

function resolveAuthorName(author = {}) {
  const firstName = toCleanString(author?.first_name ?? author?.firstname);
  const lastName = toCleanString(author?.last_name ?? author?.lastname);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    toCleanString(author?.name) ||
    toCleanString(author?.full_name) ||
    toCleanString(author?.fullName) ||
    fullName ||
    toCleanString(author?.username) ||
    toCleanString(author?.email)
  );
}

export function getAuthorRegistrationStatus(author = {}) {
  const candidates = [
    author?.request_status,
    author?.approval_status,
    author?.registration_status,
    author?.account_status,
    author?.status,
    author?.state,
  ];

  for (const candidate of candidates) {
    const normalized = toStatusKey(candidate);

    if (["approved", "active", "accepted"].includes(normalized)) {
      return "approved";
    }

    if (["rejected", "declined", "denied"].includes(normalized)) {
      return "rejected";
    }

    if (["pending", "pending_approval", "submitted", "requested", "under_review", "awaiting_approval"].includes(normalized)) {
      return "pending";
    }
  }

  if (author?.approved_at || author?.invitation_accepted_at || author?.is_active === true) {
    return "approved";
  }

  if (author?.rejected_at || author?.rejected_reason) {
    return "rejected";
  }

  if (author?.is_active === false) {
    return "pending";
  }

  return "approved";
}

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
  first_name: author?.first_name ?? author?.firstname ?? "",
  last_name: author?.last_name ?? author?.lastname ?? "",
  name: resolveAuthorName(author),
  email: author?.email ?? "",
  bio: author?.bio ?? "",
  profile_image: author?.profile_image ?? null,
  profile_image_url: author?.profile_image_url ?? null,
  is_active: author?.is_active ?? false,
  invitation_sent_at: author?.invitation_sent_at ?? null,
  invitation_accepted_at: author?.invitation_accepted_at ?? null,
  request_status: getAuthorRegistrationStatus(author),
  approved_at: author?.approved_at ?? null,
  rejected_at: author?.rejected_at ?? null,
  rejected_reason: author?.rejected_reason ?? "",
  created_at: author?.created_at ?? null,
  updated_at: author?.updated_at ?? null,
});

export const createAuthorRequestNotification = (author = {}) => {
  const normalizedAuthor = normalizeAuthor(author);

  return {
    id: `author-request-${normalizedAuthor.id}`,
    type: "author_request",
    message: `${normalizedAuthor.name || normalizedAuthor.email || "Author applicant"} requested author access`,
    description:
      toCleanString(normalizedAuthor.bio) ||
      `${normalizedAuthor.email || "No email address"} is waiting for review.`,
    read: false,
    created_at: normalizedAuthor.created_at || normalizedAuthor.updated_at || "",
    author: normalizedAuthor,
  };
};

export const createAuthorRequestNotifications = (authors = []) =>
  authors
    .map(normalizeAuthor)
    .filter((author) => author.request_status === "pending")
    .sort((left, right) => toTimestamp(right.created_at || right.updated_at) - toTimestamp(left.created_at || left.updated_at))
    .map(createAuthorRequestNotification);

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
    const url = `${buildAuthorUrl()}${query ? `?${query}` : ""}`;

    const response = await apiClient.get(url, config);
    const payload = response?.data;

    // Extract authors array from response
    const authors = (Array.isArray(payload?.data?.data) && payload.data.data) ||
                    (Array.isArray(payload?.data) && payload.data) ||
                    (Array.isArray(payload) && payload) ||
                    [];

    // Extract pagination metadata
    const paginationSource = payload?.data?.meta || payload?.meta || payload?.pagination || {};
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
    console.error("fetchAuthors error:", error);
    throw {
      message: error?.response?.data?.message || "Failed to fetch authors",
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
    const response = await apiClient.get(buildAuthorUrl(`/${id}`), config);
    const author = response?.data?.data || response?.data;

    return {
      data: normalizeAuthor(author),
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("getAuthor error:", error);
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
    const payload = {
      firstname: authorData.firstname,
      lastname: authorData.lastname,
      email: authorData.email,
      password: authorData.password,
      password_confirmation: authorData.password_confirmation,
      role_id: 2,
      ...(authorData.bio ? { bio: authorData.bio } : {}),
    };

    const response = await apiClient.post(AUTHOR_REGISTRATION_URL, payload, config);
    const author = response?.data?.data || response?.data?.user || response?.data;

    return {
      data: normalizeAuthor(author),
      message: response?.data?.message || "Author registered successfully",
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("createAuthor error:", error);
    throw {
      message: error?.response?.data?.message || "Failed to create author",
      status: error?.response?.status,
      errors: error?.response?.data?.errors,
      data: error?.response?.data,
    };
  }
};

export const reviewAuthorRegistration = async (id, decision = "approve", config = {}) => {
  const normalizedDecision = String(decision || "approve").trim().toLowerCase() === "reject"
    ? "reject"
    : "approve";

  try {
    const response = await apiClient.post(
      `${AUTHOR_APPROVAL_URL}/${id}`,
      {
        action: normalizedDecision,
        decision: normalizedDecision,
        status: normalizedDecision === "approve" ? "approved" : "rejected",
        approved: normalizedDecision === "approve",
      },
      config,
    );

    return {
      data: normalizeAuthor(response?.data?.data || response?.data?.user || response?.data),
      message:
        response?.data?.message ||
        (normalizedDecision === "approve"
          ? "Author request approved successfully"
          : "Author request rejected successfully"),
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("reviewAuthorRegistration error:", error);
    throw {
      message:
        error?.response?.data?.message ||
        (normalizedDecision === "approve"
          ? "Failed to approve author request"
          : "Failed to reject author request"),
      status: error?.response?.status,
      errors: error?.response?.data?.errors,
      data: error?.response?.data,
    };
  }
};

export const approveAuthorRegistration = async (id, config = {}) =>
  reviewAuthorRegistration(id, "approve", config);

export const rejectAuthorRegistration = async (id, config = {}) =>
  reviewAuthorRegistration(id, "reject", config);

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

    if (authorData.password) {
      formData.append("password", authorData.password);
    }

    if (authorData.bio) {
      formData.append("bio", authorData.bio);
    }

    if (authorData.profile_image instanceof File) {
      formData.append("profile_image", authorData.profile_image);
    }

    const response = await apiClient.put(buildAuthorUrl(`/${id}`), formData, {
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
    console.error("updateAuthor error:", error);
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
    const response = await apiClient.delete(buildAuthorUrl(`/${id}`), config);

    return {
      message: response?.data?.message || "Author deleted successfully",
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("deleteAuthor error:", error);
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
    const response = await apiClient.post(
      buildAuthorUrl(`/${id}/resend-invitation`),
      null,
      config
    );

    return {
      message: response?.data?.message || "Invitation email sent successfully",
      success: response?.data?.success ?? true,
    };
  } catch (error) {
    console.error("resendAuthorInvitation error:", error);
    throw {
      message: error?.response?.data?.message || "Failed to resend invitation",
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
  getAuthor,
  createAuthor,
  approveAuthorRegistration,
  rejectAuthorRegistration,
  reviewAuthorRegistration,
  updateAuthor,
  deleteAuthor,
  resendAuthorInvitation,
  createAuthorRequestNotification,
  createAuthorRequestNotifications,
  getAuthorRegistrationStatus,
  normalizeAuthor,
};
