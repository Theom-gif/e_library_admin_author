import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAuthorFeedback, fetchAuthorNotifications } from "../../admin/services/adminService";
import { getBooksRequest } from "../services/bookService";

const BOOK_NOTIFICATION_STATUSES = new Set(["Approved", "Rejected"]);

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
    const rating = Number(feedback?.rating);
    const ratingLabel = Number.isFinite(rating) ? `${rating}/5` : "your book";

    return {
      id: `reader-feedback-${feedback?.id ?? `${feedback?.bookId}-${feedback?.createdAt}`}`,
      type: "reader_feedback",
      message: `${feedback?.readerName || "A reader"} rated "${feedback?.bookTitle || "your book"}" ${ratingLabel}`,
      description: String(feedback?.comment || "A reader left new feedback on your uploaded book.").trim(),
      read: false,
      created_at: feedback?.createdAt || feedback?.created_at || "",
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

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await loadAuthorNotificationFeed();
      setNotifications(result.notifications);
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
  };
}
