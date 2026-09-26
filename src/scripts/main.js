/*
 * Enhancement only. Every page is complete HTML without this file: content is
 * visible, links work, and the drawer opens via :target. Each module is
 * isolated so one failure cannot take the others down.
 */
import { initDisplay } from "./display.js";
import { initMenu } from "./menu.js";
import { initTopology } from "./topology.js";
import { initMotion } from "./motion.js";
import { initCaseNav } from "./case-nav.js";

const html = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const motion = () => !reduce.matches;
const sync = () => html.classList.toggle("motion", motion());
sync();
if (reduce.addEventListener) reduce.addEventListener("change", sync);

/* Motion arms reveals before case navigation scrolls to a deep-linked section,
   so elements are measured from where the page starts. */
for (const init of [initDisplay, initMenu, initTopology, initMotion, initCaseNav]) {
  try {
    init({ motion });
  } catch (err) {
    console.error(err);
  }
}
