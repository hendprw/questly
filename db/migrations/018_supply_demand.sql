CREATE TABLE IF NOT EXISTS shop_supply (
    item_code TEXT PRIMARY KEY,
    sold_count INTEGER NOT NULL DEFAULT 0,
    last_updated INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
