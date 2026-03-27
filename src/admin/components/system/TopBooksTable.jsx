import React from "react";
import { BookOpen } from "lucide-react";

const TopBooksTable = ({ topBooks }) => (
  <div className="bg-white/5 rounded-xl border border-white/5 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-white/5">
      <h4 className="font-bold">Top 5 Books Currently Being Read</h4>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">
          <tr>
            <th className="px-6 py-4">Rank</th>
            <th className="px-6 py-4">Book Title</th>
            <th className="px-6 py-4">Author</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Current Readers</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {topBooks.map((book) => (
            <tr key={book.rank} className="hover:bg-white/5 transition-colors group">
              <td className="px-6 py-4 font-bold text-primary">{book.rank}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-14 rounded shadow-sm overflow-hidden flex-shrink-0 bg-gradient-to-br ${book.coverGradient} flex items-center justify-center`}>
                    <BookOpen className="w-5 h-5 text-white/50" />
                  </div>
                  <span className="font-medium group-hover:text-primary transition-colors">{book.title}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-500">{book.author}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    book.status === "Trending"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : book.status === "Popular"
                        ? "bg-primary/10 text-primary"
                        : book.status === "New Release"
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-slate-500/10 text-slate-500"
                  }`}
                >
                  {book.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-bold">{book.readers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TopBooksTable;
