import { useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { ResultsPanelTab } from './ResultsPanelTab';

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState('Resultados');
  const [newObs, setNewObs] = useState('');
  
  const measurements = useSceneStore((state) => state.measurements);
  const isMeasuring = useSceneStore((state) => state.isMeasuring);
  const toggleMeasureMode = useSceneStore((state) => state.toggleMeasureMode);
  const clearMeasurements = useSceneStore((state) => state.clearMeasurements);
  const objects = useSceneStore((state) => state.objects);
  const observations = useSceneStore((state) => state.observations);
  const addObservation = useSceneStore((state) => state.addObservation);

  const tabs = ['Datos', 'Observaciones', 'Resultados', 'Mediciones'];

  const handleAddObs = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newObs.trim()) {
      addObservation(newObs.trim());
      setNewObs('');
    }
  };

  return (
    <footer className="h-56 bg-[#141414] border-t border-[#333] flex flex-col shrink-0">
      <div className="flex items-center justify-between border-b border-[#333] bg-[#1a1a1a] px-2">
        <div className="flex">
          {tabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium border-r border-[#333] transition-colors ${
                activeTab === tab ? 'bg-[#2a2d3d] text-white' : 'text-gray-400 hover:bg-[#222]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Mediciones' && (
          <div className="flex items-center gap-2 px-2">
            <button 
              onClick={toggleMeasureMode}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                isMeasuring ? 'bg-amber-600 text-white animate-pulse' : 'bg-[#2a2d3d] text-gray-200 hover:bg-[#3a3d4d]'
              }`}
            >
              {isMeasuring ? 'Seleccione 2 puntos...' : '+ Nueva Medición'}
            </button>
            <button 
              onClick={clearMeasurements}
              className="px-2 py-1 text-xs bg-[#222] text-gray-400 hover:text-red-400 rounded transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        {activeTab === 'Datos' && (
          <div className="p-3 text-xs">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-[#333] text-gray-500">
                  <th className="p-2">ID</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Capa</th>
                  <th className="p-2">Posición (X,Y,Z)</th>
                  <th className="p-2">Vis.</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(objects).map(obj => (
                  <tr key={obj.id} className="border-b border-[#1a1a1a] text-gray-300 hover:bg-[#141414]">
                    <td className="p-2 text-blue-400">{obj.id}</td>
                    <td className="p-2">{obj.name}</td>
                    <td className="p-2">{obj.layer}</td>
                    <td className="p-2">[{obj.position.map(n => n.toFixed(2)).join(', ')}]</td>
                    <td className="p-2">{obj.visible ? '👁' : '🕶'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Observaciones' && (
          <div className="flex flex-col h-full p-3 text-xs">
            <div className="flex-1 overflow-y-auto mb-2 space-y-1">
              {observations.length === 0 ? (
                <div className="text-gray-500 italic">No hay observaciones registradas en este caso.</div>
              ) : (
                observations.map((obs, i) => (
                  <div key={i} className="text-green-400 font-mono">{obs}</div>
                ))
              )}
            </div>
            <input
              type="text"
              value={newObs}
              onChange={(e) => setNewObs(e.target.value)}
              onKeyDown={handleAddObs}
              placeholder="Escriba una observación y presione Enter..."
              className="w-full bg-[#1e1e1e] border border-[#333] text-xs text-white p-2 rounded focus:outline-none focus:border-[#4a90e2] font-mono"
            />
          </div>
        )}

        {activeTab === 'Mediciones' && (
          <div className="p-3 text-xs">
            {measurements.length === 0 ? (
              <div className="text-gray-500 italic">No hay mediciones registradas. Haga clic en "+ Nueva Medición" para seleccionar puntos.</div>
            ) : (
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#333] text-gray-500">
                    <th className="p-2">ID</th>
                    <th className="p-2">Distancia (m)</th>
                    <th className="p-2">ΔX</th>
                    <th className="p-2">ΔY</th>
                    <th className="p-2">ΔZ</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m) => (
                    <tr key={m.id} className="border-b border-[#1a1a1a] text-gray-300 hover:bg-[#141414]">
                      <td className="p-2 text-amber-400">{m.id}</td>
                      <td className="p-2 font-bold">{m.distance} m</td>
                      <td className="p-2">{m.deltaX}</td>
                      <td className="p-2">{m.deltaY}</td>
                      <td className="p-2">{m.deltaZ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'Resultados' && <ResultsPanelTab />}
      </div>
    </footer>
  );
}