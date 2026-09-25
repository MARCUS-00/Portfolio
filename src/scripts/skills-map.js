/*
 * Skills as a relationship map: pointing at a skill (or focusing its link)
 * highlights every skill demonstrated by the same system and dims the rest.
 */
export function initSkillsMap() {
  const host = document.getElementById("skillRows");
  if (!host) return;
  const skills = Array.from(host.querySelectorAll(".skill"));
  const proofs = Array.from(host.querySelectorAll("a.proof[data-p]"));
  const idsOf = (el) => (el.dataset.proj || "").split(" ").filter(Boolean);

  function focus(ids) {
    skills.forEach((el) => {
      const match = !!ids && idsOf(el).some((id) => ids.includes(id));
      el.classList.toggle("dim", !!ids && !match);
    });
    proofs.forEach((a) => a.classList.toggle("rel", !!ids && ids.includes(a.dataset.p)));
  }

  skills.forEach((el) => {
    const ids = idsOf(el);
    if (!ids.length) return;
    el.addEventListener("mouseenter", () => focus(ids));
    el.addEventListener("mouseleave", () => focus(null));
    el.addEventListener("focusin", (e) => focus(e.target.dataset.p ? [e.target.dataset.p] : ids));
    el.addEventListener("focusout", () => focus(null));
  });
  /* Within a skill that several systems demonstrate, the link under the pointer narrows it to one. */
  proofs.forEach((a) => {
    a.addEventListener("mouseenter", () => focus([a.dataset.p]));
    a.addEventListener("mouseleave", () => focus(idsOf(a.closest(".skill"))));
  });
}
