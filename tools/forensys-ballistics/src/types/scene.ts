// src/types/scene.ts (Fase 4: + ImpactData)
import type { ImpactData } from '../core/math/impactCalculator';

export type ObjectType = 'parametric_wall' | 'model' | 'trajectory' | 'measurement' | 'manikin';

export interface SceneObject {
  id: string;
  name: string;
  type: ObjectType;
  layer: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
  locked: boolean;
  properties: Record<string, unknown>;
  impacts?: ImpactData[];
}
