import axios from "axios";

const TOKEN_KEY = "bookhub_token";
const REFRESH_TOKEN_KEY = "bookhub_refresh_token";
const SESSION_KEY = "bookhub_session";
const REMEMBER_KEY = "bookhub_remember";
const AUTH_UNAUTHORIZED_EVENT = "bookhub:unauthorized";
export const DEFAULT_API_BASE_URL = "https://elibrary.pncproject.site";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_LONG_TIMEOUT_MS = 120000;

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const trimLeadingSlash = (value) => String(value || "").replace(/^\/+/, "");
const hasApiPrefix = (value) => /^api(?:\/|$)/i.test(trimLeadingSlash(value));
const isAbsoluteUrl = (value) => /^[a-z][a-z\d+\-.]*:\/\//i.test(String(value || ""));

const apiBaseFromEnv = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
export const API_BASE_URL = apiBaseFromEnv || DEFAULT_API_BASE_URL;
export const API_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
export const API_LONG_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_LONG_TIMEOUT_MS) || DEFAULT_LONG_TIMEOUT_MS;

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

function getStoredRefreshToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
    localStorage.getItem("refresh_token") ||
    sessionStorage.getItem("refresh_token") ||
    null
  );
}

function persistAccessToken(token) {
  if (typeof window === "undefined" || !token) return;

  const remember = localStorage.getItem(REMEMBER_KEY) === "1";
  const activeStorage = remember ? localStorage : sessionStorage;
  const staleStorage = remember ? sessionStorage : localStorage;

  activeStorage.setItem(TOKEN_KEY, token);
  activeStorage.setItem("access_token", token);
  staleStorage.removeItem(TOKEN_KEY);
  staleStorage.removeItem("access_token");
}

function persistRefreshToken(token) {
  if (typeof window === "undefined" || !token) return;

  const remember = localStorage.getItem(REMEMBER_KEY) === "1";
  const activeStorage = remember ? localStorage : sessionStorage;
  const staleStorage = remember ? sessionStorage : localStorage;

  activeStorage.setItem(REFRESH_TOKEN_KEY, token);
  activeStorage.setItem("refresh_token", token);
  staleStorage.removeItem(REFRESH_TOKEN_KEY);
  staleStorage.removeItem("refresh_token");
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("access_token");
  sessionStorage.removeItem("access_token");
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("refresh_token");
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

function extractTokenFromPayload(data = {}) {
  const sources = [data, data?.data, data?.tokens, data?.data?.tokens];
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    const accessToken =
      source.token ||
      source.access_token ||
      source.accessToken ||
      source.jwt ||
      source.bearerToken ||
      source.bearer_token;
    const refreshToken =
      source.refreshToken ||
      source.refresh_token ||
      source.refreshTokenValue ||
      source.reset_token ||
      source.resetToken;

    if (accessToken || refreshToken) {
      return { accessToken, refreshToken };
    }
  }

  return { accessToken: null, refreshToken: null };
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

let refreshPromise = null;

async function requestTokenRefresh() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const currentToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const tokenForRefresh = refreshToken || currentToken;

  if (!tokenForRefresh) {
    throw new Error("Missing refresh token.");
  }

  refreshPromise = axios
    .post(
      normalizeApiUrl("/auth/refresh"),
      {
        refresh_token: refreshToken || undefined,
        refreshToken: refreshToken || undefined,
        token: refreshToken || currentToken || undefined,
      },
      {
        baseURL: API_BASE_URL,
        timeout: API_TIMEOUT_MS,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenForRefresh}`,
        },
      },
    )
    .then((response) => {
      const payload = response?.data || {};
      const { accessToken, refreshToken: nextRefreshToken } = extractTokenFromPayload(payload);
      const nextToken = accessToken || payload?.token;

      if (!nextToken) {
        throw new Error("Refresh succeeded but no token was returned.");
      }

      persistAccessToken(nextToken);
      if (nextRefreshToken) {
        persistRefreshToken(nextRefreshToken);
      }

      return nextToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

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
  async (error) => {
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
      const isAuthRoute = /\/auth\/(login|register|refresh|logout)/i.test(url);
      const canRetry = !error.config?._retry && !isAuthRoute;

      if (canRetry && typeof window !== "undefined") {
        try {
          const refreshedToken = await requestTokenRefresh();
          error.config._retry = true;
          error.config.headers = error.config.headers || {};
          error.config.headers.Authorization = `Bearer ${refreshedToken}`;
          return apiClient.request(error.config);
        } catch {
          clearStoredAuth();
          window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      } else if (!isAuthRoute && typeof window !== "undefined") {
        clearStoredAuth();
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
