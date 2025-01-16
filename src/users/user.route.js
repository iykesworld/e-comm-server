const express = require('express');
const User = require('./user.model');
const generateToken = require('../middleware/generateToken');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/verifyToken');
const fs = require('fs');

const router = express.Router();

// multer configuration

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if(file.mimetype.startsWith('image')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
});


// Profile image upload route
router.post('/upload-profile-image', verifyToken, upload.single('profileImage'), async (req, res)=>{
    try {
        const {userId} = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
          }
        const user = await User.findById(userId);
            if(!user){
                return res.status(404).send({ message: 'User not found' });
            }

            // Delete old profile image if it exists
            if (user.profileImage) {
                const oldImagePath = path.join(__dirname, '..', user.profileImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }


            // Save the profile image path to the user document
            user.profileImage = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            await user.save();

            res.status(200).send
            ({ message: 'Profile image uploaded successfully', 
                profileImage: user.profileImage });
    } catch (error) {
        console.log('Error uploading profile image:', error);
        res.status(500).json({ message: 'Failed to upload profile image', error: error.message });
    }
})

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const {username, email, password} = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ message: 'Email already in use' });
        }
        // Create and save the new user
        const user = new User({ username, email, password });
        await user.save();
        res.status(200).send({message: 'User registration successful', user: user});
    } catch (error) {
        console.error(error, 'Failed to register user');
        res.status(400).json({message: 'Failed to register user'});
    }
});

// login user
router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).send({message: 'User not found'});
        }
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(401).send({message: 'Invalid password'});
        };
        
        const token = await generateToken(user._id);
        // set token to cookies
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // set to true for https
            sameSite: 'none', //
        })

        res.status(200).send({message: 'Logged in successfully', token, user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            bio: user.bio,
            profession: user.profession
        }});
    } catch (error) {
        console.error(error, 'Failed to login');
        res.status(500).json({message: 'Login failed! Try again'});
    }
});

// logout endpoint
router.post('/logout', async (req, res) => {
    try {
    res.clearCookie('token');
    res.status(200).send({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error, 'Failed to log out');
        res.status(500).json({ message: 'Failed to log out' });
    }
});

// delete a user 
router.delete('/users/:id', async (req, res)=>{
    try {
        const {id} = req.params;
        const user = await User.findByIdAndDelete(id);
        if(!user){
            return res.status(404).send({ message: 'User not found' });
        }
        res.status(200).send({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error, 'Failed to delete user');
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

// get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'id email role profileImage').sort({createdAt: -1});
        res.status(200).send({message: 'Users found successfully', users});
    } catch (error) {
        console.error(error, 'Failed to get users');
        res.status(500).json({ message: 'Failed to get users' });
    }
});

// update user role
router.put('/users/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {role} = req.body;
        const user = await User.findByIdAndUpdate(id, {role}, {new: true});
        if(!user){
            return res.status(404).send({ message: 'User not found' });
        }
        res.status(200).send({ message: 'User role updated successfully', user: user});
    } catch (error) {
        console.error(error, 'Failed to update user role');
        res.status(500).json({ message: 'Failed to update user role' });
    }
});

// update user profile
router.patch('/edit-profile', async (req, res) => {
    try {
        const {userId, username, profileImage, bio, profession} = req.body;
        if(!userId){
            return res.status(400).send({ message: 'User ID is required' });
        }
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).send({ message: 'User not found' });
        }
        // update profile
        if(username!== undefined) user.username = username;
        if(profileImage!== undefined) user.profileImage = profileImage;
        if(bio!== undefined) user.bio = bio;
        if(profession!== undefined) user.profession = profession;

        await user.save();
        res.status(200).send({ message: 'User profile updated successfully', user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            bio: user.bio,
            profession: user.profession
        }});
    } catch (error) {
        console.error(error, 'Error updating user profile');
        res.status(500).json({ message: 'Error updating user profile' });
    }
});


module.exports = router;