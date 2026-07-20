import fs from 'fs';
import path from 'path';

const idPath = path.resolve('locales/id.json');
const enPath = path.resolve('locales/en.json');

const idLocales = JSON.parse(fs.readFileSync(idPath, 'utf8'));
const enLocales = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function addKey(key, idVal, enVal) {
    idLocales[key] = idVal;
    enLocales[key] = enVal;
}

// Tambahkan kunci untuk Phase 1
addKey("CLASS_PICKER_NOTE", "⚔️ *Pilih class kamu dulu, petualang!*", "⚔️ *Choose your class first, adventurer!*");
addKey("CLASS_ALREADY_PICKED", "✅ Kamu sudah menjadi seorang *{name}*. Class tidak bisa diganti lagi.", "✅ You are already a *{name}*. Class cannot be changed anymore.");
addKey("CLASS_CHOSEN", "🎉 Berhasil! Kamu sekarang adalah seorang *{name}*.\n\n_{desc}_", "🎉 Success! You are now a *{name}*.\n\n_{desc}_");
addKey("CLASS_NOT_FOUND", "❌ Class tidak ditemukan. Pilih dari tombol di bawah.", "❌ Class not found. Choose from the buttons below.");
addKey("CLASS_PASSIVE", "🌟 Pasif: ", "🌟 Passive: ");

addKey("LEADERBOARD_TITLE", "--- 🏆 PAPAN PERINGKAT 🏆 ---", "--- 🏆 LEADERBOARD 🏆 ---");
addKey("LEADERBOARD_RANK", "Peringkat", "Rank");
addKey("LEADERBOARD_LVL", "Level", "Level");
addKey("LEADERBOARD_WEALTH", "Kekayaan", "Wealth");
addKey("LEADERBOARD_EMPTY", "Belum ada pemain yang terdaftar.", "No players registered yet.");

fs.writeFileSync(idPath, JSON.stringify(idLocales, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enLocales, null, 4));

// Modifikasi class.js
const classPath = path.resolve('plugins/rpg/class.js');
let classContent = fs.readFileSync(classPath, 'utf8');

classContent = classContent.replace(
    'note = "⚔️ *Pilih class kamu dulu, petualang!*"',
    'note = ctx.t("CLASS_PICKER_NOTE")'
);

classContent = classContent.replace(
    'return ctx.reply(`✅ Kamu sudah menjadi seorang *${existingClass.name}*. Class tidak bisa diganti lagi.`);',
    'return ctx.reply(ctx.t("CLASS_ALREADY_PICKED", { name: existingClass.name }));'
);

classContent = classContent.replace(
    'return ctx.reply("❌ Class tidak ditemukan. Pilih dari menu.");',
    'return ctx.reply(ctx.t("CLASS_NOT_FOUND"));'
);

classContent = classContent.replace(
    'return ctx.reply(`🎉 Berhasil! Kamu sekarang adalah seorang *${cls.name}*.\n\n_${cls.description}_`);',
    'return ctx.reply(ctx.t("CLASS_CHOSEN", { name: cls.name, desc: cls.description }));'
);

classContent = classContent.replace(
    'if (bonus.passive_trait) desc += `\\n🌟 Pasif: ${bonus.passive_trait.desc}`;',
    'if (bonus.passive_trait) desc += `\\n${ctx.t("CLASS_PASSIVE")}${bonus.passive_trait.desc}`;'
);
classContent = classContent.replace(
    'if (bonus.passive_trait) desc += ` | 🌟 Pasif: ${bonus.passive_trait.desc}`;',
    'if (bonus.passive_trait) desc += ` | ${ctx.t("CLASS_PASSIVE")}${bonus.passive_trait.desc}`;'
);

fs.writeFileSync(classPath, classContent);

// Modifikasi leaderboard.js
const lbPath = path.resolve('plugins/rpg/leaderboard.js');
let lbContent = fs.readFileSync(lbPath, 'utf8');

lbContent = lbContent.replace(
    'let msg = `*--- 🏆 PAPAN PERINGKAT 🏆 ---*\\n\\n`;',
    'let msg = `*${ctx.t("LEADERBOARD_TITLE")}*\\n\\n`;'
);

lbContent = lbContent.replace(
    'msg += `*${i + 1}. ${p.name}*\\n  Lv. ${p.level} | 💰 ${(p.cash || 0).toLocaleString("id-ID")}\\n`;',
    'msg += `*${i + 1}. ${p.name}*\\n  ${ctx.t("LEADERBOARD_LVL")} ${p.level} | 💰 ${(p.cash || 0).toLocaleString("id-ID")}\\n`;'
);

fs.writeFileSync(lbPath, lbContent);

console.log("Patcher selesai!");
