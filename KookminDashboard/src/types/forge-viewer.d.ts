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

        // 뷰어 시작
        start(): boolean;

        // Document load & geometry load
        loadDocumentNode(document: Document, geometry: any): Promise<void>;

        // 이벤트 리스너 등록/해제
        addEventListener(
          event: string,
          callback: (eventData: any) => void
        ): void;
        removeEventListener(
          event: string,
          callback: (eventData: any) => void
        ): void;

        // 오브젝트 하이라이트, 줌, 숨김
        isolate(dbIds: number[]): void;
        fitToView(dbIds?: number[]): void;
        hide(dbIds: number[] | number): void;

        // 테마 색상 설정/초기화 (네 인자 시그니처)
        setThemingColor(
          dbId: number,
          color: any,
          model: ViewerModel,
          recursive: boolean
        ): void;
        clearThemingColors(model: ViewerModel): void;

        // 선택(Selection) 관련 API
        setSelectionColor(color: any, selectionType: number): void;
        select(
          dbIds: number[] | number,
          model: ViewerModel,
          selectionType: number
        ): void;
        clearSelection(): void;

        // Object tree 및 관련 API
        getObjectTree(onLoaded: (instanceTree: InstanceTree) => void): void;
        navigation: unknown;
        model: ViewerModel;
        impl: ViewerImpl;

        // 카메라 앵글 변경 시
        autocam?: {
          shotParams: {
            destinationPercent: number;
            duration: number;
          };
        };

        // 렌더링 옵션
        prefs: {
          set(name: string, value: boolean | number | string): void;
          get(name: string): boolean | number | string | undefined;
        };
        setQualityLevel(level: "default" | "low" | "medium" | "high"): void;
        setProgressiveRendering?(enable: boolean): void;
        canvas: HTMLCanvasElement;
        worldToClient(worldPt: THREE.Vector3): THREE.Vector3;

        // 검색/속성 조회
        search?(
          searchText: string,
          onSuccess: (dbIds: number[]) => void,
          onError?: (error: any) => void,
          searchTypes?: string[]
        ): void;

        getBulkProperties?(
          dbIds: number[],
          propertyNames: string[],
          onSuccess: (
            elements: Array<{
              dbId: number;
              properties: Array<{
                displayName: string;
                displayValue: string;
              }>;
            }>
          ) => void,
          onError?: (error: any) => void
        ): void;

        // 확장 기능 로드/언로드
        loadExtension<T = any>(extensionId: string, options?: any): Promise<T>;
        unloadExtension(extensionId: string): Promise<void>;
      }

      const CAMERA_CHANGE_EVENT: string;
      const SELECTION_CHANGED_EVENT: string;
      const GEOMETRY_LOADED_EVENT: string;

      // SelectionType 열거값
      const SelectionType: {
        MIXED: number;
        REGULAR: number;
        OVERLAYED: number;
      };

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
        search(
          searchText: string,
          onSuccess: (dbIds: number[]) => void,
          onError?: (error: any) => void,
          searchTypes?: string[]
        ): void;

        getBulkProperties(
          dbIds: number[],
          propertyNames: string[],
          onSuccess: (
            elements: Array<{
              dbId: number;
              properties: Array<{
                displayName: string;
                displayValue: string;
              }>;
            }>
          ) => void,
          onError?: (error: any) => void
        ): void;

        getFragmentList(): FragmentList;
        setThemingColor(
          dbId: number,
          color: any,
          model: ViewerModel,
          recursive: boolean
        ): void;
      }

      interface FragmentList {
        getGeometry(fragmentId: number): Geometry | null;
        getWorldBounds(
          fragmentId: number,
          callback: (box: THREE.Box3) => void
        ): void;
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

        visibilityManager: {
          show(dbId: number, model: ViewerModel): void;
        };

        invalidate(
          force?: boolean,
          rebuild?: boolean,
          overlayDirty?: boolean
        ): void;

        sceneUpdated(): void;
        getRenderProxy(model: ViewerModel, fragId: number): FragmentProxy;
      }
    }
  }
}
