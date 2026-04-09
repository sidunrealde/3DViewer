import type { Object3D } from "three";

export type SupportedFormat = "gltf" | "glb" | "fbx" | "obj" | "stl" | "ply" | "3ds";

export type LightingPreset =
  | "studio"
  | "unlit"
  | "matcap"
  | "wireframe"
  | "normals"
  | "environment";

export interface ModelInfo {
  name: string;
  format: SupportedFormat;
  vertices: number;
  triangles: number;
  textures: number;
  fileSize: number;
}

export interface LoadedModel {
  object: Object3D;
  info: ModelInfo;
}

export interface RecentModel {
  id: string;
  name: string;
  format: SupportedFormat;
  fileSize: number;
  date: number;
  thumbnail: string; // base64 data URL
}

export interface ViewerState {
  model: LoadedModel | null;
  loading: boolean;
  loadingProgress: number;
  error: string | null;
  lightingPreset: LightingPreset;
  lightIntensity: number;
  exposure: number;
  showGroundShadow: boolean;
  sidebarOpen: boolean;
  envMapIndex: number;
  /** When an OBJ loads without textures, store the File so we can reload with companion files */
  pendingObjFile: File | null;
}

export type ViewerAction =
  | { type: "SET_MODEL"; payload: LoadedModel }
  | { type: "CLEAR_MODEL" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LIGHTING_PRESET"; payload: LightingPreset }
  | { type: "SET_LIGHT_INTENSITY"; payload: number }
  | { type: "SET_EXPOSURE"; payload: number }
  | { type: "TOGGLE_GROUND_SHADOW" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR"; payload: boolean }
  | { type: "SET_ENV_MAP_INDEX"; payload: number }
  | { type: "SET_PENDING_OBJ"; payload: File | null };
