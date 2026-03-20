import axios from "axios";

const TOKEN_KEY = "bookhub_token";
export const DEFAULT_API_BASE_URL = "https://elibrary.pncproject.site/api";
const DEFAULT_TIMEOUT_MS = 8000;

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const apiBaseFromEnv = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
export const API_BASE_URL = apiBaseFromEnv || DEFAULT_API_BASE_URL;
export const API_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: API_TIMEOUT_MS,
});

// Attach bearer token (from either storage) automatically
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// For clarity, authApiClient is the same axios instance
export const authApiClient = apiClient;
