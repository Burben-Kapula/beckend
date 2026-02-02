
// Middleware функція для валідації даних персони перед збереженням в БД
function validatePerson(req, res, next) {
  // Деструктуризуємо name і number з тіла запиту
  const { name } = req.body;
  
  // Перевіряємо чи name існує, чи це рядок, і чи довжина >= 3 символи
  if (!name || typeof name !== 'string' || name.length < 3) {
    // Якщо умова не виконується - повертаємо помилку 400 і зупиняємо виконання
    return res.status(400).json({ error: 'Name must be at least 3 characters long' });
  }
  
  // Regex pattern: 3 цифри + дефіс + 8 цифр (наприклад 123-45678901)
  // const numberPattern = /^\d{3}-\d{8}$/;
  
  // // Перевіряємо чи number відповідає патерну
  // if (!numberPattern.test(number)) {
  //   // Якщо не відповідає - повертаємо помилку 400
  //   return res.status(400).json({ error: 'Number must match 000-00000000' });
  // }
  
  // Якщо всі перевірки пройшли - викликаємо next() 
  // щоб передати управління наступному middleware або обробнику маршруту
  next();
}

// POST маршрут з middleware validatePerson
// Спочатку виконується validatePerson, потім (якщо валідація ОК) - async функція
app.post('/api/persons', validatePerson, async (req, res) => {
  // Деструктуризуємо дані (вже провалідовані)
  const { name } = req.body;
  // Створюємо новий документ Person
  const person = new Person({ name });
  // Зберігаємо в MongoDB
  const savedPerson = await person.save();
  // Повертаємо збережену персону зі статусом 201 (Created)
  res.status(201).json(savedPerson);
});
