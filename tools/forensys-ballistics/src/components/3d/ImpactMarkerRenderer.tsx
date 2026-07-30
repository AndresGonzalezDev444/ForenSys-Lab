// src/components/3d/ImpactMarkerRenderer.tsx
import { Html } from '@react-three/drei';
import type { ImpactData } from '../../core/math/impactCalculator';
import { calculateImpactPosition3D } from '../../core/math/impactCalculator';
import type { SceneObject } from '../../types/scene';

interface Props {
  impact: ImpactData;
  targetObject: SceneObject;
}

export function ImpactMarkerRenderer({ impact, targetObject }: Props) {
  const pos3D = calculateImpactPosition3D(
    targetObject.position,
    targetObject.rotation,
    impact.heightFromFloor,
    impact.distanceFromMidline
  );

  const colorMap = {
    Entrada: '#ff3b30', // Rojo
    Salida: '#34c759',  // Verde
    Rozamiento: '#ffcc00', // Amarillo
    Impacto: '#007aff'  // Azul
  };

  return (
    <group position={pos3D}>
      <mesh>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color={colorMap[impact.type] || '#ffffff'} />
      </mesh>
      <Html position={[0, 0.05, 0]} center>
        <div className="bg-[#141414] border border-[#333] text-gray-200 px-1.5 py-0.5 rounded text-[9px] font-mono shadow whitespace-nowrap pointer-events-none">
          {impact.id}: {impact.type} ({impact.heightFromFloor}m)
        </div>
      </Html>
    </group>
  );
}