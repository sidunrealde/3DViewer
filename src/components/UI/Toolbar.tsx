import { useViewerState, useViewerDispatch } from "@/stores/viewerStore.js";
import FileUpload from "@/components/Upload/FileUpload.js";
import type { LightingPreset } from "@/types";

const PRESETS: { id: LightingPreset; label: string; shortcut: string }[] = [
  { id: "studio", label: "Studio", shortcut: "1" },
  { id: "unlit", label: "Unlit", shortcut: "2" },
];

export default function Toolbar({
  onResetCamera,
}: {
  onResetCamera: () => void;
}) {
  const { model, lightingPreset } = useViewerState();
  const dispatch = useViewerDispatch();

  return (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-neutral-900/90 px-2 py-1.5 shadow-lg backdrop-blur-md sm:gap-2 sm:px-3 sm:py-2">
      {/* Upload */}
      <FileUpload />

      <div className="h-6 w-px bg-neutral-700" />

      {/* Lighting presets — always visible */}
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_LIGHTING_PRESET", payload: p.id })}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              lightingPreset === p.id
                ? "bg-violet-600 text-white"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
            }`}
            title={`${p.label} (${p.shortcut})`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-neutral-700" />

      {/* Reset camera */}
      <button
        onClick={onResetCamera}
        className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
        title="Reset camera (R)"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* Clear model */}
      {model && (
        <>
          <div className="h-6 w-px bg-neutral-700" />
          <button
            onClick={() => dispatch({ type: "CLEAR_MODEL" })}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            title="Clear model"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
