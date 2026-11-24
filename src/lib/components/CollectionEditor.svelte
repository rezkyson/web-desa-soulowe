<script lang="ts">
  import { Plus, Pencil, Trash2, X, Save, Image as ImageIcon, Star, ArrowUpRight } from '@lucide/svelte';
  import { demo } from '$lib/mock/store';
  import type { Collection, Entry, Photo } from '$lib/types';
  import { date, number, rupiah, slugify } from '$lib/utils';
  import Confirm from './Confirm.svelte';
  import Upload from './Upload.svelte';
  import State from './State.svelte';
  let { collection, title, description }: { collection: Collection; title: string; description: string } = $props();
  let entries = $derived($demo[collection]);
  let draft = $state<Entry | null>(null);
  let isNew = $state(false);
  let search = $state('');
  let busy = $state(false);
  let fail = $state(false);
  let error = $state('');
  let feedback = $state('');
  let confirmOpen = $state(false);
  let confirmTitle = $state('Hapus item ini?');
  let confirmMessage = $state('Perubahan hanya berlaku pada data demo di memori.');
  let confirmLabel = $state('Hapus');
  let action: () => void = () => {};
  let form = $state<HTMLFormElement>();
  let beforeEdit: HTMLElement | null = null;
  let filtered = $derived(entries.filter(e => `${e.name} ${e.category || ''} ${e.role || ''}`.toLowerCase().includes(search.toLowerCase())));
  let isStory = $derived(collection === 'news' || collection === 'albums');
  $effect(() => { collection; draft = null; error = ''; feedback = ''; search = ''; });
  $effect(() => { if (draft && form) { form.querySelector<HTMLInputElement>('input')?.focus(); } });
  function edit(entry?: Entry) {
    beforeEdit = document.activeElement as HTMLElement;
    isNew = !entry; error = ''; feedback = '';
    draft = entry ? structuredClone(entry) : { id: crypto.randomUUID(), name: '', role: '', education: '', order: entries.length + 1, category: collection === 'finance' ? 'Pendapatan' : collection === 'facilities' ? 'Sarana umum' : 'Kabar Desa', value: null, unit: 'unit', condition: '', note: '', date: '2026-11-21', summary: '', body: '', author: 'Operator Desa', photo: '', photos: [], dummy: true };
  }
  function close() { draft = null; beforeEdit?.focus(); }
  function ask(title: string, message: string, callback: () => void, label = 'Hapus') { confirmTitle = title; confirmMessage = message; action = callback; confirmLabel = label; confirmOpen = true; }
  function remove(entry: Entry) { ask(`Hapus “${entry.name}”?`, 'Item akan dihapus dari simulasi frontend. Pembatalan tidak mengubah data.', () => { demo.update(d => ({ ...d, [collection]: d[collection].filter(e => e.id !== entry.id) })); feedback = 'Item dihapus dari demo. Belum ada perubahan pada server.'; }); }
  async function save(event: SubmitEvent) {
    event.preventDefault(); if (!draft || busy) return; error = ''; busy = true;
    await new Promise(resolve => setTimeout(resolve, 300));
    if (fail) { error = 'Simulasi gagal menyimpan. Data belum berubah. Nonaktifkan simulasi error untuk mencoba kembali.'; busy = false; return; }
    if (isStory && !draft.photo) { error = collection === 'news' ? 'Tambahkan foto utama sebelum menerbitkan berita.' : 'Tambahkan minimal satu foto dan tentukan foto unggulan.'; busy = false; return; }
    const next = structuredClone($state.snapshot(draft));
    next.name = next.name.trim();
    if (!next.name) { error = 'Nama atau judul wajib diisi.'; busy = false; return; }
    if (isStory) {
      const base = next.slug || slugify(next.name);
      next.slug = entries.some(e => e.id !== next.id && e.slug === base) ? `${base}-${next.id.slice(0, 6)}` : base;
      if (!next.slug) { error = 'Judul harus memiliki huruf atau angka untuk membuat URL.'; busy = false; return; }
    }
    demo.update(d => ({ ...d, [collection]: isNew ? [next, ...d[collection]] : d[collection].map(e => e.id === next.id ? next : e) }));
    feedback = isStory && isNew ? 'Konten langsung terbit pada demo frontend. Belum tersimpan ke server.' : 'Perubahan tersimpan di memori demo. Muat ulang halaman akan mengembalikan data awal.';
    busy = false; close();
  }
  function mainPhoto(photos: Photo[]) { if (!draft || !photos[0]) return; const url = photos[0].url; if (draft.photo) ask('Ganti foto utama?', 'Foto lama pada item demo ini akan diganti dengan preview baru.', () => { if (draft) draft.photo = url; }, 'Ganti foto'); else draft.photo = url; }
  function addPhotos(photos: Photo[]) { if (!draft) return; draft.photos = [...(draft.photos || []), ...photos]; if (!draft.photo && collection === 'albums') draft.photo = photos[0]?.url || ''; }
  function removePhoto(photo: Photo) { ask('Hapus foto ini?', 'Foto dihapus dari item demo. Jika foto unggulan dihapus, foto pertama yang tersisa akan dipilih.', () => { if (!draft) return; draft.photos = draft.photos?.filter(p => p.id !== photo.id); if (draft.photo === photo.url) draft.photo = draft.photos?.[0]?.url || ''; }); }
</script>
<div class="admin-page-heading"><div><span class="eyebrow">Kelola informasi</span><h1>{title}</h1><p>{description}</p></div>{#if !draft}<button class="button" onclick={() => edit()}><Plus size={18} /> Tambah {collection === 'news' ? 'berita' : collection === 'albums' ? 'album' : 'data'}</button>{/if}</div>
{#if feedback}<div class="feedback" role="status">{feedback}</div>{/if}
{#if draft}
<section class="admin-panel editor-panel"><div class="panel-heading"><h2>{isNew ? 'Tambah' : 'Edit'} {collection === 'news' ? 'berita' : collection === 'albums' ? 'album' : 'data'}</h2><button class="icon-button" onclick={close} aria-label="Tutup form" disabled={busy}><X size={21} /></button></div><form bind:this={form} onsubmit={save}>
  <div class="form-grid"><label class="full-span">{collection === 'news' ? 'Judul berita' : collection === 'albums' ? 'Nama album' : 'Nama / uraian'}<input bind:value={draft.name} required maxlength="180" /></label>
  {#if collection === 'officials' || collection === 'bpd'}<label>Jabatan<input bind:value={draft.role} required /></label>{#if collection === 'officials'}<label>Pendidikan<input bind:value={draft.education} placeholder="Contoh: SMA" /></label>{/if}<label>Urutan tampil<input type="number" bind:value={draft.order} min="1" step="1" required /></label>{/if}
  {#if collection === 'facilities' || collection === 'finance'}<label>Kategori<select bind:value={draft.category}>{#each collection === 'finance' ? ['Pendapatan', 'Belanja'] : ['Sarana pendidikan', 'Keamanan', 'Jalan', 'Sarana umum', 'Pemerintahan'] as option}<option>{option}</option>{/each}</select></label><label>{collection === 'finance' ? 'Anggaran (Rupiah)' : 'Jumlah / panjang'}<input type="number" min="0" step={collection === 'finance' ? '1' : '0.01'} bind:value={draft.value} /><small>Kosongkan bila tidak tersedia. Kosong berbeda dari nol.</small></label>{#if collection === 'facilities'}<label>Satuan<select bind:value={draft.unit}><option>unit</option><option>orang</option><option>km</option></select></label><label>Kondisi<input bind:value={draft.condition} placeholder="Baik / kurang baik / belum tersedia" /></label>{/if}<label class="full-span">Keterangan / sumber<textarea rows="2" bind:value={draft.note}></textarea></label>{#if collection === 'finance'}<div class="notice full-span">Tahun dikunci 2026. Tidak ada perhitungan ulang total belanja, surplus, atau defisit.</div>{/if}{/if}
  {#if isStory}<label>Tanggal {collection === 'albums' ? 'kegiatan' : 'berita'}<input type="date" bind:value={draft.date} required /></label>{#if collection === 'news'}<label>Kategori<input bind:value={draft.category} required /></label><label>Penulis<input bind:value={draft.author} /></label>{/if}<label class="full-span">{collection === 'news' ? 'Ringkasan' : 'Deskripsi album'}<textarea rows="3" bind:value={draft.summary} required></textarea></label>{#if collection === 'news'}<label class="full-span">Isi berita<textarea rows="10" bind:value={draft.body} required placeholder="Tulis berita dalam paragraf. HTML tidak didukung pada demo."></textarea></label>{/if}<div class="notice full-span">{collection === 'news' ? 'Berita' : 'Album'} langsung terbit ketika disimpan pada demo. Periksa isi sebelum menyimpan.</div>{/if}
  </div>
  {#if collection !== 'finance'}<div class="form-media"><h3>{collection === 'albums' ? 'Foto album' : 'Foto utama / profil'}</h3>{#if collection !== 'albums'}{#if draft.photo}<img class="form-photo" src={draft.photo} alt="Preview foto utama" />{/if}<Upload label={draft.photo ? 'Ganti foto' : 'Pilih foto'} onfiles={mainPhoto} />{/if}{#if isStory}<Upload label={collection === 'albums' ? 'Tambahkan foto album' : 'Tambahkan foto pendukung'} multiple onfiles={addPhotos} /><div class="upload-grid">{#each draft.photos || [] as photo}<div><img src={photo.url} alt={photo.alt} /><label>Keterangan foto<input value={photo.alt} required onchange={(e) => { if(draft) draft.photos = draft.photos?.map(p => p.id === photo.id ? {...p, alt: e.currentTarget.value} : p); }} /></label><div class="actions">{#if collection === 'albums'}<button type="button" class="button small secondary" onclick={() => { if(draft) draft.photo = photo.url; }} aria-pressed={draft.photo === photo.url}><Star size={14} />{draft.photo === photo.url ? 'Unggulan' : 'Jadikan unggulan'}</button>{/if}<button type="button" class="icon-button destructive" aria-label={`Hapus foto ${photo.alt}`} onclick={() => removePhoto(photo)}><Trash2 size={17} /></button></div></div>{/each}</div>{/if}</div>{/if}
  <label class="checkbox-label"><input type="checkbox" bind:checked={fail} /> Simulasikan gagal menyimpan</label>{#if error}<p class="field-error" role="alert">{error}</p>{/if}<div class="form-bottom"><small>Simulasi frontend · data hanya di memori</small><div class="actions"><button type="button" class="button secondary" onclick={close} disabled={busy}>Batal</button><button class="button" type="submit" disabled={busy}><Save size={17} />{busy ? 'Menyimpan…' : isStory && isNew ? 'Simpan & terbitkan demo' : 'Simpan perubahan demo'}</button></div></div>
</form></section>
{:else}
<section class="admin-panel"><div class="panel-heading"><span class="muted">{entries.length} item</span><label><span class="sr-only">Cari data</span><input type="search" placeholder="Cari data…" bind:value={search} /></label></div>{#if filtered.length}<div class="table-wrap"><table><thead><tr><th>{isStory ? 'Judul / nama' : 'Nama / uraian'}</th><th>{isStory ? 'Tanggal' : collection === 'officials' || collection === 'bpd' ? 'Jabatan' : 'Kategori'}</th><th>{collection === 'finance' ? 'Anggaran' : collection === 'facilities' ? 'Jumlah / panjang' : collection === 'officials' ? 'Pendidikan' : collection === 'albums' ? 'Foto' : 'Status'}</th><th class="align-right">Tindakan</th></tr></thead><tbody>{#each filtered as entry}<tr><td><div class="table-title">{#if entry.photo}<img src={entry.photo} alt="" width="48" height="40" />{:else if isStory}<ImageIcon size={22} />{/if}<span><strong>{entry.name}</strong>{#if entry.dummy}<small>Konten contoh</small>{/if}</span></div></td><td>{isStory ? date(entry.date) : entry.role || entry.category}</td><td>{#if collection === 'finance'}{rupiah(entry.value)}{:else if collection === 'facilities'}{number(entry.value)} {entry.value != null ? entry.unit : ''}{:else if collection === 'officials'}{entry.education || '-'}{:else if collection === 'albums'}{entry.photos?.length || 0} foto{:else}<span class="badge">{collection === 'news' ? 'Terbit' : 'Aktif'}</span>{/if}</td><td><div class="table-actions">{#if isStory}<a class="icon-button" href={`/${collection === 'news' ? 'berita' : 'galeri'}/${entry.slug}`} aria-label={`Lihat ${entry.name}`}><ArrowUpRight size={17} /></a>{/if}<button class="icon-button" onclick={() => edit(entry)} aria-label={`Edit ${entry.name}`}><Pencil size={17} /></button><button class="icon-button destructive" onclick={() => remove(entry)} aria-label={`Hapus ${entry.name}`}><Trash2 size={17} /></button></div></td></tr>{/each}</tbody></table></div>{:else}<State title={search ? 'Data tidak ditemukan' : 'Belum ada data'} message={search ? 'Coba kata kunci lainnya.' : 'Gunakan tombol tambah untuk membuat data pertama.'} />{/if}</section>
{/if}
<Confirm bind:open={confirmOpen} title={confirmTitle} message={confirmMessage} label={confirmLabel} onconfirm={() => action()} />
