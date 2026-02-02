// Імпортуємо Express фреймворк для створення веб-сервера
const express = require('express');
// Створюємо екземпляр Express додатку
const app = express();
// Імпортуємо CORS middleware для дозволу запитів з інших доменів
const cors = require('cors');
// **НОВИЙ ІМПОРТ**: bcrypt для хешування паролів
const bcrypt = require('bcrypt');

// Підключаємо CORS - дозволяє frontend з іншого порту робити запити
app.use(cors());
// Підключаємо middleware для парсингу JSON в req.body
app.use(express.json());

// Імпортуємо mongoose для роботи з MongoDB
const mongoose = require('mongoose');
// Завантажуємо змінні оточення з .env файлу
require('dotenv').config();

// Підключаємось до MongoDB
mongoose.connect(process.env.MONGODB_URI, { family: 4 })
  // Якщо підключення успішне - виводимо повідомлення
  .then(() => console.log('connected to MongoDB'))
  // Якщо помилка підключення - виводимо помилку
  .catch((error) => console.error('error connecting to MongoDB:', error.message));

// Імпортуємо модель Person для роботи з колекцією persons
const Person = require('./models/person');

// Middleware функція для валідації даних персони перед збереженням в БД
function validatePerson(req, res, next) {
  const { name, email, password } = req.body;
  
  // Валідація імені
  if (!name || typeof name !== 'string' || name.length < 3) {
    return res.status(400).json({ error: 'Name must be at least 3 characters long' });
  }
  
  // Валідація email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  // **ОНОВЛЕНА ВАЛІДАЦІЯ ПАРОЛЯ** - збираємо всі помилки одразу
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  const errors = [];
  
  // Перевірка довжини
  if (password.length < 8) {
    errors.push('at least 8 characters');
  }
  
  if (password.length > 64) {
    errors.push('less than 64 characters');
  }
  
  // Перевірка на малу літеру
  if (!/[a-z]/.test(password)) {
    errors.push('one lowercase letter (a-z)');
  }
  
  // Перевірка на велику літеру
  if (!/[A-Z]/.test(password)) {
    errors.push('one uppercase letter (A-Z)');
  }
  
  // Перевірка на цифру
  if (!/[0-9]/.test(password)) {
    errors.push('one digit (0-9)');
  }
  
  // Перевірка на спецсимвол
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('one special character (!@#$%^&*...)');
  }
  
  // Якщо є помилки - повертаємо їх всі одразу
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: `Password must contain: ${errors.join(', ')}` 
    });
  }
  
  next();
}


// GET маршрут - отримати всіх персон
app.get('/api/persons', async (req, res) => {
  try {
    // Шукаємо всі документи в колекції Person
    const persons = await Person.find({});
    // Відправляємо масив персон у форматі JSON
    res.json(persons);
  } catch (error) {
    // Якщо помилка БД - відправляємо статус 500 (Internal Server Error)
    res.status(500).json({ error: 'Failed to fetch persons' });
  }
});

// **ОНОВЛЕНИЙ** POST маршрут - створити нову персону
// validatePerson виконається ПЕРЕД async функцією
app.post('/api/persons', validatePerson, async (req, res) => {
  try {
    // Деструктуризуємо ВСІ поля (не тільки name!)
    const { name, email, password } = req.body;
    
    // **ВАЖЛИВО**: Хешуємо пароль перед збереженням в БД
    // bcrypt.hash(password, 10) - 10 це "salt rounds" (рівень складності)
    // Ніколи не зберігай пароль в plain text!
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Створюємо новий документ Person з усіма полями
    const person = new Person({ 
      name,
      email,
      passwordHash  // Зберігаємо хеш, а не password
    });
    
    // Зберігаємо в MongoDB (mongoose валідує за схемою + перевіряє unique email)
    const savedPerson = await person.save();
    
    // Відправляємо збережену персону (passwordHash автоматично видалиться через toJSON в схемі)
    res.status(201).json(savedPerson);
  } catch (error) {
    // **НОВИЙ**: Обробка помилки дублікату email
        // Код 11000 = duplicate key error в MongoDB
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    // Інші помилки валідації або БД
    res.status(400).json({ error: error.message });
  }
});

// **НОВИЙ** POST маршрут - логін користувача
app.post('/api/login', async (req, res) => {
  try {
    // Отримуємо email і password з запиту
    const { email, password } = req.body;
    
    // Шукаємо користувача в БД за email
    const person = await Person.findOne({ email });
    
    // Якщо користувача з таким email немає
    if (!person) {
      // Повертаємо загальну помилку (не розкриваємо чи існує email - безпека!)
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Порівнюємо введений пароль з хешем в БД
    // bcrypt.compare автоматично хешує password і порівнює
    const passwordCorrect = await bcrypt.compare(password, person.passwordHash);
    
    // Якщо пароль невірний
    if (!passwordCorrect) {
      // Та сама загальна помилка (не розкриваємо що саме неправильно)
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Якщо все ОК - повертаємо дані користувача (БЕЗ passwordHash!)
    res.status(200).json({
      message: 'Login successful',  // Додай це поле!
      user: {                        // Загорни дані в об'єкт user
        email: person.email,
        name: person.name,
        id: person._id
      }
    });
  } catch (error) {
    // Помилка сервера
    res.status(500).json({ error: 'Login failed' });
  }
});

// DELETE маршрут - видалити персону за ID
app.delete('/api/persons/:id', async (req, res) => {
  try {
    // Знаходимо і видаляємо документ за ID з URL параметра
    await Person.findByIdAndDelete(req.params.id);
    // Відправляємо статус 204 (No Content) - успішно видалено
    res.status(204).end();
  } catch (error) {
    // Якщо помилка (наприклад невалідний ID) - відправляємо 500
    res.status(500).json({ error: 'Delete failed' });
  }
});
// app.js - ДОДАЙ після маршрутів Person

const Blog = require('./models/blog');

// **НОВИЙ**: GET всі блоги
app.get('/api/blogs', async (req, res) => {
  try {
    // populate заповнює дані автора і користувачів в лайках/коментах
    const blogs = await Blog.find({})
      .populate('author', 'name email')  // Додає дані автора
      .populate('comments.user', 'name');  // Додає імена користувачів в коментах
    
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// **НОВИЙ**: POST створити блог
app.post('/api/blogs', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Отримуємо ID користувача з body (в production використовуй JWT token!)
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!title || title.length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const blog = new Blog({
      title,
      content,
      author: userId,
      likes: [],
      dislikes: [],
      comments: []
    });
    
    const savedBlog = await blog.save();
    const populatedBlog = await Blog.findById(savedBlog._id).populate('author', 'name email');
    
    res.status(201).json(populatedBlog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// **НОВИЙ**: PUT додати лайк
app.put('/api/blogs/:id/like', async (req, res) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Видаляємо дізлайк якщо був
    blog.dislikes = blog.dislikes.filter(id => id.toString() !== userId);
    
    // Перевіряємо чи вже є лайк від цього користувача
    if (blog.likes.includes(userId)) {
      // Якщо є - видаляємо (unlike)
      blog.likes = blog.likes.filter(id => id.toString() !== userId);
    } else {
      // Якщо немає - додаємо
      blog.likes.push(userId);
    }
    
    await blog.save();
    const updatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name');
    
    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// **НОВИЙ**: PUT додати дізлайк
app.put('/api/blogs/:id/dislike', async (req, res) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Видаляємо лайк якщо був
    blog.likes = blog.likes.filter(id => id.toString() !== userId);
    
    // Перевіряємо чи вже є дізлайк
    if (blog.dislikes.includes(userId)) {
      // Якщо є - видаляємо (undislike)
      blog.dislikes = blog.dislikes.filter(id => id.toString() !== userId);
    } else {
      // Якщо немає - додаємо
      blog.dislikes.push(userId);
    }
    
    await blog.save();
    const updatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name');
    
    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// **НОВИЙ**: POST додати коментар
app.post('/api/blogs/:id/comments', async (req, res) => {
  try {
    const { userId, text } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Додаємо коментар в масив
    blog.comments.push({
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    });
    
    await blog.save();
    const updatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name');
    
    res.status(201).json(updatedBlog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// **НОВИЙ**: DELETE видалити коментар
app.delete('/api/blogs/:blogId/comments/:commentId', async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Знаходимо коментар
    const comment = blog.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Перевіряємо чи користувач автор коментаря
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    // Видаляємо коментар
    comment.remove();
    await blog.save();
    
    const updatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name');
    
    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// **НОВИЙ**: DELETE видалити блог
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Перевіряємо чи користувач автор блогу
    if (blog.author.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own blogs' });
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Middleware для обробки неіснуючих маршрутів (404)
// Виконується якщо жоден з попередніх маршрутів не спрацював
app.use((req, res) => {
  // Відправляємо статус 404 (Not Found) з повідомленням про помилку
  res.status(404).json({ error: 'unknown endpoint' });
});

// Експортуємо app для використання в index.js (запуск сервера) та тестах
module.exports = app;
