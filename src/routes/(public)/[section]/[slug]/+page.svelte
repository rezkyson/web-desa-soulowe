<script lang="ts">
  import { ArrowLeft, Copy, X, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import Meta from '$lib/components/Meta.svelte';
  import State from '$lib/components/State.svelte';
  import { demo } from '$lib/mock/store';
  import { date } from '$lib/utils';
  import type { Photo } from '$lib/types';
  let { data } = $props();
  let item = $derived((data.section === 'berita' ? $demo.news : $demo.albums).find(n => n.slug === data.slug));
  let lightbox: HTMLDialogElement;
  let selected = $state<Photo | null>(null);
  let copied = $state('');
  function view(photo: Photo) { selected = photo; lightbox.showModal(); }
  function step(direction: number) { const photos = item?.photos || []; if (!photos.length) return; const i = photos.findIndex(p => p.id === selected?.id); selected = photos[(i + direction + photos.length) % photos.length]; }
  async function copy() { try { await navigator.clipboard.writeText(window.location.href); copied = 'Tautan disalin'; } catch { copied = 'Salin alamat halaman melalui bilah alamat browser.'; } }
</script>
<Meta title={item?.name || 'Konten tidak ditemukan'} description={item?.summary} image={item?.photo} />
<div class="container section detail-page"><a class="text-link" href={`/${data.section}`}><ArrowLeft size={17} /> Kembali ke {data.section === 'berita' ? 'berita' : 'galeri'}</a>
{#if item}<header class="article-heading"><span class="eyebrow">{data.section === 'berita' ? item.category : 'Album kegiatan'}</span><h1>{item.name}</h1><div class="news-meta"><span>{date(item.date)}</span><span>{data.section === 'berita' ? item.author : `${item.photos?.length || 0} foto`}</span></div><p class="lead">{item.summary}</p>{#if item.dummy}<div class="notice">Konten contoh pengembangan. Foto ilustrasi, bukan dokumentasi resmi Desa Soulowe.</div>{/if}</header>
  {#if data.section === 'berita'}{#if item.photo}<figure class="article-image"><img src={item.photo} alt={`Ilustrasi untuk ${item.name}`} width="1400" height="850" /><figcaption>Foto ilustrasi untuk preview website.</figcaption></figure>{/if}<div class="article-body">{#each (item.body || '').split('\n\n') as paragraph}<p>{paragraph}</p>{/each}<button class="button secondary" onclick={copy}><Copy size={17} /> Salin tautan berita</button><span role="status">{copied}</span></div>{/if}
  {#if item.photos?.length}<div class="photo-grid">{#each item.photos as photo}<button onclick={() => view(photo)} aria-label={`Perbesar foto: ${photo.alt}`}><img src={photo.url} alt={photo.alt} width="900" height="675" loading="lazy" decoding="async" /></button>{/each}</div>{:else if data.section === 'galeri'}<State title="Belum ada foto pada album ini" />{/if}
{:else}<State kind="error" title={data.section === 'berita' ? 'Berita tidak ditemukan' : 'Album tidak ditemukan'} message="Konten mungkin telah dihapus atau alamatnya berubah." /><a class="button secondary" href={`/${data.section}`}>Lihat semua {data.section}</a>{/if}</div>
<dialog class="lightbox" bind:this={lightbox} aria-label="Pratinjau foto" onkeydown={(e) => { if(e.key === 'ArrowLeft') step(-1); if(e.key === 'ArrowRight') step(1); }}><button class="icon-button lightbox-close" onclick={() => lightbox.close()} aria-label="Tutup foto"><X /></button>{#if selected}<img src={selected.url} alt={selected.alt} /><p>{selected.alt}</p><div class="actions"><button class="button cream" onclick={() => step(-1)}><ChevronLeft size={18} /> Sebelumnya</button><button class="button cream" onclick={() => step(1)}>Berikutnya <ChevronRight size={18} /></button></div>{/if}</dialog>
