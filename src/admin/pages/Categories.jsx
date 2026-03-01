import {
  BookOpenText,
  Briefcase,
  Cpu,
  GraduationCap,
  Landmark,
  Plus,
  Sparkles,
} from "lucide-react";
import { CATEGORIES } from "../data/mockData";

const ICON_MAP = {
  Tech: Cpu,
  Bookopen: BookOpenText,
  GraduationCap,
  Briefcase,
  Landmark,
};

const Categories = () => {
  return (
    <section className="space-y-9 rounded-3xl border border-white/5 bg-gradient-to-b from-[#0d1f3f] via-[#081838] to-[#06122d] p-8 shadow-[0_24px_80px_rgba(2,8,24,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">Categories</h2>
          <p className="text-xl font-normal text-slate-400 md:text-3xl">Manage book categories and genres</p>
        </div>
        <button className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#8f4cf6] to-[#e5459e] px-7 py-4 text-base font-semibold text-white shadow-[0_8px_30px_rgba(180,69,228,0.45)] transition-all hover:-translate-y-0.5 hover:brightness-110 md:text-lg">
          <Plus size={22} />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const CategoryIcon = ICON_MAP[cat.icon] ?? Sparkles;
          return (
            <article
            key={cat.id}
            className="group rounded-[28px] border border-[#2a4164] bg-[linear-gradient(180deg,#122746_0%,#101f3e_100%)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#3f5f89]"
          >
            <div className="mb-7 inline-flex h-[72px] w-[72px] items-center justify-center rounded-3xl border border-[#5f4084] bg-[linear-gradient(180deg,#4d3279_0%,#3f2b6f_100%)] shadow-[0_10px_28px_rgba(52,22,91,0.35)]">
              <CategoryIcon size={34} className="text-slate-100" aria-hidden />
            </div>
            <h3 className="mb-2 text-3xl font-bold tracking-tight text-white">{cat.name}</h3>
            <p className="flex items-center gap-2 text-lg text-slate-400">
              <BookOpenText size={18} className="text-slate-400" />
              {cat.count} books
            </p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Categories;
