import { consumeStamina, getAndRegenerateStamina } from "../../db/repo/stamina.js";
import { addItem, degradeEquippedItems } from "../../db/repo/items.js";
import { addCash } from "../../db/repo/economy.js";
import { getFullProfile } from "../../db/repo/users.js";
import { getCarryState, addCarryWeight } from "../../db/repo/shop.js";
import { addXp } from "../../db/repo/leveling.js";

const STAMINA_COST = 10;
const FAUNA_ITEMS = [
    'venison', 'deer_antler', 'bear_pelt', 'snow_wolf_fang', 'fire_fox_tail',
    'boar_spike', 'owl_eye', 'lizard_scale', 'seal_oil', 'bat_wing', 
    'mountain_lion_fang', 'chicken_egg', 'cow_milk', 'beef', 'wool', 'pork', 
    'duck_egg', 'rabbit_fur', 'horse_hair', 'beeswax', 'turkey_meat', 'quail_egg'
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
  bot.command("hunt", async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;

      let currentStamina = getAndRegenerateStamina(db, userId);
      if (currentStamina.stamina < STAMINA_COST) {
        return ctx.reply(`⏳ Kamu tidak punya cukup stamina untuk berburu. Butuh ${STAMINA_COST} stamina.`);
      }

      const profile = getFullProfile(db, userId);
      const character = profile.character;
      const currentLocation = character.location || 'Hutan Pinus';
      const isHunter = character.class === "pemanah" || character.class === "assassin";

      // 🎲 RANDOM EVENT LOGIC
      const rand = Math.random();
      let eventType = 'hunt_normal';

      if (rand < 0.10) {
          eventType = 'egg_rare'; // 10%
      } else if (rand < 0.25) {
          eventType = 'trap_danger'; // 15%
      } else if (rand < 0.45) {
          eventType = 'caravan_cash'; // 20%
      } else {
          eventType = 'hunt_normal'; // 55%
      }

      // Potong stamina normal dulu
      consumeStamina(db, userId, STAMINA_COST);
      currentStamina = getAndRegenerateStamina(db, userId);
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

      let finalMessage = `Kamu menjelajahi *${currentLocation}*...\n\n`;

      // 1. EVENT: TRAP / DANGER / BANDIT
      if (eventType === 'trap_danger') {
          const isBandit = Math.random() < 0.5;
          if (isBandit) {
              const myWallet = getWallet(db, userId);
              const stolenAmount = Math.floor(myWallet.cash * (Math.floor(Math.random() * 6) + 5) / 100); // 5-10%
              if (stolenAmount > 0) {
                  removeCash(db, userId, stolenAmount, { type: "robbed_npc", note: "Dirampok Bandit Hutan" });
                  finalMessage += `🥷 **DISERGAP BANDIT!** Sekelompok bandit liar muncul dari semak-semak dan menodongmu!\nKamu kehilangan **${stolenAmount.toLocaleString()} Aester**.\n\n✨ *+5* EXP\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
              } else {
                  finalMessage += `🥷 **DISERGAP BANDIT!** Sekelompok bandit mencegatmu, tapi mereka kasihan melihat dompetmu kosong lalu membiarkanmu pergi.\n\n✨ *+5* EXP\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
              }
          } else {
              // Hilang ekstra 5 stamina
              if (currentStamina.stamina >= 5) {
                  consumeStamina(db, userId, 5);
              }
              currentStamina = getAndRegenerateStamina(db, userId);
              finalMessage += `⚠️ *Gawat!* Kamu terjerumus ke dalam lubang perangkap monster. Kamu harus merangkak keluar dan kehilangan ekstra tenaga.\n\n✨ *+5* EXP\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
          }
          addXp(db, userId, 5);
          return ctx.reply(finalMessage);
      }

      // 2. EVENT: CARAVAN / MONEY
      if (eventType === 'caravan_cash') {
          const aesterFound = Math.floor(Math.random() * 200) + 100;
          addCash(db, userId, aesterFound, { note: 'Random Event Hunt' });
          addXp(db, userId, 25);
          finalMessage += `💰 *Beruntung!* Kamu menemukan sisa-sisa kereta saudagar yang diserang. Ada kantong uang tersembunyi!\n\n🪙 *+${aesterFound} Aester*\n✨ *+25* EXP\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
          return ctx.reply(finalMessage);
      }

      // 3. EVENT: EGG / RARE
      if (eventType === 'egg_rare') {
          if (currentCarryWeight + 1 <= carry.max_carry_weight) {
             let qty = 1;
             if (hasLucky && Math.random() < 0.15) {
                 qty = 2;
                 petLog = "\n✨ _Navi si Peri Hutan menemukan ekstra Telur Misterius!_";
             }
             addItem(db, userId, 'mysterious_egg', qty);
             addCarryWeight(db, userId, qty);
             finalMessage += `🍀 **KEBERUNTUNGAN!** Kamu menemukan *Sarang Monster Misterius*!\nDi dalamnya terdapat **${qty}x Telur Misterius** (mysterious_egg)!\n\n_(Gunakan \`!hatch start\` untuk menetaskannya)_\n\n✨ *+50* EXP\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
             addXp(db, userId, 50);
             finalMessage += `${petLog}`;
             return ctx.reply(finalMessage);
          } else {
             // Tas penuh, rubah jadi stat murni
             finalMessage += `🍀 **SAYANG SEKALI!** Kamu menemukan Sarang Telur, tapi tasmu penuh.\nSebagai gantinya, kamu memakan telur itu di tempat.\n\n✨ *+100* EXP\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
             addXp(db, userId, 100);
             return ctx.reply(finalMessage);
          }
      } 

      // 4. EVENT: HUNT NORMAL (Fauna)
      const placeholders = FAUNA_ITEMS.map(() => '?').join(',');
      const possibleItems = db.prepare(`SELECT * FROM items WHERE locations LIKE ? AND code IN (${placeholders})`).all(`%"${currentLocation}"%`, ...FAUNA_ITEMS);
      
      if (possibleItems.length === 0) {
         finalMessage += `Kamu tidak menemukan jejak hewan apapun hari ini.\n\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
         return ctx.reply(finalMessage);
      }

      const lootMultiplier = isHunter ? 2 : 1;
      const numItemsToFind = Math.floor(Math.random() * 3) + 1;
      const selectedItems = shuffle(possibleItems).slice(0, numItemsToFind);

      let xpGained = 25;
      const itemsGained = [];
      const itemsLost = [];

      for (const item of selectedItems) {
        let itemAmount = (Math.floor(Math.random() * 2) + 1) * lootMultiplier;
        if (hasLucky && Math.random() < 0.15) {
             itemAmount *= 2;
             petLog = "\n✨ _Navi si Peri Hutan menggandakan hasil buruanmu!_";
        }
        const itemWeight = item.weight || 0;
        const addedWeight = itemWeight * itemAmount;

        if (currentCarryWeight + addedWeight <= carry.max_carry_weight) {
           addItem(db, userId, item.code, itemAmount);
           addCarryWeight(db, userId, addedWeight);
           currentCarryWeight += addedWeight;
           itemsGained.push({ name: item.name, amount: itemAmount });
        } else {
           xpGained += 15 * itemAmount;
           itemsLost.push({ name: item.name, amount: itemAmount });
        }
      }

      const leveled = addXp(db, userId, xpGained);

      if (itemsGained.length > 0) {
          for (const item of itemsGained) {
              finalMessage += `🍖 *+${item.amount} ${item.name}*\n`;
          }
      }
      if (itemsLost.length > 0) {
          const totalLostXP = itemsLost.reduce((sum, item) => sum + (item.amount * 15), 0);
          finalMessage += `\n⚠️ Tas penuh! Daging membusuk diganti menjadi Insting Berburu (*+${totalLostXP}* EXP).\n`;
      }
      
      finalMessage += `\n✨ *+${xpGained}* EXP`;
      if (isHunter) finalMessage += `\n🎯 _Sinergi Pemburu:_ Insting tajam! Loot berlipat ganda.`;
      finalMessage += `\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`;
      finalMessage += `${petLog}`;
      
      const broken = degradeEquippedItems(db, userId);
      if (broken.length > 0) {
          finalMessage += `\n\n⚠️ *PERINGATAN:* Peralatan hancur dan dilepas: ${broken.map(b => b.name).join(", ")}! Segera perbaiki di Blacksmith.`;
      }

      await ctx.reply(finalMessage.trim());

      if (leveled && leveled.leveledUp) {
          try {
              if (bot.sock) await bot.sock.sendMessage(ctx.sender, { text: `🎉 Selamat! Kamu naik ke *Level ${leveled.after.level}*!` });
          } catch(e) { console.error(e); }
      }
    }, { aliases: ["berburu"], category: "RPG", description: "Mengintai hewan buas dan random event (hati-hati jebakan!)." });
}