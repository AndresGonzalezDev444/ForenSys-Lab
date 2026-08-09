import { useSceneStore } from '../../store/useSceneStore';
import type { SceneObject } from '../../types/scene';

export function LeftPanel() {
  const objects = useSceneStore((state) => state.objects);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const setSelectedObject = useSceneStore((state) => state.setSelectedObject);
  const toggleVisibility = useSceneStore((state) => state.toggleVisibility);
  const toggleLock = useSceneStore((state) => state.toggleLock);
  const removeObject = useSceneStore((state) => state.removeObject);

  const objectsByLayer = Object.values(objects).reduce((acc, obj) => {
    if (!acc[obj.layer]) acc[obj.layer] = [];
    acc[obj.layer].push(obj);
    return acc;
  }, {} as Record<string, SceneObject[]>);

  return (
    <aside className="w-64 bg-[#141414] border-r border-[#333] flex flex-col shrink-0">
      <div className="p-3 border-b border-[#333] text-xs font-bold uppercase tracking-wider text-gray-400">
        Explorador de Proyecto
      </div>
      <div className="flex-1 p-2 text-sm overflow-y-auto">
        {Object.entries(objectsByLayer).map(([layer, objs]) => (
          <div key={layer} className="mb-4">
            <div className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider px-2">
              {layer}
            </div>
            <ul className="space-y-1">
              {objs.map((obj) => (
                <li 
                  key={obj.id}
                  onClick={() => setSelectedObject(obj.id)}
                  className={`px-2 py-1.5 flex items-center justify-between cursor-pointer rounded text-xs transition-colors group ${
                    selectedObjectId === obj.id 
                      ? 'bg-[#2a2d3d] text-[#4a90e2]' 
                      : 'text-gray-300 hover:bg-[#1f1f1f]'
                  }`}
                >
                  <span className="truncate flex-1">{obj.name}</span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(obj.id); }}
                      className={`text-[10px] ${obj.visible ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}
                      title="Visibilidad"
                    >
                      {obj.visible ? '👁' : '🕶'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleLock(obj.id); }}
                      className={`text-[10px] ${obj.locked ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                      title="Bloquear"
                    >
                      {obj.locked ? '🔒' : '🔓'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
                      className="text-[10px] text-gray-400 hover:text-red-500"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}