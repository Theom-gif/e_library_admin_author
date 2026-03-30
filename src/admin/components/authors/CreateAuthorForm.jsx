import { useState, useRef } from "react";
import { AlertCircle, CheckCircle, Upload, X, Eye, EyeOff, Mail, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useTheme } from "../../../theme/ThemeContext";
import { cn } from "../../../lib/utils";
import { createAuthor } from "../../services/authorService";

/**
 * CreateAuthorForm Component
 * 
 * A comprehensive form for admin to create new authors with:
 * - First name, last name fields
 * - Email validation
 * - Password and confirmation
 * - Profile image upload with preview
 * - Modern UI inspired by Register page
 * - Success/error alerting
 * - Responsive design
 */
export default function CreateAuthorForm({ onSuccess }) {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Form state
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    password_confirmation: "",
    bio: "",
  });

  // File state
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploadType, setImageUploadType] = useState("local"); // "local" or "url"
  const fileInputRef = useRef(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const errors = {};

    // Validate first name
    if (!formData.firstname.trim()) {
      errors.firstname = t("First name is required");
    } else if (formData.firstname.trim().length < 2) {
      errors.firstname = t("First name must be at least 2 characters");
    }

    // Validate last name
    if (!formData.lastname.trim()) {
      errors.lastname = t("Last name is required");
    } else if (formData.lastname.trim().length < 2) {
      errors.lastname = t("Last name must be at least 2 characters");
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = t("Email is required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = t("Please enter a valid email address");
      }
    }

    // Validate password
    if (!formData.password) {
      errors.password = t("Password is required");
    } else if (formData.password.length < 6) {
      errors.password = t("Password must be at least 6 characters");
    }

    // Validate password confirmation
    if (!formData.password_confirmation) {
      errors.password_confirmation = t("Password confirmation is required");
    } else if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = t("Password confirmation does not match");
    }

    // Validate bio
    if (formData.bio.trim().length > 500) {
      errors.bio = t("Bio must not exceed 500 characters");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle text input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Handle file input change
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        setError(t("Please select an image file"));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(t("Image must be smaller than 5MB"));
        return;
      }

      setProfileImage(file);
      setError("");

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Remove selected image
   */
  const handleRemoveImage = () => {
    setProfileImage(null);
    setImageUrl("");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Submit form - create new author via API
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError(t("Please fix the errors above"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await createAuthor({
        name: `${formData.firstname.trim()} ${formData.lastname.trim()}`,
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        bio: formData.bio.trim(),
        profile_image: profileImage,
        profile_image_url: imageUrl,
      });

      if (response?.success) {
        setSuccess(
          response?.message ||
            t("Author created successfully! An invitation email will be sent.")
        );

        setFormData({
          firstname: "",
          lastname: "",
          email: "",
          password: "",
          password_confirmation: "",
          bio: "",
        });
        handleRemoveImage();
        setFieldErrors({});

        if (onSuccess) {
          onSuccess(response?.data || {});
        }

        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      const errorMessage = err?.message || t("Failed to create author. Please try again.");
      setError(errorMessage);

      if (err?.errors) {
        setFieldErrors(err.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>
          {t("Create New Author")}
        </h2>
        <p className={cn("mt-2", isDark ? "text-slate-400" : "text-slate-600")}>
          {t("Set up a new author account with initial credentials.")}
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <div className={cn("mb-6 p-4 rounded-xl border flex items-start gap-3", isDark ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700")}>
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">{t("Success")}</h3>
            <p className="text-sm mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className={cn("mb-6 p-4 rounded-xl border flex items-start gap-3", isDark ? "bg-red-500/10 border-red-400/30 text-red-300" : "bg-red-50 border-red-200 text-red-700")}>
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">{t("Error")}</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cn("mb-2 block text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-600")}>
              {t("First Name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              placeholder={t("Jane")}
              disabled={loading}
              className={cn("w-full rounded-xl border px-4 py-3 text-sm transition-colors outline-none focus:border-purple-500", 
                fieldErrors.firstname
                  ? isDark
                    ? "border-red-600/60 bg-red-900/10 text-white"
                    : "border-red-300 bg-red-50 text-slate-900"
                  : isDark
                    ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                    : "border-slate-300 bg-white text-slate-900 placeholder-slate-500"
              )}
            />
            {fieldErrors.firstname && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors.firstname}</p>
            )}
          </div>
          
          <div>
            <label className={cn("mb-2 block text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-600")}>
              {t("Last Name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleInputChange}
              placeholder={t("Doe")}
              disabled={loading}
              className={cn("w-full rounded-xl border px-4 py-3 text-sm transition-colors outline-none focus:border-purple-500", 
                fieldErrors.lastname
                  ? isDark
                    ? "border-red-600/60 bg-red-900/10 text-white"
                    : "border-red-300 bg-red-50 text-slate-900"
                  : isDark
                    ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                    : "border-slate-300 bg-white text-slate-900 placeholder-slate-500"
              )}
            />
            {fieldErrors.lastname && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors.lastname}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={cn("mb-2 block text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-600")}>
            {t("Email Address")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} size={18} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("author@university.edu")}
              disabled={loading}
              className={cn("w-full rounded-xl border pl-12 pr-4 py-3 text-sm transition-colors outline-none focus:border-purple-500", 
                fieldErrors.email
                  ? isDark
                    ? "border-red-600/60 bg-red-900/10 text-white"
                    : "border-red-300 bg-red-50 text-slate-900"
                  : isDark
                    ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                    : "border-slate-300 bg-white text-slate-900 placeholder-slate-500"
              )}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-red-500 text-xs mt-1.5">{fieldErrors.email}</p>
          )}
          <p className={cn("text-xs mt-1.5", isDark ? "text-slate-500" : "text-slate-600")}>
            {t("Ensure this email is unique")}
          </p>
        </div>

        {/* Password Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cn("mb-2 block text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-600")}>
              {t("Password")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={loading}
                className={cn("w-full rounded-xl border px-4 py-3 pr-12 text-sm transition-colors outline-none focus:border-purple-500", 
                  fieldErrors.password
                    ? isDark
                      ? "border-red-600/60 bg-red-900/10 text-white"
                      : "border-red-300 bg-red-50 text-slate-900"
                    : isDark
                      ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                      : "border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                className={cn("absolute right-4 top-1/2 -translate-y-1/2", isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className={cn("mb-2 block text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-600")}>
              {t("Confirm Password")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={loading}
                className={cn("w-full rounded-xl border px-4 py-3 pr-12 text-sm transition-colors outline-none focus:border-purple-500", 
                  fieldErrors.password_confirmation
                    ? isDark
                      ? "border-red-600/60 bg-red-900/10 text-white"
                      : "border-red-300 bg-red-50 text-slate-900"
                    : isDark
                      ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                      : "border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={loading}
                className={cn("absolute right-4 top-1/2 -translate-y-1/2", isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password_confirmation && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors.password_confirmation}</p>
            )}
          </div>
        </div>

        {/* Bio Field */}
        <div>
          <label className={cn("mb-2 block text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-600")}>
            {t("Biography")}
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder={t("Write a brief biography about the author...")}
            rows="3"
            disabled={loading}
            className={cn("w-full rounded-xl border px-4 py-3 text-sm transition-colors outline-none focus:border-purple-500 resize-none", 
              fieldErrors.bio
                ? isDark
                  ? "border-red-600/60 bg-red-900/10 text-white"
                  : "border-red-300 bg-red-50 text-slate-900"
                : isDark
                  ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                  : "border-slate-300 bg-white text-slate-900 placeholder-slate-500"
            )}
          />
          <div className="flex justify-between mt-1.5">
            <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-600")}>
              {t("Maximum 500 characters")}
            </p>
            <p className={cn("text-xs", formData.bio.length > 500 ? "text-red-500" : isDark ? "text-slate-500" : "text-slate-600")}>
              {formData.bio.length}/500
            </p>
          </div>
          {fieldErrors.bio && (
            <p className="text-red-500 text-xs mt-1.5">{fieldErrors.bio}</p>
          )}
        </div>

        {/* Profile Image Upload */}
        <div>
          <label className={cn("mb-3 block text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-600")}>
            {t("Profile Image")}
          </label>

          {/* Upload Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setImageUploadType("local");
                handleRemoveImage();
              }}
              disabled={loading}
              className={cn("flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all", 
                imageUploadType === "local"
                  ? isDark
                    ? "bg-purple-600 text-white"
                    : "bg-purple-500 text-white"
                  : isDark
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              )}
            >
              <Upload size={14} className="inline mr-2" />
              {t("Local File")}
            </button>
            <button
              type="button"
              onClick={() => {
                setImageUploadType("url");
                handleRemoveImage();
              }}
              disabled={loading}
              className={cn("flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all", 
                imageUploadType === "url"
                  ? isDark
                    ? "bg-purple-600 text-white"
                    : "bg-purple-500 text-white"
                  : isDark
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              )}
            >
              <LinkIcon size={14} className="inline mr-2" />
              {t("From URL")}
            </button>
          </div>

          {/* Local File Upload */}
          {imageUploadType === "local" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Area */}
              <div>
                <label
                  className={cn("block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all", 
                    isDark
                      ? "border-slate-600 hover:border-purple-500 hover:bg-purple-900/10"
                      : "border-slate-300 hover:border-purple-500 hover:bg-purple-50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <Upload size={32} className={cn("mx-auto mb-2", isDark ? "text-slate-500" : "text-slate-400")} />
                  <p className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Click to upload")}
                  </p>
                  <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-600")}>
                    {t("PNG, JPG up to 5MB")}
                  </p>
                </label>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className={cn("relative rounded-xl overflow-hidden border", isDark ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-slate-100")}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={loading}
                    className={cn("absolute top-2 right-2 p-1 rounded-full transition-colors", isDark ? "bg-red-900/80 hover:bg-red-800" : "bg-red-500 hover:bg-red-600")}
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* URL Input */}
          {imageUploadType === "url" && (
            <div className="space-y-4">
              <div>
                <label className={cn("mb-2 block text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-600")}>
                  {t("Image URL")}
                </label>
                <div className="relative">
                  <LinkIcon className={cn("absolute left-4 top-1/2 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} size={18} />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      if (e.target.value.trim()) {
                        setError("");
                        setImagePreview(e.target.value);
                      }
                    }}
                    placeholder={t("https://example.com/image.jpg")}
                    disabled={loading}
                    className={cn("w-full rounded-xl border pl-12 pr-4 py-3 text-sm transition-colors outline-none focus:border-purple-500", 
                      isDark
                        ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                        : "border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                    )}
                  />
                </div>
                <p className={cn("text-xs mt-1.5", isDark ? "text-slate-500" : "text-slate-600")}>
                  {t("Paste the URL of an image")}
                </p>
              </div>

              {/* URL Image Preview */}
              {imagePreview && (
                <div className={cn("relative rounded-xl overflow-hidden border", isDark ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-slate-100")}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      setError(t("Failed to load image from URL"));
                      e.target.style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={loading}
                    className={cn("absolute top-2 right-2 p-1 rounded-full transition-colors", isDark ? "bg-red-900/80 hover:bg-red-800" : "bg-red-500 hover:bg-red-600")}
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={cn("flex-1 px-6 py-3 rounded-xl font-bold transition-all", 
              isDark
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white"
            )}
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                {t("Creating...")}
              </>
            ) : (
              t("Create Author")
            )}
          </button>
          <button
            type="reset"
            onClick={() => {
              setFormData({ firstname: "", lastname: "", email: "", password: "", password_confirmation: "", bio: "" });
              handleRemoveImage();
              setImageUploadType("local");
              setFieldErrors({});
              setError("");
            }}
            disabled={loading}
            className={cn("px-6 py-3 rounded-xl font-bold transition-all", 
              isDark
                ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            )}
          >
            {t("Clear")}
          </button>
        </div>
      </form>
    </div>
  );
}
