import {
  BookOpenText,
  Briefcase,
  Cpu,
  GraduationCap,
  Landmark,
  Plus,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import { CATEGORIES } from "../data/mockData";
import { useLanguage } from "../../i18n/LanguageContext";

const ICON_MAP = {
  Tech: Cpu,
  Bookopen: BookOpenText,
  GraduationCap,
  Briefcase,
  Landmark,
};

const Categories = () => {
  const { t } = useLanguage();
  const nameInputRef = useRef(null);
  const [categories, setCategories] = useState(() => CATEGORIES);
  const [form, setForm] = useState({
    name: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const totalBooks = categories.reduce((sum, category) => sum + Number(category.count || 0), 0);
  const averageBooks = categories.length > 0 ? Math.round(totalBooks / categories.length) : 0;

  const focusCreateForm = () => {
    nameInputRef.current?.focus();
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();

    if (!name) {
      setFormError(t("Please enter category name."));
      return;
    }

    const nextId =
      categories.reduce((maxId, current) => Math.max(maxId, Number(current.id) || 0), 0) + 1;

    setCategories((current) => [
      ...current,
      {
        id: nextId,
        name,
        count: 0,
        icon: "Tech",
      },
    ]);
    setSuccessMessage(t("Category added successfully."));
    setTimeout(() => setSuccessMessage(""), 2200);
    setForm({ name: "" });
    setFormError("");
    focusCreateForm();
  };

  return (
    <section className="space-y-6">
      <div className="glass-card p-6 md:p-8">
        <div className="space-y-2">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("Categories")}</h2>
            <p className="text-base text-slate-400 md:text-lg">{t("Manage book categories and genres")}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("Total Categories")}</p>
            <p className="mt-2 text-2xl font-bold">{categories.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("Total Books")}</p>
            <p className="mt-2 text-2xl font-bold">{totalBooks}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("Average Books")}</p>
            <p className="mt-2 text-2xl font-bold">{averageBooks}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-bold">{t("Category List")}</h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
              {categories.length} {t("Total")}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {categories.map((cat) => {
              const CategoryIcon = ICON_MAP[cat.icon] ?? Sparkles;
              return (
                <article
                  key={cat.id}
                  className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#13294b_0%,#10203c_100%)] p-5 transition-all hover:border-[#5f7aa4]"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#5f3d95_0%,#4b2f77_100%)] shadow-[0_8px_22px_rgba(58,25,102,0.35)]">
                    <CategoryIcon size={26} className="text-slate-100" aria-hidden />
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

        <form
          onSubmit={onSubmit}
          className="glass-card h-fit p-6"
        >
          <h3 className="text-xl font-bold">{t("Create Category")}</h3>
          <p className="mt-1 text-sm text-slate-400">{t("Add New Category")}</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">{t("Category Name")}</label>
              <input
                ref={nameInputRef}
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={t("Category Name")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </p>
          )}
          {successMessage && (
            <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8f4cf6] to-[#e5459e] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus size={16} />
            {t("Save Category")}
          </button>
        </form>
      </div>
      {categories.length === 0 && (
        <div className="glass-card rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
          {t("No categories yet.")}
        </div>
      )}
    </section>
  );
};

export default Categories;
