import React from "react";
import { Loader2, Plus } from "lucide-react";

const CreateCategoryForm = ({
  t,
  onSubmit,
  nameInputRef,
  formName,
  onFormNameChange,
  formError,
  successMessage,
  isSubmitting,
}) => (
  <form onSubmit={onSubmit} className="glass-card h-fit p-6">
    <h3 className="text-xl font-bold">{t("Create Category")}</h3>
    <p className="mt-1 text-sm text-slate-400">{t("Add New Category")}</p>

    <div className="mt-5 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          {t("Category Name")}
        </label>
        <input
          ref={nameInputRef}
          type="text"
          value={formName}
          onChange={(event) => onFormNameChange(event.target.value)}
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
);

export default CreateCategoryForm;
