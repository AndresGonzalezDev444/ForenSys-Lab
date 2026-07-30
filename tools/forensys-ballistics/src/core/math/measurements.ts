import { Vector3, MathUtils } from 'three';

export interface MeasurementResult {
  id: string;
  p1: [number, number, number];
  p2: [number, number, number];
  distance: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  horizontalAngle: number;
}

export function calculateMeasurement(p1: Vector3, p2: Vector3): MeasurementResult {
  const distance = p1.distanceTo(p2);
  const deltaX = p2.x - p1.x;
  const deltaY = p2.y - p1.y;
  const deltaZ = p2.z - p1.z;

  let horizontalAngle = MathUtils.radToDeg(Math.atan2(deltaX, deltaZ));
  if (horizontalAngle < 0) horizontalAngle += 360;

  return {
    id: `meas_${Date.now()}`,
    p1: [p1.x, p1.y, p1.z],
    p2: [p2.x, p2.y, p2.z],
    distance: Number(distance.toFixed(3)),
    deltaX: Number(deltaX.toFixed(3)),
    deltaY: Number(deltaY.toFixed(3)),
    deltaZ: Number(deltaZ.toFixed(3)),
    horizontalAngle: Number(horizontalAngle.toFixed(2)),
  };
}