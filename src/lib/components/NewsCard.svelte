<script lang="ts">
  import { ArrowUpRight } from '@lucide/svelte';
  import { date } from '$lib/utils';
  import { mediaUrl } from '$lib/media';
  import type { NewsSummary } from '$lib/data/types';
  import AnimatedBorder from './ui/AnimatedBorder.svelte';
  let { item }: { item: NewsSummary } = $props();
  const cover = $derived(mediaUrl(item.cover));
</script>

<article class="news-card">
  <AnimatedBorder class="news-card-frame" contentClassName="news-card-surface">
    <a class="image-link" href={`/berita/${item.slug}`} tabindex="-1" aria-hidden="true">
      {#if cover}<img src={cover} alt="" loading="lazy" width="800" height="500" />{/if}
      <span class="news-category">{item.category || 'Kabar Desa'}</span>
    </a>
    <div class="news-card-body">
      <time datetime={item.published_on}>{date(item.published_on)}</time>
      <h3><a href={`/berita/${item.slug}`}>{item.title}</a></h3>
      <p>{item.summary}</p>
      <div class="news-card-footer"><small>{item.is_dummy ? 'Konten contoh · foto ilustrasi' : item.author || 'Pemerintah Desa Soulowe'}</small><a href={`/berita/${item.slug}`} aria-label={`Baca berita: ${item.title}`} class="news-readmore">Baca berita <ArrowUpRight size={17} /></a></div>
    </div>
  </AnimatedBorder>
</article>
