import mongoose from "mongoose";

const artworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      lowercase: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Image is required"],
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    size: {
      type: String,
      default: "",
    },
    medium: {
      type: String,
      default: "",
    },
    instagramLink: {
      type: String,
      default: "",
    },
    isForSale: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Artwork = mongoose.model("Artwork", artworkSchema);

export default Artwork;
