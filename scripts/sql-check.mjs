import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Static checks for the Supabase SQL. There is no Postgres in this environment,
// so this catches structural mistakes that would waste a migration run: a
// missing table, a policy on a table that does not exist, a column that is
// never defined, or an ON CONFLICT clause without a matching unique index.
// It is not a substitute for running the SQL.

const schema = readFileSync('supabase/migrations/20261125120000_schema.sql', 'utf8');
const rls = readFileSync('supabase/migrations/20261125120100_rls.sql', 'utf8');
const seed = readFileSync('supabase/seed.sql', 'utf8');
const checks = [];

const tables = new Set([...schema.matchAll(/create table public\.(\w+)/g)].map(m => m[1]));
const rlsTables = [...rls.matchAll(/create table public\.(\w+)/g)].map(m => m[1]);
for (const t of rlsTables) tables.add(t);

// 1. Every table referenced by a policy or a seed insert must be created.
// The loop builds most policies dynamically, so the static targets are the
// tables named explicitly in `alter table ... enable row level security`.
const policyTargets = new Set(
  [...rls.matchAll(/alter table public\.(\w+) enable row level security/g)].map(m => m[1])
);
for (const t of policyTargets) {
  assert(tables.has(t), `RLS references table "${t}" which is never created`);
}

// 2. The dynamic policy loop must cover exactly the content tables, and
//    admin_users must stay out of it (it is service-role only).
const listed = rls.match(/content_tables text\[\] := array\[([\s\S]*?)\];/)[1];
const contentTables = [...listed.matchAll(/'(\w+)'/g)].map(m => m[1]);
assert(!contentTables.includes('admin_users'), 'admin_users must not get public policies');
const expected = [...tables].filter(t => t !== 'admin_users');
for (const t of expected) {
  assert(contentTables.includes(t), `table "${t}" has no RLS policy`);
}
assert.equal(contentTables.length, expected.length, 'content_tables has extra entries');
checks.push(`policy loop covers ${contentTables.length} tables, admin_users excluded`);

// 3. ON CONFLICT targets need a unique index or constraint on those columns.
const uniques = [...schema.matchAll(/create unique index \w+\s+on public\.(\w+) \(([^)]+)\)/g)]
  .map(m => ({ table: m[1], cols: m[2].split(',').map(c => c.trim().split(/\s+/)[0]) }));
// Inline table constraints count too: `unique (a, b)` inside create table.
for (const m of schema.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)) {
  for (const u of m[2].matchAll(/unique \(([^)]+)\)/g)) {
    uniques.push({ table: m[1], cols: u[1].split(',').map(c => c.trim()) });
  }
}
uniques.push({ table: 'news', cols: ['slug'] }, { table: 'gallery_albums', cols: ['slug'] },
  { table: 'media_assets', cols: ['storage_path'] });
const pks = [...schema.matchAll(/create table public\.(\w+) \(\s*\n\s*id\s+uuid primary key/g)].map(m => m[1]);

const conflicts = [...seed.matchAll(/on conflict \(([^)]+)\)/g)].map(m => m[1].split(',').map(c => c.trim()));
for (const cols of conflicts) {
  const covered = uniques.some(u => cols.every(c => u.cols.includes(c)) && cols.length === u.cols.length)
    || pks.some(() => cols.length === 1 && cols[0] === 'id');
  assert(covered, `ON CONFLICT (${cols.join(', ')}) has no matching unique index`);
}
checks.push(`${conflicts.length} ON CONFLICT clauses all backed by a unique index`);

// 4. Every column named in a seed insert must exist in that table.
const columnLists = {};
for (const m of schema.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)) {
  const cols = [...m[2].matchAll(/^\s{2}(\w+)\s+/gm)].map(c => c[1]);
  columnLists[m[1]] = new Set(cols);
}
const inserts = [...seed.matchAll(/insert into public\.(\w+) \(([^)]+)\)/g)];
for (const m of inserts) {
  const table = m[1];
  const cols = m[2].split(',').map(c => c.trim());
  for (const col of cols) {
    assert(columnLists[table]?.has(col), `seed inserts ${table}.${col} which does not exist`);
  }
}
checks.push(`${inserts.length} seed inserts reference only defined columns`);

// 5. Values that must stay null must not be written as 0.
assert(!/Pendapatan Asli Desa',\s*0/.test(seed), 'a null income row was seeded as 0');
assert(/Pendapatan Asli Desa',\s*null/.test(seed), 'Pendapatan Asli Desa should be null, not 0');
checks.push('unavailable financial values stay null, never 0');

// 6. The MVP year lock and the "no derived totals" rule must survive.
assert(/statistics_year_mvp check \(year = 2026\)/.test(schema), 'statistics year is not locked to 2026');
assert(/financial_data_year_mvp check \(year = 2026\)/.test(schema), 'finance year is not locked to 2026');
// Check column names only: the comment explaining the rule mentions the words.
const allColumns = Object.values(columnLists).flatMap(set => [...set]);
const derived = allColumns.filter(c => /surplus|defisit|total_belanja|balance/i.test(c));
assert.deepEqual(derived, [], `derived total columns found: ${derived.join(', ')}`);
checks.push('year locked to 2026, no derived total columns');

// 7. No draft/approval workflow on news or albums (PRD: publish immediately).
const workflow = allColumns.filter(c => /^(draft|is_draft|approval|approved|is_hidden|hidden|status)$/.test(c));
assert.deepEqual(workflow, [], `draft/approval columns found: ${workflow.join(', ')}`);
checks.push('no draft or approval columns on news and albums');

// 8. Service role must never be granted to the browser.
assert(!/service_role/i.test(rls), 'RLS file must not reference the service role key');
assert(/revoke all on function public\.is_operator\(\) from public/.test(rls), 'is_operator must not be callable by public role');
checks.push('service role absent from policies, is_operator locked down');

// 8b. RLS alone does not grant access: the roles also need table privileges.
// Without GRANT, anon gets "permission denied" before any policy is evaluated.
const grants = readFileSync('supabase/migrations/20261126120000_grants.sql', 'utf8');
assert(/grant select on public\.%I to anon/.test(grants), 'anon SELECT grant missing for content tables');
assert(/grant select, insert, update, delete on public\.%I to authenticated/.test(grants), 'authenticated grants missing');
assert(/revoke all on public\.admin_users from anon, authenticated/.test(grants), 'admin_users must be revoked from clients');
checks.push('table grants present for anon (read) and authenticated (write), admin_users revoked');

// 9. Storage bucket limits match the 5 MB and format rules.
assert(/5 \* 1024 \* 1024/.test(rls), 'storage file size limit missing');
assert(/array\['image\/jpeg', 'image\/png', 'image\/webp'\]/.test(rls), 'storage mime whitelist missing');
checks.push('storage bucket: 5 MB limit and JPG/PNG/WebP whitelist');

// 10. The migration must be ordered so the RLS file can reference the tables.
assert(schema.includes('create table public.media_assets'), 'media_assets missing from schema');
checks.push(`schema defines ${tables.size} tables`);

// 11. supabase/rls-roles.sql menukar peran database. Dua kesalahan di file itu
//     tidak akan terlihat sampai dijalankan di Supabase, jadi diperiksa di sini.
const roles = readFileSync('supabase/rls-roles.sql', 'utf8');

// Komentar dibuang lebih dulu: penjelasan di dalamnya menyebut "SET LOCAL ROLE"
// dan akan salah dihitung sebagai perintah sungguhan.
const rolesCode = roles
  .split(/\r?\n/)
  .map(line => line.replace(/--.*$/, ''))
  .join('\n');

// 11a. Dollar-quote harus seimbang, kalau tidak seluruh file gagal di-parse.
const dollarQuotes = (rolesCode.match(/\$[a-z_]*\$/g) ?? []).length;
assert(dollarQuotes % 2 === 0, `rls-roles.sql has an unbalanced dollar-quote (${dollarQuotes} found)`);

// 11b. Setiap "set role" harus punya "reset role" pasangannya. Batas kata
//      diperlukan karena "reset role" mengandung teks "set role". Hanya isi blok
//      DO yang dihitung: di luar blok ada satu "reset role" tambahan sebagai
//      jaring pengaman, yang memang tidak berpasangan.
const doBlock = rolesCode.split('$outer$')[1] ?? '';
assert(doBlock.length > 0, 'rls-roles.sql has no $outer$ block');
const switches = (doBlock.match(/(?<![a-z])set (local )?role/gi) ?? []).length;
const resets = (doBlock.match(/(?<![a-z])reset role/gi) ?? []).length;
assert.equal(switches, resets, `rls-roles.sql: ${switches} role switches but ${resets} resets inside the DO block`);

// 11c. SET LOCAL ROLE hanya berlaku di dalam transaksi. SQL Editor belum tentu
//      membungkus query dalam transaksi, dan kalau tidak berlaku semua uji akan
//      berjalan sebagai pemilik tabel lalu lulus palsu. Harus SET ROLE biasa.
assert(
  !/set local role/i.test(rolesCode),
  'rls-roles.sql uses SET LOCAL ROLE, which silently does nothing outside a transaction'
);

// 11c. Yang paling mudah salah: menulis hasil saat peran masih ditukar. Peran
//      anon/authenticated tidak punya izin ke tabel hasil, jadi insert seperti
//      itu gagal dan seluruh skrip berhenti. Hasil harus ditampung dulu, lalu
//      ditulis setelah peran dikembalikan.
let roleDepth = 0;
let lineNo = 0;
for (const line of doBlock.split(/\r?\n/)) {
  lineNo++;
  if (/(?<![a-z])set (local )?role/i.test(line)) roleDepth++;
  if (/(?<![a-z])reset role/i.test(line)) roleDepth--;
  if (roleDepth > 0 && /insert into rls_results/i.test(line)) {
    assert.fail(
      `rls-roles.sql line ${lineNo}: writes to rls_results while the role is still switched; ` +
      'collect the result first, then insert after "reset role"'
    );
  }
}
assert.equal(roleDepth, 0, 'rls-roles.sql ends with a role still switched');
checks.push('rls-roles.sql: balanced quotes, paired role switches, no writes under a switched role');

console.log(`PASS: ${checks.length} SQL structural checks.`);
for (const c of checks) console.log(`  - ${c}`);
