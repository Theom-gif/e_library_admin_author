import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  applyThemeToDocument,
  getStoredTheme,
  getSystemTheme,
  persistTheme,
} from "./themeUtils";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [storedTheme, setStoredTheme] = useState(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const theme = storedTheme || systemTheme;

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    if (storedTheme) {
      persistTheme(storedTheme);
    }
  }, [storedTheme]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      if (!storedTheme) {
        setSystemTheme(event.matches ? "dark" : "light");
      }
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [storedTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        setStoredTheme((currentTheme) =>
          typeof nextTheme === "function" ? nextTheme(currentTheme || systemTheme) : nextTheme,
        );
      },
      toggleTheme: () => {
        setStoredTheme((currentTheme) =>
          (currentTheme || systemTheme) === "dark" ? "light" : "dark",
        );
      },
      isDark: theme === "dark",
    }),
    [systemTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
