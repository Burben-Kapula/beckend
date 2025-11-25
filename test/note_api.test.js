const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Person = require('../models/person')

const api = supertest(app)

const initialPersons = [
  { content: 'HTML is easy', important: false },
  { content: 'Browser can execute only JavaScript', important: true },
]

// Очищення й підготовка колекції перед тестами
beforeEach(async () => {
  await Person.deleteMany({})
  for (const person of initialPersons) {
    await new Person(person).save()
  }
})

test('persons are returned as json', async () => {
  await api
    .get('/api/persons')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all persons are returned', async () => {
  const response = await api.get('/api/persons')
  assert.strictEqual(response.body.length, initialPersons.length)
})

test('a specific person is within the returned persons', async () => {
  const response = await api.get('/api/persons')
  const contents = response.body.map(e => e.content)
  assert.strictEqual(contents.includes('HTML is easy'), true)
})

test('a valid person can be added', async () => {
  const newPerson = {
    content: 'async/await simplifies making async calls',
    important: true,
  }
  await api
    .post('/api/persons')
    .send(newPerson)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/persons')
  const contents = response.body.map(r => r.content)
  assert.strictEqual(response.body.length, initialPersons.length + 1)
  assert(contents.includes('async/await simplifies making async calls'))
})

after(async () => {
  await mongoose.connection.close()
})
