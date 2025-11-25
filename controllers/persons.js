const personsRouter = require('express').Router()
const Person = require('../models/person')

// GET /api/persons
personsRouter.get('/', (req, res) => {
  Person.find({}).then(persons => {
    res.json(persons)
  })
})

// GET /api/persons/:id
personsRouter.get('/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

// POST /api/persons
personsRouter.post('/', (req, res, next) => {
  const { name, number } = req.body

  const person = new Person({
    name,
    number,
  })

  person.save()
    .then(savedPerson => res.status(201).json(savedPerson))
    .catch(error => next(error))
})

// DELETE /api/persons/:id
personsRouter.delete('/:id', (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
    .then(() => res.status(204).end())
    .catch(error => next(error))
})

// PUT /api/persons/:id
personsRouter.put('/:id', (req, res, next) => {
  const { name, number } = req.body

  Person.findByIdAndUpdate(
    req.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => res.json(updatedPerson))
    .catch(error => next(error))
})

module.exports = personsRouter
