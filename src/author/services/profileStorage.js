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
  profile_image: "",
  profile_image_url: "",
  avatar: "",
  avatar_url: "",
  avatarUrl: "",
  tier: DEFAULT_AUTHOR_TIER,
};

function firstNonEmpty(values = []) {
  return values.find((value) => String(value ?? "").trim() !== "") ?? "";
}

function uniqueNonEmpty(values = []) {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );
}

function getBackendOrigin() {
  try {
    const parsed = new URL(API_BASE_URL);
    const normalizedPath = String(parsed.pathname || "").replace(/\/+$/, "");
    const assetPath = normalizedPath.replace(/\/api(?:\/.*)?$/i, "");
    return `${parsed.origin}${assetPath}`;
  } catch {
    return "";
  }
}

function isLoopbackHost(host = "") {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

export function resolveBackendAssetUrl(value) {
  return buildBackendAssetUrlCandidates(value)[0] || String(value || "").trim();
}

export function buildBackendAssetUrlCandidates(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  if (/^(?:https?:|data:|blob:)/i.test(raw)) return [raw];

  const assetBase = getBackendOrigin();
  if (!assetBase) return [raw];

  try {
    const cleanPath = raw
      .replace(/^\/+/, "")
      .replace(/^storage\/app\/public\//i, "")
      .replace(/^public\//i, "");
    const storagePath = cleanPath.startsWith("storage/")
      ? cleanPath
      : `storage/${cleanPath}`;
    const publicStoragePath = cleanPath.startsWith("public/storage/")
      ? cleanPath
      : `public/storage/${cleanPath.replace(/^storage\//i, "")}`;
    const directPath = cleanPath;
    const publicPath = cleanPath.startsWith("public/")
      ? cleanPath
      : `public/${cleanPath}`;
    const candidatePaths = uniqueNonEmpty([
      directPath,
      storagePath,
      publicStoragePath,
      publicPath,
    ]);

    return candidatePaths.map((path) => {
      const resolvedUrl = new URL(path, `${assetBase}/`);

      if (typeof window !== "undefined" && window.location?.hostname) {
        const currentHost = window.location.hostname;
        if (!isLoopbackHost(currentHost) && isLoopbackHost(resolvedUrl.hostname)) {
          resolvedUrl.hostname = currentHost;
        }
      }

      return resolvedUrl.toString();
    });
  } catch {
    return [raw];
  }
}

export function buildAuthorPhotoCandidates(profile = {}) {
  return uniqueNonEmpty(
    [
      profile?.avatarUrl,
      profile?.avatar_url,
      profile?.photo_url,
      profile?.profile_image_url,
      profile?.photo,
      profile?.avatar,
      profile?.profile_image,
    ].flatMap((value) => buildBackendAssetUrlCandidates(value)),
  );
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
    source?.profile_image,
    currentProfile?.photo,
    currentProfile?.avatar,
    currentProfile?.profile_image,
  ]);
  const photoUrl = resolveBackendAssetUrl(
    firstNonEmpty([
      source?.photo_url,
      source?.avatar_url,
      source?.profile_image_url,
      source?.photoUrl,
      source?.avatarUrl,
      source?.photo,
      source?.avatar,
      source?.profile_image,
      currentProfile?.photo_url,
      currentProfile?.profile_image_url,
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
    profile_image: photo,
    profile_image_url: photoUrl,
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
