import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";

const router = Router();

router.get("/categories", async (req, res) => {
  const categories = await db.select().from(categoriesTable);
  return res.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      itemCount: c.itemCount,
    }))
  );
});

export default router;
