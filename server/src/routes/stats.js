import { Router } from "express";
import { getStats } from "../lib/itemsData.js";

const router = Router();

router.get("/stats", async (req, res, next) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
