import { useRef } from "react";
import { useViewerState, useViewerDispatch } from "@/stores/viewerStore.js";
import { useModelLoader } from "@/hooks/useModelLoader.js";
import { isTextureFile, TEXTURE_EXTENSIONS } from "@/utils/loaders.js";

const COMPANION_ACCEPT = [".mtl", ...TEXTURE_EXTENSIONS].join(",");

export default function CompanionFileBanner() {
  const { pendingObjFile } = useViewerState();
  const dispatch = useViewerDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const { load } = useModelLoader();

  if (!pendingObjFile) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let mtlFile: File | null = null;
    const textureFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i]!;
      if (f.name.toLowerCase().endsWith(".mtl")) {
        mtlFile = f;
      } else if (isTextureFile(f.name)) {
        textureFiles.push(f);
      }
    }

    if (mtlFile || textureFiles.length > 0) {
      load(pendingObjFile, mtlFile, textureFiles.length > 0 ? textureFiles : undefined);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="absolute left-1/2 top-16 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:w-auto">
      <div className="flex flex-col gap-2 rounded-xl bg-amber-900/90 px-4 py-3 text-amber-200 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:gap-3 sm:rounded-lg sm:py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <svg className="h-5 w-5 flex-shrink-0 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
          <span>No textures detected</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex-1 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 active:bg-amber-800 sm:flex-none sm:rounded-md sm:px-3 sm:py-1 sm:text-xs"
          >
            Add .mtl &amp; textures
          </button>
          <button
            onClick={() => dispatch({ type: "SET_PENDING_OBJ", payload: null })}
            className="rounded-lg p-2.5 text-amber-400 transition-colors hover:text-amber-200 active:bg-amber-800/50 sm:p-1"
          >
            <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={COMPANION_ACCEPT}
          multiple
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
