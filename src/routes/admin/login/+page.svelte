<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowLeft, ArrowRight, Eye, EyeOff } from '@lucide/svelte';
  import Meta from '$lib/components/Meta.svelte';
  import { demoSession } from '$lib/mock/store';
  let email = $state('');
  let password = $state('');
  let visible = $state(false);
  let busy = $state(false);
  let error = $state('');
  let fail = $state(false);
  async function submit(event: SubmitEvent) {
    event.preventDefault(); busy = true; error = '';
    await new Promise(resolve => setTimeout(resolve, 350));
    if (fail) { error = 'Simulasi gagal masuk. Nonaktifkan simulasi error lalu coba lagi.'; busy = false; return; }
    demoSession.set(true); password = ''; busy = false; await goto('/admin');
  }
</script>
<Meta title="Masuk Operator" />
<div class="login-page"><div class="login-story"><a href="/" class="brand"><img src="/logo.png" alt="Lambang Kabupaten Sigi" width="43" height="63" /><span><strong>SOULOWE</strong><small>Pemerintah Desa</small></span></a><div><span class="eyebrow light">Ruang operator desa</span><h1>Informasi yang baik<br />dimulai dari<br />pengelolaan yang baik.</h1><p>Kelola kabar, dokumentasi, dan data desa dalam satu ruang kerja.</p></div><small>Desa Soulowe · Kecamatan Sigi Kota · Kabupaten Sigi</small></div><main class="login-form-wrap"><a href="/" class="text-link"><ArrowLeft size={16} /> Kembali ke website</a><form onsubmit={submit}><span class="eyebrow">Panel admin</span><h2>Selamat datang kembali.</h2><p>Masuk ke ruang kerja operator Desa Soulowe.</p><div class="notice"><span><strong>Demo frontend, bukan login nyata.</strong> Masukkan email contoh dan password contoh minimal 6 karakter. Jangan gunakan kredensial asli; tidak dikirim ke server.</span></div><label>Email contoh<input type="email" bind:value={email} placeholder="operator@example.com" required autocomplete="off" /></label><label>Password contoh<div class="password-field"><input type={visible ? 'text' : 'password'} bind:value={password} minlength="6" required autocomplete="off" placeholder="Minimal 6 karakter" /><button type="button" class="icon-button" onclick={() => visible = !visible} aria-label={visible ? 'Sembunyikan password' : 'Lihat password'}>{#if visible}<EyeOff size={19} />{:else}<Eye size={19} />{/if}</button></div></label><label class="checkbox-label"><input type="checkbox" bind:checked={fail} /> Simulasikan gagal masuk</label>{#if error}<p class="field-error" role="alert">{error}</p>{/if}<button class="button full" disabled={busy} type="submit">{busy ? 'Memproses…' : 'Masuk demo operator'}<ArrowRight size={18} /></button><small>Tidak ada registrasi publik. Akun resmi akan disiapkan pada fase backend.</small></form></main></div>
