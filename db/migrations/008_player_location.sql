-- 008_player_location.sql
-- Menambahkan kolom lokasi (biome saat ini) ke karakter

ALTER TABLE characters ADD COLUMN location TEXT NOT NULL DEFAULT 'Ibu Kota';
