import { Activity, Check, Eye, X } from "lucide-react";
import { BOOKS } from "../data/mockData";

const Approvals = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Pending (24)</button>
          <button className="bg-white/5 text-slate-400 px-4 py-2 rounded-lg text-sm font-bold hover:text-white transition-colors">
            Reviewed
          </button>
        </div>
        <div className="flex items-center gap-2 text-orange-400 text-sm font-bold bg-orange-400/10 px-3 py-1.5 rounded-full">
          <Activity size={16} />
          2 Pending Review
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BOOKS.filter((b) => b.status === "Pending").map((book) => (
          <div key={book.id} className="glass-card overflow-hidden flex flex-col md:flex-row">
            <img src={book.cover} alt={book.title} className="w-full md:w-48 h-64 md:h-auto object-cover" />
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-xl font-bold mb-1">{book.title}</h4>
                  <p className="text-slate-400 text-sm">by {book.author}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-orange-400/10 text-orange-400 uppercase">Pending</span>
              </div>
              <p className="text-slate-500 text-sm mb-6 line-clamp-3">
                A deep dive into the themes of {book.category.toLowerCase()} and how it shapes our modern digital age.
              </p>
              <div className="mt-auto flex items-center gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-sm font-bold transition-all">
                  <Eye size={18} />
                  Preview
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all">
                  <Check size={18} />
                  Approve
                </button>
                <button className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Approvals;
