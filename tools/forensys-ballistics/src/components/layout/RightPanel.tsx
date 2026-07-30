// src/components/layout/RightPanel.tsx (Fase 3: + modo transformación + rotación)
import { useSceneStore } from '../../store/useSceneStore';

export function RightPanel() {
  const objects = useSceneStore((state) => state.objects);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const updateObjectTransform = useSceneStore((state) => state.updateObjectTransform);
  const updateObjectProperties = useSceneStore((state) => state.updateObjectProperties);
  const transformMode = useSceneStore((state) => state.transformMode);
  const setTransformMode = useSceneStore((state) => state.setTransformMode);

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

  const rotationDegrees = obj.rotation.map((r) => Number(((r * 180) / Math.PI).toFixed(1))) as [number, number, number];

  return (
    <aside className="w-72 bg-[#141414] border-l border-[#333] flex flex-col shrink-0">
      <div className="p-3 border-b border-[#333] text-xs font-bold uppercase tracking-wider text-gray-400">Inspector</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <div className="text-[10px] uppercase text-gray-500 mb-1 font-bold">Identificación</div>
          <div className="text-sm text-gray-200">{obj.name}</div>
          <div className="text-[10px] text-gray-600 font-mono mt-1">ID: {obj.id} ({obj.type})</div>
        </div>

        <hr className="border-[#333]" />

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
                    value={typeof obj.properties[key] === 'number' ? obj.properties[key] : 0}
                    onChange={(e) => handlePropertyChange(key, parseFloat(e.target.value) || 0)}
                    className="w-24 bg-[#1e1e1e] border border-[#333] text-xs text-white p-1.5 rounded text-right focus:outline-none focus:border-[#4a90e2]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {obj.type === 'manikin' && (
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
        )}
      </div>
    </aside>
  );
}
