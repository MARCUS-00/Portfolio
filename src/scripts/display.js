/*
 * Light mode. The default is Dark. A visitor's explicit switch to Light is saved, and the
 * inline boot script re-applies it before first paint on the next page. High contrast is
 * not a setting: it is built into both themes.
 */
const KEY = "mk-theme";

function save(value) {
  try {
    if (value == null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch { /* storage unavailable: the choice lasts for this page only */ }
}

export function initDisplay() {
  const html = document.documentElement;
  const buttons = Array.from(document.querySelectorAll('.disp-btn[data-pref="theme"]'));
  if (!buttons.length) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  const isLight = () => html.getAttribute("data-theme") === "light";

  function render() {
    buttons.forEach((b) => b.setAttribute("aria-pressed", isLight() ? "true" : "false"));
    if (meta) meta.content = getComputedStyle(html).getPropertyValue("--bg").trim() || meta.content;
  }

  function toggle() {
    /* Recolour in one step: no staggered colour transitions mid-switch. */
    html.classList.add("theme-switch");
    const light = !isLight();
    html.setAttribute("data-theme", light ? "light" : "dark");
    save(light ? "light" : null);
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("theme-switch")));
  }

  buttons.forEach((b) => b.addEventListener("click", toggle));
  render();
}
