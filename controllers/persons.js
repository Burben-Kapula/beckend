// Імпортуємо Router з Express для створення окремих маршрутів
const personsRouter = require('express').Router();
// Імпортуємо модель Person для роботи з базою даних MongoDB
const Person = require('../models/person');

// GET запит на '/' - отримує всіх персон з бази даних
personsRouter.get('/', async (req, res) => {
  // Знаходимо всі документи в колекції Person (повертає масив)
  const persons = await Person.find({});
  // Відправляємо масив персон клієнту у форматі JSON
  res.json(persons);
});

// POST запит на '/' - створює нову персону в базі даних
personsRouter.post('/', async (req, res) => {
  // Деструктуризуємо name з тіла запиту
  const { name } = req.body;
  // Створюємо новий екземпляр Person з отриманими даними
  const person = new Person({ name });
  // Зберігаємо персону в базі даних (MongoDB автоматично додає _id)
  const saved = await person.save();
  // Відправляємо збережену персону клієнту зі статусом 201 (Created)
  res.status(201).json(saved);
});

// Експортуємо роутер щоб використати його в головному app.js файлі
module.exports = personsRouter;
