import React from "react";
import { Medal } from "lucide-react";

const TopReadersCard = ({ t, topReadersRange, onTopReadersRangeChange, topReadersLoading, topReaders }) => (
  <div className="glass-card p-6 flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Medal size={20} className="text-yellow-500" />
        <h3 className="text-xl font-bold">{t("Top Readers")}</h3>
      </div>
      <select
        value={topReadersRange}
        onChange={(e) => onTopReadersRangeChange(e.target.value)}
        className="bg-gray-800 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
      >
        <option value="week">{t("Week")}</option>
        <option value="month">{t("Month")}</option>
        <option value="all">{t("All Time")}</option>
      </select>
    </div>

    <div className="space-y-3 flex-1">
      {topReadersLoading ? (
        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
          {t("Loading...")}
        </div>
      ) : topReaders && topReaders.length > 0 ? (
        topReaders.map((reader, idx) => (
          <div key={reader.user?.id || idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {reader.user?.first_name && reader.user?.last_name
                  ? `${reader.user.first_name} ${reader.user.last_name}`
                  : reader.user?.email || "Unknown"}
              </p>
              <p className="text-xs text-slate-400">
                {reader.booksRead} {t("books read")}
              </p>
            </div>
            {reader.trend !== undefined && (
              <div className={`text-xs font-semibold ${
                reader.trend > 0 ? "text-green-400" : reader.trend < 0 ? "text-red-400" : "text-slate-400"
              }`}>
                {reader.trend > 0 ? "+" : ""}{reader.trend}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
          {t("No readers data available")}
        </div>
      )}
    </div>
  </div>
);

export default TopReadersCard;
