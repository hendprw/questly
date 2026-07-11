/**
 * Format cash/bank sebagai mata uang in-game "Aster" (bukan Rupiah).
 * Dipusatkan di sini supaya SEMUA command (shop, bank, daily, work, hunt,
 * rob, give, dst) otomatis konsisten kalau nama/simbolnya mau diganti lagi.
 */
export function money(amount) {
  return `${Number(amount).toLocaleString("id-ID")} ✧Aster`;
}

export function progressBar(current, max, length = 10) {
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  const filled = Math.round(ratio * length);
  return "█".repeat(filled) + "░".repeat(length - filled);
}