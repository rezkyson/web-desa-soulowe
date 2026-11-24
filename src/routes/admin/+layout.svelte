<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { MediaQuery } from 'svelte/reactivity';
  import { LayoutDashboard, MessageSquare, Users, ChartColumn, Building2, Landmark, Newspaper, Images, Phone, Image, Settings, LogOut, ArrowUpRight, Menu, X, FlaskConical } from '@lucide/svelte';
  import { demo, demoSession } from '$lib/mock/store';
  import State from '$lib/components/State.svelte';
  let { children } = $props();
  let menu = $state(false);
  const wide = new MediaQuery('(min-width: 901px)');
  const nav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/sambutan', label: 'Sambutan Kepala Desa', icon: MessageSquare },
    { href: '/admin/pemerintahan', label: 'Pemerintahan Desa', icon: Users },
    { href: '/admin/statistik', label: 'Data Statistik', icon: ChartColumn },
    { href: '/admin/fasilitas', label: 'Sarana & Prasarana', icon: Building2 },
    { href: '/admin/keuangan', label: 'Keuangan Desa', icon: Landmark },
    { href: '/admin/berita', label: 'Berita', icon: Newspaper },
    { href: '/admin/galeri', label: 'Galeri', icon: Images },
    { href: '/admin/whatsapp', label: 'WhatsApp Layanan', icon: Phone },
    { href: '/admin/media', label: 'Media & Gambar', icon: Image },
    { href: '/admin/akun', label: 'Pengaturan Akun', icon: Settings }
  ];
  let isLogin = $derived(page.url.pathname === '/admin/login');
  $effect(() => { page.url.pathname; menu = false; });
  async function logout() { demoSession.set(false); await goto('/admin/login'); }
</script>
<svelte:head><meta name="robots" content="noindex,nofollow" /></svelte:head>
{#if isLogin}{@render children()}{:else}
<div class="admin-app">{#if menu && !wide.current}<button class="sidebar-scrim" aria-label="Tutup navigasi operator" onclick={() => menu = false}></button>{/if}<aside class="admin-sidebar" class:open={menu} inert={!wide.current && !menu}><a class="brand" href="/admin"><img src={$demo.settings.logo} alt="Lambang Kabupaten Sigi" width="34" height="48" /><span><strong>SOULOWE</strong><small>Ruang Operator</small></span></a><button class="icon-button sidebar-close" onclick={() => menu = false} aria-label="Tutup menu"><X /></button><span class="sidebar-label">KELOLA INFORMASI</span><nav aria-label="Navigasi admin">{#each nav as item}<a href={item.href} aria-current={page.url.pathname === item.href ? 'page' : undefined}><item.icon size={18} />{item.label}</a>{/each}</nav><div class="sidebar-bottom"><a href="/">Lihat website <ArrowUpRight size={17} /></a><button onclick={logout}><LogOut size={17} /> Keluar dari demo</button></div></aside><div class="admin-workspace"><header class="admin-topbar"><div><button class="icon-button admin-menu" onclick={() => menu = !menu} aria-label="Buka menu admin" aria-expanded={menu}><Menu /></button><span>Pemerintah Desa Soulowe <span class="muted">/ Panel Operator</span></span></div><span class="operator-avatar">OP</span></header><div class="demo-banner"><FlaskConical size={18} /><span><strong>Mode demo frontend.</strong> Login bukan autentikasi nyata. Perubahan hanya di memori dan hilang saat halaman dimuat ulang.</span></div><main class="admin-main" id="admin-main">{#if $demoSession}{@render children()}{:else}<State title="Buka sesi demo operator" message="Panel ini belum terhubung Supabase Auth. Gunakan halaman demo untuk meninjau alur frontend." /><a href="/admin/login" class="button">Masuk demo</a>{/if}</main></div></div>
{/if}
