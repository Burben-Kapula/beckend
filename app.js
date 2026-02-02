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

// Middleware для обробки неіснуючих маршрутів (404)
// Виконується якщо жоден з попередніх маршрутів не спрацював
app.use((req, res) => {
  // Відправляємо статус 404 (Not Found) з повідомленням про помилку
  res.status(404).json({ error: 'unknown endpoint' });
});

// Експортуємо app для використання в index.js (запуск сервера) та тестах
module.exports = app;
