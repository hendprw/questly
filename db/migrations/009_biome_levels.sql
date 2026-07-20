-- 009_biome_levels.sql
-- Menambahkan syarat level minimal untuk memasuki sebuah biome

ALTER TABLE biomes ADD COLUMN min_level INTEGER NOT NULL DEFAULT 1;
