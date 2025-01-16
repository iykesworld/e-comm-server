const express = require('express');
const Products = require('./products.model');
const Reviews = require('../reviews/reviews.model');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

const router = express.Router();

// post a product
router.post('/create-product',verifyToken, verifyAdmin, async (req, res) => {
    try {
        const newProduct = new Products({...req.body});
        const savedProduct = await newProduct.save();
        // calculate review
        const reviews = await Reviews.find({productId: savedProduct._id});
        if(reviews.length > 0) {
            const totalRating = reviews.reduce((acc, review)=>acc + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            savedProduct.averageRating = averageRating;
            await savedProduct.save();
        }
        res.status(200).send({message: 'Product created successfully', product: newProduct});
    } catch (error) {
        console.error(error, 'error creating product');
        res.status(500).send({message: 'error creating product'});
    }
});

// get all products
router.get('/', async (req, res) => {
    try {
        const {category, page=1, limit=16, color, search} = req.query;

        // Validate inputs
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 16;

        if (pageNum < 1 || limitNum < 1) {
            return res.status(400).send({ message: "Page and limit must be greater than 0" });
        }

        // Build filter object
        let filter = {};
        if(category && category.toLowerCase() !=="all"){
            filter.category = category;
        }
        if(color && color.toLowerCase() !=="all"){
            filter.color = color;
        }

        if(search){
            filter ={
                ...filter,
                $or: [
                    {name: {$regex: search, $options: "i"}}, // Product name
                    {description: {$regex: search, $options: "i"}}, //product description
                    { category: { $regex: search, $options: "i" } }, // Product category
                ]
            }
        }
        // Calculate pagination
        const skip = (pageNum - 1) * limitNum;

         // Fetch data
        const totalProduct = await Products.countDocuments(filter);
        const totalPage = Math.ceil(totalProduct / limitNum);
        const products = await Products.find(filter).skip(skip).limit(limitNum).populate("author", "email").sort({createdAt: -1});

        res.status(200).send({products, totalPage, totalProduct})
    } catch (error) {
        console.error(error, "Error getting products");
        res.status(500).send({message: "Error getting products"});
    }
});

// get single product
router.get('/:id', async (req, res)=>{
    try {
        const productId = req.params.id;
        const product = await Products.findById(productId);
        if(!product){
            return res.status(404).send({ message: "Product not found"});
        }

        // fetching reviews related to the product
        const reviews = await Reviews.find({productId}).populate("userId", "username email profileImage");
        res.status(200).send({ product, reviews});

    } catch (error) {
       console.error(error, "Error getting single product"); 
       res.status(500).send({message: "Error getting single product"});
    }
});

// update product
router.patch('/update-product/:id',verifyToken,verifyAdmin, async(req, res) => {
    try {
        const productId = req.params.id;
        const updatedProduct = await Products.findByIdAndUpdate(productId, {...req.body}, {new: true});

        if(!updatedProduct){
            return res.status(404).send({ message: "Product not found"});
        }
        res.status(200).send({message: "Product updated successfully", product: updatedProduct});
    } catch (error) {
        console.error(error, "Error updating product");
        res.status(500).send({message: "Error updating product"});
    }
});

// delete product
router.delete('/:id',verifyToken, verifyAdmin, async (req, res)=>{
    try {
        const productId = req.params.id;
        const deletedProduct = await Products.findByIdAndDelete(productId);
        if(!deletedProduct){
            return res.status(404).send({ message: "Product not found"});
        }
        // delete reviews associated with this product
        await Reviews.deleteMany({productId: productId});
        res.status(200).send({message: "Product deleted successfully"});
    } catch (error) {
        console.error(error, "Error deleting product");
        res.status(500).send({message: "Error deleting product"});
    }
});

// get related products
router.get("/related/:id", async (req, res) => {
    try {
        const {id} = req.params;
        if(!id){
            return res.status(400).send({ message: "Product ID is required" });
        }
        const product = await Products.findById(id);
        if(!product){
            return res.status(404).send({ message: "Product not found" });
        }

        const titleRegex = new RegExp(
            product.name.split('').filter((word)=> word.length > 1).join(''), 'i');

            const relatedProducts = await Products.find({
                _id: {$ne: id},
                $or: [
                    {name: {$regex: titleRegex}},
                    {category: product.category}
                ]
            });
            res.status(200).send( relatedProducts );
    } catch (error) {
        console.error(error, "Error getting related products");
        res.status(500).send({ message: "Error getting related products" });
    }
});


module.exports = router;