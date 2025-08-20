// VidForge - Digivice Audio System
export class DigiviceAudio {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private currentMusic: AudioBufferSourceNode | null = null;
  private volume: number = 0.7;
  private muted: boolean = false;

  async initialize() {
    try {
      this.audioContext = new AudioContext();
      
      // Create gain nodes for volume control
      this.musicGainNode = this.audioContext.createGain();
      this.sfxGainNode = this.audioContext.createGain();
      
      this.musicGainNode.connect(this.audioContext.destination);
      this.sfxGainNode.connect(this.audioContext.destination);
      
      // Load sound effects
      await this.loadSoundEffects();
      
      // Start background music
      this.startBackgroundMusic();
      
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  private async loadSoundEffects() {
    if (!this.audioContext) return;

    const soundEffects = {
      beep: this.generateTone(440, 0.1, 'sine'),
      select: this.generateTone(880, 0.05, 'sine'),
      success: this.generateChord([440, 554, 659], 0.3),
      fail: this.generateTone(220, 0.2, 'sawtooth'),
      evolve: this.generateEvolutionFanfare(),
      battle_start: this.generateBattleTheme(),
      victory: this.generateVictoryFanfare(),
      care: this.generateTone(660, 0.15, 'sine'),
      feed: this.generateTone(523, 0.1, 'triangle'),
      clean: this.generateTone(784, 0.12, 'sine'),
      sleep: this.generateSleepMelody(),
      wake: this.generateWakeMelody(),
      level_up: this.generateLevelUpSound(),
      error: this.generateTone(150, 0.3, 'sawtooth')
    };

    for (const [name, audioData] of Object.entries(soundEffects)) {
      try {
        const buffer = await this.audioContext.decodeAudioData(audioData);
        this.sounds.set(name, buffer);
      } catch (error) {
        console.warn(`Failed to load sound ${name}:`, error);
      }
    }
  }

  private generateTone(frequency: number, duration: number, waveType: OscillatorType = 'sine'): ArrayBuffer {
    if (!this.audioContext) return new ArrayBuffer(0);
    
    const sampleRate = this.audioContext.sampleRate;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 4);
    const view = new Float32Array(buffer);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      switch (waveType) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
      }
      
      // Apply envelope
      const envelope = Math.exp(-t * 3);
      view[i] = sample * 0.3 * envelope;
    }
    
    return buffer;
  }

  private generateChord(frequencies: number[], duration: number): ArrayBuffer {
    if (!this.audioContext) return new ArrayBuffer(0);
    
    const sampleRate = this.audioContext.sampleRate;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 4);
    const view = new Float32Array(buffer);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      frequencies.forEach(freq => {
        sample += Math.sin(2 * Math.PI * freq * t) / frequencies.length;
      });
      
      const envelope = Math.exp(-t * 2);
      view[i] = sample * 0.3 * envelope;
    }
    
    return buffer;
  }

  private generateEvolutionFanfare(): ArrayBuffer {
    if (!this.audioContext) return new ArrayBuffer(0);
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.0;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 4);
    const view = new Float32Array(buffer);
    
    // Evolution melody: ascending notes with harmony
    const melody = [440, 554, 659, 880, 1108, 1318];
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      melody.forEach((freq, index) => {
        const noteStart = (index / melody.length) * duration;
        const noteEnd = noteStart + 0.4;
        
        if (t >= noteStart && t <= noteEnd) {
          const noteT = t - noteStart;
          const envelope = Math.exp(-noteT * 2) * Math.sin(noteT * Math.PI / 0.4);
          sample += Math.sin(2 * Math.PI * freq * noteT) * envelope * 0.2;
          
          // Add harmony
          sample += Math.sin(2 * Math.PI * freq * 1.5 * noteT) * envelope * 0.1;
        }
      });
      
      view[i] = Math.max(-1, Math.min(1, sample));
    }
    
    return buffer;
  }

  private generateBattleTheme(): ArrayBuffer {
    // Energetic battle start sound
    return this.generateChord([330, 415, 523, 659], 0.8);
  }

  private generateVictoryFanfare(): ArrayBuffer {
    // Victory celebration sound
    return this.generateChord([523, 659, 784, 1047], 1.2);
  }

  private generateSleepMelody(): ArrayBuffer {
    // Gentle lullaby
    const frequencies = [440, 392, 349, 330];
    return this.generateChord(frequencies, 1.5);
  }

  private generateWakeMelody(): ArrayBuffer {
    // Cheerful wake-up sound
    const frequencies = [523, 659, 784];
    return this.generateChord(frequencies, 0.6);
  }

  private generateLevelUpSound(): ArrayBuffer {
    // Level up celebration
    return this.generateChord([659, 784, 988, 1175], 0.8);
  }

  private startBackgroundMusic() {
    if (!this.audioContext || !this.musicGainNode) return;
    
    // Generate simple background music loop
    const musicBuffer = this.generateBackgroundLoop();
    
    this.audioContext.decodeAudioData(musicBuffer).then(buffer => {
      this.sounds.set('bg_music', buffer);
      this.playBackgroundMusic();
    }).catch(error => {
      console.warn('Failed to load background music:', error);
    });
  }

  private generateBackgroundLoop(): ArrayBuffer {
    if (!this.audioContext) return new ArrayBuffer(0);
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 8.0; // 8-second loop
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 4);
    const view = new Float32Array(buffer);
    
    // Simple ambient melody
    const notes = [
      { freq: 220, start: 0, duration: 1 },
      { freq: 247, start: 1, duration: 1 },
      { freq: 277, start: 2, duration: 1 },
      { freq: 294, start: 3, duration: 1 },
      { freq: 330, start: 4, duration: 1 },
      { freq: 277, start: 5, duration: 1 },
      { freq: 247, start: 6, duration: 1 },
      { freq: 220, start: 7, duration: 1 }
    ];
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      notes.forEach(note => {
        if (t >= note.start && t < note.start + note.duration) {
          const noteT = t - note.start;
          const envelope = Math.sin(noteT * Math.PI / note.duration) * 0.1;
          sample += Math.sin(2 * Math.PI * note.freq * noteT) * envelope;
        }
      });
      
      view[i] = sample;
    }
    
    return buffer;
  }

  private playBackgroundMusic() {
    if (!this.audioContext || !this.musicGainNode || this.muted) return;
    
    const buffer = this.sounds.get('bg_music');
    if (!buffer) return;
    
    if (this.currentMusic) {
      this.currentMusic.stop();
    }
    
    this.currentMusic = this.audioContext.createBufferSource();
    this.currentMusic.buffer = buffer;
    this.currentMusic.loop = true;
    this.currentMusic.connect(this.musicGainNode);
    
    this.musicGainNode.gain.value = this.volume * 0.3; // Background music quieter
    this.currentMusic.start();
  }

  playSound(soundName: string) {
    if (this.muted || !this.audioContext || !this.sfxGainNode || !this.sounds.has(soundName)) {
      return;
    }

    try {
      const buffer = this.sounds.get(soundName)!;
      const source = this.audioContext.createBufferSource();
      
      source.buffer = buffer;
      source.connect(this.sfxGainNode);
      
      this.sfxGainNode.gain.value = this.volume;
      source.start();
    } catch (error) {
      console.warn(`Failed to play sound ${soundName}:`, error);
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.volume * 0.3;
    }
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.volume;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    
    if (muted) {
      if (this.currentMusic) {
        this.currentMusic.stop();
        this.currentMusic = null;
      }
    } else {
      this.playBackgroundMusic();
    }
  }

  cleanup() {
    if (this.currentMusic) {
      this.currentMusic.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}