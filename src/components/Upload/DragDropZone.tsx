import { useState, useCallback, type DragEvent, type ReactNode } from "react";
import { useModelLoader } from "@/hooks/useModelLoader.js";
import { getFormatFromExtension } from "@/utils/loaders.js";

export default function DragDropZone({ children }: { children: ReactNode }) {
  const [dragging, setDragging] = useState(false);
  const { load } = useModelLoader();

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false when leaving the zone entirely
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      let modelFile: File | null = null;
      let mtlFile: File | null = null;

      for (let i = 0; i < files.length; i++) {
        const f = files[i]!;
        if (f.name.toLowerCase().endsWith(".mtl")) {
          mtlFile = f;
        } else if (getFormatFromExtension(f.name)) {
          modelFile = f;
        }
      }

      if (modelFile) {
        load(modelFile, mtlFile);
      }
    },
    [load]
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative h-full w-full"
    >
      {children}

      {/* Drag overlay */}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-violet-950/60 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-violet-400 px-12 py-8 text-center">
            <svg
              className="mx-auto mb-3 h-12 w-12 text-violet-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
              />
            </svg>
            <p className="text-lg font-medium text-violet-200">Drop your 3D model here</p>
            <p className="mt-1 text-sm text-violet-400">
              glTF, GLB, FBX, OBJ, STL, PLY, 3DS
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
