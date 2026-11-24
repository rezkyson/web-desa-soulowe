<script lang="ts">
  import { onNavigate } from '$app/navigation';
  onNavigate((navigation) => {
    if (navigation.to?.url.pathname.startsWith('/admin') || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return new Promise<void>(resolve => {
      const transition = document.startViewTransition(async () => { resolve(); await navigation.complete; });
      transition.finished.catch(() => {});
    });
  });
</script>
