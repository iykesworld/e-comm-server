const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: String,
    description: String,
    price: {
        type: Number,
        required: true,
    },
    image: String,
    rating: {
        type: Number,
        default: 0,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
  });



  const Products = mongoose.model('Product', ProductSchema);

  module.exports = Products;