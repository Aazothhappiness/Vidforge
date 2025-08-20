// VidForge - Complete Digivice Widget Core Engine
export type Stage = "Fresh" | "InTraining" | "Rookie" | "Champion" | "Ultimate" | "Mega";
export type Attribute = "Vaccine" | "Data" | "Virus" | "Free";

export interface EvolutionCondition {
  to: string;
  minStage?: Stage;
  minBattlesWon?: number;
  maxCareMistakes?: number;
  minBond?: number;
  minWeight?: number;
  maxWeight?: number;
  itemsRequired?: string[];
  timeOfDay?: "Day" | "Night" | "Any";
  statReq?: Partial<Record<"ATK" | "DEF" | "SPD" | "INT" | "STA" | "LUK", number>>;
}

export interface SpriteSheet {
  image: string;
  frameW: number;
  frameH: number;
  animations: Record<string, number[]>;
  palette?: string[];
}

export interface Monster {
  id: string;
  name: string;
  stage: Stage;
  attribute: Attribute;
  families: string[];
  baseStats: Record<"HP" | "ATK" | "DEF" | "SPD" | "INT" | "STA" | "LUK", number>;
  moves: string[];
  sprites: {
    idle: SpriteSheet;
    walk?: SpriteSheet;
    attack?: SpriteSheet;
    hit?: SpriteSheet;
    faint?: SpriteSheet;
  };
  evolutions: EvolutionCondition[];
  flavor?: string;
}

export interface Move {
  id: string;
  name: string;
  kind: "Physical" | "Tech" | "Support";
  power: number;
  accuracy: number;
  staminaCost: number;
  effect?: {
    status?: "Burn" | "Shock" | "Poison" | "Bleed" | "Slow" | "BoostATK" | "GuardUp" | "Heal";
    chance?: number;
    magnitude?: number;
    duration?: number;
  };
  animation: string;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  kind: "Food" | "Vitamin" | "Care" | "Chip" | "Key";
  effects: Partial<{
    hunger: number;
    energy: number;
    hygiene: number;
    weight: number;
    bond: number;
    statBoost: Partial<Monster["baseStats"]>;
    evolveFlag: string;
    cureStatus: string;
  }>;
}

export interface WidgetOptions {
  shell?: "brick" | "oval" | "round" | "neon";
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    bezel: string;
  };
  difficulty?: "Casual" | "Normal" | "Hard";
  autoSaveIntervalMs?: number;
  speed?: 0.5 | 1 | 2 | 4 | 8;
  contentPacks?: string[];
  startWith?: {
    monsterId?: string;
    stage?: Stage;
  };
  rules?: {
    poopEnabled?: boolean;
    careMistakeStrict?: boolean;
    deathEnabled?: boolean;
    staminaRegenRate?: number;
    evolutionWindowsFlexible?: boolean;
  };
  features?: {
    exploration?: boolean;
    linkPlay?: boolean;
    events?: boolean;
  };
  audio?: {
    muted?: boolean;
    volume?: number;
  };
  debug?: boolean;
}

export interface DigiviceController {
  pause(): void;
  resume(): void;
  setSpeed(mult: 0.5 | 1 | 2 | 4 | 8): void;
  getState(): any;
  exportSave(): string;
  importSave(json: string): Promise<void>;
  startBattle(opponent?: "random" | Monster): void;
  openMenu(id: "care" | "train" | "battle" | "explore" | "items" | "stats" | "evo" | "link" | "settings"): void;
  on(event: string, cb: (...args: any[]) => void): () => void;
  unmount(): void;
}

class DigiviceEngine implements DigiviceController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: WidgetOptions;
  private gameState: any;
  private animationFrame: number = 0;
  private lastTime: number = 0;
  private isPaused: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private currentMonster: Monster | null = null;
  private currentFrame: number = 0;
  private currentMenu: string = 'home';
  private careNeeds: any = {};
  private sprites: Map<string, HTMLImageElement> = new Map();
  private menuSelection: number = 0;
  private isInMenu: boolean = false;
  private buttonStates: { left: boolean; ok: boolean; right: boolean } = { left: false, ok: false, right: false };
  private lastCareUpdate: number = 0;
  private notifications: Array<{ message: string; time: number; type: string }> = [];
  private backgroundMusic: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;

  constructor(canvas: HTMLCanvasElement, options: WidgetOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.options = {
      shell: 'round',
      difficulty: 'Normal',
      speed: 1,
      audio: { muted: false, volume: 0.7 },
      rules: { poopEnabled: true, deathEnabled: false },
      features: { exploration: true, linkPlay: true, events: true },
      ...options
    };

    this.initializeGame();
    this.setupCanvas();
    this.loadAssets();
    this.setupInput();
    this.startGameLoop();
  }

  private initializeGame() {
    this.gameState = {
      currentMonster: this.getStarterMonster(),
      careNeeds: {
        hunger: 100,
        energy: 100,
        hygiene: 100,
        mood: 100,
        weight: 50,
        bond: 0
      },
      stats: {
        battlesWon: 0,
        careMistakes: 0,
        evolutionStage: 'InTraining',
        daysSurvived: 0,
        trainingCount: 0
      },
      time: {
        gameTime: Date.now(),
        dayNightCycle: 'Day',
        lastCareTime: Date.now(),
        sleepTime: null,
        wakeTime: null
      },
      inventory: [
        { id: 'meat', name: 'Meat', count: 5 },
        { id: 'vitamin', name: 'Vitamin', count: 3 },
        { id: 'soap', name: 'Soap', count: 2 }
      ],
      battle: {
        inBattle: false,
        opponent: null,
        turn: 0,
        playerHP: 100,
        opponentHP: 100
      }
    };

    this.currentMonster = this.gameState.currentMonster;
    this.careNeeds = this.gameState.careNeeds;
    this.lastCareUpdate = Date.now();
  }

  private getStarterMonster(): Monster {
    return {
      id: 'koromon',
      name: 'Koromon',
      stage: 'InTraining',
      attribute: 'Free',
      families: ['NatureSpirits'],
      baseStats: {
        HP: 50,
        ATK: 10,
        DEF: 10,
        SPD: 15,
        INT: 8,
        STA: 30,
        LUK: 5
      },
      moves: ['tackle', 'bubble'],
      sprites: {
        idle: {
          image: this.generatePixelSprite('koromon', '#FFB6C1'),
          frameW: 32,
          frameH: 32,
          animations: { idle: [0, 1, 2, 1] }
        }
      },
      evolutions: [
        {
          to: 'agumon',
          minStage: 'InTraining',
          minBattlesWon: 3,
          maxCareMistakes: 5,
          minBond: 50
        }
      ],
      flavor: 'A small, pink creature with big eyes and a friendly demeanor.'
    };
  }

  private generatePixelSprite(monsterId: string, primaryColor: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    const colors = {
      primary: primaryColor,
      secondary: this.adjustColor(primaryColor, -30),
      accent: this.adjustColor(primaryColor, 50),
      shadow: '#000000',
      highlight: '#FFFFFF'
    };

    // Generate 4 frames of animation
    for (let frame = 0; frame < 4; frame++) {
      const x = frame * 32;
      const bounce = Math.sin(frame * Math.PI / 2) * 2;
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x + 10, 26, 12, 4);
      
      // Body
      ctx.fillStyle = colors.primary;
      ctx.fillRect(x + 8, 16 - bounce, 16, 12);
      
      // Body highlight
      ctx.fillStyle = colors.accent;
      ctx.fillRect(x + 9, 17 - bounce, 6, 4);
      
      // Eyes
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(x + 12, 18 - bounce, 2, 2);
      ctx.fillRect(x + 18, 18 - bounce, 2, 2);
      
      // Eye highlights
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(x + 12, 18 - bounce, 1, 1);
      ctx.fillRect(x + 18, 18 - bounce, 1, 1);
      
      // Mouth
      ctx.fillStyle = colors.shadow;
      ctx.fillRect(x + 14, 22 - bounce, 4, 1);
      
      // Special features based on monster type
      if (monsterId.includes('dragon') || monsterId.includes('greymon')) {
        // Horn
        ctx.fillStyle = colors.highlight;
        ctx.fillRect(x + 15, 14 - bounce, 2, 4);
      }
      
      if (monsterId.includes('plant') || monsterId.includes('palmon')) {
        // Flower/leaf
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(x + 14, 12 - bounce, 4, 2);
        ctx.fillRect(x + 15, 11 - bounce, 2, 1);
      }
      
      if (monsterId.includes('wolf') || monsterId.includes('gabu')) {
        // Ears
        ctx.fillStyle = colors.primary;
        ctx.fillRect(x + 10, 14 - bounce, 2, 3);
        ctx.fillRect(x + 20, 14 - bounce, 2, 3);
      }
    }

    return canvas.toDataURL();
  }

  private adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size for crisp pixel art
    this.canvas.width = 480 * dpr;
    this.canvas.height = 480 * dpr;
    this.canvas.style.width = '480px';
    this.canvas.style.height = '480px';
    
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.scale(dpr, dpr);
  }

  private async loadAssets() {
    // Initialize audio
    if (!this.options.audio?.muted) {
      try {
        this.audioContext = new AudioContext();
        await this.loadSounds();
        this.startBackgroundMusic();
      } catch (error) {
        console.warn('Audio initialization failed:', error);
      }
    }

    // Load sprites
    await this.loadSprites();
  }

  private async loadSounds() {
    if (!this.audioContext) return;

    // Create gain nodes
    this.musicGainNode = this.audioContext.createGain();
    this.sfxGainNode = this.audioContext.createGain();
    
    this.musicGainNode.connect(this.audioContext.destination);
    this.sfxGainNode.connect(this.audioContext.destination);

    const soundEffects = {
      beep: this.generateBeep(440, 0.1),
      select: this.generateBeep(880, 0.05),
      success: this.generateChime([440, 554, 659], 0.3),
      fail: this.generateBeep(220, 0.2),
      evolve: this.generateEvolutionFanfare(),
      battle_start: this.generateBattleTheme(),
      victory: this.generateVictoryFanfare(),
      care: this.generateBeep(660, 0.15),
      feed: this.generateBeep(523, 0.1),
      clean: this.generateBeep(784, 0.12),
      sleep: this.generateSleepMelody(),
      wake: this.generateWakeMelody(),
      level_up: this.generateLevelUpSound(),
      error: this.generateBeep(150, 0.3)
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

  private generateBeep(frequency: number, duration: number): ArrayBuffer {
    if (!this.audioContext) return new ArrayBuffer(0);
    
    const sampleRate = this.audioContext.sampleRate;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 4);
    const view = new Float32Array(buffer);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      view[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3 * Math.exp(-t * 3);
    }
    
    return buffer;
  }

  private generateChime(frequencies: number[], duration: number): ArrayBuffer {
    if (!this.audioContext) return new ArrayBuffer(0);
    
    const sampleRate = this.audioContext.sampleRate;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 4);
    const view = new Float32Array(buffer);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      frequencies.forEach((freq, index) => {
        const delay = index * 0.1;
        if (t >= delay) {
          sample += Math.sin(2 * Math.PI * freq * (t - delay)) * 0.2 * Math.exp(-(t - delay) * 2);
        }
      });
      
      view[i] = sample;
    }
    
    return buffer;
  }

  private generateEvolutionFanfare(): ArrayBuffer {
    if (!this.audioContext) return new ArrayBuffer(0);
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 3.0;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 4);
    const view = new Float32Array(buffer);
    
    const melody = [440, 554, 659, 880, 1108, 1318, 1760];
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      melody.forEach((freq, index) => {
        const noteStart = (index / melody.length) * duration;
        const noteEnd = noteStart + 0.5;
        
        if (t >= noteStart && t <= noteEnd) {
          const noteT = t - noteStart;
          const envelope = Math.exp(-noteT * 1.5) * Math.sin(noteT * Math.PI / 0.5);
          sample += Math.sin(2 * Math.PI * freq * noteT) * envelope * 0.3;
          sample += Math.sin(2 * Math.PI * freq * 1.5 * noteT) * envelope * 0.15;
        }
      });
      
      view[i] = Math.max(-1, Math.min(1, sample));
    }
    
    return buffer;
  }

  private generateBattleTheme(): ArrayBuffer {
    return this.generateChime([330, 415, 523, 659], 1.0);
  }

  private generateVictoryFanfare(): ArrayBuffer {
    return this.generateChime([523, 659, 784, 1047], 1.5);
  }

  private generateSleepMelody(): ArrayBuffer {
    const frequencies = [440, 392, 349, 330];
    return this.generateChime(frequencies, 2.0);
  }

  private generateWakeMelody(): ArrayBuffer {
    const frequencies = [523, 659, 784];
    return this.generateChime(frequencies, 0.8);
  }

  private generateLevelUpSound(): ArrayBuffer {
    return this.generateChime([659, 784, 988, 1175], 1.0);
  }

  private async startBackgroundMusic() {
    if (!this.audioContext || !this.musicGainNode || this.options.audio?.muted) return;
    
    const musicBuffer = this.generateBackgroundLoop();
    
    try {
      const buffer = await this.audioContext.decodeAudioData(musicBuffer);
      this.sounds.set('bg_music', buffer);
      this.playBackgroundMusic();
    } catch (error) {
      console.warn('Failed to load background music:', error);
    }
  }

  private generateBackgroundLoop(): ArrayBuffer {
    if (!this.audioContext) return new ArrayBuffer(0);
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 16.0;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 4);
    const view = new Float32Array(buffer);
    
    // Nostalgic 8-bit style melody
    const melody = [
      { freq: 220, start: 0, duration: 2 },
      { freq: 247, start: 2, duration: 2 },
      { freq: 277, start: 4, duration: 2 },
      { freq: 294, start: 6, duration: 2 },
      { freq: 330, start: 8, duration: 2 },
      { freq: 277, start: 10, duration: 2 },
      { freq: 247, start: 12, duration: 2 },
      { freq: 220, start: 14, duration: 2 }
    ];
    
    const harmony = [
      { freq: 110, start: 0, duration: 4 },
      { freq: 123, start: 4, duration: 4 },
      { freq: 147, start: 8, duration: 4 },
      { freq: 110, start: 12, duration: 4 }
    ];
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      // Main melody
      melody.forEach(note => {
        if (t >= note.start && t < note.start + note.duration) {
          const noteT = t - note.start;
          const envelope = Math.sin(noteT * Math.PI / note.duration) * 0.15;
          sample += Math.sin(2 * Math.PI * note.freq * noteT) * envelope;
        }
      });
      
      // Harmony
      harmony.forEach(note => {
        if (t >= note.start && t < note.start + note.duration) {
          const noteT = t - note.start;
          const envelope = Math.sin(noteT * Math.PI / note.duration) * 0.08;
          sample += Math.sin(2 * Math.PI * note.freq * noteT) * envelope;
        }
      });
      
      view[i] = sample;
    }
    
    return buffer;
  }

  private playBackgroundMusic() {
    if (!this.audioContext || !this.musicGainNode || this.options.audio?.muted) return;
    
    const buffer = this.sounds.get('bg_music');
    if (!buffer) return;
    
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
    
    this.backgroundMusic = this.audioContext.createBufferSource();
    this.backgroundMusic.buffer = buffer;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.connect(this.musicGainNode);
    
    this.musicGainNode.gain.value = (this.options.audio?.volume || 0.7) * 0.2;
    this.backgroundMusic.start();
  }

  private async loadSprites() {
    const spriteData = this.currentMonster?.sprites.idle.image;
    if (spriteData) {
      const img = new Image();
      img.src = spriteData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      this.sprites.set('current', img);
    }
  }

  private setupInput() {
    // Mouse/touch input for buttons
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Scale coordinates
      const scaleX = 480 / rect.width;
      const scaleY = 480 / rect.height;
      const canvasX = x * scaleX;
      const canvasY = y * scaleY;
      
      this.handleCanvasClick(canvasX, canvasY);
    });

    // Keyboard input
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e.key);
    });
  }

  private handleCanvasClick(x: number, y: number) {
    // Check button hit areas based on shell type
    const shell = this.options.shell || 'round';
    
    if (shell === 'round') {
      // Left button
      if (this.isInCircle(x, y, 90, 240, 25)) {
        this.handleButton('left');
      }
      // OK button
      else if (this.isInCircle(x, y, 240, 390, 25)) {
        this.handleButton('ok');
      }
      // Right button
      else if (this.isInCircle(x, y, 390, 240, 25)) {
        this.handleButton('right');
      }
    }
  }

  private isInCircle(x: number, y: number, centerX: number, centerY: number, radius: number): boolean {
    const dx = x - centerX;
    const dy = y - centerY;
    return (dx * dx + dy * dy) <= (radius * radius);
  }

  private handleKeyDown(key: string) {
    switch (key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        this.handleButton('left');
        break;
      case 's':
      case ' ':
      case 'enter':
        this.handleButton('ok');
        break;
      case 'd':
      case 'arrowright':
        this.handleButton('right');
        break;
      case 'escape':
        this.currentMenu = 'home';
        this.isInMenu = false;
        this.playSound('beep');
        break;
    }
  }

  private handleButton(button: 'left' | 'ok' | 'right') {
    this.playSound('beep');
    
    if (this.currentMenu === 'home') {
      if (button === 'left') {
        this.openMenu('care');
      } else if (button === 'ok') {
        this.openMenu('train');
      } else if (button === 'right') {
        this.openMenu('battle');
      }
    } else {
      this.handleMenuNavigation(button);
    }
  }

  private handleMenuNavigation(button: 'left' | 'ok' | 'right') {
    switch (this.currentMenu) {
      case 'care':
        if (button === 'left') {
          this.feedMonster();
        } else if (button === 'ok') {
          this.cleanMonster();
        } else if (button === 'right') {
          this.currentMenu = 'home';
        }
        break;
        
      case 'train':
        if (button === 'left') {
          this.trainStat('ATK');
        } else if (button === 'ok') {
          this.trainStat('DEF');
        } else if (button === 'right') {
          this.currentMenu = 'home';
        }
        break;
        
      case 'battle':
        if (button === 'left') {
          this.startRandomBattle();
        } else if (button === 'ok') {
          this.openMenu('stats');
        } else if (button === 'right') {
          this.currentMenu = 'home';
        }
        break;
        
      case 'stats':
        this.currentMenu = 'home';
        break;
    }
  }

  private feedMonster() {
    if (this.careNeeds.hunger < 100) {
      this.careNeeds.hunger = Math.min(100, this.careNeeds.hunger + 30);
      this.careNeeds.weight = Math.min(100, this.careNeeds.weight + 2);
      this.careNeeds.bond = Math.min(100, this.careNeeds.bond + 5);
      this.playSound('feed');
      this.addNotification('Fed! Hunger restored.', 'success');
    } else {
      this.playSound('fail');
      this.addNotification('Not hungry right now.', 'info');
    }
  }

  private cleanMonster() {
    if (this.careNeeds.hygiene < 100) {
      this.careNeeds.hygiene = 100;
      this.careNeeds.mood = Math.min(100, this.careNeeds.mood + 10);
      this.careNeeds.bond = Math.min(100, this.careNeeds.bond + 3);
      this.playSound('clean');
      this.addNotification('Cleaned! Hygiene restored.', 'success');
    } else {
      this.playSound('fail');
      this.addNotification('Already clean!', 'info');
    }
  }

  private trainStat(stat: string) {
    if (this.careNeeds.energy >= 20) {
      this.careNeeds.energy -= 20;
      this.currentMonster!.baseStats[stat as keyof Monster['baseStats']] += 1;
      this.careNeeds.bond = Math.min(100, this.careNeeds.bond + 2);
      this.gameState.stats.trainingCount++;
      this.playSound('success');
      this.addNotification(`${stat} increased!`, 'success');
      
      // Check for evolution
      this.checkEvolution();
    } else {
      this.playSound('fail');
      this.addNotification('Too tired to train!', 'warning');
    }
  }

  private startRandomBattle() {
    this.playSound('battle_start');
    this.addNotification('Battle started!', 'battle');
    
    // Simulate battle outcome
    setTimeout(() => {
      const victory = Math.random() > 0.3; // 70% win rate
      if (victory) {
        this.gameState.stats.battlesWon++;
        this.careNeeds.bond = Math.min(100, this.careNeeds.bond + 10);
        this.playSound('victory');
        this.addNotification('Victory!', 'success');
        this.checkEvolution();
      } else {
        this.careNeeds.energy = Math.max(0, this.careNeeds.energy - 30);
        this.playSound('fail');
        this.addNotification('Defeated...', 'warning');
      }
    }, 2000);
  }

  private checkEvolution() {
    if (!this.currentMonster) return;
    
    for (const evolution of this.currentMonster.evolutions) {
      if (this.canEvolve(evolution)) {
        this.evolveMonster(evolution.to);
        break;
      }
    }
  }

  private canEvolve(condition: EvolutionCondition): boolean {
    const stats = this.gameState.stats;
    const needs = this.careNeeds;
    
    if (condition.minBattlesWon && stats.battlesWon < condition.minBattlesWon) return false;
    if (condition.maxCareMistakes && stats.careMistakes > condition.maxCareMistakes) return false;
    if (condition.minBond && needs.bond < condition.minBond) return false;
    if (condition.minWeight && needs.weight < condition.minWeight) return false;
    if (condition.maxWeight && needs.weight > condition.maxWeight) return false;
    
    return true;
  }

  private evolveMonster(targetId: string) {
    // Get new monster data (simplified for demo)
    const newMonster = this.getMonsterById(targetId);
    if (!newMonster) return;
    
    this.playSound('evolve');
    this.addNotification(`Evolved to ${newMonster.name}!`, 'evolve');
    
    // Evolution animation sequence
    this.startEvolutionSequence(newMonster);
  }

  private startEvolutionSequence(newMonster: Monster) {
    // Flash effect and sprite change
    let flashCount = 0;
    const flashInterval = setInterval(() => {
      flashCount++;
      if (flashCount >= 6) {
        clearInterval(flashInterval);
        this.currentMonster = newMonster;
        this.gameState.currentMonster = newMonster;
        this.loadSprites();
      }
    }, 200);
  }

  private getMonsterById(id: string): Monster | null {
    // Simplified evolution chain
    const evolutionMap: Record<string, Monster> = {
      'agumon': {
        id: 'agumon',
        name: 'Agumon',
        stage: 'Rookie',
        attribute: 'Vaccine',
        families: ['NatureSpirits', "Dragon'sRoar"],
        baseStats: { HP: 80, ATK: 25, DEF: 15, SPD: 20, INT: 12, STA: 50, LUK: 8 },
        moves: ['pepper_breath', 'claw_attack'],
        sprites: {
          idle: {
            image: this.generatePixelSprite('agumon', '#FFA500'),
            frameW: 32,
            frameH: 32,
            animations: { idle: [0, 1, 2, 1] }
          }
        },
        evolutions: [
          { to: 'greymon', minStage: 'Rookie', minBattlesWon: 10, maxCareMistakes: 8, minBond: 70 }
        ],
        flavor: 'A small dinosaur with a fiery spirit and powerful flame attacks.'
      }
    };
    
    return evolutionMap[id] || null;
  }

  private addNotification(message: string, type: string) {
    this.notifications.push({
      message,
      time: Date.now(),
      type
    });
    
    // Remove old notifications
    this.notifications = this.notifications.filter(n => Date.now() - n.time < 3000);
  }

  private startGameLoop() {
    const gameLoop = (currentTime: number) => {
      if (!this.isPaused) {
        const deltaTime = currentTime - this.lastTime;
        this.update(deltaTime);
        this.render();
      }
      
      this.lastTime = currentTime;
      this.animationFrame = requestAnimationFrame(gameLoop);
    };

    this.animationFrame = requestAnimationFrame(gameLoop);
  }

  private update(deltaTime: number) {
    const speedMultiplier = this.options.speed || 1;
    const adjustedDelta = deltaTime * speedMultiplier;
    
    this.currentFrame += adjustedDelta * 0.01;
    
    // Update care needs
    const now = Date.now();
    if (now - this.lastCareUpdate > 5000) { // Update every 5 seconds
      this.updateCareNeeds();
      this.lastCareUpdate = now;
    }
    
    // Update day/night cycle
    const hour = new Date().getHours();
    this.gameState.time.dayNightCycle = (hour >= 6 && hour < 18) ? 'Day' : 'Night';
    
    // Remove old notifications
    this.notifications = this.notifications.filter(n => now - n.time < 3000);
    
    this.emit('state:change', this.gameState);
  }

  private updateCareNeeds() {
    const decayRate = this.options.difficulty === 'Hard' ? 2 : 
                     this.options.difficulty === 'Casual' ? 0.5 : 1;
    
    this.careNeeds.hunger = Math.max(0, this.careNeeds.hunger - decayRate);
    this.careNeeds.energy = Math.max(0, this.careNeeds.energy - decayRate * 0.5);
    this.careNeeds.hygiene = Math.max(0, this.careNeeds.hygiene - decayRate * 0.3);
    
    // Update mood based on other needs
    const averageNeeds = (this.careNeeds.hunger + this.careNeeds.energy + this.careNeeds.hygiene) / 3;
    this.careNeeds.mood = Math.max(0, Math.min(100, averageNeeds));
    
    // Check for care mistakes
    if (this.careNeeds.hunger < 20 || this.careNeeds.energy < 20 || this.careNeeds.hygiene < 20) {
      this.gameState.stats.careMistakes++;
      this.addNotification('Care needed!', 'warning');
    }
  }

  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, 480, 480);

    // Render device shell
    this.renderShell();
    
    // Render LCD screen content
    this.renderScreen();
    
    // Render notifications
    this.renderNotifications();
    
    // Render debug overlay
    if (this.options.debug) {
      this.renderDebugOverlay();
    }
  }

  private renderShell() {
    const shell = this.options.shell || 'round';
    
    switch (shell) {
      case 'brick':
        this.renderBrickShell();
        break;
      case 'oval':
        this.renderOvalShell();
        break;
      case 'neon':
        this.renderNeonShell();
        break;
      default:
        this.renderRoundShell();
        break;
    }
  }

  private renderRoundShell() {
    const centerX = 240;
    const centerY = 240;
    
    // Device shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(centerX + 5, centerY + 5, 205, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Main device body
    this.ctx.fillStyle = '#E6F3FF';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Device border
    this.ctx.strokeStyle = '#B0D4F1';
    this.ctx.lineWidth = 6;
    this.ctx.stroke();
    
    // Inner ring
    this.ctx.strokeStyle = '#2C3E50';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Screen bezel
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Screen area
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 110, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Buttons with proper 3D effect
    this.renderButton(90, 240, '#3498DB', 'L', this.buttonStates.left);
    this.renderButton(240, 390, '#E74C3C', 'OK', this.buttonStates.ok);
    this.renderButton(390, 240, '#3498DB', 'R', this.buttonStates.right);
    
    // Digital text around bezel
    this.renderBezelText();
    
    // Status LEDs
    this.renderStatusLEDs();
  }

  private renderBrickShell() {
    // Brick device body with texture
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(90, 90, 300, 200);
    
    // Brick texture
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(90, 90 + i * 20);
      this.ctx.lineTo(390, 90 + i * 20);
      this.ctx.stroke();
    }
    
    // Screen bezel
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(115, 115, 250, 150);
    
    // Screen
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(125, 125, 230, 130);
    
    // Buttons
    this.renderButton(150, 320, '#3498DB', 'L', this.buttonStates.left);
    this.renderButton(240, 320, '#E74C3C', 'OK', this.buttonStates.ok);
    this.renderButton(330, 320, '#3498DB', 'R', this.buttonStates.right);
    
    // Chain attachment
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.fillRect(380, 95, 15, 25);
    this.ctx.beginPath();
    this.ctx.arc(387, 107, 8, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderOvalShell() {
    const centerX = 240;
    const centerY = 240;
    
    // Main oval body
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, 180, 220, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Blue side panels
    this.ctx.fillStyle = '#0066CC';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX - 120, centerY, 60, 180, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.ellipse(centerX + 120, centerY, 60, 180, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Screen bezel
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY - 40, 100, 80, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Screen
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY - 40, 90, 70, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Buttons
    this.renderButton(centerX - 80, centerY + 80, '#000000', '', this.buttonStates.left);
    this.renderButton(centerX, centerY + 120, '#FFFFFF', '', this.buttonStates.ok);
    this.renderButton(centerX + 80, centerY + 80, '#000000', '', this.buttonStates.right);
  }

  private renderNeonShell() {
    const centerX = 240;
    const centerY = 240;
    
    // Transparent glass effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Neon glow effect
    this.ctx.shadowColor = '#00FFFF';
    this.ctx.shadowBlur = 20;
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Screen with glow
    this.ctx.fillStyle = '#001122';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 110, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.shadowColor = '#00FFFF';
    this.ctx.shadowBlur = 10;
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Glowing buttons
    this.renderGlowButton(centerX - 150, centerY, '#FF00FF', this.buttonStates.left);
    this.renderGlowButton(centerX, centerY + 150, '#00FF00', this.buttonStates.ok);
    this.renderGlowButton(centerX + 150, centerY, '#FF00FF', this.buttonStates.right);
  }

  private renderButton(x: number, y: number, color: string, label: string, pressed: boolean) {
    const offset = pressed ? 2 : 0;
    
    // Button shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(x + 3, y + 3, 25, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Button body
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x + offset, y + offset, 25, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Button highlight
    if (!pressed) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(x - 5, y - 5, 15, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Label
    if (label) {
      this.ctx.fillStyle = pressed ? '#CCCCCC' : '#FFFFFF';
      this.ctx.font = 'bold 14px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(label, x + offset, y + offset + 5);
    }
  }

  private renderGlowButton(x: number, y: number, color: string, pressed: boolean) {
    const offset = pressed ? 2 : 0;
    
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = pressed ? 10 : 20;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x + offset, y + offset, pressed ? 18 : 20, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  private renderBezelText() {
    const centerX = 240;
    const centerY = 240;
    const radius = 160;
    
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    
    // Digital symbols around the bezel
    const symbols = ['◆', '▲', '●', '■', '♦', '▼', '○', '□'];
    symbols.forEach((symbol, index) => {
      const angle = (index / symbols.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      this.ctx.fillText(symbol, x, y + 5);
    });
  }

  private renderStatusLEDs() {
    const leds = [
      { x: 50, y: 50, color: this.careNeeds.hunger < 30 ? '#FF0000' : '#00FF00', active: this.careNeeds.hunger < 30 },
      { x: 50, y: 80, color: this.careNeeds.energy < 30 ? '#FF0000' : '#00FF00', active: this.careNeeds.energy < 30 },
      { x: 50, y: 110, color: this.careNeeds.hygiene < 30 ? '#FF0000' : '#00FF00', active: this.careNeeds.hygiene < 30 }
    ];
    
    leds.forEach(led => {
      if (led.active) {
        this.ctx.shadowColor = led.color;
        this.ctx.shadowBlur = 15;
      }
      
      this.ctx.fillStyle = led.color;
      this.ctx.beginPath();
      this.ctx.arc(led.x, led.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (led.active) {
        this.ctx.shadowBlur = 0;
      }
    });
  }

  private renderScreen() {
    const centerX = 240;
    const centerY = 240;
    const screenRadius = 110;
    
    // Screen background with gradient
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, screenRadius);
    
    if (this.gameState.time.dayNightCycle === 'Day') {
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#4682B4');
    } else {
      gradient.addColorStop(0, '#191970');
      gradient.addColorStop(1, '#000080');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, screenRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Render current screen content
    switch (this.currentMenu) {
      case 'home':
        this.renderHomeScreen();
        break;
      case 'care':
        this.renderCareScreen();
        break;
      case 'train':
        this.renderTrainScreen();
        break;
      case 'battle':
        this.renderBattleScreen();
        break;
      case 'stats':
        this.renderStatsScreen();
        break;
      default:
        this.renderHomeScreen();
        break;
    }
  }

  private renderHomeScreen() {
    const centerX = 240;
    const centerY = 240;
    
    // Render current monster
    if (this.currentMonster) {
      const sprite = this.sprites.get('current');
      if (sprite) {
        const frameIndex = Math.floor(this.currentFrame * 0.2) % 4;
        const sourceX = frameIndex * 32;
        
        // Scale and center the sprite
        this.ctx.drawImage(
          sprite,
          sourceX, 0, 32, 32,
          centerX - 40, centerY - 20, 80, 80
        );
      } else {
        // Fallback sprite
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 10, centerY - 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + 10, centerY - 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // Monster name
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(this.currentMonster?.name || 'No Monster', centerX, centerY + 60);
    this.ctx.fillText(this.currentMonster?.name || 'No Monster', centerX, centerY + 60);
    
    // Stage and level
    this.ctx.font = '12px monospace';
    this.ctx.strokeText(`${this.currentMonster?.stage || 'Unknown'} Lv.${this.gameState.stats.trainingCount || 1}`, centerX, centerX + 80);
    this.ctx.fillText(`${this.currentMonster?.stage || 'Unknown'} Lv.${this.gameState.stats.trainingCount || 1}`, centerX, centerY + 80);
    
    // Care status icons
    this.renderCareStatusIcons();
  }

  private renderCareStatusIcons() {
    const centerX = 240;
    const centerY = 240;
    const iconY = centerY - 80;
    
    const icons = [
      { x: centerX - 60, icon: '🍖', value: this.careNeeds.hunger, color: this.careNeeds.hunger > 50 ? '#00FF00' : '#FF0000' },
      { x: centerX - 20, icon: '⚡', value: this.careNeeds.energy, color: this.careNeeds.energy > 50 ? '#00FF00' : '#FF0000' },
      { x: centerX + 20, icon: '🧼', value: this.careNeeds.hygiene, color: this.careNeeds.hygiene > 50 ? '#00FF00' : '#FF0000' },
      { x: centerX + 60, icon: '😊', value: this.careNeeds.mood, color: this.careNeeds.mood > 50 ? '#00FF00' : '#FF0000' }
    ];
    
    icons.forEach(icon => {
      this.ctx.font = '16px monospace';
      this.ctx.fillStyle = icon.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(icon.icon, icon.x, iconY);
      
      // Value bar
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(icon.x - 8, iconY + 5, 16, 3);
      this.ctx.fillStyle = icon.color;
      this.ctx.fillRect(icon.x - 8, iconY + 5, (16 * icon.value) / 100, 3);
    });
  }

  private renderCareScreen() {
    const centerX = 240;
    const centerY = 240;
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText('CARE MENU', centerX, centerY - 60);
    this.ctx.fillText('CARE MENU', centerX, centerY - 60);
    
    // Care options
    const options = [
      { text: 'L: Feed', color: '#3498DB' },
      { text: 'OK: Clean', color: '#E74C3C' },
      { text: 'R: Back', color: '#3498DB' }
    ];
    
    options.forEach((option, index) => {
      this.ctx.fillStyle = option.color;
      this.ctx.font = '14px monospace';
      this.ctx.strokeText(option.text, centerX, centerY - 20 + index * 25);
      this.ctx.fillText(option.text, centerX, centerY - 20 + index * 25);
    });
    
    // Show current needs
    this.renderDetailedNeeds();
  }

  private renderDetailedNeeds() {
    const centerX = 240;
    const centerY = 240;
    
    const needs = [
      { name: 'Hunger', value: this.careNeeds.hunger, icon: '🍖' },
      { name: 'Energy', value: this.careNeeds.energy, icon: '⚡' },
      { name: 'Hygiene', value: this.careNeeds.hygiene, icon: '🧼' },
      { name: 'Mood', value: this.careNeeds.mood, icon: '😊' }
    ];
    
    needs.forEach((need, index) => {
      const y = centerY + 20 + index * 20;
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${need.icon} ${need.name}`, centerX - 80, y);
      
      // Progress bar
      const barX = centerX - 20;
      const barW = 60;
      const barH = 8;
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(barX, y - 6, barW, barH);
      
      const fillColor = need.value > 60 ? '#00FF00' : need.value > 30 ? '#FFFF00' : '#FF0000';
      this.ctx.fillStyle = fillColor;
      this.ctx.fillRect(barX, y - 6, (barW * need.value) / 100, barH);
      
      // Value text
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '8px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(Math.round(need.value).toString(), barX + barW/2, y - 1);
    });
  }

  private renderTrainScreen() {
    const centerX = 240;
    const centerY = 240;
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText('TRAINING', centerX, centerY - 60);
    this.ctx.fillText('TRAINING', centerX, centerY - 60);
    
    const options = [
      { text: 'L: ATK Training', color: '#FF4444' },
      { text: 'OK: DEF Training', color: '#4444FF' },
      { text: 'R: Back', color: '#3498DB' }
    ];
    
    options.forEach((option, index) => {
      this.ctx.fillStyle = option.color;
      this.ctx.font = '12px monospace';
      this.ctx.strokeText(option.text, centerX, centerY - 20 + index * 25);
      this.ctx.fillText(option.text, centerX, centerY - 20 + index * 25);
    });
    
    // Show current stats
    if (this.currentMonster) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'left';
      
      const stats = Object.entries(this.currentMonster.baseStats);
      stats.forEach(([stat, value], index) => {
        const x = centerX - 80 + (index % 4) * 40;
        const y = centerY + 40 + Math.floor(index / 4) * 15;
        this.ctx.fillText(`${stat}:${value}`, x, y);
      });
    }
  }

  private renderBattleScreen() {
    const centerX = 240;
    const centerY = 240;
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText('BATTLE', centerX, centerY - 60);
    this.ctx.fillText('BATTLE', centerX, centerY - 60);
    
    if (this.gameState.battle.inBattle) {
      this.renderBattleInterface();
    } else {
      const options = [
        { text: 'L: Random Battle', color: '#FF4444' },
        { text: 'OK: View Stats', color: '#4444FF' },
        { text: 'R: Back', color: '#3498DB' }
      ];
      
      options.forEach((option, index) => {
        this.ctx.fillStyle = option.color;
        this.ctx.font = '12px monospace';
        this.ctx.strokeText(option.text, centerX, centerY - 20 + index * 25);
        this.ctx.fillText(option.text, centerX, centerY - 20 + index * 25);
      });
    }
  }

  private renderBattleInterface() {
    const centerX = 240;
    const centerY = 240;
    
    // Player monster (left side)
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(centerX - 80, centerY - 20, 30, 30);
    
    // Opponent monster (right side)
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(centerX + 50, centerY - 20, 30, 30);
    
    // HP bars
    this.renderHPBar(centerX - 80, centerY - 40, this.gameState.battle.playerHP, '#00FF00');
    this.renderHPBar(centerX + 50, centerY - 40, this.gameState.battle.opponentHP, '#FF0000');
  }

  private renderHPBar(x: number, y: number, hp: number, color: string) {
    const barWidth = 60;
    const barHeight = 8;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, (barWidth * hp) / 100, barHeight);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '8px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${hp}%`, x + barWidth/2, y + 6);
  }

  private renderStatsScreen() {
    const centerX = 240;
    const centerY = 240;
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText('STATS', centerX, centerY - 80);
    this.ctx.fillText('STATS', centerX, centerY - 80);
    
    if (this.currentMonster) {
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'left';
      
      const stats = [
        `Name: ${this.currentMonster.name}`,
        `Stage: ${this.currentMonster.stage}`,
        `Type: ${this.currentMonster.attribute}`,
        `Battles Won: ${this.gameState.stats.battlesWon}`,
        `Training: ${this.gameState.stats.trainingCount}`,
        `Bond: ${Math.round(this.careNeeds.bond)}%`,
        `Weight: ${Math.round(this.careNeeds.weight)}g`
      ];
      
      stats.forEach((stat, index) => {
        this.ctx.strokeText(stat, centerX - 90, centerY - 50 + index * 15);
        this.ctx.fillText(stat, centerX - 90, centerY - 50 + index * 15);
      });
    }
  }

  private renderNotifications() {
    this.notifications.forEach((notification, index) => {
      const age = Date.now() - notification.time;
      const alpha = Math.max(0, 1 - age / 3000);
      
      const y = 50 + index * 25;
      
      // Notification background
      this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
      this.ctx.fillRect(10, y - 10, 200, 20);
      
      // Notification text
      const color = notification.type === 'success' ? '#00FF00' :
                   notification.type === 'warning' ? '#FFFF00' :
                   notification.type === 'error' ? '#FF0000' :
                   notification.type === 'evolve' ? '#FF00FF' : '#FFFFFF';
      
      this.ctx.fillStyle = color;
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(notification.message, 15, y);
    });
  }

  private renderDebugOverlay() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 350, 220, 120);
    
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'left';
    
    const debugInfo = [
      `FPS: ${Math.round(1000 / Math.max(1, performance.now() - this.lastTime))}`,
      `Speed: ${this.options.speed}x`,
      `Frame: ${Math.round(this.currentFrame)}`,
      `Menu: ${this.currentMenu}`,
      `Monster: ${this.currentMonster?.name}`,
      `Stage: ${this.currentMonster?.stage}`,
      `Hunger: ${Math.round(this.careNeeds.hunger)}`,
      `Energy: ${Math.round(this.careNeeds.energy)}`,
      `Bond: ${Math.round(this.careNeeds.bond)}`,
      `Battles: ${this.gameState.stats.battlesWon}`,
      `Training: ${this.gameState.stats.trainingCount}`,
      `Time: ${this.gameState.time.dayNightCycle}`
    ];
    
    debugInfo.forEach((info, index) => {
      this.ctx.fillText(info, 15, 365 + index * 10);
    });
  }

  private playSound(soundName: string) {
    if (this.options.audio?.muted || !this.audioContext || !this.sfxGainNode || !this.sounds.has(soundName)) {
      return;
    }

    try {
      const buffer = this.sounds.get(soundName)!;
      const source = this.audioContext.createBufferSource();
      
      source.buffer = buffer;
      source.connect(this.sfxGainNode);
      
      this.sfxGainNode.gain.value = this.options.audio?.volume || 0.7;
      source.start();
    } catch (error) {
      console.warn(`Failed to play sound ${soundName}:`, error);
    }
  }

  private emit(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
  }

  // Public API methods
  pause(): void {
    this.isPaused = true;
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic = null;
    }
  }

  resume(): void {
    this.isPaused = false;
    if (!this.options.audio?.muted) {
      this.playBackgroundMusic();
    }
  }

  setSpeed(mult: 0.5 | 1 | 2 | 4 | 8): void {
    this.options.speed = mult;
  }

  getState(): any {
    return { 
      ...this.gameState,
      careNeeds: { ...this.careNeeds },
      currentMonster: { ...this.currentMonster }
    };
  }

  exportSave(): string {
    return JSON.stringify({
      gameState: this.gameState,
      careNeeds: this.careNeeds,
      currentMonster: this.currentMonster,
      options: this.options,
      timestamp: Date.now(),
      version: '1.0.0'
    });
  }

  async importSave(json: string): Promise<void> {
    try {
      const saveData = JSON.parse(json);
      this.gameState = saveData.gameState;
      this.careNeeds = saveData.careNeeds;
      this.currentMonster = saveData.currentMonster;
      await this.loadSprites();
    } catch (error) {
      throw new Error('Invalid save data');
    }
  }

  startBattle(opponent?: "random" | Monster): void {
    this.currentMenu = 'battle';
    this.gameState.battle.inBattle = true;
    this.playSound('battle_start');
    this.addNotification('Battle started!', 'battle');
    this.emit('battle:start', opponent);
  }

  openMenu(id: "care" | "train" | "battle" | "explore" | "items" | "stats" | "evo" | "link" | "settings"): void {
    this.currentMenu = id;
    this.isInMenu = true;
    this.playSound('select');
    this.emit('menu:change', id);
  }

  on(event: string, cb: (...args: any[]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(cb);
    
    return () => {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(cb);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  unmount(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.eventListeners.clear();
  }
}

export async function mountDigiviceWidget(
  canvas: HTMLCanvasElement, 
  options?: WidgetOptions
): Promise<DigiviceController> {
  return new DigiviceEngine(canvas, options || {});
}