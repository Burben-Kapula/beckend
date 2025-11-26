// app.js

// Middleware для перевірки ім'я та номеру
function validatePerson(req, res, next) {
  const { name, number } = req.body;

  // Перевірка імені: мінімум 3 букви
  if (!name || typeof name !== 'string' || name.length < 3) {
    return res.status(400).json({ error: 'Name must be at least 3 characters long' });
  }

  // Перевірка номеру: формат 000-00000000
  const numberPattern = /^\d{3}-\d{8}$/;
  if (!numberPattern.test(number)) {
    return res.status(400).json({ error: 'Number must match format 000-00000000' });
  }

  next();
}

// Додаємо middleware до маршруту POST
app.post('/api/persons', validatePerson, async (req, res) => {
  const { name, number } = req.body;
  const person = new Person({ name, number });
  const savedPerson = await person.save();
  res.status(201).json(savedPerson);
});
