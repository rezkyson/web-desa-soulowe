<script lang="ts">
  import { tick } from 'svelte';
  import { TriangleAlert } from '@lucide/svelte';
  let { open = $bindable(false), title = 'Hapus data ini?', message = 'Data yang dihapus tidak dapat dikembalikan.', label = 'Hapus', onconfirm }: { open?: boolean; title?: string; message?: string; label?: string; onconfirm: () => void | Promise<void> } = $props();
  let dialog: HTMLDialogElement;
  let busy = $state(false);
  let error = $state('');
  let previous: HTMLElement | null = null;
  let cancelButton: HTMLButtonElement;
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) { previous = document.activeElement as HTMLElement; error = ''; dialog.showModal(); cancelButton?.focus(); }
    else if (!open && dialog.open) { dialog.close(); previous?.focus(); }
  });
  async function confirm() {
    if (busy) return;
    busy = true;
    await tick();
    try { await onconfirm(); open = false; }
    catch { error = 'Tindakan gagal. Silakan coba kembali.'; }
    finally { busy = false; }
  }
</script>
<dialog bind:this={dialog} class="confirm-dialog" oncancel={(event) => { if (busy) event.preventDefault(); else open = false; }} onclose={() => { open = false; previous?.focus(); }} aria-labelledby="confirm-title" aria-describedby="confirm-description">
  <div class="dialog-icon"><TriangleAlert size={25} /></div>
  <h2 id="confirm-title">{title}</h2><p id="confirm-description">{message}</p>
  {#if error}<p class="field-error" role="alert">{error}</p>{/if}
  <div class="actions"><button bind:this={cancelButton} class="button secondary" disabled={busy} onclick={() => open = false}>Batal</button><button class="button danger" disabled={busy} onclick={confirm}>{busy ? 'Memproses…' : label}</button></div>
</dialog>
