import React from 'react';
import { 
  Zap, Plus, FolderOpen, Star, TrendingUp, Clock, 
  Users, Brain, Sparkles, ArrowRight, Play, Eye, RotateCcw
} from 'lucide-react';

interface HomePageProps {
  onCreateNew: () => void;
  onOpenTemplates: () => void;
  onOpenSaved: () => void;
  recentWorkflows: any[];
  onLoadRecent: (workflow: any) => void;
}

export default function HomePage({ 
  onCreateNew, 
  onOpenTemplates, 
  onOpenSaved, 
  recentWorkflows, 
  onLoadRecent 
}: HomePageProps) {
  const featuredTemplates = [
    {
      id: 'simple-content-creation',
      name: 'Simple Content Creation',
      description: 'Perfect for beginners - research, script, voice, and images',
      icon: Play,
      color: 'from-green-500 to-emerald-500',
      difficulty: 1,
      time: '5-10 min'
    },
    {
      id: 'adaptive-learning-loop',
      name: 'Self-Improving AI',
      description: 'Advanced AI that learns from failures and improves',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      difficulty: 5,
      time: '30-60 min'
    },
    {
      id: 'viral-content-optimizer',
      name: 'Viral Content Optimizer',
      description: 'Maximize engagement and viral potential',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      difficulty: 4,
      time: '35-50 min'
    }
  ];

  const quickActions = [
    {
      title: 'Create New Workflow',
      description: 'Start from scratch with a blank canvas',
      icon: Plus,
      color: 'from-blue-500 to-cyan-500',
      action: onCreateNew
    },
    {
      title: 'Browse Templates',
      description: 'Choose from pre-built workflow templates',
      icon: Star,
      color: 'from-amber-500 to-orange-500',
      action: onOpenTemplates
    },
    {
      title: 'Load Saved Workflow',
      description: 'Continue working on a saved project',
      icon: FolderOpen,
      color: 'from-purple-500 to-indigo-500',
      action: onOpenSaved
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-purple-500/10" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Zap className="w-12 h-12 text-amber-400" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                VidForge
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Autonomous YouTube Content Creation Platform
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-4xl mx-auto">
              Build powerful, node-based workflows that automatically research, script, generate voices, 
              create visuals, and publish professional YouTube content with AI-powered quality control.
            </p>
            
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={onCreateNew}
                className="flex items-center space-x-2 px-8 py-4 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Create New Workflow</span>
              </button>
              <button
                onClick={onOpenSaved}
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-400 hover:to-pink-400 transition-all transform hover:scale-105"
              >
                <Brain className="w-5 h-5" />
                <span>Enhanced AI Workflow</span>
              </button>
              <button
                onClick={onOpenTemplates}
                className="flex items-center space-x-2 px-8 py-4 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                <Star className="w-5 h-5" />
                <span>Browse Templates</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all transform hover:scale-105 text-left"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${action.color} mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-amber-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {action.description}
                </p>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all mt-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Templates */}
      <div className="max-w-7xl mx-auto px-6 py-16 border-t border-white/10">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold">Featured Templates</h2>
          <button
            onClick={onOpenTemplates}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {featuredTemplates.map((template, index) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all transform hover:scale-105"
              >
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
                    <span className={`px-2 py-1 rounded-full ${
                      template.difficulty <= 2 ? 'bg-green-400/20 text-green-400' :
                      template.difficulty <= 3 ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-red-400/20 text-red-400'
                    }`}>
                      Difficulty {template.difficulty}/5
                    </span>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{template.time}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={onOpenTemplates}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg font-medium hover:from-amber-400 hover:to-orange-400 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Template</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Workflows */}
      {recentWorkflows.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold mb-12">Recent Workflows</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentWorkflows.slice(0, 4).map(workflow => (
              <button
                key={workflow.id}
                onClick={() => onLoadRecent(workflow)}
                className="group p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-left"
              >
                <h3 className="font-medium text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {workflow.name}
                </h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Modified {new Date(workflow.savedAt).toLocaleDateString()}</div>
                  <div>{workflow.nodes?.length || 0} nodes • {workflow.connections?.length || 0} connections</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div className="max-w-7xl mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Brain, title: 'AI-Powered', desc: 'Advanced AI for content generation and optimization' },
            { icon: RotateCcw, title: 'Self-Learning', desc: 'Workflows that improve from failures automatically' },
            { icon: Sparkles, title: 'Quality Control', desc: 'Built-in judgment nodes ensure high-quality output' },
            { icon: Users, title: 'Character Consistency', desc: 'Maintain visual character identity across content' }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 mb-4">
                  <Icon className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}