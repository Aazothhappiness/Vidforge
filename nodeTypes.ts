import { 
  Search, Zap, FileText, RefreshCw, Brain, Mic, 
  Headphones, Music, Users, Video, Image, Workflow,
  Sparkles, Package, Layers, Upload, Cloud, BarChart3,
  Eye, RotateCcw, X
} from 'lucide-react';
import { NodeType } from '../types/NodeTypes';

export const nodeTypes: NodeType[] = [
  // Research Nodes
  { id: 'trend-research', name: 'Trend Research', description: 'Analyze YouTube trends & keywords', icon: Search, category: 'research', color: 'from-blue-500 to-cyan-500' },
  { id: 'content-research', name: 'Content Research', description: 'Deep web research & data collection', icon: FileText, category: 'research', color: 'from-blue-500 to-cyan-500' },
  { id: 'research-revise', name: 'Research & Revise', description: 'AI-powered analysis and revision', icon: RefreshCw, category: 'research', color: 'from-purple-500 to-pink-500' },
  
  // Content Nodes
  { id: 'script-generator', name: 'Script Generator', description: 'Generate optimized video scripts', icon: FileText, category: 'content', color: 'from-green-500 to-emerald-500' },
  { id: 'ai-analysis', name: 'AI Analysis', description: 'Advanced content analysis', icon: Brain, category: 'content', color: 'from-purple-500 to-pink-500' },
  
  // Audio Nodes
  { id: 'voice-generator', name: 'Voice Generator', description: 'ElevenLabs text-to-speech', icon: Mic, category: 'audio', color: 'from-orange-500 to-red-500' },
  { id: 'audio-processor', name: 'Audio Processor', description: 'Audio editing and enhancement', icon: Headphones, category: 'audio', color: 'from-orange-500 to-red-500' },
  { id: 'music-generator', name: 'Music Generator', description: 'AI background music creation', icon: Music, category: 'audio', color: 'from-orange-500 to-red-500' },
  
  // Video Nodes
  { id: 'character-animator', name: 'Character Animator', description: 'Hedra Character 3 animation', icon: Users, category: 'video', color: 'from-indigo-500 to-purple-500' },
  { id: 'video-generator', name: 'Video Generator', description: 'Automated video content creation', icon: Video, category: 'video', color: 'from-indigo-500 to-purple-500' },
  { id: 'visual-effects', name: 'Visual Effects', description: 'Advanced video effects processing', icon: Sparkles, category: 'video', color: 'from-indigo-500 to-purple-500' },
  
  // Visual Nodes
  { id: 'image-generator', name: 'Image Generator', description: 'AI-powered image creation', icon: Image, category: 'visual', color: 'from-pink-500 to-rose-500' },
  { id: 'comfyui-workflow', name: 'ComfyUI Workflow', description: 'Connect to ComfyUI workflows', icon: Workflow, category: 'visual', color: 'from-pink-500 to-rose-500' },
  { id: 'batch-comfyui', name: 'Batch ComfyUI', description: 'Generate multiple images with ComfyUI workflows', icon: Layers, category: 'visual', color: 'from-pink-500 to-rose-500' },
  
  // Processing Nodes
  { id: 'media-processor', name: 'Media Processor', description: 'Process and optimize media files', icon: Package, category: 'processing', color: 'from-yellow-500 to-orange-500' },
  { id: 'batch-processor', name: 'Batch Processor', description: 'Process multiple files simultaneously', icon: Layers, category: 'processing', color: 'from-yellow-500 to-orange-500' },
  { id: 'quality-enhancer', name: 'Quality Enhancer', description: 'Upscale and enhance media quality', icon: Zap, category: 'processing', color: 'from-yellow-500 to-orange-500' },
  { id: 'loop-node', name: 'Loop Node', description: 'Repeat workflow processes with conditions', icon: RotateCcw, category: 'processing', color: 'from-cyan-500 to-blue-500' },
  
  // Output Nodes
  { id: 'export-publisher', name: 'Export & Publisher', description: 'Export and publish to platforms', icon: Upload, category: 'output', color: 'from-teal-500 to-green-500' },
  { id: 'cloud-storage', name: 'Cloud Storage', description: 'Save to cloud storage services', icon: Cloud, category: 'output', color: 'from-teal-500 to-green-500' },
  { id: 'analytics-tracker', name: 'Analytics Tracker', description: 'Track performance and analytics', icon: BarChart3, category: 'output', color: 'from-teal-500 to-green-500' },
  
  // Utility Nodes
  { id: 'input-node', name: 'Input Node', description: 'Format and route input data to any node', icon: FileText, category: 'utility', color: 'from-cyan-500 to-blue-500' },
  { id: 'decision-node', name: 'Decision Node', description: 'AI-powered decision making based on input data', icon: Brain, category: 'utility', color: 'from-purple-500 to-indigo-500' },
  { id: 'improvement-node', name: 'Improvement Node', description: 'AI enhancement for depth, detail, and engagement', icon: Zap, category: 'utility', color: 'from-amber-500 to-orange-500' },
  { id: 'image-preview-node', name: 'Image Preview', description: 'Preview and display generated images', icon: Image, category: 'utility', color: 'from-purple-500 to-pink-500' },
  { id: 'audio-preview-node', name: 'Audio Preview', description: 'Preview and play generated audio', icon: Headphones, category: 'utility', color: 'from-blue-500 to-cyan-500' },
  { id: 'video-preview-node', name: 'Video Preview', description: 'Preview and play generated videos', icon: Video, category: 'utility', color: 'from-indigo-500 to-purple-500' },
  { id: 'text-preview-node', name: 'Text Preview', description: 'Preview and display text content', icon: FileText, category: 'utility', color: 'from-green-500 to-emerald-500' },
  { id: 'judgment-node', name: 'Judgment Node', description: 'AI-powered quality assessment and content critique', icon: Brain, category: 'utility', color: 'from-red-500 to-orange-500' },
  { id: 'trash-node', name: 'Trash Node', description: 'Archive rejected content for review and analysis', icon: X, category: 'utility', color: 'from-gray-500 to-gray-600' },
  { id: 'sequential-node', name: 'Sequential Node', description: 'Process content sequentially, extracting spoken dialogue only', icon: RotateCcw, category: 'utility', color: 'from-indigo-500 to-blue-500' },
  { id: 'image-sequential-node', name: 'Image Sequential Node', description: 'Process image prompts sequentially with timing and scene control', icon: Image, category: 'utility', color: 'from-pink-500 to-purple-500' },
  { id: 'likeness-node', name: 'Likeness Node', description: 'Maintain visual consistency using reference images', icon: Users, category: 'utility', color: 'from-pink-500 to-purple-500' },
  { id: 'yes-no-node', name: 'Yes/No Node', description: 'Binary decision node with yes/no outputs', icon: Brain, category: 'utility', color: 'from-green-500 to-red-500' },
  { id: 'video-assembly', name: 'Video Assembly', description: 'Combine audio and images into final video', icon: Video, category: 'output', color: 'from-purple-500 to-pink-500' },
  { id: 'file-input-node', name: 'File Input Node', description: 'Upload and parse script files (.txt, .pdf) with dual outputs', icon: Upload, category: 'utility', color: 'from-cyan-500 to-blue-500' },
  { id: 'lora-training-node', name: 'LoRA Training Node', description: 'Train LoRA model on reference images for perfect subject consistency', icon: Brain, category: 'visual', color: 'from-indigo-500 to-purple-500' },
  { id: 'lora-node', name: 'LoRA Node', description: 'Apply trained LoRA model for subject injection/replacement', icon: Users, category: 'visual', color: 'from-purple-500 to-indigo-500' },
  { id: 'digivice-widget', name: 'Digivice Widget', description: 'Interactive virtual pet game widget with training and battles', icon: Zap, category: 'utility', color: 'from-amber-500 to-orange-500' },
];

export const categories = [
  { id: 'all', name: 'All' },
  { id: 'research', name: 'Research' },
  { id: 'content', name: 'Content' },
  { id: 'audio', name: 'Audio' },
  { id: 'video', name: 'Video' },
  { id: 'visual', name: 'Visual' },
  { id: 'processing', name: 'Processing' },
  { id: 'output', name: 'Output' },
  { id: 'utility', name: 'Utility' },
];