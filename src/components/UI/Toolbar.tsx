import { useViewerState, useViewerDispatch } from "@/stores/viewerStore.js";
import FileUpload from "@/components/Upload/FileUpload.js";

export default function Toolbar({
  onResetCamera,
}: {
  onResetCamera: () => void;
}) {
  const { model } = useViewerState();
  const dispatch = useViewerDispatch();

  return (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-neutral-900/90 px-2 py-1.5 shadow-lg backdrop-blur-md sm:gap-2 sm:px-3 sm:py-2">
      {/* Logo */}
      <img
        src="/icons/OpEzeeLogo.png"
        alt="OpEzee"
        className="h-8 w-auto sm:h-9"
      />

      <div className="h-6 w-px bg-neutral-700" />

      {/* Upload */}
      <FileUpload />

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
            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
            title="Clear model"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
