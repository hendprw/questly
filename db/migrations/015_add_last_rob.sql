-- Menambahkan kolom last_rob untuk sistem pencurian

ALTER TABLE characters ADD COLUMN last_rob INTEGER NOT NULL DEFAULT 0;
