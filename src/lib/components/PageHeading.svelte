<script lang="ts">
  let { eyebrow = 'Desa Soulowe', title, description = '' }: { eyebrow?: string; title: string; description?: string } = $props();
</script>
<section class="page-heading"><div class="container"><div class="breadcrumb"><a href="/">Beranda</a><span>/</span><span>{title}</span></div><span class="eyebrow">{eyebrow}</span><h1>{title}</h1>{#if description}<p>{description}</p>{/if}</div></section>
