const { check, validationResult } = require("express-validator");

const path = require("path");

const deleteFile = require("../../helpers/file");

const Product = require("../../DB-models/products");
const Seller = require("../../DB-models/seller");
const Order = require("../../DB-models/order");

exports.postAddProduct = async (req, res, next) => {
  const errors = validationResult(req);
  const name = req.body.name;
  const productType = req.body.productType;
  const price = req.body.price;
  const image = req.files[0];
  const fresh = req.body.fresh || "none";

  try {
    if (!errors.isEmpty()) {
      const error = new Error(
        `validation faild for ${errors.array()[0].param} '${
          errors.array()[0].msg
        }'`
      );
      error.statusCode = 422;
      error.state = 5;
      throw error;
    }

    const newProduct = new Product({
      name: name,
      productType: productType,
      imageUrl: image.path,
      fresh: fresh,
      seller: req.userId,
      price: price,
    });

    const product = await newProduct.save();

    res.status(201).json({
      state: 1,
      message: "product created",
      product: product,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postEditProduct = async (req, res, next) => {
  const errors = validationResult(req);
  const name = req.body.name;
  const productType = req.body.productType;
  const price = req.body.price;
  const image = req.files[0];
  const id = req.body.id;

  try {
    if (!errors.isEmpty()) {
      const error = new Error(
        `validation faild for ${errors.array()[0].param} '${
          errors.array()[0].msg
        }'`
      );
      error.statusCode = 422;
      error.state = 5;
      throw error;
    }

    const product = await Product.findById(id);

    if (!product) {
      const error = new Error(`product not found`);
      error.statusCode = 404;
      error.state = 9;
      throw error;
    }

    if (product.seller != req.userId) {
      const error = new Error(`not the product owner`);
      error.statusCode = 403;
      error.state = 11;
      throw error;
    }

    product.name = name;
    product.productType = productType;
    product.price = price;

    if (image) {
      deleteFile.deleteFile(
        path.join(__dirname + "/../../" + product.imageUrl)
      );
      product.imageUrl = image.path;
    }
    const updated = await product.save();

    res.status(200).json({
      state: 1,
      message: "updated",
      product: updated,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  const page = req.query.page || 1;
  const productPerPage = 10;

  try {
    const products = await Product.find({ seller: req.userId })
      .skip((page - 1) * productPerPage)
      .limit(productPerPage)
      .select("-orders");
    const total = await Product.find({ seller: req.userId }).countDocuments();

    res.status(200).json({
      state: 1,
      message: `product in page ${page}`,
      products: products,
      total: total,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const sellerOrders = await Order.find({products:{$elemMatch:{seller: req.userId}}})
    console.log(req.userId);

    res.status(200).json({
        state:1,
        sellerOrders:sellerOrders
    })
  } catch (err) {}
};
