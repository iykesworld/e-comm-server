const express = require('express')
const app = express()
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const path = require('path'); 
const port = process.env.PORT || 5000

// Validate environment variables
if (!process.env.MONGODB_URL || !process.env.JWT_SECRET_KEY) {
  console.error('❌ MONGODB_URL or JWT_SECRET_KEY is not set in the environment.');
  process.exit(1);  // Exit if critical variables are missing
}

// middleware set up
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(express.json({limit: '25mb'}));
app.use(cookieParser());
// app.use(bodyParser.json());
app.use(cors({
    origin: ['https://e-comm-store-923g.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// all routes
const authRoutes = require('./src/users/user.route');
const productsRoutes = require('./src/products/products.route');
const reviewRoutes = require('./src/reviews/reviews.route')

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



main().then(()=>console.log('MongoDB connected successfully')).catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.MONGODB_URL);

    app.get('/', (req, res) => {
        res.send('E-comm is running!!')
      })
  
  }


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})