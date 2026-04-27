import Comment from "../models/Comment.js";

// 💬 ADD COMMENT
export const addComment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const artworkId = req.params.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    const comment = await Comment.create({
      userId,
      artworkId,
      text
    });

    res.status(201).json({
      success: true,
      message: "Comment added",
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// 📥 GET COMMENTS
export const getComments = async (req, res, next) => {
  try {
    const artworkId = req.params.id;

    const comments = await Comment.find({ artworkId })
      .populate("userId", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// 🗑️ DELETE COMMENT
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // 🔐 Allow: owner OR admin
    if (
      comment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment"
      });
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: "Comment deleted"
    });
  } catch (error) {
    next(error);
  }
};