import { getInventory } from "../../db/repo/items.js";
import { getCarryState } from "../../db/repo/shop.js";

export default function (bot) {
  bot.command(
    "inventory",
    async (ctx) => {
      const items = getInventory(bot.db, ctx.dbUser.id);
      const carryState = getCarryState(bot.db, ctx.dbUser.id);
      
      const hasItems = items.some(i => i.category !== 'material');
      const hasResources = items.some(i => i.category === 'material');

      if (!hasItems && !hasResources) {
        return ctx.reply("🎒 Tas dan penyimpanan sumber dayamu kosong melompong...");
      }

      let finalMessage = `*--- 🎒 INVENTARIS KAMU ---*\n\n`;
      finalMessage += `*Kapasitas Tas:* ${carryState.carry_weight.toLocaleString()}/${carryState.max_carry_weight.toLocaleString()} ⚖️\n\n`;

      if (hasItems) {
        finalMessage += '*╭─── • 「 🎒 ITEM & BIBIT 」*\n';
        for (const item of items.filter(i => i.category !== 'material')) {
          const equipped = item.is_equipped ? " (terpakai)" : "";
          finalMessage += `*│* 📦 *${item.name}* (x${item.quantity.toLocaleString()})${equipped}\n`;
          finalMessage += `*│* └── ID: \`${item.code}\` | ⚖️ ${item.weight || 0}\n`;
        }
        finalMessage += '*╰──────────────*\n';
      }

      if (hasResources) {
        if (hasItems) finalMessage += '\n';
        finalMessage += '*╭─── • 「 🌿 HASIL ALAM 」*\n';
        for (const item of items.filter(i => i.category === 'material')) {
          finalMessage += `*│* *${item.name}* (x${item.quantity.toLocaleString()})\n`;
          finalMessage += `*│* └── ID: \`${item.code}\` | ⚖️ ${item.weight || 0}\n`;
        }
        finalMessage += '*╰──────────────────*';
      }

      await ctx.reply(finalMessage.trim());
    },
    { aliases: ["inv", "tas"], category: "RPG", description: "Lihat isi inventory kamu" }
  );
}