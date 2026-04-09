import { ViewerProvider } from "@/stores/viewerStore.js";

export default function App() {
  return (
    <ViewerProvider>
      <div className="h-dvh w-dvw overflow-hidden bg-neutral-950 text-white">
        <p className="p-4 text-neutral-400">3D Viewer — scaffolding complete</p>
      </div>
    </ViewerProvider>
  );
}
