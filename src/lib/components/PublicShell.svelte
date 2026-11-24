<script lang="ts">
  import { page } from '$app/state';
  import { ArrowUpRight, Menu, X, MapPin, ArrowRight } from '@lucide/svelte';
  import { demo } from '$lib/mock/store';
  import { village } from '$lib/content/desa';
  import PublicMotion from './PublicMotion.svelte';
  let { children } = $props();
  let menu = $state(false);
  let solid = $state(false);
  let toggle = $state<HTMLButtonElement>();
  const links = [['/', 'Beranda'], ['/profil', 'Profil Desa'], ['/pemerintahan', 'Pemerintahan'], ['/data', 'Data Desa'], ['/keuangan', 'Keuangan'], ['/berita', 'Berita'], ['/galeri', 'Galeri']];
  let isHome = $derived(page.url.pathname === '/');
  $effect(() => { page.url.pathname; menu = false; });
  $effect(() => {
    if (!isHome) return;
    const onScroll = () => { solid = window.scrollY > 80; };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
  // Escape closes the panel and puts focus back on the control that opened it,
  // so keyboard users are not dropped at the top of the document.
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !menu) return;
    menu = false;
    toggle?.focus();
  }
</script>
<PublicMotion />
<svelte:window onkeydown={onKeydown} />
<a class="skip-link" href="#main">Lewati ke konten</a>
{#if !isHome}<div class="topline"><div class="container"><span>Pemerintah Desa Soulowe</span><span>Kecamatan Sigi Kota <span class="top-dot">•</span> Kabupaten Sigi</span></div></div>{/if}
<header class="public-header" class:is-overlay={isHome} class:is-solid={isHome && solid}>
  <div class="container header-inner">
    <a href="/" class="brand" aria-label="Desa Soulowe, beranda"><img src={$demo.settings.logo} width="39" height="56" alt="Lambang Kabupaten Sigi" /><span><strong>SOULOWE</strong><small>Kabupaten Sigi</small></span></a>
    <nav id="navigasi-utama" aria-label="Navigasi utama" class:mobile-open={menu}>
      {#each links as [href, text]}<a {href} aria-current={page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(`${href}/`)) ? 'page' : undefined}>{text}</a>{/each}
      <a class="nav-contact" href="/kontak">Hubungi desa <ArrowUpRight size={16} /></a>
    </nav>
    <button class="icon-button menu-toggle" bind:this={toggle} aria-label={menu ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={menu} aria-controls="navigasi-utama" onclick={() => menu = !menu}>{#if menu}<X />{:else}<Menu />{/if}</button>
  </div>
</header>
<main id="main" tabindex="-1" class="public-main">{@render children()}</main>
<section class="contact-strip"><div class="container"><div><span class="eyebrow light">Tetap terhubung</span><h2>Butuh informasi dari desa?</h2><p>Temukan lokasi kantor dan kanal WhatsApp pemerintah desa.</p></div><a class="button cream" href="/layanan">Layanan WhatsApp <ArrowUpRight size={18} /></a></div></section>
<footer class="public-footer"><div class="container footer-grid">
  <div><a href="/" class="brand"><img src={$demo.settings.logo} width="36" height="51" alt="Lambang Kabupaten Sigi" /><span><strong>SOULOWE</strong><small>Desa di Kabupaten Sigi</small></span></a><p>Ruang informasi, cerita, dan keterbukaan<br />Pemerintah Desa Soulowe.</p></div>
  <div><h3>Jelajahi desa</h3><a href="/profil">Profil Desa</a><a href="/pemerintahan">Pemerintahan</a><a href="/data">Data Desa</a><a href="/keuangan">Keuangan Desa</a></div>
  <div><h3>Kabar dan dokumentasi</h3><a href="/berita">Berita Desa</a><a href="/galeri">Galeri Kegiatan</a><a href="/layanan">Layanan WhatsApp</a><a href="/admin/login">Masuk Operator <ArrowRight size={13} /></a></div>
  <div><h3>Kantor Desa</h3><p>{village.address}<br />Kec. Sigi Kota, Kab. Sigi<br />Sulawesi Tengah</p><a href="/kontak" class="text-link"><MapPin size={15} /> Lihat lokasi <ArrowUpRight size={15} /></a></div>
</div><div class="container footer-bottom"><span>© 2026 Pemerintah Desa Soulowe.</span><span>Preview pengembangan · Konten contoh belum resmi</span></div></footer>
