import { useState, useCallback, type DragEvent, type ReactNode } from "react";
import { useModelLoader } from "@/hooks/useModelLoader.js";
import { getFormatFromExtension, isTextureFile } from "@/utils/loaders.js";

/**
 * Recursively read all File objects from a FileSystemEntry (file or directory).
 */
function readEntryAsFiles(entry: FileSystemEntry): Promise<File[]> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file(
        (file) => resolve([file]),
        () => resolve([])
      );
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      const allFiles: File[] = [];

      // readEntries may return results in batches, so we must call repeatedly
      const readBatch = () => {
        dirReader.readEntries(
          async (entries) => {
            if (entries.length === 0) {
              resolve(allFiles);
              return;
            }
            const nested = await Promise.all(entries.map(readEntryAsFiles));
            for (const files of nested) allFiles.push(...files);
            readBatch(); // read next batch
          },
          () => resolve(allFiles)
        );
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

/**
 * Extract all files from a drop event, supporting both individual files and folders.
 */
async function extractDroppedFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const items = dataTransfer.items;

  // Try the webkitGetAsEntry API first (supports folder scanning)
  if (items && items.length > 0 && typeof items[0]?.webkitGetAsEntry === "function") {
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i]?.webkitGetAsEntry();
      if (entry) entries.push(entry);
    }
    const nested = await Promise.all(entries.map(readEntryAsFiles));
    return nested.flat();
  }

  // Fallback: plain FileList
  const files: File[] = [];
  for (let i = 0; i < dataTransfer.files.length; i++) {
    files.push(dataTransfer.files[i]!);
  }
  return files;
}

function classifyAndLoad(
  files: File[],
  load: (file: File, mtlFile?: File | null, textureFiles?: File[]) => void
) {
  let modelFile: File | null = null;
  let mtlFile: File | null = null;
  const textureFiles: File[] = [];

  for (const f of files) {
    const name = f.name.toLowerCase();
    if (name.endsWith(".mtl")) {
      mtlFile = f;
    } else if (isTextureFile(f.name)) {
      textureFiles.push(f);
    } else if (getFormatFromExtension(f.name)) {
      modelFile = f;
    }
  }

  if (modelFile) {
    load(modelFile, mtlFile, textureFiles.length > 0 ? textureFiles : undefined);
  }
}

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

      extractDroppedFiles(e.dataTransfer).then((files) => {
        classifyAndLoad(files, load);
      });
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
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-cyan-950/60 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-cyan-400 px-12 py-8 text-center">
            <svg
              className="mx-auto mb-3 h-12 w-12 text-cyan-400"
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
            <p className="text-lg font-medium text-cyan-200">Drop your 3D model or folder here</p>
            <p className="mt-1 text-sm text-cyan-400">
              glTF, GLB, FBX, OBJ (+MTL & textures), STL, PLY, 3DS
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
