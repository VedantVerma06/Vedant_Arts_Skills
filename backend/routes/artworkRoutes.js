import express from "express";
import {
  createArtwork,
  getArtworks,
  getSingleArtwork,
  updateArtwork,
  deleteArtwork,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
} from "../controllers/artworkController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getArtworks);
router.get("/:id", getSingleArtwork);
router.get("/:id/comments", getComments);

router.post("/", protect, isAdmin, upload.single("image"), createArtwork);
router.put("/:id", protect, isAdmin, upload.single("image"), updateArtwork);
router.delete("/:id", protect, isAdmin, deleteArtwork);

router.post("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);
router.delete("/comment/:commentId", protect, deleteComment);

export default router;
