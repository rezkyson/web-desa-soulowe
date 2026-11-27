<script lang="ts">
  import { Plus, Pencil, Trash2, X, Save, Image as ImageIcon, Star, ArrowUpRight } from '@lucide/svelte';
  import { invalidateAll } from '$app/navigation';
  import { date, number, rupiah } from '$lib/utils';
  import { mediaUrl } from '$lib/media';
  import { sendJson, errorMessage } from '$lib/data/client';
  import Confirm from './Confirm.svelte';
  import Upload, { type UploadedMedia } from './Upload.svelte';
  import State from './State.svelte';

  export type EditorKind = 'officials' | 'bpd' | 'facilities' | 'finance' | 'news' | 'albums';

  let {
    kind,
    title,
    description,
    items = []
  }: {
    kind: EditorKind;
    title: string;
    description: string;
    items?: readonly unknown[];
  } = $props();

  // Item datang dari server dengan tipe berbeda per modul. Di dalam editor
  // semuanya diperlakukan sebagai record, karena field yang dipakai dipilih
  // menurut `kind`.
  const rows = $derived(items as Record<string, unknown>[]);

  /** Bentuk formulir. Satu tipe untuk semua modul supaya tidak ada lima salinan. */
  interface Draft {
    id?: string;
    name: string;
    role: string;
    education: string;
    order: number;
    category: string;
    value: number | null;
    unit: string;
    condition: string;
    note: string;
    date: string;
    author: string;
    summary: string;
    body: string;
    coverMediaId: string | null;
    coverUrl: string;
    photos: { id: string; mediaId: string; url: string; alt: string; featured: boolean }[];
  }

  const isStory = $derived(kind === 'news' || kind === 'albums');
  const isPerson = $derived(kind === 'officials' || kind === 'bpd');

  let draft = $state<Draft | null>(null);
  let isNew = $state(false);
  let search = $state('');
  let busy = $state(false);
  let error = $state('');
  let feedback = $state('');
  let confirmOpen = $state(false);
  let confirmTitle = $state('Hapus item ini?');
  let confirmMessage = $state('Data yang dihapus tidak dapat dikembalikan.');
  let confirmLabel = $state('Hapus');
  let action: () => void | Promise<void> = () => {};
  let form = $state<HTMLFormElement>();
  let beforeEdit: HTMLElement | null = null;

  const filtered = $derived(
    rows.filter(item => {
      const haystack = `${item.name ?? ''} ${item.title ?? ''} ${item.category ?? ''} ${item.role ?? ''} ${item.label ?? ''}`;
      return haystack.toLowerCase().includes(search.toLowerCase());
    })
  );

  $effect(() => { kind; draft = null; error = ''; feedback = ''; search = ''; });
  $effect(() => { if (draft && form) form.querySelector<HTMLInputElement>('input')?.focus(); });

  function emptyDraft(): Draft {
    return {
      name: '',
      role: '',
      education: '',
      order: rows.length + 1,
      category: kind === 'finance' ? 'Pendapatan' : kind === 'facilities' ? 'Sarana umum' : 'Kabar Desa',
      value: null,
      unit: 'unit',
      condition: '',
      note: '',
      date: new Date().toISOString().slice(0, 10),
      author: 'Operator Desa',
      summary: '',
      body: '',
      coverMediaId: null,
      coverUrl: '',
      photos: []
    };
  }

  function edit(item?: Record<string, unknown>) {
    beforeEdit = document.activeElement as HTMLElement;
    isNew = !item;
    error = '';
    feedback = '';

    if (!item) {
      draft = emptyDraft();
      return;
    }

    // Data dari server memakai nama kolom database; formulir memakai nama
    // pendek. Pemetaan dilakukan sekali di sini, bukan tersebar di template.
    const cover = item.cover as { storage_path?: string; is_dummy?: boolean } | null;
    const photos = (item.photos as { id: string; alt: string; media?: { id?: string; storage_path?: string; is_dummy?: boolean }; featured?: boolean }[] | null) ?? [];

    draft = {
      id: String(item.id ?? ''),
      name: String(item.name ?? item.title ?? ''),
      role: String(item.role ?? ''),
      education: String(item.education ?? ''),
      order: Number(item.display_order ?? 0),
      category: String(item.category ?? emptyDraft().category),
      value: item.value === null || item.value === undefined ? null : Number(item.value),
      unit: String(item.unit ?? 'unit'),
      condition: String(item.condition ?? ''),
      note: String(item.note ?? item.source_note ?? ''),
      date: String(item.published_on ?? item.event_date ?? new Date().toISOString().slice(0, 10)),
      author: String(item.author ?? 'Operator Desa'),
      summary: String(item.summary ?? item.description ?? ''),
      body: String(item.body ?? ''),
      coverMediaId: (item.cover_media_id as string | null) ?? null,
      coverUrl: cover ? mediaUrl({ ...cover, storage_path: cover.storage_path ?? '' } as never) : '',
      photos: photos.map(photo => ({
        id: photo.id,
        mediaId: photo.media?.id ?? '',
        url: mediaUrl({ ...photo.media, storage_path: photo.media?.storage_path ?? '' } as never),
        alt: photo.alt ?? '',
        featured: Boolean(photo.featured)
      }))
    };
  }

  function close() { draft = null; beforeEdit?.focus(); }

  function ask(title: string, message: string, callback: () => void | Promise<void>, label = 'Hapus') {
    confirmTitle = title;
    confirmMessage = message;
    action = callback;
    confirmLabel = label;
    confirmOpen = true;
  }

  function remove(item: Record<string, unknown>) {
    const label = String(item.name ?? item.title ?? 'item ini');
    ask(`Hapus “${label}”?`, 'Data akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan.', async () => {
      busy = true;
      try {
        await sendJson(`/api/admin/${endpoint()}/${item.id}`, 'DELETE');
        feedback = `“${label}” dihapus.`;
        await invalidateAll();
      } catch (cause) {
        error = errorMessage(cause);
        throw cause;
      } finally {
        busy = false;
      }
    });
  }

  function endpoint() {
    if (kind === 'news') return 'news';
    if (kind === 'albums') return 'albums';
    return kind;
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!draft || busy) return;
    error = '';
    feedback = '';
    busy = true;

    try {
      const payload = buildPayload(draft);

      if (isNew) {
        const created = await sendJson(`/api/admin/${endpoint()}`, 'POST', payload) as { id: string };
        // Album dan berita baru bisa langsung menerima foto, jadi id-nya
        // dibutuhkan sebelum foto dikirim.
        if (isStory && draft.photos.length) {
          await savePhotos(created.id, draft);
        }
        feedback = isStory ? 'Konten diterbitkan dan langsung tampil di halaman publik.' : 'Data ditambahkan.';
      } else {
        await sendJson(`/api/admin/${endpoint()}/${draft.id}`, 'PATCH', payload);
        if (isStory) await syncPhotos(draft);
        feedback = 'Perubahan tersimpan dan langsung tampil di halaman publik.';
      }

      await invalidateAll();
      close();
    } catch (cause) {
      error = errorMessage(cause);
    } finally {
      busy = false;
    }
  }

  function buildPayload(d: Draft) {
    if (isPerson) {
      return {
        name: d.name,
        role: d.role,
        education: d.education,
        order: d.order,
        ...(d.coverMediaId ? { photoMediaId: d.coverMediaId } : {})
      };
    }
    if (kind === 'finance') {
      return {
        category: d.category,
        name: d.name,
        value: d.value,
        sourceNote: d.note,
        order: d.order
      };
    }
    if (kind === 'facilities') {
      return {
        category: d.category,
        name: d.name,
        value: d.value,
        unit: d.unit,
        condition: d.condition,
        note: d.note,
        order: d.order,
        ...(d.coverMediaId ? { photoMediaId: d.coverMediaId } : {})
      };
    }
    if (kind === 'news') {
      return {
        title: d.name,
        publishedOn: d.date,
        category: d.category,
        author: d.author,
        summary: d.summary,
        body: d.body,
        ...(d.coverMediaId ? { coverMediaId: d.coverMediaId } : {})
      };
    }
    // albums
    return {
      name: d.name,
      eventDate: d.date,
      description: d.summary
    };
  }

  /** Foto yang belum punya id berarti baru dipilih, jadi perlu dikirim. */
  async function savePhotos(id: string, d: Draft) {
    const isAlbum = kind === 'albums';
    const base = isAlbum ? `/api/admin/albums/${id}` : `/api/admin/news/${id}`;
    const path = isAlbum ? `${base}/photos` : `${base}/images`;

    let firstMediaId = '';
    for (const [index, photo] of d.photos.entries()) {
      if (photo.id) continue;
      if (!photo.mediaId) continue;
      if (!firstMediaId) firstMediaId = photo.mediaId;
      await sendJson(path, 'POST', { mediaId: photo.mediaId, alt: photo.alt, order: index });
    }

    // Album butuh foto unggulan. Kalau belum ada, foto pertama dipakai supaya
    // album tidak tampil tanpa sampul.
    if (isAlbum && firstMediaId) {
      await sendJson(`${base}/cover`, 'PATCH', { mediaId: firstMediaId });
    }
  }

  /** Hapus foto yang dibuang operator, lalu kirim yang baru. */
  async function syncPhotos(d: Draft) {
    if (!d.id) return;
    const isAlbum = kind === 'albums';
    const base = isAlbum ? `/api/admin/albums/${d.id}` : `/api/admin/news/${d.id}`;

    // Foto unggulan album tidak boleh dihapus sebelum unggulan dipindah.
    const current = rows.find(item => item.id === d.id);
    const keptIds = new Set(d.photos.map(photo => photo.id).filter(Boolean));
    const removed = ((current?.photos as { id: string; featured?: boolean }[] | null) ?? [])
      .filter(photo => !keptIds.has(photo.id));

    if (isAlbum && removed.some(photo => photo.featured)) {
      const replacement = d.photos.find(photo => photo.mediaId)?.mediaId;
      if (replacement) await sendJson(`${base}/cover`, 'PATCH', { mediaId: replacement });
    }

    for (const photo of removed) {
      await sendJson(
        isAlbum ? `${base}/photos/${photo.id}` : `${base}/images/${photo.id}`,
        'DELETE'
      );
    }

    await savePhotos(d.id, d);

    if (isAlbum) {
      const featured = d.photos.find(photo => photo.featured);
      if (featured?.mediaId) await sendJson(`${base}/cover`, 'PATCH', { mediaId: featured.mediaId });
    }
  }

  function onCoverUploaded(uploaded: UploadedMedia[]) {
    if (!draft || !uploaded[0]) return;
    draft.coverMediaId = uploaded[0].id;
    draft.coverUrl = mediaUrl({ ...uploaded[0], is_dummy: false } as never);
  }

  function onPhotosUploaded(uploaded: UploadedMedia[]) {
    if (!draft) return;
    draft.photos = [
      ...draft.photos,
      ...uploaded.map(media => ({
        id: '',
        mediaId: media.id,
        url: mediaUrl({ ...media, is_dummy: false } as never),
        alt: media.alt,
        featured: false
      }))
    ];
  }

  function removePhoto(photo: Draft['photos'][number]) {
    if (!draft) return;
    ask('Hapus foto ini?', 'Foto dilepas dari konten ini. Berkasnya tetap tersimpan dan bisa dipakai konten lain.', () => {
      if (!draft) return;
      draft.photos = draft.photos.filter(item => item !== photo);
    }, 'Lepas foto');
  }

  const titleOf = (item: Record<string, unknown>) => String(item.name ?? item.title ?? item.label ?? '');
</script>

<div class="admin-page-heading">
  <div><span class="eyebrow">Kelola informasi</span><h1>{title}</h1><p>{description}</p></div>
  {#if !draft}
    <button class="button" onclick={() => edit()}>
      <Plus size={18} /> Tambah {kind === 'news' ? 'berita' : kind === 'albums' ? 'album' : 'data'}
    </button>
  {/if}
</div>

{#if feedback}<div class="feedback" role="status">{feedback}</div>{/if}
{#if error && !draft}<p class="field-error" role="alert">{error}</p>{/if}

{#if draft}
  <section class="admin-panel editor-panel">
    <div class="panel-heading">
      <h2>{isNew ? 'Tambah' : 'Edit'} {kind === 'news' ? 'berita' : kind === 'albums' ? 'album' : 'data'}</h2>
      <button class="icon-button" onclick={close} aria-label="Tutup form" disabled={busy}><X size={21} /></button>
    </div>
    <form bind:this={form} onsubmit={save}>
      <div class="form-grid">
        <label class="full-span">{kind === 'news' ? 'Judul berita' : kind === 'albums' ? 'Nama album' : 'Nama / uraian'}
          <input bind:value={draft.name} required maxlength="180" />
        </label>

        {#if isPerson}
          <label>Jabatan<input bind:value={draft.role} required /></label>
          {#if kind === 'officials'}<label>Pendidikan<input bind:value={draft.education} placeholder="Contoh: SMA" /></label>{/if}
          <label>Urutan tampil<input type="number" bind:value={draft.order} min="0" step="1" required /></label>
        {/if}

        {#if kind === 'facilities' || kind === 'finance'}
          <label>Kategori
            <select bind:value={draft.category}>
              {#each kind === 'finance' ? ['Pendapatan', 'Belanja'] : ['Sarana pendidikan', 'Keamanan', 'Jalan', 'Sarana umum', 'Pemerintahan'] as option}<option>{option}</option>{/each}
            </select>
          </label>
          <label>{kind === 'finance' ? 'Anggaran (Rupiah)' : 'Jumlah / panjang'}
            <input type="number" min="0" step={kind === 'finance' ? '1' : '0.01'} bind:value={draft.value} />
            <small>Kosongkan bila tidak tersedia. Kosong berbeda dari nol.</small>
          </label>
          {#if kind === 'facilities'}
            <label>Satuan<select bind:value={draft.unit}><option>unit</option><option>orang</option><option>km</option></select></label>
            <label>Kondisi<input bind:value={draft.condition} placeholder="Baik / kurang baik / belum tersedia" /></label>
          {/if}
          <label class="full-span">Keterangan / sumber<textarea rows="2" bind:value={draft.note}></textarea></label>
          {#if kind === 'finance'}<div class="notice full-span">Tahun dikunci 2026. Tidak ada perhitungan ulang total belanja, surplus, atau defisit.</div>{/if}
        {/if}

        {#if isStory}
          <label>Tanggal {kind === 'albums' ? 'kegiatan' : 'berita'}<input type="date" bind:value={draft.date} required /></label>
          {#if kind === 'news'}
            <label>Kategori<input bind:value={draft.category} required /></label>
            <label>Penulis<input bind:value={draft.author} /></label>
          {/if}
          <label class="full-span">{kind === 'news' ? 'Ringkasan' : 'Deskripsi album'}<textarea rows="3" bind:value={draft.summary} required></textarea></label>
          {#if kind === 'news'}
            <label class="full-span">Isi berita<textarea rows="10" bind:value={draft.body} required placeholder="Tulis berita dalam paragraf. HTML tidak didukung."></textarea></label>
          {/if}
          <div class="notice full-span">{kind === 'news' ? 'Berita' : 'Album'} langsung terbit begitu disimpan. Periksa isi sebelum menyimpan.</div>
        {/if}
      </div>

      {#if kind !== 'finance'}
        <div class="form-media">
          <h3>{kind === 'albums' ? 'Foto album' : kind === 'news' ? 'Foto utama' : 'Foto profil'}</h3>
          {#if kind !== 'albums'}
            {#if draft.coverUrl}<img class="form-photo" src={draft.coverUrl} alt="Preview foto" />{/if}
            <Upload label={draft.coverUrl ? 'Ganti foto' : 'Pilih foto'} folder={isPerson ? 'perangkat' : kind === 'news' ? 'berita' : 'fasilitas'} onuploaded={onCoverUploaded} />
          {/if}

          {#if isStory}
            <Upload label={kind === 'albums' ? 'Tambahkan foto album' : 'Tambahkan foto pendukung'} multiple folder={kind === 'albums' ? 'galeri' : 'berita'} onuploaded={onPhotosUploaded} />
            <div class="upload-grid">
              {#each draft.photos as photo, index (photo.id || photo.mediaId + index)}
                <div>
                  <img src={photo.url} alt={photo.alt} />
                  <label>Keterangan foto<input value={photo.alt} onchange={(e) => { if (draft) draft.photos[index].alt = e.currentTarget.value; }} /></label>
                  <div class="actions">
                    {#if kind === 'albums'}
                      <button type="button" class="button small secondary" onclick={() => { if (draft) draft.photos = draft.photos.map((p, i) => ({ ...p, featured: i === index })); }} aria-pressed={photo.featured}>
                        <Star size={14} />{photo.featured ? 'Unggulan' : 'Jadikan unggulan'}
                      </button>
                    {/if}
                    <button type="button" class="icon-button destructive" aria-label={`Hapus foto ${photo.alt}`} onclick={() => removePhoto(photo)}><Trash2 size={17} /></button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      {#if error}<p class="field-error" role="alert">{error}</p>{/if}
      <div class="form-bottom">
        <small>Perubahan langsung tersimpan ke database desa</small>
        <div class="actions">
          <button type="button" class="button secondary" onclick={close} disabled={busy}>Batal</button>
          <button class="button" type="submit" disabled={busy}>
            <Save size={17} />{busy ? 'Menyimpan…' : isStory && isNew ? 'Simpan & terbitkan' : 'Simpan perubahan'}
          </button>
        </div>
      </div>
    </form>
  </section>
{:else}
  <section class="admin-panel">
    <div class="panel-heading">
      <span class="muted">{rows.length} item</span>
      <label><span class="sr-only">Cari data</span><input type="search" placeholder="Cari data…" bind:value={search} /></label>
    </div>

    {#if filtered.length}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{isStory ? 'Judul / nama' : 'Nama / uraian'}</th>
              <th>{isStory ? 'Tanggal' : isPerson ? 'Jabatan' : 'Kategori'}</th>
              <th>{kind === 'finance' ? 'Anggaran' : kind === 'facilities' ? 'Jumlah / panjang' : kind === 'officials' ? 'Pendidikan' : kind === 'albums' ? 'Foto' : 'Status'}</th>
              <th class="align-right">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {#each filtered as item (item.id)}
              <tr>
                <td>
                  <div class="table-title">
                    {#if kind !== 'finance' && mediaUrl(item.cover as never)}
                      <img src={mediaUrl(item.cover as never)} alt="" width="48" height="40" />
                    {:else if isStory}
                      <ImageIcon size={22} />
                    {/if}
                    <span><strong>{titleOf(item)}</strong>{#if item.is_dummy}<small>Konten contoh</small>{/if}</span>
                  </div>
                </td>
                <td>{isStory ? date(String(item.published_on ?? item.event_date ?? '')) : String(item.role ?? item.category ?? '')}</td>
                <td>
                  {#if kind === 'finance'}
                    {rupiah(item.value as number | null)}
                  {:else if kind === 'facilities'}
                    {number(item.value as number | null)} {item.value != null ? item.unit : ''}
                  {:else if kind === 'officials'}
                    {String(item.education ?? '-')}
                  {:else if kind === 'albums'}
                    {((item.photos as unknown[] | null) ?? []).length} foto
                  {:else}
                    <span class="badge">{kind === 'news' ? 'Terbit' : 'Aktif'}</span>
                  {/if}
                </td>
                <td>
                  <div class="table-actions">
                    {#if isStory}
                      <a class="icon-button" href={`/${kind === 'news' ? 'berita' : 'galeri'}/${item.slug}`} aria-label={`Lihat ${titleOf(item)}`}><ArrowUpRight size={17} /></a>
                    {/if}
                    <button class="icon-button" onclick={() => edit(item)} aria-label={`Edit ${titleOf(item)}`}><Pencil size={17} /></button>
                    <button class="icon-button destructive" onclick={() => remove(item)} aria-label={`Hapus ${titleOf(item)}`}><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <State
        title={search ? 'Data tidak ditemukan' : 'Belum ada data'}
        message={search ? 'Coba kata kunci lain.' : 'Tambahkan data pertama dengan tombol di atas.'}
      />
    {/if}
  </section>
{/if}

<Confirm bind:open={confirmOpen} title={confirmTitle} message={confirmMessage} label={confirmLabel} onconfirm={() => action()} />
