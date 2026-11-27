<script lang="ts">
  import { ArrowUpRight, Users, UserRound, MapPin, Info, ArrowRight } from '@lucide/svelte';
  import Meta from '$lib/components/Meta.svelte';
  import PageHeading from '$lib/components/PageHeading.svelte';
  import NewsCard from '$lib/components/NewsCard.svelte';
  import Location from '$lib/components/Location.svelte';
  import State from '$lib/components/State.svelte';
  import { village } from '$lib/content/desa';
  import { number, rupiah, date, whatsapp } from '$lib/utils';
  import { mediaUrl } from '$lib/media';

  let { data } = $props();
  let query = $state('');
  let category = $state('Semua');
  let selectedFacility = $state('');

  const headings: Record<string, [string, string, string]> = {
    profil: ['Profil Desa', 'Cerita, identitas, dan arah langkah Desa Soulowe.', 'Mengenal Soulowe'],
    pemerintahan: ['Pemerintahan Desa', 'Kenali perangkat desa dan Badan Permusyawaratan Desa yang melayani masyarakat.', 'Pelayanan & pemerintahan'],
    data: ['Data Desa', 'Gambaran masyarakat dan sarana desa melalui data agregat tahun 2026.', 'Soulowe dalam angka'],
    keuangan: ['Keuangan Desa', 'Informasi pendapatan dan belanja desa berdasarkan dokumen profil tahun 2026.', 'Keterbukaan informasi'],
    berita: ['Berita Desa', 'Cerita, informasi, dan kabar terbaru dari Desa Soulowe.', 'Kabar dari desa'],
    galeri: ['Galeri Kegiatan', 'Ruang dokumentasi kehidupan dan kegiatan masyarakat desa.', 'Desa dalam bingkai'],
    layanan: ['Layanan WhatsApp', 'Terhubung dengan pemerintah desa melalui satu kanal informasi.', 'Tetap terhubung'],
    kontak: ['Kontak & Lokasi', 'Alamat kantor dan informasi untuk menghubungi Pemerintah Desa Soulowe.', 'Kantor desa']
  };
  const profileSections = [['sejarah', 'Sejarah desa'], ['asal-usul', 'Asal-usul nama'], ['visi-misi', 'Visi & misi'], ['geografis', 'Geografis & iklim'], ['lahan', 'Penggunaan lahan'], ['sosial', 'Sosial & ekonomi'], ['tipologi', 'Tipologi & orbitasi']];

  let heading = $derived(headings[data.section]);

  // Kategori diambil dari data, bukan daftar tetap, supaya kategori baru dari
  // operator langsung muncul tanpa mengubah kode.
  let newsCategories = $derived(['Semua', ...new Set((data.news ?? []).map(n => n.category || 'Informasi'))]);
  let news = $derived((data.news ?? []).filter(n =>
    (category === 'Semua' || (n.category || 'Informasi') === category) &&
    `${n.title} ${n.summary}`.toLowerCase().includes(query.toLowerCase())
  ));

  let facilityGroups = $derived([...new Set((data.facilities ?? []).map(f => f.category))]);
  $effect(() => {
    if (!selectedFacility && facilityGroups.length) selectedFacility = facilityGroups[0];
  });

  let population = $derived((data.statistics ?? []).filter(s => s.category === 'Kependudukan'));
  let totalPopulation = $derived(population.find(s => s.label === 'Total penduduk')?.value ?? null);
</script>

<Meta title={heading[0]} description={heading[1]} />
<PageHeading title={heading[0]} description={heading[1]} eyebrow={heading[2]} />

{#if data.section === 'profil'}
  <div class="container section profile-layout"><aside class="contents"><span class="eyebrow">Di halaman ini</span>{#each profileSections as [id, text]}<a href={`#${id}`}>{text}<ArrowUpRight size={14} /></a>{/each}<small>Konten bersumber dari dokumen profil 2025–2026.</small></aside><div class="profile-body">
    <div class="identity-grid"><div><small>Desa</small><strong>Soulowe</strong></div><div><small>Kecamatan</small><strong>Sigi Kota</strong></div><div><small>Kabupaten</small><strong>Sigi</strong></div><div><small>Luas sesuai dokumen</small><strong>{village.area}</strong></div></div>
    <section id="sejarah"><span class="eyebrow">01 / Jejak perjalanan</span><h2>Bermula dari Ranjambalagi</h2>{#each village.history as paragraph}<p>{paragraph}</p>{/each}</section>
    <section id="asal-usul"><span class="eyebrow">02 / Sebuah nama, sebuah cerita</span><h2>Rumah bagi sang elang</h2><p>{village.origin}</p></section>
    <section id="visi-misi"><span class="eyebrow">03 / Arah langkah</span><h2>Visi & misi desa</h2><blockquote>{village.vision}</blockquote><h3>Misi</h3><ol class="mission-list">{#each village.missions as mission}<li>{mission}</li>{/each}</ol></section>
    <section id="geografis"><span class="eyebrow">04 / Ruang hidup</span><h2>Geografis & iklim</h2><p>{village.geography}</p><p>{village.climate}</p><div class="notice"><Info size={19} /><span>Angka luas dan satuan mengikuti dokumen sumber, tanpa konversi atau koreksi otomatis.</span></div></section>
    <section id="lahan"><h2>Penggunaan lahan</h2><div class="table-wrap"><table><thead><tr><th>Penggunaan</th><th>Luas sesuai sumber</th></tr></thead><tbody>{#each village.land as [name, value]}<tr><td>{name}</td><td>{value}</td></tr>{/each}</tbody></table></div><p class="source-note">Nilai km² dan ha mengikuti penulisan dokumen meskipun konversinya tidak konsisten. Tanda - berarti nilai tidak tersedia.</p></section>
    <section id="sosial"><h2>Sosial budaya & ekonomi</h2><p>{village.social}</p><p>{village.economy}</p><a class="text-link" href="/data">Lihat data masyarakat <ArrowRight size={17} /></a></section>
    <section id="tipologi"><h2>Tipologi & orbitasi</h2><p>Desa Soulowe merupakan salah satu desa penunjang ibu kota Kabupaten Sigi. Klasifikasi berikut mengikuti tabel tipologi dalam dokumen.</p><div class="table-wrap"><table><tbody>{#each village.typology as [name, value]}<tr><th>{name}</th><td>{value}</td></tr>{/each}</tbody></table></div><h3>Jarak ke pusat pemerintahan</h3><div class="table-wrap"><table><tbody>{#each village.orbit as [name, value]}<tr><th>{name}</th><td>{value}</td></tr>{/each}</tbody></table></div><p class="source-note">Mengikuti bagian Orbitasi. Bagian Letak dan Luas Wilayah pada dokumen mencatat angka berbeda: provinsi 20 km, kecamatan/kabupaten 10 km. Perbedaan sumber belum diverifikasi.</p></section>
  </div></div>

{:else if data.section === 'pemerintahan'}
  <div class="container section">
    {#if data.principal}
      <div class="principal-profile">
        <div class="official-avatar large">{#if mediaUrl(data.principal.photo)}<img src={mediaUrl(data.principal.photo)} alt={data.principal.name} />{:else}<UserRound size={62} strokeWidth={1} />{/if}</div>
        <div><span class="eyebrow">Kepala Desa Soulowe</span><h2>{data.principal.name}</h2><p>{data.principal.greeting.split('\n')[0]}</p>{#if data.principal.is_dummy}<small class="example-note">Nama, sambutan, dan foto sementara · belum merupakan identitas resmi</small>{/if}</div>
      </div>
    {:else}
      <State title="Profil Kepala Desa belum tersedia" message="Operator belum mengisi nama dan sambutan Kepala Desa." />
    {/if}

    <div class="section-top"><div><span class="eyebrow">Struktur pemerintahan</span><h2>Perangkat desa</h2></div><span class="badge">Data dokumen profil</span></div>
    {#if data.officials.length}
      <div class="official-grid">{#each data.officials as official (official.id)}<article class="official-card"><div class="official-avatar">{#if mediaUrl(official.photo)}<img src={mediaUrl(official.photo)} alt={official.name} />{:else}<UserRound size={35} strokeWidth={1.3} />{/if}</div><span class="eyebrow">{official.role}</span><h3>{official.name}</h3><p>Pendidikan: {official.education || '-'}</p></article>{/each}</div>
    {:else}
      <State title="Belum ada data perangkat desa" message="Data perangkat desa akan tampil setelah diisi operator." />
    {/if}

    <div class="subsection"><span class="eyebrow">Badan Permusyawaratan Desa</span><h2>Perwakilan masyarakat</h2>
      {#if data.bpd.length}
        <div class="bpd-list">{#each data.bpd as member (member.id)}<div><Users size={24} /><span><strong>{member.name}</strong><small>{member.role} BPD</small></span></div>{/each}</div>
      {:else}
        <State title="Belum ada data BPD" message="Data anggota BPD akan tampil setelah diisi operator." />
      {/if}
    </div>
    <div class="notice"><Info size={20} /><span>Dokumen mencatat Kepala Dusun I dan Kepala Dusun II. Data perangkat desa dan BPD dapat diperbarui operator.</span></div>
  </div>

{:else if data.section === 'data'}
  <div class="container section">
    <div class="section-top"><div><span class="eyebrow">Kependudukan</span><h2>Masyarakat Soulowe</h2></div><span class="badge">Tahun 2026</span></div>
    {#if population.length}
      <div class="data-stats">{#each population as item (item.id)}<div><span>{item.label}</span><strong>{number(item.value)}</strong><small>{item.unit}</small></div>{/each}</div>
    {:else}
      <State title="Belum ada data kependudukan" message="Angka kependudukan akan tampil setelah diisi operator." />
    {/if}
    <div class="notice"><Info size={20} /><span>Data hanya berbentuk agregat. RTM berarti rumah tangga miskin; bukan jumlah individu. Tidak ada data pribadi penduduk.</span></div>

    {#each ['Pendidikan', 'Mata pencaharian'] as group}
      <section class="subsection"><span class="eyebrow">Data masyarakat · 2026</span><h2>{group}</h2>
        {#if (data.statistics ?? []).some(s => s.category === group)}
          <div class="chart-table"><div class="table-wrap"><table><thead><tr><th>{group === 'Pendidikan' ? 'Jenjang pendidikan' : 'Jenis pekerjaan'}</th><th class="align-right">Jumlah (jiwa)</th></tr></thead><tbody>{#each (data.statistics ?? []).filter(s => s.category === group) as item (item.id)}<tr><td>{item.label}</td><td class="align-right">{number(item.value)}</td></tr>{/each}<tr class="table-total"><th>Jumlah sesuai dokumen</th><td class="align-right">{number(totalPopulation)}</td></tr></tbody></table></div><div class="bar-chart" aria-label={`Grafik ${group.toLowerCase()}`}>{#each (data.statistics ?? []).filter(s => s.category === group && s.value !== null).sort((a,b) => (b.value || 0) - (a.value || 0)).slice(0, 6) as item (item.id)}<div><div><span>{item.label}</span><strong>{number(item.value)}</strong></div><div class="bar-track"><span style={`width:${(item.value || 0) / 600 * 100}%`}></span></div></div>{/each}<small>Grafik menampilkan enam kategori terbesar. Rincian lengkap tersedia dalam tabel.</small></div></div>
        {:else}
          <State title={`Belum ada data ${group.toLowerCase()}`} />
        {/if}
      </section>
    {/each}

    <section class="subsection"><span class="eyebrow">Fasilitas desa</span><h2>Sarana & prasarana</h2>
      {#if facilityGroups.length}
        <div class="filter-tabs" aria-label="Kategori fasilitas">{#each facilityGroups as group}<button class:active={selectedFacility === group} onclick={() => selectedFacility = group}>{group}</button>{/each}</div>
        <div class="notice"><Info size={19} /><span>Tabel Sarana Pendidikan dan Sarana Umum memuat jumlah sekolah yang berbeda. Data ditampilkan terpisah sesuai sumber, bukan digabungkan.</span></div>
        <div class="table-wrap"><table><thead><tr><th>Sarana / prasarana</th><th>Jumlah / panjang</th><th>Kondisi</th></tr></thead><tbody>{#each (data.facilities ?? []).filter(f => f.category === selectedFacility) as item (item.id)}<tr><td>{item.name}</td><td>{number(item.value)} {item.value != null ? item.unit : ''}</td><td>{item.condition || '-'}</td></tr>{/each}</tbody></table></div>
      {:else}
        <State title="Belum ada data sarana prasarana" message="Data fasilitas akan tampil setelah diisi operator." />
      {/if}
    </section>
    <p class="source-note">Sumber: Dokumen Profil Desa Soulowe 2025-2026. Tanda - berarti data tidak tersedia, bukan nol.</p>
  </div>

{:else if data.section === 'keuangan'}
  <div class="container section">
    {#if (data.finance ?? []).length}
      <div class="finance-highlight"><div><span class="eyebrow light">Pendapatan sesuai dokumen</span><strong>{rupiah((data.finance ?? []).find(f => f.name === 'Pendapatan transfer')?.value)}</strong><span>Tahun anggaran 2026</span></div><div><p>Informasi anggaran desa yang dapat dibaca oleh masyarakat.</p><small>Data ditampilkan sebagaimana tercantum pada dokumen sumber.</small></div></div>
      {#each ['Pendapatan', 'Belanja'] as group}
        <section class="subsection"><div class="section-top"><h2>{group === 'Belanja' ? 'Belanja berdasarkan bidang' : 'Rincian pendapatan'}</h2><span class="badge">2026</span></div><div class="table-wrap"><table><thead><tr><th>{group === 'Belanja' ? 'Bidang belanja' : 'Uraian pendapatan'}</th><th class="align-right">Anggaran (Rp)</th></tr></thead><tbody>{#each (data.finance ?? []).filter(f => f.category === group) as item (item.id)}<tr><td>{item.name}</td><td class="align-right money">{rupiah(item.value)}</td></tr>{/each}</tbody></table></div></section>
      {/each}
      <div class="notice"><Info size={20} /><span>Data keuangan ditampilkan berdasarkan dokumen profil Desa Soulowe Tahun 2026. Angka pendapatan dan rincian belanja pada sumber belum konsisten; website tidak menghitung ulang total belanja, surplus, atau defisit. Tanda - bukan berarti nol.</span></div>
    {:else}
      <State title="Belum ada data keuangan" message="Data pendapatan dan belanja akan tampil setelah diisi operator." />
    {/if}
  </div>

{:else if data.section === 'berita'}
  <div class="container section">
    {#if (data.news ?? []).length}
      <div class="list-toolbar">
        <div class="filter-tabs">{#each newsCategories as group}<button class:active={category === group} onclick={() => category = group}>{group}</button>{/each}</div>
        <label class="search-label"><span class="sr-only">Cari berita</span><input type="search" placeholder="Cari berita desa…" bind:value={query} /></label>
      </div>
      {#if news.length}
        <div class="news-grid">{#each news as item (item.id)}<NewsCard {item} />{/each}</div>
      {:else}
        <State title="Tidak ada berita yang ditemukan" message="Coba kata kunci atau kategori lainnya." />
      {/if}
      {#if (data.news ?? []).some(n => n.is_dummy)}
        <p class="source-note">Sebagian berita pada halaman ini masih berupa contoh pengembangan, bukan publikasi resmi desa.</p>
      {/if}
    {:else}
      <State title="Belum ada berita" message="Berita yang diterbitkan operator akan muncul di halaman ini." />
    {/if}
  </div>

{:else if data.section === 'galeri'}
  <div class="container section">
    {#if (data.albums ?? []).some(a => a.is_dummy)}
      <div class="notice"><Info size={20} /><span>Sebagian album masih menggunakan foto ilustrasi. Dokumentasi resmi desa akan diunggah oleh operator.</span></div>
    {/if}
    {#if (data.albums ?? []).length}
      <div class="gallery-grid">{#each data.albums as album (album.id)}<a class="gallery-tile" href={`/galeri/${album.slug}`}>{#if mediaUrl(album.cover)}<img src={mediaUrl(album.cover)} alt={album.cover?.alt || album.name} width="1000" height="700" loading="lazy" />{/if}<div><span>{date(album.event_date)} · {album.photos?.[0]?.count ?? 0} foto</span><h3>{album.name}<ArrowUpRight size={22} /></h3></div></a>{/each}</div>
    {:else}
      <State title="Belum ada album galeri" message="Album yang dibuat operator akan tampil di halaman ini." />
    {/if}
  </div>

{:else if data.section === 'layanan'}
  <div class="container section service-layout">
    <div>
      <span class="eyebrow">Informasi melalui WhatsApp</span>
      <h2>Ada yang ingin<br />Anda ketahui?</h2>
      <p class="lead">Hubungi pemerintah desa untuk mendapatkan informasi. Tidak ada formulir pengaduan atau pengajuan surat online pada website ini.</p>
      {#if data.contact}
        <div class="contact-detail"><span>Nomor WhatsApp</span><strong>+{data.contact.phone}</strong></div>
        <a class="button" href={whatsapp(data.contact.phone, data.contact.message)} target="_blank" rel="noreferrer">Hubungi melalui WhatsApp <ArrowUpRight size={18} /></a>
        {#if data.contact.is_dummy}
          <p class="source-note">Nomor ini masih contoh untuk preview. Jangan digunakan untuk mengirim informasi pribadi. Nomor resmi akan diperbarui operator.</p>
        {/if}
      {:else}
        <State title="Nomor layanan belum tersedia" message="Operator belum mengisi nomor WhatsApp desa." />
      {/if}
    </div>
    <div class="service-note">
      {#if mediaUrl(data.settings?.logo)}<img src={mediaUrl(data.settings?.logo)} alt="Lambang Kabupaten Sigi" width="80" height="118" />{/if}
      <h3>Pemerintah Desa Soulowe</h3>
      <p>{data.contact?.message ?? ''}</p>
      {#if data.contact}<span class="badge">Pesan pembuka otomatis</span>{/if}
    </div>
  </div>

{:else if data.section === 'kontak'}
  <div class="container section contact-grid">
    <div>
      <span class="eyebrow">Alamat kantor</span>
      <h2>Pemerintah<br />Desa Soulowe</h2>
      <div class="address-block"><MapPin size={23} /><p>{village.address}<br />Kecamatan Sigi Kota<br />Kabupaten Sigi, Sulawesi Tengah</p></div>
      <a class="text-link" href="/layanan">Informasi WhatsApp layanan <ArrowRight size={18} /></a>
      <p class="source-note">Website hanya menyediakan kanal layanan WhatsApp. Tidak ada nomor telepon atau email layanan pada MVP.</p>
    </div>
    <Location />
  </div>
{/if}
