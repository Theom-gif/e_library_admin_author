import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useTheme } from "../../../theme/ThemeContext";
import { createAuthor } from "../../services/authorService";

const MAX_BIO_LENGTH = 500;

function getFieldError(errors, key) {
  const value = errors?.[key];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function getInputClass(isDark, hasError, withIcon = false) {
  return [
    "w-full rounded-xl border py-3 outline-none transition-all",
    withIcon ? "pl-12 pr-12" : "px-4",
    isDark
      ? "border-[rgba(255,255,255,0.08)] bg-[#1d3438] text-[#f8fafc] placeholder:text-[#94a3b8]/30"
      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400",
    hasError
      ? isDark
        ? "border-red-400/70"
        : "border-red-400 bg-red-50"
      : "focus:border-[#4a868f]",
  ].join(" ");
}

export default function CreateAuthorForm({ onSuccess, onCancel }) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    password_confirmation: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const cardClass = isDark
    ? "border-[rgba(255,255,255,0.08)] bg-[#16282b] text-[#f8fafc] shadow-2xl"
    : "border-slate-200 bg-white text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]";
  const accentIconClass = isDark ? "bg-[#214046]" : "bg-[#e5f3f5]";
  const labelClass = isDark ? "text-[#94a3b8]" : "text-slate-600";
  const helperTextClass = isDark ? "text-[#94a3b8]" : "text-slate-500";
  const iconColorClass = isDark ? "text-[#94a3b8]" : "text-slate-400";
  const cancelButtonClass = isDark
    ? "border-[rgba(255,255,255,0.08)] bg-[#1d3438] text-[#94a3b8] hover:text-[#f8fafc]"
    : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900";
  const footerBorderClass = isDark ? "border-[rgba(255,255,255,0.05)]" : "border-slate-200";
  const errorBoxClass = isDark
    ? "border-red-500/20 bg-red-500/10 text-red-300"
    : "border-red-200 bg-red-50 text-red-800";
  const successBoxClass = isDark
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");

    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const resetForm = () => {
    setForm({ firstName: "", lastName: "", email: "", password: "", password_confirmation: "", bio: "" });
    setFieldErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedFirstName = form.firstName.trim();
    const trimmedLastName = form.lastName.trim();
    const trimmedEmail = form.email.trim().toLowerCase();

    if (!trimmedFirstName) {
      nextErrors.firstName = t("First name is required");
    } else if (trimmedFirstName.length < 2) {
      nextErrors.firstName = t("First name must be at least 2 characters");
    }

    if (!trimmedLastName) {
      nextErrors.lastName = t("Last name is required");
    } else if (trimmedLastName.length < 2) {
      nextErrors.lastName = t("Last name must be at least 2 characters");
    }

    if (!trimmedEmail) {
      nextErrors.email = t("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = t("Please enter a valid email address");
    }

    if (!form.password) {
      nextErrors.password = t("Password is required");
    } else if (form.password.length < 8) {
      nextErrors.password = t("Password must be at least 8 characters");
    }

    if (!form.password_confirmation) {
      nextErrors.password_confirmation = t("Password confirmation is required");
    } else if (form.password !== form.password_confirmation) {
      nextErrors.password_confirmation = t("Password confirmation does not match");
    }

    if (form.bio.trim().length > MAX_BIO_LENGTH) {
      nextErrors.bio = t("Bio must not exceed 500 characters");
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setError(t("Please fix the errors above"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await createAuthor({
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        bio: form.bio.trim(),
      });

      if (!response?.success) {
        setError(response?.message || t("Failed to create author"));
        return;
      }

      const successMessage = response.message || t("Author created successfully");
      setSuccess(successMessage);

      if (typeof onSuccess === "function") {
        onSuccess({
          author: response.data || {},
          message: successMessage,
        });
      }

      resetForm();
    } catch (err) {
      setFieldErrors({
        firstName: getFieldError(err?.errors, "firstname") || getFieldError(err?.errors, "first_name") || getFieldError(err?.errors, "name"),
        lastName: getFieldError(err?.errors, "lastname") || getFieldError(err?.errors, "last_name"),
        email: getFieldError(err?.errors, "email"),
        password: getFieldError(err?.errors, "password"),
        password_confirmation: getFieldError(err?.errors, "password_confirmation"),
        bio: getFieldError(err?.errors, "bio"),
      });
      setError(err?.message || t("Failed to create author"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full rounded-[24px] border p-8 lg:p-10 ${cardClass}`}>
      <div className="mb-8 text-center">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${accentIconClass}`}>
          <BookOpen size={24} className="text-[#4a868f]" />
        </div>
        <h2 className="text-3xl font-bold">{t("Create Author")}</h2>
        <p className={`mt-2 ${helperTextClass}`}>
          {t("Create a new author account with the backend author registration endpoint.")}
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={`mb-2 block text-xs font-bold uppercase tracking-wider ${labelClass}`}>
              {t("First Name")}
            </label>
            <div className="relative">
              <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColorClass}`} size={18} />
              <input
                type="text"
                value={form.firstName}
                onChange={(event) => onChange("firstName", event.target.value)}
                placeholder="Jane"
                disabled={loading}
                className={[
                  getInputClass(isDark, Boolean(fieldErrors.firstName), true),
                  "pr-4",
                ].join(" ")}
              />
            </div>
            {fieldErrors.firstName && <p className="mt-2 text-sm text-red-400">{fieldErrors.firstName}</p>}
          </div>

          <div>
            <label className={`mb-2 block text-xs font-bold uppercase tracking-wider ${labelClass}`}>
              {t("Last Name")}
            </label>
            <div className="relative">
              <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColorClass}`} size={18} />
              <input
                type="text"
                value={form.lastName}
                onChange={(event) => onChange("lastName", event.target.value)}
                placeholder="Doe"
                disabled={loading}
                className={[
                  getInputClass(isDark, Boolean(fieldErrors.lastName), true),
                  "pr-4",
                ].join(" ")}
              />
            </div>
            {fieldErrors.lastName && <p className="mt-2 text-sm text-red-400">{fieldErrors.lastName}</p>}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={`mb-2 block text-xs font-bold uppercase tracking-wider ${labelClass}`}>
              {t("Email Address")}
            </label>
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColorClass}`} size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                placeholder="jane.doe@university.edu"
                disabled={loading}
                className={getInputClass(isDark, Boolean(fieldErrors.email), true)}
              />
            </div>
            {fieldErrors.email && <p className="mt-2 text-sm text-red-400">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className={`mb-2 block text-xs font-bold uppercase tracking-wider ${labelClass}`}>
              {t("Password")}
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColorClass}`} size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => onChange("password", event.target.value)}
                placeholder="Minimum 8 characters"
                disabled={loading}
                className={getInputClass(isDark, Boolean(fieldErrors.password), true)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${
                  isDark ? "text-[#94a3b8] hover:text-[#f8fafc]" : "text-slate-400 hover:text-slate-700"
                }`}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-2 text-sm text-red-400">{fieldErrors.password}</p>}
          </div>
        </div>

        <div>
          <label className={`mb-2 block text-xs font-bold uppercase tracking-wider ${labelClass}`}>
            {t("Confirm Password")}
          </label>
          <div className="relative">
            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColorClass}`} size={18} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={form.password_confirmation}
              onChange={(event) => onChange("password_confirmation", event.target.value)}
              placeholder="Repeat password"
              disabled={loading}
              className={getInputClass(isDark, Boolean(fieldErrors.password_confirmation), true)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${
                isDark ? "text-[#94a3b8] hover:text-[#f8fafc]" : "text-slate-400 hover:text-slate-700"
              }`}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password_confirmation && (
            <p className="mt-2 text-sm text-red-400">{fieldErrors.password_confirmation}</p>
          )}
        </div>

        <div>
          <label className={`mb-2 block text-xs font-bold uppercase tracking-wider ${labelClass}`}>
            {t("Bio")}
          </label>
          <div className="relative">
            <FileText className={`absolute left-4 top-4 ${iconColorClass}`} size={18} />
            <textarea
              rows="4"
              value={form.bio}
              onChange={(event) => onChange("bio", event.target.value)}
              placeholder="Write a short biography about this author..."
              disabled={loading}
              className={[
                "w-full rounded-xl border py-3 pl-12 pr-4 outline-none transition-all resize-none",
                isDark
                  ? "border-[rgba(255,255,255,0.08)] bg-[#1d3438] text-[#f8fafc] placeholder:text-[#94a3b8]/30"
                  : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400",
                fieldErrors.bio
                  ? isDark
                    ? "border-red-400/70"
                    : "border-red-400 bg-red-50"
                  : "focus:border-[#4a868f]",
              ].join(" ")}
            />
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${helperTextClass}`}>
            <span>{t("Optional profile summary")}</span>
            <span className={form.bio.length > MAX_BIO_LENGTH ? "text-red-400" : ""}>
              {form.bio.length}/{MAX_BIO_LENGTH}
            </span>
          </div>
          {fieldErrors.bio && <p className="mt-2 text-sm text-red-400">{fieldErrors.bio}</p>}
        </div>

        {error && (
          <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${errorBoxClass}`}>
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${successBoxClass}`}>
            <span>{success}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#214046] py-3.5 font-bold text-[#f8fafc] shadow-lg transition-all hover:bg-[#2a525a] hover:shadow-[#4a868f]/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : null}
            <span>{loading ? t("Creating...") : t("Create Author")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              resetForm();
              if (typeof onCancel === "function") {
                onCancel();
              }
            }}
            disabled={loading}
            className={`rounded-xl border px-5 py-3.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${cancelButtonClass}`}
          >
            {t("Cancel")}
          </button>
        </div>
      </form>

      <div className={`mt-8 border-t pt-6 ${footerBorderClass}`}>
        <div className={`max-w-lg text-xs leading-relaxed ${helperTextClass}`}>
          <h3 className="font-bold uppercase tracking-[0.2em] text-[#4a868f]">{t("API Payload")}</h3>
          <p className="mt-2">
            {t("Submit firstname, lastname, email, password, password_confirmation, role_id: 2, and bio to the author registration endpoint if your backend supports it.")}
          </p>
        </div>
      </div>
    </div>
  );
}
