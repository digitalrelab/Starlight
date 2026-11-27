export const setPointerCursors = (enabled: boolean) => {
  document.documentElement.toggleAttribute("data-pointer-cursors", enabled);
};
