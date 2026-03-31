import { getStoredAccessToken } from "../../../../lib/apiClient";

const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");
const trimLeadingSlash = (value = "") => String(value || "").replace(/^\/+/, "");
const isAbsoluteUrl = (value = "") => /^[a-z][a-z\d+\-.]*:\/\//i.test(String(value || ""));

const SYSMON_HTTP_BASE = trimTrailingSlash(
  import.meta.env.VITE_SYSMON_API_BASE_URL || "/sysmon-api",
);

const SYSMON_WS_BASE = trimTrailingSlash(
  import.meta.env.VITE_SYSMON_WS_URL || "/sysmon-ws",
);

export const buildSysmonHttpUrl = (path = "") => {
  const cleanPath = trimLeadingSlash(path);
  const base = SYSMON_HTTP_BASE || "/api";

  if (isAbsoluteUrl(base)) {
    return new URL(cleanPath, `${base}/`).toString();
  }

  return `${base}/${cleanPath}`;
};

export const buildSysmonWebSocketUrl = () => {
  const base = SYSMON_WS_BASE || "/ws";
  if (isAbsoluteUrl(base)) {
    return base;
  }

  if (typeof window !== "undefined") {
    const url = new URL(base, window.location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString();
  }

  return base;
};

export async function fetchSysmonJson(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const token = getStoredAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildSysmonHttpUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Sysmon request failed: ${response.status} ${response.statusText}`.trim());
  }

  return response.json();
}

export const openSysmonWebSocket = () => new window.WebSocket(buildSysmonWebSocketUrl());
