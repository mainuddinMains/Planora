const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const taskService = require('../services/taskService');

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, course_id, description, due_date, duration, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    const task = await taskService.createTask(req.user.userId, {
      title: title.trim(),
      course_id,
      description,
      due_date,
      duration,
      priority
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const filters = {
      completed: req.query.completed !== undefined ? req.query.completed === 'true' : undefined,
      priority: req.query.priority,
      course_id: req.query.course_id,
      search: req.query.search
    };

    const tasks = await taskService.getTasksByUser(req.user.userId, filters);
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.user.userId, req.body);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const task = await taskService.deleteTask(req.params.id, req.user.userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
