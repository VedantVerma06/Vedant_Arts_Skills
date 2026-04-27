import express from "express";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  uploadPaymentScreenshot,
  cancelOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  upload.fields([{ name: "referenceImages", maxCount: 5 }]),
  createOrder
);

router.get("/my", protect, getMyOrders);

router.put(
  "/upload-payment/:id",
  protect,
  upload.fields([{ name: "paymentScreenshot", maxCount: 1 }]),
  uploadPaymentScreenshot
);

router.patch(
  "/upload-payment/:id",
  protect,
  upload.fields([{ name: "paymentScreenshot", maxCount: 1 }]),
  uploadPaymentScreenshot
);

router.patch("/:id/cancel", protect, cancelOrder);
router.delete("/:id", protect, cancelOrder);

router.get("/", protect, isAdmin, getAllOrders);
router.put("/:id", protect, isAdmin, updateOrderStatus);
router.patch("/:id", protect, isAdmin, updateOrderStatus);

export default router;
