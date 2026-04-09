import { useRef, useCallback } from "react";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface CameraControlsHandle {
  reset: () => void;
}

export default function CameraControls({
  controlsRef,
}: {
  controlsRef?: React.RefObject<OrbitControlsImpl | null>;
}) {
  const internalRef = useRef<OrbitControlsImpl>(null);
  const ref = controlsRef ?? internalRef;

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      enablePan
      enableZoom
      enableRotate
      minDistance={0.01}
      maxDistance={100}
      // Touch: built-in pinch zoom + two-finger pan
      touches={{
        ONE: 0, // ROTATE
        TWO: 2, // DOLLY_PAN
      }}
    />
  );
}

export function useResetCamera(controlsRef: React.RefObject<OrbitControlsImpl | null>) {
  return useCallback(() => {
    controlsRef.current?.reset();
  }, [controlsRef]);
}
