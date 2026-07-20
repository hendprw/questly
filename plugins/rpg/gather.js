import { consumeStamina, getAndRegenerateStamina } from "../../db/repo/stamina.js";
import { addItem } from "../../db/repo/items.js";
import { getFullProfile } from "../../db/repo/users.js";
import { getCarryState, addCarryWeight } from "../../db/repo/shop.js";
import { addXp } from "../../db/repo/leveling.js";

const STAMINA_COST = 5;
const GATHERABLE_ITEMS = [
    'wood', 'ash_wood', 'herb', 'wheat', 'potato', 'carrot', 'apple', 'heal_leaf', 'mint_leaf', 
    'sunflower_seed', 'ginseng_root', 'brown_mushroom', 'poison_spore', 
    'bitter_root', 'glow_mushroom', 'cave_moss', 'cactus_meat', 
    'fire_lotus_seed', 'iron_bamboo_shoot', 'frost_petal', 'sky_leaf', 'black_rose_petal', 'deep_sea_kelp', 'coral_branch'
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
  bot.command("gather", async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;

      const success = consumeStamina(db, userId, STAMINA_COST);
      if (!success) {
        return ctx.reply(`⏳ Lelah. Butuh ${STAMINA_COST} stamina untuk mengumpulkan tanaman.`);
      }

      const profile = getFullProfile(db, userId);
      const character = profile.character;
      const currentStamina = getAndRegenerateStamina(db, userId);
      const currentLocation = character.location || 'Hutan Pinus';

      const placeholders = GATHERABLE_ITEMS.map(() => '?').join(',');
      const possibleItems = db.prepare(`SELECT * FROM items WHERE locations LIKE ? AND code IN (${placeholders})`).all(`%"${currentLocation}"%`, ...GATHERABLE_ITEMS);
      
      if (possibleItems.length === 0) {
         return ctx.reply(`Kamu meraba semak-semak di *${currentLocation}*, tetapi hanya ada dedaunan layu.\n\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`);
      }

      const isForager = character.class === "petani" || character.class === "penyihir";
      const lootMultiplier = isForager ? 2 : 1;

      const numItemsToFind = Math.floor(Math.random() * 3) + 1;
      const selectedItems = shuffle(possibleItems).slice(0, numItemsToFind);

      let xpGained = 20;
      const itemsGained = [];
      const itemsLost = [];
      let totalWeightGained = 0;

      const carry = getCarryState(db, userId);
      let currentCarryWeight = carry.carry_weight;

      const equippedPet = db.prepare("SELECT items.metadata FROM inventory JOIN items ON inventory.item_id = items.id WHERE inventory.user_id = ? AND inventory.is_equipped = 1 AND items.equip_slot = 'pet'").get(userId);
      let hasLucky = false;
      if (equippedPet && equippedPet.metadata) {
          try {
              const meta = JSON.parse(equippedPet.metadata);
              if (meta.passive === 'lucky') hasLucky = true;
          } catch(e) {}
      }
      let petLog = "";

      for (const item of selectedItems) {
        let itemAmount = (Math.floor(Math.random() * 3) + 1) * lootMultiplier;
        if (hasLucky && Math.random() < 0.15) {
             itemAmount *= 2;
             petLog = "\n✨ _Navi menemukan sisa-sisa hasil alam yang tersembunyi (2x Loot)!_";
        }
        const itemWeight = item.weight || 0;
        const addedWeight = itemWeight * itemAmount;

        if (currentCarryWeight + addedWeight <= carry.max_carry_weight) {
           addItem(db, userId, item.code, itemAmount);
           addCarryWeight(db, userId, addedWeight);
           currentCarryWeight += addedWeight;
           itemsGained.push({ name: item.name, amount: itemAmount });
        } else {
           xpGained += 10 * itemAmount;
           itemsLost.push({ name: item.name, amount: itemAmount });
        }
      }

      const leveled = addXp(db, userId, xpGained);

      const intros = [
          `Kamu menyibak semak belukar di *${currentLocation}* dan mengumpulkan:`,
          `Matahari bersinar cerah. Kamu memanen hasil alam dari *${currentLocation}*:`,
          `Dengan teliti kamu memilah flora liar di *${currentLocation}* dan menemukan:`,
          `Aroma alam tercium kuat saat kamu mencari bahan di *${currentLocation}*, kamu mendapatkan:`,
          `Tanganmu meraba kelembapan tanah di *${currentLocation}* dan kamu memetik:`,
          `Di bawah naungan rimbun *${currentLocation}*, kamu menemukan bahan langka:`,
          `Dedaunan berguguran saat kamu berkeliling mencari tanaman di *${currentLocation}*. Kamu mendapatkan:`,
          `Mata jeli kamu menangkap bentuk familiar di sela-sela bebatuan *${currentLocation}*:`,
          `Kamu menyusuri area *${currentLocation}* yang belum tersentuh dan memanen hasil bumi:`,
          `Lututmu kotor karena merangkak mencari tunas di *${currentLocation}*. Kerja kerasmu terbayar:`
      ];
      let finalMessage = `${intros[Math.floor(Math.random() * intros.length)]}\n\n`;
      if (itemsGained.length > 0) {
          for (const item of itemsGained) {
              finalMessage += `🌿 *+${item.amount} ${item.name}*\n`;
          }
      }
      
      if (itemsLost.length > 0) {
          const totalLostXP = itemsLost.reduce((sum, item) => sum + (item.amount * 10), 0);
          finalMessage += `\n⚠️ Tas penuh! Item hancur dan jadi wawasan alam (*+${totalLostXP}* EXP): ${itemsLost.map(i => `${i.amount} ${i.name}`).join(', ')}.\n`;
      }
      
      finalMessage += `✨ *+${xpGained}* EXP\n`;
      if (isForager) finalMessage += `\n🎯 _Sinergi Pengumpul:_ Kamu paham titik tanaman subur! Hasil berlipat.`;
      finalMessage += `\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
      finalMessage += `\n${petLog}`;

      await ctx.reply(finalMessage.trim());

      if (leveled && leveled.leveledUp) {
          try {
              if (bot.sock) await bot.sock.sendMessage(ctx.sender, { text: `🎉 Selamat! Kamu naik *Level ${leveled.after.level}*!` });
          } catch(e) { console.error(e); }
      }
    }, { aliases: ["forage", "ambil", "memungut"], category: "RPG", description: "Mengumpulkan tanaman, kayu, dan bahan alami di sekitarmu." });
}
