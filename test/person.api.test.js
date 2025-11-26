const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

test('POST /api/persons with invalid name returns 400', async () => {
  const invalidPerson = { name: 'Al', number: '123-45678901' }
  await api.post('/api/persons').send(invalidPerson).expect(400)
})

test('POST /api/persons with invalid number returns 400', async () => {
  const invalidPerson = { name: 'Alex', number: '12-123456789' }
  await api.post('/api/persons').send(invalidPerson).expect(400)
})

test('POST /api/persons with valid data succeeds', async () => {
  const validPerson = { name: 'Alex', number: '123-45678901' }
  await api.post('/api/persons').send(validPerson).expect(201)
})
