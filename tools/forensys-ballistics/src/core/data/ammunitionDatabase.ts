// src/core/data/ammunitionDatabase.ts
export interface AmmunitionProfile {
  id: string;
  name: string;
  caliber: string;
  massGrains: number;
  massGrams: number;
  muzzleVelocityMS: number; // m/s
  ballisticCoefficient: number; // G1
  dragModel: 'G1' | 'G7';
  description: string;
}

export const AMMUNITION_DB: Record<string, AmmunitionProfile> = {
  '9mm-parabellum': {
    id: '9mm-parabellum',
    name: '9x19mm Parabellum (FMJ)',
    caliber: '9mm',
    massGrains: 115,
    massGrams: 7.45,
    muzzleVelocityMS: 360,
    ballisticCoefficient: 0.150,
    dragModel: 'G1',
    description: 'Munición estándar de arma corta, alta velocidad subsónica/transónica.'
  },
  '38-special': {
    id: '38-special',
    name: '.38 Special (LRN)',
    caliber: '.38',
    massGrains: 158,
    massGrams: 10.24,
    muzzleVelocityMS: 240,
    ballisticCoefficient: 0.145,
    dragModel: 'G1',
    description: 'Común en revólveres. Velocidad subsónica, impacto contundente.'
  },
  '45-acp': {
    id: '45-acp',
    name: '.45 ACP (FMJ)',
    caliber: '.45',
    massGrains: 230,
    massGrams: 14.90,
    muzzleVelocityMS: 255,
    ballisticCoefficient: 0.190,
    dragModel: 'G1',
    description: 'Calibre pesado, velocidad baja (subsónica).'
  },
  '556-nato': {
    id: '556-nato',
    name: '5.56x45mm NATO (M855)',
    caliber: '5.56mm',
    massGrains: 62,
    massGrams: 4.02,
    muzzleVelocityMS: 920,
    ballisticCoefficient: 0.304,
    dragModel: 'G1',
    description: 'Fusil de asalto. Muy alta velocidad.'
  },
  '762-nato': {
    id: '762-nato',
    name: '7.62x51mm NATO (M80)',
    caliber: '7.62mm',
    massGrains: 147,
    massGrams: 9.53,
    muzzleVelocityMS: 833,
    ballisticCoefficient: 0.393,
    dragModel: 'G1',
    description: 'Fusil de precisión/batalla. Alta penetración y alcance.'
  },
  '12-gauge': {
    id: '12-gauge',
    name: 'Escopeta Calibre 12 (Slug)',
    caliber: '12ga',
    massGrains: 437.5, // 1 oz
    massGrams: 28.35,
    muzzleVelocityMS: 490,
    ballisticCoefficient: 0.075,
    dragModel: 'G1',
    description: 'Proyectil único de escopeta. Masa muy alta, aerodinámica pobre.'
  }
};
