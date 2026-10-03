import User from "../Models/User.js";

// =========================
// GET ALL USERS - ADMIN
// =========================

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "-password -resetPasswordToken -resetPasswordExpires"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Get all users error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =========================
// GET USER BY ID - ADMIN
// =========================

export const getUserById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select(
        "-password -resetPasswordToken -resetPasswordExpires"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Get user error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =========================
// GET MY PROFILE
// =========================

export const getMyProfile = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user._id
    ).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Get my profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =========================
// UPDATE MY PROFILE
// =========================

export const updateMyProfile = async (
  req,
  res
) => {
  try {
    const {
      name,
      phone,
      address,
    } = req.body;

    if (
      !name ||
      !String(name).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (
      !phone ||
      !String(phone).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    if (
      !address ||
      !String(address).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name =
      String(name).trim();

    user.phone =
      String(phone).trim();

    user.address =
      String(address).trim();

    await user.save();

    const safeUser =
      await User.findById(
        user._id
      ).select(
        "-password -resetPasswordToken -resetPasswordExpires"
      );

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Update my profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};