import { useState, useRef, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Upload } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useTheme } from "../../../theme/ThemeContext";
import { updateAuthor } from "../../services/authorService";

/**
 * EditAuthorModal Component
 *
 * Modal dialog for editing an existing author's details.
 * Pre-populates fields from the author prop.
 * On submit calls updateAuthor() which sends:
 *   PUT /api/admin/authors/:id
 *   Body: { firstname, lastname, email, bio?, profile_image? }
 *
 * Props:
 *   author  – the author object to edit (from normalizeAuthor shape)
 *   onSuccess(updatedAuthor) – called with the updated author after save
 *   onClose() – called when the modal should be dismissed
 */
export default function EditAuthorModal({ author, onSuccess, onClose }) {
  const { t }      = useLanguage();
  const { isDark } = useTheme();

  // ── Form state ────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name:  author?.name  ?? "",
    email: author?.email ?? "",
    bio:   author?.bio   ?? "",
  });

  // ── File state ────────────────────────────────────────────────
  const [profileImage, setProfileImage]   = useState(null);
  const [imagePreview, setImagePreview]   = useState(author?.profile_image_url ?? null);
  const fileInputRef                      = useRef(null);

  // ── UI state ──────────────────────────────────────────────────
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [fieldErrors, setFieldErrors]     = useState({});

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ── Validation ────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = t("Author name is required");
    } else if (formData.name.trim().length < 2) {
      errors.name = t("Author name must be at least 2 characters");
    }
    if (!formData.email.trim()) {
      errors.email = t("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("Please enter a valid email address");
    }
    if (formData.bio.trim().length > 500) {
      errors.bio = t("Bio must not exceed 500 characters");
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError(t("Please select an image file")); return; }
    if (file.size > 5 * 1024 * 1024)    { setError(t("Image must be smaller than 5MB")); return; }
    setProfileImage(file);
    setError("");
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { setError(t("Please fix the errors above")); return; }

    setLoading(true);
    setError("");

    try {
      const response = await updateAuthor(author.id, {
        name:          formData.name.trim(),
        email:         formData.email.trim(),
        bio:           formData.bio.trim(),
        profile_image: profileImage, // null = no change
      });

      if (response?.success && onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      setError(err?.message || t("Failed to update author. Please try again."));
      if (err?.errors) setFieldErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal Panel */}
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
        isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {t("Edit Author")}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[75vh]">
          {/* Error Alert */}
          {error && (
            <div className={`mb-5 p-4 rounded-lg border flex items-start gap-3 ${
              isDark
                ? "bg-red-900/20 border-red-700/50 text-red-300"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {t("Author Name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  fieldErrors.name
                    ? isDark ? "border-red-600/60 bg-red-900/10" : "border-red-300 bg-red-50"
                    : isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {t("Email")} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  fieldErrors.email
                    ? isDark ? "border-red-600/60 bg-red-900/10" : "border-red-300 bg-red-50"
                    : isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Bio */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {t("Bio")}
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                disabled={loading}
                className={`w-full px-4 py-2 rounded-lg border transition-colors resize-none ${
                  fieldErrors.bio
                    ? isDark ? "border-red-600/60 bg-red-900/10" : "border-red-300 bg-red-50"
                    : isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <div className="flex justify-between mt-1">
                <span />
                <p className={`text-xs ${formData.bio.length > 500 ? "text-red-500" : isDark ? "text-gray-500" : "text-gray-500"}`}>
                  {formData.bio.length}/500
                </p>
              </div>
              {fieldErrors.bio && <p className="text-red-500 text-xs mt-1">{fieldErrors.bio}</p>}
            </div>

            {/* Profile Image */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {t("Profile Image")}
              </label>
              <div className="flex gap-4 items-start">
                {/* Current / Preview */}
                {imagePreview ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-full"
                      aria-label="Remove image"
                    >
                      <X size={18} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold ${
                    isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"
                  }`}>
                    {formData.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}

                {/* Upload button */}
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  isDark
                    ? "border-gray-600 hover:border-purple-500 text-gray-300 bg-gray-700 hover:bg-gray-600"
                    : "border-gray-300 hover:border-purple-400 text-gray-700 bg-white hover:bg-gray-50"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <Upload size={16} />
                  <span className="text-sm">{t("Change photo")}</span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className={`flex gap-3 pt-2 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <><span className="inline-block animate-spin mr-2">⚙️</span>{t("Saving...")}</>
                ) : (
                  t("Save Changes")
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {t("Cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}