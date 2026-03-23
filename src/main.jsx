import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { applyThemeToDocument, resolveInitialTheme } from "./theme/themeUtils";

applyThemeToDocument(resolveInitialTheme());

const savedLanguage =
  window.localStorage.getItem("bookhub-language") ||
  window.localStorage.getItem("admin-language");
const resolvedLanguage = savedLanguage === "km" || savedLanguage === "zh" ? savedLanguage : "en";
document.documentElement.setAttribute("data-language", resolvedLanguage);
document.documentElement.lang = resolvedLanguage;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
