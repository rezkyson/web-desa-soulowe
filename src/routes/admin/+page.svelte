<script lang="ts">
  import { ArrowUpRight, Plus, Newspaper, Images, CalendarDays, MessageSquare, Phone, ArrowRight, CircleCheck } from '@lucide/svelte';
  import Meta from '$lib/components/Meta.svelte';
  import State from '$lib/components/State.svelte';
  import { date } from '$lib/utils';

  let { data } = $props();
</script>

<Meta title="Dashboard Operator" />
<div class="admin-page-heading">
  <div><span class="eyebrow">Ruang kerja operator</span><h1>Dashboard</h1><p>Selamat datang. Mari jaga informasi desa tetap terbarui.</p></div>
  <a class="button" href="/admin/berita"><Plus size={18} /> Tambah berita</a>
</div>

<div class="admin-stat-grid">
  <div>
    <span>Berita diterbitkan<Newspaper size={21} /></span>
    <strong>{data.counts.news}</strong>
    <a href="/admin/berita">Kelola berita <ArrowUpRight size={16} /></a>
  </div>
  <div>
    <span>Album galeri<Images size={21} /></span>
    <strong>{data.counts.albums}</strong>
    <a href="/admin/galeri">Kelola galeri <ArrowUpRight size={16} /></a>
  </div>
  <div>
    <span>Tahun data aktif<CalendarDays size={21} /></span>
    <strong>2026</strong>
    <span class="stat-footnote">Statistik dan keuangan MVP</span>
  </div>
</div>

<div class="dashboard-columns">
  <section class="admin-panel">
    <div class="panel-heading"><h2>Akses cepat</h2><span class="muted">Konten operasional</span></div>
    <div class="quick-links">
      <a href="/admin/galeri"><Images size={22} /><span><strong>Buat album kegiatan</strong><small>Tambahkan dokumentasi terbaru</small></span><ArrowRight size={18} /></a>
      <a href="/admin/sambutan"><MessageSquare size={22} /><span><strong>Ubah sambutan Kepala Desa</strong><small>Nama, foto, dan sambutan</small></span><ArrowRight size={18} /></a>
      <a href="/admin/whatsapp"><Phone size={22} /><span><strong>Perbarui WhatsApp</strong><small>Nomor dan pesan pembuka</small></span><ArrowRight size={18} /></a>
    </div>
  </section>
  <section class="admin-panel">
    <div class="panel-heading"><h2>Sebelum publikasi</h2></div>
    <ul class="readiness-list">
      <li><CircleCheck size={19} /> Pastikan angka mengikuti dokumen sumber.</li>
      <li><CircleCheck size={19} /> Ganti kontak dan media contoh dengan data resmi.</li>
      <li><CircleCheck size={19} /> Berita langsung terbit saat disimpan.</li>
      <li><CircleCheck size={19} /> Periksa judul, isi, serta keterangan foto.</li>
    </ul>
    <p class="source-note">Sejarah, visi-misi, geografis, dan konten tetap lainnya tidak dikelola dari panel ini.</p>
  </section>
</div>

<section class="admin-panel">
  <div class="panel-heading"><h2>Berita terbaru</h2><a class="text-link" href="/admin/berita">Lihat semua <ArrowUpRight size={16} /></a></div>
  {#if data.latestNews.length}
    <div class="table-wrap">
      <table>
        <thead><tr><th>Judul berita</th><th>Tanggal</th><th>Publikasi</th></tr></thead>
        <tbody>
          {#each data.latestNews as item (item.id)}
            <tr>
              <td><a href={`/berita/${item.slug}`}>{item.title}</a></td>
              <td>{date(item.published_on)}</td>
              <td><span class="badge">Terbit{item.is_dummy ? ' · contoh' : ''}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <State title="Belum ada berita" message="Berita pertama akan muncul di sini setelah diterbitkan." />
  {/if}
</section>
