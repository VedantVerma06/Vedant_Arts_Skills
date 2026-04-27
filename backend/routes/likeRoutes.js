import express from "express";
import { likeArtwork, unlikeArtwork } from "../controllers/likeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:id/like", protect, likeArtwork);
router.delete("/:id/unlike", protect, unlikeArtwork);

export default router;