const { logger } = require('../utils/logging.cjs');

function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text
    .replace(/[""'']/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function composeImagePrompt({ scene, subject, negatives = [], seeds = {}, nodeId }) {
  logger.debug('judge', 'Composing image prompt', nodeId, {
    hasSubject: !!subject,
    hasScene: !!scene,
    negativeCount: negatives.length
  });

  const sanitizedScene = scene ? sanitizeText(scene) : scene;
  const sanitizedSubject = subject && subject.descriptor ? {
    ...subject,
    descriptor: sanitizeText(subject.descriptor)
  } : subject;

  let subjectSection = '';
  if (sanitizedSubject && sanitizedSubject.descriptor) {
    subjectSection = `SUBJECT: ${sanitizedSubject.descriptor}`;
  }

  const sceneSection = sanitizedScene ? `SCENE: ${sanitizedScene}` : '';
  
  const styleSection = `STYLE: photorealistic, high quality, professional`;
  
  const negativeSection = `NEGATIVE: ${negatives.join(', ')}`;

  const composedPrompt = [
    subjectSection,
    sceneSection,
    styleSection,
    negativeSection
  ].filter(Boolean).join('\n\n');

  return {
    fullPrompt: composedPrompt,
    subjectSection,
    sceneSection,
    styleSection,
    negativeSection,
    metadata: {
      hasSubject: !!sanitizedSubject,
      sceneLength: sanitizedScene?.length || 0,
      negativeCount: negatives.length
    }
  };
}

function buildScenePromptWithLikeness(scene, likeness) {
  if (!likeness || !likeness.subject) {
    return scene;
  }

  return `${likeness.subject.descriptor}. ${scene}`;
}

module.exports = {
  composeImagePrompt,
  buildScenePromptWithLikeness
};