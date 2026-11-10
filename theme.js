"use strict";

(() => {
  const root = document.documentElement;
  const storageKey = "aeroalpine-theme";
  const colors = { dark: "#081321", light: "#fafbfc" };
  let initialTheme = "dark";

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "dark" || saved === "light") initialTheme = saved;
  } catch {
    // The switch still works when browser storage is unavailable.
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = colors[theme];
    const toggle = document.querySelector("#theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(theme === "dark"));
      toggle.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    }
  }

  // Apply the saved choice before the stylesheet and page can paint.
  applyTheme(initialTheme);

  function connectSwitch() {
    const toggle = document.querySelector("#theme-toggle");
    if (!toggle) return;
    applyTheme(root.dataset.theme);
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Keep the selected theme for this page without requiring storage.
      }
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) applyTheme(event.newValue === "light" ? "light" : "dark");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectSwitch, { once: true });
  } else {
    connectSwitch();
  }
})();
