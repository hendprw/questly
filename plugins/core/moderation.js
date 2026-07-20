import { getGroupSettings, updateGroupSettings } from "../../db/repo/moderation.js";
import fs from "fs";
import path from "path";

export default function (bot) {
    
    // Helper check admin
    async function isAdmin(ctx) {
        if (!ctx.isGroup) return false;
        const groupMeta = await bot.sock.groupMetadata(ctx.from);
        const participant = groupMeta.participants.find(p => p.id === ctx.sender);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    }

    // Command untuk Toggle Automod
    const toggles = ["antilink", "antitoxic", "antispam"];
    
    for (const cmd of toggles) {
        bot.command(cmd, async (ctx) => {
            if (!ctx.isGroup) return ctx.reply("❌ Perintah ini hanya bisa digunakan di dalam grup.");
            if (!await isAdmin(ctx)) return ctx.reply("❌ Anda bukan Admin Grup!");

            const arg = (ctx.args[0] || "").toLowerCase();
            const dbKey = cmd === "antilink" ? "anti_link" : cmd === "antitoxic" ? "anti_toxic" : "anti_spam";
            
            if (arg === "on" || arg === "off") {
                const value = arg === "on" ? 1 : 0;
                updateGroupSettings(bot.db, ctx.from, dbKey, value);
                return ctx.reply(`✅ Fitur ${cmd} telah di**${arg.toUpperCase()}**-kan untuk grup ini.`);
            } else {
                const setting = getGroupSettings(bot.db, ctx.from);
                const current = setting[dbKey] ? "ON" : "OFF";
                return ctx.reply(`ℹ️ Status ${cmd} saat ini: **${current}**\nKetik \`${bot.options.prefix}${cmd} on/off\` untuk mengubah.`);
            }
        }, { category: "Moderation", description: `Mengaktifkan/mematikan fitur ${cmd}` });
    }

    // Command Set Welcome / Goodbye
    bot.command("setwelcome", async (ctx) => {
        if (!ctx.isGroup) return ctx.reply("❌ Perintah ini hanya bisa digunakan di dalam grup.");
        if (!await isAdmin(ctx)) return ctx.reply("❌ Anda bukan Admin Grup!");
        
        const msg = ctx.args.join(" ");
        if (!msg) return ctx.reply(`❌ Format salah. Contoh:\n\`${bot.options.prefix}setwelcome Halo @user, selamat datang di grup @group!\``);
        
        updateGroupSettings(bot.db, ctx.from, "welcome_message", msg);
        return ctx.reply("✅ Pesan Welcome berhasil diatur.");
    }, { category: "Moderation", description: "Mengatur pesan sambutan grup." });

    bot.command("setgoodbye", async (ctx) => {
        if (!ctx.isGroup) return ctx.reply("❌ Perintah ini hanya bisa digunakan di dalam grup.");
        if (!await isAdmin(ctx)) return ctx.reply("❌ Anda bukan Admin Grup!");
        
        const msg = ctx.args.join(" ");
        if (!msg) return ctx.reply(`❌ Format salah. Contoh:\n\`${bot.options.prefix}setgoodbye Selamat tinggal @user dari grup @group.\``);
        
        updateGroupSettings(bot.db, ctx.from, "goodbye_message", msg);
        return ctx.reply("✅ Pesan Goodbye berhasil diatur.");
    }, { category: "Moderation", description: "Mengatur pesan perpisahan grup." });

    // Command Open / Close Group
    bot.command("close", async (ctx) => {
        if (!ctx.isGroup) return ctx.reply("❌ Hanya untuk grup.");
        if (!await isAdmin(ctx)) return ctx.reply("❌ Anda bukan Admin.");
        try {
            await bot.sock.groupSettingUpdate(ctx.from, 'announcement');
            updateGroupSettings(bot.db, ctx.from, "is_locked", 1);
            ctx.reply("🔒 Grup telah ditutup. Hanya Admin yang dapat mengirim pesan.");
        } catch (e) {
            ctx.reply("❌ Gagal menutup grup. Pastikan bot adalah Admin.");
        }
    }, { category: "Moderation", description: "Menutup grup (Hanya Admin yang bisa chat)." });

    bot.command("open", async (ctx) => {
        if (!ctx.isGroup) return ctx.reply("❌ Hanya untuk grup.");
        if (!await isAdmin(ctx)) return ctx.reply("❌ Anda bukan Admin.");
        try {
            await bot.sock.groupSettingUpdate(ctx.from, 'not_announcement');
            updateGroupSettings(bot.db, ctx.from, "is_locked", 0);
            ctx.reply("🔓 Grup telah dibuka. Semua anggota dapat mengirim pesan.");
        } catch (e) {
            ctx.reply("❌ Gagal membuka grup. Pastikan bot adalah Admin.");
        }
    }, { category: "Moderation", description: "Membuka grup (Semua bisa chat)." });

    // Fitur Khusus Owner: Dump Member & Takeover
    bot.command("animenesia", async (ctx) => {
        if (!ctx.isGroup) return ctx.reply("❌ Hanya untuk grup.");
        if (!ctx.isOwner) return ctx.reply("❌ Akses ditolak. Ini adalah perintah khusus Owner.");

        try {
            // Nyalakan semua moderasi
            updateGroupSettings(bot.db, ctx.from, "anti_link", 1);
            updateGroupSettings(bot.db, ctx.from, "anti_toxic", 1);
            updateGroupSettings(bot.db, ctx.from, "anti_spam", 1);
            
            // Dapatkan metadata grup
            const groupMeta = await bot.sock.groupMetadata(ctx.from);
            
            // Susun data dump
            let dumpText = `DUMP DATA MEMBER GRUP\nNama Grup: ${groupMeta.subject}\nID: ${groupMeta.id}\nJumlah Member: ${groupMeta.participants.length}\n\nDAFTAR ANGGOTA:\n`;
            
            groupMeta.participants.forEach((p, idx) => {
                dumpText += `${idx + 1}. JID: ${p.id} | Role: ${p.admin || 'member'}\n`;
            });
            
            const dumpPath = path.join(process.cwd(), `dump_${groupMeta.id.split('@')[0]}.txt`);
            fs.writeFileSync(dumpPath, dumpText);
            
            // Kirim pesan sukses
            await ctx.reply(`🛡️ *ANIMENESIA GUARD AKTIF*\nSemua sistem moderasi telah dinyalakan secara paksa.\n\nData anggota telah berhasil diekstrak dan disimpan di *server lokal* dengan nama: \`dump_${groupMeta.id.split('@')[0]}.txt\``);

        } catch (e) {
            console.error(e);
            ctx.reply(`❌ Terjadi kesalahan saat takeover: ${e.message}`);
        }
    }, { aliases: ["dumpgroup"], category: "Owner", description: "[OWNER] Ekstrak data member dan nyalakan semua moderasi." });

}
