<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowLeft, ArrowRight, Eye, EyeOff } from '@lucide/svelte';
  import Meta from '$lib/components/Meta.svelte';

  let email = $state('');
  let password = $state('');
  let visible = $state(false);
  let busy = $state(false);
  let error = $state('');
  let fields = $state<Record<string, string>>({});

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;

    busy = true;
    error = '';
    fields = {};

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        // Pesan dari server dipakai apa adanya; jangan diubah menjadi sukses.
        error = body?.error?.message ?? 'Tidak dapat masuk. Coba lagi.';
        fields = body?.error?.fields ?? {};
        password = '';
        return;
      }

      // Sesi asli dibuat lewat cookie oleh server. Tidak ada tanda simulasi
      // yang perlu dibersihkan karena alur demo sudah dihapus.
      password = '';
      await goto('/admin');
    } catch {
      error = 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.';
    } finally {
      busy = false;
    }
  }
</script>

<Meta title="Masuk Operator" />

<div class="login-page">
  <div class="login-story">
    <a href="/" class="brand">
      <img src="/logo.png" alt="Lambang Kabupaten Sigi" width="43" height="63" />
      <span><strong>SOULOWE</strong><small>Pemerintah Desa</small></span>
    </a>
    <div>
      <span class="eyebrow light">Ruang operator desa</span>
      <h1>Informasi yang baik dimulai dari pengelolaan yang baik.</h1>
      <p>Kelola kabar, dokumentasi, dan data desa dalam satu ruang kerja.</p>
    </div>
    <small>Desa Soulowe · Kecamatan Sigi Kota · Kabupaten Sigi</small>
  </div>

  <main class="login-form-wrap">
    <a href="/" class="text-link"><ArrowLeft size={16} /> Kembali ke website</a>

    <form onsubmit={submit} novalidate>
      <span class="eyebrow">Panel admin</span>
      <h2>Selamat datang kembali.</h2>
      <p>Masuk ke ruang kerja operator Desa Soulowe.</p>

      <label>
        Email
        <input
          type="email"
          bind:value={email}
          placeholder="operator@desasoulowe.id"
          required
          autocomplete="username"
          aria-invalid={fields.email ? 'true' : undefined}
        />
        {#if fields.email}<small class="field-error">{fields.email}</small>{/if}
      </label>
      <label>
        Password
        <div class="password-field">
          <input
            type={visible ? 'text' : 'password'}
            bind:value={password}
            required
            autocomplete="current-password"
            placeholder="Password akun operator"
            aria-invalid={fields.password ? 'true' : undefined}
          />
          <button
            type="button"
            class="icon-button"
            onclick={() => (visible = !visible)}
            aria-label={visible ? 'Sembunyikan password' : 'Lihat password'}
          >
            {#if visible}<EyeOff size={19} />{:else}<Eye size={19} />{/if}
          </button>
        </div>
        {#if fields.password}<small class="field-error">{fields.password}</small>{/if}
      </label>

      {#if error}
        <p class="login-error" role="alert">{error}</p>
      {/if}

      <button class="button full" disabled={busy} type="submit">
        {busy ? 'Memproses…' : 'Masuk'}
        <ArrowRight size={18} />
      </button>

      <small>Tidak ada registrasi publik. Akun operator dibuat oleh pengelola website.</small>
    </form>
  </main>
</div>
