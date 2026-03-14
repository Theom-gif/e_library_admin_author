import axios from "axios";
import { emitAuthLogout } from "./authEvents";

const TOKEN_KEY = "bookhub_token";
const resolveDefaultApiBaseUrl = () => {
  if (typeof window === "undefined" || !window.location?.hostname) {
    return "http://127.0.0.1:8000";
  }

  const protocol = window.location.protocol || "http:";
  const host = window.location.hostname;
  return `${protocol}//${host}:8000`;
};

const DEFAULT_API_BASE_URL = resolveDefaultApiBaseUrl();
const DEFAULT_TIMEOUT_MS = 8000;

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const isLoopbackHost = (host = "") =>
  host === "127.0.0.1" || host === "localhost" || host === "::1";

const resolveApiBaseUrl = () => {
  const configured = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
  if (typeof window === "undefined" || !window.location?.hostname) {
    return configured || DEFAULT_API_BASE_URL;
  }

  if (!configured) {
    return DEFAULT_API_BASE_URL;
  }

  // If app is opened via LAN IP but .env points to localhost, use current host.
  try {
    const configuredUrl = new URL(configured);
    const currentHost = window.location.hostname;
    if (!isLoopbackHost(currentHost) && isLoopbackHost(configuredUrl.hostname)) {
      const currentProtocol = window.location.protocol || configuredUrl.protocol;
      return `${currentProtocol}//${currentHost}:${configuredUrl.port || "8000"}`;
    }
  } catch {
    return configured;
  }

  return configured;
};

export const API_BASE_URL = resolveApiBaseUrl();

const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: API_TIMEOUT_MS,
});

apiClient.interceptors.request.use((config) => {
  const token =
    window.localStorage.getItem(TOKEN_KEY) ||
    window.sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = Number(error?.response?.status || 0);
    if (status === 401 || status === 403) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Invalid credentials. Please login again.";
      emitAuthLogout(message);
    }
    return Promise.reject(error);
  },
);

export const authApiClient = apiClient;
