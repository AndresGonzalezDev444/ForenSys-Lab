import { Vector3, MathUtils } from 'three';

export interface TrajectoryStats {
  length: number;
  azimuth: number;
  elevation: number;
  anatomicalSense: {
    anteriorPosterior: string;
    lateral: string;
    vertical: string;
  };
}

export function calculateTrajectoryStats(p1: Vector3, p2: Vector3): TrajectoryStats {
  const direction = new Vector3().subVectors(p2, p1);
  const length = p1.distanceTo(p2);
  
  let azimuth = MathUtils.radToDeg(Math.atan2(direction.x, direction.z));
  if (azimuth < 0) azimuth += 360;

  const elevation = MathUtils.radToDeg(Math.asin(direction.y / (length || 0.0001)));

  const anteriorPosterior = direction.z > 0 ? "Anterior → Posterior" : "Posterior → Anterior";
  const lateral = direction.x > 0 ? "Izquierda → Derecha" : "Derecha → Izquierda";
  const vertical = direction.y > 0 ? "Inferior → Superior" : "Superior → Inferior";

  return {
    length: Number(length.toFixed(3)),
    azimuth: Number(azimuth.toFixed(2)),
    elevation: Number(elevation.toFixed(2)),
    anatomicalSense: { anteriorPosterior, lateral, vertical }
  };
}