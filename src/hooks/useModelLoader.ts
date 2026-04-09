import { useCallback } from "react";
import { useViewerDispatch } from "@/stores/viewerStore.js";
import { loadModel, getModelStats, getFormatFromExtension } from "@/utils/loaders.js";
import { preprocessModel } from "@/utils/preprocess.js";
import type { LoadedModel, SupportedFormat } from "@/types";

export function useModelLoader() {
  const dispatch = useViewerDispatch();

  const load = useCallback(
    async (file: File, mtlFile?: File | null, textureFiles?: File[]) => {
      const format = getFormatFromExtension(file.name);
      if (!format) {
        dispatch({ type: "SET_ERROR", payload: `Unsupported format: ${file.name}` });
        return null;
      }

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_PROGRESS", payload: 0 });
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "SET_PENDING_OBJ", payload: null });

      try {
        const result = await loadModel(file, mtlFile ?? null, (progress) => {
          dispatch({ type: "SET_PROGRESS", payload: progress });
        }, textureFiles);

        // Preprocess: compute normals, bounding data, enable shadows
        preprocessModel(result.object);

        const stats = getModelStats(result.object);
        const loaded: LoadedModel = {
          object: result.object,
          info: {
            name: file.name,
            format: format as SupportedFormat,
            vertices: stats.vertices,
            triangles: stats.triangles,
            textures: stats.textures,
            fileSize: file.size,
          },
        };

        dispatch({ type: "SET_MODEL", payload: loaded });

        // If this is an OBJ with no textures and no MTL was provided,
        // store the file so the user can add companion files later
        if (format === "obj" && stats.textures === 0 && !mtlFile) {
          dispatch({ type: "SET_PENDING_OBJ", payload: file });
        }

        return loaded;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load model";
        dispatch({ type: "SET_ERROR", payload: message });
        return null;
      }
    },
    [dispatch]
  );

  return { load };
}
