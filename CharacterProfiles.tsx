// VidForge - Character Profiles management component
import React, { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, Upload, Save, X, Mic, Image as ImageIcon } from 'lucide-react';

interface CharacterProfile {
  id: string;
  displayName: string;
  voiceProvider: string;
  voiceId?: string;
  ttsDefaults: {
    stability: number;
    style: number;
    similarityBoost: number;
    useSpeakerBoost: boolean;
  };
  subjectSeed: number;
  visualDescriptor: string;
  referenceImages: Array<{
    filename: string;
    originalName: string;
    url: string;
    uploadedAt: number;
  }>;
  negativePrompts: string[];
  styleNotes: string;
  createdAt: number;
  updatedAt: number;
}

interface CharacterProfilesProps {
  isVisible: boolean;
  onClose: () => void;
  onProfileSelect: (profile: CharacterProfile | null) => void;
  selectedProfileId?: string;
}

export default function CharacterProfiles({ 
  isVisible, 
  onClose, 
  onProfileSelect, 
  selectedProfileId 
}: CharacterProfilesProps) {
  const [profiles, setProfiles] = useState<CharacterProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<CharacterProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      fetchProfiles();
    }
  }, [isVisible]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/characters/profiles');
      const data = await response.json();
      
      if (data.ok) {
        setProfiles(data.profiles);
      } else {
        console.error('Failed to fetch profiles:', data.error);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Partial<CharacterProfile>) => {
    try {
      const response = await fetch('/api/characters/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setProfiles(prev => [...prev, data.profile]);
        setIsCreating(false);
        return data.profile;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const updateProfile = async (id: string, updates: Partial<CharacterProfile>) => {
    try {
      const response = await fetch(`/api/characters/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setProfiles(prev => prev.map(p => p.id === id ? data.profile : p));
        setEditingProfile(null);
        return data.profile;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this character profile?')) {
      return;
    }

    try {
      const response = await fetch(`/api/characters/profiles/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setProfiles(prev => prev.filter(p => p.id !== id));
        if (selectedProfileId === id) {
          onProfileSelect(null);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const uploadImages = async (profileId: string, files: FileList) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/characters/profiles/${profileId}/images`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setProfiles(prev => prev.map(p => 
          p.id === profileId ? data.profile : p
        ));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-semibold text-white">Character Profiles</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Profile</span>
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
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading profiles...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto">
              {profiles.map(profile => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  isSelected={selectedProfileId === profile.id}
                  onSelect={() => onProfileSelect(profile)}
                  onEdit={() => setEditingProfile(profile)}
                  onDelete={() => deleteProfile(profile.id)}
                  onUploadImages={(files) => uploadImages(profile.id, files)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(isCreating || editingProfile) && (
          <ProfileEditor
            profile={editingProfile}
            onSave={async (data) => {
              if (editingProfile) {
                await updateProfile(editingProfile.id, data);
              } else {
                await createProfile(data);
              }
            }}
            onCancel={() => {
              setIsCreating(false);
              setEditingProfile(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function ProfileCard({ 
  profile, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onUploadImages 
}: {
  profile: CharacterProfile;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUploadImages: (files: FileList) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={`p-4 rounded-lg border transition-all cursor-pointer ${
      isSelected 
        ? 'bg-amber-500/20 border-amber-500/50 ring-2 ring-amber-500/30' 
        : 'bg-white/5 border-white/10 hover:bg-white/10'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">{profile.displayName}</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="p-1 text-gray-400 hover:text-white"
            title="Upload reference images"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-gray-400 hover:text-white"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm" onClick={onSelect}>
        <div className="flex items-center space-x-2">
          <Mic className="w-4 h-4 text-orange-400" />
          <span className="text-gray-300">
            {profile.voiceId ? `Voice: ${profile.voiceId.substring(0, 8)}...` : 'No voice set'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300">
            {profile.referenceImages.length} reference images
          </span>
        </div>

        {profile.visualDescriptor && (
          <div className="text-xs text-gray-400 bg-black/20 p-2 rounded">
            {profile.visualDescriptor.substring(0, 100)}...
          </div>
        )}

        {/* Reference images preview */}
        {profile.referenceImages.length > 0 && (
          <div className="grid grid-cols-3 gap-1 mt-2">
            {profile.referenceImages.slice(0, 3).map((img, index) => (
              <img
                key={index}
                src={img.url}
                alt={`Reference ${index + 1}`}
                className="w-full h-12 object-cover rounded border border-white/10"
              />
            ))}
            {profile.referenceImages.length > 3 && (
              <div className="w-full h-12 bg-black/40 rounded border border-white/10 flex items-center justify-center text-xs text-gray-400">
                +{profile.referenceImages.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          if (e.target.files) {
            onUploadImages(e.target.files);
          }
        }}
        className="hidden"
      />
    </div>
  );
}

function ProfileEditor({ 
  profile, 
  onSave, 
  onCancel 
}: {
  profile: CharacterProfile | null;
  onSave: (data: Partial<CharacterProfile>) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    voiceProvider: profile?.voiceProvider || 'elevenlabs',
    voiceId: profile?.voiceId || '',
    visualDescriptor: profile?.visualDescriptor || '',
    styleNotes: profile?.styleNotes || '',
    ttsDefaults: {
      stability: profile?.ttsDefaults.stability || 0.5,
      style: profile?.ttsDefaults.style || 0.3,
      similarityBoost: profile?.ttsDefaults.similarityBoost || 0.8,
      useSpeakerBoost: profile?.ttsDefaults.useSpeakerBoost || true
    },
    negativePrompts: profile?.negativePrompts || []
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      alert('Display name is required');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      alert(`Failed to save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center">
      <div className="bg-slate-800 rounded-xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            {profile ? 'Edit Character Profile' : 'Create Character Profile'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-amber-400">Basic Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., Dr. Sarah Chen"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Visual Description</label>
              <textarea
                value={formData.visualDescriptor}
                onChange={(e) => setFormData(prev => ({ ...prev, visualDescriptor: e.target.value }))}
                placeholder="Detailed description of the character's appearance..."
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Style Notes</label>
              <textarea
                value={formData.styleNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, styleNotes: e.target.value }))}
                placeholder="Speaking style, personality traits, catchphrases..."
                rows={2}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-amber-400">Voice Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice Provider</label>
                <select
                  value={formData.voiceProvider}
                  onChange={(e) => setFormData(prev => ({ ...prev, voiceProvider: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
                >
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="openai">OpenAI TTS</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID</label>
                <input
                  type="text"
                  value={formData.voiceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, voiceId: e.target.value }))}
                  placeholder="21m00Tcm4TlvDq8ikWAM"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stability: {formData.ttsDefaults.stability}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.ttsDefaults.stability}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ttsDefaults: { ...prev.ttsDefaults, stability: parseFloat(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Style: {formData.ttsDefaults.style}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.ttsDefaults.style}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ttsDefaults: { ...prev.ttsDefaults, style: parseFloat(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.ttsDefaults.useSpeakerBoost}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ttsDefaults: { ...prev.ttsDefaults, useSpeakerBoost: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Use Speaker Boost</span>
              </label>
            </div>
          </div>

          {/* Reference Images */}
          {profile && profile.referenceImages.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-amber-400">Reference Images</h4>
              <div className="grid grid-cols-4 gap-2">
                {profile.referenceImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img.url}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-white/10"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-1 rounded-b">
                      {img.originalName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-white/10">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.displayName.trim()}
            className="px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}