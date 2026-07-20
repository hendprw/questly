import { getGroupSettings } from "../db/repo/moderation.js";

// Cache in-memory untuk Anti-Spam
// Struktur: { "jid": { count: 0, lastMessage: timestamp, lastText: "text" } }
const spamCache = new Map();

// Regex Anti-Link
const linkRegex = /(chat\.whatsapp\.com\/[a-zA-Z0-9]+)/i;

// Kata Kasar Dasar
const badwords = ["anjing", "babi", "bangsat", "kontol", "memek", "ngentot", "tolol", "goblok"];

export function registerModeration(bot, db) {
    // 1. Hook ke pesan masuk
    bot.on("message", async (ctx) => {
        if (!ctx.isGroup) return; // Hanya jalankan di grup
        if (ctx.isOwner) return; // Owner bebas

        // Cek Admin (Admin tidak kena Automod)
        let isAdmin = false;
        try {
            const groupMeta = await bot.sock.groupMetadata(ctx.from);
            const participant = groupMeta.participants.find(p => p.id === ctx.sender);
            isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (e) {
            // Abaikan error jika metadata gagal diambil
        }

        if (isAdmin) return;

        // Ambil setting grup dari database
        const settings = getGroupSettings(db, ctx.from);
        const text = ctx.text || "";

        // A. ANTI-LINK
        if (settings.anti_link === 1 && linkRegex.test(text)) {
            try {
                await bot.sock.sendMessage(ctx.from, { delete: ctx.raw.key });
                return ctx.reply(`⚠️ @${ctx.sender.split('@')[0]}, jangan mengirim link grup lain!`, { mentions: [ctx.sender] });
            } catch (e) {
                console.log("[Automod] Gagal hapus pesan link, pastikan bot adalah Admin.");
            }
        }

        // B. ANTI-TOXIC
        if (settings.anti_toxic === 1) {
            const isToxic = badwords.some(word => text.toLowerCase().includes(word));
            if (isToxic) {
                try {
                    await bot.sock.sendMessage(ctx.from, { delete: ctx.raw.key });
                    return ctx.reply(`⚠️ Tolong jaga ucapan Anda, @${ctx.sender.split('@')[0]}!`, { mentions: [ctx.sender] });
                } catch (e) {
                    console.log("[Automod] Gagal hapus pesan toxic, pastikan bot adalah Admin.");
                }
            }
        }

        // C. ANTI-SPAM
        if (settings.anti_spam === 1) {
            const now = Date.now();
            const userSpam = spamCache.get(ctx.sender) || { count: 0, lastMessage: 0, lastText: "" };
            
            // Logika spam: jika ngirim dalam jeda kurang dari 2 detik ATAU teksnya sama persis berturut-turut 3x
            const isFast = (now - userSpam.lastMessage) < 2000;
            const isDuplicate = (text === userSpam.lastText) && text.length > 2;

            if (isFast || isDuplicate) {
                userSpam.count++;
            } else {
                userSpam.count = 1;
            }

            userSpam.lastMessage = now;
            userSpam.lastText = text;
            spamCache.set(ctx.sender, userSpam);

            if (userSpam.count > 4) {
                try {
                    await bot.sock.sendMessage(ctx.from, { delete: ctx.raw.key });
                    if (userSpam.count === 5) { // Cuma peringati sekali di hit ke-5
                        ctx.reply(`⚠️ @${ctx.sender.split('@')[0]}, berhentilah melakukan SPAM!`, { mentions: [ctx.sender] });
                    }
                    return; // Jangan lanjutkan eksekusi
                } catch (e) {}
            }
        }
    });

    // 2. Hook ke Event Grup (Welcome/Goodbye)
    // Menunggu bot siap baru ngebind event ke raw socket
    bot.on("ready", (sock) => {
        sock.ev.on("group-participants.update", async (update) => {
            const { id, participants, action } = update;
            // id = group_jid
            
            try {
                const settings = getGroupSettings(db, id);
                const groupMeta = await sock.groupMetadata(id);
                
                for (const user of participants) {
                    if (action === "add" && settings.welcome_message) {
                        const msg = settings.welcome_message
                            .replace(/@user/g, `@${user.split('@')[0]}`)
                            .replace(/@group/g, groupMeta.subject);
                        
                        await sock.sendMessage(id, { text: msg, mentions: [user] });
                    } 
                    else if (action === "remove" && settings.goodbye_message) {
                        const msg = settings.goodbye_message
                            .replace(/@user/g, `@${user.split('@')[0]}`)
                            .replace(/@group/g, groupMeta.subject);
                        
                        await sock.sendMessage(id, { text: msg, mentions: [user] });
                    }
                }
            } catch (err) {
                console.error("[Automod] Error Welcome/Goodbye:", err);
            }
        });
    });
}
