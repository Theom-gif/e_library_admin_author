import React from "react";
import { Eye, Loader2 } from "lucide-react";
import BookCover from "./BookCover";
import BookStatusBadge from "./BookStatusBadge";

const BooksTable = ({ t, error, isLoading, filteredBooks, onOpenBookDetails }) => (
  <table className="w-full text-left">
    <thead>
      <tr className="bg-white/2 text-slate-500 text-xs font-bold uppercase tracking-wider">
        <th className="px-6 py-4">{t("Book")}</th>
        <th className="px-6 py-4">{t("Author")}</th>
        <th className="px-6 py-4">{t("Category")}</th>
        <th className="px-6 py-4">{t("Status")}</th>
        <th className="px-6 py-4">{t("Downloads")}</th>
        <th className="px-6 py-4 text-right">{t("Actions")}</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-white/5">
      {error && (
        <tr>
          <td colSpan={6} className="px-6 py-4 text-center text-rose-400">
            {error}
          </td>
        </tr>
      )}

      {isLoading && (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
            <div className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("Loading books...")}
            </div>
          </td>
        </tr>
      )}

      {!isLoading && !error && filteredBooks.length === 0 && (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
            {t("No books found for this filter.")}
          </td>
        </tr>
      )}

      {!isLoading &&
        !error &&
        filteredBooks.map((book) => (
          <tr key={book.id} className="hover:bg-white/2">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <BookCover src={book.cover} alt={book.title} />
                <div>
                  <p className="font-bold">{book.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{book.date}</p>
                </div>
              </div>
            </td>

            <td className="px-6 py-4 text-slate-400 text-sm">{book.author}</td>

            <td className="px-6 py-4">
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/5 text-slate-400">
                {book.category}
              </span>
            </td>

            <td className="px-6 py-4">
              <BookStatusBadge status={book.status} t={t} />
            </td>

            <td className="px-6 py-4 text-slate-400 text-sm font-mono">
              {book.downloads.toLocaleString()}
            </td>

            <td className="px-6 py-4 text-right">
              <button
                type="button"
                onClick={() => onOpenBookDetails(book)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
                style={{
                  border: "1px solid rgba(99,102,241,0.35)",
                  background: "rgba(99,102,241,0.08)",
                }}
              >
                <Eye size={13} />
                {t("View Details")}
              </button>
            </td>
          </tr>
        ))}
    </tbody>
  </table>
);

export default BooksTable;
