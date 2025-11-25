const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const personsRouter = require('./controllers/persons')

const app = express()

// Логи підключення до БД
logger.info('connecting to', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI, { family: 4 })
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

// Першим — парсинг json
app.use(express.json())
// Далі — логгер запитів
app.use(middleware.requestLogger)
// Далі — фронтенд, якщо деплоїш обидві частини на один сервер
app.use(express.static('dist'))
// API роути для контактів
app.use('/api/persons', personsRouter)
// Обробник для неіснуючих endpoint (404)
app.use(middleware.unknownEndpoint)
// Централізований обробник помилок
app.use(middleware.errorHandler)

module.exports = app
