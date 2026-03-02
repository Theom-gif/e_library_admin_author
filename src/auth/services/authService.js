import { authApiClient } from "./apiClient";

export function loginRequest(payload) {
  return authApiClient.post("/auth/login", payload);
}

export function registerRequest(payload) {
  return authApiClient.post("/auth/register", payload);
}

