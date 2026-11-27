// Menampilkan nilai yang benar-benar diterima skrip uji, tanpa membocorkan
// password. Dipakai saat login ditolak padahal kredensial dirasa sudah benar:
// hampir selalu penyebabnya karakter tak terlihat yang ikut terbawa dari shell.
//
// Jalankan:
//   set "OPERATOR_EMAIL=email-anda"
//   set "OPERATOR_PASSWORD=password-anda"
//   bun scripts/check-credentials.mjs

const email = process.env.OPERATOR_EMAIL ?? '';
const password = process.env.OPERATOR_PASSWORD ?? '';

function describe(label, value) {
  const trailing = value.length - value.trimEnd().length;
  const leading = value.length - value.trimStart().length;
  const quotes = /^["']|["']$/.test(value);

  console.log(`${label}:`);
  console.log(`  panjang      : ${value.length}`);
  console.log(`  spasi di akhir: ${trailing}${trailing ? '  <-- INI PENYEBABNYA' : ''}`);
  console.log(`  spasi di awal : ${leading}${leading ? '  <-- INI PENYEBABNYA' : ''}`);
  console.log(`  terbungkus kutip: ${quotes ? 'ya  <-- INI PENYEBABNYA' : 'tidak'}`);
}

if (!email || !password) {
  console.error('OPERATOR_EMAIL / OPERATOR_PASSWORD belum terbaca sama sekali.');
  process.exit(1);
}

describe('OPERATOR_EMAIL', email);
describe('OPERATOR_PASSWORD', password);

console.log(`\nemail yang terbaca: ${JSON.stringify(email)}`);

const problems = [email, password].some(
  value => value !== value.trim() || /^["']|["']$/.test(value)
);

if (problems) {
  console.log('\nKESIMPULAN: ada karakter nyasar. Jalankan ulang dengan bentuk ber-kutip:');
  console.log('  set "OPERATOR_EMAIL=email-anda"');
  console.log('  set "OPERATOR_PASSWORD=password-anda"');
  console.log('Perhatikan: tanpa spasi sebelum tanda kutip penutup.');
  process.exit(1);
}

console.log('\nKESIMPULAN: nilai bersih, tidak ada karakter nyasar.');
