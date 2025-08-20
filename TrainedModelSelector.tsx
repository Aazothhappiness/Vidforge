import React, { useState, useEffect } from 'react';
import { RefreshCw, Brain, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TrainedModel {
  modelId: string;
  triggerWord: string;
  subjectName?: string;
  trainedAt: number;
  qualityMetrics: {
    overallQuality: number;
    subjectConsistency: number;
    promptAdherence: number;
  };
}

interface TrainedModelSelectorProps {
  selectedModel?: TrainedModel;
  onModelSelect: (model: TrainedModel) => void;
}

export default function TrainedModelSelector({ selectedModel, onModelSelect }: TrainedModelSelectorProps) {
  const [models, setModels] = useState<TrainedModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching trained models from /api/trained-models');
      const response = await fetch('/api/trained-models');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.ok) {
        setModels(data.models || []);
        console.log('Loaded models:', data.models?.length || 0);
      } else {
        console.error('API error:', data.error);
        throw new Error(data.error || 'Failed to fetch models');
      }
    } catch (err) {
      console.error('Error fetching trained models:', err);
      setError('Failed to load trained models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-green-400';
    if (quality >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQualityIcon = (quality: number) => {
    if (quality >= 90) return <CheckCircle className="w-3 h-3" />;
    if (quality >= 75) return <Clock className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">Select Trained Model</label>
        <button
          onClick={fetchModels}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
          title="Refresh models"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-400/10 p-2 rounded border border-red-400/20">
          {error}
        </div>
      )}

      {models.length === 0 && !loading ? (
        <div className="text-center py-6 text-gray-400">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No trained models available</p>
          <p className="text-xs">Train a model using the LoRA Training Node first</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {models.map(model => (
            <div
              key={model.modelId}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedModel?.modelId === model.modelId
                  ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              onClick={() => onModelSelect(model)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm text-white">
                  {model.subjectName || model.modelId}
                </div>
                <div className={`flex items-center space-x-1 ${getQualityColor(model.qualityMetrics.overallQuality)}`}>
                  {getQualityIcon(model.qualityMetrics.overallQuality)}
                  <span className="text-xs">{model.qualityMetrics.overallQuality}%</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 space-y-1">
                <div>Trigger: <span className="font-mono text-purple-400">{model.triggerWord}</span></div>
                <div>Trained: {formatDate(model.trainedAt)}</div>
                <div className="flex justify-between">
                  <span>Consistency: {model.qualityMetrics.subjectConsistency}%</span>
                  <span>Adherence: {model.qualityMetrics.promptAdherence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedModel && (
        <div className="bg-purple-500/10 p-3 rounded border border-purple-500/20">
          <div className="text-sm text-purple-400 font-medium mb-2">
            ✓ Selected: {selectedModel.subjectName || selectedModel.modelId}
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Model ID: <span className="font-mono">{selectedModel.modelId}</span></div>
            <div>Trigger Word: <span className="font-mono text-purple-400">{selectedModel.triggerWord}</span></div>
            <div>Overall Quality: <span className={getQualityColor(selectedModel.qualityMetrics.overallQuality)}>
              {selectedModel.qualityMetrics.overallQuality}%
            </span></div>
          </div>
        </div>
      )}
    </div>
  );
}