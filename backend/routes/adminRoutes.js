import express from "express";
import { getSettings, updateSettings } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/settings", getSettings);
router.put("/settings", protect, isAdmin, updateSettings);

export default router;