const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);

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
    res.status(200).json({ message: 'Login successful!', user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/blog', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newBlog = new Blog({ title, content, author });
    await newBlog.save();
    res.status(201).json({ message: 'Blog created successfully!', blog: newBlog });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/blog', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.get('/api/blog/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.delete('/api/blog/:id', async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Blog deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/api/blog/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );
    res.status(200).json({ message: 'Blog updated successfully!', blog: updatedBlog });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server ${process.env.PORT} port pe start ho gaya`);
});