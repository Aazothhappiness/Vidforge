import React from 'react';
import { Zap, Play, Save, Settings, Download, Upload, FolderOpen } from 'lucide-react';

interface HeaderProps {
  onStartWorkflow: () => void;
  onSave: () => void;
  onLoad: (workflowData?: any) => void;
  onNewWorkflow: () => void;
  onGoHome: () => void;
  onOpenSettings: () => void;
}

export default function Header({ onStartWorkflow, onSave, onLoad, onNewWorkflow, onGoHome, onOpenSettings }: HeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 glass-strong border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={onGoHome}
              className="flex items-center space-x-2 hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <Zap className="w-8 h-8 text-amber-400" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              VidForge
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            Autonomous YouTube Content Creation
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onStartWorkflow}
            className="btn-glass px-4 py-2 rounded-lg flex items-center space-x-2"
            title="Start Workflow"
          >
            <Play className="w-4 h-4" />
            <span>Start Workflow</span>
          </button>
          
          <div className="flex items-center space-x-2 border-l border-white/10 pl-4">
            <button 
              onClick={onNewWorkflow}
              className="btn-glass px-3 py-2 rounded-lg flex items-center space-x-2"
              title="New Workflow"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button 
              onClick={() => document.getElementById('workflow-upload')?.click()}
              className="btn-glass px-3 py-2 rounded-lg flex items-center space-x-2"
              title="Import Workflow"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const workflowData = JSON.parse(event.target?.result as string);
                      console.log('Parsed workflow data:', workflowData);
                      onLoad(workflowData);
                    } catch (error) {
                      console.error('Failed to parse workflow file:', error);
                      alert('Invalid workflow file format');
                    }
                  };
                  reader.readAsText(file);
                }
                // Reset input value to allow selecting the same file again
                e.target.value = '';
              }}
              className="hidden"
              id="workflow-upload"
            />
            <button 
              onClick={onSave}
              className="btn-glass px-3 py-2 rounded-lg flex items-center space-x-2"
              title="Export Workflow"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={onOpenSettings}
            className="btn-glass px-4 py-2 rounded-lg flex items-center space-x-2"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}