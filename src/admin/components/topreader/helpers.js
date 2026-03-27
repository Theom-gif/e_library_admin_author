export const getDisplayName = (user = {}) =>
  `${user.first_name || "Unknown"} ${user.last_name || ""}`.trim();

export const getAvatarUrl = (user) => {
  if (user?.avatar_url) return user.avatar_url;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}&background=e2e8f0&color=1e293b`;
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
