import express from "express";

const router = express.Router();

// Mounted at /api/health in app.ts, so "/" here means /api/health
router.get("/", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

export default router;
