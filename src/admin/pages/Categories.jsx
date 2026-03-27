import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "../data/mockData";
import { useLanguage } from "../../i18n/LanguageContext";
import { createAdminCategory, fetchAdminCategories } from "../services/adminService";
import { useTheme } from "../../theme/ThemeContext";
import CategoriesOverview from "../components/category/CategoriesOverview";
import CategoriesList from "../components/category/CategoriesList";
import CreateCategoryForm from "../components/category/CreateCategoryForm";

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
      <CategoriesOverview
        t={t}
        categoriesLength={categories.length}
        totalBooks={totalBooks}
        averageBooks={averageBooks}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <CategoriesList
          t={t}
          categories={categories}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          error={error}
          isLoading={isLoading}
          categoryCardStyle={categoryCardStyle}
          categoryIconWrapStyle={categoryIconWrapStyle}
        />

        <CreateCategoryForm
          t={t}
          onSubmit={onSubmit}
          nameInputRef={nameInputRef}
          formName={form.name}
          onFormNameChange={(value) =>
            setForm((current) => ({ ...current, name: value }))
          }
          formError={formError}
          successMessage={successMessage}
          isSubmitting={isSubmitting}
        />
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
