// src/core/math/ballisticReconstruction.ts
import { Vector3, MathUtils } from 'three';

export interface BallisticTrajectoryReconstruction {
  entryPoint: [number, number, number];
  exitPoint: [number, number, number];
  distance: number;
  azimuth: number;
  elevation: number;
  vector: [number, number, number];
}

export function reconstructTrajectory(entry: Vector3, exit: Vector3): BallisticTrajectoryReconstruction {
  const direction = new Vector3().subVectors(exit, entry);
  const distance = entry.distanceTo(exit);
  
  let azimuth = MathUtils.radToDeg(Math.atan2(direction.x, direction.z));
  if (azimuth < 0) azimuth += 360;

  const elevation = MathUtils.radToDeg(Math.asin(direction.y / (distance || 0.0001)));

  return {
    entryPoint: [entry.x, entry.y, entry.z], // Corregido
    exitPoint: [exit.x, exit.y, exit.z],     // Corregido
    distance: Number(distance.toFixed(3)),
    azimuth: Number(azimuth.toFixed(2)),
    elevation: Number(elevation.toFixed(2)),
    vector: [Number(direction.x.toFixed(3)), Number(direction.y.toFixed(3)), Number(direction.z.toFixed(3))]
  };
}