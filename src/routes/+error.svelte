<script lang="ts">
  import { page } from '$app/state';
  import PublicShell from '$lib/components/PublicShell.svelte';
  import Meta from '$lib/components/Meta.svelte';
</script>
<Meta title="Halaman tidak ditemukan" />
<PublicShell><section class="container section error-page"><span class="eyebrow">{page.status}</span><h1>Halaman belum<br />dapat ditemukan.</h1><p>Periksa kembali alamat halaman atau kembali ke beranda Desa Soulowe.</p><a class="button" href="/">Kembali ke beranda</a></section></PublicShell>
