const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const Person = require('../models/person')
const bcrypt = require('bcrypt')
const api = supertest(app)

beforeEach(async () => {
  await Person.deleteMany({})
})

// Тест 1 - реєстрація з невалідним ім'ям
test('POST /api/persons with invalid name (too short) returns 400', async () => {
  const invalidPerson = { 
    name: 'A',
    email: 'test@example.com',
    password: 'StrongPassword123!'
  }
  await api
    .post('/api/persons')
    .send(invalidPerson)
    .expect(400)
  
  const personsInDb = await Person.find({})
  expect(personsInDb).toHaveLength(0)
})

// Тест 2 - реєстрація без email
test('POST /api/persons without email returns 400', async () => {
  const invalidPerson = {
    name: 'Alex',
    password: 'StrongPassword123!'
  }
  const response = await api
    .post('/api/persons')
    .send(invalidPerson)
    .expect(400)
  
  expect(response.body.error).toContain('email')
})

// Тест 3 - невалідний email
test('POST /api/persons with invalid email format returns 400', async () => {
  const invalidPerson = {
    name: 'Alex',
    email: 'not-an-email',
    password: 'StrongPassword123!'
  }
  await api.post('/api/persons').send(invalidPerson).expect(400)
})

// Тест 4 - занадто короткий пароль (виправлено очікування на 8 символів)
test('POST /api/persons with short password returns 400', async () => {
  const invalidPerson = {
    name: 'Alex',
    email: 'alex@example.com',
    password: '123' 
  }
  const response = await api.post('/api/persons').send(invalidPerson).expect(400)
  expect(response.body.error).toContain('at least 8 characters')
})

// Тест 5 - успішна реєстрація (виправлено імена та дані)
test('POST /api/persons with valid data succeeds', async () => {
  const validPerson = {
    name: 'Alex',
    email: 'alex@example.com',
    password: 'StrongPassword123!'
  }
  
  const response = await api
    .post('/api/persons')
    .send(validPerson)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  
  expect(response.body.name).toBe('Alex')
  expect(response.body.email).toBe('alex@example.com')
  expect(response.body.passwordHash).toBeUndefined()
  
  const personsInDb = await Person.find({})
  expect(personsInDb).toHaveLength(1)
  expect(personsInDb[0].name).toBe('Alex')
}, 10000)

// Тест 6 - дублікат email (виправлено дані для user2)
test('POST /api/persons with duplicate email returns 400', async () => {
  const user1 = {
    name: 'Alex',
    email: 'alex@example.com',
    password: 'StrongPassword123!'
  }
  await api.post('/api/persons').send(user1).expect(201)

  const user2 = {
    name: 'Bob',
    email: 'alex@example.com', 
    password: 'AnotherPassword123!' // Пароль МАЄ бути валідним
  }
  
  const response = await api.post('/api/persons').send(user2).expect(400)
  expect(response.body.error).toContain('already registered')
}, 10000)

// Тест 7 - логін успішний
test('POST /api/login with correct credentials succeeds', async () => {
  const passwordHash = await bcrypt.hash('secret123', 10)
  const user = new Person({
    name: 'Alex',
    email: 'alex@example.com',
    passwordHash
  })
  await user.save()
  
  const loginData = { email: 'alex@example.com', password: 'secret123' }
  const response = await api.post('/api/login').send(loginData).expect(200)
  
  expect(response.body.message).toBe('Login successful')
  expect(response.body.user.name).toBe('Alex')
}, 10000)

// Тест 8 - логін: невірний пароль
test('POST /api/login with wrong password returns 401', async () => {
  const passwordHash = await bcrypt.hash('secret123', 10)
  const user = new Person({
    name: 'Alex',
    email: 'alex@example.com',
    passwordHash
  })
  await user.save()
  
  const loginData = { email: 'alex@example.com', password: 'wrong' }
  await api.post('/api/login').send(loginData).expect(401)
}, 10000)

// Тест 9 - логін: неіснуючий email
test('POST /api/login with non-existent email returns 401', async () => {
  const loginData = { email: 'none@test.com', password: 'Password123!' }
  await api.post('/api/login').send(loginData).expect(401)
})

afterAll(async () => {
  await Person.deleteMany({})
  await mongoose.connection.close()
})