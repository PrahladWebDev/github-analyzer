const express = require('express');
const router = express.Router();
const { analyzeUser } = require('../services/personalityEngine');
const gemini = require('../services/geminiService');

function handleAiError(err, res, fallbackMsg) {
  const status = err.response?.status;
  if (status === 503) {
    return res.status(503).json({ error: "Gemini is temporarily overloaded on Google's end. Please try again in a few seconds." });
  }
  if (status === 429) {
    return res.status(429).json({ error: 'Gemini free-tier quota hit. Please wait a bit before trying again.' });
  }
  if (status === 400 || status === 404) {
    return res.status(500).json({ error: `Gemini rejected the request — check GEMINI_MODEL in .env is a valid, current model name. (${err.message})` });
  }
  console.error(err.message);
  res.status(500).json({ error: err.message || fallbackMsg });
}

router.get('/summary/:username', async (req, res) => {
  try {
    const analysis = await analyzeUser(req.params.username);
    const summary = await gemini.generateSummary(analysis);
    res.json({ summary });
  } catch (err) {
    handleAiError(err, res, 'Failed to generate AI summary');
  }
});

router.get('/roast/:username', async (req, res) => {
  try {
    const analysis = await analyzeUser(req.params.username);
    const roast = await gemini.generateRoast(analysis);
    res.json({ roast });
  } catch (err) {
    handleAiError(err, res, 'Failed to generate roast');
  }
});

router.get('/compare-verdict/:userA/:userB', async (req, res) => {
  try {
    const [a, b] = await Promise.all([
      analyzeUser(req.params.userA),
      analyzeUser(req.params.userB)
    ]);
    const verdict = await gemini.generateCompareVerdict(a, b);
    res.json({ verdict });
  } catch (err) {
    handleAiError(err, res, 'Failed to generate comparison verdict');
  }
});

module.exports = router;