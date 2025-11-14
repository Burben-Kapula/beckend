const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

let persons = [
  { id: 1, name: "Anna", number: "123456" },
  { id: 2, name: "Ivan", number: "654321" },
];

// Отримати всі контакти
app.get('/api/notes', (req, res) => {
  res.json(persons);
});

// Додати новий контакт
app.post('/api/notes', (req, res) => {
  const body = req.body;
  const newPerson = {
    id: Math.floor(Math.random() * 1000000),
    name: body.name,
    number: body.number
  };
  persons.push(newPerson);
  res.json(newPerson);
});

// Видалити контакт
app.delete('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  persons = persons.filter(person => person.id !== id);
  res.status(204).end();
});

// Оновити контакт
app.put('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body;
  const personIndex = persons.findIndex(person => person.id === id);

  if (personIndex !== -1) {
    const updatedPerson = { ...persons[personIndex], ...body };
    persons[personIndex] = updatedPerson;
    res.json(updatedPerson);
  } else {
    res.status(404).end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
