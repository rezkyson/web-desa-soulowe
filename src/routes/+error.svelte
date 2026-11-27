<script lang="ts">
  import { page } from '$app/state';
  import PublicShell from '$lib/components/PublicShell.svelte';
  import Meta from '$lib/components/Meta.svelte';

  // Halaman error dipakai juga untuk kegagalan backend, bukan hanya 404.
  // Header dan footer tetap tampil tanpa logo karena data layout tidak
  // tersedia saat error terjadi.
  const notFound = $derived(page.status === 404);
</script>
<Meta title={notFound ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'} />
<PublicShell settings={null} contact={null}>
  <section class="container section error-page">
    <span class="eyebrow">{page.status}</span>
    {#if notFound}
      <h1>Halaman belum<br />dapat ditemukan.</h1>
      <p>Periksa kembali alamat halaman atau kembali ke beranda Desa Soulowe.</p>
    {:else}
      <h1>Halaman ini gagal<br />dimuat.</h1>
      <p>{page.error?.message || 'Terjadi kesalahan saat mengambil data. Coba muat ulang halaman.'}</p>
    {/if}
    <a class="button" href="/">Kembali ke beranda</a>
  </section>
</PublicShell>
