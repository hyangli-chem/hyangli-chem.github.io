"use strict";

if (window.lucide) window.lucide.createIcons();

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");

function setMenu(open) {
  navigation.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) setMenu(false);
});
window.matchMedia("(min-width: 961px)").addEventListener("change", () => setMenu(false));

function revealLinkedDetails() {
  const target = document.getElementById(location.hash.slice(1));
  if (target?.tagName === "DETAILS") target.open = true;
}
revealLinkedDetails();
window.addEventListener("hashchange", revealLinkedDetails);

const photoViewer = document.querySelector("#photo-viewer");
const photoStage = photoViewer.querySelector(".photo-stage");
const photoCaption = photoViewer.querySelector("figcaption");
const photoClose = photoViewer.querySelector(".photo-close");
let photoOpener;

document.querySelectorAll(".photo-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    const source = button.querySelector("img");
    const photo = new Image();
    photo.src = source.currentSrc || source.src;
    photo.alt = source.alt;
    photo.width = source.naturalWidth || source.width;
    photo.height = source.naturalHeight || source.height;
    photoStage.replaceChildren(photo);
    photoCaption.textContent = button.closest("figure")?.querySelector("figcaption")?.textContent.trim() || source.alt;
    photoOpener = button;
    document.body.classList.add("photo-open");
    photoViewer.showModal();
  });
});

photoClose.addEventListener("click", () => photoViewer.close());
photoViewer.addEventListener("keydown", (event) => {
  // The close button is the viewer's only interactive control.
  if (event.key === "Tab") {
    event.preventDefault();
    photoClose.focus();
  }
});
photoViewer.addEventListener("click", (event) => {
  const bounds = photoViewer.getBoundingClientRect();
  if (event.target === photoViewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) {
    photoViewer.close();
  }
});
photoViewer.addEventListener("close", () => {
  document.body.classList.remove("photo-open");
  photoStage.replaceChildren();
  photoOpener?.focus({ preventScroll: true });
});

const citation = "Shi, H.; Wang, J.; Zhu, Y.; Li, H.; Ju, G.; Zhang, L.; Wang, C. Highly selective alpha-C(sp3)-H arylation of alkenyl amides via nickel chain-walking catalysis. Chinese Chemical Letters 2024, 35(7), 109333. https://doi.org/10.1016/j.cclet.2023.109333";
const toast = document.querySelector(".toast");
let toastTimeout;
function notify(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}
document.querySelector(".copy-citation")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(citation);
    notify("Citation copied.");
  } catch {
    notify("Clipboard unavailable. You can download the citation instead.");
  }
});

function enableScrollEffects() {
  const header = document.querySelector(".site-header");
  const sunLogo = header.querySelector(".brand-symbol");
  const sunCore = header.querySelector(".sun-core");
  const sunRays = [...header.querySelectorAll(".sun-ray")];
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const isHome = document.body.classList.contains("page-index");
  const targets = isHome ? [] : document.querySelectorAll([
    ".main-content > .section > .section-heading",
    ".main-content > .section > article",
    ".main-content > .section > p",
    ".education-entry",
    ".honors-list > div",
  ].join(","));
  const photos = document.querySelectorAll(".activity-photo");
  const visiblePhotos = new Set();
  const homeBlocks = new Map();
  if (isHome) {
    document.querySelectorAll(".profile > *, .main-content > .section").forEach((element) => {
      homeBlocks.set(element, { shift: 0, fixed: false });
      element.classList.add("home-scroll-block");
    });
  }
  let frame = 0;

  function reveal(element, immediate = false) {
    if (!element) return;
    if (immediate) element.classList.add("scroll-immediate");
    element.classList.remove("scroll-pending");
    revealObserver.unobserve(element);
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, { rootMargin: "0px 0px -40px 0px", threshold: 0 });

  // Leave the first screen and restored scroll positions immediately readable.
  targets.forEach((element) => {
    if (element.getBoundingClientRect().top < innerHeight - 40) return;
    element.classList.add("scroll-reveal", "scroll-pending");
    revealObserver.observe(element);
  });
  document.body.classList.add("scroll-effects");

  function update() {
    frame = 0;
    const range = document.documentElement.scrollHeight - innerHeight;
    const progress = range > 0 ? clamp(scrollY / range) : 0;
    const readingTop = header.offsetHeight + 16;
    // Subtract the previous translation so motion never feeds back into its own position.
    const homeStates = [...homeBlocks].map(([element, state]) => {
      if (state.fixed) return [element, state, 0, 1, 1];
      const bounds = element.getBoundingClientRect();
      const top = bounds.top - state.shift;
      const entrance = clamp((innerHeight * .94 - top) / (innerHeight * .28));
      const eased = entrance * entrance * (3 - 2 * entrance);
      const exit = clamp((readingTop - top) / (element.offsetHeight + innerHeight * .25));
      const shift = 56 * (1 - eased) - 32 * exit - 12 * progress;
      const scale = element.classList.contains("portrait-trigger") ? .9 + .1 * eased - .025 * exit : 1;
      return [element, state, shift, eased, scale];
    });
    const photoStates = [...visiblePhotos].map((photo) => {
      const position = (innerHeight - photo.getBoundingClientRect().top) / (innerHeight * .7);
      const settled = clamp(position);
      return [photo, .86 + .14 * settled, 28 * (1 - settled)];
    });
    header.classList.toggle("is-scrolled", scrollY > 24);
    header.style.setProperty("--scroll-progress", range > 0 ? progress.toFixed(4) : "0");
    // Reveal the original bitmap through stroke masks; never redraw its ink.
    const drawStroke = (stroke, drawn) => {
      stroke?.style.setProperty("--sun-offset", (100 * (1 - drawn)).toFixed(2));
      stroke?.style.setProperty("--sun-stroke-opacity", drawn > 0 ? "1" : "0");
    };
    drawStroke(sunCore, clamp(progress / .35));
    sunRays.forEach((ray, index) => {
      const delay = .22 + index * .4 / Math.max(1, sunRays.length - 1);
      drawStroke(ray, clamp((progress - delay) / .28));
    });
    sunLogo?.classList.toggle("is-complete", progress >= .9);
    homeStates.forEach(([element, state, shift, opacity, scale]) => {
      state.shift = Number(shift.toFixed(2));
      element.style.setProperty("--home-shift", `${state.shift}px`);
      element.style.setProperty("--home-opacity", opacity.toFixed(4));
      element.style.setProperty("--home-scale", scale.toFixed(4));
    });
    photoStates.forEach(([photo, scale, shift]) => {
      photo.style.setProperty("--photo-scale", scale.toFixed(4));
      photo.style.setProperty("--photo-shift", `${shift.toFixed(2)}px`);
    });
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  const photoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visiblePhotos.add(entry.target);
      else visiblePhotos.delete(entry.target);
    });
    scheduleUpdate();
  }, { rootMargin: "120px 0px" });
  photos.forEach((photo) => {
    photo.classList.add("scroll-photo");
    photoObserver.observe(photo);
  });

  function showHomeBlock(target) {
    const element = target?.closest(".home-scroll-block");
    const state = homeBlocks.get(element);
    if (!state) return;
    state.fixed = true;
    state.shift = 0;
    element.style.setProperty("--home-opacity", "1");
    element.style.setProperty("--home-shift", "0px");
    element.style.setProperty("--home-scale", "1");
  }

  function revealFocusedContent(event) {
    reveal(event.target.closest(".scroll-reveal"), true);
    showHomeBlock(event.target);
  }

  function revealHashTarget() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    showHomeBlock(target);
    reveal(target.closest(".scroll-reveal"), true);
    target.querySelectorAll(".scroll-reveal").forEach((element) => reveal(element, true));
  }

  function restoreVisibleContent() {
    targets.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < innerHeight && bounds.bottom > 0) reveal(element, true);
    });
    scheduleUpdate();
  }

  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(scheduleUpdate) : null;
  resizeObserver?.observe(document.body);
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("pageshow", restoreVisibleContent);
  window.addEventListener("hashchange", revealHashTarget);
  document.addEventListener("focusin", revealFocusedContent);
  document.addEventListener("toggle", scheduleUpdate, true);
  revealHashTarget();
  update();

  return () => {
    cancelAnimationFrame(frame);
    revealObserver.disconnect();
    photoObserver.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("pageshow", restoreVisibleContent);
    window.removeEventListener("hashchange", revealHashTarget);
    document.removeEventListener("focusin", revealFocusedContent);
    document.removeEventListener("toggle", scheduleUpdate, true);
    document.body.classList.remove("scroll-effects");
    header.classList.remove("is-scrolled");
    header.style.removeProperty("--scroll-progress");
    sunLogo?.classList.remove("is-complete");
    [sunCore, ...sunRays].forEach((stroke) => {
      stroke?.style.removeProperty("--sun-offset");
      stroke?.style.removeProperty("--sun-stroke-opacity");
    });
    targets.forEach((element) => element.classList.remove("scroll-reveal", "scroll-pending", "scroll-immediate"));
    homeBlocks.forEach((state, element) => {
      element.classList.remove("home-scroll-block");
      ["--home-shift", "--home-opacity", "--home-scale"].forEach((property) => element.style.removeProperty(property));
    });
    photos.forEach((photo) => {
      photo.classList.remove("scroll-photo");
      photo.style.removeProperty("--photo-scale");
      photo.style.removeProperty("--photo-shift");
    });
  };
}

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let disableScrollEffects;
function applyMotionPreference() {
  disableScrollEffects?.();
  disableScrollEffects = undefined;
  if (!motionPreference.matches && "IntersectionObserver" in window) {
    disableScrollEffects = enableScrollEffects();
  }
}
applyMotionPreference();
motionPreference.addEventListener("change", applyMotionPreference);
