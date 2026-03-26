import axios from "axios";
import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  DEFAULT_API_BASE_URL,
} from "./apiClient";

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

/*
------------------------------------------------
Build possible backend URLs
------------------------------------------------
*/
function getBaseCandidates() {
  const candidates = [""];
  const configured = trimTrailingSlash(API_BASE_URL);
  const defaultBase = trimTrailingSlash(DEFAULT_API_BASE_URL);

  if (configured) candidates.push(configured);
  if (defaultBase && defaultBase !== configured) candidates.push(defaultBase);

  return [...new Set(candidates)];
}

/*
------------------------------------------------
POST with backend fallback
------------------------------------------------
*/
async function postWithFallback(path, body, headers) {
  const timeout = API_TIMEOUT_MS;
  const bases = getBaseCandidates();
  let lastError = null;

  for (const base of bases) {
    const url = base ? `${base}${path}` : path;

    try {
      return await axios.post(url, body, {
        timeout,
        headers: {
          Accept: "application/json",
          ...(headers || {}),
        },
      });
    } catch (error) {
      const hasResponse = Boolean(error?.response);

      // If backend responded with validation error → stop retry
      if (hasResponse) {
        throw error;
      }

      // Network error → try next candidate
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to reach authentication server.");
}

/*
------------------------------------------------
POST auth request with different body formats
------------------------------------------------
*/
function postAuth(path, payload, mode = "json") {
  if (mode === "urlencoded") {
    const params = new URLSearchParams();

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    return postWithFallback(path, params, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }

  if (mode === "multipart") {
    const formData = new FormData();

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return postWithFallback(path, formData);
  }

  return postWithFallback(path, payload, {
    "Content-Type": "application/json",
  });
}

/*
------------------------------------------------
AUTH API
------------------------------------------------
*/

export function loginRequest(payload, options = {}) {
  return postAuth("/api/auth/login", payload, options.mode || "json");
}
