-- Menambahkan skor kepahlawanan dan status hero

ALTER TABLE characters ADD COLUMN hero_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE characters ADD COLUMN is_hero INTEGER NOT NULL DEFAULT 0;

-- Tabel untuk menyimpan status global (kapan terakhir reset pahlawan)
CREATE TABLE IF NOT EXISTS system_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO system_state (key, value) VALUES ('last_hero_reset_month', '0');
