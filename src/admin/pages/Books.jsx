import { Activity, Check, Filter, MoreVertical, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { BOOKS } from "../data/mockData";

const Books = () => {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search books, authors, categories..."
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-64"
            />
          </div>
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button className="px-3 py-1 text-xs font-bold rounded-md bg-purple-500 text-white">All</button>
            <button className="px-3 py-1 text-xs font-bold rounded-md text-slate-400 hover:text-white">Approved</button>
            <button className="px-3 py-1 text-xs font-bold rounded-md text-slate-400 hover:text-white">Pending</button>
            <button className="px-3 py-1 text-xs font-bold rounded-md text-slate-400 hover:text-white">Rejected</button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
          <Filter size={18} />
          {BOOKS.length} Total
        </div>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <th className="px-6 py-4">Book</th>
            <th className="px-6 py-4">Author</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Downloads</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {BOOKS.map((book) => (
            <tr key={book.id} className="hover:bg-white/2 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src={book.cover} alt={book.title} className="w-10 h-14 rounded-md object-cover" />
                  <div>
                    <p className="font-bold">{book.title}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{book.date}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-400 text-sm">{book.author}</td>
              <td className="px-6 py-4">
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/5 text-slate-400">{book.category}</span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 w-fit",
                    book.status === "Approved"
                      ? "text-green-400 bg-green-400/10"
                      : book.status === "Pending"
                        ? "text-orange-400 bg-orange-400/10"
                        : "text-red-400 bg-red-400/10",
                  )}
                >
                  {book.status === "Approved" ? <Check size={14} /> : book.status === "Pending" ? <Activity size={14} /> : <X size={14} />}
                  {book.status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-400 text-sm font-mono">{book.downloads.toLocaleString()}</td>
              <td className="px-6 py-4 text-right">
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Books;
