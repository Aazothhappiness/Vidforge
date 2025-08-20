import React, { useState } from 'react';
import { 
  ArrowLeft, Star, Play, Clock, Users, Brain, TrendingUp, 
  Zap, Video, Mic, Image, FileText, Eye, Download 
} from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<any>;
  color: string;
  difficulty: number;
  estimatedTime: string;
  category: string;
  tags: string[];
  nodes: any[];
  connections: any[];
  featured?: boolean;
}

interface WorkflowTemplatesProps {
  onLoadTemplate: (template: any) => void;
  onBack: () => void;
}

export default function WorkflowTemplates({ onLoadTemplate, onBack }: WorkflowTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const templates: WorkflowTemplate[] = [
    {
      id: 'simple-content-creation',
      name: 'Simple Content Creation',
      description: 'Perfect for beginners - research, script, voice, and images',
      longDescription: 'A straightforward workflow that takes you from keyword research to final video. Includes trend research, script generation, voice synthesis, and image creation with basic quality control.',
      icon: Play,
      color: 'from-green-500 to-emerald-500',
      difficulty: 1,
      estimatedTime: '5-10 min',
      category: 'beginner',
      tags: ['beginner', 'simple', 'basic'],
      featured: true,
      nodes: [
        {
          id: 'trend-research-simple',
          type: 'trend-research',
          position: { x: 100, y: 100 },
          data: {
            keyword: 'your topic here',
            style: 'educational',
            contentType: 'longform'
          }
        },
        {
          id: 'script-generator-simple',
          type: 'script-generator',
          position: { x: 500, y: 100 },
          data: {
            duration: 480,
            style: 'conversational',
            includeHooks: true,
            includeCTA: true
          }
        },
        {
          id: 'voice-generator-simple',
          type: 'voice-generator',
          position: { x: 900, y: 50 },
          data: {
            voiceId: 'Fahco4VZzobUeiPqni1S',
            stability: 0.7,
            similarityBoost: 0.8
          }
        },
        {
          id: 'image-generator-simple',
          type: 'image-generator',
          position: { x: 900, y: 200 },
          data: {
            style: 'photorealistic',
            aspectRatio: '16:9',
            quality: 'hd',
            count: 3
          }
        },
        {
          id: 'preview-final-simple',
          type: 'preview-node',
          position: { x: 1300, y: 125 },
          data: {}
        }
      ],
      connections: [
        {
          id: 'trend-to-script-simple',
          sourceId: 'trend-research-simple',
          targetId: 'script-generator-simple',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'script-to-voice-simple',
          sourceId: 'script-generator-simple',
          targetId: 'voice-generator-simple',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'script-to-image-simple',
          sourceId: 'script-generator-simple',
          targetId: 'image-generator-simple',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'voice-to-preview-simple',
          sourceId: 'voice-generator-simple',
          targetId: 'preview-final-simple',
          sourcePort: 0,
          targetPort: 0
        }
      ]
    },
    {
      id: 'adaptive-learning-loop',
      name: 'Self-Improving AI',
      description: 'Advanced AI that learns from failures and improves',
      longDescription: 'An intelligent workflow that uses judgment nodes and feedback loops to continuously improve content quality. Features automatic retry mechanisms and AI-powered quality assessment.',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      difficulty: 5,
      estimatedTime: '30-60 min',
      category: 'advanced',
      tags: ['ai', 'learning', 'advanced', 'quality'],
      featured: true,
      nodes: [
        {
          id: 'research-adaptive',
          type: 'trend-research',
          position: { x: 100, y: 100 },
          data: {
            keyword: 'AI automation',
            competitorAnalysis: true,
            trendPrediction: true
          }
        },
        {
          id: 'script-adaptive',
          type: 'script-generator',
          position: { x: 500, y: 100 },
          data: {
            style: 'conversational',
            includeHooks: true,
            visualCues: true
          }
        },
        {
          id: 'judgment-script',
          type: 'judgment-node',
          position: { x: 900, y: 100 },
          data: {
            qualityThreshold: 0.8,
            criteria: ['Clear structure', 'Engaging content', 'Proper length']
          }
        },
        {
          id: 'improvement-loop',
          type: 'improvement-node',
          position: { x: 900, y: 300 },
          data: {
            improvementType: 'enhance_detail',
            intensityLevel: 'moderate'
          }
        },
        {
          id: 'loop-controller',
          type: 'loop-node',
          position: { x: 500, y: 300 },
          data: {
            iterations: 3,
            condition: 'until_success'
          }
        }
      ],
      connections: [
        {
          id: 'research-to-script-adaptive',
          sourceId: 'research-adaptive',
          targetId: 'script-adaptive',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'script-to-judgment-adaptive',
          sourceId: 'script-adaptive',
          targetId: 'judgment-script',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'judgment-no-to-improvement',
          sourceId: 'judgment-script',
          targetId: 'improvement-loop',
          sourcePort: 1,
          targetPort: 0
        },
        {
          id: 'improvement-to-loop',
          sourceId: 'improvement-loop',
          targetId: 'loop-controller',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'loop-to-script',
          sourceId: 'loop-controller',
          targetId: 'script-adaptive',
          sourcePort: 0,
          targetPort: 1
        }
      ]
    },
    {
      id: 'viral-content-optimizer',
      name: 'Viral Content Optimizer',
      description: 'Maximize engagement and viral potential',
      longDescription: 'Optimized for maximum engagement with trend analysis, viral hooks, character consistency, and multi-platform publishing. Includes advanced analytics tracking.',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      difficulty: 4,
      estimatedTime: '35-50 min',
      category: 'marketing',
      tags: ['viral', 'engagement', 'marketing', 'analytics'],
      featured: true,
      nodes: [
        {
          id: 'viral-research',
          type: 'trend-research',
          position: { x: 100, y: 100 },
          data: {
            viralPotential: true,
            engagementMetrics: true,
            thumbnailAnalysis: true,
            titleAnalysis: true
          }
        },
        {
          id: 'viral-script',
          type: 'script-generator',
          position: { x: 500, y: 100 },
          data: {
            openingStyle: 'hook',
            storytelling: true,
            emotionalAppeal: true,
            audienceEngagement: true
          }
        },
        {
          id: 'character-consistency',
          type: 'likeness-node',
          position: { x: 900, y: 100 },
          data: {
            strictness: 0.9,
            detailLevel: 'comprehensive'
          }
        },
        {
          id: 'viral-publisher',
          type: 'export-publisher',
          position: { x: 1300, y: 100 },
          data: {
            platform: 'youtube',
            monetization: true
          }
        },
        {
          id: 'analytics-tracker',
          type: 'analytics-tracker',
          position: { x: 1700, y: 100 },
          data: {
            trackViews: true,
            trackEngagement: true,
            generateReports: true
          }
        }
      ],
      connections: [
        {
          id: 'viral-research-to-script',
          sourceId: 'viral-research',
          targetId: 'viral-script',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'script-to-character',
          sourceId: 'viral-script',
          targetId: 'character-consistency',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'character-to-publisher',
          sourceId: 'character-consistency',
          targetId: 'viral-publisher',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'publisher-to-analytics',
          sourceId: 'viral-publisher',
          targetId: 'analytics-tracker',
          sourcePort: 0,
          targetPort: 0
        }
      ]
    },
    {
      id: 'audio-podcast-workflow',
      name: 'Audio Podcast Creator',
      description: 'Create professional podcast episodes with multiple voices',
      longDescription: 'Specialized workflow for creating podcast content with multiple speakers, background music, and professional audio processing.',
      icon: Mic,
      color: 'from-blue-500 to-cyan-500',
      difficulty: 3,
      estimatedTime: '20-30 min',
      category: 'audio',
      tags: ['podcast', 'audio', 'voices', 'music'],
      nodes: [
        {
          id: 'podcast-research',
          type: 'content-research',
          position: { x: 100, y: 100 },
          data: {
            depth: 'comprehensive',
            includeImages: false,
            expertQuotes: true
          }
        },
        {
          id: 'podcast-script',
          type: 'script-generator',
          position: { x: 500, y: 100 },
          data: {
            style: 'conversational',
            tone: 'friendly',
            scriptStructure: 'story_driven'
          }
        },
        {
          id: 'voice-host',
          type: 'voice-generator',
          position: { x: 900, y: 50 },
          data: {
            voiceId: '21m00Tcm4TlvDq8ikWAM',
            voiceCharacter: 'authoritative'
          }
        },
        {
          id: 'voice-guest',
          type: 'voice-generator',
          position: { x: 900, y: 200 },
          data: {
            voiceId: 'ErXwobaYiN019PkySvjV',
            voiceCharacter: 'friendly'
          }
        },
        {
          id: 'audio-processor',
          type: 'audio-processor',
          position: { x: 1300, y: 125 },
          data: {
            normalization: true,
            compression: true,
            equalization: true
          }
        }
      ],
      connections: [
        {
          id: 'research-to-script-podcast',
          sourceId: 'podcast-research',
          targetId: 'podcast-script',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'script-to-host-podcast',
          sourceId: 'podcast-script',
          targetId: 'voice-host',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'script-to-guest-podcast',
          sourceId: 'podcast-script',
          targetId: 'voice-guest',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'host-to-processor-podcast',
          sourceId: 'voice-host',
          targetId: 'audio-processor',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'guest-to-processor-podcast',
          sourceId: 'voice-guest',
          targetId: 'audio-processor',
          sourcePort: 0,
          targetPort: 1
        }
      ]
    },
    {
      id: 'visual-storytelling',
      name: 'Visual Storytelling',
      description: 'Create compelling visual narratives with consistent characters',
      longDescription: 'Focus on visual content creation with character consistency, scene composition, and narrative flow. Perfect for visual-heavy content.',
      icon: Image,
      color: 'from-pink-500 to-rose-500',
      difficulty: 3,
      estimatedTime: '25-40 min',
      category: 'visual',
      tags: ['visual', 'storytelling', 'characters', 'narrative'],
      nodes: [
        {
          id: 'story-research',
          type: 'content-research',
          position: { x: 100, y: 100 },
          data: {
            depth: 'comprehensive',
            includeImages: true,
            caseStudies: true
          }
        },
        {
          id: 'story-script',
          type: 'script-generator',
          position: { x: 500, y: 100 },
          data: {
            scriptStructure: 'story_driven',
            visualCues: true,
            storytelling: true
          }
        },
        {
          id: 'character-likeness',
          type: 'likeness-node',
          position: { x: 900, y: 100 },
          data: {
            strictness: 0.85,
            detailLevel: 'comprehensive',
            consistencyMode: 'strict'
          }
        },
        {
          id: 'story-images',
          type: 'image-generator',
          position: { x: 1300, y: 100 },
          data: {
            style: 'artistic',
            lighting: 'cinematic',
            composition: 'rule_of_thirds',
            count: 5
          }
        }
      ],
      connections: [
        {
          id: 'research-to-script-story',
          sourceId: 'story-research',
          targetId: 'story-script',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'script-to-likeness-story',
          sourceId: 'story-script',
          targetId: 'character-likeness',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'likeness-to-images-story',
          sourceId: 'character-likeness',
          targetId: 'story-images',
          sourcePort: 0,
          targetPort: 0
        }
      ]
    },
    {
      id: 'batch-content-production',
      name: 'Batch Content Production',
      description: 'Generate multiple pieces of content efficiently',
      longDescription: 'Optimized for creating multiple videos or content pieces in a single run. Uses batch processing and parallel generation.',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      difficulty: 4,
      estimatedTime: '45-90 min',
      category: 'production',
      tags: ['batch', 'production', 'efficiency', 'multiple'],
      nodes: [
        {
          id: 'batch-research',
          type: 'trend-research',
          position: { x: 100, y: 100 },
          data: {
            maxResults: 10,
            competitorAnalysis: true
          }
        },
        {
          id: 'batch-processor',
          type: 'batch-processor',
          position: { x: 500, y: 100 },
          data: {}
        },
        {
          id: 'batch-scripts',
          type: 'script-generator',
          position: { x: 900, y: 50 },
          data: {
            style: 'professional',
            includeHooks: true
          }
        },
        {
          id: 'batch-images',
          type: 'batch-comfyui',
          position: { x: 900, y: 200 },
          data: {
            count: 10,
            style: 'photorealistic'
          }
        }
      ],
      connections: [
        {
          id: 'research-to-batch',
          sourceId: 'batch-research',
          targetId: 'batch-processor',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'batch-to-scripts',
          sourceId: 'batch-processor',
          targetId: 'batch-scripts',
          sourcePort: 0,
          targetPort: 0
        },
        {
          id: 'batch-to-images',
          sourceId: 'batch-processor',
          targetId: 'batch-images',
          sourcePort: 0,
          targetPort: 0
        }
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'advanced', name: 'Advanced' },
    { id: 'audio', name: 'Audio' },
    { id: 'visual', name: 'Visual' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'production', name: 'Production' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-400 bg-green-400/20';
    if (difficulty <= 3) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-red-400 bg-red-400/20';
  };

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    onLoadTemplate({
      name: template.name,
      nodes: template.nodes,
      connections: template.connections,
      metadata: {
        version: '2.0',
        isTemplate: true,
        templateId: template.id
      }
    });
  };

  const exportTemplate = (template: WorkflowTemplate) => {
    const templateData = {
      name: template.name,
      description: template.description,
      nodes: template.nodes,
      connections: template.connections,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="glass-strong border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold">Workflow Templates</h1>
                <p className="text-gray-400">Choose from pre-built workflows to get started quickly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all transform hover:scale-105 cursor-pointer"
                onClick={() => setSelectedTemplate(template)}
              >
                {template.featured && (
                  <div className="flex items-center space-x-1 mb-3">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-xs text-amber-400 font-medium">Featured</span>
                  </div>
                )}
                
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${template.color} mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2 group-hover:text-amber-400 transition-colors">
                  {template.name}
                </h3>
                <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-xs">
                    <span className={`px-2 py-1 rounded-full ${getDifficultyColor(template.difficulty)}`}>
                      Level {template.difficulty}/5
                    </span>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{template.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {template.nodes.length} nodes • {template.connections.length} connections
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportTemplate(template);
                      }}
                      className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                      title="Export template"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                      }}
                      className="p-2 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Preview template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-400">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-500 mb-4">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No templates found in this category</p>
              <p className="text-sm">Try selecting a different category</p>
            </div>
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedTemplate.color}`}>
                    <selectedTemplate.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTemplate.name}</h2>
                    <p className="text-gray-400">{selectedTemplate.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedTemplate.longDescription}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Workflow Overview</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Nodes:</span>
                          <span className="text-white ml-2">{selectedTemplate.nodes.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Connections:</span>
                          <span className="text-white ml-2">{selectedTemplate.connections.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Difficulty:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                            Level {selectedTemplate.difficulty}/5
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Est. Time:</span>
                          <span className="text-white ml-2">{selectedTemplate.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Included Nodes</h3>
                    <div className="space-y-2">
                      {selectedTemplate.nodes.map((node, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                          <span className="text-white font-medium">{node.type.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Template Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleLoadTemplate(selectedTemplate)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg font-medium hover:from-amber-400 hover:to-orange-400 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      <span>Use This Template</span>
                    </button>

                    <button
                      onClick={() => exportTemplate(selectedTemplate)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Template</span>
                    </button>
                  </div>

                  <div className="text-xs text-gray-400 bg-blue-500/10 p-3 rounded border border-blue-500/20">
                    <div className="font-medium text-blue-400 mb-2">Getting Started</div>
                    <ul className="space-y-1">
                      <li>• Click "Use This Template" to load it</li>
                      <li>• Customize node properties as needed</li>
                      <li>• Add your API keys in Settings</li>
                      <li>• Click "Start Workflow" to begin</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}