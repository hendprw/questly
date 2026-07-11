/**
 * plugin: help
 * ------------
 * Menampilkan daftar command dikelompokkan per kategori, dengan tampilan
 * kotak (box-drawing) + emoji per kategori — gaya yang sama seperti menu
 * Orion, tapi datanya tetap otomatis dari `bot.plugins.listByCategory()`
 * (jadi nambah command baru tidak perlu sentuh file ini).
 *
 * Nama command utamanya `help` (alias: `menu`) — sama seperti Orion, yang
 * command-nya bernama `help` dengan alias `menu`/`h`/`perintah`.
 *
 * `!help` (tanpa argumen)   → daftar semua command, dikemas padat per baris.
 * `!help <command>`         → detail satu command (alias, kategori, deskripsi,
 *                              cooldown/owner/admin), mirip `.help <command>`
 *                              di Orion.
 *
 * Command tanpa `category` masuk ke grup "Lainnya".
 */

// Emoji + urutan tampil per kategori. Kategori yang belum didaftarkan di
// sini (mis. kategori baru yang lupa ditambahkan) tetap muncul di akhir
// dengan emoji default 📁, supaya tidak ada command yang "hilang" dari menu.
const CATEGORY_ORDER = ["RPG", "Ekonomi", "Umum", "Admin"];
const CATEGORY_EMOJI = {
  RPG: "⚔️",
  Ekonomi: "💰",
  Umum: "⚙️",
  Admin: "👑",
  Lainnya: "📁",
};

const MAX_LINE_LENGTH = 28;

export default function (bot) {
  bot.command(
    "help",
    async (ctx) => {
      const prefix = bot.options.prefix;
      const query = ctx.args[0]?.toLowerCase();

      if (query) {
        return ctx.reply(renderDetail(bot, query, prefix));
      }

      await ctx.reply(renderMenu(bot, ctx, prefix));
    },
    {
      aliases: ["menu"],
      category: "Umum",
      description: "Tampilkan daftar command (atau detail: !help <command>)",
    }
  );
}

// ── Tampilan utama (daftar semua command) ──────────────────────────────────

function renderMenu(bot, ctx, prefix) {
  const grouped = bot.plugins.listByCategory();
  const name = ctx.pushName || "Petualang";

  // Urutkan kategori sesuai CATEGORY_ORDER dulu, sisanya (kategori baru
  // yang belum masuk daftar) menyusul di belakang.
  const categories = [...grouped.keys()].map((c) => (c === "uncategorized" ? "Lainnya" : c));
  const known = CATEGORY_ORDER.filter((c) => categories.includes(c));
  const rest = categories.filter((c) => !CATEGORY_ORDER.includes(c)).sort();
  const orderedLabels = [...known, ...rest];

  const sections = orderedLabels.map((label) => {
    const key = label === "Lainnya" ? "uncategorized" : label;
    const commands = grouped.get(key) ?? [];
    return renderCategory(label, commands, prefix);
  });

  return [
    `👋 Halo *${name}*! Berikut daftar perintah yang bisa kamu pakai.`,
    "",
    sections.join("\n\n"),
    "",
    `💡 Ketik \`${prefix}help <command>\` untuk detail satu perintah.`,
  ].join("\n");
}

function renderCategory(label, commands, prefix) {
  const emoji = CATEGORY_EMOJI[label] ?? "📁";
  if (commands.length === 0) {
    return `╭─ • ${emoji} *${label.toUpperCase()}*\n│ _(belum ada command)_\n╰────`;
  }

  // Command terpendek dulu — biar yang pendek-pendek gampang dipadatkan
  // jadi satu baris (trik yang sama seperti menu Orion).
  const sorted = [...commands].sort((a, b) => a.name.length - b.name.length);

  const lines = [];
  let currentLine = "";
  for (const c of sorted) {
    const token = `\`${prefix}${c.name}\``;
    const candidate = currentLine ? `${currentLine}  ${token}` : token;
    if (candidate.length > MAX_LINE_LENGTH && currentLine) {
      lines.push(currentLine);
      currentLine = token;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);

  const body = lines.map((l) => `│ ${l}`).join("\n");
  return `╭─ • ${emoji} *${label.toUpperCase()}* (${commands.length})\n${body}\n╰────`;
}

// ── Tampilan detail satu command ────────────────────────────────────────────

function renderDetail(bot, query, prefix) {
  const all = bot.plugins.list();
  const command =
    all.find((c) => c.name === query) ??
    all.find((c) => c.aliases.includes(query));

  if (!command) {
    return `❌ Command \`${query}\` tidak ditemukan. Ketik \`${prefix}help\` untuk lihat semua command.`;
  }

  const label = command.category ?? "Lainnya";
  const emoji = CATEGORY_EMOJI[label] ?? "📁";
  const flags = [
    command.owner ? "👑 Owner only" : "",
    command.admin ? "🛡️ Admin only" : "",
    command.cooldown ? `⏱️ Cooldown ${command.cooldown / 1000}s` : "",
  ].filter(Boolean);

  const lines = [
    "╭─ • 「 *Detail Command* 」",
    "│",
    `│ *Perintah:* \`${prefix}${command.name}\``,
  ];

  if (command.aliases.length) {
    lines.push(`│ *Alias:* ${command.aliases.map((a) => `\`${prefix}${a}\``).join(", ")}`);
  }
  lines.push(`│ *Kategori:* ${emoji} ${label}`);
  if (flags.length) lines.push(`│ *Catatan:* ${flags.join(" · ")}`);
  lines.push("│");
  lines.push(`│ *Deskripsi:*`);
  lines.push(`│ _${command.description || "(belum ada deskripsi)"}_`);

  if (command.subcommands.length) {
    lines.push("│");
    lines.push("│ *Sub-command:*");
    for (const s of command.subcommands) {
      lines.push(`│  ↳ \`${prefix}${command.name} ${s.name}\`${s.description ? ` — ${s.description}` : ""}`);
    }
  }

  lines.push("╰─────────────────");
  return lines.join("\n");
}