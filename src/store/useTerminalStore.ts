import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppMode,
  CameraMode,
  CameraTarget,
  ClientOwner,
  ConstructorTool,
  ContainerIsoType,
  ContainerItem,
  ContainerStatus,
  FenceSegment,
  ISO_TYPE_SPECS,
  OperationLogEntry,
  ReachstackerTelemetry,
  RoadSegment,
  StockZone,
  TerminalProp,
  ThemeMode,
} from '../types/terminal';
import {
  DEFAULT_CLIENTS,
  DEMO_CONTAINERS,
  DEMO_FENCES,
  DEMO_LOGS,
  DEMO_PROPS,
  DEMO_ROADS,
  DEMO_STOCKS,
  getContainerWorldPosition,
} from '../data/demoTerminal';

export interface ValidSlot {
  stockId: string;
  bay: number;
  row: number;
  tier: number;
}

export interface PendingExtractionModal {
  containerId: string;
  actionType: 'release' | 'pick_up' | 'repair' | 'move';
  targetStockId?: string;
}

interface TerminalState {
  // Modes & Camera
  appMode: AppMode;
  activeTool: ConstructorTool;
  cameraMode: CameraMode;
  themeMode: ThemeMode;
  cameraTarget: CameraTarget | null;
  resetCameraTrigger: number;

  // Filters & Selection
  selectedOwnerFilter: string; // 'all' | ownerId | 'repair'
  selectedContainerId: string | null;
  recentlyViewedIds: string[];
  reachstackerTelemetry: Record<string, ReachstackerTelemetry>;
  selectedInfraId: string | null;
  selectedInfraType: 'stock' | 'road' | 'fence' | 'prop' | null;

  // Pricing
  cranePricePerOp: number; // default $20

  // Modals / Drawers
  isInventoryOpen: boolean;
  isDropOffModalOpen: boolean;
  dropOffPreselectStockId: string | null;
  pendingExtraction: PendingExtractionModal | null;

  // Domain Data
  clients: ClientOwner[];
  stocks: StockZone[];
  roads: RoadSegment[];
  fences: FenceSegment[];
  props: TerminalProp[];
  containers: ContainerItem[];
  operationLogs: OperationLogEntry[];

  // Mode & UI Setters
  setAppMode: (mode: AppMode) => void;
  setActiveTool: (tool: ConstructorTool) => void;
  setCameraMode: (mode: CameraMode) => void;
  setThemeMode: (theme: ThemeMode) => void;
  triggerCameraReset: () => void;
  setSelectedOwnerFilter: (filter: string) => void;
  setSelectedContainerId: (id: string | null) => void;
  selectInfrastructure: (id: string | null, type: 'stock' | 'road' | 'fence' | 'prop' | null) => void;
  setCranePricePerOp: (price: number) => void;
  setIsInventoryOpen: (open: boolean) => void;
  openDropOffModal: (stockId?: string) => void;
  closeDropOffModal: () => void;
  setPendingExtraction: (modal: PendingExtractionModal | null) => void;

  // 3D Fly-To & Telemetry
  flyToContainer: (containerId: string) => void;
  flyToStock: (stockId: string) => void;
  flyToPosition: (position: [number, number, number]) => void;
  updateReachstackerTelemetry: (telemetry: ReachstackerTelemetry) => void;

  // Phase 1: Constructor Actions
  addStock: (stock: Omit<StockZone, 'id'>) => string;
  updateStock: (id: string, patch: Partial<StockZone>) => void;
  deleteStock: (id: string) => void;

  addRoad: (road: Omit<RoadSegment, 'id'>) => void;
  updateRoad: (id: string, patch: Partial<RoadSegment>) => void;
  deleteRoad: (id: string) => void;

  addFence: (fence: Omit<FenceSegment, 'id'>) => void;
  updateFence: (id: string, patch: Partial<FenceSegment>) => void;
  deleteFence: (id: string) => void;

  addProp: (prop: Omit<TerminalProp, 'id'>) => void;
  updateProp: (id: string, patch: Partial<TerminalProp>) => void;
  deleteProp: (id: string) => void;

  addClient: (client: Omit<ClientOwner, 'id'>) => void;

  // Phase 2: Container Stacking & Operations
  getBlockingContainers: (containerId: string) => ContainerItem[];
  findValidSlots: (stockId: string, isoType: ContainerIsoType, ignoreContainerId?: string) => ValidSlot[];
  dropOffContainer: (payload: {
    containerNumber: string;
    isoType: ContainerIsoType;
    ownerId: string;
    stockId: string;
    bay: number;
    row: number;
    tier: number;
    status?: ContainerStatus;
    weightTons: number;
    temperatureC?: number;
    cargoNotes?: string;
  }) => { success: boolean; error?: string; id?: string };

  requestContainerAction: (
    containerId: string,
    actionType: 'release' | 'pick_up' | 'repair' | 'move',
    targetStockId?: string
  ) => void;

  confirmContainerAction: (
    containerId: string,
    actionType: 'release' | 'pick_up' | 'repair' | 'move',
    customRateUsd?: number,
    targetSlot?: ValidSlot
  ) => void;

  // Import / Export / Reset
  resetToDemoTerminal: () => void;
  importTerminalJson: (jsonString: string) => { success: boolean; error?: string };
}

function getOccupiedBays(bay: number, isoType: ContainerIsoType): number[] {
  const req = ISO_TYPE_SPECS[isoType].baysRequired;
  return req === 2 ? [bay, bay + 1] : [bay];
}

function baysOverlap(baysA: number[], baysB: number[]): boolean {
  return baysA.some((b) => baysB.includes(b));
}

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      appMode: 'operations',
      activeTool: 'select',
      cameraMode: 'isometric',
      themeMode: 'white',
      cameraTarget: null,
      resetCameraTrigger: 0,

      selectedOwnerFilter: 'all',
      selectedContainerId: null,
      recentlyViewedIds: ['c-1', 'c-11', 'c-24'],
      reachstackerTelemetry: {},
      selectedInfraId: null,
      selectedInfraType: null,

      cranePricePerOp: 20,

      isInventoryOpen: true,
      isDropOffModalOpen: false,
      dropOffPreselectStockId: null,
      pendingExtraction: null,

      clients: DEFAULT_CLIENTS,
      stocks: DEMO_STOCKS,
      roads: DEMO_ROADS,
      fences: DEMO_FENCES,
      props: DEMO_PROPS,
      containers: DEMO_CONTAINERS,
      operationLogs: DEMO_LOGS,

      setAppMode: (mode) =>
        set({
          appMode: mode,
          activeTool: 'select',
          selectedInfraId: null,
          selectedInfraType: null,
        }),

      setActiveTool: (tool) => set({ activeTool: tool }),
      setCameraMode: (mode) => set({ cameraMode: mode }),
      setThemeMode: (theme) => set({ themeMode: theme }),
      triggerCameraReset: () =>
        set((s) => ({
          resetCameraTrigger: s.resetCameraTrigger + 1,
          cameraTarget: null,
          selectedContainerId: null,
        })),

      setSelectedOwnerFilter: (filter) => set({ selectedOwnerFilter: filter }),
      setSelectedContainerId: (id) =>
        set((s) => ({
          selectedContainerId: id,
          recentlyViewedIds: id
            ? [id, ...s.recentlyViewedIds.filter((r) => r !== id)].slice(0, 6)
            : s.recentlyViewedIds,
        })),
      selectInfrastructure: (id, type) =>
        set({ selectedInfraId: id, selectedInfraType: type, selectedContainerId: null }),
      setCranePricePerOp: (price) =>
        set({ cranePricePerOp: Math.max(0, Number.isFinite(price) ? price : 20) }),
      setIsInventoryOpen: (open) => set({ isInventoryOpen: open }),

      openDropOffModal: (stockId) =>
        set({ isDropOffModalOpen: true, dropOffPreselectStockId: stockId ?? null }),
      closeDropOffModal: () =>
        set({ isDropOffModalOpen: false, dropOffPreselectStockId: null }),
      setPendingExtraction: (modal) => set({ pendingExtraction: modal }),

      flyToContainer: (containerId) => {
        const state = get();
        const container = state.containers.find((c) => c.id === containerId);
        if (!container) return;
        const stock = state.stocks.find((s) => s.id === container.stockId);
        if (!stock) return;
        const { position } = getContainerWorldPosition(stock, container);
        set((s) => ({
          selectedContainerId: containerId,
          recentlyViewedIds: [
            containerId,
            ...s.recentlyViewedIds.filter((r) => r !== containerId),
          ].slice(0, 6),
          cameraTarget: {
            position,
            timestamp: Date.now(),
          },
        }));
      },

      flyToStock: (stockId) => {
        const stock = get().stocks.find((s) => s.id === stockId);
        if (!stock) return;
        set({
          cameraTarget: {
            position: [stock.x, 2, stock.z],
            timestamp: Date.now(),
          },
        });
      },

      flyToPosition: (position) => {
        set({
          cameraTarget: {
            position,
            timestamp: Date.now(),
          },
        });
      },

      updateReachstackerTelemetry: (telemetry) => {
        set((s) => ({
          reachstackerTelemetry: {
            ...s.reachstackerTelemetry,
            [telemetry.id]: telemetry,
          },
        }));
      },

      addStock: (stockData) => {
        const id = `stock-${Date.now()}`;
        const newStock: StockZone = {
          ...stockData,
          id,
          maxTiers: Math.min(6, Math.max(1, stockData.maxTiers || 6)),
        };
        set((s) => ({
          stocks: [...s.stocks, newStock],
          selectedInfraId: id,
          selectedInfraType: 'stock',
          activeTool: 'select',
        }));
        return id;
      },

      updateStock: (id, patch) =>
        set((s) => ({
          stocks: s.stocks.map((st) =>
            st.id === id
              ? {
                  ...st,
                  ...patch,
                  maxTiers:
                    patch.maxTiers !== undefined
                      ? Math.min(6, Math.max(1, patch.maxTiers))
                      : st.maxTiers,
                }
              : st
          ),
        })),

      deleteStock: (id) =>
        set((s) => ({
          stocks: s.stocks.filter((st) => st.id !== id),
          containers: s.containers.filter((c) => c.stockId !== id),
          selectedInfraId: s.selectedInfraId === id ? null : s.selectedInfraId,
          selectedInfraType: s.selectedInfraId === id ? null : s.selectedInfraType,
        })),

      addRoad: (road) => {
        const id = `road-${Date.now()}`;
        set((s) => ({
          roads: [...s.roads, { ...road, id }],
          selectedInfraId: id,
          selectedInfraType: 'road',
          activeTool: 'select',
        }));
      },

      updateRoad: (id, patch) =>
        set((s) => ({
          roads: s.roads.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteRoad: (id) =>
        set((s) => ({
          roads: s.roads.filter((r) => r.id !== id),
          selectedInfraId: s.selectedInfraId === id ? null : s.selectedInfraId,
          selectedInfraType: s.selectedInfraId === id ? null : s.selectedInfraType,
        })),

      addFence: (fence) => {
        const id = `fence-${Date.now()}`;
        set((s) => ({
          fences: [...s.fences, { ...fence, id }],
          selectedInfraId: id,
          selectedInfraType: 'fence',
          activeTool: 'select',
        }));
      },

      updateFence: (id, patch) =>
        set((s) => ({
          fences: s.fences.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        })),

      deleteFence: (id) =>
        set((s) => ({
          fences: s.fences.filter((f) => f.id !== id),
          selectedInfraId: s.selectedInfraId === id ? null : s.selectedInfraId,
          selectedInfraType: s.selectedInfraId === id ? null : s.selectedInfraType,
        })),

      addProp: (prop) => {
        const id = `prop-${Date.now()}`;
        set((s) => ({
          props: [...s.props, { ...prop, id }],
          selectedInfraId: id,
          selectedInfraType: 'prop',
          activeTool: 'select',
        }));
      },

      updateProp: (id, patch) =>
        set((s) => ({
          props: s.props.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProp: (id) =>
        set((s) => ({
          props: s.props.filter((p) => p.id !== id),
          selectedInfraId: s.selectedInfraId === id ? null : s.selectedInfraId,
          selectedInfraType: s.selectedInfraId === id ? null : s.selectedInfraType,
        })),

      addClient: (client) => {
        const id = `client-${Date.now()}`;
        set((s) => ({
          clients: [...s.clients, { ...client, id }],
        }));
      },

      getBlockingContainers: (containerId) => {
        const state = get();
        const target = state.containers.find((c) => c.id === containerId);
        if (!target) return [];
        const targetBays = getOccupiedBays(target.bay, target.isoType);

        return state.containers
          .filter(
            (c) =>
              c.id !== target.id &&
              c.stockId === target.stockId &&
              c.row === target.row &&
              c.tier > target.tier &&
              baysOverlap(targetBays, getOccupiedBays(c.bay, c.isoType))
          )
          .sort((a, b) => b.tier - a.tier);
      },

      findValidSlots: (stockId, isoType, ignoreContainerId) => {
        const state = get();
        const stock = state.stocks.find((s) => s.id === stockId);
        if (!stock) return [];

        const spec = ISO_TYPE_SPECS[isoType];
        const maxTiers = Math.min(6, stock.maxTiers || 6);
        const stockContainers = state.containers.filter(
          (c) => c.stockId === stockId && c.id !== ignoreContainerId
        );

        const validSlots: ValidSlot[] = [];
        const maxStartBay = stock.bays - (spec.baysRequired - 1);

        for (let row = 1; row <= stock.rows; row++) {
          for (let bay = 1; bay <= maxStartBay; bay++) {
            const candidateBays = getOccupiedBays(bay, isoType);

            for (let tier = 1; tier <= maxTiers; tier++) {
              // Check if candidate slot is already occupied at this tier
              const isOccupied = stockContainers.some(
                (c) =>
                  c.row === row &&
                  c.tier === tier &&
                  baysOverlap(candidateBays, getOccupiedBays(c.bay, c.isoType))
              );
              if (isOccupied) continue;

              if (tier === 1) {
                validSlots.push({ stockId, bay, row, tier });
              } else {
                // Check support at tier - 1
                const belowContainers = stockContainers.filter(
                  (c) =>
                    c.row === row &&
                    c.tier === tier - 1 &&
                    baysOverlap(candidateBays, getOccupiedBays(c.bay, c.isoType))
                );

                if (spec.baysRequired === 1) {
                  // 20ft container requires a 20ft container directly below it at the exact same bay
                  const direct20Support = belowContainers.some(
                    (c) =>
                      c.bay === bay &&
                      ISO_TYPE_SPECS[c.isoType].baysRequired === 1
                  );
                  if (direct20Support) {
                    validSlots.push({ stockId, bay, row, tier });
                  }
                } else {
                  // 40ft container requires either one 40ft container below at same bay, or two 20ft containers covering bay and bay+1
                  const direct40Support = belowContainers.some(
                    (c) =>
                      c.bay === bay &&
                      ISO_TYPE_SPECS[c.isoType].baysRequired === 2
                  );
                  const dual20Support =
                    belowContainers.some(
                      (c) =>
                        c.bay === bay &&
                        ISO_TYPE_SPECS[c.isoType].baysRequired === 1
                    ) &&
                    belowContainers.some(
                      (c) =>
                        c.bay === bay + 1 &&
                        ISO_TYPE_SPECS[c.isoType].baysRequired === 1
                    );

                  if (direct40Support || dual20Support) {
                    validSlots.push({ stockId, bay, row, tier });
                  }
                }
              }
            }
          }
        }

        // Sort lowest tier first, then row, then bay
        return validSlots.sort((a, b) => a.tier - b.tier || a.row - b.row || a.bay - b.bay);
      },

      dropOffContainer: (payload) => {
        const state = get();
        const stock = state.stocks.find((s) => s.id === payload.stockId);
        if (!stock) {
          return { success: false, error: 'Selected Stock does not exist.' };
        }
        if (payload.tier < 1 || payload.tier > Math.min(6, stock.maxTiers)) {
          return {
            success: false,
            error: `Tier must be between 1 and ${Math.min(6, stock.maxTiers)} for ${stock.name}.`,
          };
        }

        const validSlots = state.findValidSlots(payload.stockId, payload.isoType);
        const isSlotValid = validSlots.some(
          (sl) =>
            sl.bay === payload.bay &&
            sl.row === payload.row &&
            sl.tier === payload.tier
        );

        if (!isSlotValid) {
          return {
            success: false,
            error:
              'Selected Bay/Row/Tier is either occupied or lacks valid vertical container support below it.',
          };
        }

        const id = `c-${Date.now()}`;
        const owner = state.clients.find((cl) => cl.id === payload.ownerId);
        const status: ContainerStatus =
          stock.zoneType === 'repair'
            ? 'in_repair'
            : payload.status || 'in_stock';

        const newContainer: ContainerItem = {
          id,
          containerNumber: payload.containerNumber.trim().toUpperCase(),
          isoType: payload.isoType,
          ownerId: payload.ownerId,
          stockId: payload.stockId,
          bay: payload.bay,
          row: payload.row,
          tier: payload.tier,
          status,
          weightTons: payload.weightTons,
          temperatureC: payload.temperatureC,
          cargoNotes: payload.cargoNotes,
          arrivedAt: formatNow(),
        };

        const newLog: OperationLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: formatNow(),
          actionType: 'drop_off',
          containerNumber: newContainer.containerNumber,
          isoType: newContainer.isoType,
          ownerName: owner?.name || 'Unknown',
          details: `Drop Off (Gate-In) to ${stock.name} [Bay ${newContainer.bay}, Row ${newContainer.row}, Tier ${newContainer.tier}]`,
          craneOperations: 1,
          totalCostUsd: state.cranePricePerOp,
        };

        const { position } = getContainerWorldPosition(stock, newContainer);

        set((s) => ({
          containers: [newContainer, ...s.containers],
          operationLogs: [newLog, ...s.operationLogs],
          selectedContainerId: id,
          isDropOffModalOpen: false,
          cameraTarget: {
            position,
            timestamp: Date.now(),
          },
        }));

        return { success: true, id };
      },

      requestContainerAction: (containerId, actionType, targetStockId) => {
        const state = get();
        const blocking = state.getBlockingContainers(containerId);

        // Always open the confirmation & crane cost modal when buried, or for move/release confirmation
        if (blocking.length > 0 || actionType === 'move') {
          set({
            pendingExtraction: {
              containerId,
              actionType,
              targetStockId,
            },
          });
        } else {
          // Even for top-of-stack release/pick_up/repair, open the quick confirmation modal so user sees the crane operation & fee
          set({
            pendingExtraction: {
              containerId,
              actionType,
              targetStockId,
            },
          });
        }
      },

      confirmContainerAction: (containerId, actionType, customRateUsd, targetSlot) => {
        const state = get();
        const target = state.containers.find((c) => c.id === containerId);
        if (!target) return;

        const rate =
          customRateUsd !== undefined ? customRateUsd : state.cranePricePerOp;
        const blocking = state.getBlockingContainers(containerId);
        const blockingIds = new Set(blocking.map((b) => b.id));
        const owner = state.clients.find((cl) => cl.id === target.ownerId);
        const sourceStock = state.stocks.find((s) => s.id === target.stockId);

        // Each blocking container requires 2 crane operations:
        // 1 lift to place nearby + 1 lift to place back into the stack
        const rehandleOps = blocking.length * 2;
        const primaryOp = 1; // The lift for the target container itself
        const totalOps = rehandleOps > 0 ? rehandleOps + primaryOp : primaryOp;
        const totalCostUsd = totalOps * rate;

        if (actionType === 'release' || actionType === 'pick_up') {
          // Remove target container, and shift blocking containers down by 1 tier (placed back)
          const updatedContainers = state.containers
            .filter((c) => c.id !== containerId)
            .map((c) =>
              blockingIds.has(c.id) ? { ...c, tier: Math.max(1, c.tier - 1) } : c
            );

          const actionLabel =
            actionType === 'release' ? 'Released (Gate-Out)' : 'Picked Up by Truck';
          const buriedNote =
            blocking.length > 0
              ? ` | Re-handled ${blocking.length} blocking container(s) (${rehandleOps} restack ops + 1 pick-up op @ $${rate}/op)`
              : ` | Direct top-tier lift (1 op @ $${rate}/op)`;

          const newLog: OperationLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: formatNow(),
            actionType: blocking.length > 0 ? 'buried_extract' : actionType,
            containerNumber: target.containerNumber,
            isoType: target.isoType,
            ownerName: owner?.name || 'Unknown',
            details: `${actionLabel} from ${sourceStock?.name || 'Stock'} [Bay ${target.bay}, Row ${target.row}, Tier ${target.tier}]${buriedNote}`,
            craneOperations: totalOps,
            totalCostUsd,
          };

          set({
            containers: updatedContainers,
            operationLogs: [newLog, ...state.operationLogs],
            selectedContainerId: null,
            pendingExtraction: null,
            cranePricePerOp: rate,
          });
          return;
        }

        if (actionType === 'repair') {
          const repairStock =
            state.stocks.find((s) => s.zoneType === 'repair') || sourceStock;
          if (!repairStock) return;

          // Find first valid slot in repair stock
          const slots = state.findValidSlots(
            repairStock.id,
            target.isoType,
            target.id
          );
          const chosenSlot = targetSlot || slots[0] || {
            stockId: repairStock.id,
            bay: 1,
            row: 1,
            tier: 1,
          };

          const updatedContainers = state.containers.map((c) => {
            if (c.id === containerId) {
              return {
                ...c,
                stockId: chosenSlot.stockId,
                bay: chosenSlot.bay,
                row: chosenSlot.row,
                tier: chosenSlot.tier,
                status: 'in_repair' as ContainerStatus,
              };
            }
            if (blockingIds.has(c.id)) {
              return { ...c, tier: Math.max(1, c.tier - 1) };
            }
            return c;
          });

          const newLog: OperationLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: formatNow(),
            actionType: 'repair',
            containerNumber: target.containerNumber,
            isoType: target.isoType,
            ownerName: owner?.name || 'Unknown',
            details: `Moved to ${repairStock.name} [Bay ${chosenSlot.bay}, Row ${chosenSlot.row}, Tier ${chosenSlot.tier}]${
              blocking.length > 0
                ? ` (${blocking.length} blocking container(s) shifted & placed back)`
                : ''
            }`,
            craneOperations: totalOps,
            totalCostUsd,
          };

          set({
            containers: updatedContainers,
            operationLogs: [newLog, ...state.operationLogs],
            pendingExtraction: null,
            cranePricePerOp: rate,
          });
          return;
        }

        if (actionType === 'move' && targetSlot) {
          const destStock = state.stocks.find((s) => s.id === targetSlot.stockId);
          const nextStatus: ContainerStatus =
            destStock?.zoneType === 'repair' ? 'in_repair' : 'in_stock';

          const updatedContainers = state.containers.map((c) => {
            if (c.id === containerId) {
              return {
                ...c,
                stockId: targetSlot.stockId,
                bay: targetSlot.bay,
                row: targetSlot.row,
                tier: targetSlot.tier,
                status: nextStatus,
              };
            }
            if (blockingIds.has(c.id)) {
              return { ...c, tier: Math.max(1, c.tier - 1) };
            }
            return c;
          });

          const newLog: OperationLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: formatNow(),
            actionType: 'move',
            containerNumber: target.containerNumber,
            isoType: target.isoType,
            ownerName: owner?.name || 'Unknown',
            details: `Relocated to ${destStock?.name || 'Stock'} [Bay ${targetSlot.bay}, Row ${targetSlot.row}, Tier ${targetSlot.tier}]${
              blocking.length > 0
                ? ` (${blocking.length} blocking container(s) shifted & placed back)`
                : ''
            }`,
            craneOperations: totalOps,
            totalCostUsd,
          };

          set({
            containers: updatedContainers,
            operationLogs: [newLog, ...state.operationLogs],
            pendingExtraction: null,
            cranePricePerOp: rate,
          });
        }
      },

      resetToDemoTerminal: () =>
        set({
          clients: DEFAULT_CLIENTS,
          stocks: DEMO_STOCKS,
          roads: DEMO_ROADS,
          fences: DEMO_FENCES,
          props: DEMO_PROPS,
          containers: DEMO_CONTAINERS,
          operationLogs: DEMO_LOGS,
          selectedContainerId: null,
          selectedInfraId: null,
          selectedInfraType: null,
          selectedOwnerFilter: 'all',
        }),

      importTerminalJson: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (!Array.isArray(parsed.stocks) || !Array.isArray(parsed.containers)) {
            return {
              success: false,
              error: 'Invalid JSON structure: missing stocks or containers array.',
            };
          }
          set({
            clients: parsed.clients || DEFAULT_CLIENTS,
            stocks: parsed.stocks,
            roads: parsed.roads || [],
            fences: parsed.fences || [],
            props: parsed.props || [],
            containers: parsed.containers,
            operationLogs: parsed.operationLogs || [],
            cranePricePerOp: parsed.cranePricePerOp ?? 20,
            selectedContainerId: null,
            selectedInfraId: null,
          });
          return { success: true };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to parse JSON.',
          };
        }
      },
    }),
    {
      name: 'terminal-digital-twin-storage-v1',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        let next = persistedState ? { ...persistedState } : persistedState;
        if (version < 2 && next) {
          next.themeMode = 'white';
        }
        if (version < 3 && next) {
          // Ensure animated demo reachstackers with waypoints are present
          const existingProps: TerminalProp[] = Array.isArray(next.props)
            ? next.props
            : [];
          const nonReachstackers = existingProps.filter(
            (p) => p.type !== 'reachstacker'
          );
          const demoReachstackers = DEMO_PROPS.filter(
            (p) => p.type === 'reachstacker'
          );
          next.props = [...nonReachstackers, ...demoReachstackers];
          next.recentlyViewedIds = ['c-1', 'c-11', 'c-24'];
        }
        return next;
      },
      partialize: (state) => ({
        themeMode: state.themeMode,
        recentlyViewedIds: state.recentlyViewedIds,
        clients: state.clients,
        stocks: state.stocks,
        roads: state.roads,
        fences: state.fences,
        props: state.props,
        containers: state.containers,
        operationLogs: state.operationLogs,
        cranePricePerOp: state.cranePricePerOp,
      }),
    }
  )
);
