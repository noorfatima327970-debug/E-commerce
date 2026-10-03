import express from "express";

import {
  createOrder,
  getMyOrders,
  cancelMyOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from "../Controller/orderController.js";

import authMiddleware from "../Middleware/authMiddleware.js";
import adminMiddleware from "../Middleware/adminMiddleware.js";

const router = express.Router();

// ===============================
// CREATE ORDER
// ===============================

router.post(
  "/create",
  authMiddleware,
  createOrder
);

// ===============================
// GET MY ORDERS
// ===============================

router.get(
  "/my-orders",
  authMiddleware,
  getMyOrders
);

// ===============================
// CANCEL MY ORDER
// ===============================

router.put(
  "/cancel/:id",
  authMiddleware,
  cancelMyOrder
);

// ===============================
// GET ALL ORDERS - ADMIN
// ===============================

router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  getAllOrders
);

// ===============================
// UPDATE ORDER STATUS - ADMIN
// ===============================

router.put(
  "/admin/status/:id",
  authMiddleware,
  adminMiddleware,
  updateOrderStatus
);

// ===============================
// GET ORDER BY ID
// ===============================

router.get(
  "/:id",
  authMiddleware,
  getOrderById
);

export default router;