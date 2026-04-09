import { useViewerState, useViewerDispatch } from "@/stores/viewerStore.js";
import type { RecentModel } from "@/types";
import { formatFileSize, formatDate } from "@/hooks/useRecentModels.js";
import LightingPanel from "./LightingPanel.js";

export default function Sidebar({
  recents,
  onClearRecent,
}: {
  recents: RecentModel[];
  onClearRecent: () => void;
}) {
  const { sidebarOpen } = useViewerState();
  const dispatch = useViewerDispatch();

  return (
    <>
      {/* Backdrop on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => dispatch({ type: "SET_SIDEBAR", payload: false })}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed z-40 flex flex-col bg-neutral-900/95 shadow-xl backdrop-blur-md transition-transform duration-300 ease-in-out ${
          /* Mobile: bottom sheet. Desktop: left panel */
          ""
        } ${
          /* Desktop */
          "md:left-0 md:top-0 md:h-full md:w-72 md:border-r md:border-neutral-800"
        } ${
          /* Mobile */
          "bottom-0 left-0 right-0 max-h-[70vh] rounded-t-2xl border-t border-neutral-800 md:rounded-none md:border-t-0"
        } ${
          sidebarOpen
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:-translate-x-full"
        }`}
      >
        {/* Mobile drag handle */}
        <div className="flex items-center justify-center py-2 md:hidden">
          <div className="h-1 w-10 rounded-full bg-neutral-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-200">3D Viewer</h2>
          <button
            onClick={() => dispatch({ type: "SET_SIDEBAR", payload: false })}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lighting controls */}
        <LightingPanel />

        <div className="border-t border-neutral-800" />

        {/* Recently opened */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Recently Opened
            </h3>
            {recents.length > 0 && (
              <button
                onClick={onClearRecent}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {recents.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-neutral-500">
                No models opened yet
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {recents.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-neutral-800"
                  >
                    {/* Thumbnail */}
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-800">
                      {r.thumbnail ? (
                        <img
                          src={r.thumbnail}
                          alt={r.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                          3D
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-neutral-200" title={r.name}>
                        {r.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatFileSize(r.fileSize)} · {r.format.toUpperCase()} · {formatDate(r.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
