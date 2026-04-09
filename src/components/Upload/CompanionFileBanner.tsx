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
    <div className="absolute left-1/2 top-16 z-30 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-lg bg-amber-900/90 px-4 py-2.5 text-sm text-amber-200 shadow-lg backdrop-blur-md">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        <span>No textures detected.</span>
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-amber-700 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-600"
        >
          Add .mtl &amp; textures
        </button>
        <button
          onClick={() => dispatch({ type: "SET_PENDING_OBJ", payload: null })}
          className="text-amber-400 hover:text-amber-200"
        >
          ✕
        </button>
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
