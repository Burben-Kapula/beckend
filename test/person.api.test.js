// Імпортуємо supertest для тестування HTTP запитів
const supertest = require('supertest')
// Імпортуємо mongoose для закриття з'єднання з MongoDB після тестів
const mongoose = require('mongoose')
// Імпортуємо наш Express додаток
const app = require('../app')
// Імпортуємо модель Person для очищення БД перед/після тестів
const Person = require('../models/person')
// **НОВЕ**: Імпортуємо bcrypt для тестування хешування паролів
const bcrypt = require('bcrypt')
// Створюємо обгортку над app для тестування API запитів
const api = supertest(app)

// Hook який виконується ПЕРЕД КОЖНИМ тестом
beforeEach(async () => {
  // Видаляємо всі документи з колекції persons
  // Це гарантує що кожен тест починається з чистої БД
  await Person.deleteMany({})
})

// **НОВЕ**: Тест 1 - реєстрація з невалідним ім'ям (занадто коротке)
test('POST /api/persons with invalid name (too short) returns 400', async () => {
  // Створюємо персону з невалідним ім'ям (1 символ замість мінімум 2)
  const invalidPerson = { 
    name: 'A',
    email: 'test@example.com',
    password: 'secret123'
  }
  // Відправляємо POST запит і очікуємо статус 400 (Bad Request)
  await api
    .post('/api/persons')
    .send(invalidPerson)
    .expect(400)
    .expect('Content-Type', /application\/json/)
  
  // Перевіряємо що нічого не збереглось в БД
  const personsInDb = await Person.find({})
  expect(personsInDb).toHaveLength(0)
})

// **НОВЕ**: Тест 2 - реєстрація без email
test('POST /api/persons without email returns 400', async () => {
  // Об'єкт без email
  const invalidPerson = {
    name: 'Alex',
    password: 'secret123'
  }
  // Очікуємо статус 400 бо email обов'язкове (required: true)
  const response = await api
    .post('/api/persons')
    .send(invalidPerson)
    .expect(400)
    .expect('Content-Type', /application\/json/)
  
  // Перевіряємо що повернулась правильна помилка
  expect(response.body.error).toContain('email')
})

// **НОВЕ**: Тест 3 - реєстрація з невалідним email форматом
test('POST /api/persons with invalid email format returns 400', async () => {
  const invalidPerson = {
    name: 'Alex',
    email: 'not-an-email',  // Невалідний формат
    password: 'secret123'
  }
  
  await api
    .post('/api/persons')
    .send(invalidPerson)
    .expect(400)
    .expect('Content-Type', /application\/json/)
  
  // Перевіряємо що нічого не збереглось
  const personsInDb = await Person.find({})
  expect(personsInDb).toHaveLength(0)
})

// **НОВЕ**: Тест 4 - реєстрація з занадто коротким паролем
test('POST /api/persons with short password returns 400', async () => {
  const invalidPerson = {
    name: 'Alex',
    email: 'alex@example.com',
    password: '12345'  // Тільки 5 символів, а потрібно мінімум 6
  }
  
  const response = await api
    .post('/api/persons')
    .send(invalidPerson)
    .expect(400)
  
  // Перевіряємо текст помилки
  expect(response.body.error).toContain('at least 6 characters')
})

// **НОВЕ**: Тест 5 - успішна реєстрація з валідними даними
test('POST /api/persons with valid data succeeds', async () => {
  // Створюємо персону з валідними даними
  const validPerson = { 
    name: 'Alex',
    email: 'alex@example.com',
    password: 'secret123'
  }
  
  // Відправляємо POST запит і очікуємо статус 201 (Created)
  const response = await api
    .post('/api/persons')
    .send(validPerson)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  
  // **НОВЕ**: Перевіряємо що відповідь містить правильні дані
  expect(response.body.name).toBe('Alex')
  expect(response.body.email).toBe('alex@example.com')
  // **ВАЖЛИВО**: Перевіряємо що passwordHash НЕ повертається клієнту
  expect(response.body.passwordHash).toBeUndefined()
  expect(response.body.password).toBeUndefined()
  
  // Перевіряємо що персона дійсно збережена в БД
  const personsInDb = await Person.find({})
  expect(personsInDb).toHaveLength(1)
  expect(personsInDb[0].name).toBe('Alex')
  expect(personsInDb[0].email).toBe('alex@example.com')
  // **НОВЕ**: Перевіряємо що пароль хешований (не plain text)
  expect(personsInDb[0].passwordHash).toBeDefined()
  expect(personsInDb[0].passwordHash).not.toBe('secret123')
}, 10000)  // Збільшуємо timeout до 10000 мс (10 секунд)

// **НОВЕ**: Тест 6 - неможливо створити два акаунти з однаковим email
test('POST /api/persons with duplicate email returns 400', async () => {
  // Створюємо першого користувача
  const user1 = {
    name: 'Alex',
    email: 'alex@example.com',
    password: 'secret123'
  }
  
  await api
    .post('/api/persons')
    .send(user1)
    .expect(201)
  
  // Намагаємось створити другого з тим же email
  const user2 = {
    name: 'Bob',
    email: 'alex@example.com',  // Той самий email!
    password: 'another123'
  }
  
  const response = await api
    .post('/api/persons')
    .send(user2)
    .expect(400)
  
  // Перевіряємо повідомлення про помилку
  expect(response.body.error).toContain('already registered')
  
  // Перевіряємо що в БД залишився тільки перший користувач
  const personsInDb = await Person.find({})
  expect(personsInDb).toHaveLength(1)
  expect(personsInDb[0].name).toBe('Alex')
}, 10000)

// **НОВЕ**: Тест 7 - успішний логін з правильними даними
test('POST /api/login with correct credentials succeeds', async () => {
  // Спочатку реєструємо користувача
  const passwordHash = await bcrypt.hash('secret123', 10)
  const user = new Person({
    name: 'Alex',
    email: 'alex@example.com',
    passwordHash
  })
  await user.save()
  
  // Намагаємось залогінитись
  const loginData = {
    email: 'alex@example.com',
    password: 'secret123'
  }
  
  const response = await api
    .post('/api/login')
    .send(loginData)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
  // Перевіряємо відповідь
  expect(response.body.message).toBe('Login successful')
  expect(response.body.user.name).toBe('Alex')
  expect(response.body.user.email).toBe('alex@example.com')
  // Перевіряємо що пароль не повертається
  expect(response.body.user.passwordHash).toBeUndefined()
}, 10000)

// **НОВЕ**: Тест 8 - логін з неправильним паролем
test('POST /api/login with wrong password returns 401', async () => {
  // Реєструємо користувача
  const passwordHash = await bcrypt.hash('secret123', 10)
  const user = new Person({
    name: 'Alex',
    email: 'alex@example.com',
    passwordHash
  })
  await user.save()
  
  // Намагаємось залогінитись з неправильним паролем
  const loginData = {
    email: 'alex@example.com',
    password: 'wrongpassword'  // Неправильний пароль
  }
  
  const response = await api
    .post('/api/login')
    .send(loginData)
    .expect(401)
  
  // Перевіряємо повідомлення про помилку
  expect(response.body.error).toBe('Invalid email or password')
}, 10000)

// **НОВЕ**: Тест 9 - логін з неіснуючим email
test('POST /api/login with non-existent email returns 401', async () => {
  const loginData = {
    email: 'notexist@example.com',  // Такого користувача немає
    password: 'secret123'
  }
  
  const response = await api
    .post('/api/login')
    .send(loginData)
    .expect(401)
  
  expect(response.body.error).toBe('Invalid email or password')
})

// Hook який виконується ПІСЛЯ ВСІХ тестів
afterAll(async () => {
  // Очищуємо БД після завершення всіх тестів
  await Person.deleteMany({})
  // Закриваємо з'єднання з MongoDB щоб Jest міг завершитись
  await mongoose.connection.close()
})
