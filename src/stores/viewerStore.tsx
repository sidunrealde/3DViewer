import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { ViewerState, ViewerAction } from "@/types";

const initialState: ViewerState = {
  model: null,
  loading: false,
  loadingProgress: 0,
  error: null,
  lightingPreset: "studio",
  lightIntensity: 1,
  exposure: 1,
  showGroundShadow: true,
  sidebarOpen: false,
  envMapIndex: 0,
  pendingObjFile: null,
};

function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case "SET_MODEL":
      return { ...state, model: action.payload, loading: false, loadingProgress: 100, error: null };
    case "CLEAR_MODEL":
      return { ...state, model: null, pendingObjFile: null };
    case "SET_LOADING":
      return { ...state, loading: action.payload, error: action.payload ? null : state.error };
    case "SET_PROGRESS":
      return { ...state, loadingProgress: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_LIGHTING_PRESET":
      return { ...state, lightingPreset: action.payload };
    case "SET_LIGHT_INTENSITY":
      return { ...state, lightIntensity: action.payload };
    case "SET_EXPOSURE":
      return { ...state, exposure: action.payload };
    case "TOGGLE_GROUND_SHADOW":
      return { ...state, showGroundShadow: !state.showGroundShadow };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "SET_SIDEBAR":
      return { ...state, sidebarOpen: action.payload };
    case "SET_ENV_MAP_INDEX":
      return { ...state, envMapIndex: action.payload };
    case "SET_PENDING_OBJ":
      return { ...state, pendingObjFile: action.payload };
    default:
      return state;
  }
}

const ViewerStateContext = createContext<ViewerState>(initialState);
const ViewerDispatchContext = createContext<Dispatch<ViewerAction>>(() => {});

export function ViewerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(viewerReducer, initialState);
  return (
    <ViewerStateContext.Provider value={state}>
      <ViewerDispatchContext.Provider value={dispatch}>
        {children}
      </ViewerDispatchContext.Provider>
    </ViewerStateContext.Provider>
  );
}

export function useViewerState() {
  return useContext(ViewerStateContext);
}

export function useViewerDispatch() {
  return useContext(ViewerDispatchContext);
}
