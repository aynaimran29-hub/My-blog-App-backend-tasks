require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const jwt = require("jsonwebtoken");
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connect to the MongoDB!'))
  .catch((err) => console.log('Connection error:', err));

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);

// ===== STEP 3: token check karne wala pehredar =====
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, please login' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Logged-in user ki apni info (profile page ke liye Step 8 ma kaam aaye gi)
app.get('/api/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Backend server perform work correctly!');
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'this email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Registration successful!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ya password galat hai' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ya password galat hai' });
    }

    // ===== STEP 2: token banana =====
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===== STEP 5: blog routes =====

// ===== STEP 5: blog routes =====

// Naya blog (login zaroori), user ki id save hoti hai
app.post('/api/blog', auth, async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newBlog = new Blog({ title, content, author, user: req.userId });
    await newBlog.save();
    res.status(201).json({ message: 'Blog created successfully!', blog: newBlog });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Sirf logged-in user ke apne blogs (ye /:id se PEHLE hona zaroori hai)
app.get('/api/blog/my', auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ user: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Sab blogs (public, Home page ke liye)
app.get('/api/blog', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});// Sirf logged-in user ke apne blogs
app.get('/api/blog/my', auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ user: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Ek blog (public, detail page ke liye)
app.get('/api/blog/:id', async (req, res,next) => {
  try {
        if (req.params.id === 'my') return next();
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete: sirf apna blog
app.delete('/api/blog/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found or not yours' });
    }
    res.status(200).json({ message: 'Blog deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Edit: sirf apna blog
app.put('/api/blog/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const updatedBlog = await Blog.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, content },
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog not found or not yours' });
    }
    res.status(200).json({ message: 'Blog updated successfully!', blog: updatedBlog });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server ${PORT} port pe start ho gaya`);
  });
}

module.exports = app;
  console.log(`Server ${PORT} port pe start ho gaya`);
});