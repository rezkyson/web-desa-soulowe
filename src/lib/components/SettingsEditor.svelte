<script lang="ts">
  import { Save, ExternalLink, Image as ImageIcon } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { mediaUrl } from '$lib/media';
  import { whatsapp } from '$lib/utils';
  import { sendJson, errorMessage } from '$lib/data/client';
  import Upload, { type UploadedMedia } from './Upload.svelte';
  import Confirm from './Confirm.svelte';
  import State from './State.svelte';
  import type { Principal, Contact, Settings, Statistic } from '$lib/data/types';

  let {
    module,
    principal = null,
    contact = null,
    settings = null,
    statistics = [],
    media = []
  }: {
    module: string;
    principal?: Principal | null;
    contact?: Contact | null;
    settings?: Settings | null;
    statistics?: Statistic[];
    media?: { id: string; storage_path: string; alt: string; byte_size: number; mime_type: string }[];
  } = $props();

  // Nilai awal diambil dari props sekali, lalu formulir bekerja sendiri.
  // `untrack` dipakai supaya perubahan props tidak menimpa ketikan operator
  // di tengah pengisian.
  const initial = untrack(() => ({
    name: principal?.name ?? '',
    greeting: principal?.greeting ?? '',
    photoUrl: mediaUrl(principal?.photo, ''),
    phone: contact?.phone ?? '',
    message: contact?.message ?? '',
    logoUrl: mediaUrl(settings?.logo, ''),
    heroUrl: mediaUrl(settings?.hero, ''),
    statistics: structuredClone(statistics)
  }));

  const titles: Record<string, [string, string]> = {
    sambutan: ['Sambutan Kepala Desa', 'Perbarui nama, foto, dan sambutan yang ditampilkan pada website.'],
    statistik: ['Data Statistik', 'Perbarui data agregat tahun 2026. Jangan masukkan identitas individu.'],
    whatsapp: ['WhatsApp Layanan', 'Atur nomor dan pesan pembuka untuk kanal informasi desa.'],
    media: ['Media & Gambar', 'Ganti logo dan foto hero website. Foto konten dikelola pada modul masing-masing.'],
    akun: ['Pengaturan Akun', 'Ubah password akun operator. Diperlukan password saat ini.']
  };

  // Nilai awal diambil dari data server. `$state` disalin sekali, lalu formulir
  // bekerja sendiri sampai disimpan atau dibatalkan.
  let name = $state(initial.name);
  let greeting = $state(initial.greeting);
  let photoId = $state<string | null>(null);
  let photoUrl = $state(initial.photoUrl);

  let phone = $state(initial.phone);
  let message = $state(initial.message);

  let logoId = $state<string | null>(null);
  let logoUrl = $state(initial.logoUrl);
  let heroId = $state<string | null>(null);
  let heroUrl = $state(initial.heroUrl);

  let statCategory = $state('Kependudukan');
  let stats = $state<Statistic[]>(initial.statistics);

  let currentPassword = $state('');
  let newPassword = $state('');
  let passwordConfirm = $state('');

  let busy = $state(false);
  let error = $state('');
  let feedback = $state('');
  let confirmOpen = $state(false);
  let confirmTitle = $state('');
  let confirmMessage = $state('');
  let pending: () => void | Promise<void> = () => {};

  function ask(title: string, msg: string, callback: () => void | Promise<void>) {
    confirmTitle = title;
    confirmMessage = msg;
    pending = callback;
    confirmOpen = true;
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    error = '';
    feedback = '';
    busy = true;

    try {
      if (module === 'sambutan') {
        await sendJson('/api/admin/principal', 'PATCH', {
          name: name.trim(),
          greeting,
          ...(photoId ? { photoMediaId: photoId } : {})
        });
        feedback = 'Sambutan tersimpan dan langsung tampil di halaman publik.';
      }

      if (module === 'whatsapp') {
        await sendJson('/api/admin/contact', 'PATCH', { phone, message });
        feedback = 'Nomor dan pesan layanan tersimpan.';
      }

      if (module === 'media') {
        await sendJson('/api/admin/settings', 'PATCH', {
          ...(logoId ? { logoMediaId: logoId } : {}),
          ...(heroId ? { heroMediaId: heroId } : {})
        });
        feedback = 'Pengaturan media tersimpan.';
      }

      if (module === 'statistik') {
        // Hanya baris yang nilainya berubah yang dikirim, supaya tidak ada
        // puluhan request untuk data yang tidak disentuh.
        const changed = stats.filter(item => {
          const original = statistics.find(s => s.id === item.id);
          return original && original.value !== item.value;
        });
        for (const item of changed) {
          await sendJson(`/api/admin/statistics/${item.id}`, 'PATCH', {
            label: item.label,
            value: item.value
          });
        }
        feedback = changed.length ? `${changed.length} angka diperbarui.` : 'Tidak ada angka yang berubah.';
      }

      if (module === 'akun') {
        if (newPassword !== passwordConfirm) {
          error = 'Konfirmasi password tidak sama.';
          busy = false;
          return;
        }
        await sendJson('/api/admin/auth/password', 'POST', {
          currentPassword,
          newPassword
        });
        currentPassword = '';
        newPassword = '';
        passwordConfirm = '';
        feedback = 'Password berhasil diubah. Gunakan password baru pada login berikutnya.';
      }

      await invalidateAll();
    } catch (cause) {
      error = errorMessage(cause);
    } finally {
      busy = false;
    }
  }

  function onPhotoUploaded(uploaded: UploadedMedia[]) {
    if (!uploaded[0]) return;
    photoId = uploaded[0].id;
    photoUrl = mediaUrl({ ...uploaded[0], is_dummy: false } as never);
  }

  function onLogoUploaded(uploaded: UploadedMedia[]) {
    if (!uploaded[0]) return;
    const next = uploaded[0];
    const apply = () => {
      logoId = next.id;
      logoUrl = mediaUrl({ ...next, is_dummy: false } as never);
    };
    if (logoUrl) ask('Ganti logo yang sedang digunakan?', 'Logo lama tetap tersimpan sebagai media dan bisa dipakai lagi. Perubahan diterapkan setelah Anda menyimpan.', apply);
    else apply();
  }

  function onHeroUploaded(uploaded: UploadedMedia[]) {
    if (!uploaded[0]) return;
    const next = uploaded[0];
    const apply = () => {
      heroId = next.id;
      heroUrl = mediaUrl({ ...next, is_dummy: false } as never);
    };
    if (heroUrl) ask('Ganti foto hero yang sedang digunakan?', 'Foto lama tetap tersimpan sebagai media dan bisa dipakai lagi. Perubahan diterapkan setelah Anda menyimpan.', apply);
    else apply();
  }

  function chooseMedia(url: string, id: string, target: 'logo' | 'hero') {
    const apply = () => {
      if (target === 'logo') { logoId = id; logoUrl = url; }
      else { heroId = id; heroUrl = url; }
    };
    const current = target === 'logo' ? logoUrl : heroUrl;
    if (current) ask(`Ganti ${target === 'logo' ? 'logo' : 'foto hero'}?`, 'Media lama tetap tersimpan. Perubahan diterapkan setelah Anda menyimpan.', apply);
    else apply();
  }

  const grouped = $derived(stats.filter(item => item.category === statCategory));
</script>

<div class="admin-page-heading">
  <div><span class="eyebrow">Kelola informasi</span><h1>{titles[module]?.[0] ?? 'Pengaturan'}</h1><p>{titles[module]?.[1] ?? ''}</p></div>
  {#if module === 'statistik'}<span class="badge">Tahun 2026</span>{/if}
</div>

{#if feedback}<div class="feedback" role="status">{feedback}</div>{/if}

<form class="admin-panel settings-form" onsubmit={submit}>
  {#if module === 'sambutan'}
    {#if principal}
      <div class="form-grid">
        <label class="full-span">Nama Kepala Desa<input bind:value={name} required maxlength="120" /></label>
        <label class="full-span">Sambutan<textarea rows="9" bind:value={greeting} required></textarea></label>
      </div>
      <div class="form-media">
        <h3>Foto Kepala Desa</h3>
        {#if photoUrl}<img class="form-photo" src={photoUrl} alt="Preview Kepala Desa" />{:else}<div class="photo-placeholder"><ImageIcon size={28} /><span>Foto belum tersedia</span></div>{/if}
        <Upload label="Pilih foto Kepala Desa" folder="profil" onuploaded={onPhotoUploaded} />
      </div>
      {#if principal.is_dummy}<div class="notice">Data ini masih berupa contoh. Ganti dengan identitas dan sambutan resmi sebelum peluncuran.</div>{/if}
    {:else}
      <State title="Profil Kepala Desa belum tersedia" message="Baris profil belum ada di database." />
    {/if}

  {:else if module === 'statistik'}
    <div class="filter-tabs">
      {#each ['Kependudukan', 'Pendidikan', 'Mata pencaharian'] as group}
        <button type="button" class:active={statCategory === group} onclick={() => statCategory = group}>{group}</button>
      {/each}
    </div>
    {#if grouped.length}
      <div class="stat-form-grid">
        {#each grouped as item (item.id)}
          <label>{item.label}
            <div class="input-unit">
              <input
                type="number"
                min="0"
                step={item.unit === 'km' ? '0.01' : '1'}
                value={item.value ?? ''}
                onchange={(e) => {
                  const raw = e.currentTarget.value;
                  stats = stats.map(s => s.id === item.id ? { ...s, value: raw === '' ? null : Number(raw) } : s);
                }}
              />
              <span>{item.unit}</span>
            </div>
          </label>
        {/each}
      </div>
      <div class="notice">Kosong berarti tidak tersedia; nol berarti nilai 0. RTM adalah rumah tangga miskin. Nilai sumber tidak dijumlahkan atau diperbaiki otomatis.</div>
    {:else}
      <State title="Belum ada data pada kategori ini" />
    {/if}

  {:else if module === 'whatsapp'}
    <label>Nomor WhatsApp
      <input type="tel" bind:value={phone} required placeholder="628xxxxxxxxxx" />
      <small>Gunakan kode negara 62. Boleh juga mengetik 08…, server akan menormalkannya.</small>
    </label>
    <label>Pesan pembuka otomatis<textarea rows="4" bind:value={message} required></textarea></label>
    {#if phone}<a class="text-link" href={whatsapp(phone, message)} target="_blank" rel="noreferrer">Preview tautan WhatsApp <ExternalLink size={16} /></a>{/if}
    {#if contact?.is_dummy}<div class="notice">Nomor ini masih contoh. Jangan gunakan untuk menerima informasi pribadi warga sampai nomor resmi diisi.</div>{/if}

  {:else if module === 'media'}
    <div class="branding-media">
      <section>
        <h3>Logo website</h3>
        {#if logoUrl}<img class="logo-preview" src={logoUrl} alt="Preview logo aktif" />{:else}<div class="photo-placeholder"><ImageIcon size={28} /><span>Belum ada logo</span></div>{/if}
        <Upload label="Ganti logo" folder="branding" onuploaded={onLogoUploaded} />
      </section>
      <section>
        <h3>Foto hero</h3>
        {#if heroUrl}<img class="hero-preview" src={heroUrl} alt="Preview foto hero" />{:else}<div class="photo-placeholder"><ImageIcon size={28} /><span>Belum ada foto hero</span></div>{/if}
        <Upload label="Ganti foto hero" folder="branding" onuploaded={onHeroUploaded} />
      </section>
    </div>

    <h3>Media yang tersedia</h3>
    {#if media.length}
      <div class="media-library-grid">
        {#each media as asset, index (asset.id)}
          <div>
            <img src={mediaUrl({ storage_path: asset.storage_path, is_dummy: false } as never)} alt={asset.alt || `Media ${index + 1}`} />
            <div class="actions">
              <button type="button" class="button small secondary" onclick={() => chooseMedia(mediaUrl({ storage_path: asset.storage_path, is_dummy: false } as never), asset.id, 'logo')}>Jadikan logo</button>
              <button type="button" class="button small secondary" onclick={() => chooseMedia(mediaUrl({ storage_path: asset.storage_path, is_dummy: false } as never), asset.id, 'hero')}>Jadikan hero</button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <State title="Belum ada media terunggah" message="Unggah logo atau foto hero di atas untuk memulai." />
    {/if}
    <div class="notice">Menghapus media yang masih dipakai konten lain akan ditolak server. Lepaskan dulu dari kontennya.</div>

  {:else if module === 'akun'}
    <div class="notice">Password baru minimal 8 karakter. Password saat ini diperlukan untuk mencegah perubahan dari sesi yang tertinggal terbuka di perangkat lain.</div>
    <label>Password saat ini<input type="password" bind:value={currentPassword} required autocomplete="current-password" /></label>
    <label>Password baru<input type="password" bind:value={newPassword} minlength="8" required autocomplete="new-password" /><small>Minimal 8 karakter.</small></label>
    <label>Konfirmasi password baru<input type="password" bind:value={passwordConfirm} minlength="8" required autocomplete="new-password" /></label>
  {/if}

  {#if error}<p class="field-error" role="alert">{error}</p>{/if}
  <div class="form-bottom">
    <small>Perubahan langsung tersimpan ke database desa</small>
    <button type="submit" class="button" disabled={busy}>
      <Save size={17} />{busy ? 'Menyimpan…' : module === 'akun' ? 'Ubah password' : 'Simpan perubahan'}
    </button>
  </div>
</form>

<Confirm bind:open={confirmOpen} title={confirmTitle} message={confirmMessage} label="Lanjutkan" onconfirm={() => pending()} />
