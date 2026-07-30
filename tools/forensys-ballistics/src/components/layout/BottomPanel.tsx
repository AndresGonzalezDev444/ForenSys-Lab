// src/components/layout/BottomPanel.tsx (Actualizado para integrar la pestaña de Resultados y Trayectorias)
import { useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { ResultsPanelTab } from './ResultsPanelTab';

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState('Datos');
  const measurements = useSceneStore((state) => state.measurements);
  const isMeasuring = useSceneStore((state) => state.isMeasuring);
  const toggleMeasureMode = useSceneStore((state) => state.toggleMeasureMode);
  const clearMeasurements = useSceneStore((state) => state.clearMeasurements);

  const tabs = ['Datos', 'Observaciones', 'Resultados', 'Mediciones', 'Trayectorias'];

  return (
    <footer className="h-48 bg-[#141414] border-t border-[#333] flex flex-col shrink-0">
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
        {activeTab === 'Mediciones' ? (
          <div className="p-3 text-xs">
            {measurements.length === 0 ? (
              <div className="text-gray-500 italic">No hay mediciones registradas. Haga clic en "+ Nueva Medición" para seleccionar puntos en el espacio 3D.</div>
            ) : (
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#333] text-gray-500">
                    <th className="p-2">ID</th>
                    <th className="p-2">Distancia (m)</th>
                    <th className="p-2">ΔX</th>
                    <th className="p-2">ΔY</th>
                    <th className="p-2">ΔZ</th>
                    <th className="p-2">Ángulo Horiz.</th>
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
                      <td className="p-2">{m.horizontalAngle}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === 'Resultados' || activeTab === 'Trayectorias' ? (
          <ResultsPanelTab />
        ) : (
          <div className="p-3 text-xs text-green-500 font-mono">
            [SISTEMA] Pestaña [{activeTab}] activa. Módulo pericial operando con precisión métrica estándar.
          </div>
        )}
      </div>
    </footer>
  );
}