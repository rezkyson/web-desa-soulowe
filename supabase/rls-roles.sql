-- BE-26: membuktikan RLS bekerja untuk tiga peran.
--
--   anon          : pengunjung tanpa login
--   authenticated : akun login yang TIDAK terdaftar di admin_users
--   authenticated : akun operator yang terdaftar
--
-- Yang diuji adalah database itu sendiri, bukan endpoint aplikasi. Endpoint bisa
-- menolak lebih dulu karena kode, sehingga RLS tidak pernah dievaluasi.
--
-- Cara kerja:
--   Satu blok DO berjalan sebagai Anda. Peran ditukar dengan SET ROLE, diuji,
--   lalu dikembalikan dengan RESET ROLE. SET ROLE dipakai, bukan SET LOCAL,
--   karena SET LOCAL hanya berlaku di dalam transaksi dan SQL Editor belum tentu
--   membungkus query dalam transaksi; kalau tidak berlaku, semua uji akan
--   berjalan sebagai pemilik tabel dan lulus palsu.
--
--   Hasil setiap uji ditampung di variabel lebih dulu, lalu ditulis ke tabel
--   hasil SETELAH peran dikembalikan. Ini penting: peran anon/authenticated
--   tidak punya izin menulis ke tabel hasil, jadi menulisnya saat peran masih
--   ditukar akan gagal.
--
--   Setiap operasi tulis dijalankan sungguhan, lalu SELALU dibatalkan dengan
--   RAISE. Jadi tidak ada baris uji yang tertinggal, bahkan kalau RLS ternyata
--   bocor dan tulisan diterima.
--
--   Kode error ikut dicatat, karena bedanya penting:
--     42501 + "row-level security"  -> ditolak RLS (yang kita inginkan)
--     42501 + "permission denied"   -> ditolak GRANT, RLS belum sempat menilai
--
-- Aman dijalankan berulang. Tidak meninggalkan data.
--
-- Tempel SELURUH isi file ini di SQL Editor, lalu Run sekali.

drop table if exists rls_results;

create temp table rls_results (
  urutan      integer,
  pemeriksaan text,
  hasil       text
);

do $outer$
declare
  v_uid        uuid;
  v_n          bigint;
  v_affected   bigint;
  v_role       text;
  v_switch_err text := '';

  r0  text := '';
  r1  text; r2  text; r3  text; r4  text;
  r5  text; r6  text; r7  text; r8  text;
  r9  text; r10 text; r11 text; r12 text;
begin
  -- Pastikan peran bisa ditukar. Kalau tidak, lebih baik berhenti dengan pesan
  -- jelas daripada melaporkan hasil yang menyesatkan.
  begin
    execute 'set role anon';
    execute 'reset role';
  exception when others then
    v_switch_err := sqlerrm;
  end;

  if v_switch_err <> '' then
    insert into rls_results values (
      0, 'bisa menukar peran',
      'BELUM: ' || v_switch_err || ' (jalankan sebagai postgres di SQL Editor)'
    );
    return;
  end if;

  -- =========================================================================
  -- PERAN 1: anon
  -- =========================================================================

  -- 0. Pastikan peran benar-benar berubah, bukan hanya diterima tanpa efek.
  execute 'set role anon';
  begin
    select current_user into v_role;
    if v_role <> 'anon' then
      r0 := 'GAGAL: peran tetap ' || v_role;
    end if;
  exception when others then
    r0 := 'GAGAL: ' || sqlerrm;
  end;
  execute 'reset role';

  if r0 <> '' then
    insert into rls_results values (0, 'peran anon benar-benar aktif', r0);
    return;
  end if;

  -- 1. Baca konten publik harus berhasil.
  execute 'set role anon';
  begin
    select count(*) into v_n from public.news;
    r1 := 'ok: ' || v_n || ' baris terlihat';
  exception when others then
    r1 := 'GAGAL: ' || sqlstate || ' ' || sqlerrm;
  end;
  execute 'reset role';

  -- 2. Tulis harus ditolak. anon tidak punya GRANT tulis, jadi penolakan datang
  --    dari izin tabel. Hanya 42501 (insufficient_privilege) yang dianggap
  --    penolakan sah; error lain berarti ada masalah berbeda yang perlu dilihat.
  execute 'set role anon';
  begin
    insert into public.news (title, slug, published_on)
    values ('uji anon', 'uji-anon-rls', '2026-01-01');
    raise exception 'batalkan uji' using errcode = 'P0001';
  exception
    when sqlstate 'P0001' then
      r2 := 'GAGAL: insert diterima';
    when sqlstate '42501' then
      r2 := 'ok: ' || sqlerrm;
    when others then
      r2 := 'GAGAL: error tak terduga ' || sqlstate || ' ' || sqlerrm;
  end;
  execute 'reset role';

  -- 3. Daftar operator tidak boleh terbaca.
  execute 'set role anon';
  begin
    select count(*) into v_n from public.admin_users;
    r3 := case when v_n = 0 then 'ok: 0 baris' else 'GAGAL: ' || v_n || ' baris terbaca' end;
  exception when others then
    r3 := 'ok: ' || sqlstate || ' ' || sqlerrm;
  end;
  execute 'reset role';

  -- 4. is_operator harus false, bukan error.
  execute 'set role anon';
  begin
    r4 := case when public.is_operator() then 'GAGAL: true' else 'ok: false' end;
  exception when others then
    r4 := 'GAGAL: ' || sqlstate || ' ' || sqlerrm;
  end;
  execute 'reset role';

  insert into rls_results values (1, 'anon baca berita', r1);
  insert into rls_results values (2, 'anon tolak tulis berita', r2);
  insert into rls_results values (3, 'anon tidak bisa baca admin_users', r3);
  insert into rls_results values (4, 'anon is_operator false', r4);

  -- =========================================================================
  -- PERAN 2: authenticated, bukan operator.
  -- Berbeda dari anon: peran ini PUNYA izin tulis tabel, jadi penolakan wajib
  -- datang dari RLS. Kalau errornya "permission denied" biasa, berarti GRANT
  -- yang bermasalah, bukan RLS yang bekerja.
  --
  -- Klaim JWT dipasang sebagai set_config(..., false), yaitu level sesi, bukan
  -- level transaksi, supaya auth.uid() benar-benar melihatnya.
  -- =========================================================================
  execute 'set role authenticated';
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
    false
  );

  -- 5. Baca tetap boleh.
  begin
    select count(*) into v_n from public.news;
    r5 := 'ok: ' || v_n || ' baris terlihat';
  exception when others then
    r5 := 'GAGAL: ' || sqlstate || ' ' || sqlerrm;
  end;

  -- 6. Insert harus ditolak RLS. Baris uji dibatalkan apa pun hasilnya.
  --    Hanya 42501 yang sah; error lain (misalnya foreign key) berarti uji tidak
  --    membuktikan apa yang dimaksud.
  begin
    insert into public.news (title, slug, published_on)
    values ('uji non-operator', 'uji-nonoperator-rls', '2026-01-01');
    raise exception 'batalkan uji' using errcode = 'P0001';
  exception
    when sqlstate 'P0001' then
      r6 := 'GAGAL: insert diterima';
    when sqlstate '42501' then
      r6 := 'ok: ' || sqlerrm;
    when others then
      r6 := 'GAGAL: error tak terduga ' || sqlstate || ' ' || sqlerrm;
  end;

  -- 7. Update harus menyentuh 0 baris, atau ditolak RLS. Dibatalkan selalu.
  v_affected := -1;
  begin
    update public.news set title = title where true;
    get diagnostics v_affected = row_count;
    raise exception 'batalkan uji' using errcode = 'P0001';
  exception
    when sqlstate 'P0001' then
      r7 := case
        when v_affected = 0 then 'ok: 0 baris terpengaruh'
        else 'GAGAL: ' || v_affected || ' baris berubah'
      end;
    when others then
      r7 := 'ok: ' || sqlstate || ' ' || sqlerrm;
  end;

  -- 8. Delete harus menyentuh 0 baris, atau ditolak RLS. Dibatalkan selalu.
  v_affected := -1;
  begin
    delete from public.news where true;
    get diagnostics v_affected = row_count;
    raise exception 'batalkan uji' using errcode = 'P0001';
  exception
    when sqlstate 'P0001' then
      r8 := case
        when v_affected = 0 then 'ok: 0 baris terpengaruh'
        else 'GAGAL: ' || v_affected || ' baris terhapus'
      end;
    when others then
      r8 := 'ok: ' || sqlstate || ' ' || sqlerrm;
  end;

  -- 9. is_operator harus false untuk akun yang tidak terdaftar. Klaim JWT sudah
  --    dipasang dengan uuid yang tidak ada di admin_users, jadi ini menguji
  --    jalur yang benar: ada uid, tetapi bukan operator.
  begin
    if current_setting('request.jwt.claims', true) = '' then
      r9 := 'GAGAL: klaim JWT tidak terpasang, hasil tidak sah';
    else
      r9 := case when public.is_operator() then 'GAGAL: true' else 'ok: false' end;
    end if;
  exception when others then
    r9 := 'GAGAL: ' || sqlstate || ' ' || sqlerrm;
  end;

  -- 10. Storage: objek media hanya boleh ditulis operator.
  begin
    insert into storage.objects (bucket_id, name) values ('media', 'uji/rls-nonoperator.png');
    raise exception 'batalkan uji' using errcode = 'P0001';
  exception
    when sqlstate 'P0001' then
      r10 := 'GAGAL: insert storage diterima';
    when sqlstate '42501' then
      r10 := 'ok: ' || sqlerrm;
    when others then
      r10 := 'GAGAL: error tak terduga ' || sqlstate || ' ' || sqlerrm;
  end;

  -- Kembalikan peran sebelum menulis hasil.
  execute 'reset role';
  perform set_config('request.jwt.claims', '{}', false);

  insert into rls_results values (5, 'non-operator baca berita', r5);
  insert into rls_results values (6, 'non-operator tolak tulis berita', r6);
  insert into rls_results values (7, 'non-operator tolak ubah berita', r7);
  insert into rls_results values (8, 'non-operator tolak hapus berita', r8);
  insert into rls_results values (9, 'non-operator is_operator false', r9);
  insert into rls_results values (10, 'non-operator tolak tulis media', r10);

  -- =========================================================================
  -- PERAN 3: operator terdaftar. Uji positif: kalau operator pun ditolak,
  -- panel admin tidak akan bisa menyimpan apa pun.
  -- =========================================================================
  select user_id into v_uid from public.admin_users order by created_at limit 1;

  if v_uid is null then
    insert into rls_results values (11, 'operator terdaftar', 'BELUM: admin_users kosong');
  else
    execute 'set role authenticated';
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', v_uid::text, 'role', 'authenticated')::text,
      false
    );

    -- 11. is_operator harus true.
    begin
      r11 := case when public.is_operator() then 'ok: true' else 'GAGAL: false padahal terdaftar' end;
    exception when others then
      r11 := 'GAGAL: ' || sqlstate || ' ' || sqlerrm;
    end;

    -- 12. Insert sungguhan, lalu selalu dibatalkan supaya tidak ada baris uji
    --     yang tertinggal.
    begin
      insert into public.news (title, slug, published_on)
      values ('uji operator', 'uji-operator-rls', '2026-01-01');
      raise exception 'batalkan uji' using errcode = 'P0001';
    exception
      when sqlstate 'P0001' then
        r12 := 'ok: insert diterima, lalu dibatalkan';
      when others then
        r12 := 'GAGAL: ' || sqlstate || ' ' || sqlerrm;
    end;

    execute 'reset role';
    perform set_config('request.jwt.claims', '{}', false);

    insert into rls_results values (11, 'operator is_operator true', r11);
    insert into rls_results values (12, 'operator bisa menulis berita', r12);
  end if;
end;
$outer$;

-- Jaring pengaman: kalau blok di atas berhenti di tengah, sesi tidak ditinggalkan
-- dalam peran anon. Tidak berbahaya kalau peran memang sudah kembali.
reset role;

-- Satu statement saja, karena SQL Editor hanya menampilkan hasil statement
-- terakhir. Kalau detail dan ringkasan dipisah, salah satunya tidak terlihat.
select urutan, pemeriksaan, hasil
from (
  select urutan, pemeriksaan, hasil from rls_results
  union all
  select
    999,
    'RINGKASAN',
    (select count(*) filter (where hasil like 'ok%') from rls_results) || ' lulus, '
      || (select count(*) filter (where hasil not like 'ok%') from rls_results) || ' perlu diperiksa, dari '
      || (select count(*) from rls_results) || ' pemeriksaan'
) as gabungan
order by urutan;
