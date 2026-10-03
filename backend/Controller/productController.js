import Product from "../Models/Product.js";

// ==========================================
// CREATE PRODUCT
// ==========================================

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      sale,
      category,
      stock,
      featured,
    } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !category ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All product fields are required",
      });
    }

    const productPrice = Number(price);
    const productStock = Number(stock);

    if (
      Number.isNaN(productPrice) ||
      productPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product price must be a valid number",
      });
    }

    if (
      Number.isNaN(productStock) ||
      productStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product stock must be a valid number",
      });
    }

    const isSale =
      sale === true ||
      sale === "true";

    let image = "";

    if (req.file) {
      image = `/products/${req.file.filename}`;
    }

    if (!image && req.body.image) {
      image = req.body.image.trim();
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    /*
      New product sale behavior:

      Jab new product create hoga aur Sale ON hogi,
      to abhi manual oldPrice available nahi hai.

      Isliye new product ko pehle normal product
      ke taur par create kiya jayega.

      Sale ke liye existing product ki price ko
      change karke Sale ON karna hoga.
    */

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: productPrice,
      oldPrice: null,
      sale: false,
      image,
      category: category.trim(),
      stock: productStock,
      featured:
        featured === true ||
        featured === "true",
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// GET ALL PRODUCTS
// ==========================================

export const getAllProducts = async (
  req,
  res
) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// GET SINGLE PRODUCT
// ==========================================

export const getProductById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// UPDATE PRODUCT
// ==========================================

export const updateProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      price,
      sale,
      category,
      stock,
      featured,
    } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // --------------------------------------
    // NAME
    // --------------------------------------

    if (name !== undefined) {
      product.name = name.trim();
    }

    // --------------------------------------
    // DESCRIPTION
    // --------------------------------------

    if (description !== undefined) {
      product.description =
        description.trim();
    }

    // --------------------------------------
    // PRICE + SALE LOGIC
    // --------------------------------------

    const saleValue =
      sale === true ||
      sale === "true";

    if (price !== undefined) {
      const newPrice = Number(price);

      if (
        Number.isNaN(newPrice) ||
        newPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product price must be a valid number",
        });
      }

      /*
        IMPORTANT SALE LOGIC

        Normal product:
        oldPrice = null
        sale = false

        Agar product sale par ja raha hai:

        Previous price = oldPrice
        New price = price
      */

      if (
        saleValue &&
        !product.sale
      ) {
        if (newPrice >= product.price) {
          return res.status(400).json({
            success: false,
            message:
              "Sale price must be lower than the current price",
          });
        }

        product.oldPrice =
          product.price;
      }

      /*
        Agar product already sale par hai
        aur admin sale price change karta hai,
        oldPrice ko same rakha jayega.
      */

      product.price = newPrice;
    }

    // --------------------------------------
    // SALE STATUS
    // --------------------------------------

    if (sale !== undefined) {
      product.sale = saleValue;
    }

    /*
      Agar sale ON hai to oldPrice hona chahiye.
    */

    if (product.sale) {
      if (
        product.oldPrice === null ||
        product.oldPrice === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Original price could not be determined for sale",
        });
      }

      if (
        product.price >=
        product.oldPrice
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Sale price must be lower than original price",
        });
      }
    }

    /*
      Sale OFF:

      Old price clear kar do.
    */

    else {
      product.oldPrice = null;
    }

    // --------------------------------------
    // CATEGORY
    // --------------------------------------

    if (category !== undefined) {
      product.category =
        category.trim();
    }

    // --------------------------------------
    // STOCK
    // --------------------------------------

    if (stock !== undefined) {
      const newStock = Number(stock);

      if (
        Number.isNaN(newStock) ||
        newStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid number",
        });
      }

      product.stock = newStock;
    }

    // --------------------------------------
    // FEATURED
    // --------------------------------------

    if (featured !== undefined) {
      product.featured =
        featured === true ||
        featured === "true";
    }

    // --------------------------------------
    // IMAGE
    // --------------------------------------

    if (req.file) {
      product.image =
        `/products/${req.file.filename}`;
    } else if (
      req.body.image !== undefined
    ) {
      product.image =
        req.body.image.trim();
    }

    // --------------------------------------
    // SAVE
    // --------------------------------------

    await product.save();

    res.status(200).json({
      success: true,
      message:
        "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================

export const deleteProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const product =
      await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};