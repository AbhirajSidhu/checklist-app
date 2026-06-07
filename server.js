const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to handle JSON data and serve your HTML page
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database (it creates a file named checklist.db automatically)
const db = new sqlite3.Database('./checklist.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

// Create the database table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0
)`);

// Route: Get all tasks
app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM tasks', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Route: Add a new task
app.post('/api/tasks', (req, res) => {
    const { text } = req.body;
    db.run('INSERT INTO tasks (text) VALUES (?)', [text], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, text, completed: 0 });
    });
});

// Route: Update a task (check/uncheck)
app.put('/api/tasks/:id', (req, res) => {
    const { completed } = req.body;
    const { id } = req.params;
    db.run('UPDATE tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Route: Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});