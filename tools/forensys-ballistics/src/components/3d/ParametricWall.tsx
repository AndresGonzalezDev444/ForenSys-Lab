import { useMemo } from 'react';
import * as THREE from 'three';
import type { SceneObject } from '../../types/scene';

interface Props {
  objectData: SceneObject;
  isSelected: boolean;
}

export function ParametricWall({ objectData, isSelected }: Props) {
  const { length, height, thickness, color } = objectData.properties;

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(length, height, thickness);
    geo.translate(length / 2, height / 2, thickness / 2);
    return geo;
  }, [length, height, thickness]);

  return (
    <mesh>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={isSelected ? '#4a90e2' : color} roughness={0.9} />
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color={isSelected ? '#ffffff' : '#000000'} linewidth={2} />
      </lineSegments>
    </mesh>
  );
}
