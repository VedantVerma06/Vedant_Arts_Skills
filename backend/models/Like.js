import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
    },
  },
  { timestamps: true }
);

likeSchema.index({ userId: 1, artworkId: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);

export default Like;
