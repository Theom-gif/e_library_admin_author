export const THEME_STORAGE_KEY = "bookhub-theme";
const LEGACY_THEME_KEYS = ["admin-theme", "author-theme"];
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

export function isThemeValue(value) {
  return value === DARK_THEME || value === LIGHT_THEME;
}

export function getSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return LIGHT_THEME;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME;
}

export function getStoredTheme() {
  if (typeof window === "undefined") {
    return null;
  }

  const nextTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeValue(nextTheme)) {
    return nextTheme;
  }

  for (const key of LEGACY_THEME_KEYS) {
    const legacyTheme = window.localStorage.getItem(key);
    if (isThemeValue(legacyTheme)) {
      return legacyTheme;
    }
  }

  return null;
}

export function resolveInitialTheme() {
  return getStoredTheme() || LIGHT_THEME;
}

export function applyThemeToDocument(theme) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = isThemeValue(theme) ? theme : LIGHT_THEME;
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.style.colorScheme = resolvedTheme;

  if (resolvedTheme === DARK_THEME) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function persistTheme(theme) {
  if (typeof window === "undefined" || !isThemeValue(theme)) {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  for (const key of LEGACY_THEME_KEYS) {
    window.localStorage.removeItem(key);
  }
}

