import { useViewerState, useViewerDispatch } from "@/stores/viewerStore.js";
import FileUpload from "@/components/Upload/FileUpload.js";
import type { LightingPreset } from "@/types";

const QUICK_PRESETS: { id: LightingPreset; label: string; shortcut: string }[] = [
  { id: "studio", label: "Studio", shortcut: "1" },
  { id: "environment", label: "HDR", shortcut: "2" },
  { id: "unlit", label: "Unlit", shortcut: "3" },
  { id: "wireframe", label: "Wire", shortcut: "4" },
  { id: "normals", label: "Normals", shortcut: "5" },
];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function Toolbar({
  onResetCamera,
}: {
  onResetCamera: () => void;
}) {
  const { model, lightingPreset } = useViewerState();
  const dispatch = useViewerDispatch();

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-neutral-900/90 px-3 py-2 shadow-lg backdrop-blur-md">
      {/* Sidebar toggle */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
        title="Toggle sidebar (Space)"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="h-6 w-px bg-neutral-700" />

      {/* Upload */}
      <FileUpload />

      <div className="h-6 w-px bg-neutral-700" />

      {/* Lighting quick presets */}
      <div className="hidden gap-1 sm:flex">
        {QUICK_PRESETS.map((p) => (
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

      <div className="hidden h-6 w-px bg-neutral-700 sm:block" />

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

      {/* Model info */}
      {model && (
        <>
          <div className="h-6 w-px bg-neutral-700" />
          <div className="hidden items-center gap-3 text-xs text-neutral-400 lg:flex">
            <span className="max-w-[150px] truncate font-medium text-neutral-200" title={model.info.name}>
              {model.info.name}
            </span>
            <span title="Triangles">△ {formatCount(model.info.triangles)}</span>
            <span title="Vertices">⬡ {formatCount(model.info.vertices)}</span>
            {model.info.textures > 0 && (
              <span title="Textures">🖼 {model.info.textures}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
