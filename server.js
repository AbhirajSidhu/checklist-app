const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./checklist.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite.');
});

// Updated table schema to include parent_id for subtasks
db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    parent_id INTEGER DEFAULT NULL
)`);

// Fetch all tasks
app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM tasks', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add a task or subtask
app.post('/api/tasks', (req, res) => {
    const { text, parent_id } = req.body; // parent_id is optional
    db.run('INSERT INTO tasks (text, parent_id) VALUES (?, ?)', [text, parent_id || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, text, completed: 0, parent_id: parent_id || null });
    });
});

// Update completion state
app.put('/api/tasks/:id', (req, res) => {
    const { completed } = req.body;
    const { id } = req.params;
    db.run('UPDATE tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Delete a task (and its subtasks if it's a parent)
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tasks WHERE id = ? OR parent_id = ?', [id, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));