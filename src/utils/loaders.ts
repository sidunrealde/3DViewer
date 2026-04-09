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
  LoadingManager,
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
 * Create a LoadingManager that resolves texture filenames to blob URLs.
 * This is critical for OBJ+MTL loading where the MTL references textures by name.
 */
function createBlobLoadingManager(fileMap: Map<string, string>): LoadingManager {
  const manager = new LoadingManager();
  const originalResolveURL = manager.resolveURL.bind(manager);
  manager.resolveURL = (url: string) => {
    // Extract just the filename from the URL (MTL may reference "textures/diffuse.jpg")
    const filename = url.split("/").pop()?.split("\\").pop() ?? url;
    const blobUrl = fileMap.get(filename.toLowerCase());
    if (blobUrl) return blobUrl;
    // Also try the full relative path as-is
    const blobUrl2 = fileMap.get(url.toLowerCase());
    if (blobUrl2) return blobUrl2;
    return originalResolveURL(url);
  };
  return manager;
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
            // Use custom loading manager so MTL can resolve texture filenames to blob URLs
            const manager = createBlobLoadingManager(fileMap);
            const mtlLoader = new MTLLoader(manager);
            mtlLoader.load(
              mtlUrl,
              (materials) => {
                materials.preload();
                const objLoader = new OBJLoader(manager);
                objLoader.setMaterials(materials);
                objLoader.load(
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
              },
              undefined,
              (err: unknown) => {
                cleanup();
                reject(new Error(`Failed to load MTL: ${err instanceof Error ? err.message : String(err)}`));
              }
            );
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
