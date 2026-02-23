const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const courseService = require('../services/courseService');

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, code, color, instructor } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    const course = await courseService.createCourse(req.user.userId, {
      name: name.trim(),
      code,
      color,
      instructor
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const courses = await courseService.getCoursesByUser(req.user.userId);
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.user.userId, req.body);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const course = await courseService.deleteCourse(req.params.id, req.user.userId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router;
