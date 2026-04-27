import Order from "../models/Order.js";
import { sendEmail } from "../services/emailService.js";

const VALID_SIZES = ["A5", "A4", "A3", "A2", "A1"];
const VALID_MEDIUMS = ["graphite", "colour"];

const VALID_STATUSES = [
  "pending",
  "accepted",
  "payment_uploaded",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
];

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  payment_uploaded: "Payment Uploaded",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const ALLOWED_ADMIN_TRANSITIONS = {
  pending: ["accepted", "rejected"],
  accepted: ["rejected"],
  payment_uploaded: ["in_progress", "rejected"],
  in_progress: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

const getUserId = (req) => req.user?._id || req.user?.id;

const fileToUrl = (req, file) => {
  return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
};

const filesToUrls = (req, files = []) => {
  return files.map((file) => fileToUrl(req, file));
};

const sendOrderEmail = async (to, subject, text) => {
  if (!to) return;

  const result = await sendEmail(to, subject, text);

  if (!result?.success) {
    console.warn(
      "⚠️ Order email was not sent:",
      result?.error || result?.skipped || "unknown reason"
    );
  }
};

const sendAdminEmail = async (subject, text) => {
  if (!process.env.ADMIN_EMAIL) {
    console.warn("⚠️ Admin email skipped: ADMIN_EMAIL missing in .env");
    return;
  }

  await sendOrderEmail(process.env.ADMIN_EMAIL, subject, text);
};

const queueEmail = (emailTask) => {
  setImmediate(async () => {
    try {
      await emailTask();
    } catch (error) {
      console.warn("⚠️ Background email task failed:", error.message);
    }
  });
};

const normalizeStatus = (status) => String(status || "").trim();

const formatMedium = (medium) => {
  if (medium === "graphite") return "Graphite";
  if (medium === "colour") return "Colour";
  return medium || "N/A";
};

const getOrderSummary = (order) => {
  return `Order Details:
Order ID: ${order._id}
Name: ${order.name || "N/A"}
Email: ${order.email || "N/A"}
Size: ${order.size || "N/A"}
Medium: ${formatMedium(order.medium)}
Total Price: ₹${order.budget || 0}
Advance Amount: ₹${order.advanceAmount || 0}
Status: ${STATUS_LABELS[order.status] || order.status}`;
};

export const createOrder = async (req, res, next) => {
  try {
    const { description, size, medium, budget, name, email } = req.body;

    const normalizedSize = String(size || "").trim();
    const normalizedMedium = String(medium || "").trim().toLowerCase();
    const finalBudget = Number(budget);

    if (!VALID_SIZES.includes(normalizedSize)) {
      return res.status(400).json({
        success: false,
        message: "Valid commission size is required",
      });
    }

    if (!VALID_MEDIUMS.includes(normalizedMedium)) {
      return res.status(400).json({
        success: false,
        message: "Valid commission medium is required",
      });
    }

    if (!Number.isFinite(finalBudget) || finalBudget <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid budget is required",
      });
    }

    const referenceImages = filesToUrls(req, req.files?.referenceImages || []);

    if (!referenceImages.length) {
      return res.status(400).json({
        success: false,
        message: "At least one reference image is required",
      });
    }

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const order = await Order.create({
      userId,
      name: String(name || req.user?.username || "").trim(),
      email: String(email || req.user?.email || "").trim().toLowerCase(),
      description: String(description || "").trim() || "No additional description",
      size: normalizedSize,
      medium: normalizedMedium,
      budget: finalBudget,
      advanceAmount: Math.ceil(finalBudget / 2),
      referenceImages,
      paymentScreenshot: "",
      status: "pending",
    });

    queueEmail(() =>
      sendOrderEmail(
        order.email,
        "Order Received - Vedant Arts Skills",
        `Hi ${order.name || "there"},

Your commission request has been received successfully.

${getOrderSummary(order)}

Your order is currently pending review.
You do not need to pay yet.

We will notify you once your order is accepted.

Regards,
Vedant Arts Skills`
      )
    );

    queueEmail(() =>
      sendAdminEmail(
        "🆕 New Order Received - Vedant Arts Skills",
        `A new order has been placed.

${getOrderSummary(order)}

Reference Images:
${order.referenceImages.length ? order.referenceImages.join("\n") : "No reference images"}

Check the admin panel for full details.`
      )
    );

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    if (status && VALID_STATUSES.includes(String(status))) {
      filter.status = String(status);
    }

    if (search) {
      const value = String(search).trim();

      filter.$or = [
        { name: { $regex: value, $options: "i" } },
        { email: { $regex: value, $options: "i" } },
        { description: { $regex: value, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadPaymentScreenshot = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to upload payment for this order",
      });
    }

    if (order.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot can be uploaded only after order is accepted",
      });
    }

    if (order.paymentScreenshot) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot has already been uploaded",
      });
    }

    const paymentFiles = req.files?.paymentScreenshot || [];

    if (!paymentFiles.length) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required",
      });
    }

    order.paymentScreenshot = fileToUrl(req, paymentFiles[0]);
    order.status = "payment_uploaded";

    await order.save();

    queueEmail(() =>
      sendOrderEmail(
        order.email,
        "Payment Screenshot Uploaded - Vedant Arts Skills",
        `Hi ${order.name || "there"},

Your payment screenshot has been uploaded successfully.

Your order is now waiting for admin verification.
Once verified, your artwork will move to In Progress.

${getOrderSummary(order)}

Regards,
Vedant Arts Skills`
      )
    );

    queueEmail(() =>
      sendAdminEmail(
        "💰 Payment Screenshot Uploaded - Vedant Arts Skills",
        `A user has uploaded payment proof.

${getOrderSummary(order)}

Payment Screenshot:
${order.paymentScreenshot}

Please verify the payment and update the order status.`
      )
    );

    return res.status(200).json({
      success: true,
      message: "Payment screenshot uploaded successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this order",
      });
    }

    if (!["pending", "accepted"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled after payment is uploaded",
      });
    }

    order.status = "cancelled";

    await order.save();

    queueEmail(() =>
      sendOrderEmail(
        order.email,
        "Order Cancelled - Vedant Arts Skills",
        `Hi ${order.name || "there"},

Your order has been cancelled successfully.

${getOrderSummary(order)}

Regards,
Vedant Arts Skills`
      )
    );

    queueEmail(() =>
      sendAdminEmail(
        "❌ Order Cancelled - Vedant Arts Skills",
        `A user has cancelled an order.

${getOrderSummary(order)}`
      )
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { rejectionReason, adminNote } = req.body;
    const status = normalizeStatus(req.body.status);

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    if (status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Admin cannot cancel user orders. Reject the order instead.",
      });
    }

    if (status === "payment_uploaded") {
      return res.status(400).json({
        success: false,
        message: "Payment uploaded status can only be set by user payment upload",
      });
    }

    if (status === "rejected" && !String(rejectionReason || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    if (["cancelled", "completed", "rejected"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `${STATUS_LABELS[order.status]} orders cannot be updated`,
      });
    }

    const allowedNextStatuses = ALLOWED_ADMIN_TRANSITIONS[order.status] || [];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${STATUS_LABELS[order.status]} to ${STATUS_LABELS[status]}`,
      });
    }

    if (status === "in_progress" && !order.paymentScreenshot) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required before marking order as in progress",
      });
    }

    order.status = status;

    if (adminNote !== undefined) {
      order.adminNote = String(adminNote || "").trim();
    }

    if (status === "rejected") {
      order.rejectionReason = String(rejectionReason || "").trim();
    }

    await order.save();

    const subjectMap = {
      accepted: "Order Accepted - Vedant Arts Skills",
      rejected: "Order Rejected - Vedant Arts Skills",
      in_progress: "Order In Progress - Vedant Arts Skills",
      completed: "Order Completed - Vedant Arts Skills",
    };

    const messageMap = {
      accepted: `Hi ${order.name || "there"},

Your order has been accepted.

${getOrderSummary(order)}

Please pay 50% advance and upload the payment screenshot from your Profile page.

After payment verification, your artwork will move to In Progress.

Regards,
Vedant Arts Skills`,

      rejected: `Hi ${order.name || "there"},

Your order has been rejected.

Reason:
${order.rejectionReason}

${getOrderSummary(order)}

Regards,
Vedant Arts Skills`,

      in_progress: `Hi ${order.name || "there"},

Your payment has been verified.
Your artwork is now in progress.

${getOrderSummary(order)}

Regards,
Vedant Arts Skills`,

      completed: `Hi ${order.name || "there"},

Your artwork has been completed.

${getOrderSummary(order)}

Thank you for ordering from Vedant Arts Skills.

Regards,
Vedant Arts Skills`,
    };

    queueEmail(() =>
      sendOrderEmail(
        order.email,
        subjectMap[status] || "Order Status Updated - Vedant Arts Skills",
        messageMap[status] ||
          `Hi ${order.name || "there"}, your order status is now ${STATUS_LABELS[status]}.`
      )
    );

    queueEmail(() =>
      sendAdminEmail(
        "📌 Order Status Updated - Vedant Arts Skills",
        `An order status has been updated.

New Status: ${STATUS_LABELS[status]}

${getOrderSummary(order)}

${status === "rejected" ? `Rejection Reason:\n${order.rejectionReason}` : ""}`
      )
    );

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};