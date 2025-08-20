const express = require('express');
const router = express.Router();
const loraMod = require('../../lib/loraTraining.cjs');
const lora = loraMod && (loraMod.startTraining ? loraMod : loraMod.default);

router.get('/', async (req, res) => {
  try {
    const models = lora.getTrainedModels();
    res.json({ ok: true, models });
  } catch (error) {
    console.error('[/api/trained-models] ERROR:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;