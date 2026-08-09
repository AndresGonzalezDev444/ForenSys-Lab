import { useEffect } from 'react';
import { useSceneStore } from '../store/useSceneStore';

export function useKeyboardShortcuts() {
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const removeObject = useSceneStore((state) => state.removeObject);
  const setTransformMode = useSceneStore((state) => state.setTransformMode);
  const toggleVisibility = useSceneStore((state) => state.toggleVisibility);
  const toggleLock = useSceneStore((state) => state.toggleLock);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'delete':
        case 'backspace':
          if (selectedObjectId) removeObject(selectedObjectId);
          break;
        case 'g':
          setTransformMode('translate');
          break;
        case 'r':
          setTransformMode('rotate');
          break;
        case 'h':
          if (selectedObjectId) toggleVisibility(selectedObjectId);
          break;
        case 'l':
          if (selectedObjectId) toggleLock(selectedObjectId);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, removeObject, setTransformMode, toggleVisibility, toggleLock]);
}
