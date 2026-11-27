<script lang="ts">
  import Meta from '$lib/components/Meta.svelte';
  import CollectionEditor from '$lib/components/CollectionEditor.svelte';
  import SettingsEditor from '$lib/components/SettingsEditor.svelte';

  let { data } = $props();
  let group = $state<'officials' | 'bpd'>('officials');

  const titles: Record<string, string> = {
    sambutan: 'Sambutan Kepala Desa',
    pemerintahan: 'Pemerintahan Desa',
    statistik: 'Data Statistik',
    fasilitas: 'Sarana & Prasarana',
    keuangan: 'Keuangan Desa',
    berita: 'Berita',
    galeri: 'Galeri Kegiatan',
    whatsapp: 'WhatsApp Layanan',
    media: 'Media & Gambar',
    akun: 'Pengaturan Akun'
  };
</script>

<Meta title={titles[data.module]} />

{#if data.module === 'pemerintahan'}
  <div class="filter-tabs admin-module-tabs">
    <button class:active={group === 'officials'} onclick={() => group = 'officials'}>Perangkat desa</button>
    <button class:active={group === 'bpd'} onclick={() => group = 'bpd'}>Anggota BPD</button>
  </div>
  {#key group}
    <CollectionEditor
      kind={group}
      title={group === 'officials' ? 'Perangkat Desa' : 'Anggota BPD'}
      description="Kelola nama, jabatan, foto, dan urutan tampil pemerintahan desa."
      items={group === 'officials' ? data.officials : data.bpd}
    />
  {/key}

{:else if data.module === 'berita'}
  <CollectionEditor kind="news" title="Berita Desa" description="Berita langsung terbit saat disimpan. Periksa isi sebelum mempublikasikan." items={data.news} />

{:else if data.module === 'galeri'}
  <CollectionEditor kind="albums" title="Galeri Kegiatan" description="Kelola album kegiatan dengan beberapa foto dan satu foto unggulan." items={data.albums} />

{:else if data.module === 'fasilitas'}
  <CollectionEditor kind="facilities" title="Sarana & Prasarana" description="Kelola fasilitas sesuai kategori dan konteks tabel sumber. Nilai kosong bukan nol." items={data.facilities} />

{:else if data.module === 'keuangan'}
  <CollectionEditor kind="finance" title="Keuangan Desa" description="Data tahun 2026. Angka mengikuti sumber, tanpa kalkulasi total belanja atau surplus/defisit." items={data.finance} />

{:else if data.module === 'sambutan'}
  {#key data.module}<SettingsEditor module="sambutan" principal={data.principal} />{/key}

{:else if data.module === 'statistik'}
  {#key data.module}<SettingsEditor module="statistik" statistics={data.statistics} />{/key}

{:else if data.module === 'whatsapp'}
  {#key data.module}<SettingsEditor module="whatsapp" contact={data.contact} />{/key}

{:else if data.module === 'media'}
  {#key data.module}<SettingsEditor module="media" settings={data.settings} media={data.media} />{/key}

{:else if data.module === 'akun'}
  {#key data.module}<SettingsEditor module="akun" />{/key}
{/if}
