import { resolveBackendAssetUrl } from "./profileStorage";

function firstNonEmpty(values = []) {
  return values.find((value) => String(value ?? "").trim() !== "") ?? "";
}

function firstFiniteNumber(values = [], fallback = 0) {
  for (const value of values) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return fallback;
}

function joinName(...parts) {
  return parts
    .flat()
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function buildAvatarUrl(name) {
  const seed = encodeURIComponent(String(name || "Reader").trim() || "Reader");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}
  
export function feedbackTimeAgo(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";

  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;
  return new Date(value).toLocaleDateString();
}

export function normalizeAuthorFeedbackEntry(item = {}, uiState = {}) {
  const id = firstNonEmpty([
    item?.id,
    item?.review_id,
    item?.comment_id,
    `${item?.bookId ?? item?.book?.id ?? "book"}-${item?.createdAt ?? item?.created_at ?? Date.now()}`,
  ]);

  const userName = firstNonEmpty([
    item?.userName,
    item?.readerName,
    item?.reader_name,
    item?.user_name,
    item?.username,
    item?.name,
    item?.full_name,
    joinName(item?.first_name, item?.last_name),
    joinName(item?.firstname, item?.lastname),
    item?.user?.name,
    item?.user?.userName,
    item?.user?.full_name,
    item?.user?.username,
    joinName(item?.user?.first_name, item?.user?.last_name),
    joinName(item?.user?.firstname, item?.user?.lastname),
    item?.reader?.name,
    item?.reader?.userName,
    item?.reader?.full_name,
    joinName(item?.reader?.first_name, item?.reader?.last_name),
    joinName(item?.reader?.firstname, item?.reader?.lastname),
    item?.reviewer?.name,
    item?.reviewer?.userName,
    joinName(item?.reviewer?.first_name, item?.reviewer?.last_name),
    joinName(item?.reviewer?.firstname, item?.reviewer?.lastname),
    item?.commenter?.name,
    item?.commenter?.userName,
    joinName(item?.commenter?.first_name, item?.commenter?.last_name),
    joinName(item?.commenter?.firstname, item?.commenter?.lastname),
  ]) || "Reader";

  const bookTitle = firstNonEmpty([
    item?.bookTitle,
    item?.book_title,
    item?.title,
    item?.book?.title,
    item?.book?.bookTitle,
    item?.book?.book_title,
    item?.book?.name,
    item?.book_name,
    item?.novel_title,
  ]) || "Unknown Book";

  const createdAt = firstNonEmpty([
    item?.createdAt,
    item?.created_at,
    item?.updatedAt,
    item?.updated_at,
    item?.reviewed_at,
    item?.commented_at,
    item?.timestamp,
  ]);

  const comment = firstNonEmpty([
    item?.comment,
    item?.content,
    item?.body,
    item?.message,
    item?.review,
    item?.review_text,
    item?.comment_text,
    item?.feedback_text,
    item?.text,
    item?.description,
    item?.feedback?.comment,
    item?.feedback?.content,
    item?.feedback?.message,
    item?.review?.comment,
    item?.review?.content,
    item?.review?.message,
  ]);

  const avatarUrl = resolveBackendAssetUrl(
    firstNonEmpty([
      item?.userAvatar,
      item?.avatar,
      item?.avatar_url,
      item?.avatarUrl,
      item?.photo,
      item?.photo_url,
      item?.user?.avatar,
      item?.user?.avatar_url,
      item?.user?.avatarUrl,
      item?.user?.userAvatar,
      item?.user?.photo,
      item?.user?.photo_url,
      item?.reader?.avatar,
      item?.reader?.avatar_url,
      item?.reader?.avatarUrl,
      item?.reader?.userAvatar,
      item?.reviewer?.avatar,
      item?.reviewer?.avatar_url,
      item?.reviewer?.avatarUrl,
      item?.commenter?.avatar,
      item?.commenter?.avatar_url,
      item?.commenter?.avatarUrl,
    ]),
  );

  const ratingValue = firstFiniteNumber([
    item?.rating,
    item?.stars,
    item?.score,
    item?.rate,
    item?.review_rating,
    item?.rating_value,
    item?.book_rating,
    item?.average_rating,
    item?.averageRating,
    item?.userRating,
    item?.star,
    item?.star_rating,
    item?.pivot?.rating,
    item?.pivot?.score,
    item?.feedback?.rating,
    item?.feedback?.score,
    item?.feedback?.stars,
    item?.review?.rating,
    item?.review?.score,
    item?.review?.stars,
  ]);

  const state = uiState[id] || {};
  const reply = String(state.authorReply || "").trim();
  const helpfulCount = firstFiniteNumber([state.helpful, item?.helpful, item?.helpful_count, item?.likes], 0);
  const notHelpfulCount = firstFiniteNumber([state.notHelpful, item?.notHelpful, item?.not_helpful], 0);
  const backendStatus = firstNonEmpty([item?.status, item?.feedback_status]);
  const normalizedStatus = reply
    ? "Replied"
    : state.status ||
      (backendStatus
        ? String(backendStatus).trim().charAt(0).toUpperCase() + String(backendStatus).trim().slice(1)
        : "Unread");

  return {
    id,
    userId: firstNonEmpty([item?.userId, item?.user_id, item?.user?.id, item?.reader?.id, item?.reviewer?.id]),
    bookId: firstNonEmpty([item?.bookId, item?.book_id, item?.book?.id]),
    user: userName,
    book: bookTitle,
    rating: Number.isFinite(ratingValue) ? ratingValue : 0,
    comment,
    time: firstNonEmpty([item?.timeAgo, item?.time_ago]) || feedbackTimeAgo(createdAt),
    createdAt,
    status: normalizedStatus,
    avatar: avatarUrl || buildAvatarUrl(userName),
    helpful: helpfulCount,
    notHelpful: notHelpfulCount,
    authorReply: reply,
  };
}
