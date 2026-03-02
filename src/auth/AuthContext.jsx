import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_AUTH_USERS } from "../admin/data/mockData";
import { loginRequest, registerRequest } from "./services/authService";

const SESSION_KEY = "bookhub_session";
const TOKEN_KEY = "bookhub_token";
const USERS_KEY = "bookhub_users";
const REQUIRE_LOGIN_ON_APP_START = true;

const AuthContext = createContext(null);

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function toErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
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

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [...DEMO_AUTH_USERS];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEMO_AUTH_USERS];
  } catch {
    return [...DEMO_AUTH_USERS];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function seedUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    saveUsers(DEMO_AUTH_USERS);
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function hydrateSession() {
  const session = getSession();
  if (!session) {
    return null;
  }

  const users = getUsers();
  const normalizedSessionEmail = String(session.email || "").trim().toLowerCase();
  const matchedUser = users.find(
    (candidate) =>
      candidate.id === session.id &&
      candidate.email.toLowerCase() === normalizedSessionEmail &&
      normalizeRole(candidate.role) === normalizeRole(session.role),
  );

  if (!matchedUser) {
    clearSession();
    return null;
  }

  return {
    id: matchedUser.id,
    name: matchedUser.name,
    email: matchedUser.email,
    role: matchedUser.role,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    seedUsers();
    if (REQUIRE_LOGIN_ON_APP_START) {
      clearSession();
      clearToken();
      setUser(null);
    } else {
      setUser(hydrateSession());
    }
    setIsInitializing(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      isAuthenticated: Boolean(user),
      login: async ({ email, password, role }) => {
        const normalizedEmail = String(email || "").trim().toLowerCase();

        try {
          const response = await loginRequest({
            email: normalizedEmail,
            password,
            role,
          });

          const data = response?.data ?? {};
          const remoteUser = data.user || data;
          const token = data.token || data.accessToken || data.access_token;

          if (remoteUser && (remoteUser.email || remoteUser.id)) {
            const sessionUser = {
              id: remoteUser.id || remoteUser._id || remoteUser.userId || String(remoteUser.email),
              name: remoteUser.name || remoteUser.fullName || remoteUser.username || "User",
              email: remoteUser.email || normalizedEmail,
              role: remoteUser.role || role || "Reader",
            };

            saveSession(sessionUser);
            saveToken(token);
            setUser(sessionUser);
            return { ok: true, user: sessionUser };
          }
        } catch {
          // Fall back to local demo users below.
        }

        const users = getUsers();
        const found = users.find(
          (candidate) =>
            candidate.email.toLowerCase() === normalizedEmail &&
            candidate.password === password &&
            normalizeRole(candidate.role) === normalizeRole(role),
        );

        if (!found) {
          return { ok: false, error: "Invalid email, password, or role." };
        }

        const sessionUser = {
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role,
        };

        saveSession(sessionUser);
        setUser(sessionUser);
        return { ok: true, user: sessionUser };
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
    [isInitializing, user],
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
