export const AUTH_LOGOUT_EVENT = "bookhub-auth-logout";
export const AUTH_LOGOUT_REASON_KEY = "bookhub_logout_reason";

export const emitAuthLogout = (reason) => {
  if (typeof window === "undefined") {
    return;
  }

  if (reason) {
    try {
      window.sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, String(reason));
    } catch {
      // Ignore storage failures.
    }
  }

  window.dispatchEvent(
    new CustomEvent(AUTH_LOGOUT_EVENT, {
      detail: { reason },
    }),
  );
};

export const consumeLogoutReason = () => {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const reason = window.sessionStorage.getItem(AUTH_LOGOUT_REASON_KEY) || "";
    window.sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
    return reason;
  } catch {
    return "";
  }
};
