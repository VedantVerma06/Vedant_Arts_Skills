import mongoose from "mongoose";

const ORDER_STATUSES = [
  "pending",
  "accepted",
  "payment_uploaded",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
];

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    size: {
      type: String,
      enum: ["A5", "A4", "A3", "A2", "A1"],
      required: true,
    },
    medium: {
      type: String,
      enum: ["graphite", "colour"],
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    referenceImages: {
      type: [String],
      default: [],
    },
    paymentScreenshot: {
      type: String,
      default: "",
    },
    progressImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
