// Shared observers: no per-frame JS, scroll listeners, timers or animation library.
// The rotating layer only runs while its frame is visible and the tab is active.
const frames = new Map<HTMLElement, boolean>();
let intersection: IntersectionObserver | undefined;
let resize: ResizeObserver | undefined;

function update(node: HTMLElement, visible: boolean) {
  frames.set(node, visible);
  node.dataset.borderRunning = String(visible && !document.hidden);
}
function visibilityChanged() { for (const [node, visible] of frames) update(node, visible); }

export function borderVisibility(node: HTMLElement) {
  if (!frames.size) {
    intersection = new IntersectionObserver(entries => {
      for (const entry of entries) update(entry.target as HTMLElement, entry.isIntersecting);
    }, { threshold: 0.01 });
    resize = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Cover the entire rectangle even on tall cards, unlike a width-only square.
        const size = Math.ceil(Math.hypot(entry.contentRect.width, entry.contentRect.height)) + 8;
        (entry.target as HTMLElement).style.setProperty('--border-orbit-size', `${size}px`);
      }
    });
    document.addEventListener('visibilitychange', visibilityChanged);
  }
  frames.set(node, false);
  intersection?.observe(node);
  resize?.observe(node);
  return { destroy() {
    intersection?.unobserve(node);
    resize?.unobserve(node);
    frames.delete(node);
    if (!frames.size) {
      intersection?.disconnect(); resize?.disconnect();
      intersection = undefined; resize = undefined;
      document.removeEventListener('visibilitychange', visibilityChanged);
    }
  } };
}
