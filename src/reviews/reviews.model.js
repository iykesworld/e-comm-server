const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true, // Ensure rating is required
        min: 1, // Minimum rating value
        max: 5, // Maximum rating value
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        ref: 'User',
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    
  }, {timestamps: true});

  
  // Add profileImage when the user is populated
    ReviewSchema.set('toObject', { virtuals: true });
    ReviewSchema.set('toJSON', { virtuals: true });



  const Reviews = mongoose.model('Review', ReviewSchema);

  module.exports = Reviews;