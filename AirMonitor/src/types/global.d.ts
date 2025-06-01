declare module "forge-apis";

// api/auth/twolegged
declare interface TwoLeggedBody {
  client_id: string;
  client_secret: string;
}

// api/translate/[urn]/progress
declare interface Manifest {
  progress?: string;
  status?: string;
}

// api/translate
declare interface TranslateRequestBody {
  urn: string;
}

// components/ThreeLeggedForm
declare interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  client_id: string;
  client_secret: string;
  callbackURL: string;
  scope: string[];
}

// components/TwoLeggedForm
declare interface Creds {
  client_id: string;
  client_secret: string;
}
declare interface Token {
  access_token: string;
  expires_in: number;
}

//Dashboard

interface Point {
  time: string;
  value: number;
}

interface RoomLatest {
  temperature: number;
  humidity: number;
  occupancy: number;
}
interface RoomsLatest {
  [room: number]: RoomLatest;
}

interface RoomsHistory {
  [room: number]: { temperature: Point[]; humidity: Point[] };
}

// ModelViewer

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

        isolate(dbIds: number[]): void;
        fitToView(dbIds: number[]): void;
        hide(dbIds: number[] | number): void;
        setThemingColor(dbId: number, color: any): void;
        clearThemingColors(): void;
        getObjectTree(onLoaded: (instanceTree: any) => void): void;

        setQualityLevel(level: "default" | "low" | "medium" | "high"): void;

        impl: {
          sceneUpdated: () => void;
          invalidate: (force?: boolean) => void;
        };

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

        setProgressiveRendering?(enable: boolean): void;
      }

      const SELECTION_CHANGED_EVENT: string;
    }
  }
}
