import {
  BookOpenText,
  Briefcase,
  Cpu,
  GraduationCap,
  Landmark,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "../data/mockData";
import { useLanguage } from "../../i18n/LanguageContext";
import { createAdminCategory, fetchAdminCategories } from "../services/adminService";
import { useTheme } from "../../theme/ThemeContext";

const ICON_MAP = {
  Tech: Cpu,
  Bookopen: BookOpenText,
  GraduationCap,
  Briefcase,
  Landmark,
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  const validation = data?.errors;
  if (validation && typeof validation === "object") {
    const details = Object.values(validation)
      .flat()
      .filter(Boolean)
      .map((value) => String(value))
      .join(" ");
    if (details) return details;
  }
  if (data?.message) return data.message;
  return error?.message || fallback;
};

const Categories = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const nameInputRef = useRef(null);
  const [categories, setCategories] = useState(() => CATEGORIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const totalBooks = categories.reduce((sum, category) => sum + Number(category.count || 0), 0);
  const averageBooks = categories.length > 0 ? Math.round(totalBooks / categories.length) : 0;
  const categoryCardStyle = {
    background: isDark
      ? "linear-gradient(180deg,#13294b 0%,#10203c 100%)"
      : "linear-gradient(180deg,#f7fbff 0%,#edf4ff 100%)",
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.12)",
  };
  const categoryIconWrapStyle = {
    background: isDark
      ? "linear-gradient(180deg,#5f3d95 0%,#4b2f77 100%)"
      : "linear-gradient(180deg,#8f4cf6 0%,#6f38d7 100%)",
    boxShadow: isDark
      ? "0 8px 22px rgba(58,25,102,0.35)"
      : "0 8px 20px rgba(111,56,215,0.25)",
  };

  const focusCreateForm = () => {
    nameInputRef.current?.focus();
  };

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const rows = await fetchAdminCategories(
          searchTerm ? { search: searchTerm } : {},
          { signal: controller.signal },
        );
        setCategories(rows);
      } catch (fetchError) {
        const isCanceled =
          fetchError?.name === "CanceledError" ||
          fetchError?.name === "AbortError";
        if (isCanceled || controller.signal.aborted) {
          return;
        }
        setError(getErrorMessage(fetchError, t("Failed to load categories.")));
        setCategories(CATEGORIES);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(load, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, t]);

  const onSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();

    if (!name) {
      setFormError(t("Please enter category name."));
      return;
    }

    const payload = {
      name,
      icon: "Tech",
    };

    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    createAdminCategory(payload)
      .then((created) => {
        setCategories((current) => [...current, created]);
        setSuccessMessage(t("Category added successfully."));
        setForm({ name: "" });
        focusCreateForm();
        setTimeout(() => setSuccessMessage(""), 2200);
      })
      .catch((createError) => {
        setFormError(getErrorMessage(createError, t("Failed to create category.")));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
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
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={categoryIconWrapStyle}>
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
            disabled={isSubmitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8f4cf6] to-[#e5459e] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isSubmitting ? t("Saving...") : t("Save Category")}
          </button>
        </form>
      </div>
      {categories.length === 0 && !isLoading && (
        <div className="glass-card rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
          {t("No categories yet.")}
        </div>
      )}
    </section>
  );
};

export default Categories;
