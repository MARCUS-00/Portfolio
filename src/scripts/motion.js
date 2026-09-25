/*
 * The prototype's motion levels that need script. All of it is skipped under
 * prefers-reduced-motion, and none of it hides content that is already on
 * screen: only elements below the fold at load are armed for reveal.
 */
const EASE = "cubic-bezier(.22,.61,.24,1)";
const REVEAL = ".proj-viz, .moment, .statement, .section-head, .sysfull, .instrument";

export function initMotion({ motion }) {
  if (!motion()) return;
  const io = "IntersectionObserver" in window;
  countUps(io);
  if (io) reveals();
  pointerWash();
}

/* Level 4: one-shot count-up to the real value, which is already in the HTML. */
function countUps(io) {
  const els = Array.from(document.querySelectorAll("[data-count]"));
  const obs = io && new IntersectionObserver((entries, o) => {
    entries.forEach((en) => { if (en.isIntersecting) { run(en.target); o.unobserve(en.target); } });
  }, { threshold: 0.6 });
  const vh = window.innerHeight;
  els.forEach((el) => {
    if (el.getBoundingClientRect().top < vh) run(el);
    else if (obs) obs.observe(el);
  });
}

function run(el) {
  const node = el.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const final = node.nodeValue;
  const m = /^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/.exec(final);
  if (!m) return;
  const target = parseFloat(m[2]);
  const dec = m[2].includes(".") ? m[2].split(".")[1].length : 0;
  if (!isFinite(target)) return;
  const t0 = performance.now(), dur = 520;
  (function tick(now) {
    const t = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - t, 3);
    node.nodeValue = t < 1 ? m[1] + (target * e).toFixed(dec) + m[3] : final;
    if (t < 1) requestAnimationFrame(tick);
  })(t0);
}

/* Level 2: scroll reveal, below-the-fold elements only. */
function reveals() {
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
        { duration: 460, easing: EASE, fill: "backwards" });
      el.classList.remove("rv");
      el.classList.add("seen");
      o.unobserve(el);
    });
  }, { rootMargin: "0px 0px -6%", threshold: 0.05 });
  const vh = window.innerHeight;
  document.querySelectorAll(REVEAL).forEach((el) => {
    if (el.getBoundingClientRect().top <= vh) return; /* already visible or passed: never hide it */
    el.classList.add("rv");
    obs.observe(el);
  });
}

/* Level 3: pointer wash on project surfaces, fine pointers only, one write per frame. */
function pointerWash() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  document.querySelectorAll(".proj").forEach((el) => {
    let frame = 0;
    el.addEventListener("pointermove", (ev) => {
      if (frame) return;
      const x = ev.clientX, y = ev.clientY;
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--px", x - r.left + "px");
        el.style.setProperty("--py", y - r.top + "px");
        frame = 0;
      });
    }, { passive: true });
  });
}
