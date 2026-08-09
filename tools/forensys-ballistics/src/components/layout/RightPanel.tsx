import { useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import type { ImpactData } from '../../core/math/impactCalculator';
import { AMMUNITION_DB } from '../../core/data/ammunitionDatabase';

export function RightPanel() {
  const objects = useSceneStore((state) => state.objects);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const updateObjectTransform = useSceneStore((state) => state.updateObjectTransform);
  const updateObjectProperties = useSceneStore((state) => state.updateObjectProperties);
  const transformMode = useSceneStore((state) => state.transformMode);
  const setTransformMode = useSceneStore((state) => state.setTransformMode);
  const addImpact = useSceneStore((state) => state.addImpact);
  const removeImpact = useSceneStore((state) => state.removeImpact);
  const renameObject = useSceneStore((state) => state.renameObject);

  const [newImpact, setNewImpact] = useState<{
    heightFromFloor: string;
    distanceFromMidline: string;
    type: ImpactData['type'];
    anatomicalRegion: string;
    description: string;
  }>({
    heightFromFloor: '1.20',
    distanceFromMidline: '0.00',
    type: 'Entrada',
    anatomicalRegion: 'Tórax',
    description: '',
  });

  if (!selectedObjectId || !objects[selectedObjectId]) {
    return (
      <aside className="w-72 bg-[#141414] border-l border-[#333] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#333] text-xs font-bold uppercase tracking-wider text-gray-400">Inspector</div>
        <div className="flex-1 p-4 text-xs text-gray-500 italic">
          Seleccione un objeto en la escena...
        </div>
      </aside>
    );
  }

  const obj = objects[selectedObjectId];
  const impacts = obj.impacts ?? [];

  const handlePositionChange = (axis: number, value: string) => {
    const newPos = [...obj.position] as [number, number, number];
    newPos[axis] = parseFloat(value) || 0;
    updateObjectTransform(obj.id, newPos, obj.rotation);
  };

  const handleRotationChange = (axis: number, value: string) => {
    const deg = parseFloat(value) || 0;
    const newRot = [...obj.rotation] as [number, number, number];
    newRot[axis] = (deg * Math.PI) / 180;
    updateObjectTransform(obj.id, obj.position, newRot);
  };

  const handlePropertyChange = (key: string, value: unknown) => {
    updateObjectProperties(obj.id, { [key]: value });
  };

  const handleTrajectoryPointChange = (point: 'start' | 'end', axis: number, value: string) => {
    const arr = [...(obj.properties[point] as [number, number, number] || [0,0,0])];
    arr[axis] = parseFloat(value) || 0;
    handlePropertyChange(point, arr);
  };

  const handleAddImpact = () => {
    const height = parseFloat(newImpact.heightFromFloor);
    const dist = parseFloat(newImpact.distanceFromMidline);
    if (Number.isNaN(height) || Number.isNaN(dist)) return;

    const impact: ImpactData = {
      id: `imp_${Date.now()}`,
      type: newImpact.type,
      anatomicalRegion: newImpact.anatomicalRegion || 'No especificada',
      heightFromFloor: Number(height.toFixed(3)),
      distanceFromMidline: Number(dist.toFixed(3)),
      description: newImpact.description || '',
    };
    addImpact(obj.id, impact);
  };

  const rotationDegrees = obj.rotation.map((r) => Number(((r * 180) / Math.PI).toFixed(1))) as [number, number, number];

  return (
    <aside className="w-72 bg-[#141414] border-l border-[#333] flex flex-col shrink-0">
      <div className="p-3 border-b border-[#333] text-xs font-bold uppercase tracking-wider text-gray-400">Inspector</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <div className="text-[10px] uppercase text-gray-500 mb-1 font-bold">Identificación</div>
          <input
            type="text"
            value={obj.name}
            onChange={(e) => renameObject(obj.id, e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#333] text-sm text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2] mb-1"
          />
          <div className="text-[10px] text-gray-600 font-mono">ID: {obj.id} ({obj.type})</div>
        </div>

        <hr className="border-[#333]" />

        {obj.type !== 'trajectory' && (
          <>
            <div>
              <div className="text-[10px] uppercase text-gray-500 mb-3 font-bold">Posición Global (Metros)</div>
              <div className="flex gap-2">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <div key={axis} className="flex-1 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-1">{axis}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={obj.position[i]}
                      onChange={(e) => handlePositionChange(i, e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-gray-500 mb-3 font-bold">Rotación Global (Grados)</div>
              <div className="flex gap-2">
                {['RX', 'RY', 'RZ'].map((axis, i) => (
                  <div key={axis} className="flex-1 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-1">{axis}</label>
                    <input
                      type="number"
                      step="1"
                      value={rotationDegrees[i]}
                      onChange={(e) => handleRotationChange(i, e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-[#333]" />
            <div>
              <div className="text-[10px] uppercase text-gray-500 mb-3 font-bold">Modo de Manipulación 3D</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTransformMode('translate')}
                  className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${
                    transformMode === 'translate'
                      ? 'bg-[#4a90e2] text-white'
                      : 'bg-[#1e1e1e] text-gray-400 border border-[#333] hover:text-white'
                  }`}
                >
                  Mover
                </button>
                <button
                  onClick={() => setTransformMode('rotate')}
                  className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${
                    transformMode === 'rotate'
                      ? 'bg-[#4a90e2] text-white'
                      : 'bg-[#1e1e1e] text-gray-400 border border-[#333] hover:text-white'
                  }`}
                >
                  Rotar
                </button>
              </div>
            </div>
            <hr className="border-[#333]" />
          </>
        )}

        {obj.type === 'trajectory' && (
          <div>
            <div className="text-[10px] uppercase text-gray-500 mb-3 font-bold">Puntos de Trayectoria</div>
            
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Origen (Start)</div>
              <div className="flex gap-2">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <input
                    key={axis} type="number" step="0.1"
                    value={(obj.properties.start as number[])?.[i] || 0}
                    onChange={(e) => handleTrajectoryPointChange('start', i, e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
                  />
                ))}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Destino (End)</div>
              <div className="flex gap-2">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <input
                    key={axis} type="number" step="0.1"
                    value={(obj.properties.end as number[])?.[i] || 0}
                    onChange={(e) => handleTrajectoryPointChange('end', i, e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
                  />
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[10px] text-gray-400 mb-1 block">Munición (Simulación)</label>
              <select
                value={obj.properties.ammoId as string || ''}
                onChange={(e) => handlePropertyChange('ammoId', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
              >
                <option value="">(Sin Simulación Física)</option>
                {Object.values(AMMUNITION_DB).map(ammo => (
                  <option key={ammo.id} value={ammo.id}>{ammo.name}</option>
                ))}
              </select>
            </div>

            {Boolean(obj.properties.ammoId) && AMMUNITION_DB[obj.properties.ammoId as string] && (
              <div className="bg-[#1a1a1a] p-2 rounded border border-[#333] text-[10px] text-gray-400 space-y-1">
                <div>Velocidad Inicial: <span className="text-white">{AMMUNITION_DB[obj.properties.ammoId as string].muzzleVelocityMS} m/s</span></div>
                <div>Masa: <span className="text-white">{AMMUNITION_DB[obj.properties.ammoId as string].massGrams} g ({AMMUNITION_DB[obj.properties.ammoId as string].massGrains} gr)</span></div>
                <div>Coeficiente Balístico: <span className="text-white">{AMMUNITION_DB[obj.properties.ammoId as string].ballisticCoefficient}</span></div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <label className="text-xs text-gray-400">Color</label>
              <input
                type="color"
                value={obj.properties.color as string || '#ff3b30'}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {obj.type === 'parametric_wall' && (
          <div>
            <div className="text-[10px] uppercase text-gray-500 mb-3 font-bold">Dimensiones (Metros)</div>
            <div className="space-y-2">
              {[
                { label: 'Longitud', key: 'length' },
                { label: 'Altura', key: 'height' },
                { label: 'Espesor', key: 'thickness' }
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">{label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={typeof obj.properties[key] === 'number' ? (obj.properties[key] as number) : 0}
                    onChange={(e) => handlePropertyChange(key, parseFloat(e.target.value) || 0)}
                    className="w-24 bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded text-right focus:outline-none focus:border-[#4a90e2]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {obj.type === 'manikin' && (
          <>
            <div>
              <div className="text-[10px] uppercase text-gray-500 mb-3 font-bold">Propiedades Anatómicas</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Altura (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={typeof obj.properties.height === 'number' ? obj.properties.height : 1.75}
                    onChange={(e) => handlePropertyChange('height', parseFloat(e.target.value) || 1.75)}
                    className="w-24 bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded text-right focus:outline-none focus:border-[#4a90e2]"
                  />
                </div>
                <div className="space-y-2 pt-2 border-t border-[#333]">
                  <div className="text-[10px] text-gray-400 mb-1">Visualización de Planos</div>
                  <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                    <span>Plano Sagital</span>
                    <input
                      type="checkbox"
                      checked={!!obj.properties.showSagittal}
                      onChange={(e) => handlePropertyChange('showSagittal', e.target.checked)}
                      className="accent-[#4a90e2]"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                    <span>Plano Coronal</span>
                    <input
                      type="checkbox"
                      checked={!!obj.properties.showCoronal}
                      onChange={(e) => handlePropertyChange('showCoronal', e.target.checked)}
                      className="accent-[#34c759]"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                    <span>Plano Transversal</span>
                    <input
                      type="checkbox"
                      checked={!!obj.properties.showTransverse}
                      onChange={(e) => handlePropertyChange('showTransverse', e.target.checked)}
                      className="accent-[#ffcc00]"
                    />
                  </label>
                </div>
              </div>
            </div>

            <hr className="border-[#333]" />

            <div>
              <div className="text-[10px] uppercase text-gray-500 mb-3 font-bold">Registro de Impactos</div>

              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-1">Altura (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newImpact.heightFromFloor}
                      onChange={(e) => setNewImpact((p) => ({ ...p, heightFromFloor: e.target.value }))}
                      className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-1">Dist. Línea Media (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newImpact.distanceFromMidline}
                      onChange={(e) => setNewImpact((p) => ({ ...p, distanceFromMidline: e.target.value }))}
                      className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-400 mb-1">Tipo</label>
                  <select
                    value={newImpact.type}
                    onChange={(e) => setNewImpact((p) => ({ ...p, type: e.target.value as ImpactData['type'] }))}
                    className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
                  >
                    <option value="Entrada">Entrada</option>
                    <option value="Salida">Salida</option>
                    <option value="Rozamiento">Rozamiento</option>
                    <option value="Impacto">Impacto</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-400 mb-1">Región Anatómica</label>
                  <input
                    type="text"
                    value={newImpact.anatomicalRegion}
                    onChange={(e) => setNewImpact((p) => ({ ...p, anatomicalRegion: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded focus:outline-none focus:border-[#4a90e2]"
                  />
                </div>

                <button
                  onClick={handleAddImpact}
                  className="w-full py-1.5 text-xs bg-[#2a2d3d] text-gray-200 hover:bg-[#3a3d4d] rounded font-medium transition-colors border border-[#333]"
                >
                  + Añadir Impacto
                </button>
              </div>

              {impacts.length > 0 && (
                <div className="space-y-1.5">
                  {impacts.map((imp) => (
                    <div key={imp.id} className="flex items-center justify-between bg-[#1e1e1e] border border-[#333] rounded px-2 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              imp.type === 'Entrada'
                                ? '#ff3b30'
                                : imp.type === 'Salida'
                                  ? '#34c759'
                                  : imp.type === 'Rozamiento'
                                    ? '#ffcc00'
                                    : '#007aff',
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] text-gray-300 truncate">
                            {imp.anatomicalRegion} — {imp.type}
                          </div>
                          <div className="text-[9px] text-gray-500 font-mono">
                            H:{imp.heightFromFloor}m | D:{imp.distanceFromMidline}m
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeImpact(obj.id, imp.id)}
                        className="text-[10px] text-gray-500 hover:text-red-400 px-1 shrink-0"
                        title="Eliminar impacto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
