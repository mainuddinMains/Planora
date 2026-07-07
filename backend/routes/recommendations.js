const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const recommendationService = require('../services/recommendationService');

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

router.get('/today', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const recommendations = await recommendationService.getTodayRecommendations(
      req.user.userId,
      limit
    );

    res.json({
      recommendations,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

router.get('/workload', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    if (!ISO_DATE_RE.test(startDate) || !ISO_DATE_RE.test(endDate)) {
      return res.status(400).json({ error: 'Dates must be in ISO format (YYYY-MM-DD)' });
    }

    const workload = await recommendationService.getWorkloadDistribution(
      req.user.userId,
      startDate,
      endDate
    );

    res.json(workload);
  } catch (error) {
    console.error('Get workload error:', error);
    res.status(500).json({ error: 'Failed to get workload distribution' });
  }
});

module.exports = router;
