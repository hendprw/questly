import fs from 'fs';
import path from 'path';

// 1. Revert index.js
const indexPath = path.resolve('index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace('import { t } from "./lib/i18n.js";\r\n', '');
indexContent = indexContent.replace('import { t } from "./lib/i18n.js";\n', '');
indexContent = indexContent.replace(
`  // i18n Language Setup per Group
  let lang = 'id'; // default
  if (ctx.from.endsWith('@g.us')) {
      const guildSet = db.prepare("SELECT language FROM guild_settings WHERE guild_id = ?").get(ctx.from);
      if (guildSet) lang = guildSet.language;
  }
  ctx.t = (key, args = {}) => t(key, lang, args);`,
""
);
fs.writeFileSync(indexPath, indexContent);

// 2. Revert class.js
const classPath = path.resolve('plugins/rpg/class.js');
let classContent = fs.readFileSync(classPath, 'utf8');
classContent = classContent.replace(
    'note = ctx.t("CLASS_PICKER_NOTE")',
    'note = "⚔️ *Pilih class kamu dulu, petualang!*"'
);
classContent = classContent.replace(
    'return ctx.reply(ctx.t("CLASS_ALREADY_PICKED", { name: existingClass.name }));',
    'return ctx.reply(`✅ Kamu sudah menjadi seorang *${existingClass.name}*. Class tidak bisa diganti lagi.`);'
);
classContent = classContent.replace(
    'return ctx.reply(ctx.t("CLASS_NOT_FOUND"));',
    'return ctx.reply("❌ Class tidak ditemukan. Pilih dari menu.");'
);
classContent = classContent.replace(
    'return ctx.reply(ctx.t("CLASS_CHOSEN", { name: cls.name, desc: cls.description }));',
    'return ctx.reply(`🎉 Berhasil! Kamu sekarang adalah seorang *${cls.name}*.\\n\\n_${cls.description}_`);'
);
classContent = classContent.replace(
    'if (bonus.passive_trait) desc += `\\n${ctx.t("CLASS_PASSIVE")}${bonus.passive_trait.desc}`;',
    'if (bonus.passive_trait) desc += `\\n🌟 Pasif: ${bonus.passive_trait.desc}`;'
);
classContent = classContent.replace(
    'if (bonus.passive_trait) desc += ` | ${ctx.t("CLASS_PASSIVE")}${bonus.passive_trait.desc}`;',
    'if (bonus.passive_trait) desc += ` | 🌟 Pasif: ${bonus.passive_trait.desc}`;'
);
fs.writeFileSync(classPath, classContent);

// 3. Revert leaderboard.js
const lbPath = path.resolve('plugins/rpg/leaderboard.js');
let lbContent = fs.readFileSync(lbPath, 'utf8');
lbContent = lbContent.replace(
    'let msg = `*${ctx.t("LEADERBOARD_TITLE")}*\\n\\n`;',
    'let msg = `*--- 🏆 PAPAN PERINGKAT 🏆 ---*\\n\\n`;'
);
lbContent = lbContent.replace(
    'msg += `*${i + 1}. ${p.name}*\\n  ${ctx.t("LEADERBOARD_LVL")} ${p.level} | 💰 ${(p.cash || 0).toLocaleString("id-ID")}\\n`;',
    'msg += `*${i + 1}. ${p.name}*\\n  Lv. ${p.level} | 💰 ${(p.cash || 0).toLocaleString("id-ID")}\\n`;'
);
fs.writeFileSync(lbPath, lbContent);

// 4. Revert profile.js
const profilePath = path.resolve('plugins/rpg/profile.js');
let profileContent = fs.readFileSync(profilePath, 'utf8');
profileContent = profileContent.replace(
`      const titleStr = ctx.t('PROFILE_TITLE');
      const lvStr = ctx.t('PROFILE_LV');
      const jobStr = ctx.t('PROFILE_JOB');
      const wealthStr = ctx.t('PROFILE_WEALTH');
      const statStr = ctx.t('PROFILE_STATS');
      const equipStr = ctx.t('PROFILE_EQUIPMENT');
      const noEquipStr = ctx.t('PROFILE_NO_EQUIPMENT');
      
      const unemployedStr = ctx.t('PROFILE_JOB_UNEMPLOYED');
      const jobDisplay = job ? \`[\${job.rank}] \${job.name}\` : unemployedStr;

      let msg = \`*--- 📜 \${titleStr} ---*\\n\\n\`;
      msg += \`👤 *\${name}* (\${lvStr}. \${leveling.level})\\n\`;
      msg += \`✨ *Class:* \${className}\\n\`;
      msg += \`⚒️ *\${jobStr}:* \${jobDisplay}\\n\`;
      msg += \`💰 *\${wealthStr}:* \${wallet.cash.toLocaleString("id-ID")} Aester\\n\\n\`;

      msg += \`*--- 📊 \${statStr} ---*\\n\`;
      msg += \`❤️ HP: \${stats.maxHp}\\n\`;
      msg += \`💧 MP: \${stats.maxMp}\\n\`;
      msg += \`⚔️ ATK: \${stats.attack}  |  🛡️ DEF: \${stats.defense}\\n\`;
      msg += \`🏃 SPD: \${stats.speed}   |  🍀 LUK: \${stats.luck}\\n\`;
      msg += \`🌟 STA: \${stats.maxStamina}\\n\\n\`;

      msg += \`*--- 🎒 \${equipStr} ---*\\n\`;
      if (equipments.length === 0) {
        msg += \`_\${noEquipStr}_\\n\`;
      } else {
        for (const e of equipments) {
            msg += \`  - \${e.name} (\${e.slot})\\n\`;
        }
      }`,
`      const jobDisplay = job ? \`[\${job.rank}] \${job.name}\` : "Pengangguran";
      
      let msg = \`*--- 📜 KARTU PETUALANG ---*\\n\\n\`;
      msg += \`👤 *\${name}* (Lv. \${leveling.level})\\n\`;
      msg += \`✨ *Class:* \${className}\\n\`;
      msg += \`⚒️ *Profesi:* \${jobDisplay}\\n\`;
      msg += \`💰 *Kekayaan:* \${wallet.cash.toLocaleString("id-ID")} Aester\\n\\n\`;

      msg += \`*--- 📊 STATUS DASAR ---*\\n\`;
      msg += \`❤️ HP: \${stats.maxHp}\\n\`;
      msg += \`💧 MP: \${stats.maxMp}\\n\`;
      msg += \`⚔️ ATK: \${stats.attack}  |  🛡️ DEF: \${stats.defense}\\n\`;
      msg += \`🏃 SPD: \${stats.speed}   |  🍀 LUK: \${stats.luck}\\n\`;
      msg += \`🌟 STA: \${stats.maxStamina}\\n\\n\`;

      msg += \`*--- 🎒 EQUIPMENT ---*\\n\`;
      if (equipments.length === 0) {
        msg += \`_Kosong (Tidak pakai apa-apa)_\\n\`;
      } else {
        for (const e of equipments) {
            msg += \`  - \${e.name} (\${e.slot})\\n\`;
        }
      }`
);
profileContent = profileContent.replace(
    'ctx.t(\'PROFILE_NO_CLASS\')',
    '"📋 Kamu belum memilih class! Pilih dulu biar kartu petualangmu aktif:"'
);
fs.writeFileSync(profilePath, profileContent);

console.log('Revert done!');
