function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function getRoleLandingPath(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "author") {
    return "/author/dashboard";
  }

  if (normalizedRole === "reader") {
    return "/reader/dashboard";
  }

  return "/admin/dashboard";
}
