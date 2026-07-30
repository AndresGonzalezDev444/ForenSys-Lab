// src/components/layout/ResultsPanelTab.tsx
import { useSceneStore } from '../../store/useSceneStore';
import { Vector3 } from 'three';
import { reconstructTrajectory } from '../../core/math/ballisticReconstruction';

export function ResultsPanelTab() {
  const objects = useSceneStore((state) => state.objects);

  // Filtrar o buscar trayectorias para calcular reportes balísticos forenses
  const trajectories = Object.values(objects).filter((obj) => obj.type === 'trajectory');

  return (
    <div className="p-3 space-y-4 font-mono text-xs">
      <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
        Informe Pericial de Reconstrucción Balística 3D
      </div>

      {trajectories.length === 0 ? (
        <div className="text-gray-500 italic">No hay vectores de trayectoria activos en la escena.</div>
      ) : (
        <div className="space-y-3">
          {trajectories.map((traj) => {
            const start = new Vector3(...(traj.properties.start || [0, 0, 0]));
            const end = new Vector3(...(traj.properties.end || [0, 0, 0]));
            const stats = reconstructTrajectory(start, end);

            return (
              <div key={traj.id} className="bg-[#141414] border border-[#333] p-3 rounded space-y-2">
                <div className="flex items-center justify-between border-b border-[#222] pb-1.5">
                  <span className="font-bold text-amber-400">{traj.name}</span>
                  <span className="text-[10px] text-gray-400">ID: {traj.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>
                    <span className="text-gray-500 block">Longitud Vector:</span>
                    <span className="font-bold text-white">{stats.distance} metros</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Ángulo Azimut (Rumbo):</span>
                    <span className="font-bold text-white">{stats.azimuth}°</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Ángulo de Elevación:</span>
                    <span className="font-bold text-white">{stats.elevation}°</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Vector Directriz (X, Y, Z):</span>
                    <span className="text-[10px] text-gray-400">
                      [{stats.vector.join(', ')}]
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}