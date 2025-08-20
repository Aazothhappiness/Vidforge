const express = require('express');
const executeNode = require('../handlers/nodeHandlers.cjs');
const router = express.Router();

// Execute node endpoint
router.post('/execute-node', async (req, res) => {
  try {
    const { type, payload, apiKeys, inputData, nodeId, runId } = req.body;
    
    if (!type) {
      return res.status(400).json({
        ok: false,
        error: 'Node type is required'
      });
    }

    console.log(`[/api/execute-node] Executing ${type} node with payload:`, payload);
    
    const result = await executeNode(type, payload, apiKeys, inputData, nodeId, runId);
    
    return res.json({
      ok: true,
      result: result
    });
    
  } catch (error) {
    console.error('[/api/execute-node] ERROR:', {
      ok: false,
      status: 500,
      error: error.message,
      details: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        statusCode: error.statusCode,
        response: error.response?.data,
        originalError: error.details
      },
      stack: error.stack
    });
    
    // Check if headers have already been sent to prevent double response
    if (res.headersSent) {
      return;
    }
    
    return res.status(500).json({
      ok: false,
      error: error.message,
      details: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        statusCode: error.statusCode,
        response: error.response?.data,
        originalError: error.details
      }
    });
  }
});

// Video assembly endpoint
router.post('/assemble-video', async (req, res) => {
  try {
    const { audioUrl, images, title, description, script, ...config } = req.body;
    
    if (!audioUrl || !images || images.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Audio URL and images are required for video assembly'
      });
    }

    console.log(`[/api/assemble-video] Assembling video with ${images.length} images`);
    
    const { videoAssembler } = require('../utils/videoAssembly.cjs');
    const videoUrl = await videoAssembler.assembleVideo({
      audioUrl,
      images,
      title,
      description,
      script,
      ...config
    });
    
    return res.json({
      ok: true,
      videoUrl
    });
    
  } catch (error) {
    console.error('[/api/assemble-video] ERROR:', error);
    
    if (res.headersSent) {
      return;
    }
    
    return res.status(500).json({
      ok: false,
      error: error.message,
      details: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});

// ElevenLabs voices endpoint
router.get('/elevenlabs/voices', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(400).json({
        ok: false,
        error: 'ElevenLabs API key is required'
      });
    }

    console.log('[/api/elevenlabs/voices] Fetching voices from ElevenLabs API');
    
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[/api/elevenlabs/voices] ElevenLabs API error:', errorData);
      return res.status(response.status).json({
        ok: false,
        error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
        details: errorData
      });
    }

    const voicesData = await response.json();
    console.log(`[/api/elevenlabs/voices] Successfully fetched ${voicesData.voices?.length || 0} voices`);
    
    return res.json({
      ok: true,
      voices: voicesData.voices || []
    });
    
  } catch (error) {
    console.error('[/api/elevenlabs/voices] ERROR:', error);
    
    if (res.headersSent) {
      return;
    }
    
    return res.status(500).json({
      ok: false,
      error: error.message,
      details: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  }
});

module.exports = router;