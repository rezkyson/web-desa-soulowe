<script lang="ts">
  import { onMount, untrack } from 'svelte';

  type Slide = { url: string; alt: string };

  let {
    slides,
    interval = 6000,
    label = 'Dokumentasi desa'
  }: { slides: Slide[]; interval?: number; label?: string } = $props();

  let index = $state(0);
  let reduce = $state(false);
  let inView = $state(true);
  let holding = $state(false);
  let frame = $state<HTMLDivElement>();
  let fill = $state<HTMLSpanElement>();
  // Bumped by a manual pick so both clocks restart from the chosen frame.
  let restart = $state(0);
  let order = $state<Slide[]>([]);

  // Seed from props reactively; onMount may then shuffle this copy.
  $effect(() => { if (!order.length) order = slides; });

  let total = $derived(order.length);
  // The card is ambient documentation: it runs on its own and has no
  // play/pause button. It still holds a frame while a visitor points at it or
  // tabs to a dot, and stops for a reduced-motion preference or a hidden tab.
  let running = $derived(!reduce && inView && !holding && total > 1);

  onMount(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    reduce = media.matches;
    const onMedia = () => { reduce = media.matches; };
    media.addEventListener('change', onMedia);

    // Randomise once on the client so every visit opens on a different frame.
    // Done after hydration to keep SSR markup stable.
    const shuffled = [...slides];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.length > 1) order = shuffled;

    // Two independent reasons to stop: the tab is hidden, or the card left the viewport.
    let onScreen = true;
    const sync = () => { inView = onScreen && !document.hidden; };
    const onVisibility = () => sync();
    document.addEventListener('visibilitychange', onVisibility);

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window && frame) {
      observer = new IntersectionObserver(entries => {
        onScreen = entries.some(entry => entry.isIntersecting);
        sync();
      }, { threshold: 0.15 });
      observer.observe(frame);
    }
    sync();

    return () => {
      media.removeEventListener('change', onMedia);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  });

  // Clock 1: advance the frame. index is read untracked so a frame change does
  // not restart the timer that caused it.
  $effect(() => {
    restart;
    if (!running) return;
    const timer = setInterval(() => {
      index = (untrack(() => index) + 1) % total;
    }, interval);
    return () => clearInterval(timer);
  });

  // Clock 2: draw the progress fill. Written straight to the node instead of
  // through state, so sixty frames a second cost no re-render.
  $effect(() => {
    restart;
    const el = fill;
    if (!running || !el) return;
    const start = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const p = Math.min((now - start) / interval, 1);
      el.style.transform = `scaleX(${p})`;
      if (p < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  });

  function go(target: number) {
    if (!total) return;
    index = (target + total) % total;
    // A manual pick earns a full interval before the next advance.
    restart += 1;
  }
</script>

<div
  class="hero-slides"
  bind:this={frame}
  role="group"
  aria-roledescription="slideshow"
  aria-label={label}
  onmouseenter={() => { holding = true; }}
  onmouseleave={() => { holding = false; }}
  onfocusin={() => { holding = true; }}
  onfocusout={() => { holding = false; }}
>
  {#each order as slide, i (slide.url)}
    <img
      src={slide.url}
      alt={slide.alt}
      width="800"
      height="550"
      loading={i === 0 ? 'eager' : 'lazy'}
      class:is-active={i === index}
      aria-hidden={i === index ? undefined : 'true'}
    />
  {/each}

  {#if total > 1}
    <div class="hero-slides-dots">
      {#each order as slide, i (slide.url)}
        <button
          type="button"
          class="hero-slide-dot"
          class:is-active={i === index}
          aria-label={`Tampilkan foto ${i + 1}: ${slide.alt}`}
          aria-current={i === index ? 'true' : undefined}
          onclick={() => go(i)}
        >
          {#if i === index}
            <span class="hero-slide-fill" bind:this={fill}></span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .hero-slides {
    position: relative;
    aspect-ratio: 16 / 11;
    overflow: hidden;
    background: #123f2c;
  }
  .hero-slides img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    /* Slow drift inward while visible, so a held frame never looks frozen. */
    transform: scale(1.06);
    transition: opacity 1100ms cubic-bezier(0.4, 0, 0.2, 1), transform 7000ms linear;
  }
  .hero-slides img.is-active {
    opacity: 1;
    transform: scale(1);
  }
  /* Plain gradient, not glass: the hero card is the only glass element. */
  .hero-slides::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 64px;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(6, 26, 18, 0) 0%, rgba(6, 26, 18, 0.62) 100%);
  }
  .hero-slides-dots {
    position: absolute;
    left: 12px;
    bottom: 9px;
    z-index: 1;
    display: flex;
    align-items: center;
    /* Overlapping hit areas are fine: each dot still owns its own 44px box. */
    gap: 0;
  }
  .hero-slide-dot {
    position: relative;
    display: grid;
    place-items: center;
    /* 44px hit area around a 16px indicator, so it is thumb friendly without
       looking heavier. Negative margin keeps the row visually compact. */
    width: 44px;
    height: 44px;
    margin: -13px -6px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .hero-slide-dot::before {
    content: '';
    width: 16px;
    height: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.38);
    transition: background 180ms ease;
  }
  .hero-slide-dot.is-active::before { background: rgba(255, 255, 255, 0.58); }
  .hero-slide-dot:hover::before { background: rgba(255, 255, 255, 0.82); }
  .hero-slide-dot:focus-visible { outline: 2px solid #a6d17f; outline-offset: -8px; border-radius: 8px; }
  .hero-slide-fill {
    position: absolute;
    /* Centred in the 44px hit area, still filling from its left edge. */
    left: calc(50% - 8px);
    top: calc(50% - 1.5px);
    width: 16px;
    height: 3px;
    border-radius: 2px;
    background: #a6d17f;
    transform: scaleX(0);
    transform-origin: left center;
    will-change: transform;
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-slides img { transition: opacity 200ms ease; transform: none; }
    .hero-slides img.is-active { transform: none; }
    /* No autoplay here, so the frame is marked rather than filled over time. */
    .hero-slide-dot.is-active::before { background: #a6d17f; }
    .hero-slide-fill { display: none; }
  }
</style>
