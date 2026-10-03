import dotenv from "dotenv";

dotenv.config();

import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import authRoutes from "./Routes/auth.js";
import productRoutes from "./Routes/product.js";
import orderRoutes from "./Routes/order.js";
import dashboardRoutes from "./Routes/dashboard.js";

const app = express();

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

const ADMIN_URL =
  process.env.ADMIN_URL || "http://localhost:5174";

const allowedOrigins = [
  FRONTEND_URL,
  ADMIN_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ===============================
// SECURITY
// ===============================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);


// ===============================
// CORS
// ===============================

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as Postman/server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(
        new Error(`Not allowed by CORS: ${origin}`)
      );
    },

    credentials: true,
  })
);


// ===============================
// BODY PARSER
// ===============================

app.use(
  express.json({
    limit: "10kb",
  })
);


// ===============================
// PRODUCT IMAGES
// ===============================

app.use(
  "/products",
  express.static(
    path.join(
      __dirname,
      "../frontend/public/products"
    ),
    {
      setHeaders: (res) => {
        res.setHeader(
          "Access-Control-Allow-Origin",
          "*"
        );

        res.setHeader(
          "Cross-Origin-Resource-Policy",
          "cross-origin"
        );
      },
    }
  )
);


// ===============================
// ROOT API
// ===============================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Shop Nova API is running",
  });
});


// ===============================
// API ROUTES
// ===============================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);


// ===============================
// ERROR HANDLER
// ===============================

app.use(
  (err, req, res, next) => {
    console.error("Server Error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
);


// ===============================
// START SERVER
// ===============================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup error:",
      error
    );
  }
};

startServer();