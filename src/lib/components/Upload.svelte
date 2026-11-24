<script lang="ts">
  import { ImagePlus } from '@lucide/svelte';
  import { uploadError } from '$lib/utils';
  import type { Photo } from '$lib/types';
  let { label = 'Unggah gambar', multiple = false, onfiles }: { label?: string; multiple?: boolean; onfiles: (photos: Photo[]) => void } = $props();
  let error = $state('');
  let busy = $state(false);
  let id = $props.id();
  async function change(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    error = '';
    for (const file of files) { const issue = uploadError(file); if (issue) { error = `${file.name}: ${issue}`; input.value = ''; return; } }
    busy = true;
    try {
      const photos = await Promise.all(files.map(file => new Promise<Photo>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => resolve({ id: crypto.randomUUID(), url: String(reader.result), alt: file.name.replace(/\.[^.]+$/, ''), dummy: true });
        reader.readAsDataURL(file);
      })));
      onfiles(photos);
    } catch { error = 'Gambar tidak dapat dibaca. Coba file lain.'; }
    finally { busy = false; input.value = ''; }
  }
</script>
<div class="upload-control">
  <label for={id}><ImagePlus size={20} /><span>{busy ? 'Membaca gambar…' : label}</span></label>
  <input {id} type="file" accept="image/jpeg,image/png,image/webp" {multiple} onchange={change} disabled={busy} aria-describedby={`${id}-help`} />
  <small id={`${id}-help`}>JPG, PNG, WebP · maks. 5 MB per foto. Preview lokal, belum diunggah ke server.</small>
  {#if error}<p class="field-error" role="alert">{error}</p>{/if}
</div>
