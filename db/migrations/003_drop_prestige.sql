-- 003_drop_prestige.sql
-- ────────────────────────────────────────────────────────────────────────
-- Menghapus kolom `prestige` dari tabel `leveling`. Kolom ini disiapkan di
-- 001_init.sql sebagai placeholder untuk fitur "prestige" (reset level demi
-- bonus permanen), tapi tidak pernah punya mekanisme apapun — tidak ada
-- satupun kode yang menambah nilainya, jadi selalu 0 untuk semua user.
--
-- Dihapus dulu supaya tidak menampilkan angka yang membingungkan (0 terus).
-- Kalau sistem prestige beneran mau dibangun nanti, tinggal tambah migration
-- baru (004_add_prestige.sql) dengan kolom + logic resetnya sekalian.
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE leveling DROP COLUMN prestige;