// src/types/scene.ts
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
  properties: Record<string, any>;
}