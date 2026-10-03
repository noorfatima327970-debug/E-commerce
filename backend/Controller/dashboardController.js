import Product from "../Models/Product.js";
import Order from "../Models/Order.js";
import User from "../Models/User.js";

// ===============================
// GET ADMIN DASHBOARD STATS
// ===============================
export const getDashboardStats = async (
  req,
  res
) => {
  try {
    const totalProducts =
      await Product.countDocuments();

    const totalOrders =
      await Order.countDocuments();

    const totalUsers =
      await User.countDocuments({
        role: "user",
      });

    const pendingOrders =
      await Order.countDocuments({
        status: "Pending",
      });

    const processingOrders =
      await Order.countDocuments({
        status: "Processing",
      });

    const shippedOrders =
      await Order.countDocuments({
        status: "Shipped",
      });

    const deliveredOrders =
      await Order.countDocuments({
        status: "Delivered",
      });

    // ===============================
    // TOTAL SALES
    // ===============================
    const salesResult =
      await Order.aggregate([
        {
          $match: {
            status: {
              $ne: "Cancelled",
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    const totalSales =
      salesResult.length > 0
        ? salesResult[0].total
        : 0;

    // ===============================
    // THIS MONTH SALES
    // ===============================
    const now = new Date();

    const startOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const endOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );

    const monthlySalesResult =
      await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
            status: {
              $ne: "Cancelled",
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    const monthlySales =
      monthlySalesResult.length > 0
        ? monthlySalesResult[0].total
        : 0;

    // ===============================
    // WEEKLY SALES
    // ===============================
    const startOfWeek = new Date(now);

    const day =
      startOfWeek.getDay();

    const difference =
      day === 0 ? 6 : day - 1;

    startOfWeek.setDate(
      startOfWeek.getDate() -
        difference
    );

    startOfWeek.setHours(
      0,
      0,
      0,
      0
    );

    const weeklySales =
      await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfWeek,
            },
            status: {
              $ne: "Cancelled",
            },
          },
        },
        {
          $group: {
            _id: {
              $dayOfWeek: "$createdAt",
            },
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    const dayMap = {
      1: "Sun",
      2: "Mon",
      3: "Tue",
      4: "Wed",
      5: "Thu",
      6: "Fri",
      7: "Sat",
    };

    const weeklySalesData = [
      {
        day: "Mon",
        value: 0,
      },
      {
        day: "Tue",
        value: 0,
      },
      {
        day: "Wed",
        value: 0,
      },
      {
        day: "Thu",
        value: 0,
      },
      {
        day: "Fri",
        value: 0,
      },
      {
        day: "Sat",
        value: 0,
      },
      {
        day: "Sun",
        value: 0,
      },
    ];

    weeklySales.forEach(
      (item) => {
        const dayName =
          dayMap[item._id];

        const dayItem =
          weeklySalesData.find(
            (day) =>
              day.day === dayName
          );

        if (dayItem) {
          dayItem.value =
            item.total;
        }
      }
    );

    // ===============================
    // RECENT ORDERS
    // ===============================
    const recentOrders =
      await Order.find()
        .populate(
          "user",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5);

    return res.status(200).json({
      success: true,

      stats: {
        totalProducts,
        totalOrders,
        totalUsers,

        totalSales,
        monthlySales,

        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,

        weeklySales:
          weeklySalesData,

        recentOrders,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};