import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../Controller/productController.js";

import authMiddleware from "../Middleware/authMiddleware.js";
import adminMiddleware from "../Middleware/adminMiddleware.js";

const router = express.Router();

const uploadDirectory = path.join(
  process.cwd(),
  "../frontend/public/products"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(null, uploadDirectory);
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path.extname(
          file.originalname
        );

      const originalName =
        path
          .basename(
            file.originalname,
            extension
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .toLowerCase();

      const uniqueName = `${originalName}-${Date.now()}${extension}`;

      cb(null, uniqueName);
    },
  });

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// PUBLIC ROUTES
router.get(
  "/getAll",
  getAllProducts
);

router.get(
  "/getOne/:id",
  getProductById
);

// ADMIN ROUTES
router.post(
  "/create",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  createProduct
);

router.put(
  "/update/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  updateProduct
);

router.delete(
  "/delete/:id",
  authMiddleware,
  adminMiddleware,
  deleteProduct
);

export default router;