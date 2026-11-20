export type ContainerIsoType =
  | '20DC'
  | '40DC'
  | '40HC'
  | '20RF'
  | '40HCRF'
  | '20FR'
  | '40FR';

export interface IsoTypeSpec {
  code: ContainerIsoType;
  label: string;
  lengthFt: 20 | 40;
  baysRequired: 1 | 2;
  lengthM: number;
  widthM: number;
  heightM: number;
  isReefer: boolean;
  isFlatrack: boolean;
  isHighCube: boolean;
  teu: 1 | 2;
}

export const ISO_TYPE_SPECS: Record<ContainerIsoType, IsoTypeSpec> = {
  '20DC': {
    code: '20DC',
    label: "20' Dry Standard (20DC)",
    lengthFt: 20,
    baysRequired: 1,
    lengthM: 6.06,
    widthM: 2.44,
    heightM: 2.59,
    isReefer: false,
    isFlatrack: false,
    isHighCube: false,
    teu: 1,
  },
  '40DC': {
    code: '40DC',
    label: "40' Dry Standard (40DC)",
    lengthFt: 40,
    baysRequired: 2,
    lengthM: 12.19,
    widthM: 2.44,
    heightM: 2.59,
    isReefer: false,
    isFlatrack: false,
    isHighCube: false,
    teu: 2,
  },
  '40HC': {
    code: '40HC',
    label: "40' High Cube (40HC)",
    lengthFt: 40,
    baysRequired: 2,
    lengthM: 12.19,
    widthM: 2.44,
    heightM: 2.9,
    isReefer: false,
    isFlatrack: false,
    isHighCube: true,
    teu: 2,
  },
  '20RF': {
    code: '20RF',
    label: "20' Refrigerated Reefer (20RF)",
    lengthFt: 20,
    baysRequired: 1,
    lengthM: 6.06,
    widthM: 2.44,
    heightM: 2.59,
    isReefer: true,
    isFlatrack: false,
    isHighCube: false,
    teu: 1,
  },
  '40HCRF': {
    code: '40HCRF',
    label: "40' High Cube Reefer (40HCRF)",
    lengthFt: 40,
    baysRequired: 2,
    lengthM: 12.19,
    widthM: 2.44,
    heightM: 2.9,
    isReefer: true,
    isFlatrack: false,
    isHighCube: true,
    teu: 2,
  },
  '20FR': {
    code: '20FR',
    label: "20' Flatrack (20FR)",
    lengthFt: 20,
    baysRequired: 1,
    lengthM: 6.06,
    widthM: 2.44,
    heightM: 2.59,
    isReefer: false,
    isFlatrack: true,
    isHighCube: false,
    teu: 1,
  },
  '40FR': {
    code: '40FR',
    label: "40' Flatrack (40FR)",
    lengthFt: 40,
    baysRequired: 2,
    lengthM: 12.19,
    widthM: 2.44,
    heightM: 2.59,
    isReefer: false,
    isFlatrack: true,
    isHighCube: false,
    teu: 2,
  },
};

export interface ClientOwner {
  id: string;
  name: string;
  codePrefix: string; // e.g. MSCU, MAEU, FESO, SKRU
  color: string;
}

export type StockZoneType = 'standard' | 'reefer' | 'repair' | 'loading';

export interface StockZone {
  id: string;
  name: string;
  zoneType: StockZoneType;
  x: number; // Center or corner X in meters
  z: number; // Center or corner Z in meters
  bays: number; // Number of 20ft bays along local X
  rows: number; // Number of container rows along local Z
  maxTiers: number; // Up to 6
  rotationDeg: 0 | 90;
  color: string;
  badgeNumber?: number;
  badgeLabel?: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  width: number;
  markingColor: 'white' | 'yellow';
}

export interface FenceSegment {
  id: string;
  name: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  height: number;
  hasGate?: boolean;
}

export type PropType = 'gate_ocr' | 'light_tower' | 'reachstacker';
export type ReachstackerStatus = 'operating' | 'transit' | 'loading' | 'idle';

export interface TerminalProp {
  id: string;
  type: PropType;
  name: string;
  x: number;
  z: number;
  rotationDeg: number;
  badgeNumber?: number;
  badgeLabel?: string;
  waypoints?: [number, number][];
  status?: ReachstackerStatus;
}

export interface ReachstackerTelemetry {
  id: string;
  x: number;
  z: number;
  lat: number;
  lng: number;
  nearestStockName: string;
  status: ReachstackerStatus;
  speedKmh: number;
}

// Terminal GPS origin (e.g., Port Container Terminal)
export const TERMINAL_ORIGIN_LAT = 40.37124;
export const TERMINAL_ORIGIN_LNG = 49.85341;

export function worldXZToGps(x: number, z: number): { lat: number; lng: number } {
  // ~111,320 meters per degree latitude
  const lat = TERMINAL_ORIGIN_LAT - z / 111320;
  const lng =
    TERMINAL_ORIGIN_LNG +
    x / (111320 * Math.cos((TERMINAL_ORIGIN_LAT * Math.PI) / 180));
  return { lat, lng };
}

export type ContainerStatus = 'in_stock' | 'in_repair' | 'scheduled_release';

export interface ContainerItem {
  id: string;
  containerNumber: string;
  isoType: ContainerIsoType;
  ownerId: string;
  stockId: string;
  bay: number; // 1-indexed starting 20ft bay (for 40ft, occupies bay and bay+1)
  row: number; // 1-indexed row
  tier: number; // 1..6
  status: ContainerStatus;
  weightTons: number;
  temperatureC?: number;
  cargoNotes?: string;
  arrivedAt: string;
}

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  actionType: 'drop_off' | 'pick_up' | 'release' | 'move' | 'repair' | 'buried_extract';
  containerNumber: string;
  isoType: ContainerIsoType;
  ownerName: string;
  details: string;
  craneOperations: number;
  totalCostUsd: number;
}

export type AppMode = 'constructor' | 'operations';
export type ConstructorTool =
  | 'select'
  | 'add_stock'
  | 'add_road'
  | 'add_fence'
  | 'add_gate_ocr'
  | 'add_light_tower'
  | 'add_reachstacker';

export type CameraMode = 'isometric' | 'perspective';
export type ThemeMode = 'dark' | 'gray' | 'white';

export interface CameraTarget {
  position: [number, number, number];
  timestamp: number;
}
