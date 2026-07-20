/**
 * db/repo/guild.js
 * ----------------
 * Fungsi interaksi database untuk Sistem Guild.
 */

/** Membuat tag guild unik berupa 4 karakter acak. */
function generateTag(db) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let tag = '';
    let isUnique = false;
    while (!isUnique) {
        tag = '';
        for (let i = 0; i < 4; i++) {
            tag += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const existing = db.prepare(`SELECT id FROM guilds WHERE tag = ?`).get(tag);
        if (!existing) isUnique = true;
    }
    return tag;
}

export function totalXpForLevel(level) {
    let totalExp = 0;
    for (let i = 1; i < level; i++) {
        totalExp += Math.floor(1000 * Math.pow(i, 1.8));
    }
    return totalExp;
}

export function createGuild(db, userId, name) {
    return db.transaction(() => {
        const tag = generateTag(db);
        const res = db.prepare(`
            INSERT INTO guilds (name, tag, level, exp, aester_bank, member_limit)
            VALUES (?, ?, 1, 0, 0, 10)
        `).run(name, tag);
        
        const guildId = res.lastInsertRowid;
        
        db.prepare(`
            INSERT INTO guild_members (guild_id, user_id, role, total_contribution)
            VALUES (?, ?, 'Leader', 0)
        `).run(guildId, userId);
        
        return { id: guildId, name, tag };
    })();
}

export function getGuildByUserId(db, userId) {
    const member = db.prepare(`SELECT * FROM guild_members WHERE user_id = ?`).get(userId);
    if (!member) return null;
    const guild = db.prepare(`SELECT * FROM guilds WHERE id = ?`).get(member.guild_id);
    return { ...guild, current_member_role: member.role, current_member_contribution: member.total_contribution };
}

export function getGuildByTag(db, tag) {
    return db.prepare(`SELECT * FROM guilds WHERE tag = ?`).get(tag.toUpperCase());
}

export function getGuildMembers(db, guildId) {
    return db.prepare(`
        SELECT gm.*, u.push_name, u.display_name, c.level as player_level
        FROM guild_members gm
        JOIN users u ON u.id = gm.user_id
        LEFT JOIN leveling c ON c.user_id = u.id
        WHERE gm.guild_id = ?
        ORDER BY 
            CASE gm.role WHEN 'Leader' THEN 1 WHEN 'Co-Leader' THEN 2 ELSE 3 END ASC,
            gm.total_contribution DESC
    `).all(guildId);
}

export function joinGuild(db, guildId, userId) {
    db.prepare(`
        INSERT INTO guild_members (guild_id, user_id, role, total_contribution)
        VALUES (?, ?, 'Member', 0)
    `).run(guildId, userId);
}

export function leaveGuild(db, guildId, userId) {
    db.prepare(`DELETE FROM guild_members WHERE guild_id = ? AND user_id = ?`).run(guildId, userId);
}

export function disbandGuild(db, guildId) {
    db.prepare(`DELETE FROM guilds WHERE id = ?`).run(guildId);
}

export function addGuildExp(db, guildId, amount) {
    db.transaction(() => {
        const guild = db.prepare(`SELECT * FROM guilds WHERE id = ?`).get(guildId);
        let newExp = guild.exp + amount;
        let newLevel = guild.level;
        let newLimit = guild.member_limit;
        
        while (newExp >= totalXpForLevel(newLevel + 1)) {
            newLevel++;
            if (newLevel % 5 === 0) {
                newLimit += 2; // +2 anggota setiap 5 level
            }
        }
        
        db.prepare(`
            UPDATE guilds 
            SET exp = ?, level = ?, member_limit = ?
            WHERE id = ?
        `).run(newExp, newLevel, newLimit, guildId);
    })();
}

export function updateMemberContribution(db, guildId, userId, amount) {
    db.prepare(`
        UPDATE guild_members 
        SET total_contribution = total_contribution + ?
        WHERE guild_id = ? AND user_id = ?
    `).run(amount, guildId, userId);
}

export function setMemberRole(db, guildId, userId, role) {
    db.prepare(`
        UPDATE guild_members
        SET role = ?
        WHERE guild_id = ? AND user_id = ?
    `).run(role, guildId, userId);
}
