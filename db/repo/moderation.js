/**
 * db/repo/moderation.js
 * Manajemen setting moderasi grup
 */

export function getGroupSettings(db, groupId) {
    let settings = db.prepare(`SELECT * FROM group_settings WHERE group_id = ?`).get(groupId);
    if (!settings) {
        db.prepare(`INSERT INTO group_settings (group_id) VALUES (?)`).run(groupId);
        settings = db.prepare(`SELECT * FROM group_settings WHERE group_id = ?`).get(groupId);
    }
    return settings;
}

export function updateGroupSettings(db, groupId, key, value) {
    // Pastikan baris sudah ada
    getGroupSettings(db, groupId);
    
    // Whitelist kunci yang valid untuk mencegah SQL Injection via field name
    const validKeys = ["anti_link", "anti_toxic", "anti_spam", "welcome_message", "goodbye_message", "is_locked"];
    if (!validKeys.includes(key)) throw new Error("Invalid setting key");

    db.prepare(`UPDATE group_settings SET ${key} = ? WHERE group_id = ?`).run(value, groupId);
    return getGroupSettings(db, groupId);
}
