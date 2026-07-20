-- Tabel untuk menyimpan pengaturan bahasa (i18n) per grup WhatsApp
CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    language TEXT NOT NULL DEFAULT 'id'
);
