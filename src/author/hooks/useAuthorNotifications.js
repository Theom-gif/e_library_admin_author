import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAuthorFeedback, fetchAuthorNotifications } from "../../admin/services/adminService";
import { getBooksRequest } from "../services/bookService";
import { normalizeAuthorFeedbackEntry } from "../services/feedbackUtils";

const BOOK_NOTIFICATION_STATUSES = new Set(["Approved", "Rejected"]);
const AUTHOR_NOTIFICATION_READ_KEY = "author_notification_read_state";

function readNotificationReadState() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(AUTHOR_NOTIFICATION_READ_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeNotificationReadState(value) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUTHOR_NOTIFICATION_READ_KEY, JSON.stringify(value));
}

function toNotificationTimestamp(value) {
  const text = String(value || "").trim();
  if (!text) return 0;

  const parsed = new Date(text).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function createBookStatusNotifications(books = []) {
  return books
    .filter((book) => BOOK_NOTIFICATION_STATUSES.has(String(book?.status || "").trim()))
    .sort((left, right) => {
      const leftTime = toNotificationTimestamp(left?.updatedAt || left?.createdAt);
      const rightTime = toNotificationTimestamp(right?.updatedAt || right?.createdAt);
      return rightTime - leftTime;
    })
    .slice(0, 8)
    .map((book) => {
      const isApproved = String(book?.status || "").trim() === "Approved";
      return {
        id: `book-status-${book.id}-${String(book?.status || "").toLowerCase()}`,
        type: isApproved ? "book_approved" : "book_rejected",
        message: isApproved
          ? `Your book "${book.title}" was approved`
          : `Your book "${book.title}" was rejected`,
        description: isApproved
          ? "An admin approved one of your uploaded books."
          : "An admin rejected one of your uploaded books.",
        read: false,
        created_at: book?.updatedAt || book?.createdAt || "",
        source: "fallback",
      };
    });
}

function createReaderFeedbackNotifications(feedbackRows = []) {
  return feedbackRows.map((feedback) => {
    const normalized = normalizeAuthorFeedbackEntry(feedback);
    const rating = Number(normalized?.rating);
    const hasRating = Number.isFinite(rating) && rating > 0;
    const hasComment = Boolean(String(normalized.comment || "").trim());
    const actionLabel = hasRating
      ? `rated "${normalized.book || "your book"}" ${rating}/5`
      : hasComment
        ? `commented on "${normalized.book || "your book"}"`
        : `interacted with "${normalized.book || "your book"}"`;

    return {
      id: `reader-feedback-${normalized.id}`,
      type: "reader_feedback",
      message: `${normalized.user || "A reader"} ${actionLabel}`,
      description: String(
        normalized.comment || "A reader left new feedback on your uploaded book.",
      ).trim(),
      read: false,
      created_at: normalized.createdAt || "",
      source: "fallback",
    };
  });
}

function dedupeNotifications(notifications = []) {
  const seenKeys = new Set();

  return notifications.filter((notification) => {
    const dedupeKey = [
      String(notification?.type || "").trim().toLowerCase(),
      String(notification?.message || "").trim().toLowerCase(),
      String(notification?.created_at || "").trim(),
    ].join("|");

    if (seenKeys.has(dedupeKey)) {
      return false;
    }

    seenKeys.add(dedupeKey);
    return true;
  });
}

async function loadAuthorNotificationFeed() {
  const [authorNotificationsResult, feedbackResult, booksResult] = await Promise.allSettled([
    fetchAuthorNotifications(),
    fetchAuthorFeedback(10, "all"),
    getBooksRequest({ status: "All" }),
  ]);

  const directNotifications =
    authorNotificationsResult.status === "fulfilled" && Array.isArray(authorNotificationsResult.value)
      ? authorNotificationsResult.value
      : [];
  const feedbackNotifications =
    feedbackResult.status === "fulfilled" && Array.isArray(feedbackResult.value)
      ? createReaderFeedbackNotifications(feedbackResult.value)
      : [];
  const bookStatusNotifications =
    booksResult.status === "fulfilled" && Array.isArray(booksResult.value)
      ? createBookStatusNotifications(booksResult.value)
      : [];

  const notifications = dedupeNotifications([
    ...directNotifications,
    ...feedbackNotifications,
    ...bookStatusNotifications,
  ]).sort((left, right) => {
    return toNotificationTimestamp(right?.created_at) - toNotificationTimestamp(left?.created_at);
  });

  if (notifications.length > 0) {
    return {
      notifications,
      error: "",
    };
  }

  const firstFailure = [authorNotificationsResult, feedbackResult, booksResult].find(
    (result) => result.status === "rejected",
  );

  return {
    notifications: [],
    error:
      firstFailure?.reason?.response?.data?.message ||
      firstFailure?.reason?.message ||
      "",
  };
}

export function useAuthorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readState, setReadState] = useState(() => readNotificationReadState());

  useEffect(() => {
    writeNotificationReadState(readState);
  }, [readState]);

  const applyReadState = useCallback(
    (items = []) =>
      items.map((notification) => ({
        ...notification,
        read: Boolean(notification?.read || readState[notification.id]),
      })),
    [readState],
  );

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await loadAuthorNotificationFeed();
      setNotifications(applyReadState(result.notifications));
      setError(result.error);
      return result.notifications;
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to load notifications.";
      setNotifications([]);
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [applyReadState]);

  const markNotificationRead = useCallback((id) => {
    if (!id) return;

    setReadState((current) => ({ ...current, [id]: true }));
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback((ids = []) => {
    setNotifications((current) => {
      const targetIds = ids.length > 0 ? new Set(ids) : new Set(current.map((notification) => notification.id));
      if (targetIds.size === 0) return current;

      setReadState((existing) => {
        const next = { ...existing };
        targetIds.forEach((id) => {
          if (id) {
            next[id] = true;
          }
        });
        return next;
      });

      return current.map((notification) =>
        targetIds.has(notification.id) ? { ...notification, read: true } : notification,
      );
    });
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markNotificationRead,
    markAllAsRead,
  };
}
