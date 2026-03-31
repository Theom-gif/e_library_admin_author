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

async function fetchCurrentProfilePayloads() {
  const [profileResult, meResult] = await Promise.allSettled([
    apiClient.get("/me/profile"),
    apiClient.get("/me"),
  ]);

  const payloads = [];

  if (profileResult.status === "fulfilled") {
    payloads.push(profileResult.value?.data);
  } else if (!isNotFound(profileResult.reason)) {
    throw profileResult.reason;
  }

  if (meResult.status === "fulfilled") {
    payloads.push(meResult.value?.data);
  } else if (payloads.length === 0) {
    throw meResult.reason;
  }

  if (payloads.length === 0) {
    throw new Error("Unable to load your profile.");
  }

  return payloads;
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

function buildPhotoPayloadSeed(payload = {}, currentProfile = {}) {
  const photo =
    payload?.photo ||
    payload?.avatar ||
    payload?.profile_image ||
    currentProfile.photo ||
    currentProfile.profile_image;
  const photoUrl =
    payload?.photo_url ||
    payload?.avatar_url ||
    payload?.avatarUrl ||
    payload?.profile_image_url ||
    payload?.photo ||
    payload?.avatar ||
    currentProfile.photo_url ||
    currentProfile.profile_image_url ||
    currentProfile.avatar_url ||
    currentProfile.avatarUrl;

  return {
    photo,
    photo_url: photoUrl,
    profile_image: payload?.profile_image || photo || currentProfile.profile_image,
    profile_image_url:
      payload?.profile_image_url || photoUrl || currentProfile.profile_image_url,
    avatar: payload?.avatar || photo || currentProfile.avatar,
    avatar_url: payload?.avatar_url || photoUrl || currentProfile.avatar_url,
    avatarUrl: payload?.avatarUrl || photoUrl || currentProfile.avatarUrl,
  };
}

export function useUserProfile({ autoFetch = true } = {}) {
  const [profile, setProfile] = useState(() => readAuthorProfileStorage());
  const [loading, setLoading] = useState(Boolean(autoFetch));
  const [error, setError] = useState("");

  const hydrateProfileFromPayloads = useCallback((payloads = [], seedProfile = readAuthorProfileStorage()) => {
    const mergedProfile = payloads.reduce((currentProfile, payload) => ({
      ...currentProfile,
      ...normalizeAuthorProfile(payload, currentProfile),
    }), seedProfile);

    return syncAuthorProfileStorage(mergedProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payloads = await fetchCurrentProfilePayloads();
      const nextProfile = hydrateProfileFromPayloads(payloads);
      setProfile(nextProfile);
      return nextProfile;
    } catch (requestError) {
      const message = toErrorMessage(requestError, "Unable to load your profile.");
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [hydrateProfileFromPayloads]);

  const updateProfile = useCallback(async (payload) => {
    try {
      const currentProfile = readAuthorProfileStorage();
      const response = await apiClient.put("/me/profile", payload);
      const nextPhotoSeed = buildPhotoPayloadSeed(payload, currentProfile);
      const hasPhotoUpdate = Boolean(
        payload?.photo ||
          payload?.photo_url ||
          payload?.profile_image ||
          payload?.profile_image_url ||
          payload?.avatar ||
          payload?.avatar_url ||
          payload?.avatarUrl,
      );
      let mergedProfile = syncAuthorProfileStorage({
        ...currentProfile,
        ...payload,
        ...(hasPhotoUpdate
          ? nextPhotoSeed
          : {
              photo: currentProfile.photo,
              photo_url: currentProfile.photo_url,
              profile_image: currentProfile.profile_image,
              profile_image_url: currentProfile.profile_image_url,
              avatar: currentProfile.avatar,
              avatar_url: currentProfile.avatar_url,
              avatarUrl: currentProfile.avatarUrl,
            }),
      });
      try {
        const payloads = [response?.data, ...(await fetchCurrentProfilePayloads())];
        mergedProfile = hydrateProfileFromPayloads(payloads, mergedProfile);
      } catch {
        // Keep optimistic merged profile when follow-up refresh is unavailable.
      }
      setProfile(mergedProfile);
      return mergedProfile;
    } catch (requestError) {
      throw toRequestError(requestError, "Unable to update your profile.");
    }
  }, [hydrateProfileFromPayloads]);

  const uploadAvatar = useCallback(async (file) => {
    const fieldNames = ["photo", "avatar", "profile_image"];
    let lastError = null;

    for (const fieldName of fieldNames) {
      try {
        const response = await uploadAvatarRequest(file, fieldName);
        const currentProfile = readAuthorProfileStorage();
        const seededProfile = {
          ...currentProfile,
          photo_url: "",
          profile_image_url: "",
          avatar_url: "",
          avatarUrl: "",
        };
        let mergedProfile = syncAuthorProfileStorage({
          ...currentProfile,
          ...seededProfile,
        });
        try {
          const payloads = [response?.data, ...(await fetchCurrentProfilePayloads())];
          mergedProfile = hydrateProfileFromPayloads(payloads, mergedProfile);
        } catch {
          // Keep optimistic seeded profile when follow-up refresh is unavailable.
        }
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
  }, [hydrateProfileFromPayloads]);

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
