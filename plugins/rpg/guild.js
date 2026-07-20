import { 
    createGuild, getGuildByUserId, getGuildByTag, getGuildMembers, 
    joinGuild, leaveGuild, disbandGuild, addGuildExp, 
    updateMemberContribution, setMemberRole, totalXpForLevel 
} from "../../db/repo/guild.js";
import { getWallet, removeCash, addCash } from "../../db/repo/economy.js";
import { getFullProfile, findUserByNumber, findUserByJid } from "../../db/repo/users.js";

// Helper untuk visual progress bar
function createProgressBar(current, max, length = 10) {
    const percent = Math.min(100, Math.max(0, (current / max) * 100));
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    return `[${'■'.repeat(filled)}${'□'.repeat(empty)}]`;
}

export default function (bot) {
    bot.command(
        "guild",
        async (ctx) => {
            const db = bot.db;
            const subCmd = ctx.args[0]?.toLowerCase();
            const userId = ctx.dbUser.id;
            const guild = getGuildByUserId(db, userId);

            // --- ROUTING UNTUK PEMAIN TANPA GUILD ---
            if (!guild) {
                if (!subCmd) {
                    return ctx.reply('🏰 **SISTEM GUILD**\n\nKamu belum punya guild.\n👉 `.guild create <nama>` untuk buat baru (10.000 Aester).\n👉 `.guild info <TAG>` untuk cek statistik guild lain.\n👉 `.guild join <TAG>` untuk gabung ke guild orang lain.');
                }

                if (subCmd === 'create' || subCmd === 'buat') {
                    const guildName = ctx.args.slice(1).join(' ');
                    if (!guildName || guildName.length < 3) return ctx.reply('⚠️ Nama guild minimal 3 huruf.\nContoh: `.guild create Pasukan Naga`');
                    if (guildName.length > 20) return ctx.reply('⚠️ Nama guild maksimal 20 huruf.');

                    const createCost = 10000;
                    const wallet = getWallet(db, userId);
                    if (wallet.cash < createCost) return ctx.reply(`💸 Biaya membuat Guild adalah **${createCost.toLocaleString()} Aester**.\nUangmu: ${wallet.cash.toLocaleString()}`);

                    try {
                        removeCash(db, userId, createCost, { note: "Create Guild" });
                        const newGuild = createGuild(db, userId, guildName);
                        return ctx.reply(`🎉 **GUILD BERHASIL DIBUAT!**\n\nNama: *${newGuild.name}*\nTag: *[${newGuild.tag}]*\n\nSilakan undang temanmu dengan \`.guild invite @tag\``);
                    } catch (e) {
                        return ctx.reply(`❌ Nama "${guildName}" sudah dipakai oleh guild lain.`);
                    }
                }

                if (subCmd === 'join' || subCmd === 'gabung') {
                    const tag = ctx.args[1]?.toUpperCase();
                    if (!tag) return ctx.reply('⚠️ Masukkan TAG guild. Contoh: `.guild join ABCD`');

                    const targetGuild = getGuildByTag(db, tag);
                    if (!targetGuild) return ctx.reply(`❌ Guild dengan tag [${tag}] tidak ditemukan.`);

                    // Di Questly, kita cek apakah dia punya invite (dari tabel guild_invites)
                    const invite = db.prepare(`SELECT * FROM guild_invites WHERE guild_id = ? AND user_id = ?`).get(targetGuild.id, userId);
                    if (!invite) return ctx.reply(`🔒 Guild ini bersifat Invite-Only. Minta admin guild mengundangmu (\`.guild invite @kamu\`).`);

                    const members = getGuildMembers(db, targetGuild.id);
                    if (members.length >= targetGuild.member_limit) return ctx.reply('❌ Guild sudah penuh!');

                    joinGuild(db, targetGuild.id, userId);
                    db.prepare(`DELETE FROM guild_invites WHERE guild_id = ? AND user_id = ?`).run(targetGuild.id, userId);
                    
                    return ctx.reply(`✅ Selamat datang di keluarga besar *${targetGuild.name}*!`);
                }
            }

            // --- BISA DIAKSES OLEH SIAPAPUN (INFO) ---
            if (subCmd === 'info' || (!subCmd && guild)) {
                let targetGuild = guild;
                if (subCmd === 'info' && ctx.args[1]) {
                    const searchArg = ctx.args[1].toUpperCase();
                    targetGuild = getGuildByTag(db, searchArg);
                    if (!targetGuild) return ctx.reply('❌ Guild tidak ditemukan.');
                }

                const members = getGuildMembers(db, targetGuild.id);
                const leader = members.find(m => m.role === 'Leader');
                const leaderName = leader ? (leader.display_name || leader.push_name) : 'Tidak Diketahui';

                let memberList = members.slice(0, 15).map(m => {
                    const roleIcon = { 'Leader': '👑', 'Co-Leader': '🛡️', 'Member': '👤' };
                    const name = m.display_name || m.push_name;
                    return `${roleIcon[m.role]} *${name}* : ${m.total_contribution.toLocaleString()} EXP`;
                }).join('\n');

                if (members.length > 15) memberList += `\n...dan ${members.length - 15} lainnya.`;

                const expCurrent = totalXpForLevel(targetGuild.level);
                const expNext = totalXpForLevel(targetGuild.level + 1);
                const progress = targetGuild.exp - expCurrent;
                const needed = expNext - expCurrent;
                const percent = Math.floor((progress / needed) * 100);

                const progressBar = createProgressBar(progress, needed);
                const memberBar = createProgressBar(members.length, targetGuild.member_limit, 5);

                const infoText = 
`🏰 *GUILD DASHBOARD*
──────────────────
📛 Nama: *${targetGuild.name}*
🏷️ Tag: *[${targetGuild.tag}]*
📝 Desc: _${targetGuild.description}_
👑 Leader: ${leaderName}
──────────────────
📊 *STATISTIK*
⭐ Level: *${targetGuild.level}*
📈 EXP: ${progressBar} ${percent}%
   └ ${progress.toLocaleString()} / ${needed.toLocaleString()}
👥 Member: ${memberBar} ${members.length}/${targetGuild.member_limit}
💰 Kas: *${targetGuild.aester_bank.toLocaleString()}* Aester
──────────────────
🏆 *ANGGOTA TERATAS*
${memberList}
──────────────────
💡 _Ketik .guild help untuk bantuan._`;

                return ctx.reply(infoText);
            }

            // --- ROUTING UNTUK PEMAIN YANG PUNYA GUILD ---
            if (!guild) return ctx.reply('🚫 Kamu harus masuk guild dulu untuk perintah ini.');

            const isLeader = guild.current_member_role === 'Leader';
            const isCoLeader = guild.current_member_role === 'Co-Leader';
            const hasAdmin = isLeader || isCoLeader;

            switch (subCmd) {
                case 'leave': {
                    if (isLeader) {
                        const members = getGuildMembers(db, guild.id);
                        if (members.length > 1) return ctx.reply('⚠️ Leader tidak bisa keluar jika masih ada anggota. Turunkan jabatan ke orang lain dulu atau bubarkan guild (.guild disband confirm).');
                        return ctx.reply('⚠️ Kamu satu-satunya member. Gunakan `.guild disband confirm` untuk menghapus guild.');
                    }
                    leaveGuild(db, guild.id, userId);
                    return ctx.reply(`👋 Kamu telah keluar dari *${guild.name}*.`);
                }

                case 'sumbang':
                case 'donate': {
                    const amountInput = parseInt(ctx.args[1], 10);
                    if (isNaN(amountInput) || amountInput <= 0) return ctx.reply('⚠️ Masukkan jumlah Aester yang ingin disumbangkan. Contoh: `.guild sumbang 100`');

                    const wallet = getWallet(db, userId);
                    if (wallet.cash < amountInput) return ctx.reply(`💸 Aester kamu tidak cukup. Uangmu: ${wallet.cash.toLocaleString()}`);

                    // Aester di-convert jadi EXP Guild 1:1
                    removeCash(db, userId, amountInput, { note: "Sumbangan Guild" });
                    
                    const oldLevel = guild.level;
                    addGuildExp(db, guild.id, amountInput);
                    updateMemberContribution(db, guild.id, userId, amountInput);

                    const newGuild = getGuildByTag(db, guild.tag);

                    let msg = `✅ Menyumbang *${amountInput.toLocaleString()} Aester* ke Guild (Terkonversi menjadi EXP).`;
                    if (newGuild.level > oldLevel) {
                        msg += `\n🎉 **LEVEL UP!** Guild naik ke Level ${newGuild.level}!`;
                        if (newGuild.level % 5 === 0) msg += ` Slot member bertambah +2!`;
                    }
                    return ctx.reply(msg);
                }

                case 'invite': {
                    if (!hasAdmin) return ctx.reply('🚫 Khusus Leader & Co-Leader.');
                    if (!ctx.args[1]) return ctx.reply('⚠️ Tag orang yang mau diundang. Contoh: `.guild invite @nomor`');
                    
                    const rawTarget = ctx.args[1].replace('@', '').replace(/[^0-9]/g, '');
                    const targetUser = findUserByNumber(db, rawTarget) || findUserByJid(db, `${rawTarget}@s.whatsapp.net`);
                    
                    if (!targetUser) return ctx.reply('❌ Pemain tersebut tidak ditemukan.');
                    if (getGuildByUserId(db, targetUser.id)) return ctx.reply('❌ Dia sudah punya guild.');

                    const members = getGuildMembers(db, guild.id);
                    if (members.length >= guild.member_limit) return ctx.reply('❌ Guild penuh! Naikkan level guild untuk menambah kapasitas.');

                    try {
                        db.prepare(`INSERT INTO guild_invites (guild_id, user_id) VALUES (?, ?)`).run(guild.id, targetUser.id);
                        return ctx.reply(`✅ Undangan dikirim ke *${targetUser.push_name || 'Pemain'}*. Suruh dia mengetik \`.guild join ${guild.tag}\` untuk bergabung.`);
                    } catch (e) {
                        return ctx.reply('⚠️ Pemain tersebut sudah kamu undang sebelumnya.');
                    }
                }

                case 'kick': {
                    if (!hasAdmin) return ctx.reply('🚫 Khusus Leader & Co-Leader.');
                    const rawTarget = ctx.args[1]?.replace('@', '').replace(/[^0-9]/g, '');
                    if (!rawTarget) return ctx.reply('⚠️ Tag anggota yang mau di-kick.');

                    const targetUser = findUserByNumber(db, rawTarget) || findUserByJid(db, `${rawTarget}@s.whatsapp.net`);
                    if (!targetUser) return ctx.reply('❌ Pemain tidak ditemukan.');

                    const members = getGuildMembers(db, guild.id);
                    const targetMember = members.find(m => m.user_id === targetUser.id);
                    
                    if (!targetMember) return ctx.reply('❌ Dia bukan anggota guild ini.');
                    if (targetMember.role === 'Leader') return ctx.reply('❌ Tidak bisa menendang Leader.');
                    if (targetMember.role === 'Co-Leader' && !isLeader) return ctx.reply('❌ Hanya Leader yang bisa menendang Co-Leader.');

                    leaveGuild(db, guild.id, targetUser.id);
                    return ctx.reply(`👢 *${targetUser.push_name || 'Pemain'}* telah dikeluarkan dari Guild.`);
                }

                case 'promote': {
                    if (!isLeader) return ctx.reply('🚫 Khusus Leader.');
                    const rawTarget = ctx.args[1]?.replace('@', '').replace(/[^0-9]/g, '');
                    const targetUser = findUserByNumber(db, rawTarget);
                    if (!targetUser) return ctx.reply('❌ Pemain tidak ditemukan.');

                    const members = getGuildMembers(db, guild.id);
                    const targetMember = members.find(m => m.user_id === targetUser.id);
                    if (!targetMember || targetMember.role !== 'Member') return ctx.reply('❌ Hanya Member biasa yang bisa dipromosikan menjadi Co-Leader.');

                    setMemberRole(db, guild.id, targetUser.id, 'Co-Leader');
                    return ctx.reply('🛡️ Jabatan dinaikkan! Dia sekarang adalah Co-Leader.');
                }

                case 'demote': {
                    if (!isLeader) return ctx.reply('🚫 Khusus Leader.');
                    const rawTarget = ctx.args[1]?.replace('@', '').replace(/[^0-9]/g, '');
                    const targetUser = findUserByNumber(db, rawTarget);
                    if (!targetUser) return ctx.reply('❌ Pemain tidak ditemukan.');

                    const members = getGuildMembers(db, guild.id);
                    const targetMember = members.find(m => m.user_id === targetUser.id);
                    if (!targetMember || targetMember.role !== 'Co-Leader') return ctx.reply('❌ Target bukan Co-Leader.');

                    setMemberRole(db, guild.id, targetUser.id, 'Member');
                    return ctx.reply('⬇️ Jabatan diturunkan menjadi Member biasa.');
                }

                case 'disband': {
                    if (!isLeader) return ctx.reply('🚫 Khusus Leader.');
                    if (ctx.args[1] !== 'confirm') return ctx.reply(`⚠️ **BAHAYA!**\nPerintah ini akan MENGHAPUS guild *${guild.name}* secara permanen tanpa pengembalian uang.\nKetik \`.guild disband confirm\` jika yakin.`);

                    disbandGuild(db, guild.id);
                    return ctx.reply(`🗑️ Guild *${guild.name}* telah dibubarkan selamanya.`);
                }

                case 'help': {
                    return ctx.reply(`🏰 **PANDUAN GUILD**
                    
*👤 UMUM*
\`.guild create <nama>\` - Buat guild (10.000 Aester)
\`.guild join <tag>\` - Gabung guild (butuh invite)
\`.guild info\` - Lihat statistik
\`.guild leave\` - Keluar guild
\`.guild sumbang <jumlah>\` - Sumbang Aester untuk jadi EXP

*👑 MANAJEMEN (Admin)*
\`.guild invite @user\` - Undang member
\`.guild kick @user\` - Keluarkan member
\`.guild promote @user\` - Angkat jadi Co-Leader
\`.guild demote @user\` - Turunkan ke Member
\`.guild disband confirm\` - Bubarkan Guild`);
                }

                default:
                    return ctx.reply('❓ Perintah tidak dikenal. Cek `.guild help`.');
            }
        },
        { aliases: ["clan", "faksi"], category: "RPG", description: "Sistem Guild/Faksi sosial" }
    );
}
