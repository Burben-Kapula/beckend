const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();

// Моделі
const Person = require('./models/person');
const Blog = require('./models/blog');

// Middleware
app.use(cors());
app.use(express.json());

// Підключення до MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('connected to MongoDB'))
  .catch((error) => console.error('error connecting to MongoDB:', error.message));

// --- ВАЛІДАЦІЯ ---

function validatePerson(req, res, next) {
  const { name, email, password } = req.body;
  
  if (!name || typeof name !== 'string' || name.length < 3) {
    return res.status(400).json({ error: 'Name must be at least 3 characters long' });
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (password.length > 64) errors.push('less than 64 characters');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter (a-z)');
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter (A-Z)');
  if (!/[0-9]/.test(password)) errors.push('one digit (0-9)');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('one special character (!@#$%^&*...)');
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: `Password must contain: ${errors.join(', ')}` 
    });
  }
  next();
}

// --- МАРШРУТИ PERSON ---

app.get('/api/persons', async (req, res) => {
  const persons = await Person.find({});
  res.json(persons);
});

app.post('/api/persons', validatePerson, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const person = new Person({ name, email, passwordHash });
    const savedPerson = await person.save();
    res.status(201).json(savedPerson);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const person = await Person.findOne({ email });

  const passwordCorrect = person === null 
    ? false 
    : await bcrypt.compare(password, person.passwordHash);

  if (!(person && passwordCorrect)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.status(200).json({
    message: 'Login successful',
    user: { email: person.email, name: person.name, id: person._id }
  });
});

// --- МАРШРУТИ BLOGS ---

app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog.find({})
    .populate('author', 'name email')
    .populate('comments.user', 'name');
  res.json(blogs);
});

app.post('/api/blogs', async (req, res) => {
  const { title, content, userId } = req.body;
  
  if (!userId) return res.status(401).json({ error: 'User not authenticated' });
  if (!title || title.length < 3) return res.status(400).json({ error: 'Title too short' });
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const blog = new Blog({ title, content, author: userId });
  const savedBlog = await blog.save();
  const populatedBlog = await Blog.findById(savedBlog._id).populate('author', 'name email');
  res.status(201).json(populatedBlog);
});

app.put('/api/blogs/:id/like', async (req, res) => {
  const { userId } = req.body;
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  blog.dislikes = blog.dislikes.filter(id => id.toString() !== userId);
  if (blog.likes.includes(userId)) {
    blog.likes = blog.likes.filter(id => id.toString() !== userId);
  } else {
    blog.likes.push(userId);
  }

  await blog.save();
  res.json(await blog.populate(['author', 'comments.user']));
});

app.post('/api/blogs/:id/comments', async (req, res) => {
  const { userId, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text is required' });

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  blog.comments.push({ user: userId, text, createdAt: new Date() });
  await blog.save();
  res.status(201).json(await blog.populate(['author', 'comments.user']));
});

// Видалення коментаря (виправлений метод)
app.delete('/api/blogs/:blogId/comments/:commentId', async (req, res) => {
  const { blogId, commentId } = req.params;
  const { userId } = req.body;

  const blog = await Blog.findById(blogId);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  const comment = blog.comments.id(commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  if (comment.user.toString() !== userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // Використовуємо filter замість .remove(), щоб уникнути проблем з версіями
  blog.comments = blog.comments.filter(c => c._id.toString() !== commentId);
  await blog.save();
  res.json(await blog.populate(['author', 'comments.user']));
});
// Видалення блогу
app.delete('/api/blogs/:id', async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(401).json({ error: 'User not authenticated' });

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  if (blog.author.toString() !== userId) {
    return res.status(403).json({ error: 'Only the author can delete this blog' });
  }

  await Blog.findByIdAndDelete(req.params.id);
  res.status(204).end();
});
// Дізлайк
app.put('/api/blogs/:id/dislike', async (req, res) => {
  const { userId } = req.body;
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  blog.likes = blog.likes.filter(id => id.toString() !== userId);
  if (blog.dislikes.includes(userId)) {
    blog.dislikes = blog.dislikes.filter(id => id.toString() !== userId);
  } else {
    blog.dislikes.push(userId);
  }

  await blog.save();
  res.json(await blog.populate(['author', 'comments.user']));
});

// Обробка 404
app.use((req, res) => {
  res.status(404).json({ error: 'unknown endpoint' });
});

module.exports = app;