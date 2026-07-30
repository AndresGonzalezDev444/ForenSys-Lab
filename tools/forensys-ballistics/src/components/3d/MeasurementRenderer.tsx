// src/components/3d/MeasurementRenderer.tsx
import { Html } from '@react-three/drei';
import { useSceneStore } from '../../store/useSceneStore';
import * as THREE from 'three';

export function MeasurementRenderer() {
  const measurements = useSceneStore((state) => state.measurements);

  return (
    <>
      {measurements.map((m) => {
        const v1 = new THREE.Vector3(...m.p1);
        const v2 = new THREE.Vector3(...m.p2);
        const midPoint = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

        return (
          <group key={m.id}>
            {/* Línea de medición CAD */}
            <line>
              <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([v1, v2])} />
              <lineBasicMaterial attach="material" color="#ffcc00" linewidth={3} />
            </line>

            {/* Etiqueta flotante con la distancia exacta */}
            <Html position={[midPoint.x, midPoint.y + 0.1, midPoint.z]} center>
              <div className="bg-[#141414] border border-[#ffcc00] text-[#ffcc00] px-2 py-0.5 rounded text-[10px] font-mono shadow-md whitespace-nowrap pointer-events-none">
                {m.distance} m (ΔX:{m.deltaX}, ΔY:{m.deltaY}, ΔZ:{m.deltaZ})
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}