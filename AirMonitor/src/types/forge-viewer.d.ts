export {};

declare global {
  interface Window {
    Autodesk?: typeof Autodesk;
    forgeViewer?: Autodesk.Viewing.GuiViewer3D;
  }

  namespace Autodesk {
    namespace Viewing {
      function Initializer(
        options: {
          env: string;
          getAccessToken?: (
            cb: (token: string, expire: number) => void
          ) => void;
        },
        callback: () => void
      ): void;

      class Document {
        static load(
          urn: string,
          onSuccess: (doc: Document) => void,
          onError?: (code: number, message: string) => void
        ): void;
        getRoot(): { getDefaultGeometry(): object };
      }

      class GuiViewer3D {
        constructor(container: HTMLDivElement, options?: any);
        start(): boolean;
        loadDocumentNode(document: Document, geometry: any): Promise<void>;
        addEventListener(
          event: string,
          callback: (eventData: any) => void
        ): void;
        removeEventListener(
          event: string,
          callback: (eventData: any) => void
        ): void;
        isolate(dbIds: number[]): void;
        fitToView(dbIds: number[]): void;
        hide(dbIds: number[] | number): void;
        setThemingColor(dbId: number, color: any): void;
        clearThemingColors(): void;
        getObjectTree(onLoaded: (instanceTree: InstanceTree) => void): void;
        navigation: unknown;
        model: ViewerModel;
        impl: ViewerImpl;
        autocam?: {
          shotParams: {
            destinationPercent: number;
            duration: number;
          };
        };
        prefs: {
          set(name: string, value: boolean | number | string): void;
          get(name: string): boolean | number | string | undefined;
        };
        setQualityLevel(level: "default" | "low" | "medium" | "high"): void;
        setProgressiveRendering?(enable: boolean): void;
        canvas: HTMLCanvasElement;

        worldToClient(worldPt: THREE.Vector3): THREE.Vector3;
      }

      const CAMERA_CHANGE_EVENT: string;
      const SELECTION_CHANGED_EVENT: string;

      interface InstanceTree {
        enumNodeChildren(
          parentId: number,
          callback: (dbId: number) => void,
          recursive?: boolean
        ): void;
        enumNodeFragments(
          dbId: number,
          callback: (fragId: number) => void,
          recursive?: boolean
        ): void;
        getRootId(): number;
        getNodeName(dbId: number): string;
      }

      interface ViewerModel {
        getFragmentList(): FragmentList;
      }

      interface FragmentList {
        getGeometry(fragmentId: number): Geometry | null;
      }

      interface FragmentProxy {
        dbId: number;
        getAnimTransform(): void;
        updateAnimTransform(): void;
        worldMatrix: THREE.Matrix4;
      }

      interface Geometry {
        boundingBox: { min: THREE.Vector3; max: THREE.Vector3 };
        attributes: any;
        computeBoundingBox(): void;
      }

      interface ViewerImpl {
        addOverlay(sceneName: string, mesh: THREE.Object3D): void;
        createOverlayScene(sceneName: string): void;
        overlayScenes: Record<string, boolean>;
        invalidate(force?: boolean): void;
        sceneUpdated(): void;
        getFragmentProxy(model: ViewerModel, fragId: number): FragmentProxy;
      }
    }
  }
}
