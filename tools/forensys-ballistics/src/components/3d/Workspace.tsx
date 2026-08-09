// src/components/3d/Workspace.tsx (Fase 4: + renderizado dinámico de impactos)
import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useSceneStore } from '../../store/useSceneStore';
import { ParametricWall } from './ParametricWall';
import { TrajectoryObject } from './TrajectoryObject';
import { AnatomicalManikin } from './AnatomicalManikin';
import { MeasurementRenderer } from './MeasurementRenderer';
import { ImpactMarkerRenderer } from './ImpactMarkerRenderer';
import { TransformableObject } from './TransformableObject';
import type { ThreeEvent } from '@react-three/fiber';

export function Workspace() {
  const objects = useSceneStore((state) => state.objects);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const setSelectedObject = useSceneStore((state) => state.setSelectedObject);
  const isMeasuring = useSceneStore((state) => state.isMeasuring);
  const addMeasurementPoint = useSceneStore((state) => state.addMeasurementPoint);
  const [transformDragging, setTransformDragging] = useState(false);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (isMeasuring) {
      e.stopPropagation();
      const point = e.point;
      addMeasurementPoint([
        Number(point.x.toFixed(3)),
        Number(point.y.toFixed(3)),
        Number(point.z.toFixed(3)),
      ]);
    }
  };

  const handleDraggingChange = useCallback((dragging: boolean) => {
    setTransformDragging(dragging);
  }, []);

  return (
    <div className="w-full h-full bg-[#1e1e1e]" onClick={() => !isMeasuring && setSelectedObject(null)}>
      <Canvas orthographic={false} camera={{ position: [8, 8, 8], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />

        <Grid
          infiniteGrid
          fadeDistance={50}
          sectionSize={1}
          sectionColor="#555"
          cellSize={0.1}
          cellColor="#333"
        />
        <axesHelper args={[5]} />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ff3b30', '#34c759', '#007aff']} labelColor="white" />
        </GizmoHelper>

        <group onPointerDown={handlePointerDown}>
          {Object.values(objects).map((obj) => {
            if (!obj.visible) return null;

            switch (obj.type) {
              case 'parametric_wall':
                return (
                  <TransformableObject
                    key={obj.id}
                    objectData={obj}
                    isSelected={selectedObjectId === obj.id}
                    onSelect={setSelectedObject}
                    onDraggingChange={handleDraggingChange}
                  >
                    <ParametricWall objectData={obj} isSelected={selectedObjectId === obj.id} />
                  </TransformableObject>
                );
              case 'trajectory':
                return (
                  <TrajectoryObject
                    key={obj.id}
                    objectData={obj}
                    isSelected={selectedObjectId === obj.id}
                    onSelect={setSelectedObject}
                  />
                );
              case 'manikin':
                return (
                  <TransformableObject
                    key={obj.id}
                    objectData={obj}
                    isSelected={selectedObjectId === obj.id}
                    onSelect={setSelectedObject}
                    onDraggingChange={handleDraggingChange}
                  >
                    <AnatomicalManikin objectData={obj} isSelected={selectedObjectId === obj.id} />
                  </TransformableObject>
                );
              default:
                return null;
            }
          })}
        </group>

        {/* Renderizado dinámico de impactos en espacio mundial */}
        {Object.values(objects).map((obj) =>
          obj.impacts?.map((impact) => (
            <ImpactMarkerRenderer key={impact.id} impact={impact} targetObject={obj} />
          ))
        )}

        <MeasurementRenderer />

        <OrbitControls makeDefault enableDamping={false} enabled={!transformDragging} />
      </Canvas>
    </div>
  );
}
