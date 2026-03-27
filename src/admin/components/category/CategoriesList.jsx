import React from "react";
import { BookOpenText, Loader2, Search, Sparkles } from "lucide-react";
import { ICON_MAP } from "./constants";

const CategoriesList = ({
  t,
  categories,
  searchTerm,
  onSearchTermChange,
  error,
  isLoading,
  categoryCardStyle,
  categoryIconWrapStyle,
}) => (
  <div className="glass-card p-6">
    <div className="mb-5 flex items-center justify-between">
      <h3 className="text-xl font-bold">{t("Category List")}</h3>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            type="text"
            placeholder={t("Search categories")}
            className="w-48 rounded-lg border border-white/10 bg-white/5 px-9 py-2 text-xs text-slate-100 focus:border-purple-400 focus:outline-none"
          />
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 text-center">
          {categories.length} {t("Total")}
        </span>
      </div>
    </div>

    {error && (
      <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {error}
      </p>
    )}

    {isLoading && (
      <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 inline-flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        {t("Loading categories...")}
      </div>
    )}

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {categories.map((cat) => {
        const CategoryIcon = ICON_MAP[cat.icon] ?? Sparkles;
        return (
          <article
            key={cat.id}
            className="rounded-2xl border p-5 transition-all hover:border-[#5f7aa4]"
            style={categoryCardStyle}
          >
            <div
              className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
              style={categoryIconWrapStyle}
            >
              <CategoryIcon size={26} style={{ color: "#ffffff" }} aria-hidden />
            </div>
            <h4 className="text-2xl font-bold">{cat.name}</h4>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <BookOpenText size={16} className="text-slate-400" />
              {cat.count} {t("books")}
            </p>
          </article>
        );
      })}
    </div>
  </div>
);

export default CategoriesList;
