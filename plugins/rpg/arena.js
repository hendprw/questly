import { getFullProfile, findUserByNumber, findUserByJid } from "../../db/repo/users.js";
import { calculateBattleStats, simulatePvpBattle } from "../../db/repo/combat.js";
import { getWallet, removeCash, addCash } from "../../db/repo/economy.js";

// Penyimpanan sementara tantangan (memori, hilang jika bot restart)
// Key: targetId (yang ditantang), Value: { challengerId, amount, expiresAt }
const arenaChallenges = new Map();

export default function (bot) {
  bot.command(
    "arena",
    async (ctx) => {
      const db = bot.db;
      const subCmd = ctx.args[0]?.toLowerCase();

      // --- 1. MENERIMA TANTANGAN ---
      if (subCmd === "acc" || subCmd === "terima") {
        const challenge = arenaChallenges.get(ctx.dbUser.id);
        if (!challenge) {
            return ctx.reply("❌ Kamu tidak memiliki tantangan Arena yang aktif.");
        }
        if (Date.now() > challenge.expiresAt) {
            arenaChallenges.delete(ctx.dbUser.id);
            return ctx.reply("⏳ Tantangan sudah kadaluarsa!");
        }

        const targetId = ctx.dbUser.id;
        const challengerId = challenge.challengerId;

        // Ambil data profil terbaru dari kedua belah pihak
        const p1Profile = getFullProfile(db, challengerId);
        const p2Profile = getFullProfile(db, targetId);

        if (!p1Profile || !p2Profile) return ctx.reply("Galat: Salah satu pemain tidak ditemukan.");

        const p1Name = p1Profile.user.display_name || p1Profile.user.push_name || 'Penantang';
        const p2Name = p2Profile.user.display_name || p2Profile.user.push_name || 'Kamu';

        // Bangun object Player untuk simulasi
        const playerA = {
            id: challengerId,
            name: p1Name,
            stats: calculateBattleStats(db, challengerId)
        };
        const playerB = {
            id: targetId,
            name: p2Name,
            stats: calculateBattleStats(db, targetId)
        };

        // Mulai simulasi pertarungan!
        const result = simulatePvpBattle(playerA, playerB);
        arenaChallenges.delete(targetId);

        // Eksekusi taruhan (5% dari dompet yang kalah)
        const loserWallet = getWallet(db, result.loser.id);
        let betAmount = Math.floor(loserWallet.cash * 0.05);
        if (betAmount < 0) betAmount = 0;

        if (betAmount > 0) {
            removeCash(db, result.loser.id, betAmount, { note: "Kalah di Arena" });
            addCash(db, result.winner.id, betAmount, { note: "Menang di Arena" });
        }

        // Render UI
        let battleLogStr = result.log.join("\n");
        let ui = `*⚔️ ARENA PVP: ${playerA.name} VS ${playerB.name} ⚔️*\n\n`;
        ui += battleLogStr + "\n\n";
        ui += `🏆 *PEMENANG: ${result.winner.name}*\n`;
        ui += `💀 *KALAH: ${result.loser.name}*\n\n`;
        
        if (betAmount > 0) {
            ui += `💸 *${result.winner.name}* mencuri **${betAmount.toLocaleString()} Aester** dari pihak yang kalah!`;
        } else {
            ui += `💸 Pihak yang kalah terlalu miskin untuk dirampok.`;
        }

        return ctx.reply(ui);
      }

      // --- 2. MENOLAK TANTANGAN ---
      if (subCmd === "tolak" || subCmd === "reject") {
        const challenge = arenaChallenges.get(ctx.dbUser.id);
        if (!challenge) {
            return ctx.reply("❌ Kamu tidak memiliki tantangan Arena yang aktif.");
        }
        arenaChallenges.delete(ctx.dbUser.id);
        return ctx.reply("🏃 Kamu telah menolak tantangan Arena.");
      }

      // --- 3. MENANTANG PEMAIN LAIN ---
      if (!ctx.args[0]) {
          return ctx.reply(`⚔️ *ARENA PVP*\nTantang pemain lain untuk adu mekanik!\nPemenang akan merampok 5% uang yang kalah.\n\nCara main: \`${bot.options.prefix}arena @nomor/tag\``);
      }

      const rawTarget = ctx.args[0].replace('@', '').replace(/[^0-9]/g, '');
      const targetUser = findUserByNumber(db, rawTarget) || findUserByJid(db, `${rawTarget}@s.whatsapp.net`);

      if (!targetUser) {
          return ctx.reply(`❌ Pemain tersebut tidak ditemukan di sistem RPG.`);
      }

      if (targetUser.id === ctx.dbUser.id) {
          return ctx.reply(`❌ Kamu tidak bisa menantang dirimu sendiri.`);
      }

      // Cek apakah target sudah punya class
      const targetProfile = getFullProfile(db, targetUser.id);
      if (!targetProfile.character.class) {
          return ctx.reply(`❌ Pemain tersebut belum memulai petualangannya (belum memilih Class).`);
      }

      // Buat tantangan (kadaluarsa dalam 3 menit)
      arenaChallenges.set(targetUser.id, {
          challengerId: ctx.dbUser.id,
          expiresAt: Date.now() + (3 * 60 * 1000)
      });

      const challengerName = ctx.dbUser.display_name || ctx.dbUser.push_name || 'Seseorang';
      
      await ctx.sendButtons(
          { 
              title: `⚔️ *TANTANGAN ARENA!*\n\n@${targetUser.phone_number || targetUser.jid.split('@')[0]}\n*${challengerName}* menantangmu berduel di Arena!\n\n_Pemenang akan merampok 5% dari Aester pihak yang kalah._\n_Tantangan hangus dalam 3 menit._`, 
              footer: "Apakah kamu berani?",
              mentions: [targetUser.jid]
          },
          [
              { type: "reply", text: "⚔️ Terima", id: ".arena acc" },
              { type: "reply", text: "🏃 Tolak", id: ".arena tolak" }
          ]
      );
    },
    { aliases: ["duel", "pvp"], category: "RPG", description: "Tantang pemain lain berduel di Arena" }
  );
}
