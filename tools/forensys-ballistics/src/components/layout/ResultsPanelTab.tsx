import { useSceneStore } from '../../store/useSceneStore';
import { Vector3 } from 'three';
import { reconstructTrajectory } from '../../core/math/ballisticReconstruction';
import { simulateParabolicTrajectory, calculateKineticEnergy } from '../../core/math/ballisticSimulation';
import { AMMUNITION_DB } from '../../core/data/ammunitionDatabase';

export function ResultsPanelTab() {
  const objects = useSceneStore((state) => state.objects);
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
            const startArr = (traj.properties.start as number[]) || [0, 0, 0];
            const endArr = (traj.properties.end as number[]) || [0, 0, 0];
            const start = new Vector3(...startArr);
            const end = new Vector3(...endArr);
            const stats = reconstructTrajectory(start, end);
            
            const ammoId = traj.properties.ammoId as string;
            const ammo = ammoId ? AMMUNITION_DB[ammoId] : null;
            let simResult = null;
            let initialEnergy = 0;

            if (ammo) {
              initialEnergy = calculateKineticEnergy(ammo.massGrams, ammo.muzzleVelocityMS);
              simResult = simulateParabolicTrajectory({
                startPos: [start.x, start.y, start.z],
                azimuthDeg: stats.azimuth,
                elevationDeg: stats.elevation,
                velocityMS: ammo.muzzleVelocityMS,
                massGrams: ammo.massGrams
              });
            }

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
                    <span className="text-gray-500 block">Vector Directriz:</span>
                    <span className="text-[10px] text-gray-400">
                      [{stats.vector.join(', ')}]
                    </span>
                  </div>
                </div>

                {ammo && simResult && (
                  <div className="mt-2 pt-2 border-t border-[#222] grid grid-cols-2 gap-2 text-gray-300">
                    <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Simulación: {ammo.name}
                    </div>
                    <div>
                      <span className="text-gray-500 block">Energía en Boca:</span>
                      <span className="font-bold text-orange-400">{initialEnergy.toFixed(1)} J</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Alcance Máx. Estimado:</span>
                      <span className="font-bold text-orange-400">{simResult.maxRange.toFixed(1)} m</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Tiempo de Vuelo:</span>
                      <span className="font-bold text-white">{simResult.timeOfFlight.toFixed(3)} s</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Altura Máx (Ordenada):</span>
                      <span className="font-bold text-white">{simResult.maxHeight.toFixed(2)} m</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}