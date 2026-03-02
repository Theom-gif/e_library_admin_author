const API_BASE_URL = "http://192.168.75.1:8000";
const TOKEN_KEY = "bookhub_token";

async function request(method, path, payload) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.error || data?.message || `Request failed with status ${response.status}`,
    );
    error.response = { status: response.status, data };
    throw error;
  }

  return { data, status: response.status };
}

export const authApiClient = {
  post(path, payload) {
    return request("POST", path, payload);
  },
};
