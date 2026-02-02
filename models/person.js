// Імпортуємо mongoose для роботи з MongoDB
const mongoose = require('mongoose');

// Створюємо схему (структуру) для документів Person в MongoDB
const personSchema = new mongoose.Schema({
  // Поле name - рядок, обов'язкове, мінімум 2 символи
  name: { 
    type: String, 
    required: true, 
    minlength: 2 
  },
  // **НОВЕ**: Поле email - рядок, обов'язкове, унікальне, з валідацією формату
  email: { 
    type: String, 
    required: true,  // Обов'язкове поле
    unique: true,    // Email має бути унікальним (не можна 2 акаунти з одним email)
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/  // Regex для перевірки формату email
  },
  // **НОВЕ**: Поле passwordHash - зберігає хешований пароль (НЕ plain text!)
  passwordHash: { 
    type: String, 
    required: true   // Обов'язкове поле
  }
});

// **НОВЕ**: Налаштовуємо що повертається при JSON.stringify()
// Видаляємо passwordHash і __v з відповіді (безпека!)
personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    // Перетворюємо _id в id (зручніше для frontend)
    returnedObject.id = returnedObject._id.toString()
    // Видаляємо _id з відповіді
    delete returnedObject._id
    // Видаляємо __v (version key mongoose)
    delete returnedObject.__v
    // **ВАЖЛИВО**: Видаляємо passwordHash щоб не відправляти пароль клієнту
    delete returnedObject.passwordHash
  }
})

// Створюємо модель Person на основі схеми і експортуємо її
// 'Person' - назва колекції в MongoDB (стане 'persons' автоматично)
// personSchema - правила валідації для цієї колекції
module.exports = mongoose.model('Person', personSchema);
