PRAGMA foreign_keys = ON;

ALTER TABLE characters ADD COLUMN stamina INTEGER NOT NULL DEFAULT 100;
ALTER TABLE characters ADD COLUMN max_stamina INTEGER NOT NULL DEFAULT 100;
ALTER TABLE characters ADD COLUMN last_stamina_regen INTEGER NOT NULL DEFAULT (strftime('%s','now'));
