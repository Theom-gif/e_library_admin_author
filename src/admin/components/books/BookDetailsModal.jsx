import React from "react";
import { BookOpen, Calendar, UserRound, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import BookStatusBadge from "./BookStatusBadge";

const BookDetailsModal = ({ t, selectedBook, isDark, onClose }) => {
  if (!selectedBook) return null;

  const modalOverlayStyle = {
    background: isDark ? "rgba(4, 8, 20, 0.72)" : "rgba(148, 163, 184, 0.35)",
    backdropFilter: "blur(8px)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={modalOverlayStyle}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl p-[1px]"
        style={{
          background: isDark
            ? "linear-gradient(135deg,rgba(129,140,248,0.45),rgba(59,130,246,0.18),rgba(236,72,153,0.32))"
            : "linear-gradient(135deg,rgba(99,102,241,0.42),rgba(14,165,233,0.22),rgba(236,72,153,0.28))",
          boxShadow: isDark
            ? "0 34px 90px rgba(0,0,0,0.66)"
            : "0 24px 65px rgba(15,23,42,0.26)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="relative rounded-3xl overflow-hidden p-6 md:p-8"
          style={{
            background: isDark
              ? "linear-gradient(145deg,#0a1222 0%,#101a30 52%,#0a1222 100%)"
              : "linear-gradient(145deg,#ffffff 0%,#f8fbff 52%,#eef4ff 100%)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "absolute right-4 top-4 rounded-full p-1.5 transition",
              isDark
                ? "text-slate-500 hover:bg-white/10 hover:text-white"
                : "text-slate-500 hover:bg-slate-500/10 hover:text-slate-700",
            )}
          >
            <X size={16} />
          </button>

          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
            <div className="grid grid-cols-[80px_1fr] gap-4 md:gap-5">
              <div className="h-24 w-20 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                {selectedBook.cover ? (
                  <img
                    src={selectedBook.cover}
                    alt={selectedBook.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <BookOpen size={24} className="text-slate-500" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                  {t("Book Details")}
                </p>
                <h3 className="mt-1 text-2xl md:text-3xl font-black leading-tight truncate">
                  {selectedBook.title}
                </h3>
                <p className="mt-1.5 text-sm text-slate-500 truncate">
                  {selectedBook.category || t("Uncategorized")}
                </p>

                <div className="mt-3">
                  <BookStatusBadge status={selectedBook.status} t={t} size={13} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">
                {t("Author")}
              </p>
              <p className="mt-1.5 text-sm font-semibold inline-flex items-center gap-2">
                <UserRound size={14} className="text-indigo-400" />
                {selectedBook.author || "-"}
              </p>
            </div>

            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">
                {t("Published Date")}
              </p>
              <p className="mt-1.5 text-sm font-semibold inline-flex items-center gap-2">
                <Calendar size={14} className="text-indigo-400" />
                {selectedBook.date || "-"}
              </p>
            </div>

            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">
                {t("Category")}
              </p>
              <p className="mt-1.5 text-sm font-semibold">{selectedBook.category || "-"}</p>
            </div>

            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">
                {t("Downloads")}
              </p>
              <p className="mt-1.5 text-sm font-semibold font-mono">
                {Number(selectedBook.downloads ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-200 hover:text-white transition"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              {t("Close")}
            </button>
          </div>

          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.75)",
              maskImage: "linear-gradient(to bottom, black, transparent 94%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
