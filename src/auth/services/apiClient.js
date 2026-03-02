import axios from "axios";

const API_BASE_URL = "http://192.168.75.1:8000";
const TOKEN_KEY = "bookhub_token";

export const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

authApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
