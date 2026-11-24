export const number = (value: number | null | undefined) => value == null ? '-' : new Intl.NumberFormat('id-ID').format(value);
export const rupiah = (value: number | null | undefined) => value == null ? '-' : `Rp${number(value)}`;
export const date = (value?: string) => value ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : '-';
export const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
export const whatsapp = (phone: string, message: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(message)}`;
export const uploadError = (file: File): string | null => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) return 'Gunakan gambar JPG, JPEG, PNG, atau WebP.';
  if (file.size > 5 * 1024 * 1024) return 'Ukuran gambar maksimal 5 MB per file.';
  return null;
};
