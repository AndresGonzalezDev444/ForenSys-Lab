import { create } from 'zustand';
import { Vector3 } from 'three';
import type { SceneObject } from '../types/scene';
import type { ImpactData } from '../core/math/impactCalculator';
import { calculateMeasurement, type MeasurementResult } from '../core/math/measurements';

type TransformMode = 'translate' | 'rotate';

export interface CaseInfo {
  id: string;
  name: string;
  date: string;
  investigator: string;
}

interface SceneState {
  objects: Record<string, SceneObject>;
  selectedObjectId: string | null;
  activeLayer: string;
  measurements: MeasurementResult[];
  isMeasuring: boolean;
  measurePoints: [number, number, number][];
  transformMode: TransformMode;
  observations: string[];
  caseInfo: CaseInfo;

  addObject: (obj: SceneObject) => void;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  updateObjectTransform: (id: string, position: [number, number, number], rotation: [number, number, number]) => void;
  updateObjectProperties: (id: string, properties: Record<string, unknown>) => void;
  renameObject: (id: string, name: string) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  setSelectedObject: (id: string | null) => void;
  toggleMeasureMode: () => void;
  addMeasurementPoint: (point: [number, number, number]) => void;
  clearMeasurements: () => void;
  setTransformMode: (mode: TransformMode) => void;
  addImpact: (objectId: string, impact: ImpactData) => void;
  removeImpact: (objectId: string, impactId: string) => void;
  updateImpact: (objectId: string, impactId: string, data: Partial<ImpactData>) => void;
  addObservation: (text: string) => void;
  updateCaseInfo: (info: Partial<CaseInfo>) => void;
  exportCaseJSON: () => string;
  importCaseJSON: (json: string) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: {
    'wall-1': {
      id: 'wall-1',
      name: 'Pared Norte',
      type: 'parametric_wall',
      layer: 'Paredes',
      position: [0, 0, -2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      properties: { length: 5, height: 2.8, thickness: 0.15, color: '#888888' },
      impacts: []
    },
    'manikin-1': {
      id: 'manikin-1',
      name: 'Maniquí Víctima',
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
      },
      impacts: []
    },
    'traj-1': {
      id: 'traj-1',
      name: 'Trayectoria 01',
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
      },
      impacts: []
    }
  },
  selectedObjectId: null,
  activeLayer: 'default',
  measurements: [],
  isMeasuring: false,
  measurePoints: [],
  transformMode: 'translate',
  observations: [],
  caseInfo: {
    id: `CASO-${new Date().getFullYear()}-001`,
    name: 'Reconstrucción Balística de Prueba',
    date: new Date().toISOString().split('T')[0],
    investigator: 'Perito Forense'
  },

  addObject: (obj) => set((state) => ({
    objects: { ...state.objects, [obj.id]: obj }
  })),

  removeObject: (id) => set((state) => {
    const newObjects = { ...state.objects };
    delete newObjects[id];
    return {
      objects: newObjects,
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
    };
  }),

  duplicateObject: (id) => set((state) => {
    const obj = state.objects[id];
    if (!obj) return state;
    const newId = `${obj.type}-${Date.now()}`;
    const newObj = {
      ...obj,
      id: newId,
      name: `${obj.name} (Copia)`,
      position: [obj.position[0] + 0.5, obj.position[1], obj.position[2] + 0.5] as [number, number, number]
    };
    return { objects: { ...state.objects, [newId]: newObj } };
  }),

  updateObjectTransform: (id, position, rotation) => set((state) => {
    if (!state.objects[id]) return state;
    return {
      objects: {
        ...state.objects,
        [id]: { ...state.objects[id], position, rotation }
      }
    };
  }),

  updateObjectProperties: (id, properties) => set((state) => {
    if (!state.objects[id]) return state;
    return {
      objects: {
        ...state.objects,
        [id]: {
          ...state.objects[id],
          properties: { ...state.objects[id].properties, ...properties }
        }
      }
    };
  }),

  renameObject: (id, name) => set((state) => {
    if (!state.objects[id]) return state;
    return {
      objects: {
        ...state.objects,
        [id]: { ...state.objects[id], name }
      }
    };
  }),

  toggleVisibility: (id) => set((state) => {
    if (!state.objects[id]) return state;
    return {
      objects: {
        ...state.objects,
        [id]: { ...state.objects[id], visible: !state.objects[id].visible }
      }
    };
  }),

  toggleLock: (id) => set((state) => {
    if (!state.objects[id]) return state;
    return {
      objects: {
        ...state.objects,
        [id]: { ...state.objects[id], locked: !state.objects[id].locked }
      }
    };
  }),

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

  clearMeasurements: () => set({ measurements: [], measurePoints: [] }),

  setTransformMode: (mode) => set({ transformMode: mode }),

  addImpact: (objectId, impact) => set((state) => {
    const obj = state.objects[objectId];
    if (!obj) return state;
    const impacts = obj.impacts ? [...obj.impacts, impact] : [impact];
    return {
      objects: {
        ...state.objects,
        [objectId]: { ...obj, impacts }
      }
    };
  }),

  removeImpact: (objectId, impactId) => set((state) => {
    const obj = state.objects[objectId];
    if (!obj || !obj.impacts) return state;
    return {
      objects: {
        ...state.objects,
        [objectId]: { ...obj, impacts: obj.impacts.filter((i) => i.id !== impactId) }
      }
    };
  }),

  updateImpact: (objectId, impactId, data) => set((state) => {
    const obj = state.objects[objectId];
    if (!obj || !obj.impacts) return state;
    return {
      objects: {
        ...state.objects,
        [objectId]: {
          ...obj,
          impacts: obj.impacts.map((i) => (i.id === impactId ? { ...i, ...data } : i))
        }
      }
    };
  }),

  addObservation: (text) => set((state) => ({
    observations: [...state.observations, `[${new Date().toLocaleTimeString()}] ${text}`]
  })),

  updateCaseInfo: (info) => set((state) => ({
    caseInfo: { ...state.caseInfo, ...info }
  })),

  exportCaseJSON: () => {
    const state = get();
    const data = {
      objects: state.objects,
      measurements: state.measurements,
      observations: state.observations,
      caseInfo: state.caseInfo
    };
    return JSON.stringify(data, null, 2);
  },

  importCaseJSON: (json) => {
    try {
      const data = JSON.parse(json);
      set({
        objects: data.objects || {},
        measurements: data.measurements || [],
        observations: data.observations || [],
        caseInfo: data.caseInfo || get().caseInfo,
        selectedObjectId: null
      });
    } catch (e) {
      console.error('Error importing JSON', e);
    }
  }
}));
