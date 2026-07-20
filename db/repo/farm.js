/**
 * db/repo/farm.js
 * ----------------
 * Repository for Farming System
 */

export function getFarmSlots(db, userId) {
    const rows = db.prepare(`SELECT * FROM player_farms WHERE user_id = ? ORDER BY slot_id ASC`).all(userId);
    if (rows.length === 0) {
        // Initialize 3 slots for new farmer
        const insert = db.prepare(`INSERT INTO player_farms (user_id, slot_id) VALUES (?, ?)`);
        db.transaction(() => {
            insert.run(userId, 1);
            insert.run(userId, 2);
            insert.run(userId, 3);
        })();
        return db.prepare(`SELECT * FROM player_farms WHERE user_id = ? ORDER BY slot_id ASC`).all(userId);
    }
    return rows;
}

export function plantCrop(db, userId, slotId, plantCode) {
    db.prepare(`
        UPDATE player_farms 
        SET plant_code = ?, 
            planted_at = strftime('%s','now'), 
            last_water_at = strftime('%s','now'), 
            is_withered = 0 
        WHERE user_id = ? AND slot_id = ?
    `).run(plantCode, userId, slotId);
}

export function waterCrop(db, userId, slotId) {
    db.prepare(`
        UPDATE player_farms 
        SET last_water_at = strftime('%s','now') 
        WHERE user_id = ? AND slot_id = ?
    `).run(userId, slotId);
}

export function harvestCrop(db, userId, slotId) {
    db.prepare(`
        UPDATE player_farms 
        SET plant_code = NULL, 
            planted_at = NULL, 
            last_water_at = NULL, 
            is_withered = 0 
        WHERE user_id = ? AND slot_id = ?
    `).run(userId, slotId);
}

export function clearCrop(db, userId, slotId) {
    db.prepare(`
        UPDATE player_farms 
        SET plant_code = NULL, 
            planted_at = NULL, 
            last_water_at = NULL, 
            is_withered = 0 
        WHERE user_id = ? AND slot_id = ?
    `).run(userId, slotId);
}

export function setWithered(db, userId, slotId) {
    db.prepare(`
        UPDATE player_farms 
        SET is_withered = 1 
        WHERE user_id = ? AND slot_id = ?
    `).run(userId, slotId);
}
