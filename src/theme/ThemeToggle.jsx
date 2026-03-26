import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function ThemeToggle({
  className = "",
  iconSize = 18,
  labelClassName = "",
  showLabel = false,
}) {
  const { isDark, toggleTheme } = useTheme();
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 ${className}`.trim()}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {isDark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
      {showLabel ? (
        <span className={labelClassName || "font-medium"}>
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      ) : null}
    </button>
  );
}

