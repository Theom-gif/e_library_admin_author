export const getDisplayName = (user = {}) =>
  `${user.first_name || "Unknown"} ${user.last_name || ""}`.trim();

const ASSET_BASE = (() => {
  try {
    const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
    return base.replace(/\/api(?:\/.*)?$/i, "");
  } catch {
    return "";
  }
})();

const resolveAvatarSrc = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^data:|^blob:/i.test(url)) return url;
  // root-relative or storage-relative path — prefix with asset base
  const clean = String(url).replace(/^\/+/, "").replace(/^storage\/app\/public\//, "").replace(/^public\//, "");
  if (clean.startsWith("storage/")) return `${ASSET_BASE}/${clean}`;
  return `${ASSET_BASE}/storage/${clean}`;
};

export const getAvatarUrl = (user) => {
  const raw =
    user?.avatar_url ||
    user?.avatarUrl ||
    user?.profile_photo_url ||
    user?.profile_image ||
    user?.photo ||
    null;
  const resolved = resolveAvatarSrc(raw);
  if (resolved) return resolved;
  const name = encodeURIComponent(getDisplayName(user) || "User");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=6366f1&textColor=ffffff`;
};

export const getUserHandle = (user = {}) => {
  const local = user?.email ? String(user.email).split("@")[0] : "";
  return local ? `@${local}` : "@reader";
};

export const formatCompactNumber = (value) =>
  new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export const formatMemberSince = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
