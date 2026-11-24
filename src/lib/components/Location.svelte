<script lang="ts">
  import { onMount } from 'svelte';
  import { MapPin, ArrowUpRight } from '@lucide/svelte';
  import { village } from '$lib/content/desa';
  import 'leaflet/dist/leaflet.css';

  let mapElement = $state<HTMLDivElement>();
  let mapStatus = $state<'loading' | 'ready' | 'error'>('loading');
  let failedTiles = $state(false);

  onMount(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    if (village.mapVerified && village.mapCoordinates && mapElement) {
      import('leaflet').then(L => {
        if (cancelled || !mapElement) return;
        const coordinates = village.mapCoordinates!;
        const map = L.map(mapElement, { scrollWheelZoom: false }).setView(coordinates, 17);
        // Register cleanup immediately, including if later initialization fails.
        const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        resize.observe(mapElement);
        dispose = () => { resize.disconnect(); map.remove(); };
        const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
        tiles.on('tileerror', () => { if (!cancelled) failedTiles = true; });
        tiles.on('tileload', () => { if (!cancelled) failedTiles = false; });
        tiles.addTo(map);
        const pin = L.divIcon({
          className: 'office-map-pin',
          html: '<span aria-hidden="true"></span>',
          iconSize: [30, 38], iconAnchor: [15, 38], popupAnchor: [0, -38]
        });
        const popup = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = 'Kantor Desa Soulowe';
        const address = document.createElement('p');
        address.textContent = village.address;
        popup.append(name, address);
        L.marker(coordinates, { icon: pin, title: 'Kantor Desa Soulowe', alt: 'Pin Kantor Desa Soulowe', keyboard: true })
          .addTo(map).bindPopup(popup).openPopup();
        mapStatus = 'ready';
      }).catch(() => { if (!cancelled) { dispose?.(); dispose = undefined; mapStatus = 'error'; } });
    }
    return () => { cancelled = true; dispose?.(); };
  });
</script>

{#if village.mapVerified && village.mapCoordinates}
  <div class="office-map">
    <div class="office-map-canvas">
      <div bind:this={mapElement} class="map-live" role="region" aria-label="Peta lokasi Kantor Desa Soulowe"></div>
      {#if mapStatus !== 'ready'}
        <div class="map-status" role="status"><MapPin size={26} /><span>{mapStatus === 'error' ? 'Peta belum dapat dimuat. Gunakan tautan Google Maps di bawah.' : 'Menyiapkan peta lokasi kantor…'}</span></div>
      {/if}
    </div>
    {#if failedTiles}<p class="map-tile-error" role="status">Sebagian peta belum berhasil dimuat. Periksa koneksi atau buka lokasi di Google Maps.</p>{/if}
    <div class="office-map-footer"><div><strong>Kantor Desa Soulowe</strong><small>{village.address}</small></div><a href={village.mapsUrl} target="_blank" rel="noreferrer">Buka Google Maps <ArrowUpRight size={16} /></a></div>
    <noscript><p class="map-tile-error">Aktifkan JavaScript untuk peta interaktif, atau gunakan tautan Google Maps di atas.</p></noscript>
  </div>
{:else}
  <div class="map-fallback"><MapPin size={34} strokeWidth={1.5} /><span class="eyebrow">Lokasi kantor desa</span><h3>Temui kami di Soulowe.</h3><p>{village.address}<br />Kecamatan Sigi Kota, Kabupaten Sigi</p><a class="button secondary" href={village.mapsUrl} target="_blank" rel="noreferrer">Buka di Google Maps <ArrowUpRight size={17} /></a><small>Pin kantor menunggu verifikasi. Tautan membuka pencarian alamat, bukan koordinat pasti.</small></div>
{/if}
