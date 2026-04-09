import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ViewerProvider } from "@/stores/viewerStore.js";
import ViewerCanvas from "@/components/Viewer/ViewerCanvas.js";

export default function App() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <ViewerProvider>
      <div className="relative h-dvh w-dvw overflow-hidden bg-neutral-950 text-white">
        <ViewerCanvas controlsRef={controlsRef} />
      </div>
    </ViewerProvider>
  );
}
