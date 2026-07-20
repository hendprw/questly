/**
 * db/repo/economy.js
 * ------------------
 * Menyimpan seluruh logika transaksi ekonomi, termasuk fungsi bawaan Botify
 * serta fungsi kustom (robPlayer, dll).
 */

export class InsufficientFundsError extends Error {
  constructor(message = "Saldo tidak cukup") {
    super(message);
    this.name = "InsufficientFundsError";
  }
}

function logTx(db, { userId, type, currency = "cash", amount, balanceAfter, relatedUserId = null, note = null }) {
  db.prepare(
    `INSERT INTO transactions (user_id, type, currency, amount, balance_after, related_user_id, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, type, currency, amount, balanceAfter, relatedUserId, note);
}

export function getWallet(db, userId) {
  return db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(userId);
}

export function addCash(db, userId, amount, { type = "adjust", note = null, relatedUserId = null } = {}) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Jumlah harus berupa angka valid dan lebih dari 0.");
  const apply = db.transaction(() => {
    const walletBefore = getWallet(db, userId);
    let toAdd = amount;
    // Limit dompet 200,000
    if (walletBefore.cash + toAdd > 200000) {
        toAdd = Math.max(0, 200000 - walletBefore.cash);
    }
    
    if (toAdd > 0) {
        db.prepare(`UPDATE wallets SET cash = cash + ?, updated_at = strftime('%s','now') WHERE user_id = ?`)
          .run(toAdd, userId);
    }
    const wallet = getWallet(db, userId);
    if (wallet.cash < 0) throw new InsufficientFundsError();
    logTx(db, { userId, type, amount: toAdd, balanceAfter: wallet.cash, note, relatedUserId });
    return wallet;
  });
  return apply();
}

export function removeCash(db, userId, amount, { type = "adjust", note = null, relatedUserId = null } = {}) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Jumlah harus berupa angka valid dan lebih dari 0.");
  const apply = db.transaction(() => {
    const walletBefore = getWallet(db, userId);
    if (walletBefore.cash < amount) throw new InsufficientFundsError();
    db.prepare(`UPDATE wallets SET cash = cash - ?, updated_at = strftime('%s','now') WHERE user_id = ?`)
      .run(amount, userId);
    const wallet = getWallet(db, userId);
    logTx(db, { userId, type, amount: -amount, balanceAfter: wallet.cash, note, relatedUserId });
    return wallet;
  });
  return apply();
}

export function deposit(db, userId, amount) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Jumlah harus berupa angka valid dan lebih dari 0.");
  const apply = db.transaction(() => {
    const wallet = getWallet(db, userId);
    if (wallet.cash < amount) throw new InsufficientFundsError();
    
    // Cek level untuk kapasitas bank
    const char = db.prepare("SELECT level FROM characters WHERE user_id = ?").get(userId);
    const level = char ? char.level : 1;
    const maxBankCapacity = 70000 + (Math.min(Math.floor(level / 10), 5) * 50000);

    if (wallet.bank + amount > maxBankCapacity) {
      throw new Error(`Melebihi kapasitas bank (Maks: ${maxBankCapacity.toLocaleString()})`);
    }
    db.prepare(
      `UPDATE wallets SET cash = cash - ?, bank = bank + ?, updated_at = strftime('%s','now') WHERE user_id = ?`
    ).run(amount, amount, userId);
    const updated = getWallet(db, userId);
    logTx(db, { userId, type: "bank_deposit", amount: -amount, balanceAfter: updated.cash, note: `deposit ${amount}` });
    logTx(db, { userId, type: "bank_deposit", currency: "bank", amount, balanceAfter: updated.bank });
    return updated;
  });
  return apply();
}

export function withdraw(db, userId, amount) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Jumlah harus berupa angka valid dan lebih dari 0.");
  const apply = db.transaction(() => {
    const wallet = getWallet(db, userId);
    if (wallet.bank < amount) throw new InsufficientFundsError("Saldo bank tidak cukup");
    db.prepare(
      `UPDATE wallets SET cash = cash + ?, bank = bank - ?, updated_at = strftime('%s','now') WHERE user_id = ?`
    ).run(amount, amount, userId);
    const updated = getWallet(db, userId);
    logTx(db, { userId, type: "bank_withdraw", amount, balanceAfter: updated.cash, note: `withdraw ${amount}` });
    logTx(db, { userId, type: "bank_withdraw", currency: "bank", amount: -amount, balanceAfter: updated.bank });
    return updated;
  });
  return apply();
}

export function transfer(db, fromUserId, toUserId, amount) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Jumlah harus berupa angka valid dan lebih dari 0.");
  const apply = db.transaction(() => {
    const sender = getWallet(db, fromUserId);
    if (sender.cash < amount) throw new InsufficientFundsError();
    db.prepare(`UPDATE wallets SET cash = cash - ? WHERE user_id = ?`).run(amount, fromUserId);
    db.prepare(`UPDATE wallets SET cash = cash + ? WHERE user_id = ?`).run(amount, toUserId);
    const senderAfter = getWallet(db, fromUserId);
    const receiverAfter = getWallet(db, toUserId);
    logTx(db, { userId: fromUserId, type: "transfer_out", amount: -amount, balanceAfter: senderAfter.cash, relatedUserId: toUserId });
    logTx(db, { userId: toUserId, type: "transfer_in", amount, balanceAfter: receiverAfter.cash, relatedUserId: fromUserId });
    return { sender: senderAfter, receiver: receiverAfter };
  });
  return apply();
}

// Alias fungsi untuk plugin transfer yang baru saja dibuat
export function transferCash(db, fromUserId, toUserId, amount) {
    return transfer(db, fromUserId, toUserId, amount);
}

export function getRecentTransactions(db, userId, limit = 10) {
  return db
    .prepare(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, limit);
}

// Logika Merampok (Rob)
export function robPlayer(db, robberId, targetId) {
  return db.transaction(() => {
    if (robberId === targetId) throw new Error("Kamu tidak bisa merampok diri sendiri.");

    const targetWallet = getWallet(db, targetId);
    if (!targetWallet) throw new Error("Target tidak ditemukan.");
    if (targetWallet.cash < 500) throw new Error("Target terlalu miskin untuk dirampok (Cash < 500).");

    const robberWallet = getWallet(db, robberId);
    if (!robberWallet) throw new Error("Dompetmu tidak ditemukan.");
    if (robberWallet.cash < 1000) throw new Error("Kamu butuh modal minimal 1.000 cash untuk jaga-jaga membayar denda jika gagal.");

    const isSuccess = Math.random() < 0.4;

    if (isSuccess) {
      const stealPercentage = (Math.floor(Math.random() * 11) + 10) / 100;
      const stolenAmount = Math.floor(targetWallet.cash * stealPercentage);

      db.prepare('UPDATE wallets SET cash = cash + ? WHERE user_id = ?').run(stolenAmount, robberId);
      db.prepare('UPDATE wallets SET cash = cash - ? WHERE user_id = ?').run(stolenAmount, targetId);

      const robAfter = getWallet(db, robberId);
      const tgtAfter = getWallet(db, targetId);

      logTx(db, { userId: robberId, type: "rob_success", amount: stolenAmount, balanceAfter: robAfter.cash, relatedUserId: targetId, note: "Merampok" });
      logTx(db, { userId: targetId, type: "robbed", amount: -stolenAmount, balanceAfter: tgtAfter.cash, relatedUserId: robberId, note: "Dirampok" });

      return { success: true, amount: stolenAmount };
    } else {
      const fineAmount = Math.floor(robberWallet.cash * 0.10);
      
      db.prepare('UPDATE wallets SET cash = cash - ? WHERE user_id = ?').run(fineAmount, robberId);
      const robAfter = getWallet(db, robberId);

      logTx(db, { userId: robberId, type: "rob_fine", amount: -fineAmount, balanceAfter: robAfter.cash, relatedUserId: targetId, note: "Denda merampok" });

      return { success: false, fine: fineAmount };
    }
  })();
}

/** Menambah Adventurer Tokens */
export function addTokens(db, userId, amount, meta = {}) {
  const apply = db.transaction(() => {
    db.prepare(`UPDATE wallets SET tokens = tokens + ?, updated_at = strftime('%s','now') WHERE user_id = ?`).run(amount, userId);
  });
  apply();
}

/** Mengurangi Adventurer Tokens */
export function removeTokens(db, userId, amount, meta = {}) {
  const apply = db.transaction(() => {
    const row = db.prepare(`SELECT tokens FROM wallets WHERE user_id = ?`).get(userId);
    if (!row || row.tokens < amount) throw new InsufficientFundsError('Tokens tidak cukup');
    db.prepare(`UPDATE wallets SET tokens = tokens - ?, updated_at = strftime('%s','now') WHERE user_id = ?`).run(amount, userId);
  });
  apply();
}