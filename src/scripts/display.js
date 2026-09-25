/*
 * Light mode and High contrast. The default is Dark with High contrast on. A visitor's
 * explicit change (Light mode on, High contrast off) is saved, and the inline boot script
 * re-applies it before first paint on the next page. Each preference is independent, so
 * switching to Light keeps whatever High contrast setting the visitor has.
 */
const KEY = { theme: "mk-theme", contrast: "mk-contrast" };

function save(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* storage unavailable: the choice lasts for this page only */ }
}

export function initDisplay() {
  const html = document.documentElement;
  const buttons = Array.from(document.querySelectorAll(".disp-btn[data-pref]"));
  if (!buttons.length) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  const isOn = {
    theme: () => html.getAttribute("data-theme") === "light",
    contrast: () => html.getAttribute("data-contrast") !== "normal",
  };

  function render() {
    buttons.forEach((b) => b.setAttribute("aria-pressed", isOn[b.dataset.pref]() ? "true" : "false"));
    if (meta) meta.content = getComputedStyle(html).getPropertyValue("--bg").trim() || meta.content;
  }

  function toggle(pref) {
    /* Recolour in one step: no staggered colour transitions mid-switch. */
    html.classList.add("theme-switch");
    if (pref === "theme") {
      const light = !isOn.theme();
      html.setAttribute("data-theme", light ? "light" : "dark");
      save(KEY.theme, light ? "light" : null);
    } else if (isOn.contrast()) {
      html.setAttribute("data-contrast", "normal");
      save(KEY.contrast, "normal");
    } else {
      html.removeAttribute("data-contrast");
      save(KEY.contrast, null);
    }
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("theme-switch")));
  }

  buttons.forEach((b) => b.addEventListener("click", () => toggle(b.dataset.pref)));
  render();
}
