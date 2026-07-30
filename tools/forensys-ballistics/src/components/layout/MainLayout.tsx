// src/components/layout/MainLayout.tsx
import { Workspace } from '../3d/Workspace';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';

export function MainLayout() {
  return (
    <div className="flex flex-col h-screen w-full bg-[#0d0d0d] text-gray-300 font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center px-4 shrink-0 shadow-sm z-10">
        <h1 className="text-sm font-semibold tracking-wider text-white">ForenSys Ballistics</h1>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel */}
        <LeftPanel />

        {/* Center - 3D Workspace */}
        <main className="flex-1 relative">
          <Workspace />
        </main>

        {/* Right Panel */}
        <RightPanel />

      </div>

      {/* Bottom Panel - Data & Logs */}
      <footer className="h-48 bg-[#141414] border-t border-[#333] flex flex-col shrink-0">
        <div className="flex border-b border-[#333] bg-[#1a1a1a]">
          {['Datos', 'Observaciones', 'Resultados', 'Mediciones', 'Trayectorias'].map((tab, i) => (
            <button key={tab} className={`px-4 py-2 text-xs font-medium border-r border-[#333] transition-colors ${i === 0 ? 'bg-[#2a2d3d] text-white' : 'text-gray-400 hover:bg-[#222]'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 p-3 text-xs text-green-500 font-mono overflow-y-auto bg-[#0a0a0a]">
          [SISTEMA] Motor 3D inicializado correctamente.
          <br />
          [SISTEMA] Workspace listo. 1 Unidad = 1 Metro.
        </div>
      </footer>
    </div>
  );
}