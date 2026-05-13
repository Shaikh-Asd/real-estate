import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ITEMS_PATH = path.join(__dirname, "../../data/items.json");

let itemsCache = null;
let statsCache = null;
let loadPromise = null;
let watchDebounce = null;

function indexForSearch(raw) {
  if (!Array.isArray(raw)) throw new Error("items.json must be a JSON array");
  return raw.map((it) => ({
    ...it,
    _nl: String(it.name).toLowerCase(),
    _cl: String(it.category).toLowerCase(),
  }));
}

export function invalidateCache() {
  itemsCache = null;
  statsCache = null;
  loadPromise = null;
}

async function readItemsFromDisk() {
  const raw = await fs.readFile(ITEMS_PATH, "utf8");
  return indexForSearch(JSON.parse(raw));
}

async function loadItems() {
  const data = await readItemsFromDisk();
  itemsCache = data;
  statsCache = null;
  return data;
}

export async function getItems() {
  if (itemsCache) return itemsCache;
  if (loadPromise) return loadPromise;
  loadPromise = loadItems().finally(() => {
    loadPromise = null;
  });
  return loadPromise;
}

export async function getStats() {
  if (statsCache) return statsCache;
  const items = await getItems();
  const byCategory = Object.create(null);
  let priceSum = 0;
  let inStock = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const cat = it.category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    priceSum += it.price;
    if (it.inStock !== false) inStock += 1;
  }
  statsCache = {
    total: items.length,
    avgPrice: Math.round((priceSum / items.length) * 100) / 100,
    byCategory,
    inStock,
  };
  return statsCache;
}

export function startItemsFileWatcher() {
  try {
    const watcher = fsSync.watch(ITEMS_PATH, { persistent: false }, () => {
      if (watchDebounce) clearTimeout(watchDebounce);
      watchDebounce = setTimeout(() => {
        watchDebounce = null;
        invalidateCache();
      }, 250);
    });
    watcher.on("error", () => {});
    return watcher;
  } catch {
    return null;
  }
}
