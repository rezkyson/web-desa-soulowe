<script lang="ts">
  import { CircleAlert, Inbox, LoaderCircle } from '@lucide/svelte';
  let { kind = 'empty', title = 'Data belum tersedia', message = 'Informasi akan ditampilkan setelah diperbarui.', retry }: { kind?: 'empty' | 'loading' | 'error'; title?: string; message?: string; retry?: () => void } = $props();
</script>
<div class="state-panel" role={kind === 'error' ? 'alert' : 'status'} aria-live="polite">
  {#if kind === 'loading'}<LoaderCircle size={28} class="spin" />{:else if kind === 'error'}<CircleAlert size={28} />{:else}<Inbox size={28} />{/if}
  <h3>{title}</h3><p>{message}</p>
  {#if retry}<button class="button secondary" onclick={retry}>Coba lagi</button>{/if}
</div>
