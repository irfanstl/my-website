import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_secret_key_123';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables.');
  console.error('Please set MONGODB_URI in the Settings menu with your MongoDB Atlas connection string.');
}

// Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email credentials not set. Skipping email send.');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Nexus E-Commerce" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err);
  }
};

const sendOrderConfirmation = async (userEmail, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${item.price}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Order Confirmed!</h2>
      <p>Hi there,</p>
      <p>Thank you for your order. We've received it and are processing it now.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; background: #eee;">
              <th style="padding: 8px;">Item</th>
              <th style="padding: 8px;">Qty</th>
              <th style="padding: 8px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <p style="text-align: right; font-size: 1.2em; margin-top: 15px;"><strong>Total: ₹${order.total}</strong></p>
      </div>
      <p>We'll notify you once your order has been shipped.</p>
      <p>Best regards,<br/>The Nexus Team</p>
    </div>
  `;

  await sendEmail(userEmail, `Order Confirmation - #${order._id}`, html);
};

const sendShippingUpdate = async (userEmail, order) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Order Shipped!</h2>
      <p>Hi there,</p>
      <p>Great news! Your order <strong>#${order._id}</strong> has been shipped and is on its way to you.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        <p><strong>Shipping Address:</strong><br/>${order.shippingAddress}</p>
      </div>
      <p>You can track your order status in your profile dashboard.</p>
      <p>Thank you for shopping with us!</p>
      <p>Best regards,<br/>The Nexus Team</p>
    </div>
  `;

  await sendEmail(userEmail, `Shipping Update - Order #${order._id}`, html);
};

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  displayName: String,
  role: { type: String, default: 'customer' },
  address: String,
  city: String,
  state: String,
  zip: String,
  isVerified: { type: Boolean, default: true },
  otp: String,
  otpExpiry: Date,
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  stock: Number,
  createdAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
  }],
  total: Number,
  status: { type: String, default: 'pending' },
  shippingAddress: String,
  paymentId: String,
  orderId: String,
  deliveryTime: String,
  createdAt: { type: Date, default: Date.now },
});

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: String,
  method: String,
  path: String,
  status: Number,
  userAgent: String,
  suspicious: { type: Boolean, default: false },
  reason: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Log = mongoose.model('Log', logSchema);

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const PORT = 3000;

  // Connect to MongoDB
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is missing. Please provide a valid MongoDB Atlas connection string.');
    }

    // Check for common URL encoding issues in the URI
    const authPart = MONGODB_URI.match(/mongodb\+srv:\/\/([^@]+)@/);
    if (authPart && authPart[1]) {
      const credentials = authPart[1];
      if (credentials.includes(':')) {
        const [username, password] = credentials.split(':');
        const specialChars = /[!@#$%^&*()_+={}\[\]|\\;'"<>,.?/]/;
        if (specialChars.test(password) && !password.includes('%')) {
          console.warn('WARNING: Your MONGODB_URI password contains special characters that are NOT URL-encoded.');
          console.warn('This is likely causing the "authentication failed" error.');
          console.warn('Please URL-encode characters like @, :, /, +, etc. (e.g., @ becomes %40)');
        }
      }
    }

    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
    });
    console.log('Connected to MongoDB Atlas successfully');
  } catch (err) {
    console.error('CRITICAL: MongoDB connection failed.');
    console.error('Error details:', err.message);
    if (err.message.includes('authentication failed')) {
      console.error('TIP: Check your MONGODB_URI credentials (username/password). Ensure special characters are URL-encoded.');
    }
    if (err.message.includes('MONGODB_URI is missing')) {
      console.error('TIP: Go to the Settings menu and add MONGODB_URI with your Atlas connection string.');
    }
  }

  // Seed Admin User
  if (mongoose.connection.readyState === 1) {
    try {
      const adminEmail = 'admin@nexus.com';
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (!existingAdmin) {
        const hashedPassword = bcrypt.hashSync('adminpassword123', 10);
        await User.create({
          email: adminEmail,
          password: hashedPassword,
          displayName: 'Nexus Admin',
          role: 'admin',
        });
        console.log('Admin user seeded: admin@nexus.com / adminpassword123');
      }

      // Seed Demo Products
      const productCount = await Product.countDocuments();
      if (productCount < 10) {
        const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports & Outdoors', 'Beauty & Personal Care'];
        const adjectives = ['Premium', 'Ultra', 'Smart', 'Classic', 'Modern', 'Essential', 'Luxury', 'Professional', 'Eco-friendly', 'Wireless'];
        const nouns = {
          'Electronics': ['Headphones', 'Smartwatch', 'Tablet', 'Camera', 'Speaker', 'Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Drone'],
          'Fashion': ['T-Shirt', 'Jeans', 'Jacket', 'Sneakers', 'Watch', 'Sunglasses', 'Backpack', 'Dress', 'Belt', 'Scarf'],
          'Home & Kitchen': ['Blender', 'Coffee Maker', 'Toaster', 'Air Purifier', 'Vacuum', 'Lamp', 'Cookware Set', 'Knife Block', 'Storage Bin', 'Towel Set'],
          'Books': ['Novel', 'Biography', 'Cookbook', 'Self-Help Guide', 'History Book', 'Science Fiction', 'Mystery Thriller', 'Art Book', 'Poetry Collection', 'Textbook'],
          'Sports & Outdoors': ['Yoga Mat', 'Dumbbells', 'Water Bottle', 'Running Shoes', 'Tent', 'Sleeping Bag', 'Bicycle', 'Tennis Racket', 'Hiking Boots', 'Gym Bag'],
          'Beauty & Personal Care': ['Face Cream', 'Shampoo', 'Serum', 'Perfume', 'Lipstick', 'Sunscreen', 'Electric Razor', 'Hair Dryer', 'Body Wash', 'Face Mask']
        };

        const demoProducts = [];
        for (let i = 1; i <= 200; i++) {
          const category = categories[Math.floor(Math.random() * categories.length)];
          const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
          const noun = nouns[category][Math.floor(Math.random() * nouns[category].length)];
          const name = `${adj} ${noun} ${i}`;
          const price = parseFloat((Math.random() * 490 + 10).toFixed(2));
          const stock = Math.floor(Math.random() * 100) + 5;
          const description = `The ${name} is a top-tier choice in the ${category} category. Designed for performance and style, it features premium materials and cutting-edge technology to enhance your lifestyle. Perfect for everyday use or as a special gift.`;
          const image = `https://picsum.photos/seed/nexus${i}/600/400`;

          demoProducts.push({ name, description, price, category, image, stock });
        }
        await Product.insertMany(demoProducts);
        console.log('200 demo products seeded successfully.');
      }
    } catch (err) {
      console.error('Seeding error:', err.message);
    }
  }

  app.use(cors());
  app.use(express.json());

  // Middleware to check DB connection
  app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1 && !req.path.startsWith('/api/health')) {
      return res.status(503).json({ 
        error: 'Database connection is not established. Please check server logs and MONGODB_URI configuration.',
        status: 'disconnected'
      });
    }
    next();
  });

  // Logging Middleware
  const logger = (req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
      res.send = originalSend;
      const response = res.send(body);
      
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const userId = req.user?.id || null;
      const suspicious = res.statusCode >= 400 && (req.body?.email?.includes("'") || req.body?.password?.includes("'") || req.path.includes('admin'));
      const reason = suspicious ? 'Potential SQLi or unauthorized access attempt' : null;

      Log.create({
        userId, ip, method: req.method, path: req.path, status: res.statusCode, userAgent, suspicious, reason
      }).catch(err => console.error('Logging error:', err));

      return response;
    };
    next();
  };

  app.use(logger);

  // Auth Routes
  app.post('/api/auth/request-otp', async (req, res) => {
    const { email, captchaToken } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (!captchaToken && !isDevelopment) return res.status(400).json({ error: 'reCAPTCHA token is required' });

    try {
      if (captchaToken) {
        if (!process.env.RECAPTCHA_SECRET_KEY) {
          console.error('RECAPTCHA_SECRET_KEY is missing from environment variables.');
          return res.status(500).json({ error: 'reCAPTCHA is not configured on the server' });
        }

        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
        const recaptchaRes = await globalThis.fetch(verifyUrl, { method: 'POST' });
        const recaptchaData = await recaptchaRes.json();

        if (!isDevelopment && (!recaptchaData.success || recaptchaData.score < 0.5)) {
          console.warn(`[OTP] Suspicious activity rejected for ${email}: score ${recaptchaData.score}`);
          return res.status(403).json({ error: 'Failed security check (reCAPTCHA)' });
        } else if (isDevelopment && (!recaptchaData.success || recaptchaData.score < 0.5)) {
          console.warn(`[OTP] Ignoring low reCAPTCHA score (${recaptchaData.score}) in development mode.`);
        }
      } else if (isDevelopment) {
        console.warn(`[OTP] Bypassing reCAPTCHA entirely in development mode.`);
      }

      let user = await User.findOne({ email });
      if (user && user.isVerified) {
         return res.status(400).json({ error: 'Account already exists. Please sign in.' });
      }

      if (!user) {
        const dummyPassword = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
        user = await User.create({ email, password: dummyPassword, isVerified: false });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[OTP] Generated OTP for ${email}: ${otp}`); // For debugging / admin

      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await user.save();

      await sendEmail(
        email, 
        'Your Nexus OTP Code', 
        `<div style="font-family: sans-serif; padding: 20px;">
          <h2>Your Verification Code</h2>
          <p>Your one-time password (OTP) to login is:</p>
          <h1 style="color: #4f46e5; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>`
      );

      res.json({ success: true, message: 'OTP sent successfully' });
    } catch (err) {
      console.error('Request OTP Error:', err);
      res.status(500).json({ error: 'Failed to request OTP' });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    try {
      const user = await User.findOne({ email });
      if (!user || user.otp !== otp) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }
      if (user.otpExpiry < new Date()) {
        return res.status(401).json({ error: 'OTP has expired' });
      }

      // Clear OTP and mark verified
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.isVerified = true;
      await user.save();

      res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
      console.error('Verify OTP Error:', err);
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  app.post('/api/auth/complete-signup', async (req, res) => {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) return res.status(400).json({ error: 'All fields are required' });

    try {
      const user = await User.findOne({ email });
      if (!user || (!user.isVerified)) {
        return res.status(403).json({ error: 'You must verify your email with an OTP first' });
      }

      const secret = process.env.JWT_SECRET || 'nexus_secret_key_123';
      user.password = bcrypt.hashSync(password, 10);
      user.displayName = displayName;
      await user.save();

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, { expiresIn: '24h' });
      res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role } });
    } catch (err) {
      console.error('Complete Signup Error:', err);
      res.status(500).json({ error: 'Failed to complete signup' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (email?.includes("'") || password?.includes("'")) {
      return res.status(400).json({ error: 'Suspicious input detected' });
    }

    try {
      const user = await User.findOne({ email });
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!user.isVerified) {
        return res.status(403).json({ error: 'Please verify your email via Sign Up first' });
      }

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role } });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Middleware to verify JWT
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // Product Routes
  app.get('/api/products', async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products.map(p => ({ ...p.toObject(), id: p._id })));
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json({ ...product.toObject(), id: product._id });
    } catch (err) {
      res.status(400).json({ error: 'Invalid ID' });
    }
  });

  app.post('/api/products', authenticate, isAdmin, async (req, res) => {
    const product = await Product.create(req.body);
    res.json({ ...product.toObject(), id: product._id });
  });

  app.put('/api/products/:id', authenticate, isAdmin, async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ ...product.toObject(), id: product._id });
  });

  app.delete('/api/products/:id', authenticate, isAdmin, async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  });

  // Razorpay Order Creation
  app.post('/api/razorpay/order', authenticate, async (req, res) => {
    const { amount } = req.body;
    try {
      const options = {
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
  });

  // Razorpay Payment Verification
  app.post('/api/razorpay/verify', authenticate, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      try {
        const order = await Order.create({
          ...orderData,
          userId: req.user.id,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: 'paid'
        });
        
        // Broadcast to all users
        io.emit('newOrder', {
          id: order._id,
          userName: req.user.email,
          total: order.total,
          items: order.items.length
        });

        // Send confirmation email
        sendOrderConfirmation(req.user.email, order);

        res.json({ success: true, orderId: order._id });
      } catch (err) {
        res.status(500).json({ error: 'Failed to save order' });
      }
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  });

  // Order Routes
  app.post('/api/orders', authenticate, async (req, res) => {
    const order = await Order.create({ ...req.body, userId: req.user.id });
    
    // Broadcast to all users
    io.emit('newOrder', {
      id: order._id,
      userName: req.user.email,
      total: order.total,
      items: order.items.length
    });

    // Send confirmation email
    sendOrderConfirmation(req.user.email, order);

    res.json({ id: order._id, success: true });
  });

  app.put('/api/orders/:id/status', authenticate, isAdmin, async (req, res) => {
    const { status, deliveryTime } = req.body;
    try {
      const updateData = { status };
      if (deliveryTime) updateData.deliveryTime = deliveryTime;
      
      const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('userId', 'email');
      if (!order) return res.status(404).json({ error: 'Order not found' });

      // Send shipping update email if status is 'shipped'
      if (status === 'shipped') {
        sendShippingUpdate(order.userId.email, order);
      }

      res.json(order);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.get('/api/orders', authenticate, async (req, res) => {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.find().sort({ createdAt: -1 }).populate('userId', 'email displayName');
    } else {
      orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(orders.map(o => ({ ...o.toObject(), id: o._id })));
  });

  // User Profile Routes
  app.get('/api/users/profile', authenticate, async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ ...user.toObject(), id: user._id });
  });

  app.put('/api/users/profile', authenticate, async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, req.body);
    res.json({ success: true });
  });

  // User Management for Admin
  app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users.map(u => ({ ...u.toObject(), id: u._id })));
  });

  app.get('/api/admin/logs', authenticate, isAdmin, async (req, res) => {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(100).populate('userId', 'email');
    res.json(logs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
