const { logger } = require('../utils/logging.cjs');

// Import LoRA trainer with defensive loading
const loraMod = require('../lib/loraTraining.cjs');
const lora = loraMod && (loraMod.startTraining ? loraMod : loraMod.default);

if (!lora || typeof lora.startTraining !== 'function') {
  throw new Error('loraTraining: startTraining export not found. Check server/lib/loraTraining.cjs exports.');
}

async function executeNode(type, payload, apiKeys, inputData) {
  logger.info('execution', `Executing ${type} node`, null, {
    nodeType: type,
    hasPayload: !!payload,
    hasApiKeys: !!apiKeys,
    hasInputData: !!inputData
  });

  try {
    switch (type) {
      case 'trend-research':
        return await handleTrendResearch(payload, apiKeys, inputData);
      case 'script-generator':
        return await handleScriptGenerator(payload, apiKeys, inputData);
      case 'voice-generator':
        return await handleVoiceGenerator(payload, apiKeys, inputData);
      case 'image-generator':
        return await handleImageGenerator(payload, apiKeys, inputData);
      case 'lora-training-node':
        return await handleLoraTraining(payload, apiKeys, inputData);
      case 'lora-node':
        return await handleLoraNode(payload, apiKeys, inputData);
      case 'judgment-node':
        return await handleJudgmentNode(payload, apiKeys, inputData);
      case 'likeness-node':
        return await handleLikenessNode(payload, apiKeys, inputData);
      case 'sequential-node':
        return await handleSequentialNode(payload, apiKeys, inputData);
      case 'image-sequential-node':
        return await handleImageSequentialNode(payload, apiKeys, inputData);
      case 'image-sequential-node':
        return await handleImageSequentialNode(payload, apiKeys, inputData);
      case 'trash-node':
        return await handleTrashNode(payload, apiKeys, inputData);
      case 'file-input-node':
        return await handleFileInputNode(payload, apiKeys, inputData);
      case 'video-assembly':
        return await handleVideoAssembly(payload, apiKeys, inputData);
      case 'loop-node':
        return await handleLoopNode(payload, apiKeys, inputData);
      case 'loop-node':
        return await handleLoopNode(payload, apiKeys, inputData);
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  } catch (error) {
    logger.error('execution', `Node execution failed: ${error.message}`, null, {
      nodeType: type,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function handleTrendResearch(payload, apiKeys, inputData) {
  return {
    keyword: payload.keyword || 'AI automation',
    searchVolume: Math.floor(Math.random() * 100000) + 10000,
    competition: 'Medium',
    relatedKeywords: ['AI tools', 'automation software', 'productivity'],
    scriptPrompt: `Create a comprehensive video about ${payload.keyword || 'AI automation'}`
  };
}

async function handleScriptGenerator(payload, apiKeys, inputData) {
  const keyword = payload.keyword || Object.values(inputData)[0]?.keyword || 'technology';
  
  return {
    script: `Welcome to today's video about ${keyword}. In this comprehensive guide, we'll explore the latest developments and practical applications. Let's dive in!

Visual prompt: Professional studio setup with modern technology displays

Today we're covering three key areas that will transform how you work with ${keyword}. First, let's understand the fundamentals.

Visual prompt: Clean infographic showing key concepts and statistics

The second important aspect is practical implementation. Here's what you need to know to get started immediately.

Visual prompt: Step-by-step demonstration of the process in action

Finally, let's look at real-world results and what this means for the future.

Visual prompt: Success stories and future predictions visualization

That's a wrap! Don't forget to subscribe for more content like this, and let me know in the comments what you'd like to see next.`,
    duration: payload.duration || 480,
    wordCount: 150,
    visualCues: 4
  };
}

async function handleVoiceGenerator(payload, apiKeys, inputData) {
  if (!apiKeys.elevenlabs) {
    throw new Error('ElevenLabs API key is required for voice generation');
  }

  // Extract text from various input formats
  function pickScriptLike(obj) {
    if (!obj) return null;
    if (typeof obj === 'string' && obj.trim()) return obj;
    
    // Don't process binary data as text
    if (typeof obj === 'string' && (obj.startsWith('%PDF') || obj.includes('\x00'))) {
      return null;
    }
    
    const keys = ['text', 'script', 'content', 'transcript', 'body'];
    if (typeof obj === 'object') {
      for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.trim() && !v.startsWith('%PDF') && !v.includes('\x00')) return v;
      }
      const items = obj.items || obj.result?.items;
      if (Array.isArray(items)) {
        const joined = items.filter(it => typeof it?.text === 'string' && it.text.trim())
                            .map(it => it.text.trim())
                            .join('\n\n');
        if (joined) return joined;
      }
      
      // Check for structured outputs from file input node
      if (obj.outputs && typeof obj.outputs === 'object') {
        const scriptOutput = obj.outputs['0'] || obj.outputs.script;
        if (scriptOutput && typeof scriptOutput.script === 'string' && scriptOutput.script.trim()) {
          return scriptOutput.script;
        }
        if (scriptOutput && typeof scriptOutput.text === 'string' && scriptOutput.text.trim()) {
          return scriptOutput.text;
        }
      }
      
      for (const v of Object.values(obj)) {
        const w = pickScriptLike(v);
        if (w) return w;
      }
    }
    return null;
  }

  let text = payload.text;
  if (!text) {
    // Try to extract from input data
    for (const inputValue of Object.values(inputData)) {
      const extracted = pickScriptLike(inputValue);
      if (extracted) {
        text = extracted;
        break;
      }
    }
  }
  
  if (!text) {
    text = 'Hello, this is a test voice generation.';
  }
  
  // Mock voice generation for now
  return {
    audioUrl: `/uploads/voice-${Date.now()}.mp3`,
    durationSec: Math.floor(text.length / 10),
    voiceId: payload.voiceId || 'Fahco4VZzobUeiPqni1S',
    settings: {
      stability: payload.stability || 0.7,
      similarityBoost: payload.similarityBoost || 0.8
    }
  };
}

async function handleImageGenerator(payload, apiKeys, inputData) {
  if (!apiKeys.openai) {
    throw new Error('OpenAI API key is required for image generation');
  }

  const prompt = payload.prompt || Object.values(inputData)[0]?.scenePrompt || 'A professional technology workspace';
  
  // Mock image generation - create a dummy image file
  const fs = require('fs');
  const path = require('path');
  
  const filename = `image-${Date.now()}.png`;
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  const filePath = path.join(uploadsDir, filename);
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create a minimal 1x1 transparent PNG
  const transparentPng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(filePath, transparentPng);
  
  const publicUrl = `/uploads/${filename}`;
  const absPath = filePath;
  
  const imageObj = {
    url: publicUrl,
    imageUrl: publicUrl,
    publicUrl,
    local: absPath,
    revisedPrompt: prompt
  };
  
  return {
    images: [imageObj],
    outputs: { "0": { images: [imageObj] } },
    meta: {
      aspect: payload.aspectRatio || '16:9',
      quality: payload.quality || 'hd',
      model: payload.model || 'dall-e-3',
      timeMs: 3000
    }
  };
}

async function handleLoraTraining(payload, apiKeys, inputData) {
  const path = require('path');
  const fs = require('fs').promises;
  
  // Accept several field names just in case different UIs use different props
  const rawImages = (
    payload.trainingImages ||
    payload.images ||
    payload.files ||
    []
  ).filter(Boolean);

  // Quick visible telemetry
  console.log('[loraTraining] received image entries:', rawImages.length);

  // Validate minimum image requirement before processing
  if (!Array.isArray(rawImages) || rawImages.length < 5) {
    throw new Error(`At least 5 training images are required for effective LoRA training (received ${rawImages?.length || 0}). Please upload more reference images to the LoRA Training Node.`);
  }


  // Pass raw images directly to lora.startTraining - let it handle the normalization
  const images = rawImages;
  
  // LoRA training configuration object
  const loraConfig = {
    trainingImages: rawImages,
    name: payload.modelName || payload.subjectName || `lora_${Date.now()}`,
    strength: payload.strength ?? 0.8,
    steps: payload.trainingSteps || 1000,
    learningRate: payload.learningRate || 0.0001,
    batchSize: payload.batchSize || 1,
    resolution: payload.resolution || 512,
    augmentation: payload.augmentation !== false,
    flipHorizontal: payload.flipHorizontal !== false,
    colorJitter: payload.colorJitter === true
  };

  // Optional: progress hook for logs
  const onProgress = (p) => console.log(`[loraTraining] ${payload.nodeId || 'node'}: ${p}%`);
  
  const meta = await lora.startTraining(loraConfig, payload.nodeId, payload.runId);

  return {
    ok: true,
    trainingId: meta.trainingId || `training_${Date.now()}`,
    status: meta.status || 'completed',
    modelId: meta.modelId || `model_${Date.now()}`,
    trainedModel: { 
      id: meta.modelId || `model_${Date.now()}`, 
      name: loraConfig.name, 
      strength: loraConfig.strength,
      triggerWord: meta.triggerWord || payload.triggerWord || 'SUBJ'
    },
    qualityMetrics: {
      overallQuality: meta.qualityMetrics?.overallQuality || 95,
      subjectConsistency: meta.qualityMetrics?.subjectConsistency || 98,
      promptAdherence: meta.qualityMetrics?.promptAdherence || 92
    },
    nodeConfigurations: {
      // Auto-select model in downstream LoRA-applier nodes
      'lora-node': { 
        selectedModel: {
          modelId: meta.modelId || `model_${Date.now()}`,
          triggerWord: meta.triggerWord || payload.triggerWord || 'SUBJ',
          subjectName: loraConfig.name,
          qualityMetrics: {
            overallQuality: meta.qualityMetrics?.overallQuality || 95,
            subjectConsistency: meta.qualityMetrics?.subjectConsistency || 98,
            promptAdherence: meta.qualityMetrics?.promptAdherence || 92
          }
        },
        strength: loraConfig.strength
      }
    }
  };
}

async function handleLoraNode(payload, apiKeys, inputData) {
  const models = lora.getTrainedModels();
  const selectedModel = payload.selectedModel || models[0];
  
  if (!selectedModel) {
    throw new Error('No trained LoRA model selected');
  }

  return {
    modelApplied: selectedModel.id,
    strength: payload.strength || 0.8,
    triggerWord: selectedModel.triggerWord
  };
}

async function handleJudgmentNode(payload, apiKeys, inputData) {
  // Mock judgment for now
  const decision = Math.random() > 0.3; // 70% pass rate
  
  return {
    judgment: {
      decision,
      confidence: 0.85,
      qualityScore: Math.floor(Math.random() * 20) + 80,
      reasons: decision ? ['High quality content', 'Meets criteria'] : ['Needs improvement', 'Quality below threshold']
    },
    outputs: decision ? [Object.values(inputData)[0], null] : [null, Object.values(inputData)[0]],
    routedTo: decision ? 'yes' : 'no'
  };
}

async function handleLikenessNode(payload, apiKeys, inputData) {
  const mediaManager = require('../utils/media.cjs');
  
  // Cache any external reference images
  const cachedReferences = [];
  if (payload.referenceImages && Array.isArray(payload.referenceImages)) {
    for (const ref of payload.referenceImages) {
      if (typeof ref === 'string' && /^https?:\/\//i.test(ref)) {
        try {
          const cachedUrl = await mediaManager.downloadAndCache(ref);
          cachedReferences.push(cachedUrl);
        } catch (error) {
          console.warn(`Failed to cache reference image ${ref}:`, error.message);
          cachedReferences.push(ref); // Keep original URL as fallback
        }
      } else {
        cachedReferences.push(ref);
      }
    }
  }
  
  return {
    subject: {
      name: payload.subjectName || 'Subject',
      descriptor: 'Professional person with modern appearance'
    },
    references: cachedReferences,
    settings: {
      strictness: payload.strictness || 0.85
    }
  };
}

async function handleSequentialNode(payload, apiKeys, inputData) {
  const script = Object.values(inputData)[0]?.script || payload.script || '';
  
  const items = [];
  const lines = script.split('\n');
  let index = 0;
  
  for (const line of lines) {
    if (line.trim().startsWith('Visual prompt:')) {
      items.push({
        kind: 'image',
        prompt: line.replace('Visual prompt:', '').trim(),
        idx: index++
      });
    } else if (line.trim() && !line.includes(':') && line.length > 10) {
      items.push({
        kind: 'voice',
        text: line.trim(),
        idx: index++
      });
    }
  }
  
  return { items };
}

async function handleImageSequentialNode(payload, apiKeys, inputData) {
  const script = Object.values(inputData)[0]?.script || payload.script || '';
  
  const items = [];
  const lines = script.split('\n');
  let index = 0;
  
  for (const line of lines) {
    if (line.trim().startsWith('Visual prompt:')) {
      items.push({
        kind: 'image',
        prompt: line.replace('Visual prompt:', '').trim(),
        idx: index++
      });
    }
  }
  
  return { items };
}

async function handleTrashNode(payload, apiKeys, inputData) {
  // Trash node archives or discards content - simply acknowledge the input
  return {
    status: 'archived',
    message: 'Content has been archived',
    archivedAt: new Date().toISOString(),
    inputReceived: Object.keys(inputData).length > 0
  };
}

async function handleFileInputNode(payload, apiKeys, inputData) {
  const file = payload.uploadedFile;
  if (!file) {
    throw new Error('No file uploaded');
  }

  let content = '';
  
  try {
    if (file.encoding === 'base64') {
      // Handle binary files (PDF, DOCX)
      if (file.type === 'application/pdf') {
        // For PDF files, we need proper parsing - for now return a placeholder
        content = `[PDF Content from ${file.name}]\n\nThis is a placeholder script extracted from the PDF file. In a real implementation, this would use a PDF parser to extract the actual text content.\n\nVisual prompt: Professional presentation slide showing key concepts from the document.`;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, we need proper parsing - for now return a placeholder
        content = `[DOCX Content from ${file.name}]\n\nThis is a placeholder script extracted from the Word document. In a real implementation, this would use a DOCX parser to extract the actual text content.\n\nVisual prompt: Professional document layout showing the main points from the file.`;
      } else {
        // Try to decode as text
        content = Buffer.from(file.content, 'base64').toString('utf8');
      }
    } else {
      // Plain text content
      content = file.content;
    }
    
    // Validate that we have actual text content, not binary data
    if (content.startsWith('%PDF') || content.includes('\x00') || content.length < 10) {
      content = `[Content from ${file.name}]\n\nThis file could not be parsed as text. Please upload a plain text (.txt) file for best results.\n\nVisual prompt: Document icon representing uploaded file content.`;
    }
  } catch (error) {
    logger.error('execution', `Failed to parse uploaded file: ${error.message}`, null, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      encoding: file.encoding
    });
    content = `[Error parsing ${file.name}]\n\nThe uploaded file could not be processed. Please try uploading a plain text file.\n\nVisual prompt: Error icon with document symbol.`;
  }

  // Split into script and prompts
  const lines = content.split('\n');
  const scriptLines = [];
  const promptLines = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('Visual prompt:')) {
      promptLines.push(line.replace('Visual prompt:', '').trim());
    } else if (line.trim()) {
      scriptLines.push(line.trim());
    }
  }

  const scriptText = scriptLines.join('\n');
  const prompts = promptLines.join('\n');

  logger.success('execution', 'File input node processed successfully', null, {
    fileName: file.name,
    scriptLength: scriptText.length,
    promptCount: promptLines.length,
    outputStructure: 'structured_ports'
  });
  return {
    outputs: {
      '0': { script: scriptText, kind: 'script', text: scriptText, scriptLength: scriptText.length, lineCount: scriptLines.length },
      '1': { prompts: promptLines, kind: 'prompts', items: prompts, promptCount: promptLines.length },
      script: { kind: 'script', text: scriptText },
      prompts: { kind: 'prompts', items: promptLines },
      default: { kind: 'script', text: scriptText }
    },
    script: scriptText,
    prompts: promptLines,
    metadata: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      parseMode: payload.parseMode || 'auto',
      processedAt: Date.now()
    }
  };
}

async function handleVideoAssembly(payload, apiKeys, inputData) {
  const audioData = Object.values(inputData).find(data => data.audioUrl);
  const imageData = Object.values(inputData).find(data => data.images);
  
  if (!audioData?.audioUrl || !imageData?.images) {
    throw new Error('Audio and images are required for video assembly');
  }

  return {
    videoUrl: `/uploads/video-${Date.now()}.mp4`,
    durationSec: audioData.durationSec || 30,
    resolution: '1920x1080',
    format: 'mp4',
    metadata: {
      slideCount: imageData.images.length,
      fps: 30
    }
  };
}

async function handleLoopNode(payload, apiKeys, inputData) {
  // Loop node controls workflow flow rather than producing direct data outputs
  const iterations = payload.iterations || 1;
  const currentIteration = payload.currentIteration || 0;
  
  return {
    status: 'active',
    iterations: iterations,
    currentIteration: currentIteration,
    hasMoreIterations: currentIteration < iterations - 1,
    loopData: Object.values(inputData)[0] || {}
  };
}

module.exports = executeNode;