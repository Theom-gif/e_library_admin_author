import axios from "axios";
import { API_BASE_URL, API_TIMEOUT_MS, DEFAULT_API_BASE_URL } from "./apiClient";

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const trimLeadingSlash = (value) => String(value || "").replace(/^\/+/, "");

function basePathEndsWithApi(base) {
  const raw = String(base || "");
  if (!raw) return false;
  try {
    return /\/api$/i.test(trimTrailingSlash(new URL(raw).pathname || ""));
  } catch {
    return /\/api$/i.test(trimTrailingSlash(raw));
  }
}

function joinBaseAndPath(base, path) {
  if (!base) return `/${trimLeadingSlash(path)}`;
  let p = `/${trimLeadingSlash(path)}`;
  if (basePathEndsWithApi(base) && /^\/api(?:\/|$)/i.test(p))
    p = `/${trimLeadingSlash(p).replace(/^api\/?/i, "")}`;
  return `${trimTrailingSlash(base)}${p}`;
}

function resolveBase() {
  const configured = trimTrailingSlash(API_BASE_URL);
  return configured || trimTrailingSlash(DEFAULT_API_BASE_URL);
}

function createRequestBody(payload = {}, mode = "json") {
  if (mode === "multipart") {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      formData.append(key, value);
    });
    return formData;
  }

  if (mode === "urlencoded") {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.append(key, String(value));
    });
    return params;
  }

  return payload;
}

function createHeaders(mode = "json") {
  if (mode === "multipart") {
    return { Accept: "application/json" };
  }

  if (mode === "urlencoded") {
    return {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function post(path, body, { mode = "json" } = {}) {
  return axios.post(joinBaseAndPath(resolveBase(), path), createRequestBody(body, mode), {
    timeout: API_TIMEOUT_MS,
    headers: createHeaders(mode),
  });
}

export function loginRequest(payload, options = {}) {
  return post("/api/auth/login", payload, options);
}

export function registerRequest(payload, options = {}) {
  return post("/api/auth/register", payload, options);
}

export function refreshTokenRequest(token) {
  return axios.post(
    joinBaseAndPath(resolveBase(), "/api/auth/refresh"),
    {
      refresh_token: token || undefined,
      refreshToken: token || undefined,
      reset_token: token || undefined,
      resetToken: token || undefined,
      token: token || undefined,
    },
    {
      timeout: API_TIMEOUT_MS,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
}
