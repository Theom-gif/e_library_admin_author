import { useEffect, useMemo, useState } from "react";
import { DEMO_AUTH_USERS } from "../admin/data/mockData";
import { loginRequest, registerRequest } from "./services/authService";
import { API_BASE_URL } from "../lib/apiClient";
import { getRoleName } from "./roleUtils";
import { AuthContext } from "./authContextStore";

const SESSION_KEY = "bookhub_session";
const TOKEN_KEY = "bookhub_token";
const REFRESH_TOKEN_KEY = "bookhub_refresh_token";
const REMEMBER_KEY = "bookhub_remember";
const AUTH_UNAUTHORIZED_EVENT = "bookhub:unauthorized";
const AUTHOR_PROFILE_KEY = "author_studio_profile";
const AUTHOR_PROFILE_UPDATED_EVENT = "author-profile-updated";
const DEFAULT_AUTHOR_NAME = "Alex Rivera";
const GENERIC_AUTHOR_NAMES = new Set(["User", "Author", DEFAULT_AUTHOR_NAME]);

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
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")
  );
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

function normalizeTokenValue(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (value && typeof value === "object") {
    return (
      value.token ||
      value.access_token ||
      value.accessToken ||
      value.jwt ||
      value.value ||
      null
    );
  }
  return null;
}

function saveToken(token, remember = false) {
  const normalizedToken = normalizeTokenValue(token);
  if (!normalizedToken) {
    return;
  }
  const activeStorage = remember ? localStorage : sessionStorage;
  const staleStorage = remember ? sessionStorage : localStorage;
  activeStorage.setItem(TOKEN_KEY, normalizedToken);
  staleStorage.removeItem(TOKEN_KEY);
}

function saveRefreshToken(refreshToken, remember = false) {
  const normalizedToken = normalizeTokenValue(refreshToken);
  if (!normalizedToken) {
    return;
  }
  const activeStorage = remember ? localStorage : sessionStorage;
  const staleStorage = remember ? sessionStorage : localStorage;
  activeStorage.setItem(REFRESH_TOKEN_KEY, normalizedToken);
  staleStorage.removeItem(REFRESH_TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function clearAuthStorage() {
  clearSession();
  clearToken();
  localStorage.removeItem(REMEMBER_KEY);
}

function extractAuthTokens(data = {}) {
  const sources = [data, data?.data, data?.tokens, data?.data?.tokens];
  const pick = (...keys) => {
    for (const source of sources) {
      if (!source || typeof source !== "object") continue;
      for (const key of keys) {
        if (source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== "") {
          return source[key];
        }
      }
    }
    return null;
  };

  return {
    accessToken: pick("token", "accessToken", "access_token", "jwt", "bearerToken", "bearer_token"),
    refreshToken: pick("refreshToken", "refresh_token"),
  };
}

function firstDefinedValue(values) {
  return values.find((value) => String(value ?? "").trim() !== "");
}

function isGenericAuthorName(name) {
  return GENERIC_AUTHOR_NAMES.has(String(name || "").trim());
}

function resolveBackendFullName(backendUser) {
  const firstName = backendUser?.first_name ?? backendUser?.firstname ?? "";
  const lastName = backendUser?.last_name ?? backendUser?.lastname ?? "";
  const joinedName = [firstName, lastName].filter(Boolean).join(" ");
  return firstDefinedValue([
    backendUser?.name,
    backendUser?.fullName,
    joinedName,
    backendUser?.username,
  ]);
}

function syncAuthorProfileFromAuth(sessionUser, backendUser) {
  if (typeof window === "undefined") return;
  if (getRoleName(sessionUser?.role) !== "Author") return;

  const resolvedName =
    resolveBackendFullName(backendUser) ||
    sessionUser?.name ||
    "Author";
  const resolvedEmail = firstDefinedValue([backendUser?.email, sessionUser?.email]);
  const resolvedUsername = firstDefinedValue([
    backendUser?.username,
    backendUser?.userName,
    resolvedEmail ? resolvedEmail.split("@")[0] : "",
  ]);

  let existingProfile = null;
  try {
    const raw = window.localStorage.getItem(AUTHOR_PROFILE_KEY);
    existingProfile = raw ? JSON.parse(raw) : null;
  } catch {
    existingProfile = null;
  }

  const shouldResetProfile =
    !existingProfile ||
    (resolvedEmail && existingProfile?.email && existingProfile.email !== resolvedEmail);

  const existingName = existingProfile?.name;
  const existingIsGeneric = isGenericAuthorName(existingName);
  const resolvedIsGeneric = isGenericAuthorName(resolvedName);

  const shouldUpdateName =
    shouldResetProfile ||
    !existingName ||
    (existingIsGeneric && !resolvedIsGeneric);


  const nextProfile = {
    ...(shouldResetProfile ? {} : existingProfile),
    ...(shouldUpdateName ? { name: resolvedName } : {}),
    ...(resolvedEmail ? { email: resolvedEmail } : {}),
    ...(resolvedUsername && !existingProfile?.username ? { username: resolvedUsername } : {}),
    tier: existingProfile?.tier || "Pro Author",
  };

  window.localStorage.setItem(AUTHOR_PROFILE_KEY, JSON.stringify(nextProfile));
  window.dispatchEvent(new Event(AUTHOR_PROFILE_UPDATED_EVENT));
}

function resolveSessionRole(backendUser, data, requestedRole) {
  const backendRole = firstDefinedValue([
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
    requestedRole,
  ]);
  return getRoleName(backendRole);
}

function extractRoleNameFromAuthResponse(responseData) {
  const data = responseData || {};
  const backendUser = data.user || data.data?.user || data;
  const backendRole = firstDefinedValue([
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
  return getRoleName(backendRole);
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

function getRoleWord(role) {
  return getRoleName(role);
}

function getRoleAliases(role) {
  const roleWord = getRoleWord(role);
  if (roleWord === "Admin") {
    return ["Admin", "admin", "Administrator", "administrator", "1"];
  }
  if (roleWord === "Author") {
    return ["Author", "author", "Writer", "writer", "2"];
  }
  return ["User", "user", "Reader", "reader", "Member", "member", "3"];
}

function getRoleIdByWord(role) {
  const roleWord = getRoleWord(role);
  if (roleWord === "Admin") {
    return 1;
  }
  if (roleWord === "Author") {
    return 2;
  }
  return 3;
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

function isRetryableAuthError(error) {
  const status = Number(error?.response?.status || 0);
  const text = getErrorMessageText(error).toLowerCase();
  const hasAuthStatus = status === 401 || status === 403 || status === 422;
  return (
    hasAuthStatus &&
    (text.includes("invalid credential") ||
      text.includes("invalid login") ||
      text.includes("unauthorized") ||
      text.includes("authentication failed") ||
      text.includes("email or password"))
  );
}

async function loginWithRoleFallbacks({ email, password, role }) {
  const rawEmail = String(email || "").trim();
  const normalizedEmail = rawEmail.toLowerCase();
  const emailCandidates = rawEmail === normalizedEmail ? [rawEmail] : [rawEmail, normalizedEmail];
  const requestModes = ["urlencoded", "multipart", "json"];
  const hasRequestedRole = String(role ?? "").trim() !== "";

  if (!hasRequestedRole) {
    const attempts = [];
    for (const candidateEmail of emailCandidates) {
      attempts.push(
        { email: candidateEmail, password },
        { email: candidateEmail, password, role_id: 1 },
        { email: candidateEmail, password, role_id: 2 },
        { email: candidateEmail, password, role_id: 3 },
        { email: candidateEmail, password, role: "Admin" },
        { email: candidateEmail, password, role: "Author" },
        { email: candidateEmail, password, role: "User" },
      );
    }

    let lastRoleError = null;
    let lastAuthError = null;
    for (const payload of attempts) {
      for (const mode of requestModes) {
        try {
          return await loginRequest(payload, { mode });
        } catch (error) {
          if (isRoleValidationError(error)) {
            lastRoleError = error;
            continue;
          }
          if (isRetryableAuthError(error)) {
            lastAuthError = error;
            continue;
          }
          throw error;
        }
      }
    }

    throw lastRoleError || lastAuthError || new Error("Unable to authenticate. Please try again.");
  }

  const requestedRoleName = getRoleWord(role);
  const roleId = getRoleIdByWord(requestedRoleName);
  const roleAliases = getRoleAliases(requestedRoleName);

  const attempts = [];
  for (const candidateEmail of emailCandidates) {
    for (const alias of roleAliases) {
      const numericAlias = Number(alias);
      if (Number.isFinite(numericAlias) && numericAlias > 0) {
        attempts.push({ email: candidateEmail, password, role_id: numericAlias });
      } else {
        attempts.push({ email: candidateEmail, password, role: alias, role_id: roleId });
        attempts.push({ email: candidateEmail, password, role: alias });
      }
    }
    attempts.push({ email: candidateEmail, password, role_id: roleId });
    attempts.push({ email: candidateEmail, password });
  }

  let lastRoleError = null;
  let lastAuthError = null;
  for (const payload of attempts) {
    for (const mode of requestModes) {
      try {
        const response = await loginRequest(payload, { mode });
        const responseRoleName = extractRoleNameFromAuthResponse(response?.data);

        if (responseRoleName !== requestedRoleName) {
          lastRoleError = new Error(
            `This account logged in as ${responseRoleName}. Please choose ${responseRoleName} role to continue.`,
          );
          continue;
        }

        return response;
      } catch (error) {
        if (isRoleValidationError(error)) {
          lastRoleError = error;
          continue;
        }
        if (isRetryableAuthError(error)) {
          lastAuthError = error;
          continue;
        }
        throw error;
      }
    }
  }

  throw lastRoleError || lastAuthError || new Error("Unable to authenticate with the selected role.");
}

async function registerWithRoleFallbacks({
  firstname,
  lastname,
  email,
  password,
  password_confirmation,
  role,
  role_id,
}) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const roleName = getRoleWord(role ?? role_id);
  const roleId = getRoleIdByWord(roleName);
  const roleAliases = getRoleAliases(roleName);

  const basePayload = {
    firstname,
    lastname,
    first_name: firstname,
    last_name: lastname,
    email: cleanEmail,
    password,
    password_confirmation,
  };

  const attempts = [];
  for (const alias of roleAliases) {
    const numericAlias = Number(alias);
    if (Number.isFinite(numericAlias) && numericAlias > 0) {
      attempts.push({ ...basePayload, role_id: numericAlias });
    } else {
      attempts.push({ ...basePayload, role: alias, role_id: roleId });
      attempts.push({ ...basePayload, role: alias });
    }
  }
  attempts.push({ ...basePayload, role_id: roleId });

  const requestModes = ["urlencoded", "multipart", "json"];

  let lastRoleError = null;
  let lastSpecificRoleError = null;
  for (const payload of attempts) {
    for (const mode of requestModes) {
      try {
        return await registerRequest(payload, { mode });
      } catch (error) {
        if (!isRoleValidationError(error)) {
          throw error;
        }
        lastRoleError = error;
        const roleText = getErrorMessageText(error).toLowerCase();
        if (!roleText.includes("required")) {
          lastSpecificRoleError = error;
        }
      }
    }
  }

  throw lastSpecificRoleError || lastRoleError;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedSession = getSession();
    const storedToken = getTokenFromStorage();


    if (!storedSession || !storedToken) {
      clearAuthStorage();
      setUser(null);
      setIsReady(true);
      return;
    }

    // if session + token exist → restore login
    setUser(storedSession);
    syncAuthorProfileFromAuth(storedSession, null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleUnauthorized = () => {
      clearAuthStorage();
      setUser(null);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);
  const value = useMemo(
    () => ({
      user,
      isReady,
      isAuthenticated: Boolean(user),
      login: async ({ email, password, remember = false, role } = {}) => {
        try {
          const response = await loginWithRoleFallbacks({ email, password, role });
          const data = response?.data || {};
          const backendUser = data.user || data.data?.user || data;
          const resolvedRole = resolveSessionRole(backendUser, data, role);
          const resolvedName = resolveBackendFullName(backendUser);

          const sessionUser = {
            id: backendUser?.id || backendUser?._id || backendUser?.userId || `u_${Date.now()}`,
            name: resolvedName || backendUser?.username || backendUser?.email || "User",
            email: backendUser?.email || String(email || "").trim().toLowerCase(),
            role: resolvedRole,
          };

          const { accessToken, refreshToken } = extractAuthTokens(data);

          if (!accessToken) {
            return { ok: false, error: "Login succeeded but no access token was returned by /api/auth/login." };
          }
          saveSession(sessionUser, Boolean(remember));
          saveToken(accessToken, Boolean(remember));
          saveRefreshToken(refreshToken, Boolean(remember));
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
      register: async ({
        firstname,
        lastname,
        email,
        password,
        password_confirmation,
        role,
        role_id,
      }) => {
        try {
          await registerWithRoleFallbacks({
            firstname,
            lastname,
            email,
            password,
            password_confirmation,
            role,
            role_id,
          });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: toErrorMessage(error, "Registration failed. Please try again.") };
        }
      },
      logout: () => {
        clearAuthStorage();
        setUser(null);
      },
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
