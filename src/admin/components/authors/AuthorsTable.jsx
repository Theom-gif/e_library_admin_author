import { Eye, Trash2, UserRound } from "lucide-react";

function getInitials(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AU";
}

function getAvatarTone(index) {
  const tones = [
    "from-rose-500 to-orange-500",
    "from-fuchsia-500 to-pink-500",
    "from-indigo-500 to-blue-500",
    "from-red-500 to-rose-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
  ];
  return tones[index % tones.length];
}

function Avatar({ author, index }) {
  if (author.profile_image_url) {
    return (
      <img
        src={author.profile_image_url}
        alt={author.name}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-white/60"
      />
    );
  }

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarTone(index)} text-lg font-bold text-white shadow-sm`}>
      {getInitials(author.name)}
    </div>
  );
}

function ActionButton({ children, onClick, tone = "primary", disabled = false, title, icon }) {
  const className =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-400 hover:bg-red-100"
      : tone === "secondary"
        ? "border-indigo-200 bg-indigo-50 text-indigo-400 hover:bg-indigo-100"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export default function AuthorsTable({
  authors,
  loading,
  emptyTitle,
  emptyDescription,
  actionLoadingId,
  deleteConfirm,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onResendInvite,
  onViewAuthor,
}) {
  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-[#4a868f]" />
          <p className="mt-4 text-sm text-slate-500">Loading authors...</p>
        </div>
      </div>
    );
  }

  if (!authors.length) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="text-lg font-semibold text-slate-900">{emptyTitle}</p>
        <p className="mt-2 text-sm text-slate-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead className="bg-slate-50">
          <tr className="text-slate-800">
            <th className="px-8 py-5 text-left text-sm font-bold">Profile</th>
            <th className="px-8 py-5 text-left text-sm font-bold">Role</th>
            <th className="px-8 py-5 text-left text-sm font-bold">Email</th>
            <th className="px-8 py-5 text-right text-sm font-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author, index) => (
            <tr key={author.id} className="border-t border-slate-200 transition hover:bg-slate-50/80">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <Avatar author={author} index={index} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{author.name}</p>
                    <p className="truncate text-sm text-slate-600">{author.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-500">
                  Author
                </span>
              </td>
              <td className="px-8 py-6 text-[15px] text-slate-800">{author.email}</td>
              <td className="px-8 py-6">
                <div className="flex items-center justify-end gap-3">
                  <ActionButton
                    onClick={() => onViewAuthor(author)}
                    tone="secondary"
                    title="View author"
                    icon={<Eye size={16} />}
                  >
                    View
                  </ActionButton>
                  {deleteConfirm === author.id ? (
                    <>
                      <ActionButton
                        onClick={() => onDeleteConfirm(author.id)}
                        disabled={actionLoadingId === author.id}
                        tone="danger"
                        title="Confirm delete"
                        icon={<Trash2 size={16} />}
                      >
                        {actionLoadingId === author.id ? "Deleting..." : "Confirm"}
                      </ActionButton>
                      <ActionButton
                        onClick={onDeleteCancel}
                        title="Cancel delete"
                        icon={<UserRound size={16} />}
                      >
                        Cancel
                      </ActionButton>
                    </>
                  ) : (
                    <ActionButton
                      onClick={() => onDeleteRequest(author.id)}
                      tone="danger"
                      title="Delete author"
                      icon={<Trash2 size={16} />}
                    >
                      Delete
                    </ActionButton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
