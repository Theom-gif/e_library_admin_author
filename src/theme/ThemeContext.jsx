import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  applyThemeToDocument,
  getStoredTheme,
  persistTheme,
} from "./themeUtils";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [storedTheme, setStoredTheme] = useState(getStoredTheme);
  const theme = storedTheme || "light";

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    if (storedTheme) {
      persistTheme(storedTheme);
    }
  }, [storedTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        setStoredTheme((currentTheme) =>
          typeof nextTheme === "function" ? nextTheme(currentTheme || "light") : nextTheme,
        );
      },
      toggleTheme: () => {
        setStoredTheme((currentTheme) =>
          (currentTheme || "light") === "dark" ? "light" : "dark",
        );
      },
      isDark: theme === "dark",
    }),
    [theme],
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
