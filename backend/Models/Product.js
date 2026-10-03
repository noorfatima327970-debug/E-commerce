
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [
        2,
        "Product name must be at least 2 characters",
      ],
      maxlength: [
        100,
        "Product name cannot exceed 100 characters",
      ],
    },

    description: {
      type: String,
      required: [
        true,
        "Product description is required",
      ],
      trim: true,
      maxlength: [
        1000,
        "Product description cannot exceed 1000 characters",
      ],
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [
        0,
        "Product price cannot be negative",
      ],
    },

    oldPrice: {
  type: Number,
  default: null,
  min: 0,
},

sale: {
  type: Boolean,
  default: false,
},

    image: {
      type: String,
      required: [true, "Product image is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },

    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [
        0,
        "Product stock cannot be negative",
      ],
      default: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;

