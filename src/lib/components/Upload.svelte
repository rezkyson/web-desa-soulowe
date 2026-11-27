<script lang="ts">
  import { ImagePlus, LoaderCircle } from '@lucide/svelte';
  import { uploadError } from '$lib/utils';
  import { postForm } from '$lib/data/client';

  export interface UploadedMedia {
    id: string;
    storage_path: string;
    mime_type: string;
    byte_size: number;
    alt: string;
  }

  let {
    label = 'Unggah gambar',
    multiple = false,
    folder = 'galeri',
    onuploaded
  }: {
    label?: string;
    multiple?: boolean;
    folder?: 'branding' | 'profil' | 'perangkat' | 'berita' | 'galeri' | 'fasilitas';
    onuploaded: (media: UploadedMedia[]) => void | Promise<void>;
  } = $props();

  let error = $state('');
  let busy = $state(false);
  let progress = $state('');
  let id = $props.id();

  async function change(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    error = '';
    progress = '';
    if (!files.length) return;

    // Diperiksa di klien untuk umpan balik cepat, tetapi server tetap
    // memeriksa ulang dari isi berkas. Pemeriksaan klien bukan pengaman.
    for (const file of files) {
      const issue = uploadError(file);
      if (issue) {
        error = `${file.name}: ${issue}`;
        input.value = '';
        return;
      }
    }

    busy = true;
    const uploaded: UploadedMedia[] = [];

    try {
      for (const [index, file] of files.entries()) {
        progress = files.length > 1 ? `Mengunggah ${index + 1} dari ${files.length}…` : 'Mengunggah…';

        const form = new FormData();
        form.append('file', file);
        form.append('folder', folder);
        form.append('alt', file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim());

        const result = await postForm('/api/admin/media/upload', form) as UploadedMedia;
        uploaded.push(result);
      }

      progress = 'Menyimpan…';
      await onuploaded(uploaded);
      progress = '';
    } catch (cause) {
      // Pesan dari server sudah berbahasa Indonesia dan menyebut penyebabnya
      // (misalnya ukuran atau format), jadi dipakai apa adanya.
      error = cause instanceof Error ? cause.message : 'Unggahan gagal. Coba lagi.';
      // Berkas yang sudah terunggah sebelum kegagalan tetap dilaporkan, supaya
      // operator tidak mengulang semuanya dan tidak meninggalkan file yatim.
      if (uploaded.length) await onuploaded(uploaded);
    } finally {
      busy = false;
      input.value = '';
    }
  }
</script>

<div class="upload-control">
  <label for={id}>
    {#if busy}<LoaderCircle size={20} class="spin" />{:else}<ImagePlus size={20} />{/if}
    <span>{busy ? progress || 'Memproses…' : label}</span>
  </label>
  <input {id} type="file" accept="image/jpeg,image/png,image/webp" {multiple} onchange={change} disabled={busy} aria-describedby={`${id}-help`} />
  <small id={`${id}-help`}>JPG, PNG, WebP · maks. 5 MB per foto. Berkas diperiksa dari isinya, bukan namanya.</small>
  {#if error}<p class="field-error" role="alert">{error}</p>{/if}
</div>
