import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  Camera,
  ExternalLink,
  KeyRound,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  User2,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import AuthorAvatarImage from "../components/AuthorAvatarImage";
import { useUserProfile } from "../hooks/useUserProfile";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

const EMPTY_FORM = {
  firstname: "",
  lastname: "",
  bio: "",
  facebook_url: "",
  photo_url: "",
};

const EMPTY_PASSWORD_FORM = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function trimValue(value) {
  return String(value || "").trim();
}

function getProfileFormFromProfile(profile) {
  return {
    firstname: profile?.firstname || "",
    lastname: profile?.lastname || "",
    bio: profile?.bio || "",
    facebook_url: profile?.facebook_url || "",
    photo_url:
      profile?.photo_url ||
      profile?.profile_image_url ||
      profile?.avatar_url ||
      profile?.avatarUrl ||
      profile?.photo ||
      profile?.profile_image ||
      "",
  };
}

function getProfilePhotoSource(profile) {
  return (
    profile?.avatarUrl ||
    profile?.photo_url ||
    profile?.profile_image_url ||
    profile?.avatar_url ||
    profile?.photo ||
    profile?.profile_image ||
    ""
  );
}

function getFieldErrors(error) {
  const source = error?.response?.data?.errors;
  if (!source || typeof source !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      Array.isArray(value) ? String(value[0] || "") : String(value || ""),
    ]),
  );
}

function validateProfileForm(form, t) {
  const errors = {};

  if (!trimValue(form.firstname)) {
    errors.firstname = t("First name is required.");
  }

  if (!trimValue(form.lastname)) {
    errors.lastname = t("Last name is required.");
  }

  const facebookUrl = trimValue(form.facebook_url);
  if (facebookUrl) {
    try {
      const parsed = new URL(facebookUrl);
      if (!/^https?:$/i.test(parsed.protocol)) {
        errors.facebook_url = t("Please enter a valid URL.");
      }
    } catch {
      errors.facebook_url = t("Please enter a valid URL.");
    }
  }

  const photoUrlError = validatePhotoUrl(form.photo_url, t);
  if (photoUrlError) {
    errors.photo_url = photoUrlError;
  }

  return errors;
}

function validatePhotoUrl(value, t) {
  const photoUrl = trimValue(value);
  if (!photoUrl) return "";

  try {
    const parsed = new URL(photoUrl);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return t("Please enter a valid image URL.");
    }
  } catch {
    return t("Please enter a valid image URL.");
  }

  return "";
}

function validatePhotoFile(file, t) {
  if (!file) return "";

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return t("Please choose a PNG or JPEG image.");
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return t("Image size must be 5MB or less.");
  }

  return "";
}

function buildPhotoFilenameFromUrl(photoUrl, mimeType) {
  const fallbackExtension = mimeType === "image/png" ? "png" : "jpg";

  try {
    const parsed = new URL(photoUrl);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() || "";
    const safeName = lastSegment.replace(/[^a-zA-Z0-9._-]/g, "");
    if (safeName) {
      return safeName;
    }
  } catch {
    // Fall back to a generated name below.
  }

  return `profile-photo.${fallbackExtension}`;
}

async function createPhotoFileFromUrl(photoUrl, t) {
  let response;

  try {
    response = await fetch(photoUrl, { cache: "no-store" });
  } catch {
    throw new Error(
      t("We couldn't download that image URL. Please use a direct public JPG or PNG image, or upload the file instead."),
    );
  }

  if (!response.ok) {
    throw new Error(
      t("We couldn't download that image URL. Please use a direct public JPG or PNG image, or upload the file instead."),
    );
  }

  const contentType = String(response.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const blob = await response.blob();
  const blobType = String(blob.type || contentType)
    .split(";")[0]
    .trim()
    .toLowerCase()
    .replace("image/jpg", "image/jpeg");

  if (!blobType.startsWith("image/")) {
    throw new Error(t("That URL does not point to an image file."));
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(blobType)) {
    throw new Error(t("Please use a PNG or JPEG image URL."));
  }

  if (blob.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error(t("Image size must be 5MB or less."));
  }

  return new File([blob], buildPhotoFilenameFromUrl(photoUrl, blobType), {
    type: blobType,
  });
}

function ProfileField({ id, label, value, onChange, error, placeholder, textarea = false }) {
  const baseClassName =
    "w-full rounded-2xl border border-white/10 bg-[var(--surface-2)] px-4 py-3 text-sm text-[color:var(--text)] placeholder:text-slate-500 transition focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/30";
  const className = `${baseClassName} ${
    error ? "border-rose-400/60" : ""
  }`;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          rows={5}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
        />
      )}
      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-[var(--surface-2)] px-4 py-3 text-sm text-[color:var(--text)] placeholder:text-slate-500 transition focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile, loading, error, refreshProfile, updateProfile, uploadAvatar, changePassword } =
    useUserProfile();

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoError, setSelectedPhotoError] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showPhotoUrlEditor, setShowPhotoUrlEditor] = useState(false);
  const [photoUrlDraft, setPhotoUrlDraft] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const photoInputRef = useRef(null);

  const baselineForm = useMemo(() => getProfileFormFromProfile(profile), [profile]);
  const photoUrlChanged = useMemo(
    () => trimValue(form.photo_url) !== trimValue(baselineForm.photo_url),
    [baselineForm.photo_url, form.photo_url],
  );
  const hasProfileDetailsChanges = useMemo(
    () =>
      trimValue(form.firstname) !== trimValue(baselineForm.firstname) ||
      trimValue(form.lastname) !== trimValue(baselineForm.lastname) ||
      trimValue(form.bio) !== trimValue(baselineForm.bio) ||
      trimValue(form.facebook_url) !== trimValue(baselineForm.facebook_url),
    [baselineForm, form],
  );
  const hasUnsavedChanges = hasProfileDetailsChanges || photoUrlChanged || Boolean(selectedPhoto);
  const currentPhotoSrc = photoPreviewUrl || trimValue(form.photo_url) || getProfilePhotoSource(profile);

  useEffect(() => {
    if (hasUnsavedChanges) return;
    setForm(getProfileFormFromProfile(profile));
  }, [hasUnsavedChanges, profile]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [selectedPhoto]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleFieldChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: "" }));
    setProfileMessage({ type: "", text: "" });
    if (key === "photo_url" && value) {
      setSelectedPhoto(null);
      setSelectedPhotoError("");
    }
  };

  const handleSelectPhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationMessage = validatePhotoFile(file, t);
    if (validationMessage) {
      setSelectedPhoto(null);
      setSelectedPhotoError(validationMessage);
      setProfileMessage({ type: "", text: "" });
      return;
    }

    setSelectedPhoto(file);
    setForm((current) => ({ ...current, photo_url: "" }));
    setPhotoUrlDraft("");
    setSelectedPhotoError("");
    setProfileMessage({ type: "", text: "" });
    setShowPhotoOptions(false);
    setShowPhotoUrlEditor(false);
  };

  const handleOpenFilePicker = () => {
    setShowPhotoOptions(false);
    setShowPhotoUrlEditor(false);
    photoInputRef.current?.click();
  };

  const handleOpenPhotoUrlEditor = () => {
    setShowPhotoOptions(false);
    setShowPhotoUrlEditor(true);
    setPhotoUrlDraft(trimValue(form.photo_url));
    setSelectedPhoto(null);
    setSelectedPhotoError("");
    setProfileMessage({ type: "", text: "" });
    setFormErrors((current) => ({ ...current, photo_url: "" }));
  };

  const handleApplyPhotoUrl = () => {
    const nextUrl = trimValue(photoUrlDraft);
    const validationMessage = validatePhotoUrl(nextUrl, t);

    if (validationMessage) {
      setFormErrors((current) => ({ ...current, photo_url: validationMessage }));
      return;
    }

    handleFieldChange("photo_url", nextUrl);
    setPhotoUrlDraft(nextUrl);
    setShowPhotoUrlEditor(false);
  };

  const handleResetChanges = () => {
    setForm(getProfileFormFromProfile(profile));
    setFormErrors({});
    setSelectedPhoto(null);
    setSelectedPhotoError("");
    setShowPhotoOptions(false);
    setShowPhotoUrlEditor(false);
    setPhotoUrlDraft("");
    setProfileMessage({ type: "", text: "" });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const nextErrors = validateProfileForm(form, t);
    const photoError = validatePhotoFile(selectedPhoto, t);

    if (photoError) {
      setSelectedPhotoError(photoError);
    }

    if (Object.keys(nextErrors).length > 0 || photoError) {
      setFormErrors(nextErrors);
      setProfileMessage({
        type: "error",
        text: t("Please fix the highlighted fields and try again."),
      });
      return;
    }

    if (!hasUnsavedChanges) {
      setProfileMessage({ type: "success", text: t("Your profile is already up to date.") });
      return;
    }

    setSavingProfile(true);
    setProfileMessage({ type: "", text: "" });

    try {
      const photoUrl = trimValue(form.photo_url);
      let nextProfile = profile;
      let photoMirrorWarning = "";
      const shouldPersistPhotoUrl = !selectedPhoto && photoUrlChanged;

      if (selectedPhoto) {
        nextProfile = await uploadAvatar(selectedPhoto);
      } else if (photoUrlChanged && photoUrl) {
        try {
          const mirroredPhoto = await createPhotoFileFromUrl(photoUrl, t);
          nextProfile = await uploadAvatar(mirroredPhoto);
        } catch (mirrorError) {
          photoMirrorWarning =
            mirrorError?.message ||
            t("We couldn't mirror that image file, but we'll still save the URL.");
        }
      }

      if (hasProfileDetailsChanges || shouldPersistPhotoUrl) {
        nextProfile = await updateProfile({
          firstname: trimValue(form.firstname),
          lastname: trimValue(form.lastname),
          bio: trimValue(form.bio),
          facebook_url: trimValue(form.facebook_url),
          ...(shouldPersistPhotoUrl
            ? {
                photo: photoUrl,
                photo_url: photoUrl,
                avatar: photoUrl,
                avatar_url: photoUrl,
                avatarUrl: photoUrl,
                profile_image: photoUrl,
                profile_image_url: photoUrl,
              }
            : {}),
        });
      }

      const nextForm = getProfileFormFromProfile(nextProfile);
      setSelectedPhoto(null);
      setSelectedPhotoError("");
      setFormErrors({});
      setForm(nextForm);
      setPhotoUrlDraft(trimValue(nextForm.photo_url));
      setProfileMessage({
        type: "success",
        text: photoMirrorWarning
          ? `${t("Photo URL saved successfully.")} ${photoMirrorWarning}`
          :
          ((selectedPhoto || (photoUrlChanged && photoUrl)) && hasProfileDetailsChanges
            ? t("Profile and photo updated successfully.")
            : selectedPhoto || (photoUrlChanged && photoUrl)
              ? t("Photo updated successfully.")
              : t("Profile updated successfully.")),
      });
    } catch (requestError) {
      const serverFieldErrors = getFieldErrors(requestError);
      const nextErrors = {
        firstname: serverFieldErrors.firstname || "",
        lastname: serverFieldErrors.lastname || "",
        bio: serverFieldErrors.bio || "",
        facebook_url: serverFieldErrors.facebook_url || "",
      };

      setFormErrors((current) => ({ ...current, ...nextErrors }));
      setSelectedPhotoError(
        serverFieldErrors.photo ||
          serverFieldErrors.photo_url ||
          serverFieldErrors.avatar ||
          serverFieldErrors.avatar_url ||
          serverFieldErrors.profile_image ||
          serverFieldErrors.profile_image_url ||
          serverFieldErrors.avatar_file ||
          serverFieldErrors.photo_file ||
          selectedPhotoError,
      );
      setProfileMessage({
        type: "error",
        text: requestError.message || t("Unable to update your profile right now."),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (
      !trimValue(passwordForm.current_password) ||
      !trimValue(passwordForm.new_password) ||
      !trimValue(passwordForm.confirm_password)
    ) {
      setPasswordMessage({ type: "error", text: t("Please fill in all password fields.") });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({
        type: "error",
        text: t("New password and confirmation do not match."),
      });
      return;
    }

    if (trimValue(passwordForm.new_password).length < 8) {
      setPasswordMessage({
        type: "error",
        text: t("New password must be at least 8 characters."),
      });
      return;
    }

    setChangingPassword(true);

    try {
      const response = await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordMessage({
        type: "success",
        text: response?.message || t("Password updated successfully."),
      });
    } catch (requestError) {
      setPasswordMessage({
        type: "error",
        text: requestError.message || t("Unable to update your password."),
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const messageClassName = (messageType) =>
    messageType === "error"
      ? "text-rose-400"
      : messageType === "success"
        ? "text-emerald-400"
        : "text-slate-400";

  const panelClassName = "rounded-[28px] border border-white/10 bg-card-dark p-6 card-shadow";
  const subtleButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[color:var(--text)] transition hover:bg-white/10";
  const heroCardStyle = {
    background:
      "linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, var(--surface) 84%), color-mix(in srgb, var(--surface) 78%, var(--bg) 22%))",
    boxShadow: "0 30px 90px color-mix(in srgb, #000 18%, transparent)",
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div
        className="mb-8 flex flex-col gap-6 rounded-[32px] border border-white/10 p-6 lg:flex-row lg:items-center lg:justify-between"
        style={heroCardStyle}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <AuthorAvatarImage
              profile={{
                ...profile,
                avatarUrl: currentPhotoSrc,
                avatar_url: currentPhotoSrc,
                photo_url: currentPhotoSrc,
                profile_image_url: currentPhotoSrc,
              }}
              alt={profile?.fullName || t("Author profile photo")}
              className="h-28 w-28 rounded-[28px] border border-white/10 object-cover shadow-2xl"
            />
            <button
              type="button"
              onClick={() => {
                setShowPhotoOptions((current) => !current);
                setShowPhotoUrlEditor(false);
              }}
              className="absolute -bottom-2 -right-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[color:var(--text)] shadow-lg transition hover:bg-white/10"
            >
              <Camera className="size-3.5" />
              {t("Change")}
            </button>
            <input
              id="profile-photo"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="sr-only"
              ref={photoInputRef}
              onChange={handleSelectPhoto}
            />
            {showPhotoOptions ? (
              <div className="absolute left-0 top-full z-20 mt-4 w-56 rounded-2xl border border-white/10 bg-[var(--surface)] p-2 shadow-2xl">
                <button
                  type="button"
                  onClick={handleOpenFilePicker}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[color:var(--text)] transition hover:bg-white/10"
                >
                  <Camera className="size-4" />
                  {t("Choose local photo")}
                </button>
                <button
                  type="button"
                  onClick={handleOpenPhotoUrlEditor}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[color:var(--text)] transition hover:bg-white/10"
                >
                  <ExternalLink className="size-4" />
                  {t("Use image URL")}
                </button>
              </div>
            ) : null}
            {showPhotoUrlEditor ? (
              <div className="absolute left-0 top-full z-20 mt-4 w-72 rounded-[24px] border border-white/10 bg-[var(--surface)] p-4 shadow-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  {t("Profile photo URL")}
                </p>
                <input
                  type="url"
                  autoFocus
                  value={photoUrlDraft}
                  onChange={(event) => {
                    setPhotoUrlDraft(event.target.value);
                    setFormErrors((current) => ({ ...current, photo_url: "" }));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleApplyPhotoUrl();
                    }
                  }}
                  placeholder="https://example.com/photo.jpg"
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-[var(--surface-2)] px-4 py-3 text-sm text-[color:var(--text)] placeholder:text-slate-500 transition focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <p className="mt-2 text-xs text-slate-400">
                  {t("Paste a direct image link like")} <code>https://example.com/photo.jpg</code>
                </p>
                {formErrors.photo_url ? (
                  <p className="mt-2 text-xs text-rose-400">{formErrors.photo_url}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoUrlEditor(false);
                      setPhotoUrlDraft(trimValue(form.photo_url));
                    }}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[color:var(--text)] transition hover:bg-white/10"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPhotoUrl}
                    className="author-cta-primary rounded-2xl px-3 py-2 text-xs font-semibold transition"
                  >
                    {t("Apply URL")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-accent/90">
              {t("Author Profile")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{profile?.fullName || t("Author")}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                <Mail className="size-4" />
                {profile?.email || t("No email available")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                <ShieldCheck className="size-4 text-emerald-400" />
                {profile?.tier || t("Pro Author")}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {trimValue(profile?.bio) || t("Keep your public author profile fresh so readers see the right name, bio, and social link everywhere in the portal.")}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/author/my-books")}
            className={subtleButtonClassName}
          >
            <BookOpen className="size-4" />
            {t("My Books")}
          </button>
          <button
            type="button"
            onClick={() => {
              refreshProfile().catch(() => {});
            }}
            className="author-cta-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"
          >
            <RefreshCw className="size-4" />
            {t("Refresh")}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">{t("Unable to load profile")}</p>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <form
          onSubmit={handleSaveProfile}
          className={panelClassName}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{t("Public details")}</h2>
              {/* <p className="mt-1 text-sm text-slate-400">
                {t("These fields sync with")} <code>/api/me/profile</code>.
              </p> */}
            </div>
            {hasUnsavedChanges ? (
              <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {t("Unsaved changes")}
              </span>
            ) : (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {t("All changes saved")}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProfileField
              id="firstname"
              label={t("First Name")}
              value={form.firstname}
              onChange={(event) => handleFieldChange("firstname", event.target.value)}
              error={formErrors.firstname}
              placeholder={t("First name")}
            />
            <ProfileField
              id="lastname"
              label={t("Last Name")}
              value={form.lastname}
              onChange={(event) => handleFieldChange("lastname", event.target.value)}
              error={formErrors.lastname}
              placeholder={t("Last name")}
            />
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <label
                htmlFor="profile-email"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400"
              >
                {t("Email")}
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[var(--surface-2)] px-4 py-3 text-sm text-slate-300">
                <Mail className="size-4 text-slate-500" />
                <input
                  id="profile-email"
                  type="email"
                  readOnly
                  value={profile?.email || ""}
                  className="w-full bg-transparent text-[color:var(--text)] outline-none"
                />
              </div>
            </div>

            <ProfileField
              id="facebook_url"
              label={t("Facebook URL")}
              value={form.facebook_url}
              onChange={(event) => handleFieldChange("facebook_url", event.target.value)}
              error={formErrors.facebook_url}
              placeholder="https://facebook.com/your-page"
            />
            <ProfileField
              id="bio"
              label={t("Bio")}
              value={form.bio}
              onChange={(event) => handleFieldChange("bio", event.target.value)}
              error={formErrors.bio}
              placeholder={t("Tell readers a little about your work and interests.")}
              textarea
            />
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{t("Profile photo")}</p>
         
              </div>
              <label
                htmlFor="profile-photo-inline"
                className={subtleButtonClassName}
              >
                <Camera className="size-4" />
                {selectedPhoto ? t("Replace photo") : t("Choose photo")}
              </label>
              <input
                id="profile-photo-inline"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={handleSelectPhoto}
              />
            </div>
            {selectedPhoto ? (
              <p className="mt-3 text-xs text-slate-300">
                {t("Selected file")}: {selectedPhoto.name}
              </p>
            ) : null}
            {selectedPhotoError ? (
              <p className="mt-3 text-xs text-rose-400">{selectedPhotoError}</p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm ${messageClassName(profileMessage.type)}`}>{profileMessage.text || " "}</p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleResetChanges}
                disabled={savingProfile || (!hasUnsavedChanges && !profileMessage.text)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[color:var(--text)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("Reset")}
              </button>
              <button
                type="submit"
                disabled={savingProfile || loading}
                className="author-cta-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-glow transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                {savingProfile ? t("Saving...") : t("Save Profile")}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <form
            onSubmit={handlePasswordChange}
            className={panelClassName}
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-accent">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("Change password")}</h2>
                {/* <p className="mt-1 text-sm text-slate-400">
                  {t("This form submits to")} <code>POST /api/auth/change-password</code>.
                </p> */}
              </div>
            </div>

            <div className="space-y-4">
              <PasswordField
                id="current-password"
                label={t("Current password")}
                value={passwordForm.current_password}
                onChange={(event) => {
                  setPasswordForm((current) => ({
                    ...current,
                    current_password: event.target.value,
                  }));
                  setPasswordMessage({ type: "", text: "" });
                }}
                placeholder={t("Current password")}
              />
              <PasswordField
                id="new-password"
                label={t("New password")}
                value={passwordForm.new_password}
                onChange={(event) => {
                  setPasswordForm((current) => ({
                    ...current,
                    new_password: event.target.value,
                  }));
                  setPasswordMessage({ type: "", text: "" });
                }}
                placeholder={t("New password")}
              />
              <PasswordField
                id="confirm-password"
                label={t("Confirm new password")}
                value={passwordForm.confirm_password}
                onChange={(event) => {
                  setPasswordForm((current) => ({
                    ...current,
                    confirm_password: event.target.value,
                  }));
                  setPasswordMessage({ type: "", text: "" });
                }}
                placeholder={t("Confirm new password")}
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <p className={`text-sm ${messageClassName(passwordMessage.type)}`}>{passwordMessage.text || " "}</p>
              <button
                type="submit"
                disabled={changingPassword}
                className="author-cta-primary inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPassword ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {changingPassword ? t("Updating...") : t("Update Password")}
              </button>
            </div>
          </form>

          <div className={panelClassName}>
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-[color:var(--text)]">
                <User2 className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("Profile summary")}</h2>
                {/* <p className="mt-1 text-sm text-slate-400">
                  {t("A quick snapshot of the profile data currently cached in the client.")}
                </p> */}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-[var(--surface-2)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{t("Display name")}</p>
                <p className="mt-2 text-base font-semibold">{profile?.fullName || t("Author")}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[var(--surface-2)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{t("Photo source")}</p>
                {/* <p className="mt-2 break-all text-slate-300">
                  {getProfilePhotoSource(profile) || t("No photo uploaded yet")}
                </p> */}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/author/settings")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-[color:var(--text)] transition hover:bg-white/10"
                >
                  {t("Open settings")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (profile?.facebook_url) {
                      window.open(profile.facebook_url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  disabled={!profile?.facebook_url}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[color:var(--text)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ExternalLink className="size-4" />
                  {t("Open Facebook")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
