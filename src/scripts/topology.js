/*
 * Home topology. Wide: every lane is visible; hovering or focusing a lane (or
 * its button) follows that path and dims the rest, and leaving resets. Narrow:
 * one lane at a time, chosen with the buttons, defaulting to the first.
 */
const NARROW = 700; /* matches @container site (max-width:699px) */

export function initTopology() {
  const topo = document.getElementById("topo");
  if (!topo) return;
  const site = topo.closest(".site") || document.body;
  const lanes = Array.from(topo.querySelectorAll(".lane"));
  const buttons = Array.from(topo.querySelectorAll(".lane-btn"));
  const note = document.getElementById("topoNote");
  if (!lanes.length) return;

  const defaultNote = note ? note.textContent : "";
  const notes = Object.fromEntries(buttons.map((b) => [b.dataset.lane, b.dataset.note || defaultNote]));
  let narrow = site.getBoundingClientRect().width < NARROW;
  let active;

  function setLane(id) {
    if (id === active) return;
    active = id;
    if (id) topo.setAttribute("data-active", id);
    else topo.removeAttribute("data-active");
    lanes.forEach((l) => l.classList.toggle("on", !id || l.dataset.lane === id));
    buttons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.lane === id ? "true" : "false"));
    if (note) note.textContent = id ? notes[id] : defaultNote;
  }
  const reset = () => setLane(narrow ? lanes[0].dataset.lane : null);

  buttons.forEach((b) => {
    const id = b.dataset.lane;
    b.addEventListener("click", () => setLane(id));
    b.addEventListener("mouseenter", () => { if (!narrow) setLane(id); });
    b.addEventListener("focus", () => setLane(id));
  });
  lanes.forEach((l) => l.addEventListener("mouseenter", () => { if (!narrow) setLane(l.dataset.lane); }));
  topo.addEventListener("mouseleave", () => { if (!narrow) reset(); });
  topo.addEventListener("focusout", (e) => { if (!narrow && !topo.contains(e.relatedTarget)) reset(); });
  reset();

  /* Width is tracked by observation rather than measured on every pointer event. */
  if ("ResizeObserver" in window) {
    new ResizeObserver((entries) => {
      const n = entries[0].contentRect.width < NARROW;
      if (n !== narrow) { narrow = n; reset(); }
    }).observe(site);
  }
}
