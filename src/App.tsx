import { useRef, useCallback, useEffect } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ViewerProvider, useViewerState, useViewerDispatch } from "@/stores/viewerStore.js";
import ViewerCanvas from "@/components/Viewer/ViewerCanvas.js";
import DragDropZone from "@/components/Upload/DragDropZone.js";
import CompanionFileBanner from "@/components/Upload/CompanionFileBanner.js";
import Toolbar from "@/components/UI/Toolbar.js";

function AppContent() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { model, loading, loadingProgress, error } = useViewerState();
  const dispatch = useViewerDispatch();

  const handleResetCamera = useCallback(() => {
    controlsRef.current?.reset();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === "r") {
        handleResetCamera();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dispatch, handleResetCamera]);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-neutral-950 text-white">
      <DragDropZone>
        <ViewerCanvas controlsRef={controlsRef} />

        {/* Empty state */}
        {!model && !loading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900/80">
                <svg
                  className="h-10 w-10 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-neutral-200">OpEzee 3D Viewer</h2>
              <p className="mt-1 text-sm text-neutral-500 sm:hidden">
                Tap Upload to open a model
              </p>
              <p className="mt-1 hidden text-sm text-neutral-500 sm:block">
                Drop a model or folder here, or click Upload
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                glTF, GLB, FBX, OBJ, STL, PLY, 3DS
              </p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-cyan-500" />
              <p className="text-sm text-neutral-300">Loading model...</p>
              {loadingProgress > 0 && loadingProgress < 100 && (
                <div className="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-lg bg-red-900/90 px-4 py-2.5 text-sm text-red-200 shadow-lg backdrop-blur-md">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4.001c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001C2.57 17.335 3.532 19 5.072 19z" />
              </svg>
              <span>{error}</span>
              <button
                onClick={() => dispatch({ type: "SET_ERROR", payload: null })}
                className="ml-2 text-red-400 hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </DragDropZone>

      {/* Toolbar */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
        <Toolbar onResetCamera={handleResetCamera} />
      </div>

      {/* Companion file prompt for OBJ without textures */}
      <CompanionFileBanner />

    </div>
  );
}

export default function App() {
  return (
    <ViewerProvider>
      <AppContent />
    </ViewerProvider>
  );
}
