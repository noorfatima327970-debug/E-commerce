import express from "express";

import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} from "../Controller/authController.js";

import {
  getAllUsers,
  getUserById,
  getMyProfile,
  updateMyProfile,
} from "../Controller/userController.js";

import authMiddleware from "../Middleware/authMiddleware.js";
import adminMiddleware from "../Middleware/adminMiddleware.js";

const router = express.Router();

// =========================
// AUTH ROUTES
// =========================

// REGISTER
router.post(
  "/register",
  registerUser
);

// LOGIN
router.post(
  "/login",
  loginUser
);

// FORGOT PASSWORD
router.post(
  "/forgot-password",
  forgotPassword
);

// RESET PASSWORD
router.post(
  "/reset-password",
  resetPassword
);

// =========================
// CUSTOMER PROFILE ROUTES
// =========================

// GET MY PROFILE
router.get(
  "/me",
  authMiddleware,
  getMyProfile
);

// UPDATE MY PROFILE
router.put(
  "/profile",
  authMiddleware,
  updateMyProfile
);

// =========================
// ADMIN USER ROUTES
// =========================

// GET ALL USERS
router.get(
  "/users/all",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

// GET SINGLE USER
router.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  getUserById
);

export default router;