import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  DollarSign,
  Layers,
  PackagePlus,
  RefreshCw,
  Snowflake,
  X,
} from 'lucide-react';
import { useTerminalStore, ValidSlot } from '../../store/useTerminalStore';
import { ContainerIsoType, ISO_TYPE_SPECS } from '../../types/terminal';

const ISO_TYPES: ContainerIsoType[] = [
  '20DC',
  '40DC',
  '40HC',
  '20RF',
  '40HCRF',
  '20FR',
  '40FR',
];

const EMPTY_SLOTS: ValidSlot[] = [];

function generateIsoNumber(prefix: string): string {
  const digits = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix.padEnd(4, 'U').slice(0, 4)}${digits}`;
}

export const ContainerActionModal: React.FC = () => {
  const isDropOffModalOpen = useTerminalStore((s) => s.isDropOffModalOpen);
  const dropOffPreselectStockId = useTerminalStore((s) => s.dropOffPreselectStockId);
  const closeDropOffModal = useTerminalStore((s) => s.closeDropOffModal);

  const pendingExtraction = useTerminalStore((s) => s.pendingExtraction);
  const setPendingExtraction = useTerminalStore((s) => s.setPendingExtraction);

  const clients = useTerminalStore((s) => s.clients);
  const stocks = useTerminalStore((s) => s.stocks);
  const containers = useTerminalStore((s) => s.containers);
  const cranePricePerOp = useTerminalStore((s) => s.cranePricePerOp);
  const setCranePricePerOp = useTerminalStore((s) => s.setCranePricePerOp);

  const findValidSlots = useTerminalStore((s) => s.findValidSlots);
  const dropOffContainer = useTerminalStore((s) => s.dropOffContainer);
  const getBlockingContainers = useTerminalStore((s) => s.getBlockingContainers);
  const confirmContainerAction = useTerminalStore((s) => s.confirmContainerAction);

  // Drop-off form state
  const [ownerId, setOwnerId] = useState(clients[0]?.id || 'msc');
  const [isoType, setIsoType] = useState<ContainerIsoType>('40HC');
  const [containerNumber, setContainerNumber] = useState('MSCU4920184');
  const [stockId, setStockId] = useState(stocks[0]?.id || '');
  const [selectedSlotKey, setSelectedSlotKey] = useState('');
  const [weightTons, setWeightTons] = useState(22.5);
  const [temperatureC, setTemperatureC] = useState(-18);
  const [cargoNotes, setCargoNotes] = useState('General Freight');
  const [dropError, setDropError] = useState<string | null>(null);

  // Extraction / Move state
  const [editableRate, setEditableRate] = useState<number>(cranePricePerOp);
  const [moveDestStockId, setMoveDestStockId] = useState<string>('');
  const [moveDestSlotKey, setMoveDestSlotKey] = useState<string>('');

  // Sync preselected stock when Drop-Off modal opens
  useEffect(() => {
    if (!isDropOffModalOpen) return;
    const initialStock = dropOffPreselectStockId || stocks[0]?.id || '';
    setStockId(initialStock);
    const client = clients.find((c) => c.id === ownerId) || clients[0];
    if (client) {
      setContainerNumber(generateIsoNumber(client.codePrefix));
    }
    setDropError(null);
  }, [isDropOffModalOpen, dropOffPreselectStockId]);

  // Available valid slots for Drop-Off (only computed while Drop-Off modal is open)
  const validDropSlots = useMemo(() => {
    if (!isDropOffModalOpen || !stockId) return EMPTY_SLOTS;
    return findValidSlots(stockId, isoType);
  }, [isDropOffModalOpen, stockId, isoType, containers, stocks, findValidSlots]);

  useEffect(() => {
    if (!isDropOffModalOpen) return;
    if (validDropSlots.length > 0) {
      const first = validDropSlots[0];
      setSelectedSlotKey(`${first.bay}-${first.row}-${first.tier}`);
    } else {
      setSelectedSlotKey('');
    }
  }, [isDropOffModalOpen, validDropSlots]);

  // Sync extraction modal state
  useEffect(() => {
    if (!pendingExtraction) return;
    setEditableRate(cranePricePerOp);
    const target = containers.find((c) => c.id === pendingExtraction.containerId);
    const defaultDestStock =
      pendingExtraction.targetStockId ||
      stocks.find((s) => s.id !== target?.stockId)?.id ||
      stocks[0]?.id ||
      '';
    setMoveDestStockId(defaultDestStock);
  }, [pendingExtraction, cranePricePerOp]);

  // Valid slots if moving a container
  const targetContainer = pendingExtraction
    ? containers.find((c) => c.id === pendingExtraction.containerId)
    : null;

  const validMoveSlots = useMemo(() => {
    if (
      !pendingExtraction ||
      pendingExtraction.actionType !== 'move' ||
      !targetContainer ||
      !moveDestStockId
    ) {
      return EMPTY_SLOTS;
    }
    return findValidSlots(
      moveDestStockId,
      targetContainer.isoType,
      targetContainer.id
    );
  }, [pendingExtraction, targetContainer, moveDestStockId, containers, findValidSlots]);

  useEffect(() => {
    if (!pendingExtraction || pendingExtraction.actionType !== 'move') return;
    if (validMoveSlots.length > 0) {
      const first = validMoveSlots[0];
      setMoveDestSlotKey(`${first.bay}-${first.row}-${first.tier}`);
    } else {
      setMoveDestSlotKey('');
    }
  }, [pendingExtraction, validMoveSlots]);

  // ---------------------------------------------------------------------------
  // 1. RENDER DROP-OFF MODAL
  // ---------------------------------------------------------------------------
  if (isDropOffModalOpen) {
    const spec = ISO_TYPE_SPECS[isoType];

    const handleOwnerChange = (newOwnerId: string) => {
      setOwnerId(newOwnerId);
      const cl = clients.find((c) => c.id === newOwnerId);
      if (cl) {
        setContainerNumber(generateIsoNumber(cl.codePrefix));
      }
    };

    const handleSubmitDropOff = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSlotKey) {
        setDropError(
          'No valid slot available in this Stock for the chosen ISO container size (check 20ft/40ft bay support or max tiers).'
        );
        return;
      }
      const [bay, row, tier] = selectedSlotKey.split('-').map(Number);
      const res = dropOffContainer({
        containerNumber,
        isoType,
        ownerId,
        stockId,
        bay,
        row,
        tier,
        weightTons,
        temperatureC: spec.isReefer ? temperatureC : undefined,
        cargoNotes,
      });
      if (!res.success) {
        setDropError(res.error || 'Failed to place container.');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl bg-[#11192c] border border-slate-700 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/70">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-sky-400" />
              <h2 className="text-sm font-bold text-white">
                Drop Off Container (Gate-In & Stock Placement)
              </h2>
            </div>
            <button
              onClick={closeDropOffModal}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitDropOff} className="p-5 space-y-4 text-xs">
            {dropError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs">
                {dropError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Client / Shipping Line
                </label>
                <select
                  value={ownerId}
                  onChange={(e) => handleOwnerChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  {clients.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name} ({cl.codePrefix})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Container Number (ISO 6346)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={containerNumber}
                    onChange={(e) => setContainerNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono font-bold text-white uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cl = clients.find((c) => c.id === ownerId);
                      setContainerNumber(generateIsoNumber(cl?.codePrefix || 'CSQU'));
                    }}
                    className="px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    title="Generate random ISO number"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ISO Container Type Selector */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">
                ISO Container Type (20ft / 40ft • Dry, High Cube, Reefer, Flatrack)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {ISO_TYPES.map((t) => {
                  const s = ISO_TYPE_SPECS[t];
                  const active = isoType === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setIsoType(t)}
                      className={`p-2 rounded-xl border text-left transition ${
                        active
                          ? 'bg-sky-500/20 border-sky-400 text-white shadow'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs flex items-center justify-between">
                        <span>{t}</span>
                        {s.isReefer && <Snowflake className="w-3 h-3 text-cyan-400" />}
                        {s.isFlatrack && <Layers className="w-3 h-3 text-amber-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {s.lengthFt}ft • {s.heightM}m
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Stock & Valid Slot (Bay-Row-Tier up to 6) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Target Stock Space
                </label>
                <select
                  value={stockId}
                  onChange={(e) => setStockId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  {stocks.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} (Max {st.maxTiers} Tiers)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Available Slot (Bay-Row-Tier ≤6)
                </label>
                <select
                  value={selectedSlotKey}
                  onChange={(e) => setSelectedSlotKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sky-300"
                >
                  {validDropSlots.length === 0 ? (
                    <option value="">No valid slots for {isoType}</option>
                  ) : (
                    validDropSlots.map((sl) => (
                      <option
                        key={`${sl.bay}-${sl.row}-${sl.tier}`}
                        value={`${sl.bay}-${sl.row}-${sl.tier}`}
                      >
                        Bay {sl.bay} • Row {sl.row} • Tier {sl.tier}{' '}
                        {sl.tier > 1 ? `(Stacked Lvl ${sl.tier})` : '(Ground)'}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Gross Weight (t)
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={2}
                  max={45}
                  value={weightTons}
                  onChange={(e) => setWeightTons(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              {spec.isReefer && (
                <div>
                  <label className="block text-cyan-400 mb-1 font-medium">
                    Reefer Temp (°C)
                  </label>
                  <input
                    type="number"
                    step={1}
                    min={-35}
                    max={25}
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 font-mono"
                  />
                </div>
              )}

              <div className={spec.isReefer ? 'col-span-1' : 'col-span-2'}>
                <label className="block text-slate-400 mb-1 font-medium">
                  Cargo / Notes
                </label>
                <input
                  type="text"
                  value={cargoNotes}
                  onChange={(e) => setCargoNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400">
                Gate-In Crane Placement Fee (1 crane operation):
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ${cranePricePerOp} USD
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeDropOffModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedSlotKey}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold shadow-lg shadow-sky-500/20"
              >
                Place Container in 3D Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. RENDER BURIED CONTAINER CRANE OPERATIONS & COST CALCULATOR MODAL
  // ---------------------------------------------------------------------------
  if (pendingExtraction && targetContainer) {
    const blocking = getBlockingContainers(targetContainer.id);
    const isBuried = blocking.length > 0;
    const stock = stocks.find((s) => s.id === targetContainer.stockId);
    const owner = clients.find((c) => c.id === targetContainer.ownerId);

    // Crane Operations math:
    // Each blocking container on top requires 2 crane operations:
    //   1 op to lift & place it nearby + 1 op to lift & place it back into the stack
    const placeNearOps = blocking.length;
    const placeBackOps = blocking.length;
    const rehandleTotalOps = placeNearOps + placeBackOps; // 2 * N
    const rehandleCostUsd = rehandleTotalOps * editableRate;

    // Plus 1 operation for the target container itself (pick up / release / move)
    const targetContainerOp = 1;
    const grandTotalOps = rehandleTotalOps + targetContainerOp;
    const grandTotalCostUsd = grandTotalOps * editableRate;

    const actionTitleMap = {
      release: 'Release Container (Gate-Out)',
      pick_up: 'Pick Up Container (Truck Loading)',
      move: 'Move / Restack Container',
      repair: 'Transfer Container to Repair Shop',
    };

    const handleConfirm = () => {
      setCranePricePerOp(editableRate);
      let chosenMoveSlot: ValidSlot | undefined;
      if (pendingExtraction.actionType === 'move' && moveDestSlotKey) {
        const [bay, row, tier] = moveDestSlotKey.split('-').map(Number);
        chosenMoveSlot = {
          stockId: moveDestStockId,
          bay,
          row,
          tier,
        };
      }
      confirmContainerAction(
        targetContainer.id,
        pendingExtraction.actionType,
        editableRate,
        chosenMoveSlot
      );
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <div className="w-full max-w-xl rounded-2xl bg-[#11192c] border border-slate-700 shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${
              isBuried
                ? 'bg-amber-500/15 border-amber-500/30'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isBuried ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Calculator className="w-5 h-5 text-sky-400 shrink-0" />
              )}
              <div>
                <h2 className="text-sm font-bold text-white">
                  {isBuried
                    ? 'Buried Container Alert — Extra Crane Operations Required'
                    : actionTitleMap[pendingExtraction.actionType]}
                </h2>
                <p className="text-[11px] text-slate-300">
                  Target: <span className="font-mono font-bold text-sky-400">{targetContainer.containerNumber}</span> ({targetContainer.isoType} • {owner?.name}) at {stock?.name} [Bay {targetContainer.bay}, Row {targetContainer.row}, Tier {targetContainer.tier}]
                </p>
              </div>
            </div>
            <button
              onClick={() => setPendingExtraction(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Buried Explanation Message */}
            {isBuried ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-100 space-y-2">
                <div className="font-bold text-amber-300 text-xs">
                  ⚠️ This container is buried at Tier {targetContainer.tier} with{' '}
                  {blocking.length} container(s) stacked on top of it!
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  To extract <span className="font-mono font-bold">{targetContainer.containerNumber}</span>, the crane must first lift each blocking container to a temporary nearby slot and then place it back into the stack after extraction (<strong>2 crane operations per blocking container</strong>).
                </p>

                {/* List of Blocking Containers */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">
                    Blocking Containers to Shift Nearby & Place Back (Top-Down Order):
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {blocking.map((b, idx) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/30 font-mono text-[11px]"
                      >
                        <span className="text-white font-bold">
                          {idx + 1}. {b.containerNumber}{' '}
                          <span className="text-slate-400 font-normal">
                            ({b.isoType} • Tier {b.tier})
                          </span>
                        </span>
                        <span className="text-amber-300 font-semibold">
                          2 ops (place near + place back) = ${2 * editableRate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  This container is on the top tier (no blocking containers above it). Only <strong>1 direct crane operation</strong> is needed.
                </span>
              </div>
            )}

            {/* If Move Action, select Destination Stock & Slot */}
            {pendingExtraction.actionType === 'move' && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-2.5">
                <div className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">
                  Select New Destination Stock & Slot
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Destination Stock
                    </label>
                    <select
                      value={moveDestStockId}
                      onChange={(e) => setMoveDestStockId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                    >
                      {stocks.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Destination Slot (Bay-Row-Tier)
                    </label>
                    <select
                      value={moveDestSlotKey}
                      onChange={(e) => setMoveDestSlotKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-sky-300"
                    >
                      {validMoveSlots.map((sl) => (
                        <option
                          key={`${sl.bay}-${sl.row}-${sl.tier}`}
                          value={`${sl.bay}-${sl.row}-${sl.tier}`}
                        >
                          Bay {sl.bay} • Row {sl.row} • Tier {sl.tier}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Editable Price per Crane Operation & Full Cost Breakdown Table */}
            <div className="rounded-xl bg-slate-900 border border-slate-700/90 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Price per Crane Operation (Modifiable)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Default is $20 per crane lift. Adjust below to recalculate total cost:
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editableRate}
                    onChange={(e) =>
                      setEditableRate(Math.max(0, Number(e.target.value)))
                    }
                    className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-sky-500/60 font-mono font-bold text-sm text-emerald-300 text-right focus:outline-none focus:border-sky-400"
                  />
                  <span className="text-slate-400 text-[11px]">/ op</span>
                </div>
              </div>

              {/* Itemized Crane Operations Calculation */}
              <div className="space-y-1.5 text-xs">
                {isBuried && (
                  <>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>
                        1. Move {blocking.length} blocking container(s) to nearby slot ({placeNearOps} op{placeNearOps > 1 ? 's' : ''} × ${editableRate})
                      </span>
                      <span className="font-mono font-semibold text-amber-300">
                        ${placeNearOps * editableRate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>
                        2. Place {blocking.length} blocking container(s) back into stack ({placeBackOps} op{placeBackOps > 1 ? 's' : ''} × ${editableRate})
                      </span>
                      <span className="font-mono font-semibold text-amber-300">
                        ${placeBackOps * editableRate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 font-semibold">
                      <span>
                        Subtotal Re-handling Operations ({rehandleTotalOps} crane ops):
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        ${rehandleCostUsd} USD
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-slate-300 pt-1">
                  <span>
                    {isBuried ? '3.' : '1.'} Target container ({targetContainer.containerNumber}) {pendingExtraction.actionType.replace('_', ' ')} lift (1 op × ${editableRate})
                  </span>
                  <span className="font-mono font-semibold text-sky-300">
                    ${targetContainerOp * editableRate}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-sm font-bold text-white">
                  <span>
                    Total Crane Operations ({grandTotalOps} op{grandTotalOps > 1 ? 's' : ''}):
                  </span>
                  <span className="font-mono text-base text-emerald-400">
                    ${grandTotalCostUsd} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingExtraction(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-slate-950 shadow-lg transition ${
                  isBuried
                    ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/20'
                    : 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
                }`}
              >
                <span>
                  Confirm {grandTotalOps} Crane Op{grandTotalOps > 1 ? 's' : ''} (${grandTotalCostUsd})
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
