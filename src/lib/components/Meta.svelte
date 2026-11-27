<script lang="ts">
  import { page } from '$app/state';

  let {
    title = 'Desa Soulowe',
    description = 'Website informasi dan profil Desa Soulowe, Kecamatan Sigi Kota, Kabupaten Sigi.',
    image = '',
    type = 'website'
  }: { title?: string; description?: string; image?: string; type?: string } = $props();

  // OG image harus URL absolut supaya dikenali pembaca tautan. Kalau media
  // belum ada, tag-nya tidak dipasang sama sekali: lebih baik tanpa gambar
  // daripada menunjuk berkas contoh yang bukan milik desa.
  const absoluteImage = $derived(
    image ? (image.startsWith('http') ? image : `${page.url.origin}${image}`) : ''
  );
  const fullTitle = $derived(title === 'Desa Soulowe' ? 'Desa Soulowe: Informasi dan Profil Desa' : `${title} | Desa Soulowe`);
</script>
<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={page.url.origin + page.url.pathname} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content={type} />
  <meta property="og:url" content={page.url.origin + page.url.pathname} />
  {#if absoluteImage}<meta property="og:image" content={absoluteImage} />{/if}
  <meta name="twitter:card" content={absoluteImage ? 'summary_large_image' : 'summary'} />
  {#if absoluteImage}<meta name="twitter:image" content={absoluteImage} />{/if}
</svelte:head>
