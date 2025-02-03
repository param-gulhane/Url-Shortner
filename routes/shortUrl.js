const express = require('express');
const router = express.Router();

const shortURLController = require('../controller/shortUrl');

router.get('/shorten/:alias',shortURLController.getShortURL); // http://localhost:3030/api/shorten/gfg

router.post('/shorten',shortURLController.postShortUrl); // http://localhost:3030/api/shorten

router.get('/analytics/:alias',shortURLController.getURLAnalytics); // http://localhost:3030/api/analytics/gfg

router.get('/analytics/topic/:topic',shortURLController.getURLAnalytics_topic); // http://localhost:3030/api/analytics/topic/dataEngineering

router.get('/analytics/overall',shortURLController.getURLAnalytics_overall); // http://localhost:3030/api/analytics/overall

module.exports = router;
