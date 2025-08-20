// VidForge - Digivice Content Pack (Gen 1-5 Starter Dataset)
import { Monster, Move, Item } from './core';

export const starterMonsters: Monster[] = [
  // Fresh Stage
  {
    id: 'budmon',
    name: 'Budmon',
    stage: 'Fresh',
    attribute: 'Free',
    families: ['NatureSpirits'],
    baseStats: { HP: 20, ATK: 5, DEF: 5, SPD: 8, INT: 3, STA: 15, LUK: 2 },
    moves: ['bubble'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('budmon', '#90EE90'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [{ to: 'leafmon', minStage: 'Fresh' }],
    flavor: 'A tiny plant-like creature that loves sunlight.'
  },
  {
    id: 'pupmon',
    name: 'Pupmon',
    stage: 'Fresh',
    attribute: 'Free',
    families: ['NatureSpirits'],
    baseStats: { HP: 25, ATK: 6, DEF: 4, SPD: 10, INT: 4, STA: 18, LUK: 3 },
    moves: ['tackle'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('pupmon', '#DDA0DD'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [{ to: 'koromon', minStage: 'Fresh' }],
    flavor: 'A small, energetic creature with boundless curiosity.'
  },

  // InTraining Stage
  {
    id: 'leafmon',
    name: 'Leafmon',
    stage: 'InTraining',
    attribute: 'Free',
    families: ['NatureSpirits'],
    baseStats: { HP: 40, ATK: 8, DEF: 8, SPD: 12, INT: 6, STA: 25, LUK: 4 },
    moves: ['bubble', 'leaf_cutter'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('leafmon', '#228B22'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [
      { to: 'palmon', minStage: 'InTraining', minBattlesWon: 2, maxCareMistakes: 3 },
      { to: 'betamon', minStage: 'InTraining', minBattlesWon: 1, maxCareMistakes: 5 }
    ],
    flavor: 'A plant-type creature that photosynthesizes for energy.'
  },
  {
    id: 'koromon',
    name: 'Koromon',
    stage: 'InTraining',
    attribute: 'Free',
    families: ['NatureSpirits'],
    baseStats: { HP: 45, ATK: 10, DEF: 6, SPD: 15, INT: 8, STA: 30, LUK: 5 },
    moves: ['tackle', 'bubble'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('koromon', '#FFB6C1'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [
      { to: 'agumon', minStage: 'InTraining', minBattlesWon: 3, maxCareMistakes: 5, minBond: 50 },
      { to: 'gabumon', minStage: 'InTraining', minBattlesWon: 2, maxCareMistakes: 3, minBond: 40 }
    ],
    flavor: 'A friendly pink creature with a big heart and bigger appetite.'
  },

  // Rookie Stage
  {
    id: 'agumon',
    name: 'Agumon',
    stage: 'Rookie',
    attribute: 'Vaccine',
    families: ['NatureSpirits', "Dragon'sRoar"],
    baseStats: { HP: 80, ATK: 25, DEF: 15, SPD: 20, INT: 12, STA: 50, LUK: 8 },
    moves: ['pepper_breath', 'claw_attack', 'tackle'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('agumon', '#FFA500'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [
      { to: 'greymon', minStage: 'Rookie', minBattlesWon: 10, maxCareMistakes: 8, minBond: 70 },
      { to: 'tyrannomon', minStage: 'Rookie', minBattlesWon: 15, maxCareMistakes: 12 }
    ],
    flavor: 'A small dinosaur with a fiery spirit and powerful flame attacks.'
  },
  {
    id: 'gabumon',
    name: 'Gabumon',
    stage: 'Rookie',
    attribute: 'Data',
    families: ['NatureSpirits'],
    baseStats: { HP: 75, ATK: 20, DEF: 20, SPD: 18, INT: 15, STA: 45, LUK: 10 },
    moves: ['blue_blaster', 'horn_attack', 'tackle'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('gabumon', '#87CEEB'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [
      { to: 'garurumon', minStage: 'Rookie', minBattlesWon: 8, maxCareMistakes: 5, minBond: 80 }
    ],
    flavor: 'A shy creature wearing a fur pelt, with ice-based attacks.'
  },
  {
    id: 'palmon',
    name: 'Palmon',
    stage: 'Rookie',
    attribute: 'Data',
    families: ['NatureSpirits', 'JungleTroopers'],
    baseStats: { HP: 70, ATK: 18, DEF: 25, SPD: 12, INT: 20, STA: 40, LUK: 12 },
    moves: ['poison_ivy', 'root_breaker', 'leaf_cutter'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('palmon', '#32CD32'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [
      { to: 'togemon', minStage: 'Rookie', minBattlesWon: 6, maxCareMistakes: 4, minBond: 60 }
    ],
    flavor: 'A plant creature with a flower on its head and toxic abilities.'
  },

  // Champion Stage
  {
    id: 'greymon',
    name: 'Greymon',
    stage: 'Champion',
    attribute: 'Vaccine',
    families: ["Dragon'sRoar"],
    baseStats: { HP: 150, ATK: 45, DEF: 30, SPD: 25, INT: 18, STA: 80, LUK: 15 },
    moves: ['nova_blast', 'great_horn_attack', 'pepper_breath'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('greymon', '#FF4500'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [
      { to: 'metalgreymon', minStage: 'Champion', minBattlesWon: 20, maxCareMistakes: 10, minBond: 90 }
    ],
    flavor: 'A large dinosaur with incredible fire power and strong armor.'
  },
  {
    id: 'garurumon',
    name: 'Garurumon',
    stage: 'Champion',
    attribute: 'Data',
    families: ['NatureSpirits'],
    baseStats: { HP: 140, ATK: 40, DEF: 35, SPD: 35, INT: 25, STA: 75, LUK: 18 },
    moves: ['howling_blaster', 'freeze_fang', 'blue_blaster'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('garurumon', '#4169E1'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [
      { to: 'weregarurumon', minStage: 'Champion', minBattlesWon: 18, maxCareMistakes: 8, minBond: 85 }
    ],
    flavor: 'A wolf-like creature with ice attacks and incredible speed.'
  },

  // Ultimate Stage
  {
    id: 'metalgreymon',
    name: 'MetalGreymon',
    stage: 'Ultimate',
    attribute: 'Vaccine',
    families: ["Dragon'sRoar", 'MetalEmpire'],
    baseStats: { HP: 250, ATK: 70, DEF: 50, SPD: 30, INT: 25, STA: 120, LUK: 20 },
    moves: ['giga_blaster', 'trident_arm', 'nova_blast'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('metalgreymon', '#C0C0C0'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [
      { to: 'wargreymon', minStage: 'Ultimate', minBattlesWon: 50, maxCareMistakes: 15, minBond: 95 }
    ],
    flavor: 'A cyborg dinosaur with devastating missile attacks.'
  },

  // Mega Stage
  {
    id: 'wargreymon',
    name: 'WarGreymon',
    stage: 'Mega',
    attribute: 'Vaccine',
    families: ["Dragon'sRoar"],
    baseStats: { HP: 400, ATK: 120, DEF: 80, SPD: 50, INT: 40, STA: 200, LUK: 30 },
    moves: ['terra_force', 'dramon_killer', 'giga_blaster'],
    sprites: {
      idle: {
        image: generateSpriteDataURL('wargreymon', '#FFD700'),
        frameW: 32,
        frameH: 32,
        animations: { idle: [0, 1, 2, 1] }
      }
    },
    evolutions: [],
    flavor: 'The ultimate dragon warrior with unmatched power and courage.'
  }
];

export const starterMoves: Move[] = [
  {
    id: 'bubble',
    name: 'Bubble',
    kind: 'Tech',
    power: 15,
    accuracy: 95,
    staminaCost: 5,
    animation: 'bubble'
  },
  {
    id: 'tackle',
    name: 'Tackle',
    kind: 'Physical',
    power: 20,
    accuracy: 90,
    staminaCost: 8,
    animation: 'impact'
  },
  {
    id: 'pepper_breath',
    name: 'Pepper Breath',
    kind: 'Tech',
    power: 35,
    accuracy: 85,
    staminaCost: 15,
    effect: { status: 'Burn', chance: 30, duration: 3 },
    animation: 'flame'
  },
  {
    id: 'blue_blaster',
    name: 'Blue Blaster',
    kind: 'Tech',
    power: 40,
    accuracy: 80,
    staminaCost: 18,
    effect: { status: 'Slow', chance: 25, duration: 2 },
    animation: 'ice'
  },
  {
    id: 'nova_blast',
    name: 'Nova Blast',
    kind: 'Tech',
    power: 80,
    accuracy: 75,
    staminaCost: 35,
    animation: 'explosion'
  },
  {
    id: 'terra_force',
    name: 'Terra Force',
    kind: 'Tech',
    power: 150,
    accuracy: 70,
    staminaCost: 60,
    animation: 'mega_explosion'
  }
];

export const starterItems: Item[] = [
  {
    id: 'meat',
    name: 'Meat',
    icon: '🍖',
    kind: 'Food',
    effects: { hunger: 30, weight: 2 }
  },
  {
    id: 'vitamin',
    name: 'Vitamin',
    icon: '💊',
    kind: 'Vitamin',
    effects: { energy: 25, statBoost: { STA: 2 } }
  },
  {
    id: 'soap',
    name: 'Soap',
    icon: '🧼',
    kind: 'Care',
    effects: { hygiene: 50 }
  },
  {
    id: 'bandage',
    name: 'Bandage',
    icon: '🩹',
    kind: 'Care',
    effects: { cureStatus: 'all' }
  }
];

function generateSpriteDataURL(monsterId: string, primaryColor: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  // Generate 4 frames of simple pixel art
  for (let frame = 0; frame < 4; frame++) {
    const x = frame * 32;
    const bounce = Math.sin(frame * Math.PI / 2) * 2;
    
    // Body
    ctx.fillStyle = primaryColor;
    ctx.fillRect(x + 8, 16 - bounce, 16, 12);
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 12, 18 - bounce, 2, 2);
    ctx.fillRect(x + 18, 18 - bounce, 2, 2);
    
    // Mouth
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 14, 22 - bounce, 4, 1);
    
    // Special features based on monster
    if (monsterId.includes('dragon') || monsterId.includes('greymon')) {
      // Horn
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 15, 14 - bounce, 2, 4);
    }
    
    if (monsterId.includes('plant') || monsterId.includes('mon')) {
      // Leaf/flower
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(x + 14, 12 - bounce, 4, 2);
    }
  }

  return canvas.toDataURL();
}