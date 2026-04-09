import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { TDSLoader } from "three/addons/loaders/TDSLoader.js";
import {
  Mesh,
  MeshStandardMaterial,
  BufferGeometry,
  Texture,
  type Object3D,
  Group,
} from "three";
import type { SupportedFormat } from "@/types";

// Singleton DRACO loader (WASM decoder, reused across loads)
let dracoLoader: DRACOLoader | null = null;
function getDracoLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    dracoLoader.setDecoderConfig({ type: "js" });
    dracoLoader.preload();
  }
  return dracoLoader;
}

// Singleton GLTF loader with DRACO configured
let gltfLoader: GLTFLoader | null = null;
function getGLTFLoader(): GLTFLoader {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(getDracoLoader());
  }
  return gltfLoader;
}

export function getFormatFromExtension(filename: string): SupportedFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "gltf":
      return "gltf";
    case "glb":
      return "glb";
    case "fbx":
      return "fbx";
    case "obj":
      return "obj";
    case "stl":
      return "stl";
    case "ply":
      return "ply";
    case "3ds":
      return "3ds";
    default:
      return null;
  }
}

export const SUPPORTED_EXTENSIONS = [".gltf", ".glb", ".fbx", ".obj", ".stl", ".ply", ".3ds"];
export const TEXTURE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp", ".tga", ".tif", ".tiff", ".webp"];
export const ACCEPT_STRING = SUPPORTED_EXTENSIONS.join(",");
export const ACCEPT_STRING_WITH_TEXTURES = [...SUPPORTED_EXTENSIONS, ".mtl", ...TEXTURE_EXTENSIONS].join(",");

export function isTextureFile(filename: string): boolean {
  const ext = "." + (filename.split(".").pop()?.toLowerCase() ?? "");
  return TEXTURE_EXTENSIONS.includes(ext);
}

/**
 * Read a File as text using FileReader.
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * MTL texture reference keywords — any of these can reference a texture file.
 */
const MTL_TEXTURE_KEYS = [
  "map_ka", "map_kd", "map_ks", "map_ke", "map_ns", "map_d",
  "map_bump", "bump", "disp", "decal", "norm",
  "map_pr", "map_pm", "map_ps",
];

/**
 * Rewrite texture paths in MTL text to use blob URLs.
 * Handles lines like: map_Kd texture.jpg  or  map_Kd -s 1 1 1 texture.jpg
 * The texture filename is always the LAST token on the line.
 */
function rewriteMtlTexturePaths(mtlText: string, fileMap: Map<string, string>): string {
  return mtlText.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;

    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx < 0) return line;

    const keyword = trimmed.substring(0, spaceIdx).toLowerCase();
    if (!MTL_TEXTURE_KEYS.includes(keyword)) return line;

    // The texture filename is the last space-separated token
    const lastSpaceIdx = trimmed.lastIndexOf(" ");
    const texturePath = trimmed.substring(lastSpaceIdx + 1).trim();
    // Extract just the filename (strip any directory path)
    const filename = texturePath.split("/").pop()?.split("\\").pop() ?? texturePath;
    const blobUrl = fileMap.get(filename.toLowerCase());
    if (!blobUrl) return line;

    // Replace the texture path with the blob URL
    return trimmed.substring(0, lastSpaceIdx + 1) + blobUrl;
  }).join("\n");
}

function wrapInGroup(geometry: BufferGeometry, name: string): Group {
  const material = new MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7, metalness: 0.1 });
  // Check if the geometry has vertex colors
  if (geometry.attributes["color"]) {
    material.vertexColors = true;
  }
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  const group = new Group();
  group.add(mesh);
  return group;
}

export interface LoadResult {
  object: Object3D;
}

export function loadModel(
  file: File,
  mtlFile: File | null,
  onProgress?: (progress: number) => void,
  textureFiles?: File[]
): Promise<LoadResult> {
  const format = getFormatFromExtension(file.name);
  if (!format) {
    return Promise.reject(new Error(`Unsupported file format: ${file.name}`));
  }

  const url = URL.createObjectURL(file);
  const mtlUrl = mtlFile ? URL.createObjectURL(mtlFile) : null;

  // Build a filename→blobURL map for texture resolution
  const blobUrls: string[] = [url];
  if (mtlUrl) blobUrls.push(mtlUrl);
  const fileMap = new Map<string, string>();
  if (textureFiles) {
    for (const tf of textureFiles) {
      const blobUrl = URL.createObjectURL(tf);
      blobUrls.push(blobUrl);
      fileMap.set(tf.name.toLowerCase(), blobUrl);
      // Also map without directory prefix
      const baseName = tf.name.split("/").pop()?.split("\\").pop();
      if (baseName) fileMap.set(baseName.toLowerCase(), blobUrl);
    }
  }

  const cleanup = () => {
    for (const u of blobUrls) URL.revokeObjectURL(u);
  };

  const handleProgress = (event: ProgressEvent) => {
    if (event.lengthComputable && onProgress) {
      onProgress((event.loaded / event.total) * 100);
    }
  };

  return new Promise<LoadResult>((resolve, reject) => {
    try {
      switch (format) {
        case "gltf":
        case "glb":
          getGLTFLoader().load(
            url,
            (gltf) => {
              cleanup();
              resolve({ object: gltf.scene });
            },
            handleProgress,
            (err: unknown) => {
              cleanup();
              reject(new Error(`Failed to load GLTF/GLB: ${err instanceof Error ? err.message : String(err)}`));
            }
          );
          break;

        case "fbx":
          new FBXLoader().load(
            url,
            (obj) => {
              cleanup();
              resolve({ object: obj });
            },
            handleProgress,
            (err: unknown) => {
              cleanup();
              reject(new Error(`Failed to load FBX: ${err instanceof Error ? err.message : String(err)}`));
            }
          );
          break;

        case "obj":
          if (mtlFile && mtlUrl) {
            // Read MTL text and rewrite texture paths to blob URLs.
            // This avoids relying on LoadingManager.resolveURL with blob URL bases.
            readFileAsText(mtlFile).then((mtlText) => {
              const rewritten = rewriteMtlTexturePaths(mtlText, fileMap);
              const mtlLoader = new MTLLoader();
              // Parse with empty base URL — texture paths are already blob URLs
              const materials = mtlLoader.parse(rewritten, "");
              materials.preload();
              const objLoader = new OBJLoader();
              objLoader.setMaterials(materials);
              objLoader.load(
                url,
                (obj) => {
                  // Only revoke OBJ + MTL blob URLs now.
                  // Texture blob URLs must stay alive until textures finish loading,
                  // so we do NOT revoke them here — they're released on model disposal.
                  URL.revokeObjectURL(url);
                  if (mtlUrl) URL.revokeObjectURL(mtlUrl);
                  resolve({ object: obj });
                },
                handleProgress,
                (err: unknown) => {
                  cleanup();
                  reject(new Error(`Failed to load OBJ: ${err instanceof Error ? err.message : String(err)}`));
                }
              );
            }).catch((err: unknown) => {
              cleanup();
              reject(new Error(`Failed to read MTL file: ${err instanceof Error ? err.message : String(err)}`));
            });
          } else {
            new OBJLoader().load(
              url,
              (obj) => {
                cleanup();
                resolve({ object: obj });
              },
              handleProgress,
              (err: unknown) => {
                cleanup();
                reject(new Error(`Failed to load OBJ: ${err instanceof Error ? err.message : String(err)}`));
              }
            );
          }
          break;

        case "stl":
          new STLLoader().load(
            url,
            (geometry) => {
              cleanup();
              geometry.computeVertexNormals();
              resolve({ object: wrapInGroup(geometry, file.name) });
            },
            handleProgress,
            (err: unknown) => {
              cleanup();
              reject(new Error(`Failed to load STL: ${err instanceof Error ? err.message : String(err)}`));
            }
          );
          break;

        case "ply":
          new PLYLoader().load(
            url,
            (geometry) => {
              cleanup();
              geometry.computeVertexNormals();
              resolve({ object: wrapInGroup(geometry, file.name) });
            },
            handleProgress,
            (err: unknown) => {
              cleanup();
              reject(new Error(`Failed to load PLY: ${err instanceof Error ? err.message : String(err)}`));
            }
          );
          break;

        case "3ds":
          new TDSLoader().load(
            url,
            (obj) => {
              cleanup();
              resolve({ object: obj });
            },
            handleProgress,
            (err: unknown) => {
              cleanup();
              reject(new Error(`Failed to load 3DS: ${err instanceof Error ? err.message : String(err)}`));
            }
          );
          break;
      }
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

/** Count vertices, triangles, and textures in a loaded object */
export function getModelStats(obj: Object3D): {
  vertices: number;
  triangles: number;
  textures: number;
} {
  let vertices = 0;
  let triangles = 0;
  const textureSet = new Set<string>();

  obj.traverse((child) => {
    if (child instanceof Mesh && child.geometry instanceof BufferGeometry) {
      const geo = child.geometry;
      const pos = geo.attributes["position"];
      if (pos) vertices += pos.count;

      if (geo.index) {
        triangles += geo.index.count / 3;
      } else if (pos) {
        triangles += pos.count / 3;
      }

      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        for (const value of Object.values(mat)) {
          if (value instanceof Texture) {
            textureSet.add(value.uuid);
          }
        }
      }
    }
  });

  return { vertices: Math.round(vertices), triangles: Math.round(triangles), textures: textureSet.size };
}
