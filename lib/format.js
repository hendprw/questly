export function money(amount) {
  return `Rp${Number(amount).toLocaleString("id-ID")}`;
}

export function progressBar(current, max, length = 10) {
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  const filled = Math.round(ratio * length);
  return "█".repeat(filled) + "░".repeat(length - filled);
}
