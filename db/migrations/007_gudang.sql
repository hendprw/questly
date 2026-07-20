-- 007_gudang.sql
-- Menambahkan sistem gudang (Storage) dengan membedakan lokasi item pada tabel inventory.
-- Menambahkan kapasitas gudang ke tabel characters.

ALTER TABLE inventory ADD COLUMN location TEXT NOT NULL DEFAULT 'bag';

ALTER TABLE characters ADD COLUMN gudang_weight INTEGER NOT NULL DEFAULT 0;
ALTER TABLE characters ADD COLUMN max_gudang_weight INTEGER NOT NULL DEFAULT 1000;
