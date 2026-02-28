import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_AUTH_USERS } from "../admin/data/mockData";

const USERS_KEY = "bookhub_users";
const SESSION_KEY = "bookhub_session";
const REQUIRE_LOGIN_ON_APP_START = true;

const AuthContext = createContext(null);

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function seedUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_AUTH_USERS));
    return;
  }

  let existingUsers = [];
  try {
    existingUsers = JSON.parse(raw);
  } catch {
    existingUsers = [];
  }

  const demoIds = new Set(DEMO_AUTH_USERS.map((user) => user.id));
  const nonDemoUsers = existingUsers.filter((user) => !demoIds.has(user.id));
  const mergedUsers = [...nonDemoUsers, ...DEMO_AUTH_USERS];
  localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));
}

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
      login: ({ email, password, role }) => {
        const normalizedEmail = String(email || "").trim().toLowerCase();
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

        const sessionUser = { id: found.id, name: found.name, email: found.email, role: found.role };
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
      register: ({ name, email, password, role }) => {
        const users = getUsers();
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const exists = users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail);
        if (exists) {
          return { ok: false, error: "Email is already registered." };
        }

        const newUser = {
          id: `u_${Date.now()}`,
          name,
          email: normalizedEmail,
          password,
          role,
        };
        saveUsers([...users, newUser]);
        return { ok: true };
      },
      logout: () => {
        clearSession();
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
