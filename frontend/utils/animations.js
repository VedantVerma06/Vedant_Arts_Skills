export function animateOnLoad(element, className = "show") {
  if (!element) return;
  requestAnimationFrame(() => element.classList.add(className));
}
