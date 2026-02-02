// Завантажуємо змінні оточення з файлу .env в process.env
require('dotenv').config()

// Отримуємо PORT з файлу .env (наприклад PORT=3001)
const PORT = process.env.PORT
// Отримуємо URL підключення до MongoDB з файлу .env
// (наприклад MONGODB_URI=mongodb://localhost:27017/mydb)
const MONGODB_URI = process.env.MONGODB_URI

// Експортуємо змінні щоб використовувати в інших файлах
// Замість require('dotenv') в кожному файлі, просто:
// const config = require('./utils/config')
// config.PORT, config.MONGODB_URI
module.exports = { MONGODB_URI, PORT }
