<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { borderVisibility } from '$lib/actions/borderVisibility';

  type Props = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
    duration?: number;
    color?: string;
    width?: number;
    contentClassName?: string;
  };
  let { children, duration = 8, color = '#6f9263', width = 1, class: className = '',
    contentClassName = '', style = '', ...rest }: Props = $props();
</script>

<div {...rest} class={`animated-border ${className}`} data-slot="animated-border" use:borderVisibility
  style={`--border-duration:${Math.max(1, duration)}s;--border-light:${color};--border-width:${Math.max(0, width)}px;${style}`}>
  <span aria-hidden="true" class="animated-border__light" data-slot="animated-border-light"></span>
  <div class={`animated-border__surface ${contentClassName}`} data-slot="animated-border-content">{@render children()}</div>
</div>
