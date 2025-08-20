import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff, Plus, X, Upload, Download, Trash2, Minus } from 'lucide-react';
import { Node } from '../types/NodeTypes';
import VoiceManager from './VoiceManager';
import TrainedModelSelector from './TrainedModelSelector';
import { logger } from '../utils/logging';

interface NodePropertiesProps {
  node: Node;
  onUpdate: (patch: Record<string, any>) => void;
  apiKeys?: {
    elevenlabs?: string;
    openai?: string;
    youtube?: string;
    hedra?: string;
  };
}

// Build a nested patch from "a.b.c" -> { a: { b: { c: value } } }
function pathPatch(path: string, value: any) {
  const keys = path.split('.');
  return keys.reduceRight((acc, k) => ({ [k]: acc }), value);
}

// Robust getter for nested values
function getIn(obj: any, path: string, fallback: any = '') {
  try {
    return path.split('.').reduce((o, k) => (o && k in o ? o[k] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function NodeProperties({ node, onUpdate, apiKeys }: NodePropertiesProps) {
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  
  // Local form state for immediate UI updates
  const [form, setForm] = useState(() => ({ ...(node?.data ?? {}) }));

  // Reset local form when switching nodes
  useEffect(() => {
    setForm({ ...(node?.data ?? {}) });
  }, [node?.id]);

  // Sync with external changes (auto-configuration)
  useEffect(() => {
    setForm(prev => ({ ...prev, ...(node?.data ?? {}) }));
  }, [node?.data]);

  // Load persisted images for likeness node
  useEffect(() => {
    if (node.type === 'likeness-node') {
      try {
        const persistedKey = `vf_likeness_${node.id}`;
        const persistedImages = localStorage.getItem(persistedKey);
        
        if (persistedImages) {
          const images = JSON.parse(persistedImages);
          if (images && Array.isArray(images) && images.length > 0) {
            const existingImages = node.data.referenceImages || [];
            const mergedImages = [...existingImages];
            
            for (const persistedImg of images) {
              const exists = mergedImages.some(existing => 
                existing.id === persistedImg.id || existing.name === persistedImg.name
              );
              if (!exists) {
                mergedImages.push(persistedImg);
              }
            }
            
            if (mergedImages.length > existingImages.length) {
              logger.info('config', `Loaded ${mergedImages.length - existingImages.length} persisted reference images`, node.id);
              onUpdate({ referenceImages: mergedImages });
            }
          }
        }
      } catch (error) {
        logger.warn('config', `Failed to load persisted images: ${error.message}`, node.id);
      }
    }
  }, [node.id, node.type]);

  const updateField = (path: string, value: any) => {
    if (lockedFields.has(path)) return;
    
    // 1) Update local form for immediate UI response
    setForm(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = cur[keys[i]] ?? {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });

    // 2) Send minimal patch to parent
    onUpdate(pathPatch(path, value));
    
    logger.debug('config', `Updated field ${path}`, node.id, { field: path, value: typeof value === 'object' ? Object.keys(value) : value });
  };

  const toggleLock = (field: string) => {
    setLockedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const toggleVisibility = (field: string) => {
    setHiddenFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const addArrayItem = (field: string) => {
    const currentArray = getIn(form, field, []);
    updateField(field, [...currentArray, '']);
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    if (lockedFields.has(field)) return;
    const currentArray = getIn(form, field, []);
    const newArray = [...currentArray];
    newArray[index] = value;
    updateField(field, newArray);
  };

  const removeArrayItem = (field: string, index: number) => {
    if (lockedFields.has(field)) return;
    const currentArray = getIn(form, field, []);
    const newArray = currentArray.filter((_, i) => i !== index);
    updateField(field, newArray);
  };

  const handleFileUpload = (field: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    logger.info('config', `Uploading ${files.length} files for ${field}`, node.id);
    
    // Upload files using the new upload endpoint
    Promise.all(Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.ok) {
          throw new Error(`Upload failed: ${result.error || 'Unknown error'}`);
        }
        
        // Use absolute URL to avoid path issues
        const absoluteUrl = result.url.startsWith('http') ? result.url : `${window.location.origin}${result.url}`;
        
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          url: absoluteUrl,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          persisted: true
        };
      } catch (error) {
        logger.error('config', `Failed to upload file ${file.name}: ${error.message}`, node.id);
        throw error;
      }
    })).then(fileArray => {
      if (node.type === 'likeness-node' && field === 'referenceImages') {
        const existingImages = getIn(form, field, []);
        const mergedImages = [...existingImages, ...fileArray];
        
        try {
          const persistedKey = `vf_likeness_${node.id}`;
          localStorage.setItem(persistedKey, JSON.stringify(mergedImages));
          logger.success('config', `Persisted ${mergedImages.length} reference images`, node.id);
        } catch (error) {
          logger.warn('config', `Failed to persist images: ${error.message}`, node.id);
        }
        
        updateField(field, mergedImages);
      } else {
        updateField(field, fileArray);
      }
    }).catch(error => {
      logger.error('config', `File upload failed: ${error.message}`, node.id);
    });
  };

  const clearPersistedImages = () => {
    if (node.type === 'likeness-node') {
      try {
        const persistedKey = `vf_likeness_${node.id}`;
        localStorage.removeItem(persistedKey);
        updateField('referenceImages', []);
        logger.info('config', 'Cleared all persisted reference images', node.id);
      } catch (error) {
        logger.warn('config', `Failed to clear persisted images: ${error.message}`, node.id);
      }
    }
  };

  const renderField = (field: string, label: string, type: 'text' | 'number' | 'select' | 'textarea' | 'boolean' | 'array' | 'file' | 'range', options?: string[] | { min: number; max: number; step: number }) => {
    if (hiddenFields.has(field)) return null;

    const isLocked = lockedFields.has(field);
    const value = getIn(form, field, type === 'boolean' ? false : type === 'number' ? 0 : type === 'array' ? [] : '');

    return (
      <div key={field} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleLock(field)}
              className={`p-1 rounded ${isLocked ? 'text-amber-400' : 'text-gray-400'} hover:text-white`}
              title={isLocked ? 'Unlock field' : 'Lock field'}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
            <button
              onClick={() => toggleVisibility(field)}
              className="p-1 text-gray-400 hover:text-white"
              title="Hide field"
            >
              <EyeOff className="w-3 h-3" />
            </button>
          </div>
        </div>

        {type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            disabled={isLocked}
            className={`w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white ${
              isLocked ? 'opacity-50 cursor-not-allowed' : 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
        )}

        {type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => updateField(field, parseFloat(e.target.value) || 0)}
            disabled={isLocked}
            className={`w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white ${
              isLocked ? 'opacity-50 cursor-not-allowed' : 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
        )}

        {type === 'range' && options && typeof options === 'object' && 'min' in options && (
          <div className="space-y-1">
            <input
              type="range"
              min={options.min}
              max={options.max}
              step={options.step}
              value={value}
              onChange={(e) => updateField(field, parseFloat(e.target.value))}
              disabled={isLocked}
              className={`w-full accent-amber-500 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div className="text-xs text-gray-400 text-center">{value}</div>
          </div>
        )}

        {type === 'select' && Array.isArray(options) && (
          <select
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            disabled={isLocked}
            className={`w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white ${
              isLocked ? 'opacity-50 cursor-not-allowed' : 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          >
            <option value="">Select...</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}

        {type === 'textarea' && (
          <textarea
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            disabled={isLocked}
            rows={3}
            className={`w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm resize-none text-white ${
              isLocked ? 'opacity-50 cursor-not-allowed' : 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
          />
        )}

        {type === 'boolean' && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => updateField(field, e.target.checked)}
              disabled={isLocked}
              className={`rounded accent-amber-500 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <span className="text-sm text-gray-300">Enable</span>
          </label>
        )}

        {type === 'array' && (
          <div className="space-y-2">
            {(value || []).map((item: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayItem(field, index, e.target.value)}
                  disabled={isLocked}
                  className={`flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                {!isLocked && (
                  <button
                    onClick={() => removeArrayItem(field, index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {!isLocked && (
              <button
                onClick={() => addArrayItem(field)}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm hover:bg-slate-600 transition-colors text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Add {label}</span>
              </button>
            )}
          </div>
        )}

        {type === 'file' && (
          <div className="space-y-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(field, e.target.files)}
              disabled={isLocked}
              className={`w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white ${
                isLocked ? 'opacity-50 cursor-not-allowed' : 'focus:border-amber-500'
              }`}
            />
            
            {node.type === 'likeness-node' && field === 'referenceImages' && value && Array.isArray(value) && value.length > 0 && (
              <button
                onClick={clearPersistedImages}
                className="w-full px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Clear All Reference Images
              </button>
            )}
            
            {value && Array.isArray(value) && value.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {value.map((file: any, index: number) => (
                  <div key={index} className="relative">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded border border-white/10"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-1 rounded-b">
                      {file.name}
                      {file.persisted && (
                        <span className="ml-1 text-green-400">●</span>
                      )}
                    </div>
                    {!isLocked && (
                      <button
                        onClick={() => {
                          const newFiles = value.filter((_: any, i: number) => i !== index);
                          
                          if (node.type === 'likeness-node' && field === 'referenceImages') {
                            try {
                              const persistedKey = `vf_likeness_${node.id}`;
                              localStorage.setItem(persistedKey, JSON.stringify(newFiles));
                            } catch (error) {
                              logger.warn('config', `Failed to update persisted images: ${error.message}`, node.id);
                            }
                          }
                          
                          updateField(field, newFiles);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {node.type === 'likeness-node' && field === 'referenceImages' && (
              <div className="text-xs text-gray-400">
                <span className="text-green-400">●</span> Persisted images will be kept across sessions
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNodeSpecificProperties = () => {
    const portConfigSection = (
      <div className="space-y-4 border-b border-white/10 pb-4 mb-4">
        <h4 className="font-medium text-amber-400">Port Configuration</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Input Ports</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const currentPorts = getIn(form, 'inputPorts', 1);
                  if (currentPorts > 1) {
                    updateField('inputPorts', currentPorts - 1);
                  }
                }}
                className="p-1 bg-red-500/20 border border-red-500/30 rounded text-red-400 hover:bg-red-500/30"
                disabled={getIn(form, 'inputPorts', 1) <= 1}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-center min-w-[3rem] text-white">
                {getIn(form, 'inputPorts', 1)}
              </span>
              <button
                onClick={() => {
                  const currentPorts = getIn(form, 'inputPorts', 1);
                  if (currentPorts < 10) {
                    updateField('inputPorts', currentPorts + 1);
                  }
                }}
                className="p-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 hover:bg-green-500/30"
                disabled={getIn(form, 'inputPorts', 1) >= 10}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Output Ports</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const currentPorts = getIn(form, 'outputPorts', 1);
                  if (currentPorts > 1) {
                    updateField('outputPorts', currentPorts - 1);
                  }
                }}
                className="p-1 bg-red-500/20 border border-red-500/30 rounded text-red-400 hover:bg-red-500/30"
                disabled={
                  getIn(form, 'outputPorts', 1) <= 1 || 
                  ['yes-no-node', 'judgment-node'].includes(node.type)
                }
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-center min-w-[3rem] text-white">
                {['yes-no-node', 'judgment-node'].includes(node.type) ? 2 : getIn(form, 'outputPorts', 1)}
              </span>
              <button
                onClick={() => {
                  const currentPorts = getIn(form, 'outputPorts', 1);
                  if (currentPorts < 10) {
                    updateField('outputPorts', currentPorts + 1);
                  }
                }}
                className="p-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 hover:bg-green-500/30"
                disabled={
                  getIn(form, 'outputPorts', 1) >= 10 || 
                  ['yes-no-node', 'judgment-node'].includes(node.type)
                }
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {['yes-no-node', 'judgment-node'].includes(node.type) && (
              <p className="text-xs text-gray-400 mt-1">Fixed at 2 outputs (YES/NO)</p>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          <p>• Input ports: Where data flows into this node</p>
          <p>• Output ports: Where data flows out of this node</p>
          <p>• Preview nodes only have input ports</p>
        </div>
      </div>
    );

    switch (node.type) {
      case 'trend-research':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('keyword', 'Keyword', 'text')}
            {renderField('niche', 'Content Niche', 'select', ['technology', 'business', 'lifestyle', 'education', 'entertainment', 'health', 'finance', 'gaming', 'travel', 'food', 'fashion', 'sports', 'music', 'art', 'science'])}
            {renderField('style', 'Content Style', 'select', ['educational', 'entertainment', 'conversational', 'professional', 'casual'])}
            {renderField('contentType', 'Content Type', 'select', ['longform', 'shorts'])}
            {renderField('targetLength', 'Target Video Length (minutes)', 'range', { min: 1, max: 60, step: 1 })}
            {renderField('region', 'Region', 'select', ['global', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp'])}
            {renderField('language', 'Language', 'select', ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'])}
            {renderField('timeframe', 'Trend Timeframe', 'select', ['last_week', 'last_month', 'last_3_months', 'last_year', 'all_time'])}
            {renderField('competitorAnalysis', 'Competitor Analysis', 'boolean')}
            {renderField('trendPrediction', 'Trend Prediction', 'boolean')}
            {renderField('audienceInsights', 'Audience Insights', 'boolean')}
            {renderField('viralPotential', 'Viral Potential Analysis', 'boolean')}
            {renderField('monetizationInsights', 'Monetization Insights', 'boolean')}
            {renderField('thumbnailAnalysis', 'Thumbnail Analysis', 'boolean')}
            {renderField('titleAnalysis', 'Title Pattern Analysis', 'boolean')}
            {renderField('engagementMetrics', 'Engagement Metrics', 'boolean')}
            {renderField('competitorChannels', 'Competitor Channels', 'array')}
            {renderField('tags', 'Tags', 'array')}
            {renderField('keywords', 'Keywords', 'array')}
            {renderField('targetAudience', 'Target Audience', 'select', ['general', 'teens', 'young_adults', 'adults', 'seniors', 'professionals', 'students', 'parents'])}
            {renderField('contentGoal', 'Content Goal', 'select', ['education', 'entertainment', 'inspiration', 'sales', 'awareness', 'engagement'])}
          </div>
        );

      case 'script-generator':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('title', 'Video Title', 'text')}
            {renderField('duration', 'Duration (seconds)', 'number')}
            {renderField('style', 'Writing Style', 'select', ['conversational', 'professional', 'casual', 'educational', 'entertaining'])}
            {renderField('tone', 'Tone', 'select', ['enthusiastic', 'calm', 'authoritative', 'friendly', 'serious', 'humorous'])}
            {renderField('energy', 'Energy Level', 'range', { min: 1, max: 10, step: 1 })}
            {renderField('complexity', 'Content Complexity', 'select', ['simple', 'moderate', 'complex', 'expert'])}
            {renderField('targetAudience', 'Target Audience', 'select', ['general', 'expert', 'beginner', 'intermediate', 'advanced'])}
            {renderField('scriptStructure', 'Script Structure', 'select', ['standard', 'problem_solution', 'story_driven', 'list_format', 'comparison', 'tutorial'])}
            {renderField('openingStyle', 'Opening Style', 'select', ['hook', 'question', 'statistic', 'story', 'direct', 'controversial'])}
            {renderField('closingStyle', 'Closing Style', 'select', ['summary', 'call_to_action', 'question', 'cliffhanger', 'inspiration'])}
            {renderField('includeHooks', 'Include Hooks', 'boolean')}
            {renderField('includeCTA', 'Include Call-to-Action', 'boolean')}
            {renderField('includeIntro', 'Include Introduction', 'boolean')}
            {renderField('includeOutro', 'Include Outro', 'boolean')}
            {renderField('visualCues', 'Visual Cues', 'boolean')}
            {renderField('storytelling', 'Storytelling Elements', 'boolean')}
            {renderField('humor', 'Include Humor', 'boolean')}
            {renderField('personalAnecdotes', 'Personal Anecdotes', 'boolean')}
            {renderField('dataPoints', 'Include Data Points', 'boolean')}
            {renderField('actionableAdvice', 'Actionable Advice', 'boolean')}
            {renderField('emotionalAppeal', 'Emotional Appeal', 'boolean')}
            {renderField('audienceEngagement', 'Audience Engagement Prompts', 'boolean')}
            {renderField('seoOptimization', 'SEO Optimization', 'boolean')}
            {renderField('transcriptFriendly', 'Transcript Friendly', 'boolean')}
            {renderField('pacing', 'Script Pacing', 'select', ['slow', 'moderate', 'fast', 'variable'])}
            {renderField('transitionStyle', 'Transition Style', 'select', ['smooth', 'abrupt', 'creative', 'minimal'])}
            {renderField('repetitionLevel', 'Key Point Repetition', 'select', ['none', 'minimal', 'moderate', 'high'])}
            {renderField('tags', 'Tags', 'array')}
            {renderField('keywords', 'Keywords', 'array')}
            {renderField('keyPhrases', 'Key Phrases', 'array')}
            {renderField('callToActions', 'Call to Actions', 'array')}
          </div>
        );

      case 'voice-generator':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('text', 'Text to Speak', 'textarea')}
            <VoiceManager
              selectedVoiceId={getIn(form, 'voiceId', 'Fahco4VZzobUeiPqni1S')}
              onVoiceSelect={(voiceId) => updateField('voiceId', voiceId)}
              apiKey={apiKeys?.elevenlabs}
            />
            {renderField('stability', 'Stability', 'range', { min: 0, max: 1, step: 0.1 })}
            {renderField('similarityBoost', 'Similarity Boost', 'range', { min: 0, max: 1, step: 0.1 })}
            {renderField('style', 'Style', 'range', { min: 0, max: 1, step: 0.1 })}
            {renderField('clarity', 'Clarity Enhancement', 'range', { min: 0, max: 1, step: 0.1 })}
            {renderField('useSpeakerBoost', 'Use Speaker Boost', 'boolean')}
            {renderField('model', 'Model', 'select', ['eleven_multilingual_v2', 'eleven_monolingual_v1', 'eleven_multilingual_v1'])}
            {renderField('outputFormat', 'Output Format', 'select', ['mp3_44100_192', 'mp3_44100_128', 'pcm_16000', 'pcm_22050', 'pcm_24000', 'pcm_44100'])}
            {renderField('normalization', 'Audio Normalization', 'boolean')}
            {renderField('compression', 'Dynamic Range Compression', 'boolean')}
            {renderField('equalization', 'EQ Enhancement', 'boolean')}
            {renderField('voiceCharacter', 'Voice Character', 'select', ['natural', 'authoritative', 'friendly', 'energetic', 'calm', 'dramatic'])}
            {renderField('emotionalRange', 'Emotional Range', 'select', ['neutral', 'expressive', 'dramatic', 'subtle'])}
            {renderField('speakingRate', 'Speaking Rate', 'range', { min: 0.5, max: 2.0, step: 0.1 })}
            {renderField('emphasis', 'Emphasis Level', 'range', { min: 0, max: 2, step: 0.1 })}
            {renderField('pauseLength', 'Pause Length', 'select', ['short', 'medium', 'long', 'natural'])}
            {renderField('intonationVariety', 'Intonation Variety', 'range', { min: 0, max: 1, step: 0.1 })}
          </div>
        );

      case 'image-generator':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('prompt', 'Image Prompt', 'textarea')}
            {renderField('negativePrompt', 'Negative Prompt', 'textarea')}
            {renderField('count', 'Number of Images', 'number')}
            {renderField('style', 'Style', 'select', ['photorealistic', 'artistic', 'cartoon', 'abstract', 'vintage', 'modern'])}
            {renderField('aspectRatio', 'Aspect Ratio', 'select', ['1:1', '16:9', '9:16', '4:3', '3:4'])}
            {renderField('quality', 'Quality', 'select', ['standard', 'hd'])}
            {renderField('model', 'Model', 'select', ['dall-e-3', 'dall-e-2'])}
            {renderField('resolution', 'Resolution', 'select', ['1024x1024', '1792x1024', '1024x1792'])}
            {renderField('upscaling', 'Upscaling', 'select', ['none', '2x', '4x', '8x'])}
            {renderField('postProcessing', 'Post Processing', 'boolean')}
            {renderField('safetyFilter', 'Safety Filter', 'boolean')}
          </div>
        );

      case 'likeness-node':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('referenceImages', 'Reference Images', 'file')}
            {renderField('subjectName', 'Subject Name', 'text')}
            {renderField('strictness', 'Likeness Strictness', 'range', { min: 0.1, max: 1.0, step: 0.05 })}
            {renderField('detailLevel', 'Detail Level', 'select', ['basic', 'detailed', 'comprehensive'])}
            {renderField('consistencyMode', 'Consistency Mode', 'select', ['strict', 'moderate', 'flexible'])}
            {renderField('maxImages', 'Max Images', 'number')}
            
            <div className="text-xs text-gray-400 bg-purple-500/10 p-3 rounded border border-purple-500/20">
              <div className="font-medium text-purple-400 mb-2">Likeness Node Guide</div>
              <ul className="space-y-1">
                <li>• Upload multiple reference images of the same person</li>
                <li>• Images are automatically persisted across sessions</li>
                <li>• Higher strictness = more exact likeness matching</li>
                <li>• Comprehensive detail = more detailed character description</li>
                <li>• This node will inject subject identity into all downstream image prompts</li>
              </ul>
            </div>
          </div>
        );

      case 'sequential-node':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('extractDialogueOnly', 'Extract Dialogue Only', 'boolean')}
            {renderField('includeVisualCues', 'Include Visual Cues', 'boolean')}
            {renderField('preserveOrder', 'Preserve Order', 'boolean')}
            {renderField('queueDelayMs', 'Queue Delay (ms)', 'range', { min: 100, max: 2000, step: 50 })}
            {renderField('waitForClear', 'Wait for Clear Signal', 'boolean')}
            
            <div className="text-xs text-gray-400 bg-blue-500/10 p-3 rounded border border-blue-500/20">
              <div className="font-medium text-blue-400 mb-2">Sequential Processing</div>
              <ul className="space-y-1">
                <li>• Parses script content into voice and image items</li>
                <li>• Recognizes "Visual prompt:" lines for image generation</li>
                <li>• Extracts speaker dialogue for voice generation</li>
                <li>• Processes items in order with configurable delays</li>
              </ul>
            </div>
          </div>
        );

      case 'image-sequential-node':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('extractImagePromptsOnly', 'Extract Image Prompts Only', 'boolean')}
            {renderField('includeSceneDescriptions', 'Include Scene Descriptions', 'boolean')}
            {renderField('preserveOrder', 'Preserve Order', 'boolean')}
            {renderField('queueDelayMs', 'Queue Delay (ms)', 'range', { min: 100, max: 2000, step: 50 })}
            {renderField('defaultDuration', 'Default Image Duration (seconds)', 'range', { min: 1, max: 10, step: 0.5 })}
            {renderField('sceneTransitions', 'Scene Transitions', 'select', ['cut', 'fade', 'slide', 'zoom', 'dissolve'])}
            {renderField('timingMode', 'Timing Mode', 'select', ['auto', 'manual', 'audio_sync'])}
            {renderField('aspectRatio', 'Force Aspect Ratio', 'select', ['none', '16:9', '9:16', '4:3', '3:4', '1:1'])}
            {renderField('styleConsistency', 'Style Consistency', 'boolean')}
            {renderField('characterConsistency', 'Character Consistency', 'boolean')}
            {renderField('sceneMarkers', 'Scene Markers', 'array')}
            {renderField('timingMarkers', 'Timing Markers', 'array')}
            
            <div className="text-xs text-gray-400 bg-pink-500/10 p-3 rounded border border-pink-500/20">
              <div className="font-medium text-pink-400 mb-2">Image Sequential Processing</div>
              <ul className="space-y-1">
                <li>• Parses script content into timed image generation items</li>
                <li>• Recognizes "Visual prompt:" and scene description lines</li>
                <li>• Extracts timing information from timestamps or audio sync</li>
                <li>• Maintains visual consistency across sequential images</li>
                <li>• Outputs structured data for batch image generation</li>
              </ul>
            </div>
          </div>
        );

      case 'judgment-node':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('evaluationMethod', 'Evaluation Method', 'select', ['ai_analysis', 'heuristic', 'custom'])}
            {renderField('qualityThreshold', 'Quality Threshold', 'range', { min: 0.1, max: 1.0, step: 0.05 })}
            {renderField('confidenceThreshold', 'Confidence Threshold', 'range', { min: 0.1, max: 1.0, step: 0.05 })}
            {renderField('likenessRequired', 'Likeness Required', 'boolean')}
            {renderField('likenessThreshold', 'Likeness Threshold', 'range', { min: 0.5, max: 1.0, step: 0.05 })}
            {renderField('criteria', 'Evaluation Criteria', 'array')}
            {renderField('autoFailOnLikenessError', 'Auto Fail on Likeness Error', 'boolean')}
            
            <div className="text-xs text-gray-400 bg-orange-500/10 p-3 rounded border border-orange-500/20">
              <div className="font-medium text-orange-400 mb-2">AI Judgment System</div>
              <ul className="space-y-1">
                <li>• Uses OpenAI Vision for image analysis</li>
                <li>• Evaluates quality, prompt adherence, and likeness match</li>
                <li>• Routes approved content to YES port, rejected to NO port</li>
                <li>• Automatic failure if likeness doesn't match reference</li>
                <li>• Provides detailed reasoning for all decisions</li>
              </ul>
            </div>
          </div>
        );

      case 'file-input-node':
        return (
          <div className="space-y-4">
            {portConfigSection}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Upload Script File</label>
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    
                    // Handle binary files (PDF, DOCX) differently
                    if (file.type === 'application/pdf' || 
                        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                      reader.onload = (event) => {
                        const arrayBuffer = event.target?.result as ArrayBuffer;
                        const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                        updateField('uploadedFile', {
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          content: base64String,
                          encoding: 'base64',
                          uploadedAt: Date.now()
                        });
                      };
                      reader.readAsArrayBuffer(file);
                    } else {
                      // Plain text files
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        updateField('uploadedFile', {
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          content: content,
                          uploadedAt: Date.now()
                        });
                      };
                      reader.readAsText(file);
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:border-amber-500"
              />
              
              {getIn(form, 'uploadedFile.name') && (
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-sm text-green-400 font-medium">
                    ✓ {getIn(form, 'uploadedFile.name')}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(getIn(form, 'uploadedFile.size', 0) / 1024)} KB • 
                    Uploaded {new Date(getIn(form, 'uploadedFile.uploadedAt', 0)).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            {renderField('parseMode', 'Parse Mode', 'select', ['auto', 'script_only', 'prompts_only', 'mixed'])}
            {renderField('scriptMarkers', 'Script Markers', 'array')}
            {renderField('promptMarkers', 'Image Prompt Markers', 'array')}
            {renderField('splitByLines', 'Split by Lines', 'boolean')}
            {renderField('removeTimestamps', 'Remove Timestamps', 'boolean')}
            {renderField('cleanFormatting', 'Clean Formatting', 'boolean')}
            {renderField('extractSpeakerNames', 'Extract Speaker Names', 'boolean')}
            {renderField('preserveStructure', 'Preserve Structure', 'boolean')}
            
            <div className="text-xs text-gray-400 bg-cyan-500/10 p-3 rounded border border-cyan-500/20">
              <div className="font-medium text-cyan-400 mb-2">File Input Node Guide</div>
              <ul className="space-y-1">
                <li>• Upload .txt or .pdf script files from your computer</li>
                <li>• Port 0 (Script): Outputs cleaned script text for voice generation</li>
                <li>• Port 1 (Prompts): Outputs extracted image prompts for visual generation</li>
                <li>• Auto-configures downstream voice and image nodes</li>
                <li>• Supports various script formats and parsing modes</li>
              </ul>
            </div>
          </div>
        );

      case 'lora-training-node':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('trainingImages', 'Training Images', 'file')}
            {renderField('subjectName', 'Subject Name', 'text')}
            {renderField('triggerWord', 'Trigger Word', 'text')}
            {renderField('trainingSteps', 'Training Steps', 'range', { min: 500, max: 5000, step: 100 })}
            {renderField('learningRate', 'Learning Rate', 'range', { min: 0.00001, max: 0.001, step: 0.00005 })}
            {renderField('batchSize', 'Batch Size', 'select', ['1', '2', '4', '8'])}
            {renderField('resolution', 'Training Resolution', 'select', ['512x512', '768x768', '1024x1024'])}
            {renderField('augmentation', 'Data Augmentation', 'boolean')}
            {renderField('flipHorizontal', 'Horizontal Flip', 'boolean')}
            {renderField('colorJitter', 'Color Jitter', 'boolean')}
            
            {/* Training Status Display */}
            {getIn(form, 'lastResult.trainingId') && (
              <div className="bg-blue-500/10 p-3 rounded border border-blue-500/20">
                <div className="font-medium text-blue-400 mb-2">Training Status</div>
                <div className="space-y-2 text-xs">
                  <div>Training ID: {getIn(form, 'lastResult.trainingId')}</div>
                  <div>Status: {getIn(form, 'lastResult.status', 'Unknown')}</div>
                  <div>Progress: {getIn(form, 'lastResult.progress', 0)}%</div>
                  {getIn(form, 'lastResult.estimatedTime') && (
                    <div>Est. Time: {Math.round(getIn(form, 'lastResult.estimatedTime') / 60)} minutes</div>
                  )}
                  {getIn(form, 'lastResult.message') && (
                    <div className="text-blue-300">{getIn(form, 'lastResult.message')}</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-400 bg-indigo-500/10 p-3 rounded border border-indigo-500/20">
              <div className="font-medium text-indigo-400 mb-2">LoRA Training Guide</div>
              <ul className="space-y-1">
                <li>• Upload 5-20 high-quality images of the same person</li>
                <li>• Images should show different angles and expressions</li>
                <li>• REAL training takes 5-30 minutes depending on settings</li>
                <li>• Higher steps = better quality but longer training</li>
                <li>• Use the trained model in a LoRA Node before Image Generator</li>
                <li>• Training happens on the server - you can close the browser</li>
              </ul>
              
              {/* Show validation status */}
              {getIn(form, 'trainingImages', []).length > 0 && (
                <div className={`mt-3 p-2 rounded border ${
                  getIn(form, 'trainingImages', []).length >= 5 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  <div className="font-medium">
                    {getIn(form, 'trainingImages', []).length >= 5 ? '✓' : '⚠'} 
                    {' '}{getIn(form, 'trainingImages', []).length} / 5 images uploaded
                  </div>
                  {getIn(form, 'trainingImages', []).length < 5 && (
                    <div className="text-xs mt-1">
                      Need {5 - getIn(form, 'trainingImages', []).length} more images to start training
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'lora-node':
        return (
          <div className="space-y-4">
            {portConfigSection}
            
            <TrainedModelSelector
              selectedModel={getIn(form, 'selectedModel')}
              onModelSelect={(model) => updateField('selectedModel', model)}
            />
            
            {getIn(form, 'selectedModel.modelId') && (
              <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                <div className="text-sm text-green-400 font-medium mb-2">
                  ✓ Model: {getIn(form, 'selectedModel.subjectName')}
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Trigger Word: {getIn(form, 'selectedModel.triggerWord')}</div>
                  <div>Quality: {getIn(form, 'selectedModel.qualityMetrics.overallQuality', 0)}%</div>
                </div>
              </div>
            )}
            
            {renderField('strength', 'LoRA Strength', 'range', { min: 0.1, max: 2.0, step: 0.1 })}
            {renderField('blendMode', 'Blend Mode', 'select', ['replace', 'merge', 'enhance'])}
            {renderField('preserveBackground', 'Preserve Background', 'boolean')}
            {renderField('faceOnly', 'Face Only Mode', 'boolean')}
            
            <div className="text-xs text-gray-400 bg-purple-500/10 p-3 rounded border border-purple-500/20">
              <div className="font-medium text-purple-400 mb-2">LoRA Application</div>
              <ul className="space-y-1">
                <li>• Applies REAL trained LoRA model to inject subject</li>
                <li>• Perfect consistency across all generated content</li>
                <li>• Uses actual model weights, not prompt engineering</li>
                <li>• Connect before Image Generator for best results</li>
                <li>• Replaces/injects subject while preserving scene context</li>
              </ul>
            </div>
          </div>
        );

      case 'image-preview-node':
      case 'audio-preview-node':
      case 'video-preview-node':
      case 'text-preview-node':
        return (
          <div className="space-y-4">
            {portConfigSection}
            
            <div className="text-xs text-gray-400 bg-purple-500/10 p-3 rounded border border-purple-500/20">
              <div className="font-medium text-purple-400 mb-2">Preview Node</div>
              <ul className="space-y-1">
                <li>• Specialized preview for {node.type.replace('-preview-node', '')} content</li>
                <li>• Automatically displays data from connected nodes</li>
                <li>• No outputs - preview only</li>
                <li>• Real-time updates when data flows through</li>
              </ul>
            </div>
          </div>
        );

      case 'digivice-widget':
        return (
          <div className="space-y-4">
            {portConfigSection}
            {renderField('shell', 'Device Shell', 'select', ['brick', 'oval', 'round', 'neon'])}
            {renderField('difficulty', 'Difficulty', 'select', ['Casual', 'Normal', 'Hard'])}
            {renderField('speed', 'Game Speed', 'select', ['0.5', '1', '2', '4', '8'])}
            {renderField('autoSave', 'Auto Save', 'boolean')}
            {renderField('sound', 'Sound Effects', 'boolean')}
            {renderField('music', 'Background Music', 'boolean')}
            {renderField('volume', 'Volume', 'range', { min: 0, max: 1, step: 0.1 })}
            {renderField('poopEnabled', 'Poop Mechanics', 'boolean')}
            {renderField('deathEnabled', 'Death Enabled', 'boolean')}
            {renderField('linkPlay', 'Link Play', 'boolean')}
            {renderField('exploration', 'Exploration Mode', 'boolean')}
            {renderField('events', 'Daily Events', 'boolean')}
            {renderField('debug', 'Debug Mode', 'boolean')}
            
            <div className="text-xs text-gray-400 bg-amber-500/10 p-3 rounded border border-amber-500/20">
              <div className="font-medium text-amber-400 mb-2">Digivice Virtual Pet</div>
              <ul className="space-y-1">
                <li>• Raise and train digital monsters through evolution stages</li>
                <li>• Feed, clean, train, and battle your creatures</li>
                <li>• Multiple device shells and customization options</li>
                <li>• Full-featured game with sound, music, and animations</li>
                <li>• Link play for multiplayer battles and trading</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {portConfigSection}
            <div className="text-center text-gray-500 py-8">
              <p>No specific properties for this node type</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 space-y-6">
      {renderNodeSpecificProperties()}
      
      {hiddenFields.size > 0 && (
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Hidden Fields ({hiddenFields.size})</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(hiddenFields).map(field => (
              <button
                key={field}
                onClick={() => toggleVisibility(field)}
                className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs hover:bg-white/10 transition-colors"
              >
                <Eye className="w-3 h-3 inline mr-1" />
                {field}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {node.data?.lastResult?.nodeConfigurations && (
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-medium text-amber-400 mb-2">Auto-Configurations Applied</h4>
          <div className="text-xs text-gray-400 space-y-1">
            {Object.entries(node.data?.lastResult?.nodeConfigurations || {}).map(([nodeType, config]) => (
              <div key={nodeType} className="flex justify-between">
                <span>{nodeType}:</span>
                <span>{Object.keys(config as any).length} settings</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}