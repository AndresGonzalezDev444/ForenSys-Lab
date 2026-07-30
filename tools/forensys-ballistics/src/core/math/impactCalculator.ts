// src/core/math/impactCalculator.ts
import { Vector3, Euler } from 'three';

export interface ImpactData {
  id: string;
  type: 'Entrada' | 'Salida' | 'Rozamiento' | 'Impacto';
  anatomicalRegion: string;
  heightFromFloor: number;
  distanceFromMidline: number;
  depthOffset?: number;
  description: string;
}

export function calculateImpactPosition3D(
  objectPosition: [number, number, number], 
  objectRotation: [number, number, number], 
  heightFromFloor: number, 
  distanceFromMidline: number,
  depthOffset: number = 0.11
): [number, number, number] {
  const basePos = new Vector3(...objectPosition);
  
  // Crear vector local y aplicar la rotación del objeto (maniquí)
  const localOffset = new Vector3(distanceFromMidline, heightFromFloor, depthOffset);
  localOffset.applyEuler(new Euler(...objectRotation));

  const finalPos = basePos.clone().add(localOffset);

  return [Number(finalPos.x.toFixed(3)), Number(finalPos.y.toFixed(3)), Number(finalPos.z.toFixed(3))];
}