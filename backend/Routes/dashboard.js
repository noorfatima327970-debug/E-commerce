import express from "express";

import {
  getDashboardStats,
} from "../Controller/dashboardController.js";

import authMiddleware from "../Middleware/authMiddleware.js";
import adminMiddleware from "../Middleware/adminMiddleware.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  getDashboardStats
);

export default router;