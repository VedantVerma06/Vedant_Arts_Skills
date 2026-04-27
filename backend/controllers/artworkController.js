import Artwork from "../models/Artwork.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";

const toFileUrl = (req, file) => {
  if (!file) return "";
  return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
};

export const createArtwork = async (req, res, next) => {
  try {
    const { title, category, price, caption, size, medium, instagramLink, isForSale, isAvailable } = req.body;

    if (!title?.trim() || !category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and category are required",
      });
    }

    const imageUrl = toFileUrl(req, req.file) || req.body.imageUrl;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Artwork image is required",
      });
    }

    const artwork = await Artwork.create({
      title: title.trim(),
      category: category.trim().toLowerCase(),
      price: Number(price) || 0,
      caption: caption?.trim() || "",
      size: size?.trim() || "",
      medium: medium?.trim() || "",
      instagramLink: instagramLink?.trim() || "",
      isForSale: String(isForSale) === "true" || isForSale === true,
      isAvailable: isAvailable === undefined ? true : String(isAvailable) === "true" || isAvailable === true,
      imageUrl,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Artwork created successfully",
      data: artwork,
    });
  } catch (error) {
    next(error);
  }
};

export const getArtworks = async (req, res, next) => {
  try {
    const { category, search, isForSale, isAvailable } = req.query;
    const filter = {};

    if (category) {
      filter.category = category.trim().toLowerCase();
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { caption: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (isForSale !== undefined) {
      filter.isForSale = isForSale === "true";
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    const artworks = await Artwork.find(filter)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: artworks.length,
      data: artworks,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate("createdBy", "username email");

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    res.status(200).json({
      success: true,
      data: artwork,
    });
  } catch (error) {
    next(error);
  }
};

export const updateArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    const imageUrl = toFileUrl(req, req.file) || req.body.imageUrl;

    artwork.title = req.body.title?.trim() ?? artwork.title;
    artwork.category = req.body.category?.trim().toLowerCase() ?? artwork.category;
    artwork.caption = req.body.caption?.trim() ?? artwork.caption;
    artwork.size = req.body.size?.trim() ?? artwork.size;
    artwork.medium = req.body.medium?.trim() ?? artwork.medium;
    artwork.instagramLink = req.body.instagramLink?.trim() ?? artwork.instagramLink;
    artwork.price = req.body.price !== undefined ? Number(req.body.price) || 0 : artwork.price;
    artwork.isForSale = req.body.isForSale !== undefined ? String(req.body.isForSale) === "true" || req.body.isForSale === true : artwork.isForSale;
    artwork.isAvailable = req.body.isAvailable !== undefined ? String(req.body.isAvailable) === "true" || req.body.isAvailable === true : artwork.isAvailable;
    if (imageUrl) artwork.imageUrl = imageUrl;

    await artwork.save();

    res.status(200).json({
      success: true,
      message: "Artwork updated successfully",
      data: artwork,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    await artwork.deleteOne();
    await Like.deleteMany({ artworkId: req.params.id });
    await Comment.deleteMany({ artworkId: req.params.id });

    res.status(200).json({
      success: true,
      message: "Artwork deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    const userId = req.user._id;
    const artworkId = req.params.id;
    const existingLike = await Like.findOne({ userId, artworkId });

    if (existingLike) {
      await existingLike.deleteOne();
      artwork.likesCount = Math.max(0, artwork.likesCount - 1);
      await artwork.save();

      return res.status(200).json({
        success: true,
        message: "Artwork unliked",
        data: { liked: false, likesCount: artwork.likesCount },
      });
    }

    await Like.create({ userId, artworkId });
    artwork.likesCount += 1;
    await artwork.save();

    res.status(200).json({
      success: true,
      message: "Artwork liked",
      data: { liked: true, likesCount: artwork.likesCount },
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    const text = req.body.text?.trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const comment = await Comment.create({
      text,
      artworkId: req.params.id,
      userId: req.user._id,
    });

    artwork.commentsCount += 1;
    await artwork.save();

    const populatedComment = await Comment.findById(comment._id).populate("userId", "username profileImage");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ artworkId: req.params.id })
      .populate("userId", "username profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (req.user.role !== "admin" && comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    await comment.deleteOne();
    await Artwork.findByIdAndUpdate(comment.artworkId, {
      $inc: { commentsCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
