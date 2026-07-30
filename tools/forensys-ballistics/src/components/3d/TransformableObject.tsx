import { useRef, useEffect, useState, useCallback } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../../store/useSceneStore';
import type { SceneObject } from '../../types/scene';

interface TransformableObjectProps {
  objectData: SceneObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDraggingChange: (dragging: boolean) => void;
  children: React.ReactNode;
}

export function TransformableObject({
  objectData,
  isSelected,
  onSelect,
  onDraggingChange,
  children,
}: TransformableObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [groupReady, setGroupReady] = useState(false);
  const updateObjectTransform = useSceneStore((state) => state.updateObjectTransform);
  const transformMode = useSceneStore((state) => state.transformMode);
  const isDragging = useRef(false);
  const lastTransform = useRef<{
    pos: [number, number, number];
    rot: [number, number, number];
  } | null>(null);

  // Sincroniza la posición/rotación del grupo desde el store cuando NO se está arrastrando
  useEffect(() => {
    if (groupRef.current && !isDragging.current) {
      groupRef.current.position.set(...objectData.position);
      groupRef.current.rotation.set(...objectData.rotation);
      lastTransform.current = {
        pos: objectData.position,
        rot: objectData.rotation,
      };
    }
  }, [objectData.position, objectData.rotation]);

  // Marca el grupo como listo para que TransformControls reciba una referencia válida
  useEffect(() => {
    if (groupRef.current) {
      setGroupReady(true);
    }
  }, []);

  const handleChange = useCallback(() => {
    if (!groupRef.current || !isDragging.current) return;

    const pos = groupRef.current.position;
    const rot = groupRef.current.rotation;

    const newPos: [number, number, number] = [
      Number(pos.x.toFixed(3)),
      Number(pos.y.toFixed(3)),
      Number(pos.z.toFixed(3)),
    ];
    const newRot: [number, number, number] = [
      Number(rot.x.toFixed(3)),
      Number(rot.y.toFixed(3)),
      Number(rot.z.toFixed(3)),
    ];

    // Evita actualizaciones al store si el cambio es imperceptible
    if (lastTransform.current) {
      const lp = lastTransform.current.pos;
      const lr = lastTransform.current.rot;
      const posDiff =
        Math.abs(newPos[0] - lp[0]) +
        Math.abs(newPos[1] - lp[1]) +
        Math.abs(newPos[2] - lp[2]);
      const rotDiff =
        Math.abs(newRot[0] - lr[0]) +
        Math.abs(newRot[1] - lr[1]) +
        Math.abs(newRot[2] - lr[2]);
      if (posDiff < 0.001 && rotDiff < 0.001) return;
    }

    lastTransform.current = { pos: newPos, rot: newRot };
    updateObjectTransform(objectData.id, newPos, newRot);
  }, [objectData.id, updateObjectTransform]);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    onDraggingChange(true);
  }, [onDraggingChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    onDraggingChange(false);
    // Fuerza una sincronización final al soltar
    handleChange();
  }, [onDraggingChange, handleChange]);

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        if (!objectData.locked) onSelect(objectData.id);
      }}
    >
      {children}
      {isSelected && !objectData.locked && groupReady && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          space="local"
          translationSnap={0.05}
          rotationSnap={Math.PI / 36}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onChange={handleChange}
        />
      )}
    </group>
  );
}
