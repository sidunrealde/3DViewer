import { useRef, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Box3, Vector3, Group, PerspectiveCamera, type Object3D } from "three";
import { useViewerState } from "@/stores/viewerStore.js";
import { disposeObject } from "@/utils/dispose.js";

export default function ModelScene() {
  const { model } = useViewerState();
  const groupRef = useRef<Group>(null);
  const previousModel = useRef<Object3D | null>(null);
  const { camera, invalidate } = useThree();

  // Compute transform to center + scale model to unit size
  const { position, scale } = useMemo(() => {
    if (!model) return { position: new Vector3(), scale: 1 };

    const obj = model.object;
    const box = new Box3().setFromObject(obj);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? 2 / maxDim : 1;

    return { position: center.multiplyScalar(-1), scale: s };
  }, [model]);

  // Dispose previous model when model changes
  useEffect(() => {
    if (previousModel.current && previousModel.current !== model?.object) {
      disposeObject(previousModel.current);
    }
    previousModel.current = model?.object ?? null;
  }, [model]);

  // Fit camera on model load
  useEffect(() => {
    if (!model) return;

    const obj = model.object;
    const box = new Box3().setFromObject(obj);
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? 2 / maxDim : 1;
    const scaledSize = maxDim * s;

    // Position camera to fit
    const fov = camera instanceof PerspectiveCamera ? camera.fov : 50;
    const distance = scaledSize / (2 * Math.tan((fov * Math.PI) / 360));
    camera.position.set(0, scaledSize * 0.3, distance * 1.5);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [model, camera, invalidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previousModel.current) {
        disposeObject(previousModel.current);
        previousModel.current = null;
      }
    };
  }, []);

  if (!model) return null;

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={model.object} position={position.toArray()} />
    </group>
  );
}
