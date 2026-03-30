import { useState, useRef } from "react";
import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useTheme } from "../../../theme/ThemeContext";
import { createAuthor } from "../../services/authorService";

/**
 * CreateAuthorForm Component
 * 
 * A comprehensive form for admin to create new authors with:
 * - Form validation (required fields, unique email)
 * - Profile image upload with preview
 * - Success/error alerting
 * - Form reset after submission
 * - Responsive design
 */
export default function CreateAuthorForm({ onSuccess }) {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
  });

  // File state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Validate form inputs
   * - Check required fields
   * - Validate email format
   * - Clear previous errors
   */
  const validateForm = () => {
    const errors = {};

    // Validate name
    if (!formData.name.trim()) {
      errors.name = t("Author name is required");
    } else if (formData.name.trim().length < 2) {
      errors.name = t("Author name must be at least 2 characters");
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

    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Handle file input change - validate and create preview
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError(t("Please select an image file"));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t("Image must be smaller than 5MB"));
        return;
      }

      setProfileImage(file);
      setError("");

      // Create preview
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

    // Validate form
    if (!validateForm()) {
      setError(t("Please fix the errors above"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Call authorService to create author
      const response = await createAuthor({
        name: formData.name.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        profile_image: profileImage,
      });

      // Success
      if (response?.success) {
        setSuccess(
          response?.message ||
            t("Author created successfully! An invitation email will be sent.")
        );

        // Reset form
        setFormData({
          name: "",
          email: "",
          bio: "",
        });
        handleRemoveImage();
        setFieldErrors({});

        // Call callback if provided
        if (onSuccess) {
          onSuccess(response?.data || {});
        }

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      // Handle error response
      const errorMessage = err?.message || t("Failed to create author. Please try again.");

      setError(errorMessage);

      // Show field-specific errors if provided
      if (err?.errors) {
        setFieldErrors(err.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
          {t("Create New Author")}
        </h1>
        <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {t(
            "Add a new author to the platform. They will receive an invitation email to set up their account."
          )}
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
          isDark
            ? "bg-green-900/20 border-green-700/50 text-green-300"
            : "bg-green-50 border-green-200 text-green-800"
        }`}>
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">{t("Success")}</h3>
            <p className="text-sm mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
          isDark
            ? "bg-red-900/20 border-red-700/50 text-red-300"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">{t("Error")}</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Author Name Field */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}>
            {t("Author Name")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            className={`w-full px-4 py-2 rounded-lg border transition-colors ${
              fieldErrors.name
                ? isDark
                  ? "border-red-600/60 bg-red-900/10"
                  : "border-red-300 bg-red-50"
                : isDark
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-gray-300 bg-white text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            disabled={loading}
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}>
            {t("Email")} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="author@example.com"
            className={`w-full px-4 py-2 rounded-lg border transition-colors ${
              fieldErrors.email
                ? isDark
                  ? "border-red-600/60 bg-red-900/10"
                  : "border-red-300 bg-red-50"
                : isDark
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-gray-300 bg-white text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            disabled={loading}
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
          )}
          <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
            {t("Ensure this email is unique")}
          </p>
        </div>

        {/* Bio Field */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}>
            {t("Bio")}
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Write a brief biography about the author..."
            rows="4"
            className={`w-full px-4 py-2 rounded-lg border transition-colors ${
              fieldErrors.bio
                ? isDark
                  ? "border-red-600/60 bg-red-900/10"
                  : "border-red-300 bg-red-50"
                : isDark
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-gray-300 bg-white text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
            disabled={loading}
          />
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>
              {t("Maximum 500 characters")}
            </p>
            <p className={`text-xs ${
              formData.bio.length > 500
                ? "text-red-500"
                : isDark
                  ? "text-gray-500"
                  : "text-gray-600"
            }`}>
              {formData.bio.length}/500
            </p>
          </div>
          {fieldErrors.bio && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.bio}</p>
          )}
        </div>

        {/* Profile Image Upload */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}>
            {t("Profile Image")}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Area */}
            <div>
              <label
                className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDark
                    ? "border-gray-600 hover:border-purple-500 hover:bg-purple-900/10"
                    : "border-gray-300 hover:border-purple-500 hover:bg-purple-50"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <Upload
                  size={32}
                  className={`mx-auto mb-2 ${
                    isDark ? "text-gray-400" : "text-gray-400"
                  }`}
                />
                <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {t("Click to upload")}
                </p>
                <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                  {t("PNG, JPG up to 5MB")}
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className={`relative rounded-lg overflow-hidden border ${
                isDark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"
              }`}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                    isDark
                      ? "bg-red-900/80 hover:bg-red-800"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                  aria-label="Remove image"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              isDark
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
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
              setFormData({ name: "", email: "", bio: "" });
              handleRemoveImage();
              setFieldErrors({});
              setError("");
            }}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {t("Clear")}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className={`mt-8 p-4 rounded-lg border ${
        isDark
          ? "bg-blue-900/20 border-blue-700/50 text-blue-300"
          : "bg-blue-50 border-blue-200 text-blue-900"
      }`}>
        <h3 className="font-semibold mb-2">{t("What happens after creation?")}</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>{t("An invitation email will be sent to the author")}</li>
          <li>{t("They can set their own password via the invitation link")}</li>
          <li>{t("Their profile image and bio will be saved")}</li>
          <li>{t("They can start uploading books immediately after setup")}</li>
        </ul>
      </div>
    </div>
  );
}
