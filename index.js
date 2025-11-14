const express = require('express')
const app = express()
const morgan = require('morgan');
app.use(morgan('tiny'));

app.use(express.json()) // додай для парсингу JSON
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

let persons = [
  {
    id: 1,
    name: "Arto Hellas",
    number: "040-123456"
  },
  {
    id: 2,
    name: "Ada Lovelace",
    number: "39-44-5323523"
  },
  {
    id: 3,
    name: "Dan Abramov",
    number: "12-43-234345"
  },
  {
    id: 4,
    name: "Mary Poppendieck",
    number: "39-23-6423122"
  }
]


// GET по id (правильно)
app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)
  if (person) {
    response.json(person)
  } else {
    response.status(404).end()
  }
})


// DELETE (правильно)
app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id) // перевести у число!
  persons = persons.filter(person => person.id !== id)
  response.status(204).end()
})

// POST (правильно)
app.post('/api/persons', (request, response) => {
  const body = request.body;

  // Перевірка, чи є імʼя та номер
  if (!body.name || !body.number) {
    return response.status(400).json({ error: 'name or number missing' });
  }

  // Генерація випадкового унікального id
  const generateId = () => {
    // Великий діапазон для унікальності
    return Math.floor(Math.random() * 10000000);
  };

  const person = {
    id: generateId(),
    name: body.name,
    number: body.number
  };

  persons = persons.concat(person);

  response.status(201).json(person); // Повертає створений обʼєкт
});

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
