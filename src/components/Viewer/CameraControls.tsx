import { useRef, useCallback, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface CameraControlsHandle {
  reset: () => void;
}

/**
 * Detect Mac trackpad wheel events and invert deltaY so that the zoom
 * direction matches the "natural scrolling" expectation (swipe-up = zoom out).
 * Mouse wheel events are left untouched.
 */
function useFixMacTrackpadZoom(canvasEl: HTMLCanvasElement | null) {
  useEffect(() => {
    if (!canvasEl) return;

    const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
    if (!isMac) return;

    let skipNext = false;

    const handleWheel = (e: WheelEvent) => {
      // Skip the synthetic event we dispatch below
      if (skipNext) {
        skipNext = false;
        return;
      }

      // Heuristic: trackpad sends pixel-mode events with small or fractional
      // deltaY, while a mouse wheel sends multiples of ~100/120.
      const isTrackpad =
        e.deltaMode === 0 &&
        (Math.abs(e.deltaY) < 50 || e.deltaY % 1 !== 0);

      if (!isTrackpad) return;

      e.stopImmediatePropagation();
      e.preventDefault();

      skipNext = true;
      canvasEl.dispatchEvent(
        new WheelEvent("wheel", {
          deltaX: e.deltaX,
          deltaY: -e.deltaY,
          deltaZ: e.deltaZ,
          deltaMode: e.deltaMode,
          clientX: e.clientX,
          clientY: e.clientY,
          screenX: e.screenX,
          screenY: e.screenY,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          bubbles: true,
          cancelable: true,
        }),
      );
    };

    // Capture phase so we run before OrbitControls' listener
    canvasEl.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });
    return () =>
      canvasEl.removeEventListener("wheel", handleWheel, { capture: true });
  }, [canvasEl]);
}

export default function CameraControls({
  controlsRef,
}: {
  controlsRef?: React.RefObject<OrbitControlsImpl | null>;
}) {
  const internalRef = useRef<OrbitControlsImpl>(null);
  const ref = controlsRef ?? internalRef;
  const canvas = useThree((s) => s.gl.domElement);

  useFixMacTrackpadZoom(canvas);

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
