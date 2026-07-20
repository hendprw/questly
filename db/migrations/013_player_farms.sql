-- 013_player_farms.sql

CREATE TABLE IF NOT EXISTS player_farms (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id       INTEGER NOT NULL,
  plant_code    TEXT,       -- The itemCode of what is planted (e.g. 'wheat')
  planted_at    INTEGER,
  last_water_at INTEGER,
  is_withered   INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, slot_id)
);
