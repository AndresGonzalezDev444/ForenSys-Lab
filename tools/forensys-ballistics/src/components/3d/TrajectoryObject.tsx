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

  const { vStart, vEnd, meshPosition, meshRotation, height, arrowPosition, arrowRotation } = useMemo(() => {
    const pStart = new THREE.Vector3(...(start as [number, number, number]));
    const pEnd = new THREE.Vector3(...(end as [number, number, number]));
    const distance = pStart.distanceTo(pEnd);
    const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);

    const direction = new THREE.Vector3().subVectors(pEnd, pStart).normalize();

    const orientation = new THREE.Matrix4();
    orientation.lookAt(pStart, pEnd, new THREE.Vector3(0, 1, 0));

    const rotEuler = new THREE.Euler().setFromRotationMatrix(
      new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(orientation)
    );

    // Posición y rotación de la flecha (cono) en el extremo 'end'
    const aRotEuler = new THREE.Euler().setFromRotationMatrix(
      new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(orientation)
    );
    
    // Ajustar posición para que la base del cono esté en 'end' apuntando hacia afuera
    const aPos = pEnd.clone().add(direction.clone().multiplyScalar(0.1));

    return {
      vStart: pStart,
      vEnd: pEnd,
      meshPosition: [mid.x, mid.y, mid.z] as [number, number, number],
      meshRotation: rotEuler,
      height: distance,
      arrowPosition: [aPos.x, aPos.y, aPos.z] as [number, number, number],
      arrowRotation: aRotEuler
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
        <cylinderGeometry args={[radius as number, radius as number, height, 16]} />
        <meshStandardMaterial 
          color={isSelected ? '#ffffff' : (color as string)} 
          transparent 
          opacity={0.7} 
          roughness={0.2} 
        />
      </mesh>
      
      {/* Punta de flecha */}
      <mesh position={arrowPosition} rotation={arrowRotation}>
        <coneGeometry args={[(radius as number) * 2.5, 0.2, 16]} />
        <meshStandardMaterial 
          color={isSelected ? '#ffffff' : (color as string)}
          roughness={0.2}
        />
      </mesh>

      {/* Marcadores de Inicio y Fin si está seleccionado */}
      {isSelected && (
        <>
          <mesh position={[vStart.x, vStart.y, vStart.z]}>
            <sphereGeometry args={[(radius as number) * 1.5, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[vEnd.x, vEnd.y, vEnd.z]}>
            <sphereGeometry args={[(radius as number) * 1.5, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}
    </group>
  );
}