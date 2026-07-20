CREATE TABLE IF NOT EXISTS group_settings (
    group_id TEXT PRIMARY KEY,
    anti_link INTEGER DEFAULT 0,
    anti_toxic INTEGER DEFAULT 0,
    anti_spam INTEGER DEFAULT 0,
    welcome_message TEXT,
    goodbye_message TEXT,
    is_locked INTEGER DEFAULT 0
);
