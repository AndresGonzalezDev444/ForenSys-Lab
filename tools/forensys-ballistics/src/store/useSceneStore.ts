// src/store/useSceneStore.ts (Actualizado con el Maniquí por defecto)
import { create } from 'zustand';
import { Vector3 } from 'three';
import type { SceneObject } from '../types/scene';
import { calculateMeasurement, type MeasurementResult } from '../core/math/measurements';

interface SceneState {
  objects: Record<string, SceneObject>;
  selectedObjectId: string | null;
  activeLayer: string;
  measurements: MeasurementResult[];
  isMeasuring: boolean;
  measurePoints: [number, number, number][];

  addObject: (obj: SceneObject) => void;
  updateObjectTransform: (id: string, position: [number, number, number], rotation: [number, number, number]) => void;
  updateObjectProperties: (id: string, properties: Record<string, any>) => void;
  setSelectedObject: (id: string | null) => void;
  toggleMeasureMode: () => void;
  addMeasurementPoint: (point: [number, number, number]) => void;
  clearMeasurements: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  objects: {
    'wall-1': {
      id: 'wall-1',
      name: 'Pared Norte',
      type: 'parametric_wall',
      layer: 'Paredes',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      properties: { length: 5, height: 2.8, thickness: 0.15, color: '#888888' }
    },
    'manikin-1': {
      id: 'manikin-1',
      name: 'Maniquí Víctima / Sujeto',
      type: 'manikin',
      layer: 'Personas',
      position: [1.5, 0, 1.0],
      rotation: [0, -Math.PI / 4, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      properties: {
        height: 1.75,
        posture: 'standing',
        showSagittal: true,
        showCoronal: false,
        showTransverse: false,
        color: '#8e8e93'
      }
    },
    'traj-1': {
      id: 'traj-1',
      name: 'Trayectoria Balística 01',
      type: 'trajectory',
      layer: 'Trayectorias',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      properties: {
        start: [-1, 1.2, 2],
        end: [1.5, 1.5, -2],
        radius: 0.03,
        color: '#ff3b30'
      }
    }
  },
  selectedObjectId: null,
  activeLayer: 'default',
  measurements: [],
  isMeasuring: false,
  measurePoints: [],

  addObject: (obj) => set((state) => ({ 
    objects: { ...state.objects, [obj.id]: obj } 
  })),

  updateObjectTransform: (id, position, rotation) => set((state) => ({
    objects: {
      ...state.objects,
      [id]: { ...state.objects[id], position, rotation }
    }
  })),

  updateObjectProperties: (id, properties) => set((state) => ({
    objects: {
      ...state.objects,
      [id]: {
        ...state.objects[id],
        properties: { ...state.objects[id].properties, ...properties }
      }
    }
  })),

  setSelectedObject: (id) => set({ selectedObjectId: id }),

  toggleMeasureMode: () => set((state) => ({ 
    isMeasuring: !state.isMeasuring, 
    measurePoints: [] 
  })),

  addMeasurementPoint: (point) => set((state) => {
    const newPoints = [...state.measurePoints, point];
    if (newPoints.length === 2) {
      const p1 = new Vector3(...newPoints[0]);
      const p2 = new Vector3(...newPoints[1]);
      const measurement = calculateMeasurement(p1, p2);
      
      return {
        measurements: [...state.measurements, measurement],
        measurePoints: [],
        isMeasuring: false
      };
    }
    return { measurePoints: newPoints };
  }),

  clearMeasurements: () => set({ measurements: [], measurePoints: [] })
}));