import React, { useState } from 'react';
import { X, Save, Eye, EyeOff, RefreshCw, Palette, Sliders, Sparkles, Zap } from 'lucide-react';

interface SettingsProps {
  isVisible: boolean;
  onClose: () => void;
  apiKeys: {
    openai: string;
    youtube: string;
    elevenlabs: string;
    hedra: string;
  };
  onApiKeysUpdate: (keys: any) => void;
  visualTheme: any;
  onVisualThemeUpdate: (theme: any) => void;
}

export default function Settings({ 
  isVisible, 
  onClose, 
  apiKeys, 
  onApiKeysUpdate,
  visualTheme,
  onVisualThemeUpdate
}: SettingsProps) {
  const [showKeys, setShowKeys] = useState({
    openai: false,
    youtube: false,
    elevenlabs: false,
    hedra: false
  });
  const [tempApiKeys, setTempApiKeys] = useState(apiKeys);
  const [tempVisualTheme, setTempVisualTheme] = useState(visualTheme);

  const handleSave = () => {
    onApiKeysUpdate(tempApiKeys);
    onVisualThemeUpdate(tempVisualTheme);
    onClose();
  };

  const handleReset = () => {
    setTempApiKeys(apiKeys);
    setTempVisualTheme(visualTheme);
  };

  const resetVisualTheme = () => {
    const defaultTheme = {
      nodeStyle: 'glass',
      nodeOpacity: 0.8,
      glassBlur: 16,
      glassBorder: 0.1,
      glassReflection: 0.05,
      borderRadius: 16,
      refractionStrength: 0.3,
      glowIntensity: 0.2,
      shadowDepth: 0.6,
      crystalFacets: false,
      prismEffect: false,
      iridescence: false,
      holographicShift: false,
      background: 'default',
      gridPattern: 'dots',
      animations: {
        enabled: true,
        hoverLift: true,
        pulseOnExecution: true,
        connectionFlow: true,
        particleTrails: false,
        breathingEffect: false,
        morphingShapes: false
      }
    };
    setTempVisualTheme(defaultTheme);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateApiKey = (key: string, value: string) => {
    setTempApiKeys(prev => ({ ...prev, [key]: value }));
  };

  const updateVisualTheme = (key: string, value: any) => {
    setTempVisualTheme(prev => ({ ...prev, [key]: value }));
  };

  const updateAnimationSetting = (key: string, value: boolean) => {
    setTempVisualTheme(prev => ({
      ...prev,
      animations: { ...prev.animations, [key]: value }
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-400 hover:bg-gray-500/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 h-full">
            {/* Left Column - API Keys */}
            <div className="p-6 border-r border-white/10 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-amber-400" />
                API Configuration
              </h3>
              
              <div className="space-y-6">
                {/* OpenAI */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OpenAI API Key
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys.openai ? 'text' : 'password'}
                      value={tempApiKeys.openai}
                      onChange={(e) => updateApiKey('openai', e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
                    />
                    <button
                      onClick={() => toggleKeyVisibility('openai')}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white"
                    >
                      {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Required for AI content generation and analysis</p>
                </div>

                {/* ElevenLabs */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ElevenLabs API Key
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys.elevenlabs ? 'text' : 'password'}
                      value={tempApiKeys.elevenlabs}
                      onChange={(e) => updateApiKey('elevenlabs', e.target.value)}
                      placeholder="sk_..."
                      className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
                    />
                    <button
                      onClick={() => toggleKeyVisibility('elevenlabs')}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white"
                    >
                      {showKeys.elevenlabs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Required for text-to-speech voice generation</p>
                </div>

                {/* YouTube */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">YouTube API Key</label>
                  <div className="relative">
                    <input
                      type={showKeys.youtube ? 'text' : 'password'}
                      value={tempApiKeys.youtube}
                      onChange={(e) => updateApiKey('youtube', e.target.value)}
                      placeholder="AIza..."
                      className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
                    />
                    <button
                      onClick={() => toggleKeyVisibility('youtube')}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white"
                    >
                      {showKeys.youtube ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Optional - for real trend data (uses mock data if not provided)</p>
                </div>

                {/* Hedra */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hedra API Key</label>
                  <div className="relative">
                    <input
                      type={showKeys.hedra ? 'text' : 'password'}
                      value={tempApiKeys.hedra}
                      onChange={(e) => updateApiKey('hedra', e.target.value)}
                      placeholder="hdr_..."
                      className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
                    />
                    <button
                      onClick={() => toggleKeyVisibility('hedra')}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white"
                    >
                      {showKeys.hedra ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Optional - for character animation (Character 3)</p>
                </div>

                {/* API Status */}
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-3">API Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">OpenAI:</span>
                      <span className={tempApiKeys.openai ? 'text-green-400' : 'text-red-400'}>
                        {tempApiKeys.openai ? 'Configured' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ElevenLabs:</span>
                      <span className={tempApiKeys.elevenlabs ? 'text-green-400' : 'text-red-400'}>
                        {tempApiKeys.elevenlabs ? 'Configured' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">YouTube:</span>
                      <span className={tempApiKeys.youtube ? 'text-green-400' : 'text-yellow-400'}>
                        {tempApiKeys.youtube ? 'Configured' : 'Optional'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hedra:</span>
                      <span className={tempApiKeys.hedra ? 'text-green-400' : 'text-yellow-400'}>
                        {tempApiKeys.hedra ? 'Configured' : 'Optional'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Theme */}
            <div className="p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-purple-400" />
                Visual Customization
              </h3>
              
              <div className="space-y-6">
                {/* Node Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Node Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'glass', label: 'Glass', desc: 'Classic glass effect' },
                      { value: 'crystal', label: 'Crystal', desc: 'Faceted crystal look' },
                      { value: 'frosted', label: 'Frosted', desc: 'Frosted glass finish' },
                      { value: 'liquid', label: 'Liquid', desc: 'Flowing liquid glass' },
                      { value: 'holographic', label: 'Holographic', desc: 'Rainbow hologram' },
                      { value: 'prism', label: 'Prism', desc: 'Light-splitting prism' },
                      { value: 'minimal', label: 'Minimal', desc: 'Clean minimal style' },
                      { value: 'solid', label: 'Solid', desc: 'Solid background' }
                    ].map(style => (
                      <button
                        key={style.value}
                        onClick={() => updateVisualTheme('nodeStyle', style.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          tempVisualTheme.nodeStyle === style.value
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-medium text-sm">{style.label}</div>
                        <div className="text-xs text-gray-400">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Glass Effects */}
                <div className="space-y-4">
                  <h4 className="font-medium text-purple-400 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Glass & Crystal Effects
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Glass Blur: {tempVisualTheme.glassBlur}px
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="80"
                        step="4"
                        value={tempVisualTheme.glassBlur}
                        onChange={(e) => updateVisualTheme('glassBlur', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Border Intensity: {Math.round(tempVisualTheme.glassBorder * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.02"
                        max="0.3"
                        step="0.02"
                        value={tempVisualTheme.glassBorder}
                        onChange={(e) => updateVisualTheme('glassBorder', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Reflection: {Math.round(tempVisualTheme.glassReflection * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="0.2"
                        step="0.01"
                        value={tempVisualTheme.glassReflection}
                        onChange={(e) => updateVisualTheme('glassReflection', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Border Radius: {tempVisualTheme.borderRadius}px
                      </label>
                      <input
                        type="range"
                        min="4"
                        max="32"
                        step="2"
                        value={tempVisualTheme.borderRadius}
                        onChange={(e) => updateVisualTheme('borderRadius', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Glow Intensity: {Math.round(tempVisualTheme.glowIntensity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={tempVisualTheme.glowIntensity}
                        onChange={(e) => updateVisualTheme('glowIntensity', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Shadow Depth: {Math.round(tempVisualTheme.shadowDepth * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={tempVisualTheme.shadowDepth}
                        onChange={(e) => updateVisualTheme('shadowDepth', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Crystal Effects Toggles */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tempVisualTheme.crystalFacets}
                        onChange={(e) => updateVisualTheme('crystalFacets', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">Crystal Facets</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tempVisualTheme.prismEffect}
                        onChange={(e) => updateVisualTheme('prismEffect', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">Prism Effect</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tempVisualTheme.iridescence}
                        onChange={(e) => updateVisualTheme('iridescence', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">Iridescence</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tempVisualTheme.holographicShift}
                        onChange={(e) => updateVisualTheme('holographicShift', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">Holographic Shift</span>
                    </label>
                  </div>
                </div>

                {/* Background & Grid */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-400">Background & Grid</h4>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Background Style</label>
                    <select
                      value={tempVisualTheme.background}
                      onChange={(e) => updateVisualTheme('background', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
                    >
                      <option value="default">Default Gradient</option>
                      <option value="dark">Pure Dark</option>
                      <option value="blue">Blue Crystal</option>
                      <option value="purple">Purple Amethyst</option>
                      <option value="green">Green Emerald</option>
                      <option value="aurora">Aurora Borealis</option>
                      <option value="prism">Prismatic</option>
                      <option value="pattern">Geometric Pattern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Grid Pattern</label>
                    <select
                      value={tempVisualTheme.gridPattern}
                      onChange={(e) => updateVisualTheme('gridPattern', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
                    >
                      <option value="dots">Dots</option>
                      <option value="lines">Lines</option>
                      <option value="large-dots">Large Dots</option>
                      <option value="hexagon">Hexagonal</option>
                      <option value="diamond">Diamond</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>

                {/* Animations */}
                <div className="space-y-4">
                  <h4 className="font-medium text-green-400 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Animations & Effects
                  </h4>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tempVisualTheme.animations.enabled}
                      onChange={(e) => updateAnimationSetting('enabled', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300 font-medium">Enable Animations</span>
                  </label>

                  {tempVisualTheme.animations.enabled && (
                    <div className="grid grid-cols-1 gap-2 ml-6">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tempVisualTheme.animations.hoverLift}
                          onChange={(e) => updateAnimationSetting('hoverLift', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-300">Hover Lift Effect</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tempVisualTheme.animations.pulseOnExecution}
                          onChange={(e) => updateAnimationSetting('pulseOnExecution', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-300">Pulse on Execution</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tempVisualTheme.animations.connectionFlow}
                          onChange={(e) => updateAnimationSetting('connectionFlow', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-300">Connection Flow</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tempVisualTheme.animations.particleTrails}
                          onChange={(e) => updateAnimationSetting('particleTrails', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-300">Particle Trails</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tempVisualTheme.animations.breathingEffect}
                          onChange={(e) => updateAnimationSetting('breathingEffect', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-300">Breathing Effect</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tempVisualTheme.animations.morphingShapes}
                          onChange={(e) => updateAnimationSetting('morphingShapes', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-300">Morphing Shapes</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Theme Reset */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={resetVisualTheme}
                    className="w-full px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors"
                  >
                    Reset Visual Theme to Defaults
                  </button>
                </div>

                {/* Live Preview */}
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-3">Live Preview</h4>
                  <div
                    className="w-full h-20 rounded-lg border transition-all duration-300"
                    style={{
                      background: tempVisualTheme.nodeStyle === 'glass' 
                        ? `rgba(255, 255, 255, ${tempVisualTheme.nodeOpacity * 0.08})`
                        : tempVisualTheme.nodeStyle === 'crystal'
                        ? `rgba(255, 255, 255, ${tempVisualTheme.nodeOpacity * 0.12})`
                        : `rgba(255, 255, 255, ${tempVisualTheme.nodeOpacity * 0.1})`,
                      backdropFilter: `blur(${tempVisualTheme.glassBlur}px)`,
                      border: `1px solid rgba(255, 255, 255, ${tempVisualTheme.glassBorder})`,
                      borderRadius: `${tempVisualTheme.borderRadius}px`,
                      boxShadow: `
                        0 ${Math.round(tempVisualTheme.shadowDepth * 20)}px ${Math.round(tempVisualTheme.shadowDepth * 80)}px rgba(0, 0, 0, ${tempVisualTheme.shadowDepth * 0.9}),
                        inset 0 1px 0 rgba(255, 255, 255, ${tempVisualTheme.glassReflection}),
                        ${tempVisualTheme.glowIntensity > 0 ? `0 0 ${Math.round(tempVisualTheme.glowIntensity * 40)}px rgba(245, 158, 11, ${tempVisualTheme.glowIntensity * 0.3})` : ''}
                      `.trim(),
                      clipPath: tempVisualTheme.crystalFacets ? 'polygon(0% 15%, 15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%)' : undefined,
                      animation: tempVisualTheme.animations.breathingEffect ? 'breathe 4s ease-in-out infinite' : undefined
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div className="text-sm text-white/80">Preview Node Style</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}