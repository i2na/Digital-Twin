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

// ForgeViewer
interface Window {
  NOP_VIEWER?: Autodesk.Viewing.GuiViewer3D;
  viewer?: Autodesk.Viewing.GuiViewer3D;
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
