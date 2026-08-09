import { useSceneStore } from '../../store/useSceneStore';

export function Toolbar() {
  const addObject = useSceneStore((state) => state.addObject);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const removeObject = useSceneStore((state) => state.removeObject);
  const duplicateObject = useSceneStore((state) => state.duplicateObject);

  const handleAddWall = () => {
    addObject({
      id: `wall-${Date.now()}`,
      name: 'Nuevo Muro',
      type: 'parametric_wall',
      layer: 'Paredes',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      properties: { length: 2, height: 2, thickness: 0.1, color: '#888888' },
      impacts: []
    });
  };

  const handleAddManikin = () => {
    addObject({
      id: `manikin-${Date.now()}`,
      name: 'Nuevo Maniquí',
      type: 'manikin',
      layer: 'Personas',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      properties: { height: 1.75, posture: 'standing', color: '#8e8e93' },
      impacts: []
    });
  };

  const handleAddTrajectory = () => {
    addObject({
      id: `traj-${Date.now()}`,
      name: 'Nueva Trayectoria',
      type: 'trajectory',
      layer: 'Trayectorias',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      properties: { start: [0, 1, 0], end: [1, 1, 1], radius: 0.02, color: '#ff3b30' }
    });
  };

  return (
    <div className="h-10 bg-[#141414] border-b border-[#333] flex items-center px-4 gap-2 shadow-sm shrink-0">
      <button onClick={handleAddWall} className="px-3 py-1 text-xs bg-[#2a2d3d] text-gray-200 hover:bg-[#3a3d4d] rounded font-medium border border-[#333]">
        + Muro
      </button>
      <button onClick={handleAddManikin} className="px-3 py-1 text-xs bg-[#2a2d3d] text-gray-200 hover:bg-[#3a3d4d] rounded font-medium border border-[#333]">
        + Maniquí
      </button>
      <button onClick={handleAddTrajectory} className="px-3 py-1 text-xs bg-[#2a2d3d] text-gray-200 hover:bg-[#3a3d4d] rounded font-medium border border-[#333]">
        + Trayectoria
      </button>
      
      <div className="w-px h-5 bg-[#333] mx-2"></div>
      
      <button 
        onClick={() => selectedObjectId && duplicateObject(selectedObjectId)} 
        disabled={!selectedObjectId}
        className="px-3 py-1 text-xs bg-[#222] text-gray-400 hover:text-white rounded disabled:opacity-50"
      >
        Duplicar
      </button>
      <button 
        onClick={() => selectedObjectId && removeObject(selectedObjectId)} 
        disabled={!selectedObjectId}
        className="px-3 py-1 text-xs bg-[#222] text-gray-400 hover:text-red-400 rounded disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}
