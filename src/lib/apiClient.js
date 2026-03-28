import axios from "axios";

const TOKEN_KEY = "bookhub_token";
const SESSION_KEY = "bookhub_session";
const REMEMBER_KEY = "bookhub_remember";
const AUTH_UNAUTHORIZED_EVENT = "bookhub:unauthorized";
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

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    null
  );
}

function basePathEndsWithApi(baseUrl) {
  const raw = String(baseUrl || "");
  if (!raw) return false;

  try {
    const parsed = new URL(raw);
    return /\/api$/i.test(trimTrailingSlash(parsed.pathname || ""));
  } catch {
    return /\/api$/i.test(trimTrailingSlash(raw));
  }
}

function normalizeApiUrl(url) {
  if (!url || isAbsoluteUrl(url)) {
    return url;
  }

  const rawPath = `/${trimLeadingSlash(url)}`;
  const baseEndsWithApi = basePathEndsWithApi(API_BASE_URL);

  try {
    const baseUrl = new URL(API_BASE_URL);
    const basePath = trimTrailingSlash(baseUrl.pathname || "");

    if (baseEndsWithApi && hasApiPrefix(rawPath)) {
      return `/${trimLeadingSlash(rawPath).replace(/^api\/?/i, "")}`;
    }

    if (!baseEndsWithApi && !hasApiPrefix(rawPath)) {
      return `/api${rawPath}`;
    }
  } catch {
    if (baseEndsWithApi && hasApiPrefix(rawPath)) {
      return `/${trimLeadingSlash(rawPath).replace(/^api\/?/i, "")}`;
    }

    if (!baseEndsWithApi && !hasApiPrefix(rawPath)) {
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
    const token = getStoredAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // Handle 401 Unauthorized — skip auth routes (login/register returning 401 is expected)
    if (error.response?.status === 401) {
      const url = String(error.config?.url || "");
      const isAuthRoute = /\/auth\/(login|register)/i.test(url);
      if (!isAuthRoute && typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(REMEMBER_KEY);
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
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
