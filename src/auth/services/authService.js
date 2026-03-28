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

function post(path, body) {
  return axios.post(joinBaseAndPath(resolveBase(), path), body, {
    timeout: API_TIMEOUT_MS,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });
}

export function loginRequest(payload) {
  return post("/api/auth/login", { email: payload.email, password: payload.password });
}

export function registerRequest(payload) {
  return post("/api/auth/register", payload);
}
