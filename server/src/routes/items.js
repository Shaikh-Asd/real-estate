import { Router } from "express";
import { getItems } from "../lib/itemsData.js";
import { filterIndexed } from "../lib/filterItems.js";
import { toPublicItems } from "../lib/publicItem.js";

const router = Router();

router.get("/items", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "")
      .trim()
      .toLowerCase();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20)
    );

    const all = await getItems();
    const filtered = filterIndexed(all, q);
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    res.json({
      items: toPublicItems(slice),
      page: safePage,
      pageSize,
      total,
      pages,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
