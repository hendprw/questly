DROP TABLE IF EXISTS user_jobs;
DROP TABLE IF EXISTS jobs;

CREATE TABLE IF NOT EXISTS daily_quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_assigned TEXT NOT NULL, 
    quest_type TEXT NOT NULL,    
    target_code TEXT NOT NULL,   
    required_amount INTEGER NOT NULL,
    current_amount INTEGER NOT NULL DEFAULT 0,
    reward_aester INTEGER NOT NULL DEFAULT 0,
    reward_xp INTEGER NOT NULL DEFAULT 0,
    reward_tokens INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0,
    is_claimed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quests_user_date ON daily_quests(user_id, date_assigned);

INSERT OR IGNORE INTO currencies (code, name, symbol, is_active) VALUES ('tokens', 'Adventurer Tokens', '🪙', 1);

ALTER TABLE wallets ADD COLUMN tokens INTEGER NOT NULL DEFAULT 0;
