import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_AUTH_USERS } from "../admin/data/mockData";
import { loginRequest, registerRequest } from "./services/authService";

const SESSION_KEY = "bookhub_session";
const TOKEN_KEY = "bookhub_token";

const AuthContext = createContext(null);

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function saveToken(token) {
  if (!token) {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function toErrorMessage(error, fallbackMessage) {
  const message = error?.response?.data?.message || error?.message;
  return message || fallbackMessage;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async ({ email, password, role }) => {
        try {
          const response = await loginRequest({
            email: String(email || "").trim().toLowerCase(),
            password,
            role,
          });
          const data = response?.data || {};
          const backendUser = data.user || data.data?.user || data;
          const backendRole = backendUser?.role || role;
          if (role && normalizeRole(backendRole) !== normalizeRole(role)) {
            return { ok: false, error: "Your account role does not match the selected role." };
          }

          const sessionUser = {
            id: backendUser?.id || backendUser?._id || backendUser?.userId || `u_${Date.now()}`,
            name: backendUser?.name || backendUser?.fullName || backendUser?.username || "User",
            email: backendUser?.email || String(email || "").trim().toLowerCase(),
            role: backendRole || "Reader",
          };

          const token = data.token || data.accessToken || data.access_token;
          saveSession(sessionUser);
          saveToken(token);
          setUser(sessionUser);
          return { ok: true, user: sessionUser };
        } catch (error) {
          return { ok: false, error: toErrorMessage(error, "Login failed. Please try again.") };
        }
      },
      loginDemo: (role) => {
        const demoUser = DEMO_AUTH_USERS.find(
          (candidate) => normalizeRole(candidate.role) === normalizeRole(role),
        );
        if (!demoUser) {
          return { ok: false, error: "Demo user is unavailable." };
        }

        const sessionUser = {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
        };
        saveSession(sessionUser);
        setUser(sessionUser);
        return { ok: true, user: sessionUser };
      },
      register: async ({ name, email, password, role }) => {
        try {
          await registerRequest({
            name,
            email: String(email || "").trim().toLowerCase(),
            password,
            role,
          });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: toErrorMessage(error, "Registration failed. Please try again.") };
        }
      },
      logout: () => {
        clearSession();
        clearToken();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
