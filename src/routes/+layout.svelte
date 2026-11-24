<script lang="ts">
  import '@fontsource-variable/bricolage-grotesque';
  import '@fontsource-variable/instrument-sans';
  import '../app.css';
  import '../theme.css';
  import '../public-refinement.css';
  import '../map.css';
  import '../cards.css';
  import '../hero.css';
  import { onMount } from 'svelte';
  let { children } = $props();
  onMount(() => { document.documentElement.dataset.hydrated = 'true'; });
</script>

{@render children()}
