import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import ModelScene from "./ModelScene.js";
import CameraControls from "./CameraControls.js";
import LightingSystem from "./LightingSystem.js";
import { useViewerState } from "@/stores/viewerStore.js";

export default function ViewerCanvas({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { exposure } = useViewerState();

  return (
    <Canvas
      gl={{
        antialias: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: exposure,
        outputColorSpace: SRGBColorSpace,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
      }}
      camera={{ fov: 50, near: 0.01, far: 1000, position: [0, 0.5, 3] }}
      frameloop="demand"
      className="!absolute inset-0"
    >
      <LightingSystem />
      <ModelScene />
      <CameraControls controlsRef={controlsRef} />
    </Canvas>
  );
}
