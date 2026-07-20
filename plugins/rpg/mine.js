import { consumeStamina, getAndRegenerateStamina } from "../../db/repo/stamina.js";
import { addItem } from "../../db/repo/items.js";
import { getFullProfile } from "../../db/repo/users.js";
import { getCarryState, addCarryWeight } from "../../db/repo/shop.js";
import { addXp } from "../../db/repo/leveling.js";

const STAMINA_COST = 15;
const MINEABLE_ITEMS = [
    'iron_ore', 'coal', 'copper_ore', 'silver_ore', 'gold_ore', 
    'diamond', 'ruby', 'sapphire', 'emerald', 'topaz', 'amethyst', 
    'obsidian_shard', 'lava_rock', 'glacial_shard', 'omni_stone', 
    'abyssal_pearl', 'sunken_coin'
];

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function (bot) {
  bot.command("mine", async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;

      const success = consumeStamina(db, userId, STAMINA_COST);
      if (!success) {
        return ctx.reply(`⏳ Stamina tidak cukup. Butuh ${STAMINA_COST} stamina untuk mengayunkan beliung.`);
      }

      const profile = getFullProfile(db, userId);
      const character = profile.character;
      const currentStamina = getAndRegenerateStamina(db, userId);
      const currentLocation = character.location || 'Hutan Pinus';

      // Hanya izinkan menambang di tempat tertentu jika perlu, tapi kita asumsikan semua bioma punya batu.
      const placeholders = MINEABLE_ITEMS.map(() => '?').join(',');
      const possibleItems = db.prepare(`SELECT * FROM items WHERE locations LIKE ? AND code IN (${placeholders})`).all(`%"${currentLocation}"%`, ...MINEABLE_ITEMS);
      
      if (possibleItems.length === 0) {
         return ctx.reply(`Kamu memukul batu berkali-kali di *${currentLocation}*, namun tidak ada mineral berharga yang keluar.\n\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`);
      }

      const isMiner = character.class === "miner" || character.class === "penambang" || character.class === "ksatria"; // Contoh sinergi
      const lootMultiplier = isMiner ? 2 : 1;

      const numItemsToFind = Math.floor(Math.random() * 2) + 1;
      const selectedItems = shuffle(possibleItems).slice(0, numItemsToFind);

      let xpGained = 40;
      const itemsGained = [];
      const itemsLost = [];
      let totalWeightGained = 0;

      const carry = getCarryState(db, userId);
      let currentCarryWeight = carry.carry_weight;

      for (const item of selectedItems) {
        const itemAmount = (Math.floor(Math.random() * 2) + 1) * lootMultiplier;
        const itemWeight = item.weight || 0;
        const addedWeight = itemWeight * itemAmount;

        if (currentCarryWeight + addedWeight <= carry.max_carry_weight) {
           addItem(db, userId, item.code, itemAmount);
           addCarryWeight(db, userId, addedWeight);
           currentCarryWeight += addedWeight;
           itemsGained.push({ name: item.name, amount: itemAmount });
        } else {
           xpGained += 25 * itemAmount;
           itemsLost.push({ name: item.name, amount: itemAmount });
        }
      }

      const leveled = addXp(db, userId, xpGained);

      const intros = [
          `Kamu mengayunkan beliung ke dinding batu di *${currentLocation}* dan menemukan:`,
          `Terdengar bunyi benturan keras! Bebatuan runtuh di *${currentLocation}*, menyisakan:`,
          `Keringat bercucuran saat kamu menambang di *${currentLocation}*, kerja kerasmu membuahkan hasil:`,
          `Di celah gelap *${currentLocation}*, kamu melihat kilauan misterius dan menggali:`,
          `Tanganmu kapalan setelah berjam-jam menggali di *${currentLocation}*, namun usahamu terbayar:`,
          `Gema beliungmu memantul di *${currentLocation}*. Dari balik debu tebal, kamu menemukan:`,
          `Batu keras di *${currentLocation}* hancur berkeping-keping, menampakkan urat mineral:`,
          `Dengan presisi tinggi, kamu memecahkan formasi batu di *${currentLocation}* dan mengumpulkan:`,
          `Debu batu berterbangan di udara *${currentLocation}*. Setelah reda, kamu melihat:`,
          `Sebuah celah kecil di *${currentLocation}* menarik perhatianmu. Setelah digali, kamu menemukan:`
      ];
      let finalMessage = `${intros[Math.floor(Math.random() * intros.length)]}\n\n`;
      if (itemsGained.length > 0) {
          for (const item of itemsGained) {
              finalMessage += `⛏️ *+${item.amount} ${item.name}*\n`;
          }
      }
      
      if (itemsLost.length > 0) {
          const totalLostXP = itemsLost.reduce((sum, item) => sum + (item.amount * 25), 0);
          finalMessage += `\n⚠️ Tas penuh! Bijih dikonversi jadi debu bintang (*+${totalLostXP}* EXP): ${itemsLost.map(i => `${i.amount} ${i.name}`).join(', ')}.\n`;
      }
      
      finalMessage += `✨ *+${xpGained}* EXP\n`;
      if (isMiner) finalMessage += `\n🎯 _Sinergi Penambang:_ Hasil tambang berlipat ganda!`;
      finalMessage += `\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;

      await ctx.reply(finalMessage);

      if (leveled && leveled.leveledUp) {
          try {
              if (bot.sock) await bot.sock.sendMessage(ctx.sender, { text: `🎉 Selamat! Kamu naik *Level ${leveled.after.level}*!` });
          } catch(e) { console.error(e); }
      }
    }, { aliases: ["tambang", "mining"], category: "RPG", description: "Menambang bebatuan dan mineral berharga." });
}
