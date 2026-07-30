import { useSceneStore } from '../../store/useSceneStore';

export function LeftPanel() {
  const objects = useSceneStore((state) => state.objects);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const setSelectedObject = useSceneStore((state) => state.setSelectedObject);

  return (
    <aside className="w-64 bg-[#141414] border-r border-[#333] flex flex-col shrink-0">
      <div className="p-3 border-b border-[#333] text-xs font-bold uppercase tracking-wider text-gray-400">
        Explorador de Proyecto
      </div>
      <div className="flex-1 p-2 text-sm overflow-y-auto">
        <div className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider px-2 mt-2">
          Objetos en Escena
        </div>
        <ul className="space-y-1">
          {Object.values(objects).map((obj) => (
            <li 
              key={obj.id}
              onClick={() => setSelectedObject(obj.id)}
              className={`px-2 py-1.5 cursor-pointer rounded text-xs transition-colors ${
                selectedObjectId === obj.id 
                  ? 'bg-[#2a2d3d] text-[#4a90e2]' 
                  : 'text-gray-300 hover:bg-[#1f1f1f]'
              }`}
            >
              {obj.name}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}