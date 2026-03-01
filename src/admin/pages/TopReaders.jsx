import { ArrowUpRight, BookOpen } from "lucide-react";
import { USERS } from "../data/mockData";

const leaders = [
  { user: USERS[4], booksRead: 52 },
  { user: USERS[3], booksRead: 38 },
  { user: USERS[2], booksRead: 24 },
];

const TopReaders = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaders.map((entry, idx) => (
          <div key={entry.user.id} className="glass-card p-6 flex flex-col items-center text-center relative">
            <div className="absolute -top-6 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center border-4 border-bg-dark text-white font-bold text-xl">
              {idx + 1}
            </div>
            <img src={entry.user.avatar} alt={entry.user.name} className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white/5" />
            <h4 className="text-lg font-bold">{entry.user.name}</h4>
            <p className="text-slate-500 text-sm mb-4">{entry.user.email}</p>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
              <BookOpen size={16} className="text-purple-500" />
              <span className="font-bold">{entry.booksRead}</span>
              <span className="text-xs text-slate-500 uppercase font-bold">Books Read</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Complete Leaderboard</h3>
          <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
            <option>All Time</option>
            <option>This Month</option>
            <option>This Week</option>
          </select>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Reader</th>
              <th className="px-6 py-4">Books Read</th>
              <th className="px-6 py-4">Member Since</th>
              <th className="px-6 py-4 text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leaders.map((entry, idx) => (
              <tr key={entry.user.id} className="hover:bg-white/2 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-500">{idx + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={entry.user.avatar} alt={entry.user.name} className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-bold">{entry.user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold">{entry.booksRead}</td>
                <td className="px-6 py-4 text-slate-400 text-sm">{entry.user.joined}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-green-400 text-xs font-bold flex items-center justify-end gap-1">
                    <ArrowUpRight size={14} />+{idx + 2}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopReaders;
