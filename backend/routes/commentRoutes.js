import express from "express";
import {
  addComment,
  getComments,
  deleteComment
} from "../controllers/commentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 💬 Add comment
router.post("/:id/comments", protect, addComment);

// 📥 Get comments
router.get("/:id/comments", getComments);

// 🗑️ Delete comment
router.delete("/comments/:commentId", protect, deleteComment);

export default router;