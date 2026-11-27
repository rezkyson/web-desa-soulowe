<script lang="ts">
  import PublicShell from '$lib/components/PublicShell.svelte';
  let { data, children } = $props();
</script>
<PublicShell settings={data.settings} contact={data.contact}>{@render children()}</PublicShell>
