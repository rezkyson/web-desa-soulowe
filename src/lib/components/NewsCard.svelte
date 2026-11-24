<script lang="ts">
  import { ArrowUpRight } from '@lucide/svelte';
  import { date } from '$lib/utils';
  import type { Entry } from '$lib/types';
  import AnimatedBorder from './ui/AnimatedBorder.svelte';
  let { item }: { item: Entry } = $props();
</script>

<article class="news-card">
  <AnimatedBorder class="news-card-frame" contentClassName="news-card-surface">
    <a class="image-link" href={`/berita/${item.slug}`} tabindex="-1" aria-hidden="true">
      <img src={item.photo} alt="" loading="lazy" width="800" height="500" />
      <span class="news-category">{item.category || 'Kabar Desa'}</span>
    </a>
    <div class="news-card-body">
      <time datetime={item.date}>{date(item.date)}</time>
      <h3><a href={`/berita/${item.slug}`}>{item.name}</a></h3>
      <p>{item.summary}</p>
      <div class="news-card-footer"><small>{item.dummy ? 'Konten contoh · foto ilustrasi' : item.author || 'Pemerintah Desa Soulowe'}</small><a href={`/berita/${item.slug}`} aria-label={`Baca berita: ${item.name}`} class="news-readmore">Baca berita <ArrowUpRight size={17} /></a></div>
    </div>
  </AnimatedBorder>
</article>
