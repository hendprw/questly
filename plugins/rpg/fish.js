import { consumeStamina, getAndRegenerateStamina } from "../../db/repo/stamina.js";
import { addItem } from "../../db/repo/items.js";
import { getFullProfile } from "../../db/repo/users.js";
import { getCarryState, addCarryWeight } from "../../db/repo/shop.js";
import { addXp } from "../../db/repo/leveling.js";

const STAMINA_COST = 10;
const FISH_ITEMS = [
    'common_fish', 'serpent_eel' // Drop spesifik ikan dari Questly
];
const JUNK_ITEMS = [
    'old_boot', 'rusty_can', 'bottle_message', 'wood'
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
  bot.command("fish", async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;

      const profile = getFullProfile(db, userId);
      const character = profile.character;
      const currentLocation = character.location || 'Hutan Pinus';

      // Harus di lokasi yang ada airnya (contoh Rawa atau Pantai)
      // Di Orion hanya bisa mancing di Swamp / Cave. Kita bebaskan tapi kita kasih rasa immersive.
      if (!['Sunken Serenity', 'Murkwood', 'Hutan Pinus', 'Pantai'].some(loc => currentLocation.includes(loc))) {
          // Boleh mancing di mana saja, tapi teksnya beda (Air tawar/asin).
      }

      const success = consumeStamina(db, userId, STAMINA_COST);
      if (!success) {
        return ctx.reply(`⏳ Kamu terlalu lelah untuk melempar kail. Butuh ${STAMINA_COST} stamina.`);
      }

      const currentStamina = getAndRegenerateStamina(db, userId);
      
      const isFisher = character.class === "nelayan" || character.class === "pemanah";
      const lootMultiplier = isFisher ? 2 : 1;

      // Peluang: 60% Ikan, 40% Sampah
      const rand = Math.random();
      let pool = FISH_ITEMS;
      if (rand > 0.6) {
          pool = JUNK_ITEMS;
      }

      const placeholders = pool.map(() => '?').join(',');
      const possibleItems = db.prepare(`SELECT * FROM items WHERE code IN (${placeholders})`).all(...pool);
      
      if (possibleItems.length === 0) {
         return ctx.reply(`Kamu menunggu lama... tapi tidak ada yang menyambar umpanmu.\n\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`);
      }

      const numItemsToFind = Math.floor(Math.random() * 2) + 1;
      const selectedItems = shuffle(possibleItems).slice(0, numItemsToFind);

      let xpGained = 15;
      const itemsGained = [];
      const itemsLost = [];

      const carry = getCarryState(db, userId);
      let currentCarryWeight = carry.carry_weight;

      for (const item of selectedItems) {
        const itemAmount = (Math.floor(Math.random() * 2) + 1) * lootMultiplier;
        const itemWeight = item.weight || 1;
        const addedWeight = itemWeight * itemAmount;

        if (currentCarryWeight + addedWeight <= carry.max_carry_weight) {
           addItem(db, userId, item.code, itemAmount);
           addCarryWeight(db, userId, addedWeight);
           currentCarryWeight += addedWeight;
           itemsGained.push({ name: item.name, amount: itemAmount });
        } else {
           xpGained += 10 * itemAmount; // Kompensasi kalau penuh
           itemsLost.push({ name: item.name, amount: itemAmount });
        }
      }

      const leveled = addXp(db, userId, xpGained);

      const intros = [
          `Kail pancingmu bergetar hebat di perairan *${currentLocation}*!`,
          `Angin sepoi-sepoi menemani mancingmu di *${currentLocation}*. Tiba-tiba pelampungmu tenggelam!`,
          `Setelah menunggu cukup lama di *${currentLocation}*, akhirnya ada yang menyambar umpanmu!`,
          `Dengan tarikan napas panjang, kamu menarik pancingmu dari kedalaman *${currentLocation}*:`,
          `Tarik!! Tali pancingmu menegang di *${currentLocation}*, dan kamu berhasil mengangkat:`,
          `Air di *${currentLocation}* beriak tenang sebelum umpanmu disambar dengan ganas!`,
          `Sabar menunggu... BLUP! Pelampungmu ditarik keras ke dasar perairan *${currentLocation}*!`,
          `Kamu melempar pancing jauh ke tengah *${currentLocation}* dan menggulungnya perlahan:`,
          `Percikan air di *${currentLocation}* menandakan ada ikan besar! Kamu menarik pancingmu:`,
          `Tali pancingmu nyaris putus menahan tarikan kuat dari kedalaman *${currentLocation}*. Ternyata itu adalah:`
      ];
      let finalMessage = `${intros[Math.floor(Math.random() * intros.length)]}\n\n`;
      if (itemsGained.length > 0) {
          for (const item of itemsGained) {
              finalMessage += `🎣 *+${item.amount} ${item.name}*\n`;
          }
      }
      
      if (itemsLost.length > 0) {
          const totalLostXP = itemsLost.reduce((sum, item) => sum + (item.amount * 10), 0);
          finalMessage += `\n⚠️ Tas penuh! Kamu terpaksa membuangnya kembali ke air (*+${totalLostXP}* EXP): ${itemsLost.map(i => `${i.amount} ${i.name}`).join(', ')}.\n`;
      }
      
      finalMessage += `✨ *+${xpGained}* EXP\n`;
      if (isFisher) finalMessage += `\n🎯 _Sinergi Mancing:_ Hasil tangkapan berlipat ganda!`;
      finalMessage += `\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;

      await ctx.reply(finalMessage);

      if (leveled && leveled.leveledUp) {
          try {
              if (bot.sock) await bot.sock.sendMessage(ctx.sender, { text: `🎉 Selamat! Kamu naik ke *Level ${leveled.after.level}*!` });
          } catch(e) {}
      }
    }, { aliases: ["mancing"], category: "RPG", description: "Memancing ikan atau rongsokan dari perairan." });
}
