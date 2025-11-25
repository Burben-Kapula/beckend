const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const personsRouter = require('./controllers/persons')
const cors = require('cors');
const app = express()

app.use(cors());
app.use(express.json())
app.use(middleware.requestLogger)
app.use(express.static('dist'))
app.use('/api/persons', personsRouter)

// Додаємо маршрут для кореня!
app.get('/', (req, res) => {
  res.send('Backend Phonebook API is running');
});

// Обробник для неіснуючих endpoint (404)
app.use(middleware.unknownEndpoint);

// Централізований обробник помилок
app.use(middleware.errorHandler)

module.exports = app
