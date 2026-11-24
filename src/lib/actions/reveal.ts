/** Progressive enhancement: content stays visible without JS or with reduced motion.
 * Animate only a few section groups, once, without blocking links or focus. */
export function reveal(node: HTMLElement, delay = 0) {
  // Starts as shown: content is only marked pending when it is actually hidden.
  node.dataset.reveal = 'shown';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let observer: IntersectionObserver | undefined;
  let animation: Animation | undefined;
  let finished = false;
  function show() {
    node.style.removeProperty('opacity');
    node.dataset.reveal = 'shown';
    animation?.cancel();
    observer?.disconnect();
  }
  function enter() {
    if (finished) return;
    finished = true;
    node.style.removeProperty('opacity');
    node.dataset.reveal = 'shown';
    if (!preference.matches) {
      animation = node.animate(
        [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 560, delay: Math.min(delay, 120), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
      );
    }
    observer?.disconnect();
  }
  function motionChanged() { if (preference.matches) { finished = true; show(); } }
  if (!preference.matches && 'IntersectionObserver' in window && typeof node.animate === 'function') {
    const bounds = node.getBoundingClientRect();
    if (bounds.top < innerHeight) enter();
    else {
      node.style.opacity = '0';
      node.dataset.reveal = 'pending';
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) enter();
      }, { threshold: 0, rootMargin: '0px 0px 32px 0px' });
      observer.observe(node);
    }
  }
  // Keyboard navigation must never land on invisible content.
  function focused() { finished = true; show(); }
  node.addEventListener('focusin', focused);
  preference.addEventListener('change', motionChanged);
  return { destroy() { show(); node.removeEventListener('focusin', focused); preference.removeEventListener('change', motionChanged); } };
}
