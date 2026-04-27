import Like from "../models/Like.js";
import Artwork from "../models/Artwork.js";

// ❤️ LIKE ARTWORK
export const likeArtwork = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const artworkId = req.params.id;

    // 🔍 Check if already liked
    const existingLike = await Like.findOne({ userId, artworkId });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: "Already liked"
      });
    }

    // ❤️ Create like
    await Like.create({ userId, artworkId });

    // 🔥 Increment count
    await Artwork.findByIdAndUpdate(artworkId, {
      $inc: { likesCount: 1 }
    });

    res.json({
      success: true,
      message: "Artwork liked"
    });
  } catch (error) {
    next(error);
  }
};

// 💔 UNLIKE ARTWORK
export const unlikeArtwork = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const artworkId = req.params.id;

    const like = await Like.findOne({ userId, artworkId });

    if (!like) {
      return res.status(400).json({
        success: false,
        message: "Not liked yet"
      });
    }

    await like.deleteOne();

    await Artwork.findByIdAndUpdate(artworkId, {
      $inc: { likesCount: -1 }
    });

    res.json({
      success: true,
      message: "Artwork unliked"
    });
  } catch (error) {
    next(error);
  }
};