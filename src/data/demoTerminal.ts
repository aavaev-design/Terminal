import {
  ClientOwner,
  ContainerItem,
  FenceSegment,
  ISO_TYPE_SPECS,
  OperationLogEntry,
  RoadSegment,
  StockZone,
  TerminalProp,
} from '../types/terminal';

// Standard slot pitch in meters on the terminal pad
export const BAY_PITCH_M = 6.35; // 20ft container (6.06m) + 0.29m clearance
export const ROW_PITCH_M = 2.85; // 2.44m width + 0.41m clearance
export const TIER_PITCH_M = 2.75; // average vertical step per tier

export const DEFAULT_CLIENTS: ClientOwner[] = [
  { id: 'msc', name: 'MSC', codePrefix: 'MSCU', color: '#eab308' },
  { id: 'maersk', name: 'Maersk', codePrefix: 'MAEU', color: '#2dd4bf' },
  { id: 'fesco', name: 'FESCO', codePrefix: 'FESO', color: '#f97316' },
  { id: 'sinokor', name: 'Sinokor', codePrefix: 'SKRU', color: '#22c55e' },
  { id: 'cmacgm', name: 'CMA CGM', codePrefix: 'CMAU', color: '#38bdf8' },
];

export const DEMO_STOCKS: StockZone[] = [
  {
    id: 'stock-msc',
    name: 'Stock A (MSC Line)',
    zoneType: 'standard',
    x: -10,
    z: -8,
    bays: 2,
    rows: 3,
    maxTiers: 6,
    rotationDeg: 0,
    color: '#eab308',
    badgeNumber: 2,
    badgeLabel: 'Shipping Line Stocks (MSC / Maersk)',
  },
  {
    id: 'stock-maersk',
    name: 'Stock B (Maersk & Reefer)',
    zoneType: 'reefer',
    x: 6,
    z: -8,
    bays: 2,
    rows: 3,
    maxTiers: 6,
    rotationDeg: 0,
    color: '#2dd4bf',
  },
  {
    id: 'stock-fesco',
    name: 'Stock C (FESCO & Flatrack)',
    zoneType: 'standard',
    x: 22,
    z: -8,
    bays: 2,
    rows: 3,
    maxTiers: 6,
    rotationDeg: 0,
    color: '#f97316',
  },
  {
    id: 'stock-sinokor',
    name: 'Stock D (Sinokor 20ft Block)',
    zoneType: 'standard',
    x: 2,
    z: 14,
    bays: 2,
    rows: 2,
    maxTiers: 6,
    rotationDeg: 0,
    color: '#22c55e',
  },
  {
    id: 'stock-repair',
    name: 'Repair & Inspection Shop',
    zoneType: 'repair',
    x: -28,
    z: 6,
    bays: 2,
    rows: 2,
    maxTiers: 4,
    rotationDeg: 0,
    color: '#ef4444',
    badgeNumber: 3,
    badgeLabel: 'Repair & Inspection Shop',
  },
];

export const DEMO_ROADS: RoadSegment[] = [
  {
    id: 'road-main-north',
    name: 'Gate Access Corridor',
    startX: -40,
    startZ: -20,
    endX: 38,
    endZ: -20,
    width: 6,
    markingColor: 'white',
  },
  {
    id: 'road-loading-lane',
    name: 'Reachstacker Loading Lane',
    startX: -22,
    startZ: 2,
    endX: 36,
    endZ: 2,
    width: 6.5,
    markingColor: 'yellow',
  },
  {
    id: 'road-west-connector',
    name: 'West Service Road',
    startX: -20,
    startZ: -20,
    endX: -20,
    endZ: 24,
    width: 5.5,
    markingColor: 'white',
  },
];

export const DEMO_FENCES: FenceSegment[] = [
  {
    id: 'fence-north',
    name: 'North Perimeter Fence',
    startX: -42,
    startZ: -27,
    endX: 40,
    endZ: -27,
    height: 2.6,
    hasGate: true,
  },
  {
    id: 'fence-west',
    name: 'West Perimeter Fence',
    startX: -42,
    startZ: -27,
    endX: -42,
    endZ: 26,
    height: 2.6,
  },
  {
    id: 'fence-south',
    name: 'South Perimeter Fence',
    startX: -42,
    startZ: 26,
    endX: 40,
    endZ: 26,
    height: 2.6,
  },
  {
    id: 'fence-east',
    name: 'East Perimeter Fence',
    startX: 40,
    startZ: -27,
    endX: 40,
    endZ: 26,
    height: 2.6,
  },
];

export const DEMO_PROPS: TerminalProp[] = [
  {
    id: 'prop-gate-1',
    type: 'gate_ocr',
    name: 'Main OCR Gate & Weighbridge',
    x: -14,
    z: -21,
    rotationDeg: 0,
    badgeNumber: 1,
    badgeLabel: 'Gate & Weighbridge (OCR)',
  },
  {
    id: 'prop-reachstacker-1',
    type: 'reachstacker',
    name: 'Kalmar RS-01',
    x: 18,
    z: 2,
    rotationDeg: 0,
    badgeNumber: 4,
    badgeLabel: 'Loading Zone / RS-01',
    status: 'operating',
    waypoints: [
      [-16, 2],
      [4, 2],
      [26, 2],
      [4, 2],
    ],
  },
  {
    id: 'prop-reachstacker-2',
    type: 'reachstacker',
    name: 'Hyster RS-02',
    x: -20,
    z: -16,
    rotationDeg: 90,
    badgeLabel: 'RS-02 (North / Repair)',
    status: 'transit',
    waypoints: [
      [-20, -20],
      [20, -20],
      [-20, -20],
      [-20, 14],
    ],
  },
  {
    id: 'prop-light-1',
    type: 'light_tower',
    name: 'Yard Floodlight North',
    x: -6,
    z: -16,
    rotationDeg: 0,
  },
  {
    id: 'prop-light-2',
    type: 'light_tower',
    name: 'Yard Floodlight East',
    x: 34,
    z: -8,
    rotationDeg: 0,
  },
  {
    id: 'prop-light-3',
    type: 'light_tower',
    name: 'Yard Floodlight South',
    x: -16,
    z: 18,
    rotationDeg: 0,
  },
];

export const DEMO_CONTAINERS: ContainerItem[] = [
  // Stock A (MSC) - 3 rows of 40ft stacks (up to 4-5 tiers high to demonstrate buried container extraction!)
  { id: 'c-1', containerNumber: 'MSCU4081120', isoType: '40HC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 1, tier: 1, status: 'in_stock', weightTons: 26.4, cargoNotes: 'Consumer Electronics', arrivedAt: '2026-11-18 08:30' },
  { id: 'c-2', containerNumber: 'MSCU4081136', isoType: '40HC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 1, tier: 2, status: 'in_stock', weightTons: 24.1, cargoNotes: 'Auto Parts', arrivedAt: '2026-11-18 09:15' },
  { id: 'c-3', containerNumber: 'MSCU4081141', isoType: '40DC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 1, tier: 3, status: 'in_stock', weightTons: 21.0, cargoNotes: 'Textiles', arrivedAt: '2026-11-18 10:00' },
  { id: 'c-4', containerNumber: 'MSCU4081157', isoType: '40HC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 1, tier: 4, status: 'in_stock', weightTons: 19.5, cargoNotes: 'Furniture', arrivedAt: '2026-11-18 11:20' },

  { id: 'c-5', containerNumber: 'MSCU5192014', isoType: '40DC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 2, tier: 1, status: 'in_stock', weightTons: 28.0, cargoNotes: 'Steel Coils', arrivedAt: '2026-11-18 12:10' },
  { id: 'c-6', containerNumber: 'MSCU5192020', isoType: '40HC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 2, tier: 2, status: 'in_stock', weightTons: 22.8, cargoNotes: 'Machinery', arrivedAt: '2026-11-18 13:05' },
  { id: 'c-7', containerNumber: 'MSCU5192035', isoType: '40HC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 2, tier: 3, status: 'in_stock', weightTons: 18.2, cargoNotes: 'Packaging Goods', arrivedAt: '2026-11-18 14:40' },

  { id: 'c-8', containerNumber: 'MSCU6203319', isoType: '40DC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 3, tier: 1, status: 'in_stock', weightTons: 25.3, cargoNotes: 'Polymer Resin', arrivedAt: '2026-11-18 15:10' },
  { id: 'c-9', containerNumber: 'MSCU6203324', isoType: '40DC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 3, tier: 2, status: 'in_stock', weightTons: 23.0, cargoNotes: 'Paper Rolls', arrivedAt: '2026-11-18 16:00' },
  { id: 'c-10', containerNumber: 'MSCU6203330', isoType: '40HC', ownerId: 'msc', stockId: 'stock-msc', bay: 1, row: 3, tier: 3, status: 'in_stock', weightTons: 20.1, cargoNotes: 'Appliances', arrivedAt: '2026-11-18 16:45' },

  // Stock B (Maersk & Reefers)
  { id: 'c-11', containerNumber: 'MAEU7014412', isoType: '40HCRF', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 1, tier: 1, status: 'in_stock', weightTons: 27.5, temperatureC: -18, cargoNotes: 'Frozen Seafood (Reefer)', arrivedAt: '2026-11-19 07:20' },
  { id: 'c-12', containerNumber: 'MAEU7014428', isoType: '40HCRF', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 1, tier: 2, status: 'in_stock', weightTons: 25.9, temperatureC: -22, cargoNotes: 'Frozen Poultry (Reefer)', arrivedAt: '2026-11-19 08:00' },
  { id: 'c-13', containerNumber: 'MAEU7014433', isoType: '40HC', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 1, tier: 3, status: 'in_stock', weightTons: 21.4, cargoNotes: 'Medical Supplies', arrivedAt: '2026-11-19 08:50' },
  { id: 'c-14', containerNumber: 'MAEU7014449', isoType: '40HC', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 1, tier: 4, status: 'in_stock', weightTons: 17.8, cargoNotes: 'Dry Foodstuffs', arrivedAt: '2026-11-19 09:30' },

  { id: 'c-15', containerNumber: 'MAEU8391011', isoType: '40HCRF', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 2, tier: 1, status: 'in_stock', weightTons: 26.2, temperatureC: 4, cargoNotes: 'Chilled Fruit (Reefer)', arrivedAt: '2026-11-19 10:15' },
  { id: 'c-16', containerNumber: 'MAEU8391027', isoType: '40DC', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 2, tier: 2, status: 'in_stock', weightTons: 23.7, cargoNotes: 'Solar Panels', arrivedAt: '2026-11-19 11:00' },
  { id: 'c-17', containerNumber: 'MAEU8391032', isoType: '40HC', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 2, tier: 3, status: 'in_stock', weightTons: 19.3, cargoNotes: 'Retail Goods', arrivedAt: '2026-11-19 11:45' },

  { id: 'c-18', containerNumber: 'MAEU9102218', isoType: '20RF', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 3, tier: 1, status: 'in_stock', weightTons: 18.5, temperatureC: -15, cargoNotes: 'Dairy Products (20ft Reefer)', arrivedAt: '2026-11-19 12:30' },
  { id: 'c-19', containerNumber: 'MAEU9102223', isoType: '20DC', ownerId: 'maersk', stockId: 'stock-maersk', bay: 2, row: 3, tier: 1, status: 'in_stock', weightTons: 16.9, cargoNotes: 'Spare Parts', arrivedAt: '2026-11-19 12:50' },
  { id: 'c-20', containerNumber: 'MAEU9102239', isoType: '20RF', ownerId: 'maersk', stockId: 'stock-maersk', bay: 1, row: 3, tier: 2, status: 'in_stock', weightTons: 17.2, temperatureC: 2, cargoNotes: 'Pharmaceuticals (Reefer)', arrivedAt: '2026-11-19 13:15' },

  // Stock C (FESCO & Flatracks)
  { id: 'c-21', containerNumber: 'FESO3019910', isoType: '40DC', ownerId: 'fesco', stockId: 'stock-fesco', bay: 1, row: 1, tier: 1, status: 'in_stock', weightTons: 27.1, cargoNotes: 'Timber & Plywood', arrivedAt: '2026-11-19 14:00' },
  { id: 'c-22', containerNumber: 'FESO3019926', isoType: '40HC', ownerId: 'fesco', stockId: 'stock-fesco', bay: 1, row: 1, tier: 2, status: 'in_stock', weightTons: 22.4, cargoNotes: 'Industrial Valves', arrivedAt: '2026-11-19 14:30' },
  { id: 'c-23', containerNumber: 'FESO3019931', isoType: '40DC', ownerId: 'fesco', stockId: 'stock-fesco', bay: 1, row: 2, tier: 1, status: 'in_stock', weightTons: 25.0, cargoNotes: 'Chemical Drums', arrivedAt: '2026-11-19 15:00' },
  { id: 'c-24', containerNumber: 'FESO3019947', isoType: '40FR', ownerId: 'fesco', stockId: 'stock-fesco', bay: 1, row: 2, tier: 2, status: 'in_stock', weightTons: 29.8, cargoNotes: 'Excavator Boom (40ft Flatrack)', arrivedAt: '2026-11-19 15:40' },
  { id: 'c-25', containerNumber: 'FESO3019952', isoType: '20FR', ownerId: 'fesco', stockId: 'stock-fesco', bay: 1, row: 3, tier: 1, status: 'in_stock', weightTons: 21.5, cargoNotes: 'Heavy Transformer (20ft Flatrack)', arrivedAt: '2026-11-19 16:10' },
  { id: 'c-26', containerNumber: 'FESO3019968', isoType: '20DC', ownerId: 'fesco', stockId: 'stock-fesco', bay: 2, row: 3, tier: 1, status: 'in_stock', weightTons: 18.0, cargoNotes: 'Hardware', arrivedAt: '2026-11-19 16:30' },

  // Stock D (Sinokor 20ft Block)
  { id: 'c-27', containerNumber: 'SKRU2041101', isoType: '20DC', ownerId: 'sinokor', stockId: 'stock-sinokor', bay: 1, row: 1, tier: 1, status: 'in_stock', weightTons: 19.4, cargoNotes: 'Battery Modules', arrivedAt: '2026-11-20 07:00' },
  { id: 'c-28', containerNumber: 'SKRU2041117', isoType: '20DC', ownerId: 'sinokor', stockId: 'stock-sinokor', bay: 1, row: 1, tier: 2, status: 'in_stock', weightTons: 17.1, cargoNotes: 'Synthetic Rubber', arrivedAt: '2026-11-20 07:30' },
  { id: 'c-29', containerNumber: 'SKRU2041122', isoType: '20DC', ownerId: 'sinokor', stockId: 'stock-sinokor', bay: 2, row: 1, tier: 1, status: 'in_stock', weightTons: 20.2, cargoNotes: 'Copper Wire', arrivedAt: '2026-11-20 08:00' },
  { id: 'c-30', containerNumber: 'SKRU2041138', isoType: '20FR', ownerId: 'sinokor', stockId: 'stock-sinokor', bay: 2, row: 1, tier: 2, status: 'in_stock', weightTons: 15.6, cargoNotes: 'Steel Pipes (20ft Flatrack)', arrivedAt: '2026-11-20 08:15' },
  { id: 'c-31', containerNumber: 'SKRU2041143', isoType: '20DC', ownerId: 'sinokor', stockId: 'stock-sinokor', bay: 1, row: 2, tier: 1, status: 'in_stock', weightTons: 18.9, cargoNotes: 'Ceramics', arrivedAt: '2026-11-20 08:45' },
  { id: 'c-32', containerNumber: 'SKRU2041159', isoType: '20DC', ownerId: 'sinokor', stockId: 'stock-sinokor', bay: 2, row: 2, tier: 1, status: 'in_stock', weightTons: 16.4, cargoNotes: 'Lubricants', arrivedAt: '2026-11-20 09:00' },

  // Stock E (Repair & Inspection Shop - 4 containers in repair matching screenshot KPI "34 in Depot | 4 In Repair")
  { id: 'c-33', containerNumber: 'MSCU1109482', isoType: '20DC', ownerId: 'msc', stockId: 'stock-repair', bay: 1, row: 1, tier: 1, status: 'in_repair', weightTons: 2.3, cargoNotes: 'Door Gasket & Floor Welding', arrivedAt: '2026-11-17 11:00' },
  { id: 'c-34', containerNumber: 'MAEU2294810', isoType: '20RF', ownerId: 'maersk', stockId: 'stock-repair', bay: 1, row: 1, tier: 2, status: 'in_repair', weightTons: 3.1, temperatureC: 0, cargoNotes: 'Compressor Diagnostics', arrivedAt: '2026-11-17 14:20' },
  { id: 'c-35', containerNumber: 'FESO4910234', isoType: '20DC', ownerId: 'fesco', stockId: 'stock-repair', bay: 1, row: 2, tier: 1, status: 'in_repair', weightTons: 2.3, cargoNotes: 'Side Panel Dent Repair', arrivedAt: '2026-11-18 09:40' },
  { id: 'c-36', containerNumber: 'SKRU8821904', isoType: '20DC', ownerId: 'sinokor', stockId: 'stock-repair', bay: 1, row: 2, tier: 2, status: 'in_repair', weightTons: 2.2, cargoNotes: 'Corner Casting Inspection', arrivedAt: '2026-11-19 16:00' },
];

export const DEMO_LOGS: OperationLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-11-20 09:00',
    actionType: 'drop_off',
    containerNumber: 'SKRU2041159',
    isoType: '20DC',
    ownerName: 'Sinokor',
    details: 'Gate-In Drop Off to Stock D (Sinokor 20ft Block) [Bay 2, Row 2, Tier 1]',
    craneOperations: 1,
    totalCostUsd: 20,
  },
  {
    id: 'log-2',
    timestamp: '2026-11-19 16:00',
    actionType: 'repair',
    containerNumber: 'SKRU8821904',
    isoType: '20DC',
    ownerName: 'Sinokor',
    details: 'Transferred to Repair & Inspection Shop [Bay 1, Row 2, Tier 2]',
    craneOperations: 1,
    totalCostUsd: 20,
  },
];

/**
 * Computes the exact 3D world position [x, y, z] and rotation in radians for a container
 * inside a given StockZone at (bay, row, tier).
 */
export function getContainerWorldPosition(
  stock: StockZone,
  container: Pick<ContainerItem, 'bay' | 'row' | 'tier' | 'isoType'>
): { position: [number, number, number]; rotationY: number } {
  const spec = ISO_TYPE_SPECS[container.isoType];
  const totalLengthM = stock.bays * BAY_PITCH_M;
  const totalWidthM = stock.rows * ROW_PITCH_M;

  // Local offset from stock center
  // A 20ft container occupies 1 bay; a 40ft occupies 2 bays (centered across bay and bay+1)
  const baySpanCenter = container.bay - 1 + (spec.baysRequired - 1) * 0.5;
  const localX = -totalLengthM / 2 + BAY_PITCH_M / 2 + baySpanCenter * BAY_PITCH_M;
  const localZ = -totalWidthM / 2 + ROW_PITCH_M / 2 + (container.row - 1) * ROW_PITCH_M;

  const y = 0.12 + (container.tier - 1) * TIER_PITCH_M + spec.heightM / 2;

  const rad = (stock.rotationDeg * Math.PI) / 180;
  const worldX = stock.x + localX * Math.cos(rad) - localZ * Math.sin(rad);
  const worldZ = stock.z + localX * Math.sin(rad) + localZ * Math.cos(rad);

  return {
    position: [worldX, y, worldZ],
    rotationY: -rad,
  };
}
