// VidForge - Helpers for detecting/rendering media outputs
export interface MediaInfo {
  type: 'image' | 'audio' | 'video' | 'text' | 'json';
  urls: string[];
  metadata?: Record<string, any>;
}

export function detectMediaType(data: any): MediaInfo {
  // Check for images
  if (data?.images && Array.isArray(data.images) && data.images.length > 0) {
    return {
      type: 'image',
      urls: data.images.map((img: any) => img.url || img.local || img).filter(Boolean),
      metadata: data.meta || data.metadata
    };
  }

  // Check for single image object or direct image properties
  if (data?.imageUrl || data?.imageFile || data?.url || data?.local) {
    return {
      type: 'image',
      urls: [data.imageUrl || data.url || data.local || (data.imageFile ? `/uploads/${data.imageFile}` : '')].filter(Boolean),
      metadata: data.metadata
    };
  }
  
  // Check outputs structure for images
  if (data?.outputs) {
    const outputs = data.outputs["0"] || data.outputs[0] || data.outputs.default;
    if (outputs?.images && Array.isArray(outputs.images) && outputs.images.length > 0) {
      return {
        type: 'image',
        urls: outputs.images.map((img: any) => img.url || img.imageUrl || img.local || img).filter(Boolean),
        metadata: outputs.meta || outputs.metadata
      };
    }
  }
  
  // Check lastResult for images
  if (data?.lastResult?.images && Array.isArray(data.lastResult.images) && data.lastResult.images.length > 0) {
    return {
      type: 'image',
      urls: data.lastResult.images.map((img: any) => img.url || img.imageUrl || img.local || img).filter(Boolean),
      metadata: data.lastResult.meta || data.lastResult.metadata
    };
  }

  // Check for audio
  if (data?.audioUrl || data?.audioFile) {
    return {
      type: 'audio',
      urls: [data.audioUrl || `/uploads/${data.audioFile}`].filter(Boolean),
      metadata: {
        duration: data.durationSec,
        voiceId: data.voiceId,
        settings: data.settings,
        ...data.metadata
      }
    };
  }

  // Check for video
  if (data?.videoUrl || data?.videoFile) {
    return {
      type: 'video',
      urls: [data.videoUrl || `/uploads/${data.videoFile}`].filter(Boolean),
      metadata: data.metadata
    };
  }

  // Check if it's structured JSON
  if (typeof data === 'object' && data !== null) {
    return {
      type: 'json',
      urls: [],
      metadata: data
    };
  }

  // Default to text
  return {
    type: 'text',
    urls: [],
    metadata: { content: String(data) }
  };
}

export function isImagePayload(data: any): boolean {
  return detectMediaType(data).type === 'image';
}

export function isAudioPayload(data: any): boolean {
  return detectMediaType(data).type === 'audio';
}

export function isVideoPayload(data: any): boolean {
  return detectMediaType(data).type === 'video';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}