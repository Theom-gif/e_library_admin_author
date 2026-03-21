import axios from "axios";

const TOKEN_KEY = "bookhub_token";
export const DEFAULT_API_BASE_URL = "https://elibrary.pncproject.site";
const DEFAULT_TIMEOUT_MS = 8000;

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const trimLeadingSlash = (value) => String(value || "").replace(/^\/+/, "");
const hasApiPrefix = (value) => /^api(?:\/|$)/i.test(trimLeadingSlash(value));
const isAbsoluteUrl = (value) => /^[a-z][a-z\d+\-.]*:\/\//i.test(String(value || ""));

const apiBaseFromEnv = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
export const API_BASE_URL = apiBaseFromEnv || DEFAULT_API_BASE_URL;
export const API_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

function normalizeApiUrl(url) {
  if (!url || isAbsoluteUrl(url)) {
    return url;
  }

  const rawPath = `/${trimLeadingSlash(url)}`;

  try {
    const baseUrl = new URL(API_BASE_URL);
    const basePath = trimTrailingSlash(baseUrl.pathname || "");
    const baseEndsWithApi = /\/api$/i.test(basePath);

    if (baseEndsWithApi && hasApiPrefix(rawPath)) {
      return `/${trimLeadingSlash(rawPath).replace(/^api\/?/i, "")}`;
    }

    if (!baseEndsWithApi && !hasApiPrefix(rawPath)) {
      return `/api${rawPath}`;
    }
  } catch {
    if (!hasApiPrefix(rawPath)) {
      return `/api${rawPath}`;
    }
  }

  return rawPath;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: API_TIMEOUT_MS,
});

// Attach bearer token (from either storage) automatically
apiClient.interceptors.request.use((config) => {
  config.url = normalizeApiUrl(config.url);

  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("[API Client] No authentication token found. Request may fail with 401.");
    }
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detect CORS errors
    const isCorsError = 
      error.message === "Network Error" &&
      !error.response &&
      error.config;

    if (isCorsError) {
      const requestUrl = error.config?.url;
      console.error("[API Client] ❌ CORS ERROR - Request blocked by browser", {
        url: requestUrl,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        message: "No 'Access-Control-Allow-Origin' header received",
        solution: "Use NGINX proxy or configure backend CORS headers"
      });
      
      const corsError = new Error(
        "Network Error: CORS policy blocked this request. " +
        "Please check if the backend API is accessible or if NGINX proxy is configured correctly."
      );
      corsError.isCorsError = true;
      corsError.originalError = error;
      return Promise.reject(corsError);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error("[API Client] 401 Unauthorized - Token may be invalid or expired");
      
      // Clear invalid tokens
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
      }
      
      // Redirect to login on 401
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        console.log("[API Client] Redirecting to login...");
        window.location.href = "/login";
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("[API Client] 403 Forbidden - You don't have permission to access this resource");
    }

    // Handle 500+ Server Errors
    if (error.response?.status >= 500) {
      console.error("[API Client] Server Error:", error.response.status, error.response.data);
    }

    return Promise.reject(error);
  }
);

// For clarity, authApiClient is the same axios instance
export const authApiClient = apiClient;
