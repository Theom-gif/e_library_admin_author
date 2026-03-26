import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_AUTH_USERS } from "../admin/data/mockData";
import { loginRequest } from "./services/authService";
import { API_BASE_URL } from "../lib/apiClient";
import { getRoleName } from "./roleUtils";

const SESSION_KEY = "bookhub_session";
const TOKEN_KEY = "bookhub_token";
const REMEMBER_KEY = "bookhub_remember";
const AUTHOR_PROFILE_KEY = "author_studio_profile";
const AUTHOR_PROFILE_UPDATED_EVENT = "author-profile-updated";
const DEFAULT_AUTHOR_NAME = "Alex Rivera";
const GENERIC_AUTHOR_NAMES = new Set(["User", "Author", DEFAULT_AUTHOR_NAME]);

const AuthContext = createContext(null);

function readSessionFromStorage(storage) {
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    storage.removeItem(SESSION_KEY);
    return null;
  }
}

function getTokenFromStorage() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function setRememberPreference(remember) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, "1");
    return;
  }
  localStorage.removeItem(REMEMBER_KEY);
}

function getSession() {
  return readSessionFromStorage(localStorage) || readSessionFromStorage(sessionStorage);
}

function saveSession(user, remember = false) {
  const activeStorage = remember ? localStorage : sessionStorage;
  const staleStorage = remember ? sessionStorage : localStorage;
  activeStorage.setItem(SESSION_KEY, JSON.stringify(user));
  staleStorage.removeItem(SESSION_KEY);
}

function saveToken(token, remember = false) {
  if (!token) {
    return;
  }
  const activeStorage = remember ? localStorage : sessionStorage;
  const staleStorage = remember ? sessionStorage : localStorage;
  activeStorage.setItem(TOKEN_KEY, token);
  staleStorage.removeItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function firstDefinedValue(values) {
  return values.find((value) => String(value ?? "").trim() !== "");
}

function extractBackendUser(data) {
  return data?.user || data?.data?.user || data || {};
}

function extractRoleValue(backendUser, data) {
  return firstDefinedValue([
    backendUser?.role_id,
    backendUser?.roleId,
    backendUser?.role,
    backendUser?.role_name,
    backendUser?.roleName,
    backendUser?.user_role,
    backendUser?.type,
    data?.role_id,
    data?.roleId,
    data?.role,
    data?.role_name,
    data?.roleName,
    data?.user_role,
    data?.type,
  ]);
}

function resolveSessionRole(backendUser, data) {
  return getRoleName(extractRoleValue(backendUser, data));
}

function resolveSessionUserId(backendUser) {
  return backendUser?.id || backendUser?._id || backendUser?.userId || backendUser?.user_id || null;
}

function resolveSessionUserName(backendUser) {
  return backendUser?.name || backendUser?.fullName || backendUser?.username || "User";
}

function toErrorMessage(error, fallbackMessage) {
  if (error?.code === "ECONNABORTED") {
    return "Login request timed out. Please check backend/API speed and try again.";
  }
  if (!error?.response) {
    const directMessage = String(error?.message || "").trim();
    if (directMessage) {
      return directMessage;
    }
    return `Cannot reach backend at ${API_BASE_URL}. Check VITE_API_BASE_URL and backend status.`;
  }
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;
  const validationErrors = error?.response?.data?.errors;
  if (validationErrors && typeof validationErrors === "object") {
    const messages = Object.values(validationErrors)
      .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
      .filter(Boolean)
      .map((entry) => String(entry).trim())
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.slice(0, 3).join(" ");
    }
  }
  return message || fallbackMessage;
}

function getErrorMessageText(error) {
  const validationErrors = error?.response?.data?.errors;
  const roleErrors = validationErrors?.role || validationErrors?.role_id || validationErrors?.Role;
  const roleErrorText = Array.isArray(roleErrors) ? roleErrors.join(" ") : roleErrors;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "";
  return `${message} ${roleErrorText || ""}`.trim();
}

function isRoleValidationError(error) {
  const status = Number(error?.response?.status || 0);
  const text = getErrorMessageText(error).toLowerCase();
  const isClientValidationStatus = status >= 400 && status < 500;
  return (
    isClientValidationStatus &&
    (text.includes("role") ||
      text.includes("user, author, or admin") ||
      text.includes("selected role is invalid") ||
      text.includes("role is required"))
  );
}

async function loginWithRequestFallbacks({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const requestModes = ["urlencoded", "multipart", "json"];

  for (const mode of requestModes) {
    try {
      return await loginRequest({ email: cleanEmail, password }, { mode });
    } catch (error) {
      if (!isRoleValidationError(error)) {
        throw error;
      }
    }
  }

  throw new Error("Login failed because the backend still expects a role field.");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const shouldRemember = localStorage.getItem(REMEMBER_KEY) === "1";

    const storedSession = getSession();
    const storedToken = getTokenFromStorage();

    if (!storedSession || !storedToken) {
      clearSession();
      clearToken();
      setUser(null);
      setIsReady(true);
      return;
    }

    // if session + token exist → restore login
    setUser(storedSession);
    syncAuthorProfileFromAuth(storedSession, null);
    setIsReady(true);
  }, []);
  const value = useMemo(
    () => ({
      user,
      isReady,
      isAuthenticated: Boolean(user),
      login: async ({ email, password, remember = false }) => {
        try {
          const response = await loginWithRequestFallbacks({ email, password });
          const data = response?.data || {};
          const backendUser = extractBackendUser(data);
          const backendRole = extractRoleValue(backendUser, data);

          if (!backendRole) {
            return { ok: false, error: "Login succeeded, but the backend did not return the user's role." };
          }

          const resolvedRole = resolveSessionRole(backendUser, data);

          const sessionUser = {
            id: resolveSessionUserId(backendUser) || `u_${Date.now()}`,
            name: resolveSessionUserName(backendUser),
            email: backendUser?.email || String(email || "").trim().toLowerCase(),
            role: resolvedRole,
          };

          const token =
            data.token ||
            data.accessToken ||
            data.access_token ||
            data.data?.token ||
            data.data?.accessToken ||
            data.data?.access_token;

          if (!token) {
            return { ok: false, error: "Login succeeded but no access token was returned by /api/auth/login." };
          }
          saveSession(sessionUser, Boolean(remember));
          saveToken(token, Boolean(remember));
          setRememberPreference(Boolean(remember));
          setUser(sessionUser);
          syncAuthorProfileFromAuth(sessionUser, backendUser);
          return { ok: true, user: sessionUser };
        } catch (error) {
          return { ok: false, error: toErrorMessage(error, "Login failed. Please try again.") };
        }
      },
      loginDemo: (role) => {
        const demoUser = DEMO_AUTH_USERS.find(
          (candidate) => getRoleName(candidate.role) === getRoleName(role),
        );
        if (!demoUser) {
          return { ok: false, error: "Demo user is unavailable." };
        }

        const sessionUser = {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: getRoleName(demoUser.role),
        };
        saveSession(sessionUser, false);
        saveToken("demo-session-token", false);
        setRememberPreference(false);
        setUser(sessionUser);
        syncAuthorProfileFromAuth(sessionUser, demoUser);
        return { ok: true, user: sessionUser };
      },
      logout: () => {
        clearSession();
        clearToken();
        localStorage.removeItem(REMEMBER_KEY);
        setUser(null);
      },
    }),
    [isReady, user],
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
