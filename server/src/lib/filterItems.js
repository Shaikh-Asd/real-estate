/**
 * @param {Array<{ _nl: string; _cl: string }>} all indexed items
 * @param {string} q lowercased trimmed query
 */
export function filterIndexed(all, q) {
  if (!q) return all;
  const out = [];
  for (let i = 0; i < all.length; i++) {
    const it = all[i];
    if (it._nl.includes(q) || it._cl.includes(q)) out.push(it);
  }
  return out;
}
