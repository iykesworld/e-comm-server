const express = require("express");
const Reviews = require("./reviews.model");
const Products = require("../products/products.model");

const router = express.Router();

// create new review
router.post("/post-reviews", async (req, res) => {
  try {
    const { comment, rating, userId, productId } = req.body;

    // validate input
    if (!comment || !rating || !userId || !productId) {
      return res.status(400).send({ message: "Missing required fields" });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .send({ message: "Rating must be between 1 and 5" });
    }
    // check if the review already exists
    const existingReview = await Reviews.findOne({ productId, userId });
    if (existingReview) {
      // udpate the review
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();
    } else {
      // create new review
      const newReview = new Reviews({ comment, rating, userId, productId });
      await newReview.save();
    }

    // Recalculate and update the product's average rating
    const reviews = await Reviews.find({ productId });
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;

      const product = await Products.findById(productId);
      if (product) {
        product.averageRating = averageRating;
        await product.save({ validateBeforeSave: false });
      } else {
        return res
          .status(404)
          .send({ success: false, message: "Product not found" });
      }
    }

    // Return updated reviews with user details
    const populatedReviews = await Reviews.find({ productId }).populate({
      path: "userId",
      select: "profileImage username", // Include profileImage and username
    });

    res.status(201).send({
      success: true,
      message: "Review created or updated successfully",
      reviews: populatedReviews.map((review) => ({
        comment: review.comment,
        rating: review.rating,
        userName: review.userId?.username || "Anonymous",
        profileImage: review.userId?.profileImage || "default-avatar.png",
        updatedAt: review.updatedAt,
      })),
    });

  } catch (error) {
    console.error(error, "Error creating review");
    res.status(500).send({ message: "Server error while creating review" });
  }
});

// get all reviews
router.get("/total-reviews", async (req, res) => {
  try {
    const totalReviews = await Reviews.countDocuments({});
    res.status(200).send({ message: "Total reviews", totalReviews });
  } catch (error) {
    console.error(error, "Error getting reviews");
    res.status(500).send({ message: "Failed to get reviews" });
  }
});

// get reviews by userId
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).send({ message: "User ID is required" });
  }
  try {
    const reviews = await Reviews.find({ userId: userId })
      .populate({
        path: "productId",
        select: "name", // Include product name
      })
      .sort({ createdAt: -1 });
    if (reviews.length == 0) {
      return res.status(404).send({ message: "No reviews found" });
    }
    res.status(200).send({
        success: true,
        message: "Reviews fetched successfully",
        reviews: reviews.map((review) => ({
          comment: review.comment,
          rating: review.rating,
          productName: review.productId?.name || 'Unknown',
          createdAt: review.createdAt,
        })),
      });
  } catch (error) {
    console.error(error, "Error fetching reviews by user");
    res.status(500).send({ message: "Error fetching reviews by user" });
  }
});

module.exports = router;
