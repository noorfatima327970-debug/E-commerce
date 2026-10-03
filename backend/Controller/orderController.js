import mongoose from "mongoose";

import Order from "../Models/Order.js";

import Product from "../Models/Product.js";

// ===============================
// CREATE ORDER
// ===============================

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryInformation,
      paymentMethod,
      paymentReference,
    } = req.body;

    // Check order items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // Check delivery information
    if (!deliveryInformation) {
      return res.status(400).json({
        success: false,
        message: "Delivery information is required",
      });
    }

    // Required delivery fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "postalCode",
    ];

    for (const field of requiredFields) {
      if (
        !deliveryInformation[field] ||
        !String(deliveryInformation[field]).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Allowed payment methods
    const allowedPaymentMethods = [
      "COD",
      "JazzCash",
      "Easypaisa",
      "Bank Transfer",
    ];

    if (
      !paymentMethod ||
      !allowedPaymentMethods.includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Payment reference required for non-COD
    if (paymentMethod !== "COD") {
      if (
        !paymentReference ||
        !String(paymentReference).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment reference is required",
        });
      }
    }

    const orderItems = [];
    let subtotal = 0;

    // ===============================
    // CHECK PRODUCTS & STOCK
    // ===============================

    for (const item of items) {
      if (
        !item.product ||
        !mongoose.Types.ObjectId.isValid(item.product)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity",
        });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}`,
        });
      }

      const itemTotal = product.price * item.quantity;

      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity,
      });
    }

    // ===============================
    // SHIPPING
    // ===============================

    // PKR 3000 or above = Free Shipping
    // Below PKR 3000 = PKR 200

    const shippingAmount = subtotal >= 3000 ? 0 : 200;

    const totalAmount = subtotal + shippingAmount;

    // ===============================
    // CREATE ORDER
    // ===============================

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAmount,

      deliveryInformation: {
        firstName: deliveryInformation.firstName.trim(),
        lastName: deliveryInformation.lastName.trim(),
        email: deliveryInformation.email.toLowerCase().trim(),
        phone: deliveryInformation.phone.trim(),
        address: deliveryInformation.address.trim(),
        city: deliveryInformation.city.trim(),
        postalCode: deliveryInformation.postalCode.trim(),
      },

      paymentMethod,

      paymentStatus: "Pending",

      paymentReference:
        paymentMethod === "COD"
          ? ""
          : String(paymentReference).trim(),

      status: "Pending",
    });

    // ===============================
    // REDUCE STOCK
    // ===============================

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: -item.quantity,
          },
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// GET MY ORDERS
// ===============================

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// CANCEL MY ORDER
// ===============================

export const cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Find user's order
    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only Pending and Processing orders can be cancelled
    if (
      order.status !== "Pending" &&
      order.status !== "Processing"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order can no longer be cancelled.",
      });
    }

    // ===============================
    // RESTORE STOCK
    // ===============================

    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: item.quantity,
          },
        }
      );
    }

    // ===============================
    // CANCEL ORDER
    // ===============================

    order.status = "Cancelled";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// GET ORDER BY ID
// ===============================

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Normal user can only view their own order
    if (
      req.user.role !== "admin" &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// GET ALL ORDERS - ADMIN
// ===============================

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// UPDATE ORDER STATUS - ADMIN
// ===============================

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Prevent changing an already cancelled order
    if (
      order.status === "Cancelled" &&
      status !== "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled orders cannot be changed.",
      });
    }

    // ===============================
    // ADMIN CANCEL ORDER
    // ===============================

    if (
      status === "Cancelled" &&
      order.status !== "Cancelled"
    ) {
      // Only Pending and Processing orders can be cancelled
      if (
        order.status !== "Pending" &&
        order.status !== "Processing"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order can no longer be cancelled.",
        });
      }

      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: item.quantity,
            },
          }
        );
      }
    }

    order.status = status;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};