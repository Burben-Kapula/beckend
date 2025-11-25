const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Note = require('../models/note')

const api = supertest(app)

const initialNotes = [
  { content: 'HTML is easy', important: false },
  { content: 'Browser can execute only JavaScript', important: true },
]

// Очищення й підготовка колекції перед тестами
beforeEach(async () => {
  await Note.deleteMany({})
  for (const note of initialNotes) {
    await new Note(note).save()
  }
})

test('notes are returned as json', async () => {
  await api
    .get('/api/notes')
    .expect(200)
    .expect('Content-Type', /application\/json/)
}) // присутній у курсі [web:64][web:75]

test('all notes are returned', async () => {
  const response = await api.get('/api/notes')
  assert.strictEqual(response.body.length, initialNotes.length)
}) // присутній у курсі [web:64][web:75]

test('a specific note is within the returned notes', async () => {
  const response = await api.get('/api/notes')
  const contents = response.body.map(e => e.content)
  assert.strictEqual(contents.includes('HTML is easy'), true)
}) // присутній у курсі [web:64][web:75]

test('a valid note can be added', async () => {
  const newNote = {
    content: 'async/await simplifies making async calls',
    important: true,
  }
  await api
    .post('/api/notes')
    .send(newNote)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/notes')
  const contents = response.body.map(r => r.content)
  assert.strictEqual(response.body.length, initialNotes.length + 1)
  assert(contents.includes('async/await simplifies making async calls'))
}) // присутній у курсі [web:64][web:75]

after(async () => {
  await mongoose.connection.close()
}) // присутній у курсі [web:64][web:75]
