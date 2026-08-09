import * as THREE from 'three';
import type { SceneObject } from '../../types/scene';

interface Props {
  objectData: SceneObject;
  isSelected: boolean;
}

export function AnatomicalManikin({ objectData, isSelected }: Props) {
  const height = (objectData.properties.height as number) ?? 1.75;
  const showSagittal = Boolean(objectData.properties.showSagittal);
  const showCoronal = Boolean(objectData.properties.showCoronal);
  const showTransverse = Boolean(objectData.properties.showTransverse);
  const color = (objectData.properties.color as string) ?? '#8e8e93';

  const scaleY = height / 1.75;

  return (
    <group scale={[1, scaleY, 1]}>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={isSelected ? '#4a90e2' : color} roughness={0.7} />
      </mesh>

      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.45, 0.65, 0.22]} />
        <meshStandardMaterial color={isSelected ? '#4a90e2' : color} roughness={0.7} />
      </mesh>

      <mesh position={[-0.3, 1.15, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.65, 12]} />
        <meshStandardMaterial color={isSelected ? '#4a90e2' : color} roughness={0.7} />
      </mesh>
      <mesh position={[0.3, 1.15, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.65, 12]} />
        <meshStandardMaterial color={isSelected ? '#4a90e2' : color} roughness={0.7} />
      </mesh>

      <mesh position={[-0.12, 0.45, 0]}>
        <cylinderGeometry args={[0.09, 0.07, 0.85, 12]} />
        <meshStandardMaterial color={isSelected ? '#4a90e2' : color} roughness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.45, 0]}>
        <cylinderGeometry args={[0.09, 0.07, 0.85, 12]} />
        <meshStandardMaterial color={isSelected ? '#4a90e2' : color} roughness={0.7} />
      </mesh>

      {showSagittal && (
        <mesh position={[0, 1.0, 0]}>
          <planeGeometry args={[1.5, 2.0]} />
          <meshBasicMaterial color="#007aff" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showCoronal && (
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 1.0, 0]}>
          <planeGeometry args={[1.5, 2.0]} />
          <meshBasicMaterial color="#34c759" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showTransverse && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.15, 0]}>
          <planeGeometry args={[1.0, 1.0]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
