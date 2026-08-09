// src/components/layout/MainLayout.tsx
import { Workspace } from '../3d/Workspace';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { BottomPanel } from './BottomPanel';
import { Toolbar } from './Toolbar';
import { useSceneStore } from '../../store/useSceneStore';
import { exportToPDF } from '../../core/export/pdfExport';

export function MainLayout() {
  const caseInfo = useSceneStore((state) => state.caseInfo);
  const exportCaseJSON = useSceneStore((state) => state.exportCaseJSON);
  const objects = useSceneStore((state) => state.objects);
  const measurements = useSceneStore((state) => state.measurements);
  const observations = useSceneStore((state) => state.observations);

  const handleExportJSON = () => {
    const json = exportCaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseInfo.id}.json`;
    a.click();
  };

  const handleExportPDF = () => {
    exportToPDF(caseInfo, objects, measurements, observations);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0d0d0d] text-gray-300 font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold tracking-wider text-white">ForenSys Ballistics</h1>
          <div className="h-4 w-px bg-[#333]"></div>
          <span className="text-xs text-gray-400 font-mono">{caseInfo.id} - {caseInfo.name}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportJSON} className="px-3 py-1 text-xs bg-[#2a2d3d] text-gray-200 hover:bg-[#3a3d4d] rounded font-medium border border-[#333]">
            Exportar JSON
          </button>
          <button onClick={handleExportPDF} className="px-3 py-1 text-xs bg-[#b33a3a] text-white hover:bg-[#d34a4a] rounded font-medium border border-[#333]">
            Generar PDF
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar />

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

      {/* Bottom Panel */}
      <BottomPanel />
    </div>
  );
}