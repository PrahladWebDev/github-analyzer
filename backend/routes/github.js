const express = require('express');
const router = express.Router();
const { analyzeUser } = require('../services/personalityEngine');

router.get('/analyze/:username', async (req, res) => {
  try {
    const deep = req.query.deep === 'true';
    const analysis = await analyzeUser(req.params.username, { deepLanguages: deep });
    res.json(analysis);
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) return res.status(404).json({ error: 'GitHub user not found' });
    if (status === 403) return res.status(429).json({ error: 'GitHub API rate limit hit. Add a GITHUB_TOKEN to .env for higher limits.' });
    if (status === 401) return res.status(401).json({ error: 'GITHUB_TOKEN in .env is invalid or expired. Generate a new one at https://github.com/settings/tokens.' });
    console.error(err.message);
    res.status(500).json({ error: 'Failed to analyze GitHub user', detail: err.message });
  }
});

router.get('/compare/:userA/:userB', async (req, res) => {
  try {
    const [a, b] = await Promise.all([
      analyzeUser(req.params.userA),
      analyzeUser(req.params.userB)
    ]);
    res.json({ a, b });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to compare users' });
  }
});

module.exports = router;