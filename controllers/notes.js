const personsRouter = require('express').Router()
const Person = require('../models/person')

// GET /api/persons
personsRouter.get('/', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

// GET /api/persons/:id
personsRouter.get('/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

// POST /api/persons
personsRouter.post('/', (request, response, next) => {
  const body = request.body

  const person = new Person({
    content: body.content,
    important: body.important || false,
  })

  person.save()
    .then(savedPerson => {
      response.status(201).json(savedPerson)
    })
    .catch(error => next(error))
})

// DELETE /api/persons/:id
personsRouter.delete('/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

// PUT /api/persons/:id
personsRouter.put('/:id', (request, response, next) => {
  const { content, important } = request.body

  Person.findById(request.params.id)
    .then(person => {
      if (!person) {
        return response.status(404).end()
      }

      person.content = content
      person.important = important

      return person.save().then((updatedPerson) => {
        response.json(updatedPerson)
      })
    })
    .catch(error => next(error))
})

module.exports = personsRouter
