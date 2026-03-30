import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import {
  normalizeAuthorProfile,
  readAuthorProfileStorage,
  syncAuthorProfileStorage,
} from "../services/profileStorage";

function toErrorMessage(error, fallbackMessage) {
  const validationErrors = error?.response?.data?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    const messages = Object.values(validationErrors)
      .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
      .filter(Boolean)
      .map((entry) => String(entry).trim())
      .filter(Boolean);

    if (messages.length > 0) {
      return messages[0];
    }
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

function toRequestError(error, fallbackMessage) {
  const wrappedError = new Error(toErrorMessage(error, fallbackMessage));
  wrappedError.response = error?.response;
  wrappedError.originalError = error;
  return wrappedError;
}

function isNotFound(error) {
  return Number(error?.response?.status || 0) === 404;
}

async function fetchCurrentProfileRequest() {
  try {
    return await apiClient.get("/me/profile");
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }

    return apiClient.get("/me");
  }
}

async function uploadAvatarRequest(file, fieldName) {
  const formData = new FormData();
  formData.append(fieldName, file);

  return apiClient.post("/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function useUserProfile({ autoFetch = true } = {}) {
  const [profile, setProfile] = useState(() => readAuthorProfileStorage());
  const [loading, setLoading] = useState(Boolean(autoFetch));
  const [error, setError] = useState("");

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchCurrentProfileRequest();
      const nextProfile = syncAuthorProfileStorage(response?.data);
      setProfile(nextProfile);
      return nextProfile;
    } catch (requestError) {
      const message = toErrorMessage(requestError, "Unable to load your profile.");
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    try {
      const response = await apiClient.put("/me/profile", payload);
      const mergedProfile = syncAuthorProfileStorage({
        ...readAuthorProfileStorage(),
        ...payload,
        ...normalizeAuthorProfile(response?.data, readAuthorProfileStorage()),
      });
      setProfile(mergedProfile);
      return mergedProfile;
    } catch (requestError) {
      throw toRequestError(requestError, "Unable to update your profile.");
    }
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    const fieldNames = ["photo", "avatar"];
    let lastError = null;

    for (const fieldName of fieldNames) {
      try {
        const response = await uploadAvatarRequest(file, fieldName);
        const mergedProfile = syncAuthorProfileStorage({
          ...readAuthorProfileStorage(),
          ...normalizeAuthorProfile(response?.data, readAuthorProfileStorage()),
        });
        setProfile(mergedProfile);
        return mergedProfile;
      } catch (requestError) {
        lastError = requestError;
        const status = Number(requestError?.response?.status || 0);
        if (status !== 422) {
          break;
        }
      }
    }

    throw toRequestError(lastError, "Unable to upload your photo.");
  }, []);

  const changePassword = useCallback(async ({ current_password, new_password }) => {
    try {
      const response = await apiClient.post("/auth/change-password", {
        current_password,
        new_password,
      });

      if (response?.data?.success === false) {
        throw new Error(response?.data?.message || "Password update failed.");
      }

      return response?.data || {};
    } catch (requestError) {
      throw toRequestError(requestError, "Unable to update your password.");
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return undefined;

    refreshProfile().catch(() => {});
    return undefined;
  }, [autoFetch, refreshProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
  };
}
