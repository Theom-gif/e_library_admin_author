import { resolveBackendAssetUrl } from "./profileStorage";

function firstNonEmpty(values = []) {
  return values.find((value) => String(value ?? "").trim() !== "") ?? "";
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
    item?.readerName,
    item?.reader_name,
    item?.user_name,
    item?.username,
    item?.name,
    item?.full_name,
    item?.user?.name,
    item?.user?.full_name,
    item?.user?.username,
    item?.reader?.name,
    item?.reader?.full_name,
    item?.reviewer?.name,
    item?.commenter?.name,
  ]) || "Reader";

  const bookTitle = firstNonEmpty([
    item?.bookTitle,
    item?.book_title,
    item?.title,
    item?.book?.title,
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
  ]);

  const comment = firstNonEmpty([
    item?.comment,
    item?.content,
    item?.body,
    item?.message,
    item?.review,
    item?.review_text,
    item?.text,
    item?.description,
  ]);

  const avatarUrl = resolveBackendAssetUrl(
    firstNonEmpty([
      item?.avatar,
      item?.avatar_url,
      item?.avatarUrl,
      item?.photo,
      item?.photo_url,
      item?.user?.avatar,
      item?.user?.avatar_url,
      item?.user?.avatarUrl,
      item?.user?.photo,
      item?.user?.photo_url,
      item?.reader?.avatar,
      item?.reader?.avatar_url,
      item?.reviewer?.avatar,
      item?.commenter?.avatar,
    ]),
  );

  const ratingValue = Number(
    firstNonEmpty([
      item?.rating,
      item?.stars,
      item?.score,
      item?.rate,
      item?.review_rating,
    ]),
  );

  const state = uiState[id] || {};
  const reply = String(state.authorReply || "").trim();

  return {
    id,
    user: userName,
    book: bookTitle,
    rating: Number.isFinite(ratingValue) ? ratingValue : 0,
    comment,
    time: feedbackTimeAgo(createdAt),
    createdAt,
    status: reply ? "Replied" : state.status || "Unread",
    avatar: avatarUrl || buildAvatarUrl(userName),
    helpful: Number(state.helpful) || 0,
    notHelpful: Number(state.notHelpful) || 0,
    authorReply: reply,
  };
}
