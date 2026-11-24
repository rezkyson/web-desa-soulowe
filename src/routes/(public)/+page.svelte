<script lang="ts">
  import { ArrowUpRight, ArrowRight, ArrowDown, MapPin, Building2, Users, Landmark, Phone, Compass } from '@lucide/svelte';
  import Meta from '$lib/components/Meta.svelte';
  import AnimatedBorder from '$lib/components/ui/AnimatedBorder.svelte';
  import Location from '$lib/components/Location.svelte';
  import HeroSlides from '$lib/components/HeroSlides.svelte';
  import { reveal } from '$lib/actions/reveal';
  import { demo } from '$lib/mock/store';
  import { village } from '$lib/content/desa';
  import { number, whatsapp, date } from '$lib/utils';

  const facts = $derived($demo.statistics.filter(s => s.category === 'Kependudukan').filter(s => !['Laki-laki', 'Perempuan'].includes(s.name)));
  const featured = $derived($demo.news[0]);
  const rest = $derived($demo.news.slice(1, 3));

  // Newest albums first, then their photos. Flattened so the hero card shows
  // the most recent documentation rather than a hand-picked image. Repeated
  // images are dropped so the slideshow never shows the same photo twice.
  const albumSlides = $derived(
    [...new Map(
      [...$demo.albums]
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
        .flatMap(album =>
          (album.photos?.length ? album.photos : album.photo ? [{ id: album.id, url: album.photo, alt: album.name }] : [])
            .map(photo => ({
              url: photo.url,
              alt: `${photo.alt || album.name} (album ${album.name})`
            }))
        )
        .map(slide => [slide.url, slide] as const)
    ).values()]
  );
</script>

<Meta />
<section class="hero-shell">
  <div class="hero-media">
    <img src={$demo.settings.hero} width="1800" height="1200" fetchpriority="high" alt="Foto ilustrasi lanskap pertanian saat matahari terbit, bukan dokumentasi Desa Soulowe" />
  </div>
  <div class="hero-scrim" aria-hidden="true"></div>

  <div class="hero-inner">
    <div class="hero-stage">
      <div class="hero-lead">
        <h1><span>Desa Soulowe,</span><span>hidup dari cerita</span><span>dan kerja warga.</span></h1>
        <p>Desa agraris di Kecamatan Sigi Kota. Temukan profil, data, dan kabar terbaru dari pemerintah desa dalam satu tempat.</p>
        <div class="hero-actions">
          <a class="hero-primary" href="/profil">Kenali desa kami</a>
          <a class="hero-scroll-cue" href="#tentang" aria-label="Lanjut ke bagian tentang desa"><ArrowDown size={20} /></a>
        </div>
      </div>

      <aside class="hero-card" aria-label="Sekilas kantor desa">
        <div class="hero-card-figure">
          <HeroSlides slides={albumSlides} label="Foto terbaru dari album galeri desa" />
        </div>
        <div class="hero-card-body">
          <h2>Kantor desa</h2>
          <p>{village.address}, Kecamatan Sigi Kota, Kabupaten Sigi.</p>
          <a class="hero-card-link" href="/kontak">Lihat lokasi <ArrowUpRight size={15} /></a>
        </div>
      </aside>
    </div>

    <div class="hero-foot">
      <div class="hero-facts">
        {#each facts as item, i}
          {#if i > 0}<span class="divider" aria-hidden="true"></span>{/if}
          <span class="fact"><strong>{number(item.value)}</strong>{item.name}</span>
        {/each}
      </div>
      <div class="hero-social">
        <span>Layanan warga</span>
        <a href={whatsapp($demo.contact.phone, $demo.contact.message)} target="_blank" rel="noreferrer" aria-label="Hubungi desa lewat WhatsApp"><Phone size={16} /></a>
        <a href="/kontak" aria-label="Lihat lokasi kantor desa"><MapPin size={16} /></a>
        <a href="/galeri" aria-label="Buka galeri desa"><Compass size={16} /></a>
      </div>
    </div>
  </div>

  <div class="hero-seal" aria-hidden="true">
    <svg class="seal-ring" viewBox="0 0 116 116" role="presentation" focusable="false">
      <defs><path id="seal-path" d="M58,58 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
      <text><textPath href="#seal-path" startOffset="0">SOULOWE · SIGI KOTA · SULAWESI TENGAH · </textPath></text>
    </svg>
    <span class="seal-core"><img src={$demo.settings.logo} alt="" width="22" height="32" /></span>
  </div>
</section>

<section class="data-band">
  <div class="container">
    <div class="data-band-head">
      <span class="eyebrow">Soulowe dalam angka</span>
      <span>Data desa 2026, sesuai dokumen profil</span>
    </div>
    <div class="data-band-grid">
      {#each $demo.statistics.filter(s => s.category === 'Kependudukan') as item}
        <div class="data-cell"><span>{item.name}</span><strong>{number(item.value)}<small>{item.unit}</small></strong></div>
      {/each}
      <a class="data-band-link" href="/data"><span>Data lengkap</span><ArrowUpRight size={22} /></a>
    </div>
  </div>
</section>

<section id="tentang" class="section container story-grid">
  <div class="story-aside" use:reveal>
    <span class="eyebrow">Tentang Soulowe</span>
    <span class="story-year">1968</span>
    <p>Tahun kepala desa pertama dilantik, menurut dokumen profil desa.</p>
    <a class="text-link" href="/profil#sejarah">Jejak sejarah desa <ArrowUpRight size={16} /></a>
  </div>
  <div class="story-body" use:reveal={70}>
    <h2>Dari pohon asam jawa, bermula sebuah nama.</h2>
    <p class="lead">Sebelum dikenal sebagai Soulowe, wilayah ini disebut Ranjambalagi, nama yang merujuk pada pohon asam jawa.</p>
    <p>Di antara pepohonannya, sarang elang tampak seperti rumah kecil. Kisah tentang <em>sou</em> dan <em>love</em> itu tersimpan dalam asal usul nama desa.</p>
    <a class="text-link" href="/profil">Baca cerita Soulowe <ArrowUpRight size={18} /></a>
  </div>
</section>

<section class="welcome-band">
  <div class="container welcome-panel" use:reveal>
    <div class="welcome-portrait">
      {#if $demo.principal.photo}<img src={$demo.principal.photo} alt={$demo.principal.name} />
      {:else}<img class="portrait-emblem" src={$demo.settings.logo} alt="Lambang Kabupaten Sigi, foto Kepala Desa belum tersedia" /><span>PEMERINTAH DESA SOULOWE</span>{/if}
      <small>Foto dan identitas resmi akan diperbarui</small>
    </div>
    <div class="welcome-copy">
      <span class="eyebrow">Dari Kepala Desa</span>
      <h2>Salam untuk masyarakat Soulowe.</h2>
      <p class="welcome-quote">{$demo.principal.greeting.split('\n')[0]}</p>
      <div class="signature"><strong>{$demo.principal.name}</strong><span>Kepala Desa, identitas sementara</span></div>
      <a href="/pemerintahan" class="text-link">Perangkat desa dan BPD <ArrowUpRight size={18} /></a>
    </div>
  </div>
</section>

<section class="section container home-news">
  <div class="section-top" use:reveal>
    <div><span class="eyebrow">Kabar dari desa</span><h2>Yang sedang dibicarakan.</h2></div>
    <a href="/berita" class="text-link">Semua berita <ArrowRight size={18} /></a>
  </div>
  <div class="news-feature-grid" use:reveal={60}>
    {#if featured}
      <AnimatedBorder class="feature-frame" contentClassName="feature-surface">
        <article class="news-feature">
          <a class="feature-media" href={`/berita/${featured.slug}`} tabindex="-1" aria-hidden="true">
            <img src={featured.photo} alt="" width="1200" height="760" loading="lazy" />
          </a>
          <div class="feature-body">
            <div class="feature-meta"><span>{featured.category}</span><span>{featured.dummy ? 'Konten contoh' : featured.author}</span></div>
            <h3><a href={`/berita/${featured.slug}`}>{featured.name}</a></h3>
            <p>{featured.summary}</p>
            <a class="text-link" href={`/berita/${featured.slug}`}>Baca berita <ArrowUpRight size={16} /></a>
          </div>
        </article>
      </AnimatedBorder>
    {/if}
    <div class="news-side">
      {#each rest as item}
        <article class="news-row">
          <a class="row-media" href={`/berita/${item.slug}`} tabindex="-1" aria-hidden="true">
            <img src={item.photo} alt="" width="600" height="440" loading="lazy" />
          </a>
          <div class="row-body">
            <time datetime={item.date}>{date(item.date)}</time>
            <h3><a href={`/berita/${item.slug}`}>{item.name}</a></h3>
            <small>{item.dummy ? 'Konten contoh, foto ilustrasi' : item.author}</small>
          </div>
        </article>
      {/each}
    </div>
  </div>
</section>

<section class="info-panel">
  <div class="container info-panel-grid" use:reveal>
    <div><span class="eyebrow light">Informasi publik</span><h2>Desa yang terbuka untuk dibaca.</h2><p>Profil pemerintahan, data agregat, dan anggaran desa bisa diakses siapa saja, tanpa akun.</p></div>
    <div class="info-panel-links">
      <a href="/pemerintahan"><Users size={22} /><span><strong>Pemerintahan Desa</strong><small>Perangkat desa dan BPD</small></span><ArrowUpRight size={18} /></a>
      <a href="/data"><Building2 size={22} /><span><strong>Data Desa</strong><small>Penduduk, pendidikan, dan sarana</small></span><ArrowUpRight size={18} /></a>
      <a href="/keuangan"><Landmark size={22} /><span><strong>Keuangan Desa</strong><small>Anggaran tahun 2026</small></span><ArrowUpRight size={18} /></a>
    </div>
  </div>
</section>

<section class="section container home-gallery">
  <div class="section-top" use:reveal>
    <div><span class="eyebrow">Galeri desa</span><h2>Catatan dalam foto.</h2><p>Ruang untuk menyimpan dokumentasi kegiatan desa.</p></div>
    <a href="/galeri" class="text-link">Buka galeri <ArrowRight size={18} /></a>
  </div>
  <div class="gallery-grid">
    {#each $demo.albums.slice(0, 2) as album, i}
      <a href={`/galeri/${album.slug}`} class="gallery-tile" use:reveal={i * 70}>
        <img src={album.photo} alt={album.name + ', foto ilustrasi'} width="1000" height="700" loading="lazy" />
        <div><span>{album.photos?.length || 0} foto, album contoh</span><h3>{album.name}<ArrowUpRight size={20} /></h3></div>
      </a>
    {/each}
  </div>
</section>

<section class="location-section container" use:reveal>
  <div>
    <span class="eyebrow">Kantor desa</span>
    <h2>Mampir ke kantor desa.</h2>
    <p>{village.address}<br />Kecamatan Sigi Kota, Kabupaten Sigi<br />Sulawesi Tengah</p>
    <a class="text-link" href="/kontak">Alamat dan kontak <ArrowUpRight size={18} /></a>
  </div>
  <Location />
</section>
