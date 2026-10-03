import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";
import User from "../Models/User.js";

const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is missing from .env"
    );
  }

  return new Resend(
    process.env.RESEND_API_KEY
  );
};

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ===============================
// REGISTER USER
// ===============================
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    const trimmedName = name.trim();

    const normalizedEmail =
      email.toLowerCase().trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters",
      });
    }

    if (trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 50 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Email is already registered",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(
      user._id
    );

    res.status(201).json({
      success: true,
      message:
        "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ===============================
// LOGIN USER
// ===============================
export const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const token = generateToken(
      user._id
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ===============================
// FORGOT PASSWORD
// ===============================
export const forgotPassword = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Email is required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    /*
      Security:
      We return the same success message
      whether the email exists or not.
    */

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent",
      });
    }

    const resetToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    const hashedResetToken =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    user.resetPasswordToken =
      hashedResetToken;

    user.resetPasswordExpires =
      new Date(
        Date.now() + 15 * 60 * 1000
      );

    await user.save({
      validateBeforeSave: false,
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/reset-password?token=${resetToken}`;

    const resend = getResend();

    const { error } =
      await resend.emails.send({
        from:
          "Shop Nova <onboarding@resend.dev>",
        to: [user.email],
        subject:
          "Reset your Shop Nova password",
        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            color: #111111;
          ">
            <h2 style="
              margin-bottom: 15px;
            ">
              Reset Your Password
            </h2>

            <p>
              Hello ${user.name},
            </p>

            <p>
              We received a request to
              reset your Shop Nova password.
            </p>

            <p>
              Click the button below to
              create a new password.
            </p>

            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 22px;
                background: #f5c518;
                color: #111111;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 15px 0;
              "
            >
              Reset Password
            </a>

            <p>
              This link will expire in
              15 minutes.
            </p>

            <p>
              If you did not request a
              password reset, you can
              safely ignore this email.
            </p>

            <p>
              — Shop Nova
            </p>
          </div>
        `,
      });

    if (error) {
      console.error(
        "Resend email error:",
        error
      );

      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await user.save({
        validateBeforeSave: false,
      });

      return res.status(500).json({
        success: false,
        message:
          "Unable to send reset email",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ===============================
// RESET PASSWORD
// ===============================
export const resetPassword = async (
  req,
  res
) => {
  try {
    const {
      token,
      password,
      newPassword,
    } = req.body;

    const resetPasswordValue =
      newPassword || password;

    if (
      !token ||
      !resetPasswordValue
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token and new password are required",
      });
    }

    if (
      resetPasswordValue.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const hashedResetToken =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user =
      await User.findOne({
        resetPasswordToken:
          hashedResetToken,
        resetPasswordExpires: {
          $gt: new Date(),
        },
      });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token is invalid or has expired",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        resetPasswordValue,
        10
      );

    user.password =
      hashedPassword;

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ===============================
// UPDATE PROFILE
// ===============================
export const updateProfile = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      phone,
      address,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message:
          "Name and email are required",
      });
    }

    const trimmedName =
      name.trim();

    const normalizedEmail =
      email.toLowerCase().trim();

    const trimmedPhone =
      phone?.trim() || "";

    const trimmedAddress =
      address?.trim() || "";

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters",
      });
    }

    if (trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 50 characters",
      });
    }

    if (trimmedPhone.length > 20) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number cannot exceed 20 characters",
      });
    }

    if (trimmedAddress.length > 300) {
      return res.status(400).json({
        success: false,
        message:
          "Address cannot exceed 300 characters",
      });
    }

    const emailExists =
      await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: req.userId,
        },
      });

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message:
          "Email is already in use",
      });
    }

    const user =
      await User.findById(
        req.userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    user.name =
      trimmedName;

    user.email =
      normalizedEmail;

    user.phone =
      trimmedPhone;

    user.address =
      trimmedAddress;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};