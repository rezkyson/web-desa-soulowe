<script lang="ts">
  import Meta from '$lib/components/Meta.svelte';
  import CollectionEditor from '$lib/components/CollectionEditor.svelte';
  import SettingsEditor from '$lib/components/SettingsEditor.svelte';
  let { data } = $props();
  let group = $state('officials');
  const titles: Record<string, string> = { sambutan: 'Sambutan Kepala Desa', pemerintahan: 'Pemerintahan Desa', statistik: 'Data Statistik', fasilitas: 'Sarana & Prasarana', keuangan: 'Keuangan Desa', berita: 'Berita', galeri: 'Galeri Kegiatan', whatsapp: 'WhatsApp Layanan', media: 'Media & Gambar', akun: 'Pengaturan Akun' };
</script>
<Meta title={titles[data.module]} />
{#if data.module === 'pemerintahan'}<div class="filter-tabs admin-module-tabs"><button class:active={group === 'officials'} onclick={() => group = 'officials'}>Perangkat desa</button><button class:active={group === 'bpd'} onclick={() => group = 'bpd'}>Anggota BPD</button></div>{#key group}<CollectionEditor collection={group === 'officials' ? 'officials' : 'bpd'} title={group === 'officials' ? 'Perangkat Desa' : 'Anggota BPD'} description="Kelola nama, jabatan, foto, dan urutan tampil pemerintahan desa." />{/key}
{:else if data.module === 'berita'}<CollectionEditor collection="news" title="Berita Desa" description="Berita langsung terbit saat disimpan. Periksa isi sebelum mempublikasikan." />
{:else if data.module === 'galeri'}<CollectionEditor collection="albums" title="Galeri Kegiatan" description="Kelola album kegiatan dengan beberapa foto dan satu foto unggulan." />
{:else if data.module === 'fasilitas'}<CollectionEditor collection="facilities" title="Sarana & Prasarana" description="Kelola fasilitas sesuai kategori dan konteks tabel sumber. Nilai kosong bukan nol." />
{:else if data.module === 'keuangan'}<CollectionEditor collection="finance" title="Keuangan Desa" description="Data tahun 2026. Angka mengikuti sumber, tanpa kalkulasi total belanja atau surplus/defisit." />
{:else}{#key data.module}<SettingsEditor module={data.module} />{/key}{/if}
