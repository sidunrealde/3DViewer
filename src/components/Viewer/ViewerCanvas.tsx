import { Canvas } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import ModelScene from "./ModelScene.js";
import CameraControls from "./CameraControls.js";
import LightingSystem from "./LightingSystem.js";
import { useViewerState } from "@/stores/viewerStore.js";

function SceneGrid() {
  return (
    <Grid
      position={[0, -1, 0]}
      args={[20, 20]}
      cellSize={0.5}
      cellThickness={0.5}
      cellColor="#333"
      sectionSize={2}
      sectionThickness={1}
      sectionColor="#555"
      fadeDistance={15}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

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
        preserveDrawingBuffer: true, // Required for thumbnail capture
      }}
      shadows
      camera={{ fov: 50, near: 0.01, far: 1000, position: [0, 0.5, 3] }}
      frameloop="demand"
      className="!absolute inset-0"
    >
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 10, 30]} />
      <SceneGrid />
      <LightingSystem />
      <ModelScene />
      <CameraControls controlsRef={controlsRef} />
    </Canvas>
  );
}
