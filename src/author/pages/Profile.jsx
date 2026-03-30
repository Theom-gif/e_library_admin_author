import React, { useEffect, useMemo, useState } from "react";
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
import { useUserProfile } from "../hooks/useUserProfile";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

const EMPTY_FORM = {
  firstname: "",
  lastname: "",
  bio: "",
  facebook_url: "",
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
  };
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

  return errors;
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

function ProfileField({ id, label, value, onChange, error, placeholder, textarea = false }) {
  const baseClassName =
    "w-full rounded-2xl border bg-primary/5 px-4 py-3 text-sm text-[color:var(--text)] transition focus:outline-none focus:ring-2 focus:ring-accent/40";
  const className = `${baseClassName} ${
    error ? "border-rose-400/60" : "border-white/8 focus:border-accent/40"
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
        className="w-full rounded-2xl border border-white/8 bg-primary/5 px-4 py-3 text-sm text-[color:var(--text)] transition focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
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
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const baselineForm = useMemo(() => getProfileFormFromProfile(profile), [profile]);
  const hasTextChanges = useMemo(
    () =>
      trimValue(form.firstname) !== trimValue(baselineForm.firstname) ||
      trimValue(form.lastname) !== trimValue(baselineForm.lastname) ||
      trimValue(form.bio) !== trimValue(baselineForm.bio) ||
      trimValue(form.facebook_url) !== trimValue(baselineForm.facebook_url),
    [baselineForm, form],
  );
  const hasUnsavedChanges = hasTextChanges || Boolean(selectedPhoto);
  const currentPhotoSrc = photoPreviewUrl || profile?.avatarUrl;

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
    setSelectedPhotoError("");
    setProfileMessage({ type: "", text: "" });
  };

  const handleResetChanges = () => {
    setForm(getProfileFormFromProfile(profile));
    setFormErrors({});
    setSelectedPhoto(null);
    setSelectedPhotoError("");
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
      if (selectedPhoto) {
        await uploadAvatar(selectedPhoto);
      }

      if (hasTextChanges) {
        await updateProfile({
          firstname: trimValue(form.firstname),
          lastname: trimValue(form.lastname),
          bio: trimValue(form.bio),
          facebook_url: trimValue(form.facebook_url),
        });
      } else if (selectedPhoto) {
        await refreshProfile();
      }

      setSelectedPhoto(null);
      setSelectedPhotoError("");
      setFormErrors({});
      setProfileMessage({
        type: "success",
        text: selectedPhoto && hasTextChanges
          ? t("Profile and photo updated successfully.")
          : selectedPhoto
            ? t("Photo updated successfully.")
            : t("Profile updated successfully."),
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
          serverFieldErrors.avatar ||
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

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-6 rounded-[32px] border border-white/6 bg-[linear-gradient(135deg,rgba(74,134,143,0.22),rgba(13,18,29,0.95))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <img
              src={currentPhotoSrc}
              alt={profile?.fullName || t("Author profile photo")}
              className="h-28 w-28 rounded-[28px] border border-white/15 object-cover shadow-2xl"
            />
            <label
              htmlFor="profile-photo"
              className="absolute -bottom-2 -right-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black"
            >
              <Camera className="size-3.5" />
              {t("Change")}
            </label>
            <input
              id="profile-photo"
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={handleSelectPhoto}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-accent/90">
              {t("Author Profile")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{profile?.fullName || t("Author")}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1">
                <Mail className="size-4" />
                {profile?.email || t("No email available")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1">
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            <BookOpen className="size-4" />
            {t("My Books")}
          </button>
          <button
            type="button"
            onClick={() => {
              refreshProfile().catch(() => {});
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
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
          className="rounded-[28px] border border-white/6 bg-card-dark p-6 shadow-[0_20px_70px_rgba(0,0,0,0.16)]"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{t("Public details")}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {t("These fields sync with")} <code>/api/me/profile</code>.
              </p>
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
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-primary/5 px-4 py-3 text-sm text-slate-300">
                <Mail className="size-4 text-slate-500" />
                <input
                  id="profile-email"
                  type="email"
                  readOnly
                  value={profile?.email || ""}
                  className="w-full bg-transparent outline-none"
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

          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-primary/5 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{t("Profile photo")}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {t("PNG or JPEG, up to 5MB. Uploads use")} <code>POST /api/me/avatar</code>.
                </p>
              </div>
              <label
                htmlFor="profile-photo-inline"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Camera className="size-4" />
                {selectedPhoto ? t("Replace photo") : t("Choose photo")}
              </label>
              <input
                id="profile-photo-inline"
                type="file"
                accept="image/png,image/jpeg"
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

          <div className="mt-6 flex flex-col gap-3 border-t border-white/6 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm ${messageClassName(profileMessage.type)}`}>{profileMessage.text || " "}</p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleResetChanges}
                disabled={savingProfile || (!hasUnsavedChanges && !profileMessage.text)}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("Reset")}
              </button>
              <button
                type="submit"
                disabled={savingProfile || loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="rounded-[28px] border border-white/6 bg-card-dark p-6 shadow-[0_20px_70px_rgba(0,0,0,0.16)]"
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-accent/15 p-3 text-accent">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("Change password")}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {t("This form submits to")} <code>POST /api/auth/change-password</code>.
                </p>
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

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/6 pt-4">
              <p className={`text-sm ${messageClassName(passwordMessage.type)}`}>{passwordMessage.text || " "}</p>
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPassword ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {changingPassword ? t("Updating...") : t("Update Password")}
              </button>
            </div>
          </form>

          <div className="rounded-[28px] border border-white/6 bg-card-dark p-6 shadow-[0_20px_70px_rgba(0,0,0,0.16)]">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-white/8 p-3 text-slate-200">
                <User2 className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("Profile summary")}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {t("A quick snapshot of the profile data currently cached in the client.")}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-white/8 bg-primary/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{t("Display name")}</p>
                <p className="mt-2 text-base font-semibold">{profile?.fullName || t("Author")}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-primary/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{t("Photo source")}</p>
                <p className="mt-2 break-all text-slate-300">
                  {profile?.photo_url || profile?.photo || t("No photo uploaded yet")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/author/settings")}
                  className="rounded-2xl border border-white/10 bg-primary/5 px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/6"
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-primary/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-50"
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
