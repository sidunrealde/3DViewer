import { useRef } from "react";
import { useModelLoader } from "@/hooks/useModelLoader.js";
import { ACCEPT_STRING_WITH_TEXTURES, getFormatFromExtension, isTextureFile } from "@/utils/loaders.js";

export default function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { load } = useModelLoader();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let modelFile: File | null = null;
    let mtlFile: File | null = null;
    const textureFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i]!;
      if (f.name.toLowerCase().endsWith(".mtl")) {
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

    // Reset input so same file can be re-uploaded
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING_WITH_TEXTURES}
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={openPicker}
        className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 active:bg-violet-700"
        title="Upload 3D model"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">Upload</span>
      </button>
    </>
  );
}
