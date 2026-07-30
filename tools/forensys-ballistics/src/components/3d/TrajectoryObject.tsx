import { useMemo } from 'react';
import * as THREE from 'three';
import type { SceneObject } from '../../types/scene';

interface Props {
  objectData: SceneObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function TrajectoryObject({ objectData, isSelected, onSelect }: Props) {
  const { start = [0, 1.2, 0], end = [2, 1.5, 3], radius = 0.03, color = '#ff3b30' } = objectData.properties;

  const { meshPosition, meshRotation, height } = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const distance = vStart.distanceTo(vEnd);
    const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);

    const orientation = new THREE.Matrix4();
    orientation.lookAt(vStart, vEnd, new THREE.Vector3(0, 1, 0));

    const rotEuler = new THREE.Euler().setFromRotationMatrix(
      new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(orientation)
    );

    return {
      meshPosition: [mid.x, mid.y, mid.z] as [number, number, number],
      meshRotation: rotEuler,
      height: distance
    };
  }, [start, end]);

  return (
    <group 
      onClick={(e) => {
        e.stopPropagation();
        if (!objectData.locked) onSelect(objectData.id);
      }}
    >
      <mesh position={meshPosition} rotation={meshRotation}>
        <cylinderGeometry args={[radius, radius, height, 16]} />
        <meshStandardMaterial 
          color={isSelected ? '#ffffff' : color} 
          transparent 
          opacity={0.65} 
          roughness={0.2} 
        />
      </mesh>
    </group>
  );
}