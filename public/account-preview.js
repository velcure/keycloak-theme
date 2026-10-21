// Studio-only interactions for captured native Account Console markup.
// This file is never packaged or served by the production Keycloak theme.
const page = document.querySelector(".pf-v5-c-page");
const sidebar = document.querySelector(".pf-v5-c-page__sidebar");
const toggle = document.querySelector("#nav-toggle");
const mobile = matchMedia("(max-width: 1199px)");
function setSidebar(expanded) {
  sidebar?.classList.toggle("pf-m-expanded", expanded);
  sidebar?.classList.toggle("pf-m-collapsed", !expanded);
  toggle?.setAttribute("aria-expanded", String(expanded));
}
function resize() {
  for (const name of [...(page?.classList ?? [])]) {
    if (name.startsWith("pf-m-breakpoint-")) page.classList.remove(name);
  }
  page?.classList.add(
    mobile.matches ? "pf-m-breakpoint-default" : "pf-m-breakpoint-xl",
  );
  setSidebar(!mobile.matches);
}
resize();
mobile.addEventListener("change", resize);
document.addEventListener("submit", (event) => event.preventDefault());
document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest("button");
  if (!button) return;
  event.preventDefault();
  if (button === toggle) {
    setSidebar(button.getAttribute("aria-expanded") !== "true");
    return;
  }
  const item = button.closest(".pf-v5-c-nav__item.pf-m-expandable");
  if (item) {
    const expanded = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(expanded));
    item.classList.toggle("pf-m-expanded", expanded);
    const subnav = item.querySelector(".pf-v5-c-nav__subnav");
    if (subnav) subnav.hidden = !expanded;
    return;
  }
  const notice = document.querySelector(".vc-preview-notice");
  if (notice) {
    notice.textContent =
      document.documentElement.lang === "de"
        ? "Visuelle Vorschau. Zum Speichern und Einrichten bitte „Im lokalen Keycloak testen“ öffnen."
        : "Visual preview. Use “Im lokalen Keycloak testen” to save changes or configure your account.";
    notice.hidden = false;
  }
});
