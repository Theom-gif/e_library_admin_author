const USER_AUTHOR_REQUEST_NOTIFICATIONS_KEY = "bookhub_user_author_request_notifications";
const ADMIN_HANDLED_AUTHOR_REQUESTS_KEY = "bookhub_admin_handled_author_requests";

const toText = (value) => String(value || "").trim();
const toEmail = (value) => toText(value).toLowerCase();

export function toNotificationTimestamp(value) {
  const text = toText(value);
  if (!text) return 0;
  const parsed = new Date(text).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createAdminAuthorRequestNotifications(requests = []) {
  return requests
    .filter((request) => toText(request?.id))
    .map((request) => ({
      id: `author-request-pending-${request.id}`,
      type: "author_request_pending",
      message: `${request.name || "A reader"} requested author access`,
      description: request.email
        ? `${request.email}${request.motivation ? ` · ${request.motivation}` : ""}`
        : request.motivation || "Pending author request",
      read: false,
      created_at: request.requested_at || request.created_at || new Date().toISOString(),
      targetPath: "/admin/authors",
      targetState: {
        openRequestId: request.id,
        focusRequestId: request.id,
      },
      requestId: request.id,
    }))
    .sort((left, right) => toNotificationTimestamp(right.created_at) - toNotificationTimestamp(left.created_at));
}

export function mergeNotifications(...groups) {
  const seen = new Set();
  const merged = groups
    .flat()
    .filter(Boolean)
    .filter((notification) => {
      const key = [
        toText(notification.id),
        toText(notification.type).toLowerCase(),
        toText(notification.message).toLowerCase(),
      ].join("|");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => toNotificationTimestamp(right?.created_at) - toNotificationTimestamp(left?.created_at));

  return merged;
}

function readStoredUserNotifications() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(USER_AUTHOR_REQUEST_NOTIFICATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredUserNotifications(notifications = []) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    USER_AUTHOR_REQUEST_NOTIFICATIONS_KEY,
    JSON.stringify(Array.isArray(notifications) ? notifications : []),
  );
}

export function addUserAuthorRequestNotification(request = {}, action = "approved") {
  if (typeof window === "undefined") return null;

  const recipientUserId = toText(request?.user_id || request?.userId || request?.id);
  const recipientEmail = toText(request?.email).toLowerCase();

  if (!recipientUserId && !recipientEmail) {
    return null;
  }

  const approved = action === "approved";
  const notification = {
    id: `author-request-${approved ? "approved" : "rejected"}-${request?.id || recipientEmail || Date.now()}-${Date.now()}`,
    type: approved ? "author_request_approved" : "author_request_rejected",
    message: approved
      ? "Your request to become an author was approved"
      : "Your request to become an author was rejected",
    description: approved
      ? "You passed the author review. Please check your email for next steps."
      : "Your request did not pass the author review. Please check your email for details.",
    created_at: new Date().toISOString(),
    read: false,
    recipientUserId,
    recipientEmail,
    requestId: toText(request?.id),
  };

  const current = readStoredUserNotifications();
  writeStoredUserNotifications([notification, ...current].slice(0, 50));
  return notification;
}

export function getUserAuthorRequestNotifications({ userId, email } = {}) {
  const normalizedUserId = toText(userId);
  const normalizedEmail = toText(email).toLowerCase();

  return readStoredUserNotifications()
    .filter((notification) => {
      const matchesUserId =
        normalizedUserId &&
        toText(notification?.recipientUserId) &&
        toText(notification.recipientUserId) === normalizedUserId;
      const matchesEmail =
        normalizedEmail &&
        toText(notification?.recipientEmail).toLowerCase() === normalizedEmail;

      return matchesUserId || matchesEmail;
    })
    .sort((left, right) => toNotificationTimestamp(right?.created_at) - toNotificationTimestamp(left?.created_at));
}

export function markUserAuthorRequestNotificationRead(notificationId) {
  if (typeof window === "undefined" || !notificationId) return;

  const current = readStoredUserNotifications();
  const next = current.map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification,
  );
  writeStoredUserNotifications(next);
}

function readStoredHandledAdminRequests() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ADMIN_HANDLED_AUTHOR_REQUESTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredHandledAdminRequests(requests = []) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ADMIN_HANDLED_AUTHOR_REQUESTS_KEY,
    JSON.stringify(Array.isArray(requests) ? requests.slice(0, 100) : []),
  );
}

export function getHandledAdminAuthorRequestIds() {
  return readStoredHandledAdminRequests()
    .map((value) => toText(value))
    .filter(Boolean);
}

export function getAdminAuthorRequestKey(request = {}) {
  if (typeof request === "string" || typeof request === "number") {
    const directKey = toText(request);
    return directKey || "";
  }

  const email = toEmail(request?.email || request?.recipientEmail);
  if (email) {
    return `email:${email}`;
  }

  const authorId = toText(request?.author_id || request?.authorId || request?.id || request?.requestId);
  if (authorId) {
    return `author:${authorId}`;
  }

  return "";
}

export function addHandledAdminAuthorRequestId(requestId) {
  const normalizedId = getAdminAuthorRequestKey(requestId);
  if (!normalizedId) return;

  const next = [normalizedId, ...getHandledAdminAuthorRequestIds().filter((value) => value !== normalizedId)];
  writeStoredHandledAdminRequests(next);
}

export function clearHandledAdminAuthorRequestId(requestId) {
  const normalizedId = getAdminAuthorRequestKey(requestId);
  if (!normalizedId) return;

  writeStoredHandledAdminRequests(
    getHandledAdminAuthorRequestIds().filter((value) => value !== normalizedId),
  );
}
