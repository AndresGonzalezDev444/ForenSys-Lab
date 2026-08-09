// src/core/math/ballisticSimulation.ts
import { Vector3 } from 'three';

export interface SimulationParams {
  startPos: [number, number, number];
  azimuthDeg: number;
  elevationDeg: number;
  velocityMS: number;
  massGrams: number;
}

export interface SimulationResult {
  path: [number, number, number][]; // Puntos de la trayectoria
  timeOfFlight: number; // segundos
  maxHeight: number; // m
  maxRange: number; // m
  energyAtImpact: number; // Joules (asumiendo que impacta al final)
}

// Gravedad estándar
const G = 9.80665; 

export function simulateParabolicTrajectory(params: SimulationParams, maxTime: number = 2, timeStep: number = 0.05): SimulationResult {
  const { startPos, azimuthDeg, elevationDeg, velocityMS, massGrams } = params;

  // Convertir grados a radianes
  const azRad = (azimuthDeg * Math.PI) / 180;
  const elRad = (elevationDeg * Math.PI) / 180;

  // Descomponer velocidad inicial
  const vX0 = velocityMS * Math.cos(elRad) * Math.sin(azRad);
  const vY0 = velocityMS * Math.sin(elRad);
  const vZ0 = velocityMS * Math.cos(elRad) * Math.cos(azRad);

  const start = new Vector3(...startPos);
  const path: [number, number, number][] = [[start.x, start.y, start.z]];
  
  let maxHeight = start.y;
  let t = timeStep;
  let lastPos = start.clone();

  while (t <= maxTime) {
    // Ecuaciones del movimiento parabólico simple
    const x = start.x + vX0 * t;
    const y = start.y + vY0 * t - 0.5 * G * t * t;
    const z = start.z + vZ0 * t;

    // Si toca el suelo (y=0) paramos, a menos que el start ya sea bajo
    if (y < 0 && start.y > 0) {
      break;
    }

    path.push([x, y, z]);
    if (y > maxHeight) maxHeight = y;
    
    lastPos.set(x, y, z);
    t += timeStep;
  }

  const maxRange = start.distanceTo(lastPos);
  
  // Energía cinética aproximada al final (sin drag, la vel horizontal se mantiene, vertical cambia)
  const vYf = vY0 - G * t;
  const vf = Math.sqrt(vX0 * vX0 + vYf * vYf + vZ0 * vZ0);
  const energyAtImpact = 0.5 * (massGrams / 1000) * (vf * vf);

  return {
    path,
    timeOfFlight: t,
    maxHeight,
    maxRange,
    energyAtImpact
  };
}

// Calcular energía cinética básica
export function calculateKineticEnergy(massGrams: number, velocityMS: number): number {
  return 0.5 * (massGrams / 1000) * (velocityMS * velocityMS);
}
