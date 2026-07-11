# RPG Economy Bot (Botify + SQLite)

Base project ini dibuat pakai CLI resmi Botify:

```bash
npx botify-wa build rpg-bot
```

Struktur folder **rpg-bot/** di sini = hasil `build` itu (index.js, config.bt,
plugins/ping.js, plugins/menu.js, plugins/admin.js, plugins/info.js — semua
bawaan CLI, tidak diubah), ditambah:

```
rpg-bot/
├── index.js            ← dipatch: setup SQLite + load 3 folder kategori plugin
├── config.bt           ← bawaan CLI, tidak diubah (cuma komentar [plugins] ditambah)
├── package.json        ← ditambah dependency better-sqlite3
├── db/
│   ├── connection.js    (buka koneksi + PRAGMA)
│   ├── migrate.js       (migration runner, versioned)
│   ├── migrations/
│   │   └── 001_init.sql (schema lengkap)
│   ├── seed.js          (isi data master: jobs & items)
│   ├── reset.js         (npm run db:reset)
│   └── repo/            (satu file = satu domain, ini query layer-nya)
│       ├── users.js
│       ├── economy.js
│       ├── leveling.js
│       ├── items.js
│       └── cooldowns.js
├── lib/
│   └── format.js        (helper format uang, progress bar)
└── plugins/              ← SISTEM PLUGIN PER-COMMAND, dikelompokkan per kategori
    ├── core/             ← utilitas bawaan CLI
    │   ├── ping.js, info.js, menu.js, admin.js
    ├── ekonomi/          ← ekonomi & pekerjaan
    │   ├── balance.js   → !balance
    │   ├── daily.js     → !daily
    │   ├── work.js      → !jobs, !hire, !work
    │   ├── bank.js      → !deposit, !withdraw
    │   ├── give.js      → !give @user <jumlah>
    │   └── shop.js      → !shop, !buy, !sell
    └── rpg/              ← karakter & progres
        ├── profile.js   → !profile
        ├── inventory.js → !inventory
        └── leaderboard.js → !leaderboard [cash]
```

**Setiap file = command sendiri**, dikelompokkan per kategori biar tidak
numpuk semua di satu folder. Nambah command baru = bikin file baru di
subfolder kategori yang sesuai (atau bikin kategori baru + satu baris
`loadPlugins()` lagi di `index.js`) — tidak perlu sentuh file lain.

> Kenapa harus dipanggil per-subfolder di `index.js`? `loadPlugins()` bawaan
> Botify cuma baca file `.js` di level teratas folder yang dikasih (subfolder
> sengaja diabaikan oleh library-nya), jadi supaya bisa dikategorikan ke
> subfolder, `index.js` manggil `loadPlugins()` tiga kali — sekali per
> kategori (`./plugins/core`, `./plugins/ekonomi`, `./plugins/rpg`).

## Cara jalanin

```bash
cd rpg-bot
npm install     # install botify-wa (lokal) + better-sqlite3
node index.js   # scan QR, bot online, data/rpg.db otomatis dibuat
```

`data/rpg.db` dibuat otomatis saat pertama kali start (migration + seed job/
item jalan sendiri). Reset total: `npm run db:reset`.

## Kenapa struktur DB-nya "future-proof"

- **`users` cuma identitas.** Saldo, level, stat, dst masing-masing di
  tabel sendiri (FK ke `users.id`) — subsistem baru gak perlu ubah tabel user.
- **Stat RPG pakai pola EAV** (`user_stats`, `user_settings`) — nambah stat
  atau preferensi baru = `INSERT` baris, bukan `ALTER TABLE`.
- **Kolom `metadata` (JSON)** ada di tabel-tabel utama sebagai "escape hatch"
  buat properti kecil yang belum kepikiran sekarang.
- **`transactions` = ledger.** Semua perubahan saldo (daily/work/shop/
  transfer) tercatat, gampang diaudit / dipakai fitur pajak & leaderboard
  kekayaan nanti.
- Sudah disiapkan tabel untuk fitur lanjutan yang belum dipakai plugin
  manapun tapi schema-nya sudah ada: `guilds`/`guild_members`, `quests`/
  `user_quests`, `achievements`, `pets`, `equipment`, `currencies` (multi
  mata uang). Tinggal bikin repo + plugin baru, gak perlu migration ulang
  dari nol.
- **Migration bertahap** (`db/migrations/00N_*.sql`) — nambah fitur besar
  nanti (mis. `002_add_pvp.sql`) tinggal taruh file baru, dijalankan
  otomatis & tercatat di `schema_migrations`.

## Command yang sudah jadi

| Command | Fungsi |
|---|---|
| `!profile` (`!p`) | Lihat level, XP, saldo, HP/MP/energy, stat |
| `!balance` (`!bal`) | Cek cash/bank/gems |
| `!daily` | Klaim hadiah harian + bonus streak |
| `!jobs` / `!hire <kode>` / `!work` | Sistem pekerjaan |
| `!deposit <jml>` / `!withdraw <jml>` | Bank |
| `!give @user <jml>` | Transfer cash |
| `!shop` / `!buy <kode> [jml]` / `!sell <kode> [jml]` | Toko item |
| `!inventory` (`!inv`) | Lihat inventory |
| `!leaderboard` / `!leaderboard cash` | Ranking level / kekayaan |

Semua otomatis muncul di `!menu` (grouping per `category`, bawaan template).
