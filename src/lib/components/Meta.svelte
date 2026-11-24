<script lang="ts">
  let { title = 'Desa Soulowe', description = 'Website informasi dan profil Desa Soulowe, Kecamatan Sigi Kota, Kabupaten Sigi.', image = '/images/landscape.jpg' } = $props();
</script>
<svelte:head>
  <title>{title === 'Desa Soulowe' ? 'Desa Soulowe: Informasi dan Profil Desa' : `${title} | Desa Soulowe`}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={`${title} | Desa Soulowe`} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:image" content={image} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>
