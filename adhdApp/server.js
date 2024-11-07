const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = 8080;
const filePath = path.join(__dirname, 'tasks.json'); 

// Middleware to serve static files and parse JSON in requests
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Read and write tasks to the JSON file
async function readTasks() {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return []; // Return an empty array if file doesn't exist or is empty
    }
}
//Write to JSON
async function writeTasks(tasks) {
    await fs.writeFile(filePath, JSON.stringify(tasks, null, 2));
}

// CRUD Endpoints for /tasks

// Get all tasks
app.get('/tasks', async (req, res) => {
    const tasks = await readTasks();
    res.json(tasks);
});

// Add a new task
app.post('/tasks', async (req, res) => {
    const newTask = req.body;
    const tasks = await readTasks();
    tasks.push(newTask);
    await writeTasks(tasks);
    res.status(201).json(newTask);
});

// Update an existing task
app.put('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const updatedTask = req.body;
    let tasks = await readTasks();

    const index = tasks.findIndex(task => task.id === taskId);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updatedTask };
        await writeTasks(tasks);
        res.json(tasks[index]);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    let tasks = await readTasks();

    const newTasks = tasks.filter(task => task.id !== taskId);
    if (newTasks.length !== tasks.length) {
        await writeTasks(newTasks);
        res.json({ message: 'Task deleted successfully' });
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
