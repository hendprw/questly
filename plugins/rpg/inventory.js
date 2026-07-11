import { getInventory } from "../../db/repo/items.js";

const RARITY_ICON = {
  common: "⚪",
  uncommon: "🟢",
  rare: "🔵",
  epic: "🟣",
  legendary: "🟠",
  mythic: "🔴",
};

export default function (bot) {
  bot.command(
    "inventory",
    async (ctx) => {
      const items = getInventory(bot.db, ctx.dbUser.id);
      if (!items.length) return ctx.reply("🎒 Inventory kamu masih kosong. Belanja lewat !shop dulu.");

      const lines = items.map((it) => {
        const icon = RARITY_ICON[it.rarity] ?? "⚪";
        const equipped = it.is_equipped ? " (terpakai)" : "";
        return `${icon} ${it.name} x${it.quantity}${equipped} — kode: ${it.code}`;
      });

      await ctx.reply(`🎒 *Inventory Kamu*\n\n${lines.join("\n")}`);
    },
    { aliases: ["inv", "tas"], category: "RPG", description: "Lihat isi inventory kamu" }
  );
}