// VidForge - Character Profiles CRUD API
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { logger } = require('../utils/logging.cjs');
const { assetManager } = require('../lib/assets.cjs');
const router = express.Router();

const charactersDir = path.join(__dirname, '..', 'characters');
const charactersFile = path.join(charactersDir, 'profiles.json');

// Ensure characters directory exists
if (!fs.existsSync(charactersDir)) {
  fs.mkdirSync(charactersDir, { recursive: true });
}

// Initialize profiles file if it doesn't exist
if (!fs.existsSync(charactersFile)) {
  fs.writeFileSync(charactersFile, JSON.stringify({ profiles: [] }, null, 2));
}

// Configure multer for character image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const characterId = req.params.id || 'temp';
    const characterDir = path.join(charactersDir, characterId);
    if (!fs.existsSync(characterDir)) {
      fs.mkdirSync(characterDir, { recursive: true });
    }
    cb(null, characterDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `reference-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for character references'));
    }
  }
});

// Get all character profiles
router.get('/profiles', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
    
    logger.debug('config', 'Retrieved character profiles', null, {
      profileCount: data.profiles.length
    });
    
    res.json({ ok: true, profiles: data.profiles });
  } catch (error) {
    logger.error('config', `Failed to get character profiles: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get specific character profile
router.get('/profiles/:id', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
    const profile = data.profiles.find(p => p.id === req.params.id);
    
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Character profile not found' });
    }
    
    logger.debug('config', 'Retrieved character profile', null, {
      profileId: req.params.id,
      profileName: profile.displayName
    });
    
    res.json({ ok: true, profile });
  } catch (error) {
    logger.error('config', `Failed to get character profile: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Create new character profile
router.post('/profiles', (req, res) => {
  try {
    const {
      displayName,
      voiceProvider = 'elevenlabs',
      voiceId,
      ttsDefaults = {},
      visualDescriptor = '',
      negativePrompts = [],
      styleNotes = ''
    } = req.body;

    if (!displayName) {
      return res.status(400).json({ ok: false, error: 'Display name is required' });
    }

    const profile = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      displayName,
      voiceProvider,
      voiceId,
      ttsDefaults: {
        stability: 0.5,
        style: 0.3,
        similarityBoost: 0.8,
        useSpeakerBoost: true,
        ...ttsDefaults
      },
      subjectSeed: Math.floor(Math.random() * 1000000),
      visualDescriptor,
      referenceImages: [],
      negativePrompts,
      styleNotes,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const data = JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
    data.profiles.push(profile);
    fs.writeFileSync(charactersFile, JSON.stringify(data, null, 2));

    logger.success('config', 'Character profile created', null, {
      profileId: profile.id,
      displayName: profile.displayName,
      voiceId: profile.voiceId
    });

    res.json({ ok: true, profile });
  } catch (error) {
    logger.error('config', `Failed to create character profile: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Update character profile
router.put('/profiles/:id', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
    const profileIndex = data.profiles.findIndex(p => p.id === req.params.id);
    
    if (profileIndex === -1) {
      return res.status(404).json({ ok: false, error: 'Character profile not found' });
    }

    const updatedProfile = {
      ...data.profiles[profileIndex],
      ...req.body,
      id: req.params.id, // Preserve ID
      updatedAt: Date.now()
    };

    data.profiles[profileIndex] = updatedProfile;
    fs.writeFileSync(charactersFile, JSON.stringify(data, null, 2));

    logger.success('config', 'Character profile updated', null, {
      profileId: req.params.id,
      displayName: updatedProfile.displayName,
      updatedFields: Object.keys(req.body)
    });

    res.json({ ok: true, profile: updatedProfile });
  } catch (error) {
    logger.error('config', `Failed to update character profile: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Upload reference images for character
router.post('/profiles/:id/images', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ ok: false, error: 'No images uploaded' });
    }

    const data = JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
    const profileIndex = data.profiles.findIndex(p => p.id === req.params.id);
    
    if (profileIndex === -1) {
      return res.status(404).json({ ok: false, error: 'Character profile not found' });
    }

    const uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/characters/${req.params.id}/${file.filename}`,
      uploadedAt: Date.now()
    }));

    data.profiles[profileIndex].referenceImages = [
      ...(data.profiles[profileIndex].referenceImages || []),
      ...uploadedImages
    ];
    data.profiles[profileIndex].updatedAt = Date.now();

    fs.writeFileSync(charactersFile, JSON.stringify(data, null, 2));

    logger.success('config', 'Character reference images uploaded', null, {
      profileId: req.params.id,
      imageCount: uploadedImages.length,
      totalImages: data.profiles[profileIndex].referenceImages.length
    });

    res.json({ 
      ok: true, 
      images: uploadedImages,
      profile: data.profiles[profileIndex]
    });
  } catch (error) {
    logger.error('config', `Failed to upload character images: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Delete character profile
router.delete('/profiles/:id', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
    const profileIndex = data.profiles.findIndex(p => p.id === req.params.id);
    
    if (profileIndex === -1) {
      return res.status(404).json({ ok: false, error: 'Character profile not found' });
    }

    const profile = data.profiles[profileIndex];
    data.profiles.splice(profileIndex, 1);
    fs.writeFileSync(charactersFile, JSON.stringify(data, null, 2));

    // Clean up character directory
    const characterDir = path.join(charactersDir, req.params.id);
    if (fs.existsSync(characterDir)) {
      fs.rmSync(characterDir, { recursive: true, force: true });
    }

    logger.success('config', 'Character profile deleted', null, {
      profileId: req.params.id,
      displayName: profile.displayName
    });

    res.json({ ok: true, message: 'Character profile deleted successfully' });
  } catch (error) {
    logger.error('config', `Failed to delete character profile: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Serve character images
router.use('/:id', express.static(path.join(charactersDir), {
  setHeaders: (res, filePath) => {
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
  }
}));

module.exports = router;