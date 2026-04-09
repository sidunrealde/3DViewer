import { useViewerState, useViewerDispatch } from "@/stores/viewerStore.js";
import type { LightingPreset } from "@/types";

const PRESETS: { id: LightingPreset; label: string; icon: string }[] = [
  { id: "studio", label: "Studio", icon: "☀️" },
  { id: "environment", label: "HDR Env", icon: "🌍" },
  { id: "unlit", label: "Unlit", icon: "💡" },
  { id: "matcap", label: "Matcap", icon: "🔵" },
  { id: "wireframe", label: "Wire", icon: "🔲" },
  { id: "normals", label: "Normals", icon: "🌈" },
];

const ENV_MAPS = ["Studio", "Outdoor", "Neutral"];

export default function LightingPanel() {
  const { lightingPreset, lightIntensity, exposure, showGroundShadow, envMapIndex } =
    useViewerState();
  const dispatch = useViewerDispatch();

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Preset buttons */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
          Lighting
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => dispatch({ type: "SET_LIGHTING_PRESET", payload: p.id })}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                lightingPreset === p.id
                  ? "bg-violet-600 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span className="mr-1">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Environment map selector (only when HDR mode) */}
      {lightingPreset === "environment" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
            Environment
          </label>
          <div className="flex gap-1.5">
            {ENV_MAPS.map((name, i) => (
              <button
                key={name}
                onClick={() => dispatch({ type: "SET_ENV_MAP_INDEX", payload: i })}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  envMapIndex === i
                    ? "bg-violet-600 text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Intensity slider */}
      {(lightingPreset === "studio" || lightingPreset === "environment") && (
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-neutral-400">
            <span>Intensity</span>
            <span className="text-neutral-500">{lightIntensity.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={lightIntensity}
            onChange={(e) =>
              dispatch({ type: "SET_LIGHT_INTENSITY", payload: parseFloat(e.target.value) })
            }
            className="w-full accent-violet-500"
          />
        </div>
      )}

      {/* Exposure slider */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-neutral-400">
          <span>Exposure</span>
          <span className="text-neutral-500">{exposure.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.1}
          value={exposure}
          onChange={(e) =>
            dispatch({ type: "SET_EXPOSURE", payload: parseFloat(e.target.value) })
          }
          className="w-full accent-violet-500"
        />
      </div>

      {/* Ground shadow toggle */}
      <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-300">
        <input
          type="checkbox"
          checked={showGroundShadow}
          onChange={() => dispatch({ type: "TOGGLE_GROUND_SHADOW" })}
          className="accent-violet-500"
        />
        Ground shadow
      </label>
    </div>
  );
}
