export const setPointerCursors = (enabled: boolean) => {
  document.documentElement.toggleAttribute("data-pointer-cursors", enabled);
};

export const setColorScheme = (scheme: "system" | "light" | "dark") => {
  document.documentElement.style.colorScheme = scheme === "system" ? "light dark" : scheme;
};
