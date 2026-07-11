-- ════════════════════════════════════════════════════════════════════════
-- 001_init.sql — base schema for the RPG economy/leveling bot
--
-- Design goals (kenapa strukturnya seperti ini):
--  1. `users` cuma berisi IDENTITAS. Semua data gameplay (saldo, level,
--     stats, dst) dipisah ke tabel masing-masing yang FK ke users(id).
--     Ini bikin tiap subsistem bisa berkembang sendiri-sendiri tanpa
--     harus ALTER TABLE users berkali-kali.
--  2. Tabel EAV (`user_stats`, `user_settings`) dipakai untuk data yang
--     jumlah/jenisnya akan terus nambah (stat RPG baru, flag/preferensi
--     baru) — nambah baris, bukan nambah kolom.
--  3. Kolom `metadata` (JSON as TEXT) ada di hampir semua tabel utama
--     sebagai "escape hatch" — kalau butuh nambah properti kecil, taruh
--     di situ dulu, gak perlu migration baru.
--  4. `transactions` adalah ledger — SETIAP perubahan saldo dicatat.
--     Ini wajib untuk bot economy: buat audit, debug "kok saldo saya
--     salah", dan basis buat fitur pajak/leaderboard-kekayaan nanti.
--  5. Semua timestamp disimpan sebagai unix seconds (INTEGER) biar
--     konsisten dengan konvensi WhatsApp (`rawMessage.messageTimestamp`).
-- ════════════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ── Identitas user ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  jid             TEXT NOT NULL UNIQUE,        -- sender JID mentah dari Botify (ctx.sender)
  phone_number    TEXT UNIQUE,                 -- nomor tanpa @domain, kalau kebaca (ctx.senderNumber)
  push_name       TEXT,                        -- nama WA terakhir yang tercatat
  display_name    TEXT,                        -- nama in-game custom (opsional, unik kalau diisi)
  bio             TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  locale          TEXT NOT NULL DEFAULT 'id',
  timezone        TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  status          TEXT NOT NULL DEFAULT 'active',   -- active | banned | muted | frozen
  ban_reason      TEXT,
  banned_until    INTEGER,                     -- NULL = permanen / tidak banned
  is_game_admin   INTEGER NOT NULL DEFAULT 0,  -- admin in-game (beda dari owner bot Botify)
  registered_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  last_seen_at    INTEGER,
  metadata        TEXT NOT NULL DEFAULT '{}',  -- escape hatch (JSON)
  CHECK (status IN ('active','banned','muted','frozen'))
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- ── Dompet / ekonomi inti ─────────────────────────────────────────────
-- cash/bank/gems dipisah kolom karena punya semantik & mekanik unik
-- (bank punya kapasitas & bisa "dirampok" saat cash, gems = premium).
CREATE TABLE IF NOT EXISTS wallets (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cash           INTEGER NOT NULL DEFAULT 0,
  bank           INTEGER NOT NULL DEFAULT 0,
  bank_capacity  INTEGER NOT NULL DEFAULT 5000,
  debt           INTEGER NOT NULL DEFAULT 0,
  gems           INTEGER NOT NULL DEFAULT 0,   -- premium/secondary currency
  updated_at     INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  CHECK (cash >= 0 AND bank >= 0 AND gems >= 0)
);

-- Currency generik untuk mata uang event/musiman di masa depan
-- (mis. "coin_natal", "token_arena") tanpa perlu nambah kolom wallet lagi.
CREATE TABLE IF NOT EXISTS currencies (
  code       TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  symbol     TEXT NOT NULL DEFAULT '',
  is_active  INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS user_currencies (
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency_code  TEXT NOT NULL REFERENCES currencies(code),
  amount         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, currency_code)
);

-- Ledger — HARUS diisi setiap kali saldo berubah lewat repo/economy.js
CREATE TABLE IF NOT EXISTS transactions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,             -- 'daily','work','shop_buy','shop_sell','transfer_in','transfer_out','admin_adjust','bank_deposit','bank_withdraw', dst
  currency          TEXT NOT NULL DEFAULT 'cash',
  amount            INTEGER NOT NULL,          -- boleh negatif
  balance_after     INTEGER NOT NULL,
  related_user_id   INTEGER REFERENCES users(id),  -- untuk transfer antar user
  note              TEXT,
  created_at        INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON transactions(user_id, created_at);

-- ── Leveling ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leveling (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level         INTEGER NOT NULL DEFAULT 1,
  xp            INTEGER NOT NULL DEFAULT 0,   -- xp di dalam level saat ini
  total_xp      INTEGER NOT NULL DEFAULT 0,   -- xp seumur hidup (leaderboard/prestige)
  prestige      INTEGER NOT NULL DEFAULT 0,
  skill_points  INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Stat RPG (EAV) — nambah stat baru = INSERT baris, bukan ALTER TABLE.
CREATE TABLE IF NOT EXISTS user_stats (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stat_key  TEXT NOT NULL,     -- 'strength','intelligence','luck','stamina','charisma', ...
  value     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, stat_key)
);

-- Lembar karakter (HP/MP/energy) — dipisah dari leveling karena siklus
-- hidupnya beda (regen per waktu, dipakai combat/quest, dst).
CREATE TABLE IF NOT EXISTS characters (
  user_id               INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  class                 TEXT,       -- 'warrior','mage','archer', NULL = belum pilih
  race                  TEXT,
  hp                    INTEGER NOT NULL DEFAULT 100,
  max_hp                INTEGER NOT NULL DEFAULT 100,
  mp                    INTEGER NOT NULL DEFAULT 50,
  max_mp                INTEGER NOT NULL DEFAULT 50,
  energy                INTEGER NOT NULL DEFAULT 100,
  max_energy            INTEGER NOT NULL DEFAULT 100,
  last_energy_regen_at  INTEGER
);

-- ── Pekerjaan (job system) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  code              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT,
  min_level         INTEGER NOT NULL DEFAULT 1,
  base_pay_min      INTEGER NOT NULL DEFAULT 100,
  base_pay_max      INTEGER NOT NULL DEFAULT 500,
  base_xp           INTEGER NOT NULL DEFAULT 10,
  cooldown_seconds  INTEGER NOT NULL DEFAULT 3600,
  metadata          TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS user_jobs (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  job_id        INTEGER REFERENCES jobs(id),
  job_level     INTEGER NOT NULL DEFAULT 1,
  job_xp        INTEGER NOT NULL DEFAULT 0,
  hired_at      INTEGER,
  last_work_at  INTEGER
);

-- ── Item & inventory ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL UNIQUE,        -- id programatik stabil, mis. 'wood_sword'
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'misc', -- weapon|armor|consumable|material|quest|collectible|misc
  rarity       TEXT NOT NULL DEFAULT 'common', -- common|uncommon|rare|epic|legendary|mythic
  equip_slot   TEXT,                        -- 'weapon','head','body','legs','accessory', NULL = tidak bisa dipakai
  buy_price    INTEGER,                     -- NULL = tidak dijual di shop
  sell_price   INTEGER NOT NULL DEFAULT 0,
  stackable    INTEGER NOT NULL DEFAULT 1,
  max_stack    INTEGER NOT NULL DEFAULT 99,
  tradeable    INTEGER NOT NULL DEFAULT 1,
  metadata     TEXT NOT NULL DEFAULT '{}',  -- bonus stat, durability_max, efek pakai, dll (JSON)
  created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS inventory (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id            INTEGER NOT NULL REFERENCES items(id),
  quantity           INTEGER NOT NULL DEFAULT 1,
  durability         INTEGER,              -- NULL = tidak berlaku untuk item ini
  is_equipped        INTEGER NOT NULL DEFAULT 0,
  acquired_at        INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  instance_metadata  TEXT NOT NULL DEFAULT '{}'  -- enchant, nama custom, dll per-instance
);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_item ON inventory(user_id, item_id);

CREATE TABLE IF NOT EXISTS equipment (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot          TEXT NOT NULL,
  inventory_id  INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, slot)
);

-- ── Guild / clan ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guilds (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  leader_id     INTEGER REFERENCES users(id),
  level         INTEGER NOT NULL DEFAULT 1,
  xp            INTEGER NOT NULL DEFAULT 0,
  bank_balance  INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  metadata      TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS guild_members (
  guild_id   INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',  -- leader|officer|member
  joined_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (guild_id, user_id)
);

-- ── Quest & achievement ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL DEFAULT 'daily',  -- daily|weekly|story|event|repeatable
  requirements  TEXT NOT NULL DEFAULT '{}',     -- JSON
  rewards       TEXT NOT NULL DEFAULT '{}',     -- JSON {xp, cash, items:[...]}
  is_active     INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS user_quests (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id      INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'in_progress', -- in_progress|completed|claimed|failed
  progress      TEXT NOT NULL DEFAULT '{}',
  started_at    INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  completed_at  INTEGER,
  claimed_at    INTEGER,
  PRIMARY KEY (user_id, quest_id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  rewards      TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id  INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at     INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (user_id, achievement_id)
);

-- ── Pets / companion (opsional, disiapkan dari awal) ───────────────────
CREATE TABLE IF NOT EXISTS pets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species       TEXT NOT NULL,
  nickname      TEXT,
  level         INTEGER NOT NULL DEFAULT 1,
  xp            INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 0,
  acquired_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  metadata      TEXT NOT NULL DEFAULT '{}'
);

-- ── Cooldown persisten (bertahan walau bot restart) ─────────────────────
CREATE TABLE IF NOT EXISTS cooldowns (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_key  TEXT NOT NULL,      -- 'daily','work','rob','hunt', dst
  expires_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, action_key)
);

-- ── Preferensi/flag per-user bebas format (escape hatch) ────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key      TEXT NOT NULL,
  value    TEXT NOT NULL,   -- JSON-encoded
  PRIMARY KEY (user_id, key)
);
