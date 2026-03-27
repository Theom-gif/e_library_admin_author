export const normalizeUser = (u) => ({
  id: u?.id ?? "",
  role: u?.role ?? "User",
  first_name: u?.first_name ?? "",
  last_name: u?.last_name ?? "",
  email: u?.email ?? "",
  avatar_url: u?.avatar_url || u?.profile_image || u?.avatar || "",
  created_at: u?.created_at ?? "",
});

export const roleStyle = (role) => {
  if (role === "Admin") return { bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.35)", text: "#fca5a5" };
  if (role === "Author") return { bg: "rgba(234,179,8,0.14)", border: "rgba(234,179,8,0.35)", text: "#fde047" };
  return { bg: "rgba(99,102,241,0.14)", border: "rgba(99,102,241,0.35)", text: "#a5b4fc" };
};

export const accessLabel = (role) => {
  if (role === "Admin") return "System Administrator";
  if (role === "Author") return "Content Creator";
  return "Standard Reader";
};
