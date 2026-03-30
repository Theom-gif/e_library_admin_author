import { API_BASE_URL } from "../../lib/apiClient";

export const AUTHOR_PROFILE_KEY = "author_studio_profile";
export const AUTHOR_PROFILE_UPDATED_EVENT = "author-profile-updated";

const DEFAULT_AUTHOR_NAME = "Author";
const DEFAULT_AUTHOR_TIER = "Pro Author";

export const DEFAULT_AUTHOR_PROFILE = {
  id: null,
  firstname: "",
  lastname: "",
  name: DEFAULT_AUTHOR_NAME,
  fullName: DEFAULT_AUTHOR_NAME,
  username: "",
  email: "",
  bio: "",
  facebook_url: "",
  photo: "",
  photo_url: "",
  avatar: "",
  avatar_url: "",
  avatarUrl: "",
  tier: DEFAULT_AUTHOR_TIER,
};

function firstNonEmpty(values = []) {
  return values.find((value) => String(value ?? "").trim() !== "") ?? "";
}

function getBackendOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
}

export function resolveBackendAssetUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;

  const origin = getBackendOrigin();
  if (!origin) return raw;

  try {
    return new URL(raw, `${origin}/`).toString();
  } catch {
    return raw;
  }
}

export function resolveProfilePayload(payload) {
  const source = payload?.data ?? payload ?? {};
  return (
    source?.data?.user ||
    source?.data?.profile ||
    source?.user ||
    source?.profile ||
    source?.data ||
    source
  );
}

function buildFallbackAvatar(nameOrEmail) {
  const seed = encodeURIComponent(String(nameOrEmail || DEFAULT_AUTHOR_NAME).trim() || DEFAULT_AUTHOR_NAME);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

export function normalizeAuthorProfile(payload, currentProfile = {}) {
  const source = resolveProfilePayload(payload);
  const firstname = firstNonEmpty([
    source?.firstname,
    source?.first_name,
    currentProfile?.firstname,
  ]);
  const lastname = firstNonEmpty([
    source?.lastname,
    source?.last_name,
    currentProfile?.lastname,
  ]);
  const joinedName = [firstname, lastname].filter(Boolean).join(" ").trim();
  const fullName =
    firstNonEmpty([
      source?.fullName,
      source?.full_name,
      source?.name,
      joinedName,
      currentProfile?.fullName,
      currentProfile?.name,
    ]) || DEFAULT_AUTHOR_NAME;
  const email = firstNonEmpty([source?.email, currentProfile?.email]);
  const username = firstNonEmpty([
    source?.username,
    source?.userName,
    currentProfile?.username,
    email ? email.split("@")[0] : "",
  ]);
  const photo = firstNonEmpty([
    source?.photo,
    source?.avatar,
    currentProfile?.photo,
    currentProfile?.avatar,
  ]);
  const photoUrl = resolveBackendAssetUrl(
    firstNonEmpty([
      source?.photo_url,
      source?.avatar_url,
      source?.photoUrl,
      source?.avatarUrl,
      currentProfile?.photo_url,
      currentProfile?.avatar_url,
      currentProfile?.avatarUrl,
      photo,
    ]),
  );

  const normalized = {
    ...DEFAULT_AUTHOR_PROFILE,
    ...currentProfile,
    id: source?.id ?? currentProfile?.id ?? null,
    firstname,
    lastname,
    name: fullName,
    fullName,
    username,
    email,
    bio: firstNonEmpty([source?.bio, currentProfile?.bio]),
    facebook_url: firstNonEmpty([
      source?.facebook_url,
      source?.facebookUrl,
      currentProfile?.facebook_url,
    ]),
    photo,
    photo_url: photoUrl,
    avatar: photo,
    avatar_url: photoUrl,
    avatarUrl: photoUrl || buildFallbackAvatar(fullName || email),
    tier: currentProfile?.tier || DEFAULT_AUTHOR_TIER,
  };

  return normalized;
}

export function readAuthorProfileStorage() {
  if (typeof window === "undefined") {
    return normalizeAuthorProfile(DEFAULT_AUTHOR_PROFILE);
  }

  try {
    const raw = window.localStorage.getItem(AUTHOR_PROFILE_KEY);
    if (!raw) {
      return normalizeAuthorProfile(DEFAULT_AUTHOR_PROFILE);
    }

    return normalizeAuthorProfile(JSON.parse(raw));
  } catch {
    return normalizeAuthorProfile(DEFAULT_AUTHOR_PROFILE);
  }
}

export function writeAuthorProfileStorage(profile) {
  const normalized = normalizeAuthorProfile(profile, readAuthorProfileStorage());

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTHOR_PROFILE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event(AUTHOR_PROFILE_UPDATED_EVENT));
  }

  return normalized;
}

export function syncAuthorProfileStorage(profile) {
  const existing = readAuthorProfileStorage();
  return writeAuthorProfileStorage({ ...existing, ...normalizeAuthorProfile(profile, existing) });
}
