export const extractApiErrorMessage = (error, fallbackMessage) => {
  const fallback = fallbackMessage || "Something went wrong. Please try again.";
  if (!error) {
    return fallback;
  }

  const status = Number(error?.response?.status || 0);
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  const message =
    data?.message ||
    data?.error ||
    error?.message ||
    "";
  if (String(message || "").trim()) {
    return String(message).trim();
  }

  const errors = data?.errors;
  if (errors && typeof errors === "object") {
    const messages = Object.values(errors)
      .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
      .filter(Boolean)
      .map((entry) => String(entry).trim())
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.slice(0, 3).join(" ");
    }
  }

  if (status) {
    return `Request failed with status ${status}. Please try again.`;
  }

  return fallback;
};
