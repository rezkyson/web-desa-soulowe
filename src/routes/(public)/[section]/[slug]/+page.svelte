<script lang="ts">
  import { ArrowLeft, Copy, X, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import Meta from '$lib/components/Meta.svelte';
  import State from '$lib/components/State.svelte';
  import { date } from '$lib/utils';
  import { mediaUrl } from '$lib/media';
  import type { NewsDetail, AlbumDetail } from '$lib/data/types';

  let { data } = $props();

  const isNews = $derived(data.section === 'berita');
  const news = $derived(isNews ? (data.item as NewsDetail) : null);
  const album = $derived(!isNews ? (data.item as AlbumDetail) : null);

  // Foto yang bisa diperbesar: foto tambahan berita, atau seluruh isi album.
  type Slide = { url: string; alt: string };
  const gallery = $derived<Slide[]>(
    isNews
      ? (news?.images ?? [])
          .map(image => ({ url: mediaUrl(image.media), alt: image.alt || 'Foto kegiatan desa' }))
          .filter(slide => slide.url)
      : (album?.photos ?? [])
          .map(photo => ({ url: mediaUrl(photo.media), alt: photo.alt || 'Foto kegiatan desa' }))
          .filter(slide => slide.url)
  );

  const cover = $derived(mediaUrl(news?.cover ?? album?.cover));
  const heading = $derived(isNews ? news?.title ?? '' : album?.name ?? '');
  const lead = $derived(isNews ? news?.summary ?? '' : album?.description ?? '');
  const publishedOn = $derived(isNews ? news?.published_on ?? '' : album?.event_date ?? '');
  const byline = $derived(isNews ? news?.author || 'Pemerintah Desa Soulowe' : `${gallery.length} foto`);
  const isDummy = $derived(isNews ? news?.is_dummy ?? false : album?.is_dummy ?? false);

  let lightbox = $state<HTMLDialogElement>();
  let selectedIndex = $state(0);
  let copied = $state('');

  function view(index: number) {
    selectedIndex = index;
    lightbox?.showModal();
  }
  function step(direction: number) {
    if (!gallery.length) return;
    selectedIndex = (selectedIndex + direction + gallery.length) % gallery.length;
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copied = 'Tautan disalin';
    } catch {
      copied = 'Salin alamat halaman melalui bilah alamat browser.';
    }
  }
</script>

<Meta title={heading} description={lead} image={cover} type={isNews ? 'article' : 'website'} />
<div class="container section detail-page">
  <a class="text-link" href={`/${data.section}`}><ArrowLeft size={17} /> Kembali ke {isNews ? 'berita' : 'galeri'}</a>

  <header class="article-heading">
    <span class="eyebrow">{isNews ? news?.category || 'Kabar Desa' : 'Album kegiatan'}</span>
    <h1>{heading}</h1>
    <div class="news-meta"><span>{date(publishedOn)}</span><span>{byline}</span></div>
    <p class="lead">{lead}</p>
    {#if isDummy}
      <div class="notice">Konten contoh pengembangan. Foto ilustrasi, bukan dokumentasi resmi Desa Soulowe.</div>
    {/if}
  </header>

  {#if isNews}
    {#if cover}
      <figure class="article-image"><img src={cover} alt={`Foto utama untuk ${heading}`} width="1400" height="850" /><figcaption>Foto utama berita.</figcaption></figure>
    {/if}
    <div class="article-body">
      {#each (news?.body || '').split('\n\n').filter(Boolean) as paragraph}<p>{paragraph}</p>{/each}
      <button class="button secondary" onclick={copy}><Copy size={17} /> Salin tautan berita</button>
      <span role="status">{copied}</span>
    </div>
  {/if}

  {#if gallery.length}
    <div class="photo-grid">
      {#each gallery as slide, i (slide.url)}
        <button onclick={() => view(i)} aria-label={`Perbesar foto: ${slide.alt}`}>
          <img src={slide.url} alt={slide.alt} width="900" height="675" loading="lazy" decoding="async" />
        </button>
      {/each}
    </div>
  {:else if !isNews}
    <State title="Belum ada foto pada album ini" message="Operator belum menambahkan foto ke album ini." />
  {/if}
</div>

<dialog class="lightbox" bind:this={lightbox} aria-label="Pratinjau foto" onkeydown={(e) => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); }}>
  <button class="icon-button lightbox-close" onclick={() => lightbox?.close()} aria-label="Tutup foto"><X /></button>
  {#if gallery[selectedIndex]}
    <img src={gallery[selectedIndex].url} alt={gallery[selectedIndex].alt} />
    <p>{gallery[selectedIndex].alt}</p>
    <div class="actions">
      <button class="button cream" onclick={() => step(-1)}><ChevronLeft size={18} /> Sebelumnya</button>
      <button class="button cream" onclick={() => step(1)}>Berikutnya <ChevronRight size={18} /></button>
    </div>
  {/if}
</dialog>
