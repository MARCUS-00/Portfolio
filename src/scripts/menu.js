/* Narrow-width menu: a disclosure button controlling the drawer. */
export function initMenu() {
  const btn = document.querySelector(".menu-btn[data-js]");
  const drawer = document.getElementById("drawer");
  if (!btn || !drawer) return;

  const isOpen = () => drawer.classList.contains("open");
  function set(open, restoreFocus) {
    drawer.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open && restoreFocus) btn.focus();
  }

  btn.addEventListener("click", () => set(!isOpen()));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) set(false, drawer.contains(document.activeElement));
  });
  /* Returning via back/forward restores the page from cache with the drawer as it was; start closed. */
  window.addEventListener("pageshow", (e) => { if (e.persisted) set(false); });
}
