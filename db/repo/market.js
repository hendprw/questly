/**
 * db/repo/market.js
 * -----------------
 * Porting `.market` (marketplace player-to-player) dari Orion RPG
 * (commands/rpg/market.js + database/models/MarketListing.js +
 * MarketDiscount.js). Mekanik & tampilan SENGAJA dibuat identik dengan
 * Orion (smart-parse jumlah "1k"/"all", pajak listing 5%, durasi 24 jam,
 * diskon event global, format pesan dengan tree-emoji ├/└). Bagian yang
 * DIUBAH dari Orion (dan kenapa) dicatat di komentar tiap fungsi.
 */
import { getItemByCode, addItem, removeItem, getInventoryItem } from "./items.js";
import { addCash, removeCash, InsufficientFundsError } from "./economy.js";
import { getCarryState, addCarryWeight } from "./shop.js";

export const LISTING_DURATION_HOURS = 24;
export const LISTING_TAX_PERCENTAGE = 5;

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

/** Parser angka "1k"/"1.5m"/"all" — identik dengan parseNum() Orion. */
export function parseAmount(input, maxVal = Infinity) {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number") return input;

  const s = String(input).toLowerCase();
  if (s === "all" || s === "max") return maxVal;

  let multiplier = 1;
  if (s.endsWith("k")) multiplier = 1_000;
  else if (s.endsWith("m")) multiplier = 1_000_000;
  else if (s.endsWith("b")) multiplier = 1_000_000_000;

  const val = parseFloat(s.replace(/[kmb]/g, ""));
  if (isNaN(val)) return null;
  return Math.floor(val * multiplier);
}

/** "1j 20m" sampai kadaluarsa — setara getRelativeTime() Orion. */
export function relativeTimeUntil(expiresAtSec) {
  const diff = expiresAtSec - nowSec();
  if (diff <= 0) return "Kadaluarsa";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}j ${m}m`;
}

export function getActiveDiscount(db) {
  return db
    .prepare(`SELECT * FROM market_discounts WHERE status = 'active' AND expires_at > ? ORDER BY id DESC LIMIT 1`)
    .get(nowSec());
}

/**
 * PERBAIKAN DARI ORION: di kode aslinya, listing yang lewat `expiresAt`
 * cuma "menghilang" dari hasil query (status tetap 'active' selamanya)
 * — barangnya nyangkut permanen, tidak pernah balik ke tas penjual, dan
 * tidak ada job/cron yang membereskannya.
 *
 * Di sini setiap listing yang sudah lewat expired disapu SECARA LAZY
 * (dipanggil di awal setiap operasi baca/tulis market) sebelum listing
 * dipakai: status diubah jadi 'expired' DAN barangnya otomatis
 * dikembalikan ke inventory penjual, dalam satu transaction.
 */
export function expireStaleListings(db) {
  const apply = db.transaction(() => {
    const stale = db
      .prepare(`SELECT * FROM market_listings WHERE status = 'active' AND expires_at <= ?`)
      .all(nowSec());

    for (const listing of stale) {
      addItem(db, listing.seller_user_id, listing.item_code, listing.quantity);
      const item = getItemByCode(db, listing.item_code);
      addCarryWeight(db, listing.seller_user_id, (item?.weight ?? 0) * listing.quantity);
      db.prepare(`UPDATE market_listings SET status = 'expired' WHERE id = ?`).run(listing.id);
    }
  });
  apply();
}

function sellerDisplayName(db, userId) {
  const u = db.prepare(`SELECT display_name, push_name FROM users WHERE id = ?`).get(userId);
  return u?.display_name || u?.push_name || "Petualang";
}

/**
 * Pasang listing baru. Melempar Error dengan pesan siap-tampil kalau gagal
 * (item tidak dikenal, stok kurang, tidak cukup cash buat pajak, dst) —
 * setara validasi berurutan di sellItem() Orion.
 */
export function createListing(db, sellerId, itemCode, amountInput, priceInput, note = null) {
  expireStaleListings(db);

  const apply = db.transaction(() => {
    const item = getItemByCode(db, itemCode);
    if (!item) throw new Error(`Item "${itemCode}" tidak dikenali.`);
    if (!item.tradeable) throw new Error(`*${item.name}* tidak bisa diperdagangkan.`);

    const owned = getInventoryItem(db, sellerId, itemCode);
    if (!owned) throw new Error(`Kamu tidak punya item *${item.name}*.`);
    if (owned.is_equipped) throw new Error(`*${item.name}* sedang dipakai — lepas dulu (!unequip) sebelum dijual.`);

    const amount = parseAmount(amountInput, owned.quantity);
    if (!amount || amount <= 0) throw new Error("Jumlah tidak valid.");
    if (owned.quantity < amount) throw new Error(`Stok kurang. Kamu cuma punya ${owned.quantity}x.`);

    const pricePerUnit = parseAmount(priceInput);
    if (!pricePerUnit || pricePerUnit <= 0) throw new Error("Harga tidak valid.");

    const totalPrice = amount * pricePerUnit;
    
    let taxPercentage = LISTING_TAX_PERCENTAGE;
    const char = db.prepare("SELECT ch.is_hero, c.passive_trait FROM characters ch JOIN classes c ON ch.class = c.code WHERE ch.user_id = ?").get(sellerId);
    
    if (char && char.is_hero === 1) {
        taxPercentage = 0; // Pahlawan bebas pajak!
    } else if (char && char.passive_trait) {
        try {
            const trait = JSON.parse(char.passive_trait);
            if (trait.skill === 'discount') {
                taxPercentage = LISTING_TAX_PERCENTAGE * (1 - trait.bonus); // Diskon 10% dari nominal pajak
            }
        } catch(e) {}
    }

    const tax = Math.ceil(totalPrice * (taxPercentage / 100));

    // PERBAIKAN DARI ORION: pajak di sana dipotong langsung dari field
    // `player.solari` tanpa tercatat di ledger manapun. Di sini pajak
    // WAJIB lewat removeCash() supaya masuk `transactions` (bisa diaudit,
    // konsisten dengan seluruh sistem ekonomi questly lainnya).
    try {
      removeCash(db, sellerId, tax, { type: "market_listing_tax", note: `pajak listing ${amount}x ${item.code}` });
    } catch (e) {
      if (e instanceof InsufficientFundsError) {
        throw new Error(`Kamu butuh ${tax.toLocaleString("id-ID")} untuk bayar pajak (${LISTING_TAX_PERCENTAGE}%).`);
      }
      throw e;
    }

    removeItem(db, sellerId, itemCode, amount);
    addCarryWeight(db, sellerId, -(item.weight ?? 0) * amount);

    const expiresAt = nowSec() + LISTING_DURATION_HOURS * 3600;
    const info = db
      .prepare(
        `INSERT INTO market_listings
           (seller_user_id, seller_name, item_id, item_code, item_name,
            quantity, price_per_unit, total_price, note, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(sellerId, sellerDisplayName(db, sellerId), item.id, item.code, item.name, amount, pricePerUnit, totalPrice, note, expiresAt);

    return { listing: getListingById(db, info.lastInsertRowid), tax };
  });

  return apply();
}

export function getListingById(db, id) {
  return db.prepare(`SELECT * FROM market_listings WHERE id = ?`).get(id);
}

export function searchListings(db, term, limit = 10) {
  expireStaleListings(db);
  if (term) {
    return db
      .prepare(
        `SELECT * FROM market_listings WHERE status = 'active' AND item_name LIKE ?
          ORDER BY price_per_unit ASC LIMIT ?`
      )
      .all(`%${term}%`, limit);
  }
  return db
    .prepare(`SELECT * FROM market_listings WHERE status = 'active' ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
}

export function randomListings(db, limit = 10) {
  expireStaleListings(db);
  return db
    .prepare(`SELECT * FROM market_listings WHERE status = 'active' ORDER BY RANDOM() LIMIT ?`)
    .all(limit);
}

export function getMyListings(db, sellerId) {
  expireStaleListings(db);
  return db
    .prepare(`SELECT * FROM market_listings WHERE seller_user_id = ? ORDER BY created_at DESC LIMIT 20`)
    .all(sellerId);
}

/**
 * Beli listing. PERBAIKAN DARI ORION: seluruh alur (cek stok, potong cash
 * pembeli, kredit penjual, kurangi stok listing) dibungkus SATU
 * db.transaction() dengan stok di-lock ulang di dalamnya — di Orion,
 * antara `findOne` dan `save()` ada celah non-atomik yang secara teori
 * bisa dobel-beli kalau dua pembeli menekan tombol nyaris bersamaan.
 * better-sqlite3 sinkron + transaction di sini menutup celah itu.
 */
export function buyListing(db, buyerId, listingId, amountInput) {
  expireStaleListings(db);

  const apply = db.transaction(() => {
    const listing = getListingById(db, listingId);
    if (!listing) throw new Error("Listing tidak ditemukan.");
    if (listing.status !== "active") throw new Error("Barang sudah terjual, dibatalkan, atau kadaluarsa.");
    if (listing.seller_user_id === buyerId) throw new Error("Jangan beli barang sendiri, nanti rugi pajak!");

    let amountToBuy = listing.quantity;
    if (amountInput) {
      amountToBuy = parseAmount(amountInput, listing.quantity);
      if (!amountToBuy || amountToBuy <= 0) throw new Error("Jumlah tidak valid.");
      if (amountToBuy > listing.quantity) throw new Error(`Stok sisa ${listing.quantity} saja.`);
    }

    const discount = getActiveDiscount(db);
    const priceTotalOriginal = listing.price_per_unit * amountToBuy;
    const finalPrice = discount
      ? Math.floor(priceTotalOriginal * (1 - discount.percentage / 100))
      : priceTotalOriginal;

    const item = getItemByCode(db, listing.item_code);
    const totalWeight = (item?.weight ?? 0) * amountToBuy;
    const carry = getCarryState(db, buyerId);
    if (carry.carry_weight + totalWeight > carry.max_carry_weight) {
      throw new Error("Tas penuh! Kelebihan beban.");
    }

    // Transaksi lewat economy.js supaya tercatat di ledger (beda dari Orion
    // yang mengubah field `solari` langsung tanpa logTx untuk sisi pembeli/penjual).
    try {
      removeCash(db, buyerId, finalPrice, { type: "market_buy", note: `${amountToBuy}x ${listing.item_code}`, relatedUserId: listing.seller_user_id });
    } catch (e) {
      if (e instanceof InsufficientFundsError) throw new Error(`Uang kurang! Butuh ${finalPrice.toLocaleString("id-ID")}.`);
      throw e;
    }
    // Penjual dapat harga ASLI listing (sistem yang menanggung selisih diskon event)
    // — pilihan QoL yang sama seperti Orion: "penjual happy, pembeli hemat".
    addCash(db, listing.seller_user_id, priceTotalOriginal, { type: "market_sale", note: `${amountToBuy}x ${listing.item_code}`, relatedUserId: buyerId });

    addItem(db, buyerId, listing.item_code, amountToBuy);
    addCarryWeight(db, buyerId, totalWeight);

    const remaining = listing.quantity - amountToBuy;
    if (remaining <= 0) {
      db.prepare(`UPDATE market_listings SET quantity = 0, total_price = 0, status = 'sold' WHERE id = ?`).run(listing.id);
    } else {
      db.prepare(
        `UPDATE market_listings SET quantity = ?, total_price = total_price - ? WHERE id = ?`
      ).run(remaining, priceTotalOriginal, listing.id);
    }

    return {
      amountToBuy,
      finalPrice,
      priceTotalOriginal,
      discount,
      itemName: listing.item_name,
      sellerUserId: listing.seller_user_id,
    };
  });

  return apply();
}

export function cancelListing(db, sellerId, listingId) {
  expireStaleListings(db);

  const apply = db.transaction(() => {
    const listing = getListingById(db, listingId);
    if (!listing || listing.seller_user_id !== sellerId) throw new Error("Listing tidak ditemukan/bukan milikmu.");
    if (listing.status !== "active") throw new Error("Barang sudah tidak aktif.");

    addItem(db, sellerId, listing.item_code, listing.quantity);
    const item = getItemByCode(db, listing.item_code);
    addCarryWeight(db, sellerId, (item?.weight ?? 0) * listing.quantity);
    db.prepare(`UPDATE market_listings SET status = 'cancelled' WHERE id = ?`).run(listing.id);

    return listing;
  });

  return apply();
}

// ── Diskon event (owner-only, dipakai plugins/ekonomi/marketdiscount.js) ──

export function createDiscount(db, createdBy, name, percentage, durationHours) {
  const active = getActiveDiscount(db);
  if (active) {
    throw new Error(`Masih ada diskon aktif: "${active.name}" (ID: ${active.id}). Hentikan dulu dengan !marketdiscount stop ${active.id}`);
  }

  const expiresAt = nowSec() + durationHours * 3600;
  const info = db
    .prepare(`INSERT INTO market_discounts (name, percentage, created_by, expires_at) VALUES (?, ?, ?, ?)`)
    .run(name, percentage, createdBy, expiresAt);

  return db.prepare(`SELECT * FROM market_discounts WHERE id = ?`).get(info.lastInsertRowid);
}

export function stopDiscount(db, discountId) {
  const discount = db.prepare(`SELECT * FROM market_discounts WHERE id = ? AND status = 'active'`).get(discountId);
  if (!discount) throw new Error(`Diskon dengan ID ${discountId} tidak ditemukan atau sudah tidak aktif.`);

  db.prepare(`UPDATE market_discounts SET status = 'inactive', expires_at = ? WHERE id = ?`).run(nowSec(), discountId);
  return discount;
}

export function listDiscounts(db, limit = 10) {
  return db.prepare(`SELECT * FROM market_discounts ORDER BY created_at DESC LIMIT ?`).all(limit);
}