import { getFullProfile } from "../../db/repo/users.js";
import { xpToNextLevel } from "../../db/repo/leveling.js";
import { getClass } from "../../db/repo/classes.js";
import { sendClassPicker } from "./class.js";
import { money, progressBar } from "../../lib/format.js";

const STAT_LABELS = {
  strength: "STR",
  intelligence: "INT",
  luck: "LUK",
  stamina: "STA",
  charisma: "CHA",
};

export default function (bot) {
  bot.command(
    "profile",
    async (ctx) => {
      const profile = getFullProfile(bot.db, ctx.dbUser.id);
      const { user, wallet, leveling, character, job, stats } = profile;

      // Belum pilih class — jangan tampilkan kartu kosong/aneh, ajak pilih dulu.
      if (!character.class) {
        return sendClassPicker(
          ctx,
          bot.db,
          "📋 Kamu belum memilih class! Pilih dulu biar kartu petualangmu aktif:"
        );
      }

      const name = user.display_name || user.push_name || ctx.senderNumber;
      const need = xpToNextLevel(leveling.level);
      const className = getClass(bot.db, character.class)?.name ?? character.class;
      const statLine = Object.entries(stats)
        .map(([k, v]) => `${STAT_LABELS[k] ?? k.toUpperCase()} ${v}`)
        .join("  ·  ");

      const card = [
        "╔═══════════════════════════╗",
        "     👤  KARTU PETUALANG",
        "╚═══════════════════════════╝",
        `✦ ${name}`,
        `🗡️  Class   : ${className}`,
        `🏅 Rank    : ${leveling.rank}`,
        `🏆 Level   : ${leveling.level}  (Prestige ${leveling.prestige})`,
        `✨ EXP     : ${leveling.xp}/${need}`,
        `   ${progressBar(leveling.xp, need)}`,
        "",
        "⚔️  STATUS TEMPUR",
        `❤️  HP      : ${character.hp}/${character.max_hp}`,
        `🔷 MP      : ${character.mp}/${character.max_mp}`,
        `⚡ Energy  : ${character.energy}/${character.max_energy}`,
        `⚔️ ATK ${character.attack}   🛡️ DEF ${character.defense}   💨 SPD ${character.speed}`,
        "",
        "💰 KEKAYAAN",
        `✧ Cash    : ${money(wallet.cash)}`,
        `🏦 Bank    : ${money(wallet.bank)} / ${money(wallet.bank_capacity)}`,
        `💎 Gems    : ${wallet.gems}`,
        "",
        `💼 Pekerjaan : ${job?.job_name ?? "Pengangguran"}`,
        `📊 Stats     : ${statLine}`,
      ].join("\n");

      await ctx.reply("```" + card + "```");
    },
    {
      aliases: ["p", "me"],
      category: "RPG",
      description: "Lihat profil & karakter kamu",
    }
  );
}