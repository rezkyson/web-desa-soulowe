<script lang="ts">
  import { tick } from 'svelte';
  import { Save, ExternalLink, Image as ImageIcon } from '@lucide/svelte';
  import { demo } from '$lib/mock/store';
  import type { Statistic } from '$lib/types';
  import { whatsapp } from '$lib/utils';
  import Upload from './Upload.svelte';
  import Confirm from './Confirm.svelte';
  let { module }: { module: string } = $props();
  let name = $state($demo.principal.name);
  let greeting = $state($demo.principal.greeting);
  let photo = $state($demo.principal.photo);
  let phone = $state($demo.contact.phone);
  let message = $state($demo.contact.message);
  let logo = $state($demo.settings.logo);
  let hero = $state($demo.settings.hero);
  let statistics = $state<Statistic[]>(structuredClone($demo.statistics));
  let statCategory = $state('Kependudukan');
  let password = $state('');
  let passwordConfirm = $state('');
  let busy = $state(false);
  let fail = $state(false);
  let feedback = $state('');
  let error = $state('');
  let confirmOpen = $state(false);
  let mediaTarget = $state('hero');
  let media = $derived([...new Set([$demo.settings.logo, $demo.settings.hero, $demo.principal.photo, ...$demo.news.map(n => n.photo || ''), ...$demo.albums.flatMap(a => (a.photos || []).map(p => p.url)), ...$demo.officials.map(o => o.photo || ''), ...$demo.bpd.map(o => o.photo || ''), ...$demo.facilities.map(f => f.photo || '')].filter(Boolean))]);
  let replacement: () => void = () => {};
  const titles: Record<string, [string, string]> = { sambutan: ['Sambutan Kepala Desa', 'Perbarui nama, foto, dan sambutan yang ditampilkan pada website.'], statistik: ['Data Statistik', 'Perbarui data agregat tahun 2026. Jangan masukkan identitas individu.'], whatsapp: ['WhatsApp Layanan', 'Atur nomor dan pesan pembuka untuk kanal informasi desa.'], media: ['Media & Gambar', 'Ganti logo dan hero website. Foto konten dikelola pada modul masing-masing.'], akun: ['Pengaturan Akun', 'Preview perubahan password untuk satu akun operator.'] };
  function replace(current: string, callback: () => void) { if (current) { replacement = callback; confirmOpen = true; } else callback(); }
  function confirmedReplacement() { replacement(); }
  async function save(event: SubmitEvent) {
    event.preventDefault(); if (busy) return; feedback = ''; error = '';
    if (module === 'whatsapp' && !/^\+?(62|0)\d{8,13}$/.test(phone.replace(/[\s-]/g, ''))) { error = 'Masukkan nomor Indonesia yang valid, diawali 62 atau 0.'; return; }
    if (module === 'akun' && password !== passwordConfirm) { error = 'Konfirmasi password tidak sama.'; return; }
    busy = true; await tick(); await new Promise(resolve => setTimeout(resolve, 300));
    if (fail) { error = 'Simulasi gagal menyimpan. Data belum berubah. Silakan coba kembali tanpa simulasi error.'; busy = false; return; }
    if (module === 'sambutan') demo.update(d => ({ ...d, principal: { ...d.principal, name: name.trim(), greeting, photo } }));
    if (module === 'statistik') demo.update(d => ({ ...d, statistics: structuredClone($state.snapshot(statistics)) }));
    if (module === 'whatsapp') demo.update(d => ({ ...d, contact: { ...d.contact, phone: phone.replace(/\D/g, '').replace(/^0/, '62'), message } }));
    if (module === 'media') demo.update(d => ({ ...d, settings: { logo, hero } }));
    feedback = module === 'akun' ? 'Simulasi berhasil. Tidak ada password yang disimpan atau diubah pada server.' : 'Perubahan disimpan dalam memori demo. Belum tersimpan ke server; reload akan mengembalikan data awal.';
    password = ''; passwordConfirm = ''; busy = false;
  }
</script>
<div class="admin-page-heading"><div><span class="eyebrow">Kelola informasi</span><h1>{titles[module][0]}</h1><p>{titles[module][1]}</p></div>{#if module === 'statistik'}<span class="badge">Tahun 2026</span>{/if}</div>
{#if feedback}<div class="feedback" role="status">{feedback}</div>{/if}
<form class="admin-panel settings-form" onsubmit={save}>
{#if module === 'sambutan'}<div class="form-grid"><label class="full-span">Nama Kepala Desa<input bind:value={name} required maxlength="120" /></label><label class="full-span">Sambutan<textarea rows="9" bind:value={greeting} required></textarea></label></div><div class="form-media"><h3>Foto Kepala Desa</h3>{#if photo}<img class="form-photo" src={photo} alt="Preview Kepala Desa" />{:else}<div class="photo-placeholder"><ImageIcon size={28} /><span>Foto belum tersedia</span></div>{/if}<Upload label="Pilih foto Kepala Desa" onfiles={(photos) => replace(photo, () => photo = photos[0].url)} /></div><div class="notice">Data awal merupakan dummy. Ganti dengan identitas dan sambutan resmi sebelum peluncuran.</div>
{:else if module === 'statistik'}<div class="filter-tabs">{#each ['Kependudukan', 'Pendidikan', 'Mata pencaharian'] as group}<button type="button" class:active={statCategory === group} onclick={() => statCategory = group}>{group}</button>{/each}</div><div class="stat-form-grid">{#each statistics.filter(s => s.category === statCategory) as item}<label>{item.name}<div class="input-unit"><input type="number" min="0" step="1" value={item.value ?? ''} onchange={(e) => { statistics = statistics.map(s => s.id === item.id ? {...s, value: e.currentTarget.value === '' ? null : Number(e.currentTarget.value)} : s); }} /><span>{item.unit}</span></div></label>{/each}</div><div class="notice">Kosong berarti tidak tersedia; nol berarti nilai 0. RTM adalah rumah tangga miskin. Nilai sumber tidak dijumlahkan atau diperbaiki otomatis.</div>
{:else if module === 'whatsapp'}<label>Nomor WhatsApp<input type="tel" bind:value={phone} required placeholder="628xxxxxxxxxx" /><small>Gunakan kode negara 62. Jangan memasukkan tanda kurung.</small></label><label>Pesan pembuka otomatis<textarea rows="4" bind:value={message} required></textarea></label><a class="text-link" href={whatsapp(phone, message)} target="_blank" rel="noreferrer">Preview tautan WhatsApp <ExternalLink size={16} /></a><div class="notice">Nomor awal masih dummy. Jangan mengirim informasi pribadi ke nomor contoh; gunakan nomor resmi sebelum rilis.</div>
{:else if module === 'media'}<div class="branding-media"><section><h3>Logo website</h3><img class="logo-preview" src={logo} alt="Preview logo aktif" /><Upload label="Ganti logo" onfiles={(photos) => replace(logo, () => logo = photos[0].url)} /></section><section><h3>Foto hero</h3><img class="hero-preview" src={hero} alt="Preview foto hero" /><Upload label="Ganti foto hero" onfiles={(photos) => replace(hero, () => hero = photos[0].url)} /></section></div><div class="notice">Pergantian media menggunakan konfirmasi. Pada fase ini file hanya dibaca menjadi preview lokal, tidak diunggah ke Storage.</div><h3>Foto konten lainnya</h3><div class="media-module-links"><a href="/admin/sambutan">Foto Kepala Desa <ExternalLink size={16} /></a><a href="/admin/pemerintahan">Foto perangkat & BPD <ExternalLink size={16} /></a><a href="/admin/berita">Foto berita <ExternalLink size={16} /></a><a href="/admin/galeri">Foto album galeri <ExternalLink size={16} /></a><a href="/admin/fasilitas">Foto fasilitas <ExternalLink size={16} /></a></div>
{:else if module === 'akun'}<div class="notice">Ini hanya simulasi UI perubahan password. Jangan gunakan password asli. Supabase Auth akan dihubungkan pada fase berikutnya.</div><label>Password baru contoh<input type="password" bind:value={password} minlength="8" required autocomplete="off" /><small>Minimal 8 karakter untuk preview validasi.</small></label><label>Konfirmasi password baru<input type="password" bind:value={passwordConfirm} minlength="8" required autocomplete="off" /></label>{/if}
{#if module === 'media'}<section class="media-library"><div class="panel-heading"><h3>Pilih media yang tersedia</h3><label class="inline-label">Gunakan sebagai<select bind:value={mediaTarget}><option value="hero">Foto hero</option><option value="logo">Logo</option></select></label></div><div class="media-library-grid">{#each media as url, index}<button type="button" onclick={() => replace(mediaTarget === 'hero' ? hero : logo, () => { if (mediaTarget === 'hero') hero = url; else logo = url; })} aria-label={`Pilih media ${index + 1} sebagai ${mediaTarget}`}><img src={url} alt={`Media tersedia ${index + 1}`} /><span>Pilih media {index + 1}</span></button>{/each}</div><small>Pemilihan hanya mengganti referensi pada demo. Penghapusan file bersama dilakukan setelah backend tersedia.</small></section>{/if}
<label class="checkbox-label"><input type="checkbox" bind:checked={fail} /> Simulasikan gagal menyimpan</label>{#if error}<p class="field-error" role="alert">{error}</p>{/if}<div class="form-bottom"><small>Demo frontend · belum terhubung server</small><button type="submit" class="button" disabled={busy}><Save size={17} />{busy ? 'Menyimpan…' : module === 'akun' ? 'Simulasikan ubah password' : 'Simpan perubahan demo'}</button></div></form>
<Confirm bind:open={confirmOpen} title="Ganti media yang sedang digunakan?" message="Preview media lama akan diganti pada form demo. Perubahan baru diterapkan setelah Anda menyimpan form." label="Ganti media" onconfirm={confirmedReplacement} />
